using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Models;

namespace NorthShift.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Employer> Employers => Set<Employer>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<AlertSubscription> AlertSubscriptions => Set<AlertSubscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Listing>()
            .HasIndex(l => l.Slug)
            .IsUnique();

        modelBuilder.Entity<Listing>()
            .Property(l => l.PayMin)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Listing>()
            .Property(l => l.PayMax)
            .HasPrecision(10, 2);

        modelBuilder.Entity<AlertSubscription>()
            .Property(a => a.Provinces)
            .HasColumnType("text[]");

        modelBuilder.Entity<AlertSubscription>()
            .Property(a => a.RoleTypes)
            .HasConversion(
                v => string.Join(',', v.Select(r => r.ToString())),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Select(Enum.Parse<RoleType>).ToArray()
            );

        modelBuilder.Entity<Employer>()
            .HasIndex(e => e.Email)
            .IsUnique();
    }
}
