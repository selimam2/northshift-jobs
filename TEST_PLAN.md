# NorthShift Jobs — End-to-End Manual Test Plan

**Last Updated:** 2026-04-24
**Coverage:** Public/Nurse flows · Employer flows · Admin flows · Cross-cutting · Stress tests

---

## Test Data Requirements

Set up these accounts and fixtures before running the plan:

### Accounts
| Role | Email | Notes |
|---|---|---|
| Admin | sami@northshift.ca | Password in SSM |
| Employer — Trial | test.small@example.com | Registered, trial active, Small plan |
| Employer — Active | test.medium@example.com | Subscribed, Active, Medium plan |
| Employer — Past Due | test.pastdue@example.com | Subscription failed, PastDue state |
| Employer — Cancelled | test.cancelled@example.com | Cancelled subscription |

### Sample Listings
1. Pending Approval (for admin review)
2. Active English Listing (with 5+ applications)
3. Active Bilingual Listing (with applications referencing French title)
4. Closed Listing (historical)
5. Draft Listing (not yet submitted)

### Sample Applications
1. New (no status change)
2. Reviewed
3. Shortlisted
4. Hired
5. Rejected
6. Application with resume attached
7. Application with licences (multiple provinces)
8. Application with cover message

---

## Part 1 — Public + Nurse Flows

### P-01: Home Page Load and Language Toggle
**Title:** Verify home page displays correctly in both English and French

**Steps:**
1. Open https://northshift.ca
2. Verify hero: "Rural & Remote Nursing Jobs Across Canada", "Browse Jobs" and "Post a Job" CTAs
3. Verify "How It Works" section shows 3 steps: Search & Filter, Apply Directly, Get Matched
4. Verify stats bar shows "13 Provinces & Territories"
5. Verify "For Healthcare Employers" CTA section with "Start Posting" button
6. Navigate to `/fr` — verify all copy translates to French
7. Switch back to `/en` and confirm consistency

**Expected Result:** Page renders fully in both languages; CTAs point to correct locale-specific URLs

**Edge Cases:**
- Footer links also switch locale
- Skeleton loading on slow networks
- Hero decorative elements load

---

### P-02: Job Listing Page — No Filters, Initial Load
**Title:** Browse jobs page loads with all listings

**Steps:**
1. Navigate to `/jobs`
2. Verify listing cards show: role badges, language badge, title, location, pay range, contract length, start date, org name
3. Verify "Featured" listings have a gradient bar at top
4. Verify pagination shows "X positions found" with Load More if totalCount > 12

**Expected Result:** All active listings display; max 12 per page

**Edge Cases:**
- Empty database → "No jobs found"
- >100 listings → pagination works
- Pay range shows "$X–$Y/hr", "$X+/hr", or omitted when absent

---

### P-03: Job Listing Page — Filter by Province
**Steps:**
1. Select "Ontario" from province dropdown → verify only Ontario listings
2. Select "Quebec" → verify results update
3. Select "All Provinces" → reset

**Expected Result:** Only listings from selected province display; URL reflects filter

**Edge Cases:** Province with no listings → empty state

---

### P-04: Job Listing Page — Filter by Role Type
**Steps:**
1. Select "RN" → verify only RN listings
2. Select "NP" → verify results change
3. Select "All Roles" → reset
4. Combine with province filter

**Expected Result:** Listings filtered to selected role type; test RN, RPN, LPN, NP, CNA, Other

---

### P-05: Job Listing Page — Filter by Language
**Steps:**
1. Select "French" → verify only French/Bilingual listings
2. Select "English" → verify only English/Bilingual listings
3. Select "Bilingual" → verify only Bilingual listings

**Expected Result:** Language filter works independently and combined with other filters

---

### P-06: Job Listing Page — Filter by Contract Length
**Steps:**
1. Select "8 weeks" → verify only 8-week contracts
2. Select "52 weeks+" → verify results change
3. Select "Any Length" → reset

**Expected Result:** All contract length options work: 4 weeks, 8 weeks, 13 weeks, 26 weeks, 52 weeks+

---

### P-07: Job Listing Page — Load More Pagination
**Steps:**
1. Load `/jobs` — verify initial 12 listings
2. Click "Load More" → verify loading state, then 12 more appended
3. Total = 24; if totalCount ≤ 24, button disappears

