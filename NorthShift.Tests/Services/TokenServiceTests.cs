using Microsoft.Extensions.Configuration;
using NorthShift.Api.Models;
using NorthShift.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;

namespace NorthShift.Tests.Services;

public class TokenServiceTests
{
    private readonly TokenService _service;

    public TokenServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test-secret-key-that-is-at-least-32-characters-long!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["Jwt:ExpiryHours"] = "24",
            })
            .Build();

        _service = new TokenService(config);
    }

    [Fact]
    public void GenerateToken_Admin_AssignsAdminRole()
    {
        var user = new Admin { Id = Guid.NewGuid(), Name = "Sami", Email = "sami@northshift.ca" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Equal("Admin", GetClaim(jwt, ClaimTypes.Role));
    }

    [Fact]
    public void GenerateToken_AccountManager_AssignsAccountManagerRole()
    {
        var user = new AccountManager { Id = Guid.NewGuid(), OrgId = Guid.NewGuid(), Name = "Manager", Email = "mgr@example.com" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Equal("AccountManager", GetClaim(jwt, ClaimTypes.Role));
    }

    [Fact]
    public void GenerateToken_Recruiter_AssignsRecruiterRole()
    {
        var user = new Recruiter { Id = Guid.NewGuid(), OrgId = Guid.NewGuid(), Name = "Recruiter", Email = "rec@example.com" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Equal("Recruiter", GetClaim(jwt, ClaimTypes.Role));
    }

    [Fact]
    public void GenerateToken_OrgUser_IncludesOrgIdClaim()
    {
        var orgId = Guid.NewGuid();
        var user = new AccountManager { Id = Guid.NewGuid(), OrgId = orgId, Name = "Manager", Email = "mgr@example.com" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Equal(orgId.ToString(), GetClaim(jwt, "org_id"));
    }

    [Fact]
    public void GenerateToken_Admin_DoesNotIncludeOrgIdClaim()
    {
        var user = new Admin { Id = Guid.NewGuid(), Name = "Sami", Email = "sami@northshift.ca" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Null(jwt.Claims.FirstOrDefault(c => c.Type == "org_id"));
    }

    [Fact]
    public void GenerateToken_IncludesEmailClaim()
    {
        var user = new Admin { Id = Guid.NewGuid(), Name = "Sami", Email = "sami@northshift.ca" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Equal("sami@northshift.ca", GetClaim(jwt, ClaimTypes.Email));
    }

    [Fact]
    public void GenerateToken_IncludesNameClaim()
    {
        var user = new Admin { Id = Guid.NewGuid(), Name = "Sami Admin", Email = "sami@northshift.ca" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Equal("Sami Admin", GetClaim(jwt, ClaimTypes.Name));
    }

    [Fact]
    public void GenerateToken_IncludesUserIdClaim()
    {
        var userId = Guid.NewGuid();
        var user = new Admin { Id = userId, Name = "Sami", Email = "sami@northshift.ca" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Equal(userId.ToString(), GetClaim(jwt, ClaimTypes.NameIdentifier));
    }

    [Fact]
    public void GenerateToken_ExpiresApproximately24HoursFromNow()
    {
        var user = new Admin { Id = Guid.NewGuid(), Name = "Sami", Email = "sami@northshift.ca" };
        var before = DateTime.UtcNow.AddHours(23.9);

        var jwt = ParseToken(_service.GenerateToken(user));

        var after = DateTime.UtcNow.AddHours(24.1);
        Assert.True(jwt.ValidTo >= before && jwt.ValidTo <= after);
    }

    [Fact]
    public void GenerateToken_UsesConfiguredIssuerAndAudience()
    {
        var user = new Admin { Id = Guid.NewGuid(), Name = "Sami", Email = "sami@northshift.ca" };

        var jwt = ParseToken(_service.GenerateToken(user));

        Assert.Equal("test-issuer", jwt.Issuer);
        Assert.Contains("test-audience", jwt.Audiences);
    }

    [Fact]
    public void GenerateToken_CustomExpiryHours_IsRespected()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test-secret-key-that-is-at-least-32-characters-long!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["Jwt:ExpiryHours"] = "48",
            })
            .Build();
        var service = new TokenService(config);
        var user = new Admin { Id = Guid.NewGuid(), Name = "Sami", Email = "sami@northshift.ca" };
        var before = DateTime.UtcNow.AddHours(47.9);

        var jwt = ParseToken(service.GenerateToken(user));

        var after = DateTime.UtcNow.AddHours(48.1);
        Assert.True(jwt.ValidTo >= before && jwt.ValidTo <= after);
    }

    private static JwtSecurityToken ParseToken(string token) =>
        new JwtSecurityTokenHandler().ReadJwtToken(token);

    private static string? GetClaim(JwtSecurityToken jwt, string type) =>
        jwt.Claims.FirstOrDefault(c => c.Type == type)?.Value;
}
