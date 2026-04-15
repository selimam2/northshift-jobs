using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NorthShift.Api.Data;
using NorthShift.Api.Services;
using Resend;
using Stripe;
using TokenService = NorthShift.Api.Services.TokenService;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// DataProtection — keys stored in their own table to avoid circular dependency with AppDbContext
builder.Services.AddDbContext<DataProtectionDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDataProtection()
    .PersistKeysToDbContext<DataProtectionDbContext>()
    .SetApplicationName("NorthShift");

builder.Services.AddScoped<EncryptionService>();

// JWT Auth
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Stripe
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

// AWS
var awsRegion = builder.Configuration["AWS:Region"] ?? "us-east-1";
builder.Services.AddSingleton<IAmazonS3>(_ =>
    new AmazonS3Client(Amazon.RegionEndpoint.GetBySystemName(awsRegion)));
builder.Services.AddScoped<S3Service>();

// Services
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<StripeService>();
builder.Services.AddOptions<ResendClientOptions>().Configure(options =>
    options.ApiToken = builder.Configuration["Resend:ApiKey"] ?? string.Empty);
builder.Services.AddHttpClient<IResend, ResendClient>();

// CORS — allow Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
            builder.Configuration["Frontend:Url"] ?? "http://localhost:3000",
            "http://192.168.40.136:3000"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Always run migrations on startup (idempotent)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var dpDb = scope.ServiceProvider.GetRequiredService<DataProtectionDbContext>();
    dpDb.Database.Migrate();

    if (app.Environment.IsProduction())
        await NorthShift.Api.Data.DemoSeeder.SeedAsync(db);

    // Ensure sami@northshift.ca is an Admin
    await db.Database.ExecuteSqlRawAsync(
        "UPDATE \"Users\" SET \"UserType\" = 'Admin', \"OrgId\" = NULL WHERE \"Email\" = 'sami@northshift.ca' AND \"UserType\" != 'Admin'");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
