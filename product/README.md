# Product Documentation — Delivery Clarity v4.0

**Brand:** Ali Delivery Intelligence  
**Slogan:** From messy boards to measurable delivery confidence  
**Author:** Ali Abu Ras (aburasali80@gmail.com)  
**Last updated:** 2026-06-03  
**Branch:** feat/enhancements  

---

## Document Index

| Document | Description | Status |
|---|---|---|
| [BRD.md](./BRD.md) | Business Requirements Document — objectives, stakeholders, BRs, personas, risk register | Needs v4 update |
| [SRS.md](./SRS.md) | Software Requirements Specification — FRs, API spec, data model, acceptance criteria | Needs v4 update |
| [USER_JOURNEYS.md](./USER_JOURNEYS.md) | User Journey Maps — persona journeys, emotional arcs, touchpoints, moments of truth | Needs v4 update |
| [USE_CASES.md](./USE_CASES.md) | Use Cases — 40+ use cases with full flows, actors, exceptions | Needs v4 update |
| [TEST_CASES.md](./TEST_CASES.md) | Test Cases — covering all FRs and automated test suites | Needs v4 update |
| [SCENARIOS.md](./SCENARIOS.md) | Business Scenarios — real-world scenarios with walkthroughs | Needs v4 update |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Developer Guide — code how-tos, Package Reference, Calculation Reference | v4.0 — current |
| [RELEASE_NOTES.md](./RELEASE_NOTES.md) | Release Notes — full changelog v1–v4 | v4.0 — mostly current |
| [ALGORITHM_SPEC.md](./ALGORITHM_SPEC.md) | Algorithm Specification — pseudocode for all major algorithms | Needs v4 update |
| [TECHNICAL_METHOD.md](./TECHNICAL_METHOD.md) | Technical Method Description — 8+ technical methods | Needs v4 update |
| [APPENDIX.md](./APPENDIX.md) | Glossary and Abbreviations | Needs v4 terms |
| [PATENT_DISCLOSURE.md](./PATENT_DISCLOSURE.md) | Patent Disclosure — novel technical methods | Deferred review |
| [PRIOR_ART_COMPARISON.md](./PRIOR_ART_COMPARISON.md) | Prior Art Comparison — vs Jira, LinearB, Jira Align, Tableau | Deferred review |
| [CLAIM_CANDIDATE_MATRIX.md](./CLAIM_CANDIDATE_MATRIX.md) | Patent Claim Candidates — strength ratings | Deferred review |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — set SESSION_SECRET (32+ chars), ALLOW_OPEN_REGISTRATION, etc.

# 3. Set up database (first time only)
npx prisma migrate dev
npx prisma db seed

# 4. Start development server
npm run dev
```

App runs at **http://localhost:3000**

**Default admin account** (created by seed):
- Email: `admin@deliveryclarity.com`
- Password: `Admin@DC2025`
- ⚠️ Change immediately after first login

**Docker (optional):**
```bash
docker-compose up --build
```

---

## Application Routes

### Public (no authentication required)
| Path | Description |
|---|---|
| `/login` | Sign in page |
| `/register` | Create account (requires `ALLOW_OPEN_REGISTRATION=true` in `.env`) |

### Authenticated (all users)
| Path | Description |
|---|---|
| `/` | Upload page — drag-and-drop Jira `.csv`, `.xlsx`, or `.xls` export |
| `/summary` | Overview — health score, KPI cards, sprint health snapshot |
| `/dashboard` | Full Report — all metrics, filters, snapshots, export |
| `/charts` | Charts — velocity, cycle time, issue-type breakdown, sprint comparison |
| `/trends` | Trends — upload-to-upload trend analysis (8 metrics over 30 uploads) |
| `/explore` | Work Item Explorer — visual hierarchy graph, orphan detection, relation charts |
| `/readiness` | Release Readiness — Go / Conditional Go / No-Go per Fix Version |
| `/customer` | Customer View — clean stakeholder summary (no technical detail) |
| `/snapshots` | Saved Snapshots — list, load, compare saved metric snapshots |
| `/snapshots/compare` | Snapshot Comparison — side-by-side delta table |
| `/profile` | User Profile — name, email, role |
| `/glossary` | Glossary — all metric abbreviations and definitions |
| `/developer` | Developer Portal — Package Reference, Calculation Reference, API docs |
| `/help` | Help Guide — animated, searchable guide covering every metric |
| `/backend` | Backend Status — import log summary and service health |

### Admin Only
| Path | Description |
|---|---|
| `/admin/logs` | Import Logs — all users' uploads (admin) or own uploads (user) |
| `/admin/settings` | Admin Settings — data retention, orphan rules, health thresholds |
| `/admin/security` | Security Checklist — automated + manual production readiness checks |

---

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/logout` | Invalidate session |
| `POST` | `/api/auth/register` | Create account (requires `ALLOW_OPEN_REGISTRATION=true`) |
| `GET` | `/api/auth/me` | Get current session user |
| `POST` | `/api/upload` | Parse Jira file, compute metrics, save ImportLog |
| `POST` | `/api/upload/merge` | Merge multiple Jira exports (up to 10 files) |
| `GET` | `/api/dashboard` | Return cached dashboard metrics |
| `GET` | `/api/metrics` | Return full metrics object |
| `GET` | `/api/health` | Health check — `{ status: "ok", version }` |
| `GET` | `/api/imports` | Import log history (user-scoped; admin sees all with `?all=true`) |
| `GET` | `/api/imports/all` | All import logs (admin only) |
| `DELETE` | `/api/imports/[id]` | Delete import log entry |
| `GET` | `/api/snapshots` | List saved snapshots |
| `POST` | `/api/snapshots` | Save new snapshot |
| `DELETE` | `/api/snapshots/[id]` | Delete snapshot |
| `GET` | `/api/trends` | Upload-to-upload trend data |
| `GET` | `/api/docs` | Developer documentation content |
| `GET` | `/api/backend-view` | Backend status page content |
| `GET` | `/api/admin/security` | Run security checks |
| `GET/POST` | `/api/admin/settings` | Read/write admin settings |
| `GET/POST` | `/api/admin/thresholds` | Read/write health thresholds |
| `GET/POST` | `/api/admin/orphan-rules` | Read/write orphan detection rules |
| `POST` | `/api/admin/backup` | Trigger database backup |
| `POST` | `/api/admin/restore` | Restore from backup |
| `POST` | `/api/admin/cleanup` | Delete expired import logs |

