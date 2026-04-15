using Stripe;
using Stripe.Checkout;
using NorthShift.Api.Models;

namespace NorthShift.Api.Services;

public class StripeService(IConfiguration config)
{
    public async Task<string> CreateCustomerAsync(string orgName, string email)
    {
        var service = new CustomerService();
        var customer = await service.CreateAsync(new CustomerCreateOptions
        {
            Name = orgName,
            Email = email,
        });
        return customer.Id;
    }

    public async Task<string> CreateCheckoutSessionAsync(
        string customerId, string priceId, string successUrl, string cancelUrl)
    {
        var service = new SessionService();
        var session = await service.CreateAsync(new SessionCreateOptions
        {
            Customer = customerId,
            Mode = "subscription",
            LineItems =
            [
                new SessionLineItemOptions { Price = priceId, Quantity = 1 }
            ],
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                TrialPeriodDays = 14,
            },
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
        });
        return session.Url;
    }

    public async Task<string> CreatePortalSessionAsync(string customerId, string returnUrl)
    {
        var service = new Stripe.BillingPortal.SessionService();
        var session = await service.CreateAsync(new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = customerId,
            ReturnUrl = returnUrl,
        });
        return session.Url;
    }

    public string GetPriceId(SubscriptionTier tier, bool isAnnual)
    {
        var key = (tier, isAnnual) switch
        {
            (SubscriptionTier.Small,  false) => "Stripe:Prices:SmallMonthly",
            (SubscriptionTier.Small,  true)  => "Stripe:Prices:SmallAnnual",
            (SubscriptionTier.Medium, false) => "Stripe:Prices:MediumMonthly",
            (SubscriptionTier.Medium, true)  => "Stripe:Prices:MediumAnnual",
            (SubscriptionTier.Large,  false) => "Stripe:Prices:LargeMonthly",
            (SubscriptionTier.Large,  true)  => "Stripe:Prices:LargeAnnual",
            _ => throw new ArgumentException("Invalid tier/billing combination")
        };
        return config[key] ?? throw new InvalidOperationException($"Stripe price not configured: {key}");
    }

    public (SubscriptionTier tier, bool isAnnual) TierFromPriceId(string priceId)
    {
        if (priceId == config["Stripe:Prices:SmallMonthly"])  return (SubscriptionTier.Small,  false);
        if (priceId == config["Stripe:Prices:SmallAnnual"])   return (SubscriptionTier.Small,  true);
        if (priceId == config["Stripe:Prices:MediumMonthly"]) return (SubscriptionTier.Medium, false);
        if (priceId == config["Stripe:Prices:MediumAnnual"])  return (SubscriptionTier.Medium, true);
        if (priceId == config["Stripe:Prices:LargeMonthly"])  return (SubscriptionTier.Large,  false);
        if (priceId == config["Stripe:Prices:LargeAnnual"])   return (SubscriptionTier.Large,  true);
        return (SubscriptionTier.Small, false);
    }
}
