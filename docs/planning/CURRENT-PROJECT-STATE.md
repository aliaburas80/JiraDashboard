# Delivery Clarity — Current Project State

> **Updated:** 2026-07-02 | **Produced by:** EP-001 Repository and TODO Reconciliation
> **Governing model:** Online MVP Architecture, Planning, Delegation and Execution Master Prompt (v1)
> **Product Owner:** Ali Abu Ras

---

## 1. Current Architecture

| Layer | Technology | Status |
|---|---|---|
| Framework | Next.js 14.2.5, App Router, TypeScript | Live on Render |
| Database | PostgreSQL via Neon (Prisma 5.22) | Live, 7 migrations committed |
| Auth | iron-session v8 cookies, bcryptjs | Implemented, admin-created users only |
| Storage | AWS S3 / Azure Blob / Google Cloud (optional) | Configurable |
| Email | Resend (HTTP API, primary) + SMTP fallback | Partial — send works, errors on mismatched domain |
| Deployment | Render (single service, free tier) | Live at production URL |
| Tests | Jest/ts-jest, 760 tests, 78 suites | All passing |
| Node version | 20.x (pinned in .nvmrc) | ✅ |

### Prisma models in schema

| Model | Purpose | Missing for MVP |
|---|---|---|
| User | Accounts (admin-created only) | No persona, no emailVerified, no accountState |
| Session | Token-based sessions | ✅ Sufficient |
| ImportLog | Upload history | No workspaceId |
| DashboardSnapshot | Saved snapshots | No workspaceId |
| AuditEvent | Security audit trail | ✅ Sufficient |
| UserAddRequest | Invite workflow | ✅ (admin flow only) |
| Notification | In-app notifications | ✅ |
| JiraConnection | API integration | Needs security review before enabling |
| SystemErrorLog | Server error log | ✅ |
| Feedback | User feedback | ✅ Done (P0B-09) |
| AppError | Client error monitoring | ✅ Done (P0B-08) |
| LoginAttempt | Rate limiter | ✅ Done (P0A-05) |
| SmtpSettings | Email config | ✅ |

### **MISSING models (blockers for MVP)**

- `Workspace` — not in schema
- `WorkspaceMember` — not in schema
- `EmailVerificationToken` — not in schema
- `PasswordResetToken` — not in schema
- `ConsentRecord` — not in schema
- `Entitlement` — not in schema
- `ProductAnalyticsEvent` — not in schema
- `FeatureFlag` — not in schema

---

## 2. Approved MVP Scope

Defined in the Master Prompt, Section 4.1. Key inclusions:

- Public registration with email verification
- Login, logout, forgot password, password reset
- Persona selection (Scrum Master, Agile Coach, PO, PM, DM, EM, TL, Executive, Jira Admin, Consultant, Other)
- Privacy and terms acceptance
- One private workspace per registered account
- One successful free Jira analysis
- 30-day read access
- CSV and Excel upload with column mapping
- Existing dashboards, coaching, trends, forecast, snapshots, exports
- Feedback, error reporting
- Account data export and deletion
- Separate admin application (port 3001/subdomain)
- Owner Admin bootstrap
- Admin MFA
- Feature flags
- Minimum product analytics

**Excluded from MVP:** Payments, AI recommendations, Jira write-back, Slack/Teams, mobile apps, enterprise SSO, multi-org sharing.

---

## 3. Current Execution Phase

**Phase:** EP-001 — Repository and TODO Reconciliation (in progress)

No feature implementation has started under the new operating model.

---

## 4. Approved Decisions

None yet formally approved under the new operating model. Architecture decisions will be recorded in `docs/architecture/ARCHITECTURE-DECISIONS.md` as packets are approved.

---

## 5. Completed Execution Packets

None under the new operating model.

**Prior work completed (from session history, NOT under EP model):**
- P0A-05 Authentication/session hardening
- P0A-06/07/08 Partial (Neon, startup logging, release notes)
- P0B-08 Structured error monitoring
- P0B-09 Feedback control
- Admin UI: audit events page, feedback page, nav restructure

---

## 6. Active Execution Packet

**EP-001 — Repository and TODO Reconciliation** (current)

---

## 7. Current Blockers

| Blocker | Impact | Owner |
|---|---|---|
| No public registration | Cannot onboard external users | EP-011 |
| No workspace model | Cannot isolate data per user | EP-006 |
| No email verification/reset | Cannot recover accounts or verify identity | EP-012/EP-013 |
| Admin not separate application | Security boundary violation | EP-022 |
| 1 critical + 9 high npm vulnerabilities | Unacceptable for public launch | EP-004 |
| `data/` contains sensitive files (API keys, backup codes) | Security risk in repository | Immediate action required |
| No trial entitlement | Cannot manage free-tier abuse | EP-015 |
| No consent/privacy flows | Cannot legally launch | EP-014 |

---

## 8. Current Quality Status

| Check | Status | Notes |
|---|---|---|
| TypeScript | ✅ Pass | `npx tsc --noEmit` clean |
| ESLint | ⚠️ 1,524 warnings | All pre-existing, no new errors |
| Stylelint | Not run in this session | Required before EP-002 |
| Jest tests | ✅ 760/760 passing | 78 suites |
| Build | ✅ Pass | `next build` succeeds |
| npm audit | ❌ 17 vulnerabilities | 1 critical, 9 high, 7 moderate |

---

## 9. Current Security Status

| Area | Status | Risk |
|---|---|---|
| Session secrets | ✅ Throws in production if missing | |
| Rate limiting | ✅ DB-backed for login, upload, errors, feedback | |
| Admin separation | ❌ Admin embedded in main app | Critical |
| MFA | ❌ Not implemented | Critical |
| Email verification | ❌ Not implemented | High |
| Password reset | ❌ Not implemented | High |
| Workspace isolation | ⚠️ userId-scoped, no workspace model | High |
| npm vulnerabilities | ❌ 1 critical, 9 high | High |
| `data/` sensitive files | ❌ API keys and backup codes in repo | Critical |
| Jira API SSRF | ⚠️ Integration present, needs security review | Medium |

---

## 10. Current Version

`2.0.0` (package.json)

Render deployment: commit `b3f4328`

---

## 11. Next Decision Required

**Product Owner decision needed before EP-006 (Workspace Model):**

The workspace model determines how all existing user data is migrated. Two options:

- **Option A (Recommended):** Each existing user becomes a workspace; all their ImportLogs, Snapshots, JiraConnections stay attached. Schema adds `workspaceId` to these models and backfills.
- **Option B:** Create a parallel workspace system and keep existing records userId-scoped. More complex migration, more risk.

---

## 12. Next Execution Packet

**EP-002 — Reproducible Quality Baseline**

Run all quality gates in a clean environment, record exact results, establish the baseline before any MVP implementation begins.
