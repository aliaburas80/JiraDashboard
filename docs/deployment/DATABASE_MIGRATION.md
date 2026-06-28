# Database Migration: SQLite to Neon PostgreSQL

Delivery Clarity now uses PostgreSQL for production.

## What Changed

- `prisma/schema.prisma` now uses `provider = "postgresql"`.
- SQLite migrations were archived in `prisma/migrations-sqlite-archive/`.
- The active Prisma migration history starts with `prisma/migrations/20260629000000_postgresql_baseline/`.
- The existing SQLite database files were not deleted.

## Current Repository Data

The checked SQLite database `prisma/data/delivery_clarity.db` was inspected on 2026-06-29. It was small and contained zero rows in the legacy tables present in that file, so no live user-data import is required for this repository state.

## Creating the Neon Schema

Use a non-production Neon branch first:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require"
npm ci
npm run db:generate
npm run db:migrate:deploy
```

Seed only when appropriate:

```bash
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="change-this" npm run db:seed
```

## If You Have Meaningful SQLite Data

Do not run destructive Prisma commands against production. Do not delete the SQLite file.

Recommended approach:

1. Back up the SQLite file outside the repo.
2. Create a Neon development branch.
3. Apply PostgreSQL migrations with `npm run db:migrate:deploy`.
4. Export SQLite tables to JSON or CSV.
5. Import rows in dependency order: `User`, `Session`, `JiraConnection`, `ImportLog`, `DashboardSnapshot`, `AuditEvent`, `UserAddRequest`, `Notification`, `SystemErrorLog`.
6. Preserve primary keys where safe so relationships remain valid.
7. Validate source and destination row counts.
8. Run application smoke tests against the Neon branch.
9. Repeat against production only after a verified dry run and backup.

Avoid `prisma migrate reset` and `prisma db push --accept-data-loss` for production.

## Rollback

Application rollback is handled through Koyeb or Git. Database rollback is not automatically guaranteed after destructive schema migrations. Back up Neon before high-risk migrations and prefer additive migrations where possible.
