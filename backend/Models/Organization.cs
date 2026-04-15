namespace NorthShift.Api.Models;

public enum SubscriptionTier { Small, Medium, Large }
public enum SubscriptionStatus { None, Trialing, Active, PastDue, Cancelled }

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public SubscriptionTier Tier { get; set; } = SubscriptionTier.Small;
    public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.None;
    public bool IsAnnual { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrgUser> Users { get; set; } = new List<OrgUser>();
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();

    public int ListingQuota => Tier switch
    {
        SubscriptionTier.Small => 3,
        SubscriptionTier.Medium => 10,
        SubscriptionTier.Large => int.MaxValue,
        _ => 0
    };

    public int RecruiterQuota => Tier switch
    {
        SubscriptionTier.Small => 1,
        SubscriptionTier.Medium => 3,
        SubscriptionTier.Large => int.MaxValue,
        _ => 0
    };

    public int FeaturedListingSlots => Tier == SubscriptionTier.Large ? 2 : 0;
}
