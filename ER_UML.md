# NorthShift Jobs — ER & UML Diagrams

## ER Diagram

```mermaid
erDiagram
    ORGANIZATION {
        uuid id PK
        string name
        string stripe_customer_id
        string stripe_subscription_id
        enum tier
        enum subscription_status
        bool is_annual
        datetime subscription_expires_at
        datetime created_at
    }

    APP_USER {
        uuid id PK
        string user_type "TPH discriminator"
        string name
        string email
        string password_hash
        datetime created_at
        datetime last_login_at
        uuid org_id FK "OrgUser only"
        bool is_active "OrgUser only"
        string invite_token "OrgUser only"
        string billing_email "AccountManager only"
        string billing_name "AccountManager only"
        int permissions "Recruiter only (flags)"
    }

    LISTING {
        uuid id PK
        string slug
        uuid org_id FK
        uuid posted_by_user_id FK
        string title
        string title_fr
        string description
        string description_fr
        enum language
        enum role_type
        enum province
        string community
        string contract_length
        datetime start_date
        decimal pay_min
        decimal pay_max
        bool housing_provided
        bool travel_covered
        enum status
        bool featured
        datetime created_at
        datetime expires_at
    }

    APPLICATION {
        uuid id PK
        uuid listing_id FK
        uuid assigned_to_user_id FK
        string applicant_name
        string applicant_email
        string cover_message
        string resume_s3_key
        datetime availability_date
        enum status
        datetime created_at
        datetime updated_at
    }

    LICENCE {
        uuid application_id PK,FK
        enum province PK
        string licence_number
        datetime expiry
    }

    APPLICATION_NOTE {
        uuid id PK
        uuid application_id FK
        uuid written_by_user_id FK
        string body
        datetime created_at
    }

    APPLICATION_STATUS_LOG {
        uuid id PK
        uuid application_id FK
        uuid changed_by_user_id FK
        enum from_status
        enum to_status
        datetime changed_at
    }

    ALERT_SUBSCRIPTION {
        uuid id PK
        string email
        enum_array provinces
        enum_array role_types
        enum language_pref
        string unsubscribe_token
        datetime created_at
    }

    NURSE_EMAIL_CONSENT {
        uuid id PK
        string email
        uuid source_listing_id FK
        string consent_ip
        datetime consented_at
        string unsubscribe_token
    }

    ORGANIZATION ||--o{ APP_USER : "has members"
    ORGANIZATION ||--o{ LISTING : "owns"
    APP_USER ||--o{ LISTING : "posts"
    APP_USER ||--o{ APPLICATION : "assigned to"
    APP_USER ||--o{ APPLICATION_NOTE : "writes"
    APP_USER ||--o{ APPLICATION_STATUS_LOG : "changes"
    LISTING ||--o{ APPLICATION : "receives"
    LISTING ||--o{ NURSE_EMAIL_CONSENT : "source of"
    APPLICATION ||--o{ LICENCE : "has"
    APPLICATION ||--o{ APPLICATION_NOTE : "has"
    APPLICATION ||--o{ APPLICATION_STATUS_LOG : "tracked by"
```

---

## UML Class Diagram

