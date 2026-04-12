# NorthShift Jobs — Product Spec

## 1. Product Overview

**Name (working):** NorthShift Jobs  
**Tagline (EN):** Contract nursing jobs in rural and remote Canada — all in one place.  
**Tagline (FR):** Contrats infirmiers en milieu rural et éloigné au Canada — tout en un seul endroit.

**What it is:**  
A bilingual (EN/FR) self-serve job board and applicant management platform connecting rural/remote Canadian healthcare facilities with nurses seeking contract and locum work.

**What makes it different:**  
- Only platform dedicated to rural + remote contract nursing across all of Canada
- Bilingual (English + French) from day one
- In-app application management — employers receive, track, and manage applicants directly
- Multi-seat employer accounts with Account Manager + Recruiter role structure
- Subscription model — post as many jobs as your tier allows, manage everything in one place

---

## 2. Target Users

### Employers (pay via subscription)
- Rural hospitals and regional health authorities
- First Nations health centres
- Remote fly-in clinics
- Long-term care facilities in rural areas
- Community health centres
- Staffing agencies placing contract nurses

### Job Seekers (free)
- Registered Nurses (RNs) seeking contract/travel work
- Licensed Practical Nurses (LPNs)
- Nurse Practitioners (NPs)
- Nurses interested in fly-in/fly-out or extended rural placements

---

## 3. Account Structure

### Employer Account Hierarchy
```
Organization Account
├── Account Manager (1 per org — admin of the org)
│   ├── Manages subscription and billing
│   ├── Creates/manages recruiter accounts
│   ├── Can see all listings and all applications
│   └── Assigns applications to recruiters
└── Recruiter Accounts (unlimited, based on tier)
    ├── Can post jobs (within org's listing limit)
    ├── Can manage listings they are assigned to
    └── Can manage applications assigned to them
```

### Subscription Tiers

| Feature | Small | Medium | Large |
|---|---|---|---|
| **Price** | $99/mo | $199/mo | $399/mo |
| **Active listings** | 3 | 10 | Unlimited |
| **Recruiter accounts** | 1 | 3 | Unlimited |
| **Featured listing slots** | 0 | 0 | 2/mo |
| **Application management** | Yes | Yes | Yes |
| **Analytics dashboard** | Basic | Basic | Full |
| **Priority support** | No | No | Yes |
| **Upsell nudge** | — | "Upgrade for unlimited" banner | — |

> Medium tier is intentionally designed to feel limiting — the "upgrade" banner appears prominently when hitting listing or recruiter limits.

### Roles & Permissions

| Action | Account Manager | Recruiter |
|---|---|---|
| Manage billing / subscription | Yes | No |
| Create/remove recruiter accounts | Yes | No |
| Post a listing | Yes | Yes |
| Edit own listings | Yes | Yes |
| View all org listings | Yes | No (own only) |
| View all applications | Yes | No (assigned only) |
| Assign applications to recruiters | Yes | No |
| Leave notes on applications | Yes | Yes |
| Update application status | Yes | Yes (assigned only) |

---

## 4. Core Features

### MVP

#### Public — Job Listings
- Browse all active postings (bilingual UI)
- Filter by: Province/Territory, Contract Length, Role Type (RN, LPN, NP), Start Date, Language (EN/FR)
- Each listing shows: location, contract length, start date, pay range (optional), housing/travel info
- Mobile-friendly