**Expected Result:** Appends results correctly; button disappears when all loaded

**Edge Cases:** Clicking Load More rapidly (debounce); filters persist across pages

---

### P-08: Job Detail Page — Load Listing and View Details
**Steps:**
1. Click any listing card → URL is `/jobs/[slug]`
2. Verify all details: title (locale-aware), role badges, language, location, pay, contract length, start date, org
3. Verify description whitespace/line breaks preserved
4. Scroll to application form sidebar (sticky on desktop)

**Expected Result:** Full details visible; optional fields (payMin, payMax, startDate) omitted if missing

**Edge Cases:** Non-existent slug → "Job not found" with back link; bilingual listing shows correct locale

---

### P-09: Job Application — Happy Path Complete Submission
**Steps:**
1. Navigate to a job detail page
2. Fill: Full Name, Email, Availability Date (today or future), Province of Licence
3. Optionally: Licence Number, Expiry Date, Cover Letter
4. Select a valid PDF resume file; verify filename shown
5. Check consent checkbox
6. Click "Submit Application" → verify loading state
7. Verify success screen: "Application Submitted" with email confirmation note

**Expected Result:** Application submitted; confirmation email sent to applicant; employer notified; licence number encrypted in DB

**Edge Cases:** Resume uploaded to S3 before application record created; consent data stored separately

---

### P-10: Job Application — Validation Errors
**Steps:**
1. Leave Full Name empty → error: "Full name is required"
2. Single character name → same error (min 2 chars)
3. Invalid email → "Enter a valid email address"
4. Availability in the past → "Date must be today or in the future"
5. No province selected → "Province of licence is required"
6. No resume → "Please attach your resume before submitting"

**Expected Result:** Each error shown inline; form does not submit until valid

---

### P-11: Job Application — Resume File Validation
**Steps:**
1. Select a .txt file → error: "Only PDF, DOC, or DOCX files are accepted"
2. Select a valid .pdf → error clears, filename shown
3. Select .docx and .doc → both accepted

**Expected Result:** Only PDF/DOC/DOCX accepted

**Edge Cases:** .jpg, .png → error; very large file → test size limit behavior

---

### P-12: Job Application — Resume Upload to S3
**Steps:**
1. Fill form completely; open DevTools Network tab
2. Verify presigned upload URL fetched first (GET `/api/applications/presigned-upload`)
3. Verify file PUT to S3 presigned URL
4. Verify POST to `/api/applications/{listingId}` includes `resumeS3Key`

**Expected Result:** Resume uploaded to S3, key stored with application; S3 key format: `resumes/{guid}.{ext}`

**Edge Cases:** S3 upload failure → user-facing error message

---

### P-13: Job Alerts Subscribe Page — Basic Subscribe
**Steps:**
1. Navigate to `/alerts`
2. Enter email, leave preferences as default (none selected), click "Subscribe"
3. Verify success screen: "You're subscribed!" with unsubscribe note

**Expected Result:** Subscription created; confirmation email sent; unsubscribe token generated

---

### P-14: Job Alerts Subscribe — With Preferences
**Steps:**
1. Navigate to `/alerts`
2. Select Language Preference: French; check Provinces: QC, ON; check Roles: RN, NP
3. Subscribe and verify success
4. (Backend) Verify AlertSubscription has correct provinces, roleTypes, languages, languagePref

**Expected Result:** Subscription stores exact preferences selected

---

### P-15: Job Alerts Subscribe — Invalid Email
**Steps:**
1. Enter "notanemail" → error: "Enter a valid email address"
2. Enter "test@" → same error
3. Enter valid email → error clears

**Expected Result:** Only valid email format accepted

---

### P-16: Job Alerts Subscribe — Duplicate Email
**Steps:**
1. Subscribe with "duplicate@example.com" → success
2. Subscribe again with same email
3. Verify error: "This email is already subscribed. Check your inbox for a confirmation."

**Expected Result:** 409 from backend; no duplicate subscription; case-insensitive check

---

### P-17: Job Alerts Unsubscribe — Token Link from Email
**Steps:**
1. Subscribe to alerts; retrieve confirmation email
2. Click unsubscribe link (format: `/en/alerts/unsubscribe?token=...`)
3. Verify success: "You're unsubscribed" screen with "Re-subscribe" and "Browse Jobs" buttons

