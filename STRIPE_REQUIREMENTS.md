# Stripe Integration — Requirements

## Overview
Wire up Stripe Subscriptions so orgs can self-serve onto a paid plan with a 14-day free trial.
Card is required at checkout. Trial auto-converts to paid after 14 days.

---

## Stripe Dashboard Setup (manual, before deploy)

### Products & Prices
Create one Product per tier, each with two Prices (monthly + annual):

| Tier | Monthly | Annual (per month, billed yearly) |
|---|---|---|
| Starter (Small) | $99/mo | $79/mo → $948/yr |
| Growth (Medium) | $249/mo | $199/mo → $2,388/yr |
| Enterprise (Large) | $599/mo | $479/mo → $5,748/yr |

Six Price IDs total. Add them to `appsettings.json` under `Stripe:Prices`.

### Webhook Endpoint
Register `https://api.northshift.ca/api/stripe/webhook` in the Stripe dashboard.

Events to subscribe to:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Webhook secret (`whsec_...`) goes into SSM at `/northshift/stripe_webhook_secret`.

---

## Authentication Model

| Endpoint | Auth |
|---|---|
| `POST /api/stripe/checkout` | JWT required (`AccountManager` role only) |
| `POST /api/stripe/portal` | JWT required (`AccountManager` role only) |
| `POST /api/stripe/webhook` | **No JWT** — verified via Stripe HMAC signature (`Stripe-Signature` header + `whsec_` secret) |

The webhook endpoint is public by necessity (Stripe calls it). Security is the signature check — reject anything that fails `EventUtility.ConstructEvent()`.

---

## Backend

### New: `StripeService.cs`
Wraps Stripe SDK calls:
- `CreateCustomerAsync(org, email)` → `string customerId`
- `CreateCheckoutSessionAsync(org, tier, isAnnual, successUrl, cancelUrl)` → `string sessionUrl`
- `CreatePortalSessionAsync(stripeCustomerId, returnUrl)` → `string portalUrl`

### New: `StripeController.cs`

**`POST /api/stripe/checkout`** — `[Authorize(Roles = "AccountManager")]`
- Request: `{ tier: "Small|Medium|Large", isAnnual: bool }`
- Looks up org's `StripeCustomerId`, creates one if missing
- Creates Stripe Checkout Session with `trial_period_days: 14`, `mode: "subscription"`
- Returns `{ url: "https://checkout.stripe.com/..." }`
- Frontend redirects user to that URL

**`POST /api/stripe/portal`** — `[Authorize(Roles = "AccountManager")]`
- No request body
- Creates a Stripe Billing Portal session for the org's customer
- Returns `{ url: "https://billing.stripe.com/..." }`
- Frontend redirects user to that URL

**`POST /api/stripe/webhook`** — no auth, raw body required
- Reads `Stripe-Signature` header
- Calls `EventUtility.ConstructEvent()` — returns 400 if invalid
- Handles events:

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `StripeSubscriptionId`, `SubscriptionStatus = Trialing` |
| `customer.subscription.updated` | Sync `Tier`, `IsAnnual`, `SubscriptionStatus`, `SubscriptionExpiresAt` |
| `customer.subscription.deleted` | Set `SubscriptionStatus = Cancelled` |
| `invoice.payment_succeeded` | Set `SubscriptionStatus = Active` |
| `invoice.payment_failed` | Set `SubscriptionStatus = PastDue` |

### Modified: `AuthController.Register`
After saving the org, call `StripeService.CreateCustomerAsync()` and persist `StripeCustomerId` on the org.

### New: `appsettings.json` additions
```json
"Stripe": {
  "SecretKey": "...",
  "WebhookSecret": "...",
  "Prices": {
    "SmallMonthly":    "price_xxx",
    "SmallAnnual":     "price_xxx",
    "MediumMonthly":   "price_xxx",
    "MediumAnnual":    "price_xxx",
    "LargeMonthly":    "price_xxx",
    "LargeAnnual":     "price_xxx"
  }
}
```

### New: EF Migration
No schema changes needed — `Organization` already has all required columns:
`StripeCustomerId`, `StripeSubscriptionId`, `Tier`, `SubscriptionStatus`, `IsAnnual`, `SubscriptionExpiresAt`.

---

## Frontend

### Pricing page (`/pricing`)
- "Get Started" button: `POST /api/stripe/checkout` with tier + billing cycle, then `window.location.href = response.url`
- Add `/pricing/success` and `/pricing/cancelled` pages as Stripe redirect targets (simple copy, no logic)
- Unauthenticated users clicking "Get Started" → redirect to `/register` first, then back to pricing

### Dashboard
- Show current plan name, status (Trialing / Active / PastDue / Cancelled), and trial end date if applicable
- "Manage Billing" button → `POST /api/stripe/portal`, redirect to portal URL
- If `SubscriptionStatus = PastDue`: show banner prompting them to update payment

---

## Enforcement (already in place)
`Organization.ListingQuota` and `Organization.RecruiterQuota` are already computed from `Tier`.
`ListingsController` and `AuthController` already check these quotas before allowing creates.
No changes needed here.

---

## Out of Scope (this iteration)
- Proration on mid-cycle upgrades (Stripe handles this automatically)
- Invoice history UI
- Admin portal visibility into billing status
