using NorthShift.Api.Models;

namespace NorthShift.Api.DTOs.Stripe;

public class CreateCheckoutSessionRequest
{
    public SubscriptionTier Tier { get; set; }
    public bool IsAnnual { get; set; }
}