**Expected Result:** Subscription deleted; token one-time use

**Edge Cases:** Invalid/expired token → "Link invalid or already used"; second use of same token → error

---

### P-18: Job Alerts Unsubscribe — Email Lookup
**Steps:**
1. Navigate to `/alerts/unsubscribe-email`
2. Enter subscribed email, click "Send Unsubscribe Link"
3. Verify success screen: "Check your email"
4. Verify email arrives with unsubscribe link; complete flow from P-17

**Expected Result:** Always returns success (for privacy); link works to unsubscribe

**Edge Cases:** Non-subscribed email → still shows success (no reveal); invalid email format → still success

---

### P-19: Bilingual Experience — French Site
**Steps:**
1. Navigate to `/fr/jobs`
2. Verify all UI text in French; listing titles use `titleFr` where available
3. Open a bilingual job detail → French title/description
4. Fill and submit application in French locale → success message in French
5. Navigate to `/fr/alerts` → subscribe with French labels

**Expected Result:** Fully functional in French; English fallback for listings missing French content

---

### P-20: Language Switcher in Navigation
**Steps:**
1. Use language switcher on home, jobs, job detail, alerts, about, contact, pricing, privacy
2. Verify URL changes from `/en/` to `/fr/` and back
3. Verify content updates; filters don't reset when language changes

**Expected Result:** Locale updates immediately; consistent across all pages

---

### P-21: About Page Load
**Steps:**
1. Navigate to `/about`
2. Verify three sections: "Our Mission", "Why Rural Nursing Matters", "Who We Serve"
3. Verify `/fr/about` shows French translations

**Expected Result:** All sections render correctly in both locales

---

### P-22: Contact Page Form Submission
**Steps:**
1. Navigate to `/contact`
2. Verify "hello@northshift.ca" mailto link
3. Fill Name, Email, Message and click "Send Message"
4. Verify mailto link constructed with encoded subject/body

**Expected Result:** Default mail client opens with pre-filled content

---

### P-23: Privacy Policy Page
**Steps:**
1. Navigate to `/privacy`
2. Verify all 6 sections present: Information We Collect, How We Use, Job Alert Emails, Data Retention, Cookies & Analytics, Your Rights (PIPEDA)
3. Verify "hello@northshift.ca" link at bottom
4. Verify `/fr/privacy` loads French version

---

### P-24: Pricing Page — Unauthenticated Flow
**Steps:**
1. Clear `localStorage.ns_token`, navigate to `/pricing`
2. Verify three plan cards: Starter ($99/mo), Growth ($249/mo, "Most Popular"), Enterprise ($599/mo)
3. Toggle Annual — prices update: $79, $199, $479; "Save 20%" label appears
4. Click "Get Started" on any plan → redirects to `/register`
5. Verify no API call made without token

**Expected Result:** Unauthenticated users redirected to register; no tier pre-selection

---

### P-25: Navigation and Footer Links
**Steps:**
1. Verify header nav: "Find Jobs", "Job Alerts", "Employer Login", language switcher
2. Verify footer sections: For Nurses, For Employers, Company
3. Click each link and verify destination

**Expected Result:** All header and footer links functional; locale-aware

---

### P-26: Responsive Design — Mobile View
**Steps:**
1. Use DevTools at 375px width
2. Verify home, jobs, job detail, alerts pages render correctly
3. Verify single-column layout; no horizontal scroll; touch-friendly inputs

---

### P-27: Error Handling — Network Failure
**Steps:**
1. Enable Offline mode in DevTools; navigate to `/jobs`
2. Verify graceful error state (no crash)
3. Come back online; verify page loads on refresh
4. On job detail, go offline, try to submit → error shown; data preserved

---

### P-28: Security — No XSS via Job Listings
**Steps:**
1. Create a listing with title `<script>alert('xss')</script>`
2. Verify script does not execute on `/jobs` or job detail page

**Expected Result:** Input escaped; no JS execution

---

### P-29: Consent to Alerts Checkbox
**Steps:**
1. Submit application without checking consent → verify no NurseEmailConsent record created
2. Submit with consent checked → verify NurseEmailConsent record with email, IP, listing ID

