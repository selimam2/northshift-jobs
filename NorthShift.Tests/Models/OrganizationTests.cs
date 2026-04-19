using NorthShift.Api.Models;
using Xunit;

namespace NorthShift.Tests.Models;

public class OrganizationTests
{
    [Theory]
    [InlineData(SubscriptionTier.Small, 3)]
    [InlineData(SubscriptionTier.Medium, 10)]
    [InlineData(SubscriptionTier.Large, int.MaxValue)]
    public void ListingQuota_ReturnsCorrectValuePerTier(SubscriptionTier tier, int expected)
    {
        var org = new Organization { Tier = tier };
        Assert.Equal(expected, org.ListingQuota);
    }

    [Theory]
    [InlineData(SubscriptionTier.Small, 1)]
    [InlineData(SubscriptionTier.Medium, 3)]
    [InlineData(SubscriptionTier.Large, int.MaxValue)]
    public void RecruiterQuota_ReturnsCorrectValuePerTier(SubscriptionTier tier, int expected)
    {
        var org = new Organization { Tier = tier };
        Assert.Equal(expected, org.RecruiterQuota);
    }

    [Theory]
    [InlineData(SubscriptionTier.Small, 0)]
    [InlineData(SubscriptionTier.Medium, 0)]
    [InlineData(SubscriptionTier.Large, 2)]
    public void FeaturedListingSlots_OnlyLargeTierHasSlots(SubscriptionTier tier, int expected)
    {
        var org = new Organization { Tier = tier };
        Assert.Equal(expected, org.FeaturedListingSlots);
    }

    [Fact]
    public void NewOrganization_DefaultsToSmallTierAndNoneStatus()
    {
        var org = new Organization { Name = "Test Org" };
        Assert.Equal(SubscriptionTier.Small, org.Tier);
        Assert.Equal(SubscriptionStatus.None, org.SubscriptionStatus);
    }

    [Fact]
    public void ListingQuota_SmallTier_CanBeSaturated()
    {
        var org = new Organization { Tier = SubscriptionTier.Small };
        // Simulate 3 active listings — at quota
        Assert.True(3 >= org.ListingQuota);
        // 2 active listings — under quota
        Assert.False(2 >= org.ListingQuota);
    }
}
