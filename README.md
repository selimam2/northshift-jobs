# NorthShift Jobs

Bilingual job board for contract and locum nursing in rural and remote Canada.

## Docs
- [`docs/spec.md`](docs/spec.md) — full product spec (features, monetization, go-to-market)
- [`docs/build-plan.md`](docs/build-plan.md) — current build plan and progress
- [`ER_UML.md`](ER_UML.md) — ER diagram and UML class diagram (Mermaid)

## Stack
| Layer | Choice |
|---|---|
| Frontend | Next.js + Tailwind + next-intl → Vercel |
| Backend | ASP.NET Core 8 (C#) + EF Core → AWS ECS Fargate |
| Database | PostgreSQL → AWS RDS |
| Storage | AWS S3 (resume PDFs) |
| Payments | Stripe Subscriptions |
| Email | Resend |
| IaC | Terraform (ca-central-1) |

## Structure
```
northshift/
├── backend/        ASP.NET Core 8 API
├── frontend/       Next.js (coming soon)
├── infra/          Terraform (coming soon)
└── docs/           Spec, requirements, build plan
```

## Local Dev
```bash
# Coming soon — docker-compose up
```
