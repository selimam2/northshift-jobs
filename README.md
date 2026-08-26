# NorthShift Jobs

**Bilingual job board for contract and locum nursing in rural and remote Canada.**

Employers post contracts and manage applicants under a subscription; nurses browse
and apply for free. English and French throughout, because the audience spans both.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js + Tailwind + next-intl |
| Backend | ASP.NET Core 8 (C#) + EF Core |
| Database | PostgreSQL 16 (containerised) |
| Reverse proxy | Caddy — automatic TLS, HTTP/3 |
| Storage | AWS S3 (résumé PDFs) |
| Payments | Stripe Subscriptions |
| Email | Resend |
| Auth | JWT + BCrypt |
| IaC | Terraform (us-east-1) |
| Runtime | Single EC2 instance, Docker Compose |

## Architecture

Everything runs as containers on one EC2 instance behind Caddy, which terminates
TLS and reverse-proxies to the API and the Next.js frontend. Postgres runs
alongside them with a volume on the instance's EBS root, backed up on a schedule
to S3.

```
            ┌──────────────────── EC2 (t3.small) ────────────────────┐
 :443 ─────▶│  Caddy  ──┬──▶  Next.js frontend                       │
  TLS/HTTP3 │           └──▶  ASP.NET Core API  ──▶  Postgres (vol)  │
            └────────────────────────────┬───────────────────────────┘
                                         ├──▶ S3      (résumé PDFs, backups)
                                         ├──▶ Stripe  (subscriptions, webhooks)
                                         └──▶ Resend  (transactional email)
```

### Why one instance

This started on ECS Fargate + RDS + an Application Load Balancer — the shape you
reach for by default. At this stage of the product it was the wrong call, and the
bill made that concrete:

| | Managed stack (May) | Single instance (June onward) |
|---|---|---|
| Compute | ECS Fargate — $36.73 | EC2 t3.small — $14.40 |
| Load balancing | ALB — $16.75 | Caddy on the box — $0 |
| Database | RDS — $15.84 | Postgres container — $0 |
| Logging | CloudWatch — $15.90 | container logs + journald — $0 |
| Networking | VPC/NAT — $18.61 | VPC — $7.62 |
| **Total infrastructure** | **~$104/mo** | **~$27/mo** |

**A ~74% reduction, holding steady for three months.**

The line that surprised me was CloudWatch: at $15.90/month, log ingestion cost
more than the database. Fargate task logs go to CloudWatch by default and the
charge scales with how chatty the app is, which is not where anyone looks first.

The tradeoffs are real and deliberate — one instance is a single point of failure,
scaling is vertical, and deploys are brief downtime rather than rolling. For a
pre-revenue product serving a niche market, paying ~$77/month for zero-downtime
deploys and multi-AZ failover was buying insurance against a risk that did not
exist yet. The managed pieces are worth re-adding when traffic justifies them,
and Terraform makes that a reversible decision rather than a rewrite.

---

## Local development

```bash
docker compose up          # API, frontend, Postgres
```

Copy `backend/appsettings.json` values into user-secrets or environment
variables — the committed file holds placeholders only, never live credentials.

### Seeding

Both seeders are configuration-gated and no-op unless explicitly set, so a
deployment that does not configure them never creates a login:

| Key | Effect |
|---|---|
| `Seed:AdminEmail` + `Seed:AdminPassword` | Creates the initial admin account |
| `Seed:AdminName` | Display name (defaults to "Administrator") |
| `Seed:DemoPassword` | Enables demo orgs, recruiters, and listings — development only |

## Structure

```
backend/         ASP.NET Core 8 API — controllers, services, EF migrations
frontend/        Next.js app, bilingual via next-intl
terraform/       VPC, EC2, security groups, Route53, S3, ECR
caddy/           reverse proxy + TLS config
scripts/         deploy, database migrate, database backup
docs/            product spec and build plan
```

## Docs

- [`docs/spec.md`](docs/spec.md) — product spec: users, roles, features, data models
- [`ER_UML.md`](ER_UML.md) — ER and UML class diagrams (Mermaid, renders inline)
- [`TEST_PLAN.md`](TEST_PLAN.md) — test plan
- [`STRIPE_REQUIREMENTS.md`](STRIPE_REQUIREMENTS.md) — subscription and webhook behaviour

## License

MIT — see [LICENSE](LICENSE).