---

### P-30: Date Formatting Across Locales
**Steps:**
1. On `/en/jobs`, verify start date format: "Apr 15"
2. On `/fr/jobs`, verify French date format
3. On job detail, verify full date: "Apr 15, 2025"

---

### P-31: Long Content Handling
**Steps:**
1. Create listing with 200+ character title → verify wraps without breaking layout
2. Fill cover letter with 1000+ chars → verify form handles it

---

### P-32: Resume File Download — Verification
**Steps:**
1. Submit application with resume
2. Employer: GET `/api/applications/{appId}/resume` → verify presigned URL
3. Download file; verify not corrupted

**Expected Result:** Presigned URL works; expires after ~15 minutes

---

### P-33: Empty State Handling
**Steps:**
1. Navigate to `/jobs` on empty database → "No jobs found" message
2. Apply filter with no results → same message; no Load More button

---

### P-34: Form State Persistence During Error
**Steps:**
1. Fill application form; simulate timeout (throttle network)
2. Submit → verify error shown; form data preserved
3. Fix network; resubmit → success

---

### P-35: Locale Persistence Across Navigation
**Steps:**
1. Navigate `/en/jobs` → click listing → URL is `/en/jobs/[slug]`
2. Go back → still `/en/jobs`
3. Switch to `/fr` → all subsequent navigation uses `/fr/` prefix

---

## Part 2 — Employer Flows

### E-01: Register New Account (Happy Path)
**Steps:**
1. Navigate to `/en/register`
2. Fill: Organisation Name "Test Health Authority", Your Name "Jane Smith", Work Email "jane@testorg.ca", Password (8+ chars)
3. Click "Create Account" → verify redirect to `/en/dashboard`
4. Verify `ns_token` in localStorage; subscription status: Trialing

**Edge Cases:** Email with `+` tag; org name 2 chars minimum; password exactly 8 chars

---

### E-02: Register with Duplicate Email
**Steps:**
1. Register with "test@example.com", then try to register again with same email
2. Verify redirect to `/en/login?email=test@example.com&notice=exists`
3. Verify blue info banner: "An account with that email already exists. Log in below."

**Edge Cases:** Case-insensitive check (Test@Example.com vs test@example.com)

---

### E-03: Register — Invalid Email Format
**Steps:**
1. Fill all fields; email = "notanemail"
2. Verify inline error: "Enter a valid email address." — no API call made

---

### E-04: Register — Weak Password
**Steps:**
1. Fill all fields; password = "Test123" (7 chars)
2. Verify error: "Password must be at least 8 characters."
3. Add one more char → error clears

---

### E-05: Login — Happy Path
**Steps:**
1. Navigate to `/en/login`; enter valid email + password
2. Verify redirect to `/en/dashboard`; JWT in localStorage

**Edge Cases:** Browser back button should not show login when already logged in

---

### E-06: Login — Wrong Password
**Steps:**
1. Enter valid email, wrong password
2. Verify error: "Invalid credentials." — user stays on login page

---

### E-07: Login — Non-Existent Email
**Steps:**
1. Enter unregistered email
2. Verify same "Invalid credentials." error (does not reveal email existence)

---

### E-08: Forgot Password Flow
**Steps:**
1. Navigate to `/en/forgot-password`; enter registered email
2. Verify success screen: "Check your email"
3. Open reset link from email (`/en/reset-password?token=<64-char-hex>`)
4. Enter new password + confirm; click "Set New Password"
5. Verify redirect to login; login with new password succeeds; old password fails

**Edge Cases:** Non-existent email → still shows success (prevents enumeration); expired link → "link is invalid or has expired"; password mismatch; password too short

---

### E-09: Reset Password — Mismatched Confirmation
**Steps:**
1. On reset-password page with valid token
2. New Password ≠ Confirm Password
3. Verify error: "Passwords don't match." — no API call

---

### E-10: Change Password (Settings)
**Steps:**
1. Navigate to `/en/dashboard/settings`
2. Fill current password, new password, confirm new password
3. Click "Update Password" → verify success: "Your password has been changed successfully."
4. Logout; login with new password succeeds; old password fails

**Edge Cases:** Wrong current password → "Current password is incorrect."; new password < 8 chars

