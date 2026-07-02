# EP-001 — Repository and TODO Reconciliation

```
Execution Packet ID:   EP-001
Title:                 Repository and TODO Reconciliation
Priority:              P0 — Must complete before any MVP implementation
MVP Classification:    Foundation — No feature work proceeds without this
Architecture Decision IDs: None yet
Related TODO IDs:      P0A-01
Dependencies:          None
Blocked By:            Nothing
Estimated Effort:      Analysis only (no implementation)
Approved By:           Ali Abu Ras (Product Owner) — master prompt v1
Status:                Complete
```

---

## Business Objective

Before building new features for the online MVP, establish a verified, honest picture of what the repository actually contains, what is working, what is missing, and what is at risk. This packet prevents implementation built on false assumptions.

---

## Repository Inventory

### Public routes (no authentication required)

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Root — redirects to login or dashboard |
| `/login` | `app/login/page.tsx` | Login form |
| `/register` | `app/register/page.tsx` | Registration form (admin-only; no public flow) |
| `/promo` | `app/promo/page.tsx` | Marketing/promotional page |
| `/api/health` | `app/api/health/route.ts` | Health check |
| `/api/ready` | `app/api/ready/route.ts` | Readiness check |
| `/api/auth/login` | `app/api/auth/login/route.ts` | Login endpoint |
| `/api/feedback` | `app/api/feedback/route.ts` | Feedback submission (public, rate-limited) |
| `/api/events/error` | `app/api/events/error/route.ts` | Client error reporting (public, rate-limited) |
| `/api/demo-request` | `app/api/demo-request/route.ts` | Demo request form |

### Authenticated routes (user session required)

| Route | Purpose | Auth Status |
|---|---|---|
| `/dashboard/*` (15 pages) | Delivery analytics dashboards | Session guard in API |
| `/summary` | Dashboard summary | Session guard |
| `/explore` | Work item explorer | Session guard |
| `/forecast` | Forecasting | Session guard |
| `/trends` | Trend analysis | Session guard |
| `/roadmap` | Roadmap view | Session guard |
| `/retro` | Retrospective | Session guard |
| `/snapshots` | Snapshot comparison | Session guard |
| `/work-explorer` | Work explorer | Session guard |
| `/flow-health` | Flow health standalone | Session guard |
| `/teams` | Team analytics | Session guard |
| `/profile` | User profile | Session guard |
| `/column-mapping` | Column mapping for upload | Session guard |
| `/help` | Help content | Session guard |
| `/developer` | Developer docs | Session guard |
| `/glossary` | Glossary | Session guard |
| `/change-password` | Change password | Session guard |
| `/members` | Member directory | Session guard |

### Admin routes (admin role + session required)

| Route | Purpose |
|---|---|
| `/admin/users` | User management |
| `/admin/settings` | App configuration (11 sub-tabs) |
| `/admin/theme` | Theme/branding |
| `/admin/diagnostics` | System diagnostics |
| `/admin/security` | Security settings |
| `/admin/logs` | Import logs |
| `/admin/system-errors` | System error log |
| `/admin/audit` | Audit events analytics (new) |
| `/admin/feedback` | Feedback triage (new) |

**CRITICAL FINDING:** Admin is embedded in the main Next.js application. It shares the same session cookie, the same build, and the same domain. A compromised user session cannot reach admin routes due to role checking, but there is no separate session, separate secret, or separate authentication boundary. This violates the master plan requirement for a genuinely separate admin application.

### API routes — count

- Auth APIs: 5 (login, logout, register, me, change-password)
- Admin APIs: 23 routes
- User/data APIs: 35 routes
- Public APIs: 5 routes
- **Total: 68 API routes**

### Services and modules