---

## Architecture Overview

```
JiraDashboard/
├── app/                          # Next.js 14 App Router (all production code)
│   ├── page.tsx                  # Upload page (/)
│   ├── summary/page.tsx
│   ├── charts/page.tsx
│   ├── dashboard/page.tsx
│   ├── trends/page.tsx
│   ├── explore/page.tsx
│   ├── readiness/page.tsx
│   ├── customer/page.tsx
│   ├── snapshots/                # /snapshots + /snapshots/compare
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── profile/page.tsx
│   ├── glossary/page.tsx
│   ├── developer/page.tsx
│   ├── help/page.tsx
│   ├── backend/page.tsx
│   ├── admin/                    # /admin/logs, /admin/settings, /admin/security
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── layout.tsx
│   └── api/                      # All API route handlers
├── src/
│   ├── components/               # React components
│   │   ├── layout/AppShell.tsx   # Navigation, header, footer
│   │   ├── dashboard/            # Dashboard panels (Sprint, Kanban, Snapshots, etc.)
│   │   ├── explore/              # Work Item Explorer components
│   │   ├── charts/               # Chart components
│   │   ├── upload/               # Column mapping, data quality summary
│   │   ├── auth/                 # UserMenu
│   │   ├── admin/                # Admin settings panels
│   │   ├── readiness/            # Release readiness card
│   │   ├── trends/               # Trend chart
│   │   ├── onboarding/           # Onboarding checklist
│   │   └── ui/                   # Shared UI primitives
│   ├── services/                 # Business logic services
│   │   ├── metrics/              # Core metrics (metrics.service.ts, throughput, kanban, etc.)
│   │   ├── jira/                 # Parser and validation
│   │   ├── relations/            # Explorer / hierarchy / orphan detection
│   │   ├── dataQuality/          # Data Quality Score + Missing Field Impact
│   │   ├── export/               # Excel export + recommendation engine
│   │   ├── imports/              # Import log service
│   │   └── settings/             # Thresholds, orphan rules, backup, security check
│   ├── types/                    # TypeScript type definitions
│   └── lib/                      # Utilities (auth, storage, session, theme, onboarding)
├── prisma/
│   ├── schema.prisma             # User, ImportLog, DashboardSnapshot, AuditEvent
│   ├── migrations/
│   └── seed.ts                   # First admin user
├── data/                         # Runtime data (SQLite DB, config JSON, backups)
│   └── delivery_clarity.db
├── public/                       # Static assets (favicon, logo SVGs)
├── product/                      # Living product documentation (this folder)
├── src/__tests__/                # Jest test suites (253+ tests across 21 suites)
├── Dockerfile                    # Multi-stage production Docker image
├── docker-compose.yml            # Docker Compose with volume + healthcheck
├── middleware.ts                 # Route protection — all routes require auth
├── next.config.js                # Next.js config (standalone output)
└── .env / .env.example           # Environment configuration
```

**Key data flow:**
1. User uploads a Jira CSV/XLSX export on `/`.
2. `POST /api/upload` parses the file, computes all metrics via `calculateDashboardMetrics()`, saves an `ImportLog` to SQLite, returns metrics + warnings.
3. Computed metrics are written to `data/latest-metrics.json` on the server and cached in browser `localStorage` for fast fallback.
4. All dashboard pages load metrics through `loadMetricsWithSource()`: bucket-backed `/api/metrics/latest` first, then browser `localStorage` fallback.
5. `middleware.ts` enforces auth on all routes — unauthenticated users are redirected to `/login`.

**Tech stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Prisma 5 · SQLite · iron-session · bcryptjs · ReactFlow · @dagrejs/dagre · XLSX · Recharts

---

## Legacy Reference

The `frontend/` and `backend/` directories contain the original v1 implementation (Create React App + standalone Express). They are **not used in the production build** and exist for historical reference only.

---

## How to Keep These Docs Updated

All documents are **living documents**. The rule is: **no code change is complete until the affected product documents are updated.**

Update when:
- A new feature is built — add FRs, test cases, use cases, scenarios
- A requirement changes — update affected doc and bump version
- A bug is found — add regression test case
- A new architectural pattern is established — add to DEVELOPER_GUIDE.md

**Product documentation must never be behind the code.**

---

© 2026 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
