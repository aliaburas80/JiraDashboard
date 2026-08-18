# EP-025 — CI/CD Production Gates

**Status:** In progress on `agent/ep-025-production-gates`

## Goal

Make the existing protected `quality` status prove that a candidate can migrate and boot the production architecture before it is allowed onto `main`.

## Existing enforcement

`main` is already protected by GitHub and requires the `quality` status check. EP-025 intentionally strengthens that same required job rather than introducing an optional new status that branch protection would not enforce.

## Required gate

The `Quality` workflow must fail if any of the following fail:

1. `npm ci` reproducible dependency install.
2. Prisma schema validation and client generation.
3. `prisma migrate deploy` against a clean PostgreSQL 16 service.
4. User-app and separate-Admin TypeScript/lint/test gates.
5. Production build of both Next.js applications.
6. User app startup through the real `npm start` production entrypoint.
7. User `/api/health` returns `status=ok`.
8. User `/api/ready` returns `status=ready` with database connectivity.
9. A migrated legacy `/api/admin/*` operation returns HTTP 410.
10. Separate Admin app starts through `npm run admin:start`.
11. Admin `/api/health` reports `delivery-clarity-admin` healthy.
12. Unauthenticated Admin operational APIs return HTTP 401.
13. Unauthenticated Admin operational pages redirect to `/login`.

## Production contract exercised in CI

The user runtime smoke test uses PostgreSQL plus an S3-shaped persistent-storage configuration. It does not use the temporary-storage CI escape hatch, so `scripts/start-production.mjs` must accept the same class of environment contract required by production.

User and Admin session secrets remain distinct, and `ADMIN_APP_URL` points to the separate Admin runtime during the smoke test.

## Deliberate exclusions

- Full browser/security regression remains EP-027.
- Dependency/CVE upgrade work remains the separately scheduled final pre-launch security round.
- This packet does not perform an actual Hostinger production deployment; it blocks merge candidates before the repository's production deployment can receive them.

## Acceptance

EP-025 is complete when a pull request containing this packet receives a green required `quality` check with the production runtime smoke step passing.