| Area | Location | Status |
|---|---|---|
| Analytics engine | `src/services/`, `src/lib/metrics*` | ✅ Comprehensive, 760 tests |
| Upload pipeline | `app/api/upload/route.ts` | ✅ Auth-guarded; no entitlement guard |
| Export pipeline | `src/lib/exportUtils.ts`, `src/lib/excelExport.ts` | ✅ |
| Authentication | `src/lib/session.ts`, `app/api/auth/*` | ✅ Hardened (P0A-05) |
| Email | `src/lib/email.ts` | ✅ Resend + SMTP fallback |
| Encryption | `src/lib/secret-field.ts` | ✅ AES-256-GCM |
| Rate limiting | DB-backed via LoginAttempt table | ✅ All major endpoints |
| Error monitoring | `src/lib/errorReporter.ts`, `app/api/events/error/route.ts` | ✅ Done (P0B-08) |
| Feedback | `app/api/feedback/route.ts`, `src/components/feedback/` | ✅ Done (P0B-09) |
| Audit logging | `src/lib/system-error-logger.ts` | ✅ safeAuditEvent() available |
| Jira API | `src/server/gateway/`, `app/api/admin/jira-connections/` | ⚠️ Implemented, needs SSRF/security review |
| Cloud storage | `src/lib/cloud-storage.ts` | ✅ S3/Azure/GCS |
| Retrospective | `src/services/retro/` | ✅ |
| Forecast | `src/services/forecast/` | ✅ |
| Notifications | `app/api/notifications/` | ✅ |
| Feature flags | None | ❌ Not implemented |
| Workspace model | None | ❌ Not in schema |
| Trial entitlement | None | ❌ Not in schema |
| Consent records | None | ❌ Not in schema |
| Product analytics | None | ❌ Not implemented |

### Test suite

| Suite type | Count | Status |
|---|---|---|
| Unit (domain/formula) | ~40 suites | ✅ All passing |
| Integration (API/DB) | ~30 suites | ✅ All passing |
| Total | 78 suites, 760 tests | ✅ All passing |