#### Public — Job Detail Page
- Full job description (in employer's chosen language, toggle available)
- Employer name and location
- In-app **Apply Now** form (no external redirect)
- Share button

#### Nurse Application Flow
Nurses submit:
- Cover message
- Resume (PDF upload)
- Province of current licence
- Availability date

No nurse account required for MVP — application submitted with email only.

#### Email Alerts (Job Seeker)
- Subscribe: email + province(s) + role type + language preference
- Auto-email on new matching listing
- Unsubscribe link in every email

#### Employer — Post a Job
- Multi-step form (bilingual — employer writes in EN, FR, or both)
- Fields: title, role type, province, community, contract length, start date, pay range, housing, travel, description, language of posting
- Listing goes live after admin approval
- Counts against org's active listing quota

#### Employer — Dashboard (Account Manager)
- Overview: active listings, total applications, subscription status
- Manage listings (create, edit, close, repost)
- Manage recruiter accounts (invite, remove)
- View and assign all incoming applications
- Subscription + billing management (Stripe Customer Portal)

#### Employer — Dashboard (Recruiter)
- View listings assigned to them
- View applications assigned to them
- Update application status: `New → Reviewed → Shortlisted → Hired / Rejected`
- Leave internal notes on applications

#### Admin Panel (internal)
- Review and approve/reject listings before going live
- Remove listings
- View all orgs, subscriptions, revenue
- Impersonate org for support

---

### Phase 2 (Post-MVP)

- **Nurse profiles** — nurses create accounts, save jobs, track their applications
- **Resume database** — Large tier employers search nurse profiles
- **SMS alerts** for job seekers
- **Analytics** — application funnel, listing views, time-to-hire
- **Province licensure guides** — SEO content pages
- **Province-specific listing pages** — `/emplois-infirmiers/quebec` etc.

---

## 5. Functional Requirements

| # | Requirement |
|---|---|
| FR-01 | An employer can register an organization and become the Account Manager |
| FR-02 | Account Manager can invite recruiters via email link |
| FR-03 | Account Manager can select and pay for a subscription tier via Stripe |
| FR-04 | System enforces listing quota per tier (blocks posting when limit reached) |
| FR-05 | Recruiter can post a job listing within their org's quota |
| FR-06 | All listings require admin approval before going live |
| FR-07 | Nurses can apply in-app without creating an account |
| FR-08 | Applications include: cover message, PDF resume, licence province, availability date |
| FR-09 | Account Manager receives email notification for each new application |
| FR-10 | Account Manager can assign applications to recruiters |
| FR-11 | Recruiter can update application status and add notes |
| FR-12 | Nurses receive email confirmation when they apply |
| FR-13 | Job seekers can subscribe to email alerts by province + role type |
| FR-14 | Alert emails are sent when a matching listing goes live |
| FR-15 | All public-facing pages available in English and French |
| FR-16 | Listings can be posted in English, French, or both |
| FR-17 | Listings auto-expire based on subscription status (deactivated if subscription lapses) |
| FR-18 | Account Manager can access Stripe Customer Portal for billing self-service |

---

## 6. Non-Functional Requirements

| # | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Public listing pages load under 2s (SSR via Next.js) |
| NFR-02 | Availability | 99.5% uptime — AWS managed infra (ECS + RDS Multi-AZ in prod) |
| NFR-03 | Security | Passwords hashed (bcrypt), JWT auth, Stripe handles all card data |
| NFR-04 | Security | Resume PDFs stored in private S3 bucket, accessed via signed URLs only |
| NFR-05 | Security | Recruiter cannot access other org's data — enforced at API level |
| NFR-06 | Scalability | Handle 50k page views/mo without infra changes |
| NFR-07 | SEO | All public listing pages server-side rendered and indexable |
| NFR-08 | Accessibility | WCAG 2.1 AA compliant |
| NFR-09 | i18n | EN/FR supported via Next.js i18n routing (`/en/`, `/fr/`) |
| NFR-10 | Privacy | PIPEDA compliant — no PII beyond email, name, org |
| NFR-11 | Mobile | Full functionality on mobile (nurses browse and apply on phone) |
| NFR-12 | Audit | Application status changes are logged with timestamp + actor |

---

## 7. Out of Scope for MVP

- Nurse user accounts / saved jobs
- Resume database / searchable nurse profiles
- SMS alerts
- In-app messaging between nurse and employer
- Video interviews
- Background check integrations
- Custom domains for employer career pages

---

## 8. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) | SSR for SEO, built-in i18n routing for EN/FR |
| Styling | Tailwind CSS | Fast to build, clean UI |
| i18n | next-intl | Best-in-class i18n for Next.js App Router |
| Backend | ASP.NET Core (C#) | Robust REST API, strong EF Core + Postgres support |
| ORM | Entity Framework Core | Code-first migrations, LINQ queries |
| Database | PostgreSQL on AWS RDS | Managed, scalable, great EF Core support |
| File Storage | AWS S3 (private) | Resume PDF storage, signed URL access |
| Payments | Stripe Subscriptions | Recurring billing, tier management, customer portal |
| Email | Resend | Simple API, great deliverability, bilingual templates |
| Frontend Hosting | Vercel | One-click Next.js deploys |
| Backend Hosting | AWS ECS Fargate | Containerized ASP.NET Core, auto-scaling |
| Container Registry | AWS ECR | Store and deploy Docker images |
| Infrastructure | Terraform | IaC for all AWS resources |
| Auth | JWT (ASP.NET Core) | Employer/recruiter/admin auth |

### AWS Infrastructure (Terraform-managed)
```
VPC
├── Public subnets → ALB (Application Load Balancer)
├── Private subnets → ECS Fargate (ASP.NET Core API)
└── Private subnets → RDS PostgreSQL (Multi-AZ for prod)

ECR → Docker image registry
S3 → Private resume storage
CloudWatch → Logs and monitoring
Route 53 → DNS
ACM → SSL certificates
Secrets Manager → DB passwords, API keys
```

### Environments
| Environment | Frontend | Backend | DB |
|---|---|---|---|
| Dev | localhost:3000 | localhost:5000 | Local Postgres (Docker) |
| Staging | Vercel preview | ECS Fargate (staging) | RDS db.t3.micro |
| Production | Vercel prod | ECS Fargate (prod) | RDS Multi-AZ |

**Estimated monthly AWS cost (MVP):** ~$80-150/mo

---

## 9. Data Models

### Organization
```
id, name, stripe_customer_id, stripe_subscription_id,
tier (small/medium/large), subscription_status, created_at
```

### User (Account Manager + Recruiters)
```
id, org_id, name, email, password_hash, role (account_manager/recruiter),
is_active, created_at, last_login_at
```

### Listing
```
id, slug, org_id, posted_by_user_id, title, title_fr,
role_type, province, community, contract_length, start_date,
pay_min, pay_max, housing_provided, travel_covered,
description, description_fr, language (en/fr/both),
status (draft/pending_approval/active/expired/closed),
featured, created_at, expires_at
```

### Application
```
id, listing_id, assigned_to_user_id,
applicant_name, applicant_email, cover_message,
resume_s3_key, licence_province, availability_date,
status (new/reviewed/shortlisted/hired/rejected),
created_at, updated_at
```

### ApplicationNote
```
id, application_id, author_user_id, body, created_at
```

### ApplicationStatusLog
```
id, application_id, changed_by_user_id,
from_status, to_status, changed_at
```

### AlertSubscription
```
id, email, provinces[], role_types[], language_pref (en/fr),
unsubscribe_token, created_at
```

### NurseEmailConsent (collected at application time)
```
id, email, consented_at, consent_ip, source_listing_id, unsubscribe_token
```
> PIPEDA compliant — explicit opt-in checkbox at application submit, consent timestamp and IP stored. Pre-populates alert subscription list for Phase 2 nurse accounts.

---

## 10. Pages / Routes

```
/                            → Homepage
/jobs                        → All listings (filterable)
/jobs/[slug]                 → Job detail + Apply form
/alerts                      → Email alert signup
/for-employers               → Employer landing + pricing
/auth/register               → Org registration
/auth/login                  → Login
/dashboard                   → Account Manager overview
/dashboard/listings          → Manage listings
/dashboard/listings/new      → Post a job
/dashboard/listings/[id]     → Edit listing
/dashboard/applications      → All applications (AM only)
/dashboard/applications/[id] → Application detail + notes + status
/dashboard/team              → Manage recruiter accounts
/dashboard/billing           → Subscription + Stripe portal
/recruiter/listings          → Recruiter's assigned listings
/recruiter/applications      → Recruiter's assigned applications
/admin                       → Admin panel
/admin/listings              → Approve/reject listings
/admin/orgs                  → All organizations

# i18n — all above routes duplicated under /fr/
/fr/emplois                  → French listings page
/fr/emplois/[slug]           → French job detail
etc.
```

---

## 11. Monetization

### Subscription Tiers

#### Monthly (CAD)
| Tier | Price | Listings | Recruiters | Featured |
|---|---|---|---|---|
| Small | $99/mo | 3 active | 1 | 0 |
| Medium | $199/mo | 10 active | 3 | 0 |
| Large | $399/mo | Unlimited | Unlimited | 2/mo |

#### Annual — 2 months free (pay 10, get 12)
| Tier | Annual Price | Monthly Equivalent | Savings |
|---|---|---|---|
| Small | $990/yr | $82.50/mo | $198/yr |
| Medium | $1,990/yr | $165.83/mo | $398/yr |
| Large | $3,990/yr | $332.50/mo | $798/yr |

Annual plans billed upfront via Stripe. Shown as "Save 17%" on pricing page.

### Free Trial
> **Status: TBD — needs workshopping**  
> Standard SaaS trial is awkward here because value requires active listings + applicants (chicken-and-egg). Options to explore: time-limited trial with 1 free listing, or a "post your first listing free" one-time offer instead of a time-based trial.

### Revenue Projections (conservative)
- 10 orgs on Small = **$990/mo**
- 5 orgs on Medium + 3 on Large = **$2,192/mo**
- 20 Small + 10 Medium + 5 Large = **$5,975/mo**
- 50 orgs mixed = **$15,000+/mo**

---

## 12. Go-to-Market

1. **Manual outreach** — email 20-30 rural health centres and First Nations health orgs, offer 1 free month
2. **Facebook groups** — Canadian travel nursing groups, healthcare admin groups
3. **Reddit** — r/nursing, r/canadanurses, r/Quebec (for FR market)
4. **SEO** — "rural nursing contracts Canada", "contrats infirmiers Canada", "locum nursing jobs remote Canada"
5. **Nursing associations** — CINA, OIIQ (Quebec), provincial nursing colleges

---

## 13. Open Questions

- **Domain** — NorthShiftJobs.ca? NurseContracts.ca? PostesInfirmiers.ca?
- **Domain** — NorthShiftJobs.ca? NurseContracts.ca? PostesInfirmiers.ca?
- **Free trial** — TBD, needs workshopping. Standard time-based trial is awkward (no listings = no value). Leading option: "post your first listing free" one-time offer.
