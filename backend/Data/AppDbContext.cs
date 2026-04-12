using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Models;

namespace NorthShift.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<Licence> Licences => Set<Licence>();
    public DbSet<ApplicationNote> ApplicationNotes => Set<ApplicationNote>();
    public DbSet<ApplicationStatusLog> ApplicationStatusLogs => Set<ApplicationStatusLog>();
    public DbSet<AlertSubscription> AlertSubscriptions => Set<AlertSubscription>();
    public DbSet<NurseEmailConsent> NurseEmailConsents => Set<NurseEmailConsent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Users (TPH) ──────────────────────────────────────────────────────
        modelBuilder.Entity<AppUser>()
            .HasDiscriminator<string>("UserType")
            .HasValue<Admin>("Admin")
            .HasValue<AccountManager>("AccountManager")
            .HasValue<Recruiter>("Recruiter");

        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Recruiter>()
            .Property(r => r.Permissions)
            .HasConversion<int>();

        // ── Organization ─────────────────────────────────────────────────────
        modelBuilder.Entity<Organization>()
            .Property(o => o.Tier)
            .HasConversion<string>();

        modelBuilder.Entity<Organization>()
            .Property(o => o.SubscriptionStatus)
            .HasConversion<string>();

        modelBuilder.Entity<Organization>()
            .HasMany(o => o.Users)
            .WithOne(u => u.Org)
            .HasForeignKey(u => u.OrgId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Organization>()
            .HasMany(o => o.Listings)
            .WithOne(l => l.Org)
            .HasForeignKey(l => l.OrgId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Listing ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Listing>()
            .HasIndex(l => l.Slug)
            .IsUnique();

        modelBuilder.Entity<Listing>()
            .Property(l => l.PayMin)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Listing>()
            .Property(l => l.PayMax)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Listing>()
            .Property(l => l.Province)
            .HasConversion<string>();

        modelBuilder.Entity<Listing>()
            .Property(l => l.RoleTypes)
            .HasConversion(
                v => string.Join(',', v.Select(r => r.ToString())),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Select(Enum.Parse<RoleType>).ToList()
            )
            .Metadata.SetValueComparer(
                new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<ICollection<RoleType>>(
                    (a, b) => a!.SequenceEqual(b!),
                    v => v.Aggregate(0, (a, r) => HashCode.Combine(a, r.GetHashCode())),
                    v => v.ToList()
                )
            );

        modelBuilder.Entity<Listing>()
            .Property(l => l.Language)
            .HasConversion<string>();

        modelBuilder.Entity<Listing>()
            .Property(l => l.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Listing>()
            .HasOne(l => l.PostedBy)
            .WithMany()
            .HasForeignKey(l => l.PostedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Application ───────────────────────────────────────────────────────
        modelBuilder.Entity<Application>()
            .Property(a => a.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Application>()
            .HasOne(a => a.AssignedTo)
            .WithMany()
            .HasForeignKey(a => a.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Licence (composite PK) ────────────────────────────────────────────
        modelBuilder.Entity<Licence>()
            .HasKey(l => new { l.ApplicationId, l.Province });

        modelBuilder.Entity<Licence>()
            .Property(l => l.Province)
            .HasConversion<string>();

        modelBuilder.Entity<Application>()
            .HasMany(a => a.Licences)
            .WithOne()
            .HasForeignKey(l => l.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── ApplicationNote ───────────────────────────────────────────────────
        modelBuilder.Entity<ApplicationNote>()
            .HasOne(n => n.WrittenBy)
            .WithMany()
            .HasForeignKey(n => n.WrittenByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ApplicationNote>()
            .HasOne(n => n.Application)
            .WithMany(a => a.Notes)
            .HasForeignKey(n => n.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── ApplicationStatusLog ──────────────────────────────────────────────
        modelBuilder.Entity<ApplicationStatusLog>()
            .Property(l => l.FromStatus)
            .HasConversion<string>();

        modelBuilder.Entity<ApplicationStatusLog>()
            .Property(l => l.ToStatus)
            .HasConversion<string>();

        modelBuilder.Entity<ApplicationStatusLog>()
            .HasOne(l => l.ChangedBy)
            .WithMany()
            .HasForeignKey(l => l.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ApplicationStatusLog>()
            .HasOne(l => l.Application)
            .WithMany(a => a.StatusLogs)
            .HasForeignKey(l => l.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── AlertSubscription ─────────────────────────────────────────────────
        modelBuilder.Entity<AlertSubscription>()
            .Property(a => a.LanguagePref)
            .HasConversion<string>();

        modelBuilder.Entity<AlertSubscription>()
            .Property(a => a.Provinces)
            .HasConversion(
                v => v == null ? null : string.Join(',', v.Select(p => p.ToString())),
                v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Select(Enum.Parse<Province>).ToList()
            );

        modelBuilder.Entity<AlertSubscription>()
            .Property(a => a.RoleTypes)
            .HasConversion(
                v => v == null ? null : string.Join(',', v.Select(r => r.ToString())),
                v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Select(Enum.Parse<RoleType>).ToList()
            );

        modelBuilder.Entity<AlertSubscription>()
            .Property(a => a.Languages)
            .HasConversion(
                v => v == null ? null : string.Join(',', v.Select(l => l.ToString())),
                v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Select(Enum.Parse<ListingLanguage>).ToList()
            );

        modelBuilder.Entity<AlertSubscription>()
            .Property(a => a.ContractLengths)
            .HasConversion(
                v => v == null ? null : string.Join('|', v),
                v => v == null ? null : v.Split('|', StringSplitOptions.RemoveEmptyEntries).ToList()
            );

        // ── NurseEmailConsent ─────────────────────────────────────────────────
        modelBuilder.Entity<NurseEmailConsent>()
            .HasIndex(n => n.Email);
    }
}
