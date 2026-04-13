# NorthShift — To-Do

## Priority Queue

- [ ] **Admin portal** — UI for approving/rejecting listings, viewing applications, managing orgs. Currently requires curl + JWT.
- [ ] **Encryption for licence numbers** — AES column-level encryption for nurse licence numbers stored in the DB.
- [ ] **Unsubscribe page + footer nav link** — `/alerts/unsubscribe?token=...` page linked from alert emails; add visible link in bottom nav bar.
- [ ] **Stripe subscriptions** — Wire up subscription tiers, webhook handling, org tier upgrades/downgrades, billing portal.

## Known Gaps

- [ ] **Language field on job postings** — `ListingLanguage` enum (`English`, `French`, `Bilingual`) is too vague. Needs redesign (e.g. `EnglishOnly`, `FrenchOnly`, `BilingualRequired`, `BilingualAsset`). Requires backend model change, migration, and frontend label updates.
- [ ] **Password reset flow** — not yet built.
- [ ] **Free trial approach** — needs design decision (time-limited? listing-count-limited?).
- [ ] **Pricing page** — copy and tier comparison UI.
- [ ] **Dashboard — listing CRUD** — create, edit, close listings from the UI.
- [ ] **Dashboard — applications view** — list, status update, notes, assign to recruiter.
- [ ] **Dashboard — team management** — invite recruiter, set permissions.

## Done

- [x] Resume upload (S3 presigned URLs, required field validation)
- [x] Branding — northshiftjobs.ca → northshift.ca everywhere, frontend redeployed
- [x] Contact/privacy email consolidated to hello@northshift.ca
- [x] Email delivery — Resend domain verified on northshift.ca, application confirmations working
- [x] DateTime UTC bug fix on application submit (was causing 500)
- [x] Alert subscription confirmation email wired up
- [x] Resend DNS records added to Route 53 (DKIM, SPF, MX)
