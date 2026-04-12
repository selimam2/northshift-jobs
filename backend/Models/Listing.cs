namespace NorthShift.Api.Models;

public enum ListingStatus { Draft, PendingApproval, Active, Expired, Closed }
public enum RoleType { RN, LPN, NP, Other }
public enum ListingLanguage { EN, FR, Both }

public class Listing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? TitleFr { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? DescriptionFr { get; set; }
    public ListingLanguage Language { get; set; } = ListingLanguage.EN;

    public ICollection<RoleType> RoleTypes { get; set; } = new List<RoleType>();
    public Province Province { get; set; }
    public string Community { get; set; } = string.Empty;
    public string ContractLength { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public decimal? PayMin { get; set; }
    public decimal? PayMax { get; set; }
    public bool HousingProvided { get; set; }
    public bool TravelCovered { get; set; }

    public ListingStatus Status { get; set; } = ListingStatus.Draft;
    public bool Featured { get; set; }

    public Guid OrgId { get; set; }
    public Guid PostedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(60);

    public Organization Org { get; set; } = null!;
    public AppUser PostedBy { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = new List<Application>();
}