---

### E-11: Dashboard — No Subscription (Lock Screen)
**Steps:**
1. Register or use cancelled account
2. Verify main area shows lock icon; "Subscribe to start posting" heading
3. "Choose a Plan" links to `/en/pricing`
4. Listings table not visible; new listing page inaccessible

**Edge Cases:** PastDue → red banner "Your last payment failed"; trial expired

---

### E-12: Dashboard — Active Subscription (Unlocked)
**Steps:**
1. Login as active/trialing user
2. Verify "New Listing" button enabled
3. Sidebar shows: tier label, status badge, billing cycle, renewal/trial date
4. "Manage Billing" button visible

---

### E-13: Listings Dashboard — View My Listings
**Steps:**
1. Login with multiple listings
2. Verify table: title, status badge, province, community, contract length, application count
3. Status badge colors: Active=green, Pending Review=yellow, Closed=gray, Draft=gray
4. Click application count → navigates to `/dashboard/applications?listingId=<id>`

**Edge Cases:** 0 listings → empty state; 0 applications on a listing

---

### E-14: Listings Dashboard — Close Listing
**Steps:**
1. Click "Close" on active listing
2. Confirm dialog: "Close 'Title'? It will no longer be visible to nurses."
3. Verify status changes to "Closed", badge turns gray, "Close" button removed
4. Verify listing no longer on public job board

**Edge Cases:** Cancel closes dialog without change; network error → alert; already-closed listing has no Close button

---

### E-15: New Listing — Bilingual (Happy Path)
**Steps:**
1. Click "New Listing"; select "Bilingual"
2. English tab: Title, Description; Français tab: Titre, Description
3. Select role types (RN, RPN), province, community, contract length, pay, housing, travel, start date
4. Click "Submit for Review"
5. Verify status: PendingApproval (yellow badge); redirect to dashboard

**Expected Result:** Listing queued for admin review; employer notified by email

**Edge Cases:** French tab empty → error; invalid pay range (max < min); missing role types

---

### E-16: New Listing — English Only
**Steps:**
1. Select "English" language → only English fields shown
2. Fill all fields and submit

**Expected Result:** French tab not displayed; language stored as "English"

---

### E-17: New Listing — Subscription Gating
**Steps:**
1. Use cancelled account; click "New Listing"
2. Verify lock screen: "You need an active plan to post listings."

---

### E-18: New Listing — Quota Limit
**Steps:**
1. Small plan org with 3 active listings; create a 4th
2. Verify error: "Active listing limit reached for your Small plan. Upgrade to post more."

---

### E-19: Edit Listing — Change Content
**Steps:**
1. Click "Edit" on a listing
2. Verify form pre-populated with current data
3. Change title, description, pay min, uncheck housing
4. Click "Save Changes" → verify redirect; listing updated in table

**Edge Cases:** Edit draft; edit closed listing; changing role types updates correctly

---

### E-20: Edit Listing — Validation Errors
**Steps:**
1. Clear English title field; attempt to save
2. Verify error: "English title is required." — no submit

---

### E-21: Applications — List All
**Steps:**
1. Navigate to `/en/dashboard/applications`
2. Verify columns: Applicant Name, Email, Listing, Status, Available, Submitted
3. Status badges: New=blue, Reviewed=yellow, Shortlisted=purple, Hired=green, Rejected=gray
4. Click row → application detail page

**Edge Cases:** 0 applications → empty state; mobile hides some columns

---

### E-22: Applications — Filter by Listing
**Steps:**
1. Click application count on a listing → `/dashboard/applications?listingId=<id>`
2. Verify only that listing's applications shown; "Filtered to: [Title]" subtitle
3. Click "View all" → all applications shown

---

### E-23: Application Detail — View & Update Status
**Steps:**
1. Click an applicant row
2. Verify: name, email, availability date, applied date, licences, cover message
3. Change status dropdown from "New" to "Shortlisted"
4. Verify status updates in UI; status history log entry appears

**Edge Cases:** Same status selected → no-op; multiple status changes in sequence

---

### E-24: Application Detail — Add Note
**Steps:**
1. Enter note text in Notes section; click "Add"
2. Verify note appears with "You" as author and current date
3. Add a second note; reload page
4. Verify both notes persist

