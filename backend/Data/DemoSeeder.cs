using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NorthShift.Api.Models;

namespace NorthShift.Api.Data;

public static class DemoSeeder
{
    /// <summary>
    /// Seeds the initial admin account. No-op unless both Seed:AdminEmail and
    /// Seed:AdminPassword are configured, so a deployment that does not set them
    /// never creates a login.
    /// </summary>
    public static async Task SeedAdminAsync(AppDbContext db, IConfiguration config)
    {
        var email    = config["Seed:AdminEmail"];
        var password = config["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) return;

        if (await db.Set<Admin>().AnyAsync(u => u.Email == email)) return;

        db.Set<Admin>().Add(new Admin
        {
            Name         = config["Seed:AdminName"] ?? "Administrator",
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        });
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds demonstration content for local development. No-op unless
    /// Seed:DemoPassword is configured.
    /// </summary>
    public static async Task SeedAsync(AppDbContext db, IConfiguration config)
    {
        var demoPassword = config["Seed:DemoPassword"];
        if (string.IsNullOrWhiteSpace(demoPassword)) return;

        // Only seed if no listings exist yet
        if (await db.Listings.AnyAsync()) return;

        // ── Demo org ──────────────────────────────────────────────────────────
        var org = new Organization
        {
            Id           = Guid.NewGuid(),
            Name         = "Northern Health Staffing",
            Tier         = SubscriptionTier.Large,
            SubscriptionStatus = SubscriptionStatus.Active,
        };
        db.Organizations.Add(org);

        var orgFr = new Organization
        {
            Id           = Guid.NewGuid(),
            Name         = "Agence Soins Nordiques",
            Tier         = SubscriptionTier.Medium,
            SubscriptionStatus = SubscriptionStatus.Active,
        };
        db.Organizations.Add(orgFr);

        // ── Demo account manager ──────────────────────────────────────────────
        var manager = new AccountManager
        {
            Id           = Guid.NewGuid(),
            Name         = "Alex Turner",
            Email        = "demo@northhealthstaffing.ca",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(demoPassword),
            OrgId        = org.Id,
        };
        db.Set<AccountManager>().Add(manager);

        var managerFr = new AccountManager
        {
            Id           = Guid.NewGuid(),
            Name         = "Marie Tremblay",
            Email        = "marie@soinsnordiques.ca",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(demoPassword),
            OrgId        = orgFr.Id,
        };
        db.Set<AccountManager>().Add(managerFr);

        // ── Test recruiter ────────────────────────────────────────────────────
        var recruiter = new Recruiter
        {
            Id           = Guid.NewGuid(),
            Name         = "Test Recruiter",
            Email        = "recruiter@northhealthstaffing.ca",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(demoPassword),
            OrgId        = org.Id,
            Permissions  = RecruiterPermissions.ViewAllApplications | RecruiterPermissions.ManageAllListings,
        };
        db.Set<Recruiter>().Add(recruiter);

        // ── Listings ──────────────────────────────────────────────────────────
        var listings = new List<Listing>
        {
            new()
            {
                Slug        = "rn-12-weeks-fort-mcmurray-ab",
                TitleEn     = "RN – 12-Week Contract",
                DescriptionEn =
                    "We are seeking a Registered Nurse for a 12-week contract at our Fort McMurray acute care facility. " +
                    "You'll work in the medical-surgical unit supporting a diverse and growing community. " +
                    "The role offers competitive pay, free single-occupancy housing, and return flights covered. " +
                    "CARNA registration required. Northern allowance included.",
                Language    = ListingLanguage.English,
                RoleTypes   = new List<RoleType> { RoleType.RN },
                Province    = Province.AB,
                Community   = "Fort McMurray",
                ContractLength = "12 weeks",
                StartDate   = DateTime.UtcNow.AddDays(30),
                PayMin      = 52m,
                PayMax      = 62m,
                HousingProvided = true,
                TravelCovered   = true,
                Status      = ListingStatus.Active,
                Featured    = true,
                OrgId       = org.Id,
                PostedByUserId = manager.Id,
                ExpiresAt   = DateTime.UtcNow.AddDays(60),
            },
            new()
            {
                Slug        = "lpn-8-weeks-thompson-mb",
                TitleEn     = "LPN – Remote Community – Thompson",
                DescriptionEn =
                    "Join our team in Thompson, MB for an 8-week LPN contract. " +
                    "This position is based at a regional clinic serving Indigenous communities north of Thompson. " +
                    "Duties include wound care, medication administration, and triage. " +
                    "CLPNM in good standing required. Housing in a fully furnished staff residence is provided at no cost.",
                Language    = ListingLanguage.English,
                RoleTypes   = new List<RoleType> { RoleType.LPN },
                Province    = Province.MB,
                Community   = "Thompson",
                ContractLength = "8 weeks",
                StartDate   = DateTime.UtcNow.AddDays(14),
                PayMin      = 38m,
                PayMax      = 45m,
                HousingProvided = true,
                TravelCovered   = true,
                Status      = ListingStatus.Active,
                OrgId       = org.Id,
                PostedByUserId = manager.Id,
                ExpiresAt   = DateTime.UtcNow.AddDays(60),
            },
            new()
            {
                Slug        = "rn-np-16-weeks-yellowknife-nt",
                TitleEn     = "RN/NP – 16-Week Contract – Yellowknife",
                DescriptionEn =
                    "We have an exciting opportunity for a Registered Nurse or Nurse Practitioner in Yellowknife, NT. " +
                    "This 16-week contract supports the territorial health authority's primary care expansion program. " +
                    "NPs will have a full scope of practice including prescribing. " +
                    "RNANT/NU licence required. $3,000 signing bonus. Housing and flights covered.",
                Language    = ListingLanguage.English,
                RoleTypes   = new List<RoleType> { RoleType.RN, RoleType.NP },
                Province    = Province.NT,
                Community   = "Yellowknife",
                ContractLength = "16 weeks",
                StartDate   = DateTime.UtcNow.AddDays(21),
                PayMin      = 58m,
                PayMax      = 78m,
                HousingProvided = true,
                TravelCovered   = true,
                Status      = ListingStatus.Active,
                Featured    = true,
                OrgId       = org.Id,
                PostedByUserId = manager.Id,
                ExpiresAt   = DateTime.UtcNow.AddDays(60),
            },
            new()
            {
                Slug        = "rpn-10-weeks-prince-george-bc",
                TitleEn     = "RPN – Mental Health – Prince George",
                DescriptionEn =
                    "A 10-week contract for a Registered Psychiatric Nurse in our mental health and addictions unit in Prince George, BC. " +
                    "You will deliver therapeutic programming, crisis intervention, and collaborative care planning. " +
                    "BCRPNBC registration required. No housing provided but a generous daily per diem is included.",
                Language    = ListingLanguage.English,
                RoleTypes   = new List<RoleType> { RoleType.RPN },
                Province    = Province.BC,
                Community   = "Prince George",
                ContractLength = "10 weeks",
                StartDate   = DateTime.UtcNow.AddDays(45),
                PayMin      = 46m,
                PayMax      = 54m,
                HousingProvided = false,
                TravelCovered   = true,
                Status      = ListingStatus.Active,
                OrgId       = org.Id,
                PostedByUserId = manager.Id,
                ExpiresAt   = DateTime.UtcNow.AddDays(60),
            },
            new()
            {
                Slug        = "infirmier-12-semaines-rouyn-noranda-qc",
                TitleFr     = "Infirmier(ère) – Contrat 12 semaines – Rouyn-Noranda",
                DescriptionFr =
                    "Nous sommes à la recherche d'un(e) infirmier(ère) autorisé(e) pour un contrat de 12 semaines à Rouyn-Noranda, QC. " +
                    "Vous travaillerez dans l'unité de médecine-chirurgie du Centre de santé de l'Abitibi. " +
                    "Le poste comprend un hébergement gratuit en résidence du personnel et le remboursement des frais de déplacement. " +
                    "Membre de l'OIIQ en règle exigé. Prime nordique incluse.",
                Language    = ListingLanguage.French,
                RoleTypes   = new List<RoleType> { RoleType.RN },
                Province    = Province.QC,
                Community   = "Rouyn-Noranda",
                ContractLength = "12 semaines",
                StartDate   = DateTime.UtcNow.AddDays(20),
                PayMin      = 50m,
                PayMax      = 60m,
                HousingProvided = true,
                TravelCovered   = true,
                Status      = ListingStatus.Active,
                OrgId       = orgFr.Id,
                PostedByUserId = managerFr.Id,
                ExpiresAt   = DateTime.UtcNow.AddDays(60),
            },
            new()
            {
                Slug        = "rn-infirmier-bilingual-kapuskasing-on",
                TitleEn     = "RN – Bilingual – Kapuskasing, ON",
                TitleFr     = "Infirmier(ère) bilingue – Kapuskasing, ON",
                DescriptionEn =
                    "Bilingual (EN/FR) Registered Nurse required for a 10-week contract in Kapuskasing, Ontario. " +
                    "You will serve a French-speaking majority community in an acute care and long-term care setting. " +
                    "CNO registration required. French language proficiency is mandatory. " +
                    "Furnished housing and return flights included.",
                DescriptionFr =
                    "Infirmier(ère) autorisé(e) bilingue (FR/EN) requis pour un contrat de 10 semaines à Kapuskasing, en Ontario. " +
                    "Vous servirez une communauté majoritairement francophone en soins actifs et de longue durée. " +
                    "Inscription à l'OIIO obligatoire. Maîtrise du français exigée. " +
                    "Logement meublé et vols aller-retour inclus.",
                Language    = ListingLanguage.Bilingual,
                RoleTypes   = new List<RoleType> { RoleType.RN },
                Province    = Province.ON,
                Community   = "Kapuskasing",
                ContractLength = "10 weeks",
                StartDate   = DateTime.UtcNow.AddDays(35),
                PayMin      = 48m,
                PayMax      = 58m,
                HousingProvided = true,
                TravelCovered   = true,
                Status      = ListingStatus.Active,
                OrgId       = org.Id,
                PostedByUserId = manager.Id,
                ExpiresAt   = DateTime.UtcNow.AddDays(60),
            },
            new()
            {
                Slug        = "cna-8-weeks-whitehorse-yt",
                TitleEn     = "CNA – Continuing Care – Whitehorse, YT",
                DescriptionEn =
                    "We are looking for a Certified Nursing Assistant for an 8-week continuing care contract in Whitehorse, Yukon. " +
                    "You will assist residents with activities of daily living and support the RN care team. " +
                    "YNA certification in good standing required. Staff housing available at subsidized rate.",
                Language    = ListingLanguage.English,
                RoleTypes   = new List<RoleType> { RoleType.CNA },
                Province    = Province.YT,
                Community   = "Whitehorse",
                ContractLength = "8 weeks",
                StartDate   = DateTime.UtcNow.AddDays(10),
                PayMin      = 28m,
                PayMax      = 34m,
                HousingProvided = true,
                TravelCovered   = false,
                Status      = ListingStatus.Active,
                OrgId       = org.Id,
                PostedByUserId = manager.Id,
                ExpiresAt   = DateTime.UtcNow.AddDays(60),
            },
            new()
            {
                Slug        = "rn-20-weeks-iqaluit-nu",
                TitleEn     = "RN – Extended Contract – Iqaluit, NU",
                DescriptionEn =
                    "Extended 20-week contract for a Registered Nurse at Qikiqtani General Hospital in Iqaluit, Nunavut. " +
                    "This high-impact role supports a remote territory hospital serving over 13,000 Nunavummiut. " +
                    "Emergency, maternal, and general med-surg experience preferred. " +
                    "RNANT/NU licence required. All-inclusive package: furnished housing, return flights, northern living allowance, and $5,000 completion bonus.",
                Language    = ListingLanguage.English,
                RoleTypes   = new List<RoleType> { RoleType.RN },
                Province    = Province.NU,
                Community   = "Iqaluit",
                ContractLength = "20 weeks",
                StartDate   = DateTime.UtcNow.AddDays(60),
                PayMin      = 62m,
                PayMax      = 75m,
                HousingProvided = true,
                TravelCovered   = true,
                Status      = ListingStatus.Active,
                Featured    = true,
                OrgId       = org.Id,
                PostedByUserId = manager.Id,
                ExpiresAt   = DateTime.UtcNow.AddDays(60),
            },
        };

        db.Listings.AddRange(listings);
        await db.SaveChangesAsync();
    }
}
