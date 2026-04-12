# TODO

## Language field on job postings

The current `ListingLanguage` enum (`English`, `French`, `Bilingual`) is not a good representation
of what a healthcare employer actually needs to communicate about language requirements.

**Problem:** "Bilingual" is vague — does it mean the nurse must speak both, or that either is fine?
"English" / "French" as sole options doesn't capture "preferred" vs "required" distinctions.

**What needs to change:**

### Backend
- [ ] Redesign `ListingLanguage` enum in `Models/Listing.cs`
  - Proposed values: `EnglishOnly`, `FrenchOnly`, `BilingualRequired`, `BilingualAsset`
  - Or consider replacing with two separate boolean fields: `FrenchRequired` + `FrenchAsset`
- [ ] Update `AppDbContext.cs` — string conversion for the enum
- [ ] Update `ListingsController.cs` — filter logic (`OR` within language list still applies)
- [ ] Create a new EF Core migration after model changes

### Frontend
- [ ] Update `lib/types.ts` — `ListingLanguage` type to match new enum values
- [ ] Update `app/[locale]/jobs/page.tsx` — language filter dropdown options + labels
- [ ] Update `app/[locale]/jobs/[slug]/page.tsx` — display label on job detail
- [ ] Update `messages/en.json` + `messages/fr.json` — human-readable labels for new values

---

## Other known gaps

- [ ] S3 resume upload — `ApplicationsController` sets `ResumeS3Key = string.Empty` as placeholder
- [ ] Stripe webhook handler — subscription lifecycle (upgrade, cancel, past_due) not yet handled
- [ ] Free trial approach — needs design decision (time-limited? listing-count-limited?)
- [ ] Dashboard — listing CRUD UI (create, edit, close) not yet built
- [ ] Dashboard — applications view (list, status update, notes, assign) not yet built
- [ ] Dashboard — team management (invite recruiter, set permissions) not yet built
- [ ] Terraform / AWS infrastructure — deferred
- [ ] Pricing page
- [ ] Password reset flow
