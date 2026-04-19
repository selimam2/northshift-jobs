using Microsoft.Extensions.Configuration;
using NorthShift.Api.Models;
using NorthShift.Api.Services;
using Xunit;

namespace NorthShift.Tests.Services;

public class StripeServiceTests
{
    private readonly StripeService _service;

    private static readonly Dictionary<string, string?> PriceConfig = new()
    {
        ["Stripe:Prices:SmallMonthly"]  = "price_small_monthly",
        ["Stripe:Prices:SmallAnnual"]   = "price_small_annual",
        ["Stripe:Prices:MediumMonthly"] = "price_medium_monthly",
        ["Stripe:Prices:MediumAnnual"]  = "price_medium_annual",
        ["Stripe:Prices:LargeMonthly"]  = "price_large_monthly",
        ["Stripe:Prices:LargeAnnual"]   = "price_large_annual",
    };

    public StripeServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(PriceConfig)
            .Build();
        _service = new StripeService(config);
    }

    [Theory]
    [InlineData(SubscriptionTier.Small,  false, "price_small_monthly")]
    [InlineData(SubscriptionTier.Small,  true,  "price_small_annual")]
    [InlineData(SubscriptionTier.Medium, false, "price_medium_monthly")]
    [InlineData(SubscriptionTier.Medium, true,  "price_medium_annual")]
    [InlineData(SubscriptionTier.Large,  false, "price_large_monthly")]
    [InlineData(SubscriptionTier.Large,  true,  "price_large_annual")]
    public void GetPriceId_ReturnsConfiguredPriceForEachTierAndBillingCycle(
        SubscriptionTier tier, bool isAnnual, string expectedPrice)
    {
        var priceId = _service.GetPriceId(tier, isAnnual);

        Assert.Equal(expectedPrice, priceId);
    }

    [Fact]
    public void GetPriceId_WhenPriceNotConfigured_ThrowsInvalidOperationException()
    {
        var emptyConfig = new ConfigurationBuilder().Build();
        var service = new StripeService(emptyConfig);

        Assert.Throws<InvalidOperationException>(() => service.GetPriceId(SubscriptionTier.Small, false));
    }

    [Theory]
    [InlineData("price_small_monthly",  SubscriptionTier.Small,  false)]
    [InlineData("price_small_annual",   SubscriptionTier.Small,  true)]
    [InlineData("price_medium_monthly", SubscriptionTier.Medium, false)]
    [InlineData("price_medium_annual",  SubscriptionTier.Medium, true)]
    [InlineData("price_large_monthly",  SubscriptionTier.Large,  false)]
    [InlineData("price_large_annual",   SubscriptionTier.Large,  true)]
    public void TierFromPriceId_MapsBackToCorrectTierAndBillingCycle(
        string priceId, SubscriptionTier expectedTier, bool expectedIsAnnual)
    {
        var (tier, isAnnual) = _service.TierFromPriceId(priceId);

        Assert.Equal(expectedTier, tier);
        Assert.Equal(expectedIsAnnual, isAnnual);
    }

    [Fact]
    public void TierFromPriceId_UnknownPriceId_ReturnsFallback()
    {
        var (tier, isAnnual) = _service.TierFromPriceId("price_unknown_xyz");

        Assert.Equal(SubscriptionTier.Small, tier);
        Assert.False(isAnnual);
    }

    [Fact]
    public void GetPriceId_ThenTierFromPriceId_IsSymmetric()
    {
        foreach (var tier in Enum.GetValues<SubscriptionTier>())
        {
            foreach (var isAnnual in new[] { false, true })
            {
                var priceId = _service.GetPriceId(tier, isAnnual);
                var (roundTrippedTier, roundTrippedIsAnnual) = _service.TierFromPriceId(priceId);

                Assert.Equal(tier, roundTrippedTier);
                Assert.Equal(isAnnual, roundTrippedIsAnnual);
            }
        }
    }
}
