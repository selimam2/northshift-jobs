# NorthShift — To-Do

## Priority Queue

- [x] **Cancel subscription** — "Cancel plan" button in dashboard billing section → Stripe portal (portal already supports cancellation, just needs a clear entry point and confirmation copy).
- [ ] **Change password** — Authenticated flow in dashboard settings: current password + new password + confirm. `POST /api/auth/change-password`.
- [ ] **Dashboard — listing CRUD** — edit and close listings from the UI (new listing form exists, no list/edit/close).
- [ ] **Dashboard — applications view** — list, status update, notes, assign to recruiter.
- [ ] **Dashboard — team management** — invite recruiter, set permissions.

## Possible Future Changes

- [ ] **Restore NAT Gateway** — ECS tasks currently run in public subnets with `assign_public_ip = true` to save ~$35/month. If compliance requirements or enterprise customers demand private subnets, re-add `aws_nat_gateway` + `aws_eip` in `terraform/vpc.tf` and flip ECS services back to `aws_subnet.private[*].id` with `assign_public_ip = false` in `terraform/ecs.tf`.
- [ ] **Language field on job postings** — `ListingLanguage` enum (`English`, `French`, `Bilingual`) is too vague. Needs redesign (e.g. `EnglishOnly`, `FrenchOnly`, `BilingualRequired`, `BilingualAsset`). Requires backend model change, migration, and frontend label updates.

## Done

- [x] Admin portal — pending listings queue (approve/reject), organisations table at `/admin`
- [x] Encryption for licence numbers — ASP.NET DataProtection, keys in DB, encrypt on write/decrypt on read
- [x] Unsubscribe flows — token link from emails + email lookup page in footer
- [x] Stripe subscriptions — checkout, webhooks, billing portal, 14-day trial, tier enforcement
- [x] Subscription enforcement — 402 on backend, aggressive frontend gating (lock screens)
- [x] Password reset flow — forgot password → Resend email → reset page
- [x] Resume upload (S3 presigned URLs, required field validation)
- [x] Branding — northshiftjobs.ca → northshift.ca everywhere
- [x] Contact/privacy email consolidated to hello@northshift.ca
- [x] Email delivery — Resend domain verified, application confirmations working
- [x] DateTime UTC bug fix on application submit
- [x] Alert subscription confirmation email wired up
- [x] Resend DNS records added to Route 53 (DKIM, SPF, MX)