**Edge Cases:** Empty note → Add button disabled; very long note; special characters

---

### E-25: Application Detail — Download Resume
**Steps:**
1. Open application with resume; click "Download Resume"
2. Verify browser opens/downloads file (PDF or DOCX)
3. Verify file is readable

**Edge Cases:** Application without resume → button hidden or disabled

---

### E-26: Application Detail — Licence Information
**Steps:**
1. Open application with multiple licences
2. Verify province (full name), licence number (decrypted), expiry date (Month Year format)
3. Multiple licences listed separately

**Edge Cases:** Licence without expiry; licence without number; expired licence still shown

---

### E-27: Billing — Subscribe to Plan (Stripe Checkout)
**Steps:**
1. From unsubscribed dashboard, click "Choose a Plan" → pricing page
2. Select Growth annual; click "Subscribe Now" → Stripe checkout
3. Use test card 4242 4242 4242 4242; complete payment
4. Verify redirect to `/en/pricing/success`; dashboard status now Active/Trialing

**Edge Cases:** Declined card (4000 0000 0000 0002); incomplete card details; browser back during checkout

---

### E-28: Billing — Manage Subscription (Portal)
**Steps:**
1. Click "Manage Billing" in sidebar → Stripe portal
2. Verify billing history, payment method editable, renewal date visible
3. Return to dashboard

**Edge Cases:** No subscription → error; portal loads with cancelled subscription

---

### E-29: Billing — Cancel Plan
**Steps:**
1. Click "Cancel plan" in sidebar → Stripe portal
2. Confirm cancellation in portal; return to NorthShift
3. Verify status: Cancelled; dashboard locked

**Expected Result:** Cannot create new listings; existing listings remain visible to public

**Edge Cases:** Cancel during trial (no charge); reactivate after cancellation

---

### E-30: Billing — Subscription Past Due
**Steps:**
1. Login with PastDue account
2. Verify red banner: "Your last payment failed. Update your billing info to restore access."
3. "Update Payment Info" → Stripe portal; fix payment → status returns to Active

---

### E-31: Logout
**Steps:**
1. Click "Log out"
2. Verify redirect to `/en/login`; `ns_token` removed from localStorage
3. Navigate directly to `/en/dashboard` → redirected to login

---

### E-32: Team Management — Invite Recruiter *(Future Feature)*
**Steps:** (Placeholder — feature not yet implemented)
1. AccountManager invites team member via email
2. Recruiter accepts invite, sets password, logs in
3. Recruiter sees only assigned listings/applications
4. Recruiter quota enforced per plan tier

---

## Part 3 — Admin Flows

### A-01: Admin Login
**Steps:**
1. Login as sami@northshift.ca
2. Navigate to `/en/admin`
3. Verify admin panel loads with "Pending Listings" and "Organisations" tabs
4. Verify JWT contains "Admin" role

**Edge Cases:** Non-admin user accessing `/en/admin` → redirect to dashboard

---

### A-02: Admin Panel — Pending Listings View
**Steps:**
1. Open "Pending Listings" tab
2. Verify all PendingApproval listings shown: title, org name, province, community, role types, created date
3. Verify tab badge shows count
4. Verify empty state if no pending listings

**Edge Cases:** 50+ pending listings; bilingual listing shows title; long titles truncated

---

### A-03: Admin Panel — Approve Listing
**Steps:**
1. Click "Approve" on a listing card
2. Verify loading state; listing disappears from queue
3. Verify status changed to "Active" in DB
4. Verify org AccountManager receives approval email
5. Verify listing now visible on public `/jobs` page

**Edge Cases:** Network error → error shown, button re-enabled; approve same listing twice → no-op or error

---

### A-04: Admin Panel — Reject Listing
**Steps:**
1. Click "Reject" on a listing card
2. Verify listing removed from queue; status → "Closed"
3. Verify org AccountManager receives rejection email
4. Verify listing NOT on public job board

---

### A-05: Admin Panel — Organisations View
**Steps:**
1. Click "Organisations" tab
2. Verify table: Org Name, Plan Tier, Status, User Count, Active Listings, Joined Date
3. Status badges: Active=green, Trialing=blue, PastDue=red, Cancelled=gray

**Edge Cases:** Org with 0 users; org with 100+ listings; trial ending today

