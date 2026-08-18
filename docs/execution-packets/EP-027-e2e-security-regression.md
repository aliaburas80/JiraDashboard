# EP-027 — End-to-End and Security Regression

## Goal

Close the pre-launch regression gap between the user-facing application and the separate MFA-protected Admin runtime. EP-027 proves the security boundaries established by EP-022/EP-023/EP-024 against real PostgreSQL and production-built Next.js runtimes, while preserving the existing cross-browser user critical path.

## Source requirements

This packet is grounded in the current repository contracts:

- `docs/planning/MVP-EXECUTION-PLAN.md` — EP-027 is the E2E + Security Tests critical-path packet after Owner Admin + MFA.
- `admin-app/README.md` — Admin password + TOTP/recovery MFA, `dc_admin_session`, Owner-only operations, organization-derived authorization, and user-app Admin cutover.
- `docs/execution-packets/EP-024-admin-operational-pages.md` — organization operations require a fully MFA-authenticated Admin session; deployment-wide operations require `isSuperAdmin=true`.
- `product/MULTI_TENANT_ORG_DESIGN.md` §3.2/§3a.4 — adversarial cross-organization tests are the mandatory second isolation layer while database-level RLS is not yet the active runtime control.

## Regression matrix

| ID | Security contract | Automated proof |
|---|---|---|
| EP027-AUTH-01 | Admin operational APIs are private | Unauthenticated `/api/ops/users` returns 401 |
| EP027-AUTH-02 | User and Admin session boundaries are independent | Real `dc_session` cannot authorize Admin APIs; real `dc_admin_session` cannot authorize user APIs |
| EP027-AUTH-03 | Password alone is not Admin authentication | Password-verified pre-MFA session receives 401 from operational APIs |
| EP027-MFA-01 | First Admin sign-in requires TOTP enrollment | Real enrollment start + generated TOTP completes Admin authentication |
| EP027-MFA-02 | TOTP steps cannot be replayed | The TOTP counter consumed at enrollment is rejected on the next login |
| EP027-MFA-03 | Recovery codes are single-use | A recovery code succeeds once, decrements remaining codes, and replay returns 401 |
| EP027-TENANT-01 | Organization-scoped reads never expose another organization | Users + Audit for Org A exclude seeded Org B data |
| EP027-TENANT-02 | Cross-organization mutation is denied | PATCH/DELETE of an Org B user through an Org A Admin session return 404 and leave the row unchanged |
| EP027-OWNER-01 | Deployment-wide operations are Owner Admin only | Ordinary Admin receives 403 from Diagnostics |
| EP027-CUTOVER-01 | Migrated user-app Admin APIs cannot bypass separate Admin MFA | User-app `/api/admin/users` returns 410 |
| EP027-COOKIE-01 | Admin cookie remains hardened | `dc_admin_session` is HTTP-only and SameSite=Strict |

## CI topology

EP-027 runs both production-built applications in the same Playwright job against the same clean PostgreSQL service:

- User app: `http://127.0.0.1:3100`
- Separate Admin app: `http://127.0.0.1:3101`
- User session secret: `SESSION_SECRET`
- Admin session secret: `ADMIN_SESSION_SECRET` (must be different)
- User cookie: `dc_session`
- Admin cookie: `dc_admin_session`

The adversarial Admin security scenario runs once in Desktop Chrome. Existing user critical-path tests continue across Desktop Chrome, Firefox, WebKit/Safari, Tablet, and Mobile. This avoids repeating a stateful security fixture five times while retaining cross-browser UI coverage.

## Evidence

`tests/e2e/admin-security-regression.spec.ts` emits an `[EP-027]` JSON record and attaches `ep-027-security-regression.json` to the Playwright report. The evidence records the observed HTTP decisions for each boundary without containing passwords, TOTP secrets, or recovery-code values.

## Non-goals

- EP-004 dependency/CVE remediation remains its own final pre-launch full-product round.
- EP-028 staging deployment and staging-origin verification remain separate.
- This packet does not claim PostgreSQL RLS is active; it verifies the current application-layer tenancy boundary and the repository-required adversarial integration layer.
- This packet does not weaken or replace the existing Quality, production runtime, or 7,000-issue capacity gates.

## Exit gate

- [ ] `npm run typecheck`
- [ ] `npm run admin:typecheck`
- [ ] repo-wide lint + zero-warning deployment lint
- [ ] Jest suite green
- [ ] user production build green
- [ ] separate Admin production build green
- [ ] production runtime smoke gate green
- [ ] Playwright user critical path green
- [ ] EP-027 Admin security regression green on real PostgreSQL
- [ ] `[EP-027]` evidence present in CI log/report
- [ ] final review confirms no security boundary was bypassed or weakened to make the test pass

## Status

**In progress** — implementation branch opened from the exact merge commit of EP-026. CI evidence must be recorded before this packet is marked complete.