```mermaid
classDiagram
    class AppUser {
        <<abstract>>
        +Guid Id
        +string Name
        +string Email
        +string PasswordHash
        +DateTime CreatedAt
        +DateTime? LastLoginAt
    }

    class OrgUser {
        <<abstract>>
        +Guid OrgId
        +bool IsActive
        +string? InviteToken
        +Organization Org
    }

    class Admin {
    }

    class AccountManager {
        +string? BillingEmail
        +string? BillingName
        +ICollection~Listing~ Listings
        +ICollection~Application~ AssignedApplications
    }

    class Recruiter {
        +RecruiterPermissions Permissions
        +ICollection~Listing~ Listings
        +ICollection~Application~ AssignedApplications
    }

    class ICanPostJobs {
        <<interface>>
        +ICollection~Listing~ Listings
    }

    class ICanManageApplications {
        <<interface>>
        +ICollection~Application~ AssignedApplications
    }

    class Organization {
        +Guid Id
        +string Name
        +string? StripeCustomerId
        +string? StripeSubscriptionId
        +SubscriptionTier Tier
        +SubscriptionStatus SubscriptionStatus
        +bool IsAnnual
        +DateTime? SubscriptionExpiresAt
        +int ListingQuota
        +int RecruiterQuota
        +int FeaturedListingSlots
        +ICollection~OrgUser~ Users
        +ICollection~Listing~ Listings
    }

    class Listing {
        +Guid Id
        +string Slug
        +string Title
        +string? TitleFr
        +string Description
        +string? DescriptionFr
        +ListingLanguage Language
        +RoleType RoleType
        +Province Province
        +string Community
        +string ContractLength
        +DateTime? StartDate
        +decimal? PayMin
        +decimal? PayMax
        +bool HousingProvided
        +bool TravelCovered
        +ListingStatus Status
        +bool Featured
        +Guid OrgId
        +Guid PostedByUserId
        +ICollection~Application~ Applications
    }

    class Application {
        +Guid Id
        +Guid ListingId
        +Guid? AssignedToUserId
        +string ApplicantName
        +string ApplicantEmail
        +string CoverMessage
        +string ResumeS3Key
        +DateTime AvailabilityDate
        +ApplicationStatus Status
        +DateTime CreatedAt
        +DateTime UpdatedAt
        +ICollection~Licence~ Licences
        +ICollection~ApplicationNote~ Notes
        +ICollection~ApplicationStatusLog~ StatusLogs
    }

    class Licence {
        +Guid ApplicationId "PK"
        +Province Province "PK"
        +string? LicenceNumber
        +DateTime? Expiry
    }

    class ApplicationNote {
        +Guid Id
        +Guid ApplicationId
        +Guid WrittenByUserId
        +string Body
        +DateTime CreatedAt
        +Application Application
        +OrgUser WrittenBy
    }

    class ApplicationStatusLog {
        +Guid Id
        +Guid ApplicationId
        +Guid ChangedByUserId
        +ApplicationStatus FromStatus
        +ApplicationStatus ToStatus
        +DateTime ChangedAt
        +Application Application
        +AppUser ChangedBy
    }

    class AlertSubscription {
        +Guid Id
        +string Email
        +Province[] Provinces
        +RoleType[] RoleTypes
        +LanguagePreference LanguagePref
        +string UnsubscribeToken
        +DateTime CreatedAt
    }

    class NurseEmailConsent {
        +Guid Id
        +string Email
        +Guid SourceListingId
        +string ConsentIp
        +DateTime ConsentedAt
        +string UnsubscribeToken
    }

    %% Inheritance
    AppUser <|-- Admin
    AppUser <|-- OrgUser
    OrgUser <|-- AccountManager
    OrgUser <|-- Recruiter

    %% Interface implementation
    AccountManager ..|> ICanPostJobs
    AccountManager ..|> ICanManageApplications
    Recruiter ..|> ICanPostJobs
    Recruiter ..|> ICanManageApplications

    %% Associations
    Organization "1" --> "0..*" OrgUser : has members
    Organization "1" --> "0..*" Listing : owns
    AppUser "1" --> "0..*" Listing : posts
    AppUser "1" --> "0..*" Application : assigned to
    OrgUser "1" --> "0..*" ApplicationNote : writes
    AppUser "1" --> "0..*" ApplicationStatusLog : changes
    Listing "1" --> "0..*" Application : receives
    Listing "1" --> "0..*" NurseEmailConsent : source of
    Application "1" --> "0..*" Licence : has
    Application "1" --> "0..*" ApplicationNote : has
    Application "1" --> "0..*" ApplicationStatusLog : tracked by
```

---

## Key Design Notes

| Decision | Rationale |
|---|---|
| TPH (single Users table) | One discriminator column, easy to query across user types, no joins for auth |
| Composite PK on Licence (ApplicationId + Province) | Enforces one licence per province per application at DB level |
| `OrgUser` abstract middle layer | Cleanly separates org-scoped users from Admin and future Nurse |
| `RecruiterPermissions` as flags enum | Granular, additive permissions without a full permission table |
| `AppUser` on StatusLog, `OrgUser` on Notes | Status can be changed by any internal user; notes are org-member only |
| Province as enum | Enforces valid Canadian province/territory codes at the type level |