---

### A-06: Admin Panel — Organisation Details *(Future)*
**Steps:** Placeholder — clicking org row to see detailed view not yet implemented

---

### A-07: Admin Panel — Pending Count Updates
**Steps:**
1. Note current pending count badge
2. In separate window, submit a new listing as employer
3. Return to admin panel; verify count increased

---

### A-08: Admin Logout
**Steps:**
1. Click "Log out" from admin panel
2. Verify redirect to login; attempt `/en/admin` → redirect

---

## Part 4 — Cross-Cutting Scenarios

### X-01: Localization — Switch Language Preference
**Steps:**
1. Test all employer pages at `/en/*` and `/fr/*`
2. Verify form labels, buttons, error messages all translated
3. Bilingual listings show content in active locale

---

### X-02: Responsive Design — Mobile View (Employer)
**Steps:**
1. Open employer pages (register, login, dashboard, listings, applications) at 375px
2. Verify forms fillable; tables collapse; buttons touch-friendly (44px+ targets)

---

### X-03: Session Timeout — Re-authentication
**Steps:**
1. Login; manually expire token (or wait)
2. Attempt authenticated action → verify 401 triggers login redirect
3. Re-login → protected pages accessible

---

### X-04: Network Error Handling
**Steps:**
1. Go offline; attempt login, create listing, add note
2. Verify user-friendly error; no broken state
3. Come online; retry → success

---

### X-05: Form Submission — All Required Fields Validated
**Steps:**
1. For each form (register, new listing, add note, reset password):
   - Clear a required field; attempt submit
2. Verify client-side error; no API call made

---

### X-06: Keyboard Navigation
**Steps:**
1. Tab through all form fields; Enter activates buttons/links
2. Verify focus visible; tab order logical; no keyboard traps

---

### X-07: Error Boundary — Graceful Error Handling
**Steps:**
1. Simulate API 500 response
2. Verify app doesn't white-screen; error message or fallback shown
3. Other parts of app still functional

---

### X-08: Stripe Webhook Integration
**Steps:**
1. Complete checkout; check Stripe dashboard webhook logs
2. Verify `checkout.session.completed` processed
3. Verify org SubscriptionStatus, Tier, and renewal date updated in DB

---

### X-09: Resume Upload and S3 Integration (End-to-End)
**Steps:**
1. Nurse submits application with PDF resume
2. Verify S3 upload (PUT to presigned URL)
3. Employer opens application detail; clicks "Download Resume"
4. Verify file downloads and is readable

**Expected Result:** Only employer's organization can download; URL expires ~15 min

---

### X-10: PIPEDA Compliance — Email Consent
**Steps:**
1. Submit application with consent checked
2. Verify NurseEmailConsent record created with: email, IP, listing ID, timestamp
3. Submit without consent → no record created

---

## Part 5 — Stress & Edge Cases

### S-01: Large Application Lists
**Steps:**
1. Load applications page for org with 1000+ applications
2. Verify page loads < 2s; table scrolls smoothly; filters respond promptly

---

### S-02: Concurrent Edits
**Steps:**
1. Two users from same org open same listing edit form simultaneously
2. User A saves title change; User B saves description change
3. Verify final DB state is consistent (last write wins or conflict shown)

---

### S-03: Billing Quota Enforcement
**Steps:**
1. Small plan org (quota: 3 active listings) creates a 4th
2. Verify API returns 400: "Active listing limit reached"
3. Verify UI shows error; upgrade prompt shown

---

### S-04: Admin Batch Approvals
**Steps:**
1. Create 10 pending listings; admin approves 5 in rapid succession
2. Verify all 5 approved, removed from queue; 5 remaining

---

## Execution Notes

- **Environments:** Local (`http://localhost:3000` / `http://localhost:8080`) or production (`https://northshift.ca` / `https://api.northshift.ca`)
- **Tools:** Chrome DevTools (Network throttling, offline mode, device emulation), Postman for raw API calls, email client for alert/reset link flows
- **Stripe test cards:** 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (decline)
- **Always test both `/en` and `/fr` variants of every page**
- **Licence numbers encrypted in DB** — verify the decrypted value displays correctly in application detail
- **Performance:** Watch for N+1 queries on listings and applications list endpoints
