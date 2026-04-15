using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Data;
using NorthShift.Api.DTOs.Stripe;
using NorthShift.Api.Models;
using NorthShift.Api.Services;
using Stripe;
using System.Security.Claims;

namespace NorthShift.Api.Controllers;

[ApiController]
[Route("api/stripe")]
public class StripeController(AppDbContext db, StripeService stripeService, IConfiguration config) : ControllerBase
{
    [HttpGet("billing"), Authorize(Roles = "AccountManager")]
    public async Task<IActionResult> GetBilling()
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);
        var org = await db.Organizations.FindAsync(orgId);
        if (org is null) return NotFound();

        return Ok(new
        {
            tier = org.Tier.ToString(),
            status = org.SubscriptionStatus.ToString(),
            isAnnual = org.IsAnnual,
            expiresAt = org.SubscriptionExpiresAt,
        });
    }

    [HttpPost("checkout"), Authorize(Roles = "AccountManager")]
    public async Task<IActionResult> CreateCheckout([FromBody] CreateCheckoutSessionRequest req)
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);
        var email = User.FindFirstValue(ClaimTypes.Email)!;
        var org = await db.Organizations.FindAsync(orgId);
        if (org is null) return NotFound();

        if (string.IsNullOrEmpty(org.StripeCustomerId))
        {
            org.StripeCustomerId = await stripeService.CreateCustomerAsync(org.Name, email);
            await db.SaveChangesAsync();
        }

        var priceId = stripeService.GetPriceId(req.Tier, req.IsAnnual);
        var frontendUrl = config["Frontend:Url"];
        var sessionUrl = await stripeService.CreateCheckoutSessionAsync(
            org.StripeCustomerId,
            priceId,
            $"{frontendUrl}/en/pricing/success",
            $"{frontendUrl}/en/pricing/cancelled"
        );

        return Ok(new { url = sessionUrl });
    }

    [HttpPost("portal"), Authorize(Roles = "AccountManager")]
    public async Task<IActionResult> CreatePortal()
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);
        var org = await db.Organizations.FindAsync(orgId);
        if (org is null || string.IsNullOrEmpty(org.StripeCustomerId))
            return BadRequest(new { error = "No billing account found. Please subscribe to a plan first." });

        var frontendUrl = config["Frontend:Url"];
        var portalUrl = await stripeService.CreatePortalSessionAsync(
            org.StripeCustomerId,
            $"{frontendUrl}/en/dashboard"
        );

        return Ok(new { url = portalUrl });
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var stripeSignature = Request.Headers["Stripe-Signature"].ToString();
        var webhookSecret = config["Stripe:WebhookSecret"]!;

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, webhookSecret);
        }
        catch (StripeException)
        {
            return BadRequest();
        }

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
            {
                var session = (Stripe.Checkout.Session)stripeEvent.Data.Object;
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.StripeCustomerId == session.CustomerId);
                if (org is not null)
                {
                    org.StripeSubscriptionId = session.SubscriptionId;
                    org.SubscriptionStatus = SubscriptionStatus.Trialing;
                    await db.SaveChangesAsync();
                }
                break;
            }
            case "customer.subscription.updated":
            {
                var sub = (Stripe.Subscription)stripeEvent.Data.Object;
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.StripeCustomerId == sub.CustomerId);
                if (org is not null)
                {
                    org.SubscriptionStatus = sub.Status switch
                    {
                        "active"   => SubscriptionStatus.Active,
                        "trialing" => SubscriptionStatus.Trialing,
                        "past_due" => SubscriptionStatus.PastDue,
                        "canceled" => SubscriptionStatus.Cancelled,
                        _ => org.SubscriptionStatus
                    };
                    var firstItem = sub.Items.Data.FirstOrDefault();
                    if (firstItem is not null)
                    {
                        if (firstItem.Price?.Id is { } priceId)
                            (org.Tier, org.IsAnnual) = stripeService.TierFromPriceId(priceId);
                        // CurrentPeriodEnd moved to SubscriptionItem in Stripe.net v48+
                        org.SubscriptionExpiresAt = org.SubscriptionStatus == SubscriptionStatus.Trialing
                            ? sub.TrialEnd ?? firstItem.CurrentPeriodEnd
                            : firstItem.CurrentPeriodEnd;
                    }
                    await db.SaveChangesAsync();
                }
                break;
            }
            case "customer.subscription.deleted":
            {
                var sub = (Stripe.Subscription)stripeEvent.Data.Object;
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.StripeCustomerId == sub.CustomerId);
                if (org is not null)
                {
                    org.SubscriptionStatus = SubscriptionStatus.Cancelled;
                    await db.SaveChangesAsync();
                }
                break;
            }
            case "invoice.payment_succeeded":
            {
                var invoice = (Stripe.Invoice)stripeEvent.Data.Object;
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.StripeCustomerId == invoice.CustomerId);
                if (org is not null && org.SubscriptionStatus == SubscriptionStatus.PastDue)
                {
                    org.SubscriptionStatus = SubscriptionStatus.Active;
                    await db.SaveChangesAsync();
                }
                break;
            }
            case "invoice.payment_failed":
            {
                var invoice = (Stripe.Invoice)stripeEvent.Data.Object;
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.StripeCustomerId == invoice.CustomerId);
                if (org is not null)
                {
                    org.SubscriptionStatus = SubscriptionStatus.PastDue;
                    await db.SaveChangesAsync();
                }
                break;
            }
        }

        return Ok();
    }
}