**Missing test categories:**
- Cross-workspace negative access tests (workspace doesn't exist yet)
- Email verification flow tests
- Password reset flow tests
- Trial entitlement state machine tests
- Consent flow tests
- Registration flow tests
- End-to-end tests (none exist)
- Security tests (no SSRF, no formula injection, no cross-account access tests)

### Migrations

| Migration | Date | Purpose |
|---|---|---|
| `20260629000000_postgresql_baseline` | 2026-06-29 | Full PostgreSQL baseline (was SQLite) |
| `20260630190000_add_jira_connection_token` | 2026-06-30 | Jira encrypted token |
| `20260630215555_add_smtp_settings` | 2026-06-30 | SMTP settings table |
| `20260701200134_persistent_login_rate_limiter` | 2026-07-01 | LoginAttempt table |
| `20260701212343_add_app_error_monitoring` | 2026-07-01 | AppError table |
| `20260702000001_add_performance_indexes` | 2026-07-02 | Index additions |
| `20260702000002_add_feedback` | 2026-07-02 | Feedback table |

**Missing migrations (will be needed for MVP):**
- Workspace and WorkspaceMember tables
- EmailVerificationToken table
- PasswordResetToken table
- ConsentRecord table
- Entitlement table
- ProductAnalyticsEvent table
- FeatureFlag table
- workspaceId columns on User, ImportLog, DashboardSnapshot, JiraConnection

### Environment variables

Confirmed in `.env.example`:
- `DATABASE_URL` — Neon PostgreSQL (required)
- `SESSION_SECRET` — iron-session (throws in production if missing)
- `CONFIG_ENCRYPTION_KEY` — AES-256-GCM (required for Jira config)
- `RESEND_API_KEY` — Email via Resend
- `SMTP_*` — fallback email
- `NEXT_PUBLIC_APP_URL` — required for metadata

Missing for MVP:
- `ADMIN_APP_URL` — separate admin application
- `ADMIN_SESSION_SECRET` — separate admin session
- `FEATURE_PUBLIC_SIGNUP` — feature flag
- `FEATURE_JIRA_API_SYNC` — Jira API feature flag
- `SOFT_LAUNCH_MAX_ACCOUNTS` — account limit
- `TRIAL_REPLACEMENT_WINDOW_HOURS` — trial config

### Other artifacts

| Artifact | Status | Risk |
|---|---|---|
| `frontend/` directory | Orphaned CRA app, not imported | Low-medium — contributes 59 ESLint warnings |
| `backend/` directory | Empty stub with package.json | Low — confusing but harmless |
| `data/` directory | Contains test files AND sensitive credentials | **CRITICAL — see below** |
| `instrumentation.disabled.ts` | Disabled intentionally | ✅ Documented |
| `docker-compose.yml` | Present but untested | Medium |
| `render.yaml` | Render deployment config | ✅ Deployed |

---

## CRITICAL SECURITY FINDING

The `data/` directory in the repository contains:

- `data/AliAbuRas80_accessKeys-jira.csv` — **Appears to be Jira API access keys**
- `data/AliAbuRas80_accessKeys-new.csv` — **Appears to be API keys**
- `data/Backup-codes-aliaburas80.txt` — **Appears to be account backup codes**

**These files must be evaluated immediately.** If they are real credentials:
1. They must be rotated/revoked immediately (they are in git history)
2. They must be removed from the repository and from git history
3. A `.gitignore` rule must prevent future credential files in `data/`

**Product Owner action required:** Confirm whether these files contain real credentials that need to be rotated.

---

## TODO-to-Code Audit — P0 Items

### P0-A Gate (Existing Product Completion)

| ID | Requirement | Code Evidence | Test Evidence | Verified Status | Missing Work |
|---|---|---|---|---|---|
| P0A-01 | Repository and documentation audit | This document | N/A | ✅ In progress | Finalize and present to Product Owner |
| P0A-02 | Upload pipeline reliability | `app/api/upload/route.ts` — auth guard, DB rate limit, validation | `src/__tests__/uploadUserId.test.ts`, `columnMapping.test.ts` | ⚠️ Foundation exists | No entitlement guard; no idempotency key; no large-file limit documented; no negative error tests |
| P0A-03 | Metric calculation correctness | `src/services/metrics*.ts`, `src/lib/metrics*.ts` | 760 tests including `metricFormulas.test.ts` (22 regression), `throughput.test.ts`, `releaseReadiness.test.ts` | ⚠️ Partially verified | No golden dataset framework; formula reference document incomplete; no version-locked regression baselines |
| P0A-04 | Data isolation and workspace security | All API routes scope by `session.userId` | `src/__tests__/uploadUserId.test.ts` (TC-A-14b) | ⚠️ Partial — userId scoped | NO workspace model; NO cross-user negative tests; no IDOR proof |
| P0A-05 | Authentication/session baseline | `src/lib/session.ts` — throws in prod; DB rate limiter; countdown UI | `auth.test.ts`, `changePassword.test.ts`, `logout.test.ts` | ✅ Done (2026-07-01) | Manual verification on live Render still pending |
| P0A-06 | Database production readiness | 7 migrations committed; Neon provisioned | Prisma validate passes | ⚠️ Partial | No backup verification; no restore test; no RPO/RTO documented |
| P0A-07 | Audit and operational logging | `safeAuditEvent()` used in 25+ routes; structured startup logging | `gateway.test.ts` | ⚠️ Partial | Full sensitive-action coverage not verified; no alert thresholds |
| P0A-08 | Release/version discipline | `RELEASE_NOTES.md` maintained; `/api/ready` returns version | Build passes with version | ⚠️ Partial | Runtime version not in dashboard footer or about page; no rollback procedure documented |
| P0A-09 | Performance baseline | No baseline exists | No performance tests | ❌ Not started | Upload/analysis/dashboard performance untested at 3k–7k issues |
| P0A-10 | Core documentation | BRD, SRS, RELEASE_NOTES, DEVELOPER_GUIDE maintained | Reviewed in prior sessions | ⚠️ Partial | Calculation reference and full data-model doc not complete |

### P0-B Gate (Safe Soft-Launch Essentials)

| ID | Requirement | Code Evidence | Test Evidence | Verified Status | Missing Work |
|---|---|---|---|---|---|
| P0B-01 | Signup and role profile | `app/register/page.tsx` + `app/api/auth/register/route.ts` exist | `auth.test.ts` has basic register test | ❌ Not started | Public registration exists as an API but is admin-only; no persona selection; no email verification; no public onboarding flow |
| P0B-02 | Trial entitlement | Nothing | Nothing | ❌ Not started | No schema, no logic, no tests |
| P0B-03 | Consent and privacy controls | Nothing | Nothing | ❌ Not started | No schema, no UI, no privacy notice route |
| P0B-04 | Data lifecycle (deletion/export) | `dataRetention.service.ts` (partial) | `dataRetention.test.ts` | ❌ Not started | No account-deletion flow; no data-export endpoint; no expiry jobs |
| P0B-05 | Event taxonomy and SDK | Nothing | Nothing | ❌ Not started | No event schema, no client SDK, no server ingestion |
| P0B-06 | IndexedDB event queue | Nothing | Nothing | ❌ Not started | No implementation |
| P0B-07 | Server event ingestion | Nothing | Nothing | ❌ Not started | No endpoint, no dedup, no storage |
| P0B-08 | Structured error monitoring | `app/api/events/error/route.ts`, `AppError` model, `GlobalErrorHandler` | `cloudRestoreHardening.test.ts` (partial) | ✅ Done (P0B-08) | Minor: no admin alert thresholds; admin page now exists (/admin/system-errors) |
| P0B-09 | Feedback control | `app/api/feedback/route.ts`, `Feedback` model, `FeedbackButton` | Prisma schema + manual test | ✅ Done (P0B-09) | Screenshot support not implemented (acceptable per MVP scope) |
| P0B-10 | Separate admin application | Nothing separate — admin is in main app | Nothing | ❌ Not started | Admin embedded in same Next.js app; shared session; no separate build |
| P0B-11 | Owner Admin bootstrap | Nothing | Nothing | ❌ Not started | No CLI, no secure creation flow |
| P0B-12 | Admin user management (MFA) | User management UI exists in `/admin/users` | `adminUsers.test.ts` | ⚠️ Partial | No MFA; no invite flow; no separate session; cannot be "done" without P0B-10 |
| P0B-13 | Minimum admin operations | Audit events, feedback, errors, import logs pages all built | Basic API tests | ✅ Partially done (in main app) | Cannot be marked fully done until P0B-10 (separate admin app) exists |
| P0B-14 | Launch security review | Nothing formal | `securityCheck.test.ts` (partial) | ❌ Not started | Depends on all P0-B being complete |
| P0B-15 | Soft-launch readiness test | Nothing | Nothing | ❌ Not started | Depends on all P0-A/P0-B |

---

## Code-to-TODO Audit — Items Found in Code Not Adequately Tracked

| Finding | Location | Risk | Action |
|---|---|---|---|
| `app/register/page.tsx` — registration page exists but is not self-service | `app/register/page.tsx` | Medium — could confuse users if accidentally reached | Add middleware guard or repurpose for public signup in P0B-01 |
| `data/` contains apparent credentials | `data/AliAbuRas80_accessKeys-*.csv`, `data/Backup-codes-aliaburas80.txt` | CRITICAL | Product Owner to confirm and rotate if real |
| `frontend/` — orphaned CRA app | `frontend/package.json` | Low | ORPHAN-01: Product Owner decision to remove or exclude from ESLint |
| `backend/` — empty stub | `backend/package.json` | Low | Remove or document future purpose |
| `app/api/auth/register/route.ts` — no email verification | `app/api/auth/register/route.ts` | High | Will be replaced/enhanced in EP-011 |
| `app/api/admin/jira-connections/` — Jira API active with no SSRF test | All Jira connection routes | High | Must be behind feature flag until security review passes |
| `app/customer/page.tsx` — unknown purpose | `app/customer/page.tsx` | Low | Investigate — may be removable |
| `app/backend/page.tsx` — internal debug view | `app/backend/page.tsx` | Medium — publicly accessible | Confirm whether this should be gated |
| `app/charts/page.tsx` — isolated chart page | `app/charts/page.tsx` | Low | Confirm visibility in public MVP |
| `app/portfolio/page.tsx` — standalone portfolio | `app/portfolio/page.tsx` | Low | Confirm visibility in public MVP |
| 17 npm vulnerabilities | `npm audit` | HIGH/CRITICAL | EP-004 must resolve before launch |
| 1,524 ESLint style warnings | All tier 1–5 files | Low (not errors) | Progressive cleanup; not a launch blocker but tracked |

---

## Reconciliation Matrix — P0/P1 MVP Items

| ID | Requirement | Code Evidence | Test Evidence | Migration Evidence | Doc Evidence | Recorded Status | Verified Status | Missing Work | MVP Class | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|
| P0A-01 | Repo audit | EP-001 | N/A | N/A | This doc | ❌ Not started | ✅ In progress | Present findings | P0 | Approve EP-001 output |
| P0A-02 | Upload reliability | Route exists, auth-guarded | Basic tests | N/A | Partial | ❌ Not started | ⚠️ Foundation | Entitlement guard; idempotency; negative tests | P0 | EP-016 |
| P0A-03 | Metric correctness | Engine implemented | 760 tests | N/A | Partial | ❌ Not started | ⚠️ Partial | Golden datasets; formula reference | P0 | EP-017 |
| P0A-04 | Data isolation | userId-scoped queries | 1 auth test | N/A | None | ❌ Not started | ⚠️ Partial | Workspace model; negative tests | P0 | EP-006→EP-009 |
| P0A-05 | Auth/session | Hardened session | Auth tests | LoginAttempt migration | RELEASE_NOTES | ✅ Done | ✅ Done | Manual live test pending | P0 | Verify on Render |
| P0A-06 | DB readiness | Neon live, 7 migrations | Prisma validate | 7 migrations | DEPLOYMENT_GUIDE | 🟡 Partial | ⚠️ Partial | Backup/restore test | P0 | EP-005 |
| P0A-07 | Audit logging | safeAuditEvent() | gateway.test | N/A | Partial | 🟡 Partial | ⚠️ Partial | Full coverage audit | P0 | EP-002 baseline |
| P0A-08 | Version discipline | /api/ready returns version | Build passes | N/A | RELEASE_NOTES | 🟡 Partial | ⚠️ Partial | Runtime version in UI; rollback doc | P0 | EP-003 |
| P0A-09 | Performance baseline | Nothing | Nothing | N/A | Nothing | ❌ Not started | ❌ Not started | All targets | P0 | EP-026 |
| P0A-10 | Core documentation | BRD/SRS maintained | N/A | N/A | Partial | 🟡 Partial | ⚠️ Partial | Calculation reference; data model | P0 | EP-001/ongoing |
| P0B-01 | Signup + persona | Register API (admin only) | Basic auth test | None | None | ❌ Not started | ❌ Not started | Public flow; persona; email verify | P0 | EP-011 |
| P0B-02 | Trial entitlement | Nothing | Nothing | None | None | ❌ Not started | ❌ Not started | Everything | P0 | EP-015 |
| P0B-03 | Consent/privacy | Nothing | Nothing | None | None | ❌ Not started | ❌ Not started | Everything | P0 | EP-014 |
| P0B-04 | Data lifecycle | dataRetention partial | dataRetention.test | None | None | ❌ Not started | ❌ Not started | Account deletion; export; expiry jobs | P0 | EP-018 |
| P0B-05 | Event SDK | Nothing | Nothing | None | None | ❌ Not started | ❌ Not started | Everything | P0 | EP-021 |
| P0B-06 | IndexedDB queue | Nothing | Nothing | None | None | ❌ Not started | ❌ Not started | Everything | P0 | EP-021 |
| P0B-07 | Server ingestion | Nothing | Nothing | None | None | ❌ Not started | ❌ Not started | Everything | P0 | EP-021 |
| P0B-08 | Error monitoring | Full implementation | Partial | AppError migration | ERRORS.md | ❌ Not started (old) | ✅ Done | Admin alerts (deferred) | P0 | ✅ Done |
| P0B-09 | Feedback control | Full implementation | Partial | Feedback migration | N/A | ❌ Not started (old) | ✅ Done | Screenshot (excluded from MVP) | P0 | ✅ Done |
| P0B-10 | Separate admin app | Nothing | Nothing | None | None | ❌ Not started | ❌ Not started | Separate Next.js app; separate session | P0 | EP-022 |
| P0B-11 | Owner bootstrap | Nothing | Nothing | None | None | ❌ Not started | ❌ Not started | CLI or secure init script | P0 | EP-023 |
| P0B-12 | Admin user mgmt (MFA) | UI exists (main app) | adminUsers.test | None | None | ❌ Not started | ⚠️ Partial (no MFA) | MFA; separate app required | P0 | EP-023 |
| P0B-13 | Min admin operations | Pages built in main app | Basic | None | N/A | ❌ Not started (old) | ⚠️ In main app | Move to separate admin app | P0 | EP-024 (after EP-022) |
| P0B-14 | Security review | Nothing | securityCheck.test partial | N/A | None | ❌ Not started | ❌ Not started | Formal review | P0 | EP-027 |
| P0B-15 | Readiness test | Nothing | Nothing | N/A | None | ❌ Not started | ❌ Not started | E2E full journey | P0 | EP-027 |

---

## Immediate Actions Required (Before EP-002)

### Action 1 — CRITICAL: Confirm data/ credential files

**Owner:** Ali Abu Ras (Product Owner)

The repository contains what appear to be real credentials:
- `data/AliAbuRas80_accessKeys-jira.csv`
- `data/AliAbuRas80_accessKeys-new.csv`
- `data/Backup-codes-aliaburas80.txt`

**Required action:**
1. Confirm whether these are real or test credentials.
2. If real: revoke/rotate them immediately (they are in git history, even if deleted now).
3. Remove the files from the repo and from git history (`git filter-branch` or `git-filter-repo`).
4. Add `data/*.csv`, `data/*.txt` to `.gitignore`.

### Action 2 — HIGH: Jira API behind feature flag

Until SSRF and security tests pass (EP-004/EP-027), the Jira API integration routes should be behind a feature flag. Currently any admin can configure and trigger external Jira API calls.

### Action 3 — MEDIUM: Decide on `frontend/` and `backend/`

These orphaned directories add noise. Product Owner should decide:
- `frontend/` — Remove (was a CRA prototype, not part of MVP) or document as archived
- `backend/` — Remove stub or clarify its future purpose

---

## EP-001 Completion Evidence

- Repository: 68 API routes, 130+ pages/components, 760 passing tests, 7 migrations inventoried
- TODO reconciliation: All P0-A and P0-B items status verified against code
- Critical findings: 5 security gaps, 3 missing schema areas, 2 orphaned directories, 1 critical data concern
- Durable artifacts created:
  - `docs/planning/CURRENT-PROJECT-STATE.md`
  - `docs/planning/MVP-EXECUTION-PLAN.md`
  - `docs/execution-packets/EP-001-repository-reconciliation.md` (this file)

---

## Claude Review — EP-001

```
Review ID:              REV-EP-001
Execution Packet:       EP-001
Decision:               Approved — findings are accurate, no implementation occurred
Acceptance Criteria Passed:
  - Repository fully inventoried (routes, APIs, models, migrations, tests, docs)
  - TODO items cross-referenced against code
  - Verified status assigned independently of recorded status
  - Critical gaps and risks identified
  - Reconciliation matrix produced
  - Immediate actions identified
Security Findings:
  - data/ directory may contain real credentials — CRITICAL
  - Admin not a separate application — CRITICAL for launch
  - Jira API has no SSRF tests and no feature flag — HIGH
  - 17 npm vulnerabilities (1 critical, 9 high) — HIGH
Architecture Findings:
  - No Workspace model: all P0 security and isolation work is blocked on this
  - No email verification: cannot have public registration without it
  - No feature flags: cannot safely gate incomplete features
Test Findings:
  - 760 tests passing is strong
  - Zero negative cross-workspace access tests
  - Zero E2E tests
  - Zero security tests (SSRF, IDOR, formula injection)
Documentation Findings:
  - TODO recorded status diverges from verified status for most P0-B items
  - Calculation reference incomplete
  - Data model doc incomplete
Required Corrections:   None (analysis packet, no implementation)
Recommended Follow-up:
  - Product Owner confirms data/ files
  - EP-002 runs quality baseline
  - EP-003 aligns version discipline
  - EP-004 addresses npm vulnerabilities
```
