# NorthShift Jobs — Build Plan (Active)

## Context
Building a bilingual SaaS job board for rural/remote contract nursing in Canada. Full spec at `/home/sami/Documents/Funtimes/Barb/Broker/rural-nursing-jobs-spec.md`. Backend in `/home/sami/Documents/Funtimes/Barb/Broker/northshift/backend/`.

## What's Done
- ASP.NET Core 8 project scaffolded, packages installed, builds clean
- Program.cs, appsettings.json, TokenService.cs, EmailService.cs written
- OLD models written (Employer, Listing, AlertSubscription) — need replacing
- AuthController partially written — needs rework for new model

## What's Next (in order)

### Step 1 — Replace data models with new account structure
- Delete `Models/Employer.cs`
- Write `Models/Organization.cs` (id, name, stripe ids, tier, subscription_status)
- Write `Models/User.cs` (id, org_id, name, email, password_hash, role enum AM/Recruiter)
- Update `Models/Listing.cs` (add title_fr, description_fr, language, org_id, posted_by_user_id)
- Update `Models/AlertSubscription.cs` (add language_pref)
- Write `Models/Application.cs` (id, listing_id, assigned_to_user_id, applicant fields, status, resume_s3_key)
- Write `Models/ApplicationNote.cs`
- Write `Models/ApplicationStatusLog.cs`
- Write `Models/NurseEmailConsent.cs`

### Step 2 — Update AppDbContext
- Replace Employers DbSet with Organizations + Users
- Add Applications, ApplicationNotes, ApplicationStatusLogs, NurseEmailConsents
- Update OnModelCreating with new indexes + constraints

### Step 3 — Update Program.cs services
- Add BCrypt package (needed for AuthController)
- Add S3 client for resume uploads

### Step 4 — Rewrite controllers
- AuthController (register org + AM, login, invite recruiter)
- ListingsController (CRUD, quota enforcement)
- ApplicationsController (submit, assign, status update, notes)
- AlertsController (subscribe, unsubscribe)
- AdminController (approve/reject listings, org overview)

### Step 5 — Dockerfile + docker-compose
- Dockerfile for ECS
- docker-compose.yml for local dev (API + Postgres)

### Step 6 — EF Core migration
- `dotnet ef migrations add InitialCreate`
- Verify migration SQL

### Step 7 — Verify build
- `dotnet build` clean

## Critical Files
- `backend/Models/` — full rewrite
- `backend/Data/AppDbContext.cs` — update
- `backend/Controllers/` — rewrite/create
- `backend/Dockerfile` — create
