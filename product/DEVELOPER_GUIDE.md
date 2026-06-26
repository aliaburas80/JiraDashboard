# Delivery Clarity — Developer Guide

## Document Control
Version 4.0 | 2026-06-02 | Author: Ali Abu Ras

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Quick Start](#2-quick-start)
3. [Directory Structure](#3-directory-structure)
4. [Routing Architecture — Pages](#4-routing-architecture--pages)
5. [Routing Architecture — API Routes](#5-routing-architecture--api-routes)
6. [Service Layer](#6-service-layer)
7. [TypeScript Types](#7-typescript-types)
8. [How to Add a New Metric](#8-how-to-add-a-new-metric)
9. [Health Score Formula](#9-health-score-formula)
10. [Field Aliases](#10-field-aliases)
11. [Testing](#11-testing)

---

## 1. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.2.5 | Server Components + Client Components |
| Language | TypeScript | 5.4.x | Strict mode; `@ts-nocheck` used during migration |
| Styling | Tailwind CSS | 3.4.x | Utility-first; no component library |
| Sass | sass | 1.77.x | Used for `app/globals.scss` only |
| File parsing | xlsx (SheetJS) | 0.18.x | Reads `.csv`, `.xlsx`, `.xls` |
| Icon library | lucide-react | 0.427.x | SVG icons used sparingly |
| Class merging | clsx + tailwind-merge | 2.x | Via `cn()` helper in `src/lib/utils.ts` |
| Testing | Jest + ts-jest | 29.x | Node environment; no browser testing |

There is no separate backend process. Everything runs inside Next.js Route Handlers (`app/api/*/route.ts`). Import logs and user accounts are persisted to `data/delivery_clarity.db` (SQLite via Prisma 5). The latest computed dashboard metrics are written server-side to `data/latest-metrics.json`, included in cloud backup bundles, and fetched through `/api/metrics/latest` before the browser falls back to `localStorage` key `dc_metrics_v2`. Browser storage still keeps a fast fallback copy with a 5,000-item cap on `flow.items`.

---

## 2. Quick Start

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install and run

```bash
# From the repo root
npm install

# Development server (port 3000, hot reload)
npm run dev

# Production build
npm run build
# Local production server
npm start

# Lint
npm run lint

# Test suite
npm test
```

### Environment variables

There are no required environment variables for local development. The app runs entirely on the Next.js dev server.

For production deployment, set these environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `SESSION_SECRET` | `dev-secret-change-me` | iron-session cookie signing key — **change in production** |
| `ALLOW_OPEN_REGISTRATION` | `false` | Kept false; public registration is inactive and users are admin-created |
| `DATABASE_URL` | `file:./data/delivery_clarity.db` | SQLite DB path (Prisma). Relative `file:./data/...` or `file:../data/...` values are normalized to the app `data/` directory at runtime. |

Run `npx prisma generate && npx prisma migrate deploy` after first install to create the database.

### Data flow in a single upload

1. User drops a `.xlsx` / `.csv` file on the home page (`app/page.tsx`).
2. `clearMetrics()` is called to wipe any previous session from `localStorage`.
3. Browser `POST`s the file to `POST /api/upload`.
4. `parseJiraFile` (parser service) converts the buffer to typed rows and canonicalises column headers.
5. `validateIssueData` (validation service) confirms required fields are present.
6. `buildColumnMapping` produces the column-mapping preview.
7. `calculateDashboardMetrics` (metrics service) computes all KPIs. `buildFlowMetrics()` caps `flow.items` at 5,000 (sorted critical-first); `totalItemCount` and `itemsCapped` flags are set when the cap fires.
8. The route handler saves an `ImportLog` to SQLite (with `userId`) and returns `{ metrics, warnings, importLog, columnMapping }`.
9. The route handler writes `data/latest-metrics.json` via `writeLatestMetrics(metrics)` so the latest dashboard payload is part of the next cloud backup.
10. The browser calls `saveMetrics(metrics)` (writes to `localStorage` key `dc_metrics_v2` and source key `dc_metrics_source_v1`). If `QuotaExceededError` fires it trims to 5,000 items, then falls back to clearing storage.
11. The router pushes to `/dashboard?fresh=1`. On load, the `?fresh=1` param resets all 12 filters.

---

## 3. Directory Structure

```
JiraDashboard/
│
├── app/                          # Next.js App Router root
│   ├── layout.tsx                # Root layout — sets <html>, <body>, favicon metadata
│   ├── icon.png                  # App favicon (auto-detected by Next.js)
│   ├── globals.scss              # Global styles (Tailwind base + custom + .dc-card/.dc-kpi-* utilities)
│   ├── page.tsx                  # / — Upload page (home)
│   ├── summary/page.tsx          # /summary — Health overview (AppShell, standalone)
│   ├── charts/page.tsx           # /charts — Visual analytics
│   ├── column-mapping/page.tsx   # /column-mapping — Column mapping preview
│   ├── dashboard/                # /dashboard/* — 15 independent routed pages
│   │   ├── layout.tsx            # /dashboard/* layout — DashboardTopbar + DashboardSidebarNav
│   │   ├── page.tsx              # /dashboard — redirect to summary section
│   │   ├── summary/page.tsx      # Delivery Summary (KPI overview + alert strip)
│   │   ├── priority-attention/   # Priority Attention (critical/blocked items)
│   │   ├── sprint-status/        # Sprint Status (velocity, goals, commitment vs completion)
│   │   ├── epic-readiness/       # Epic Readiness (completion, forecast, blockers)
│   │   ├── labels/               # Labels (label distribution + health)
│   │   ├── flow-health/          # Flow Health Table (11 filters, column reorder)
│   │   ├── key-metrics/          # Key Metrics (KPI summary cards)
│   │   ├── kanban-health/        # Kanban Health (WIP, cycle time, blocked lanes)
│   │   ├── visual-analytics/     # Visual Analytics (charts, donuts, distributions)
│   │   ├── ownership/            # Ownership & Capacity (assignee distribution)
│   │   ├── quarter-statistics/   # Quarter Statistics (quarterly throughput tables)
│   │   ├── actions/              # Smart Actions (AI-style suggested actions by severity)
│   │   ├── delivery-composition/ # Delivery Composition (work breakdown by type/status/epic)
│   │   ├── delivery-controls/    # Delivery Controls (risk + orphan panels)
│   │   └── data-quality/         # Data Quality Score (10-field check, impact report)
│   ├── data-quality/page.tsx     # /data-quality — standalone Data Quality page (AppShell)
│   ├── delivery-mix/page.tsx     # /delivery-mix — standalone Delivery Mix (type/status breakdown)
│   ├── flow-health/page.tsx      # /flow-health — standalone Flow Health table
│   ├── release-readiness/page.tsx # /release-readiness — standalone Release Readiness
│   ├── sprint-kanban/page.tsx    # /sprint-kanban — standalone Sprint + Kanban overview
│   ├── work-explorer/page.tsx    # /work-explorer — standalone Work Explorer (table view)
│   ├── trends/page.tsx           # /trends — Upload-to-upload trend analysis
│   ├── explore/page.tsx          # /explore — Work Item Explorer (React Flow graph)
│   ├── readiness/page.tsx        # /readiness — Release readiness checklist (legacy route)
│   ├── customer/page.tsx         # /customer — Customer-facing summary
│   ├── snapshots/page.tsx        # /snapshots — Saved metric snapshots
│   ├── backend/page.tsx          # /backend — Import logs & backend status
│   ├── glossary/page.tsx         # /glossary — Abbreviations & metric guide
│   ├── developer/
│   │   ├── layout.tsx            # /developer/* layout — DashboardTopbar only
│   │   ├── layout.module.scss
│   │   ├── page.tsx              # /developer — Developer wiki (light wiki theme)
│   │   └── page.module.scss      # .wiki class remaps all --dc-* tokens to light values
│   ├── help/page.tsx             # /help — FAQ / help guide
│   ├── login/page.tsx            # /login — Authentication
│   ├── register/page.tsx         # /register — Reserved; redirects to login
│   ├── change-password/page.tsx  # /change-password — First-login password change
│   ├── profile/page.tsx          # /profile — Editable member profile
│   ├── members/page.tsx          # /members — Team member directory
│   ├── admin/
│   │   ├── layout.tsx            # /admin/* layout — DashboardTopbar + AdminNavSidebar
│   │   ├── layout.module.scss
│   │   ├── logs/page.tsx         # /admin/logs — Import log management
│   │   ├── settings/page.tsx     # /admin/settings — Backup, restore, thresholds
│   │   ├── security/page.tsx     # /admin/security — Production security checklist
│   │   ├── users/page.tsx        # /admin/users — User management
│   │   ├── diagnostics/page.tsx  # /admin/diagnostics — System diagnostics
│   │   └── theme/page.tsx        # /admin/theme — Brand & theme settings
│   └── api/
│       ├── upload/route.ts       # POST /api/upload — parse + metrics + save log
│       ├── imports/route.ts      # GET  /api/imports — logs (role-scoped; all for admin/manager/c_level)
│       ├── snapshots/route.ts    # GET/POST /api/snapshots
│       ├── snapshots/[id]/route.ts # DELETE /api/snapshots/:id
│       ├── auth/login/route.ts   # POST /api/auth/login
│       ├── auth/logout/route.ts  # POST /api/auth/logout
│       ├── auth/register/route.ts # POST /api/auth/register (inactive / 403)
│       ├── auth/change-password/route.ts
│       ├── auth/me/route.ts      # GET  /api/auth/me
│       ├── profile/route.ts      # GET/PATCH /api/profile
│       ├── profile/image/route.ts # GET/POST /api/profile/image — S3 profile image upload/proxy
│       ├── members/route.ts      # GET /api/members
│       ├── admin/users/route.ts  # GET/POST/PATCH/DELETE /api/admin/users
│       ├── admin/backup/route.ts # GET  /api/admin/backup
│       ├── admin/restore/route.ts # POST /api/admin/restore
│       └── settings/*/route.ts   # GET/POST various admin settings
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx      # Sticky header — nav driven by DC_NAV_GROUPS single source of truth
│   │   ├── dashboard/
│   │   │   ├── DashboardTopbar.tsx      # Fixed 52px topbar for /dashboard/* + /admin/* + /developer
│   │   │   ├── DashboardTopbar.module.scss
│   │   │   ├── DashboardSidebarNav.tsx  # Fixed 228px sidebar for /dashboard/*
│   │   │   └── DashboardSidebarNav.module.scss
│   │   ├── admin/
│   │   │   ├── AdminNavSidebar.tsx      # Fixed 228px sidebar for /admin/* (injected by layout.tsx)
│   │   │   ├── AdminNavSidebar.module.scss
│   │   │   └── BackupRestoreSettings.tsx
│   │   ├── dc-shell/
│   │   │   ├── navigation.ts            # DC_NAV_GROUPS — single source of truth for all nav items
│   │   │   ├── DCTopbar.tsx             # Generic topbar shell component
│   │   │   ├── DCPageSidebar.tsx        # Generic page sidebar shell component
│   │   │   ├── DCKpiCard.tsx            # KPI metric card
│   │   │   ├── DCStatusChip.tsx         # Status chip (uses .chip + variant classes)
│   │   │   ├── DCActionBoard.tsx        # Action board panel
│   │   │   └── DeliveryClarityShell.tsx # Composite shell (topbar + sidebar + main)
│   │   ├── auth/
│   │   │   └── UserMenu.tsx      # Avatar dropdown (name, role badge, sign out)
│   │   ├── admin/
│   │   ├── onboarding/
│   │   │   └── OnboardingChecklist.tsx
│   │   ├── readiness/
│   │   │   └── ReleaseReadinessCard.tsx
│   │   └── ui/
│   │       ├── Badge.tsx / Card.tsx / KpiCard.tsx / LoadingState.tsx
│   │       └── DraggableMetricTable.tsx
│   ├── lib/
│   │   ├── utils.ts              # cn(), formatDays(), getHealthBand()
│   │   ├── storage.ts            # saveMetrics(), loadMetrics(), clearMetrics() — localStorage dc_metrics_v2
│   │   ├── theme.ts              # getInitialTheme(), applyTheme() — dark mode
│   │   └── session.ts            # iron-session config (SESSION_SECRET, cookie options)
│   ├── services/
│   │   ├── jira/
│   │   │   ├── parser.ts         # parseJiraFile(), FIELD_ALIASES, OPTIONAL_FIELDS
│   │   │   └── validation.ts     # validateIssueData()
│   │   ├── metrics/
│   │   │   ├── metrics.service.ts      # calculateDashboardMetrics() — core engine; FLOW_ITEMS_CAP=5,000
│   │   │   ├── releaseReadiness.service.ts # calculateReleaseReadiness() — Go/No-Go per Fix Version
│   │   │   ├── trendAnalysis.service.ts
│   │   │   ├── snapshotComparison.service.ts
│   │   │   └── relationGraph.service.ts    # buildRelationGraph() — Work Item Explorer
│   │   └── settings/
│   │       ├── backup.service.ts       # createBackup(), restoreBackup()
│   │       ├── securityCheck.service.ts # runSecurityChecks() — 8 auto + 5 manual
│   │       └── healthThresholds.service.ts
│   ├── types/
│   │   ├── jira.ts               # JiraIssue, ESSENTIAL_FIELDS, status constants
│   │   ├── metrics.ts            # DashboardMetrics, FlowMetrics (itemsCapped, totalItemCount), etc.
│   │   ├── relations.ts          # RelationNode (isOnRiskPath, isLargestBranch), RelationEdge, RelationStats
│   │   ├── releaseReadiness.ts   # ReleaseReadinessResult, ReleaseReadinessSummary
│   │   └── throughput.ts         # ThroughputMetrics, SprintEntry, etc.
│   └── __tests__/                # Jest test suites (469 tests across 48 suites — verified 2026-06-07)
│
├── data/
│   └── delivery_clarity.db       # SQLite database (users, sessions, import logs, snapshots)
│
├── prisma/
│   └── schema.prisma             # User, ImportLog, DashboardSnapshot, AuditEvent models
│
├── public/
│   ├── favicon.ico               # Multi-resolution ICO (9 sizes)
│   ├── favicon.svg               # SVG fallback
│   └── logo/
│       ├── delivery-clarity-logo-horizontal.svg  # Header logo (desktop)
│       ├── delivery-clarity-logo-icon.svg        # Header logo (mobile)
│       └── delivery_clarity_mark_128.png         # 128×128 PNG mark
│
├── product/                      # Product documentation (private — do not expose publicly)
├── Dockerfile                    # Multi-stage build (node:20-alpine, non-root)
├── docker-compose.yml            # Volume mount for data/, healthcheck
├── .dockerignore
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── jest.config.js
```

---

## 3a. Frontend Architecture Standards (v4.9.0+)

These rules apply to every component, page, and style file. They are enforced by ESLint, Stylelint, and TypeScript.

### Styling hierarchy
```
Tailwind  →  utility layout only (flex, grid, gap, p-*, m-*, responsive breakpoints)
SCSS      →  all component appearance (color, border, shadow, animation, typography, interaction)
```

### Rules
- **Zero inline `style` props** — ESLint `react/forbid-dom-props` enforces this. Exception: CSS custom properties only (`--prefixed-keys`) for data-driven values (e.g. `style={{ '--bar-width': `${pct}%` } as CSSProperties}`).
- **SCSS modules** — one `ComponentName.module.scss` per component with custom styling.
- **Design tokens** — all values from `src/styles/_tokens.scss`. Never hardcode hex, px dimensions, or z-indices.
- **`clsx`** — for conditional class composition.
- **`DC_NAV_GROUPS`** (`src/components/dc-shell/navigation.ts`) — single source of truth for all nav items. Both `AppShell` and `DashboardTopbar` consume this config.

### Layout injection patterns

**Dashboard pages** (`/dashboard/*`): `DashboardTopbar` (fixed top) + `DashboardSidebarNav` (fixed left) via `app/dashboard/layout.tsx`.

**Admin pages** (`/admin/*`): `DashboardTopbar` + `AdminNavSidebar` injected by `app/admin/layout.tsx`. Individual admin page files render content only — no shell logic. Under 768px, `AdminNavSidebar`'s fixed 228px rail hides and is replaced by a fixed top bar + dropdown nav panel (same component, internal `mobileOpen` state) — `app/admin/layout.module.scss`'s `.main` drops its `margin-left` and adds top padding to clear the bar at that breakpoint (added 2026-06-20, USERREQ-27).

**Developer page** (`/developer`): `DashboardTopbar` only, via `app/developer/layout.tsx`. The page has its own internal section sidebar. The `.wiki` class in `page.module.scss` remaps all `--dc-*` dark tokens to light semantic equivalents so inline-style token references resolve to light values without editing individual lines.

**AppShell pages** (all other routes): `AppShell` from `src/components/layout/AppShell.tsx` with `showNav` prop.

---

## 4. Routing Architecture — Pages

All analytics pages are React Client Components (`'use client'`). They call `loadMetricsWithSource()`, which first fetches `/api/metrics/latest` to restore metrics from the bucket-backed server copy, then falls back to browser `localStorage` (`dc_metrics_v2`) if no server/bucket payload is available. If both are missing the router redirects to `/` (upload).

### Navigation structure

Navigation items are defined in `DC_NAV_GROUPS` (`src/components/dc-shell/navigation.ts`) — the single source of truth consumed by both `AppShell` and `DashboardTopbar`. Groups:
- **Analytics**: `/summary`, `/dashboard`, `/charts`, `/trends`, `/teams`, `/portfolio`
- **Reference**: `/glossary`, `/developer`, `/help`
- **Delivery**: `/readiness`, `/explore`, `/customer`, `/column-mapping`, `/data-quality`, `/delivery-mix`, `/flow-health`, `/release-readiness`, `/sprint-kanban`, `/work-explorer`
- **Planning**: `/roadmap`, `/forecast`, `/retro`
- **Data**: `/snapshots`, `/backend`

Mobile: hamburger button opens a 2-column grid panel below the header.

### Dashboard sub-pages (`/dashboard/*`)

All dashboard sub-pages share the 3-zone layout injected by `app/dashboard/layout.tsx` (DashboardTopbar + DashboardSidebarNav). Each page calls `loadMetricsWithSource()` and renders its section:
- `/dashboard/summary` — Delivery Summary (KPI cards + alert strip + top smart actions)
- `/dashboard/priority-attention` — Priority Attention (critical + blocked items)
- `/dashboard/sprint-status` — Sprint Status (velocity, goals, commitment vs completion, blockers)
- `/dashboard/epic-readiness` — Epic Readiness (completion %, forecast, blockers)
- `/dashboard/labels` — Labels (distribution + health bands)
- `/dashboard/flow-health` — Flow Health Table (11 filters, column reorder, saved presets)
- `/dashboard/key-metrics` — Key Metrics (KPI summary cards with trend indicators)
- `/dashboard/kanban-health` — Kanban Health (WIP limits, cycle time, blocked lanes)
- `/dashboard/visual-analytics` — Visual Analytics (donuts, bars, heatmaps)
- `/dashboard/ownership` — Ownership & Capacity (assignee distribution, capacity balance)
- `/dashboard/quarter-statistics` — Quarter Statistics (quarterly throughput tables)
- `/dashboard/actions` — Smart Actions (AI-style suggested actions by severity: critical/warning/info)
- `/dashboard/delivery-composition` — Delivery Composition (work breakdown by type/status/epic)
- `/dashboard/delivery-controls` — Delivery Controls (risk panels + orphan panels)
- `/dashboard/data-quality` — Data Quality Score (10-field check, impact report)

### Standalone analytics pages

6 standalone routes use AppShell and present full-page analytics views (not nested under /dashboard):
- `/data-quality` — Data Quality report (score ring, 10-field check, field impact table)
- `/delivery-mix` — Delivery Mix (issue-type breakdown, status distribution, sprint composition)
- `/flow-health` — Flow Health table (lead time, cycle time, age bracket histogram)
- `/release-readiness` — Release Readiness (Go/Conditional-Go/No-Go per Fix Version)
- `/sprint-kanban` — Sprint + Kanban overview (velocity, WIP, cycle time KPIs)
- `/work-explorer` — Work Explorer table view (list of all items with risk/orphan status)

### `app/page.tsx` — Upload (`/`)

Entry point. Renders a drag-and-drop file zone. On file selection:
- Calls `clearMetrics()` to wipe any previous session
- Calls `POST /api/upload` with `FormData`
- Stores returned `metrics` server-side as `data/latest-metrics.json` and in the browser via `saveMetrics()` → `localStorage` key `dc_metrics_v2`
- Navigates to `/dashboard?fresh=1`

No nav bar is shown here (`showNav={false}`).

### `app/summary/page.tsx` — Overview (`/summary`)

Executive one-page summary. Renders:
- Health score banner (score circle, band label, prediction chip)
- Six KPI cards: Completion, Health Alerts, Active Work, Lead Time, Cycle Time, Story Points
- Attention section: blockers, overdue items, orphan count
- Export buttons: Excel, **Executive PDF** (purple — `exportExecutivePdf()` → `src/lib/executivePdf.ts`), HTML
- Key insights list (from `metrics.insights`)
- CTA buttons to Charts and Full Report

### `app/charts/page.tsx` — Visual Analytics (`/charts`)

Twelve chart widgets arranged in a responsive 3-column grid. All charts are pure CSS/SVG — no charting library is used. Charts included:

1. Delivery Composition donut (span 2)
2. Health Mix donut (span 1)
3. Issue Types donut (span 1)
4. Story Points donut (span 1)
5. Sprint Velocity vertical bars (span 2)
6. Team Load horizontal bars (span 1)
7. Quarter Throughput grouped bars (span 2)
8. Kanban Status Flow horizontal bars (span 1)
9. Epic / Sprint Delivery Timeline (Gantt-style, span 3)
10. Label Distribution horizontal bars (span 2, conditional)
11. Epic Progress progress bars (span 1 or 3)
12. Issue Relations donut (span 1, conditional)

### `app/dashboard/page.tsx` — Full Delivery Report (`/dashboard`)

Most complex page. Contains all sections of the full report structured across four tiers:

- **Tier 1 — Priority Attention**: blockers, overdue, orphan highlight cards + Smart Recommendations
- **Tier 2 — Primary Metrics**: 6 KPI cards, delivery composition ring, visual intelligence mini-charts
- **Tier 3 — Delivery Detail**: collapsible sections for Delivery Controls, Quarter Statistics, Kanban Status, Sprint Status, Ownership & Capacity
- **Tier 4 — Deep Dive**: Labels, Issue Types, Parent Breakdown, Project Breakdown, Linked Issues / Relations

Additional features on this page:
- Sticky quick-filter bar (All / High Risk / Blocked / Needs Review)
- Expandable flow health panel with 10 filter controls
- CSV export of risk items
- Detail panel slide-out with focus trap and Escape key close
- "Load more" progressive rendering (100 rows at a time)
- Scroll-to-top FAB

### `app/developer/page.tsx` — Developer Wiki (`/developer`)

Fetches `/api/developer-view` on mount and renders a sidebar-navigated wiki with sections: Architecture, API Routes, Services, Types, Health Rules, Score Formula, Quick Start.

### `app/backend/page.tsx` — Backend Status (`/backend`)

Fetches `/api/backend-view` and renders live import statistics, endpoint table, and recent import log entries. Includes a Refresh button.

### `app/help/page.tsx` — Help (`/help`)

Static FAQ accordion. Three sections: Getting Started, Metrics Explained, Health Classification. No API calls.

### `app/readiness/page.tsx` — Release Readiness (`/readiness`)

Groups `flow.items` by Fix Version. For each version runs a 7-item checklist (completion ≥90%, no blockers, no open bugs, etc.) and assigns a Go / Conditional Go / No-Go verdict. Summary chips at top. Falls back gracefully when no Fix Version column is present.

### `app/explore/page.tsx` — Work Item Explorer (`/explore`)

Search for any issue key → loads React Flow graph (focus node + parent + direct children). Highlights risk path (red) and largest unfinished branch (amber). "Blocked only" toggle filters graph and table. Uses `buildRelationGraph()` service.

### `app/snapshots/page.tsx` — Snapshots (`/snapshots`)

Save current metrics as a named snapshot (max 20/user). Load or delete saved snapshots. Compare two snapshots side-by-side with 12-metric delta table.

### `app/trends/page.tsx` — Trends (`/trends`)

SVG line charts for 9 metrics (health score, issues, done, lead time, cycle time, blocked, throughput, data quality, **release confidence**) over up to 30 uploads. Timeline table with deltas. Release Confidence Score is computed at upload time via `src/lib/releaseConfidence.ts` and stored in `ImportLog.metadataJson`.

### `app/teams/page.tsx` — Team Health Comparison (`/teams`)

Per-assignee health comparison sourced from `metrics.capacity[]` and `metrics.flow.items[]`. Computes `TeamHealthEntry[]` via `src/lib/teamHealth.ts` (score = completion×50 + no-critical×30 + no-blocked×20). Renders: member scorecards grid, 4 comparison charts, detail table. Sorted by health score descending.

### `app/portfolio/page.tsx` — Portfolio Summary (`/portfolio`)

Cross-team portfolio aggregation from `metrics.epics[]`, `metrics.projects[]`, `metrics.quarters[]`, and sprint throughput. Computes `PortfolioSummary` via `src/lib/portfolioHealth.ts` (score = epicCompletion×40 + projectCompletion×30 + sprintPerformance×20 + dataQuality×10). Renders: score banner, 6 KPI cards, epic progress panel, project cards, quarter bars, epic detail table.

### `app/customer/page.tsx` — Customer View (`/customer`)

Clean stakeholder summary — completion ring, key milestones, top risks. No technical detail. Print / PDF optimised.

### `app/admin/security/page.tsx` — Security Checklist (`/admin/security`)

Runs `runSecurityChecks()` — 8 automated checks (SESSION_SECRET, HTTPS, DB permissions, etc.) + 5 manual items. 0–100 score, production-ready flag.

### `app/admin/diagnostics/page.tsx` — System Diagnostics (`/admin/diagnostics`)

Admin-only live health dashboard. Fetches `GET /api/admin/diagnostics` — aggregates DB row counts, import success rates, env var presence, system info, recent audit events, and computes an Ops Health Score (0–100). Refresh button for live re-fetch; quick links to all other admin pages.

Also includes a **"Latest Metrics & Cloud Sync"** section (`STORAGE-DEC-10`, added 2026-06-23): whether a live-dashboard snapshot exists on the server and its age (`readLatestMetrics()`), and cloud backup freshness — backup count, newest backup timestamp/key, plus last-fetched/last-pushed/pending-push state (`readStorageSettings()` + `listCloudBackups()` + `getCacheMeta()` from `src/services/storage/`). Surfaces the same underlying data the `DataSourceBadge` reads from, but from an admin/ops angle rather than a per-page glance.

### `app/admin/settings/page.tsx` — Admin Settings (`/admin/settings`)

Admin-only settings console. Tabs include Users, Privacy & Retention, Health Thresholds, Orphan Rules, Backup & Restore, Cloud Storage, and Browser Data.

The Users tab calls `GET/POST/PATCH/DELETE /api/admin/users` and lets admins create users, assign roles (`admin`, `scrum_master`, `product_owner`, `manager`, `c_level`), edit display names, enable/disable accounts, and delete users with confirmation. Password hashes are never returned to the browser, and admins cannot delete or disable their own account.

Each authenticated user edits their shared profile through `/profile`, backed by `GET/PATCH /api/profile`. Shared profile fields include name, position, profile image, telephone, contact email, address, certificates, and any team-facing notes. Profile images are uploaded through `POST /api/profile/image`, stored in the active S3 bucket under `images/profile/`, and rendered back through authenticated `GET /api/profile/image?key=...` URLs so the bucket can remain private. `/members` calls `GET /api/members` and shows all active users to logged-in users as a searchable directory with a detail/contact popup.

Role helpers live in `src/lib/roles.ts`. Admin, Manager, and C-level can request all import logs with `/api/imports?all=true`, while Scrum Master/Product Owner/user remain scoped to their own uploads. Assigned delivery roles are locked to their dashboard view, so saved browser preferences cannot switch a Scrum Master/Product Owner/Manager/C-level user into another role's dashboard view.

When cloud storage is active, auth/admin user flows use cloud-backed SQLite authority rather than browser storage: login/admin user reads call `syncFromCloud()` before user lookup or mutation, and admin user create/update or password-change flows call `pushToCloud()` after the local DB change succeeds.

Public registration is inactive by product policy. `/register` remains as a future adjustment route but redirects to `/login`, `POST /api/auth/register` returns 403, and users can only be created through `/admin/settings → User Management`. Admin-created users are saved with `mustChangePassword=true`; after their first successful login, middleware forces them to `/change-password` until they replace the temporary password.

Route visibility is role-scoped through the same helper module: `allowedRoutePrefixesForRole()`, `canAccessRoute()`, and `fallbackRouteForRole()`. `AppShell` fetches `/api/auth/me` and filters nav items before rendering; `middleware.ts` enforces the same matrix for protected page routes and redirects disallowed direct URL access to the role fallback route.

The admin area uses a shared flat Admin Console shell (`src/components/admin/AdminConsoleLayout.tsx`) across Settings, Diagnostics, Security, and Import Logs. The AppShell exposes these pages in a dedicated Administration navigation group.

The settings layout follows the flat mockup: sticky left settings sidebar, white top context bar, page-level operational status, contextual summary cards for the active tab, and table-first user management. User-count cards only appear on User Management; other tabs show retention, threshold, orphan, backup, cloud, or browser-data summaries. The layout intentionally avoids a marketing-style hero so settings remain dense, scannable, and operational.

Tabs: Health Thresholds, Orphan Rules, Privacy & Retention, Backup & Restore.

---

## 5. Routing Architecture — API Routes

All routes live under `app/api/`. They are Next.js Route Handlers and run server-side.

### `POST /api/upload`

File: `app/api/upload/route.ts`

Accepts a `multipart/form-data` body with a field named `file`.

**Pipeline:**

1. Rate limit check: 20 requests per IP per 15 minutes (in-process map, resets on server restart).
2. File validation: extension must be `.csv`, `.xlsx`, or `.xls`; size must be under 20 MB.
3. `parseJiraFile(fileArg)` — parse buffer into rows, canonicalise headers, collect warnings.
4. `validateIssueData(issues)` — ensure essential fields are present.
5. `calculateDashboardMetrics(issues)` — compute all metrics.
6. `appendImportLog(buildImportLog(...))` — persist to `data/import-logs.json`.
7. Return `{ metrics, warnings, importLog }`.

**Error responses:**

| Status | Condition |
|---|---|
| 400 | No file, wrong extension, or parse failure |
| 413 | File exceeds 20 MB |
| 422 | Validation failed (missing essential fields or empty file) |
| 429 | Rate limit exceeded |
| 500 | Unexpected processing error |

### `GET /api/imports`

File: `app/api/imports/route.ts`

Returns `{ logs: ImportLog[] }` — all entries from `data/import-logs.json`, newest first.

### `GET/PATCH /api/profile`

File: `app/api/profile/route.ts`

Authenticated profile endpoint. `GET` returns the signed-in user's public member profile. `PATCH` updates editable team-facing fields: `name`, `avatarUrl`, `position`, `phone`, `contactEmail`, `address`, `certificates`, and `bio`, writes a `profile_update` audit event, updates the session display name, and pushes the DB backup to cloud when configured.

### `GET/POST /api/profile/image`

File: `app/api/profile/image/route.ts`

Authenticated S3-backed profile image endpoint. `POST` accepts multipart field `image` with JPG, PNG, WebP, or GIF up to 5 MB, stores it in the active S3 bucket under `images/profile/`, updates the user's `avatarUrl`, writes a `profile_image_upload` audit event, and pushes the DB backup to cloud. `GET` streams profile images back through the app for logged-in users, avoiding public S3 object access.

### `GET /api/members`

File: `app/api/members/route.ts`

Authenticated member-directory endpoint. Returns active users only with safe public profile fields: name, account email, role label, position, avatar URL, contact email, phone, address, certificates, and shared team info.

### `GET /api/metrics`

File: `app/api/metrics/route.ts`

Reads the import log file and returns `{ available: true, lastImport: string }` if at least one successful import exists, otherwise `{ error: "No successful import found" }` with status 404.

### `GET /api/dashboard`

File: `app/api/dashboard/route.ts`

Returns a static service status response: `{ status: "ok", service: "delivery-clarity-api", version: "2.0.0" }`.

### `GET /api/health`

File: `app/api/health/route.ts`

Liveness probe. Returns `{ status: "ok", service: "delivery-clarity-api", version: "2.0.0", endpoints: [...] }`.

### `GET /api/backend-view`

File: `app/api/backend-view/route.ts`

Returns aggregate import statistics, the 10 most recent import log entries, and the full endpoint catalogue. Used by `app/backend/page.tsx`.

### `GET /api/developer-view`

File: `app/api/developer-view/route.ts`

Returns static architecture metadata (framework, services, types, health weights) as JSON. Used by `app/developer/page.tsx`.

---

## 6. Service Layer

All services live under `src/services/`. They are pure TypeScript functions with no React dependencies and can be called from both Route Handlers and tests.

### `src/services/jira/parser.ts`

**Exports:** `parseJiraFile`, `ESSENTIAL_FIELDS`, `OPTIONAL_FIELDS`, `EXPECTED_FIELDS`, `FIELD_ALIASES`

**`parseJiraFile(file)`**

Accepts `{ buffer: Buffer, originalname: string }`. Uses SheetJS to read the first worksheet and convert it to JSON rows. Each row is passed through `normalizeRow` which canonicalises header names using `FIELD_ALIASES` (see Section 10).

Returns:
```ts
{
  issues: Record<string, unknown>[];   // canonicalised rows
  warnings: string[];                  // missing optional fields
  headers: string[];                   // final column names
  sheetName: string;                   // name of the first sheet
}
```

**Header canonicalisation details:**

- Strips BOM characters (`﻿`) from column names
- Trims whitespace
- Lowercases and collapses spaces, then looks up in `FIELD_ALIASES`
- Falls back to the original (trimmed) header if no alias matches
- When two aliases resolve to the same canonical name, the first non-empty value wins

### `src/services/jira/validation.ts`

**Exports:** `validateIssueData`

**`validateIssueData(issues)`**

Checks that the parsed rows array is non-empty and that all four `ESSENTIAL_FIELDS` (`Issue Key`, `Issue Type`, `Summary`, `Status`) are present in the first row's keys.

Returns `{ isValid: boolean, errors: string[] }`.

### `src/services/metrics/metrics.service.ts`

**Exports:** `calculateDashboardMetrics`

The core computation engine. Takes `JiraIssue[]` (typed as `Record<string, unknown>[]` in the implementation) and returns a fully typed `DashboardMetrics` object.

**Internal computation order:**

1. `countIssues(isDone)` → `doneIssues`, `activeIssues`, `completionRate`
2. `issues.map(getHealthFromIssue)` → `flowItems: FlowItem[]`
3. `buildRiskMetrics(issues)` → `risk`
4. `buildFlowMetrics(flowItems)` → `flow`
5. `buildSprintMetrics(issues, flowItems)` → `sprint`
6. `buildStatusBreakdown(issues, 'Status', ...)` → `kanban.byStatus`
7. `buildStatusBreakdown(issues, 'High Level Status', ...)` → `kanban.byHighLevelStatus`
8. `buildQuarterMetrics(issues, flowItems)` → `quarters`
9. `buildCapacityMetrics(issues)` → `capacity` (top 10 assignees)
10. `buildEpicMetrics(issues, flowItems)` → `epics` (top 10)
11. `buildLabelMetrics(issues, flowItems)` → `labels` (top 15)
12. `buildTypeMetrics(issues, flowItems)` → `types`
13. `buildProjectMetrics(issues, flowItems)` → `projects`
14. `buildParentMetrics(issues, flowItems)` → `parents` (top 12)
15. `buildLinksMetrics(issues)` → `relations`
16. Inline computation of `storyPoints`, `customerVisibleProgress`, `overallDeliveryConfidence`
17. `calculateHealthScore(...)` → `healthScore`
18. `calculatePrediction(...)` → `prediction`
19. `buildInsights(metrics)` → `insights`

**Key accessors used throughout:**

| Function | What it reads | Fallbacks |
|---|---|---|
| `getDoneDate` | `Done Date` | `Resolution Date`, then `Updated Date` if done |
| `getStartedDate` | `In Progress Date` | `Sprint Start` |
| `getSprintName` | `Sprint` | `Actual Sprint`, `Planned Sprint`, `'No sprint'` |
| `getStoryPoints` | `Story Points` | `parseNumber` → 0 if absent |
| `isDone` | `Status` | Checks against `['Done', 'Closed', 'Resolved']` |
| `isActive` | `Status` | Checks against `['In Progress', 'Code Review', 'QA', 'Testing', 'UAT']` |

### `src/services/imports/importLogs.service.ts`

**Exports:** `readImportLogs`, `buildImportLog`, `appendImportLog`, `renderImportLogView`, `exportImportLogsWorkbook`

Reads and writes `data/import-logs.json`. The file is created if it does not exist. The log array is capped at 200 entries (oldest are dropped). Each log entry has the structure defined by the `ImportLog` interface (see Section 7).

---

## 7. TypeScript Types

### `src/types/jira.ts`

| Export | Description |
|---|---|
| `JiraRawIssue` | `Record<string, unknown>` alias used before canonicalisation |
| `JiraFileInput` | `{ buffer, originalname, size }` passed to the parser |
| `ParseResult` | Return type of `parseJiraFile` |
| `ESSENTIAL_FIELDS` | `const` tuple: `['Issue Key', 'Issue Type', 'Summary', 'Status']` |
| `OPTIONAL_FIELDS` | `const` tuple of all 58 recognised field names |
| `DONE_STATUSES` | `['Done', 'Closed', 'Resolved']` |
| `IN_PROGRESS_STATUSES` | `['In Progress', 'Code Review', 'QA', 'Testing', 'UAT']` |
| `JiraIssue` | Full typed interface — all 58 optional fields plus an index signature for dynamic aliases |

### `src/types/metrics.ts`

| Export | Description |
|---|---|
| `HealthStatus` | `'good' \| 'warning' \| 'critical'` |
| `FlowItem` | Per-issue health record including `leadTimeDays`, `cycleTimeDays`, `ageDays`, `health`, `reason` |
| `FlowSummary` | Aggregation of `FlowItem[]` — counts and average times |
| `FlowMetrics` | `FlowSummary` plus sorted `items: FlowItem[]` |
| `SprintEntry` | Per-sprint breakdown extending `FlowSummary` |
| `SprintMetrics` | `{ hasSprintData, sprintCount, sprints: SprintEntry[] }` |
| `CapacityEntry` | Per-assignee load: issues, active issues, story points, loadShare % |
| `StoryPointMetrics` | `{ totalStoryPoints, completedStoryPoints, remainingStoryPoints, pointCompletionRate }` |
| `PredictionResult` | `{ complete, daysRemaining, predictedDate?, velocityPerDay? }` |
| `RiskMetrics` | `{ blockedIssues, overdueIssues, highPriorityOpenIssues, openDefects }` |
| `DashboardMetrics` | Top-level shape returned by `calculateDashboardMetrics` and stored in `sessionStorage` |

### `src/types/api.ts`

| Export | Description |
|---|---|
| `ApiError` | `{ error: string, details?: string[], code?: number }` |
| `UploadResponse` | `{ metrics: DashboardMetrics, warnings: string[], importLog: ImportLogEntry }` |
| `ImportsResponse` | `{ logs: ImportLogEntry[] }` |
| `ApiResponse<T>` | `T \| ApiError` generic union |
| `ImportLogEntry` | Shape of a single entry in `import-logs.json` |

### `src/lib/utils.ts`

| Export | Description |
|---|---|
| `cn(...inputs)` | Merges Tailwind classes via `clsx` + `tailwind-merge` |
| `formatDays(d)` | Returns `'—'` for null/undefined, otherwise `'Nd'` |
| `formatPct(n)` | Returns `'—'` for null/undefined, otherwise `'N%'` |
| `HealthBand` | `'excellent' \| 'good' \| 'moderate' \| 'at-risk' \| 'critical'` |
| `getHealthBand(score)` | Maps 0–100 score to a `HealthBand` |
| `HEALTH_COLORS` | Record mapping each `HealthBand` to a hex colour string |
| `scrollToSection(id)` | Smooth-scrolls to a DOM element accounting for sticky header height |

---

## 8. How to Add a New Metric

Adding a new metric follows this four-step pattern.

### Step 1 — Add the field to the types

Open `src/types/metrics.ts` and add your field to `DashboardMetrics`:

```ts
export interface DashboardMetrics {
  // ... existing fields ...
  myNewMetric: number;        // add here
}
```

If your metric has sub-structure, create a dedicated interface first and reference it.

### Step 2 — Compute the metric in the service

Open `src/services/metrics/metrics.service.ts`.

Write a builder function following the existing patterns:

```ts
function calculateMyNewMetric(issues: JiraIssue[]): number {
  // Example: count issues where some field equals a value
  return issues.filter(issue => issue['Some Field'] === 'target').length;
}
```

Then call it inside `calculateDashboardMetrics` before the final `return`:

```ts
const myNewMetric = calculateMyNewMetric(issues);

// Include in the returned object:
return {
  ...metrics,
  myNewMetric,
  healthScore,
  prediction,
  insights: buildInsights(metrics),
};
```

If your new metric should influence the health score, update `calculateHealthScore` (see Section 9 for the formula).

### Step 3 — Expose via API if needed

If external consumers need the metric, it will be returned automatically inside `DashboardMetrics` from `POST /api/upload`. No API route changes are required.

If you need a dedicated endpoint, create `app/api/my-metric/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { readImportLogs } from '@/services/imports/importLogs.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  // read last successful import, compute or read myNewMetric
  return NextResponse.json({ myNewMetric: value });
}
```

### Step 4 — Display in a page

The dashboard pages read `DashboardMetrics` through `loadMetricsWithSource()`. Access your metric after the async load with:

```ts
const result = await loadMetricsWithSource();
const metrics = result.metrics as DashboardMetrics;
const value = metrics.myNewMetric;
```

Add a `KpiCard` in `app/summary/page.tsx` or a new section in `app/dashboard/page.tsx`.

### Step 5 — Add a test

Open `src/__tests__/metrics.test.ts` and add a test case:

```ts
it('calculates myNewMetric correctly', () => {
  const metrics = calculateDashboardMetrics(mockIssues);
  expect(metrics.myNewMetric).toBe(expectedValue);
});
```

---

## 9. Health Score Formula

The health score is a single integer in the range 0–100 computed by `calculateHealthScore` in `src/services/metrics/metrics.service.ts`.

### Formula

```
healthScore = round(clamp(raw, 0, 100))

raw =
  completionRate            * 0.28   +   (28%)
  (1 - criticalRatio)       * 100 * 0.24 +   (24%)
  (1 - warningRatio)        * 100 * 0.12 +   (12%)
  latestSprintRate          * 0.14   +   (14%)
  (1 - orphanRatio)         * 100 * 0.12 +   (12%)
  cycleScore                * 0.10       (10%)
```

### Variable definitions

| Variable | Definition |
|---|---|
| `completionRate` | `(doneIssues / totalIssues) * 100` |
| `criticalRatio` | `flow.critical / max(totalIssues, 1)` — capped at 1 |
| `warningRatio` | `flow.warning / max(totalIssues, 1)` — capped at 1 |
| `latestSprintRate` | `sprint.sprints[0].completionRate` if sprint data exists, otherwise `completionRate` |
| `orphanRatio` | `orphanCount / max(totalIssues, 1)` — capped at 1 |
| `cycleScore` | `avgCycleTimeDays === 0 ? 100 : max(0, 100 - (avgCycleTimeDays - 3) * 8)` |

### Cycle score detail

The cycle time score rewards fast cycle times. Score is 100 when `avgCycleTimeDays` is 0 (no data). It decreases by 8 points for each day beyond 3 days. It reaches 0 at approximately 15.5 days average cycle time.

### Health band thresholds (UI display only)

The score is converted to a display band by `getHealthBand` in `src/lib/utils.ts`:

| Band | Score range | Colour |
|---|---|---|
| excellent | 90–100 | `#16a34a` (green) |
| good | 75–89 | `#0f766e` (teal) |
| moderate | 60–74 | `#d97706` (amber) |
| at-risk | 40–59 | `#ea580c` (orange) |
| critical | 0–39 | `#dc2626` (red) |

### Per-issue health classification

Individual `FlowItem` health is computed by `getHealthFromIssue`. Rules in priority order (later rules override earlier ones):

**Good by default** — unless any of the following conditions apply:

| Condition | Health assigned |
|---|---|
| Done, cycle time > 14 days | critical |
| Done, cycle time > 7 days | warning |
| Active (in progress), active age > 14 days | critical |
| Active, active age > 7 days | warning |
| Not started, waiting > 30 days | warning |
| `Blocked Flag` is `true` (any state) | critical (overrides) |
| Due date passed and not done | critical (overrides) |
| High/Highest/Critical priority and still open, health still good | warning |

---

## 10. Field Aliases

Jira exports from different teams and configurations use different column names for the same concept. The parser resolves these automatically through `FIELD_ALIASES` in `src/services/jira/parser.ts`.

The alias map keys are lowercase and whitespace-collapsed. Resolution happens before validation and metric computation, so all downstream code uses canonical names.

### Full alias table

| Alias (lowercased) | Canonical field |
|---|---|
| `issue key` | `Issue Key` |
| `issue type` | `Issue Type` |
| `summary` | `Summary` |
| `status` | `Status` |
| `project name` | `Project` |
| `project key` | `Project` |
| `custom field (team)` | `Team` |
| `assignee` | `Assignee` |
| `reporter` | `Reporter` |
| `status category` | `High Level Status` |
| `priority` | `Priority` |
| `labels` | `Labels` |
| `resolution` | `Resolution` |
| `original estimate` | `Original Estimate` |
| `remaining estimate` | `Remaining Estimate` |
| `time spent` | `Time Spent` |
| `created` | `Created Date` |
| `updated` | `Updated Date` |
| `resolved` | `Resolution Date` |
| `due date` | `Due Date` |
| `parent` | `Parent Key` |
| `parent key` | `Parent Key` |
| `comment` | `Last Comment` |
| `custom field (epic link)` | `Epic Link` |
| `custom field (epic name)` | `Epic Link` |
| `custom field (story points)` | `Story Points` |
| `custom field (story point estimate)` | `Story Points` |
| `custom field (start date)` | `Sprint Start` |
| `custom field (target start)` | `Sprint Start` |
| `custom field (target end)` | `Sprint End` |
| `custom field (actual start)` | `In Progress Date` |
| `custom field (actual end)` | `Done Date` |

### Adding a new alias

To map an additional column name to a canonical field, add a single entry to `FIELD_ALIASES` in `src/services/jira/parser.ts`:

```ts
export const FIELD_ALIASES: Record<string, string> = {
  // ... existing entries ...
  'my custom column name': 'Story Points',  // lowercase, spaces preserved
};
```

The key must be the column header lowercased and with leading/trailing whitespace removed. Internal whitespace is collapsed to a single space.

### Date parsing

Dates are normalised by `parseDate` inside the metrics service. The function handles:

- Excel serial numbers (numeric values between 20000 and 80000)
- Jira standard format: `DD/MMM/YY` or `DD/MMM/YYYY` with optional `HH:MM AM/PM`
- Slash/dash numeric: `MM/DD/YYYY`, `DD-MM-YYYY`, with optional time
- ISO 8601: `YYYY-MM-DD` with optional `THH:MM`
- Native JS `Date` objects passed directly

Two-digit years: values >= 70 are treated as 1900s; values < 70 are treated as 2000s.

---

## 11. Testing

### Test runner

Jest with `ts-jest`. Configuration in `jest.config.js` at the repo root.

```bash
npm test                   # run all tests
npm test -- --watch        # watch mode
npm test -- --coverage     # coverage report
```

### Current test suite

`src/__tests__/metrics.test.ts` covers `calculateDashboardMetrics` with a three-issue mock dataset (`TEST-1` Done, `TEST-2` In Progress, `TEST-3` To Do):

| Test | Assertion |
|---|---|
| `calculates totalIssues correctly` | `metrics.totalIssues === 3` |
| `calculates doneIssues correctly` | `metrics.doneIssues === 1` |
| `calculates completionRate correctly` | `metrics.completionRate === 33` |
| `returns flow items for each issue` | `metrics.flow.items.length === 3` |
| `identifies orphan issues` | all 3 are orphans (no epics in mock) |
| `includes story points metrics` | total 10, completed 3 |
| `calculates healthScore between 0 and 100` | score in range [0, 100] |

### Writing new tests

Tests should be placed in `src/__tests__/`. Follow this pattern:

```ts
import { calculateDashboardMetrics } from '../services/metrics/metrics.service';

describe('my new metric', () => {
  const issues: Record<string, unknown>[] = [
    {
      'Issue Key': 'TEST-1',
      'Issue Type': 'Story',
      'Summary': 'A story',
      'Status': 'Done',
      'My Custom Field': 'value',
    },
  ];

  it('calculates myNewMetric', () => {
    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.myNewMetric).toBe(1);
  });
});
```

Minimum required fields for a valid issue row: `Issue Key`, `Issue Type`, `Summary`, `Status`. All other fields are optional and default to empty string via `parseJiraFile` (SheetJS `defval: ''`).

### Integration-level testing

There are no automated integration or end-to-end tests. To test the upload pipeline manually:

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Upload one of the sample files from `data/` (e.g., `Jira.csv` or `Jira_Raw_Export.xlsx`)
4. Verify the dashboard renders with metrics

To test an API route directly with curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Upload a file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@data/Jira.csv"

# List import logs
curl http://localhost:3000/api/imports
```

### Legacy backend tests

The original Express backend tests live at `backend/tests/metrics.test.js` and run with Node's built-in test runner:

```bash
cd backend && npm test
```

These are not part of the root `npm test` command and are retained for reference only.

---

---

## v3.0 Additions (F1/F2/F3/F4)

### F1 — Throughput Analytics Setup

No additional packages required. The three new services auto-run inside `calculateDashboardMetrics()`:

```
src/services/metrics/throughput.service.ts   — sprint throughput
src/services/metrics/midSprint.service.ts    — mid-sprint patterns
src/services/metrics/kanbanFlow.service.ts   — Kanban flow periods
```

### F2 — Work Item Explorer Setup

```bash
sudo chown -R $(whoami) ~/.npm   # fix npm cache if needed
npm install reactflow @dagrejs/dagre
# /explore route activates automatically
```

Key files:
```
src/services/relations/hierarchy.service.ts
src/services/relations/orphanRelation.service.ts
src/services/relations/relationExplorer.service.ts
src/components/explore/WorkItemGraph.tsx        — React Flow canvas
src/components/explore/RelationDetailsTable.tsx — filterable table
app/explore/page.tsx
```

### F3 — Authentication Setup

```bash
sudo chown -R $(whoami) ~/.npm
npm install prisma @prisma/client iron-session bcryptjs
npm install --save-dev @types/bcryptjs
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Then uncomment the middleware.ts route protection
```

Required environment variables (add to `.env.local`):
```
SESSION_SECRET=your-32-char-secret
DATABASE_URL=file:./data/delivery_clarity.db
ALLOW_OPEN_REGISTRATION=true
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisImmediately1
ADMIN_NAME=Administrator
```

### F4 — Smart Excel Export

No additional packages required (uses existing `xlsx`). The export button now calls `downloadInsightWorkbook()` which produces a 17-sheet statistical workbook.

Key files:
```
src/services/export/excelInsightExport.service.ts   — orchestrator
src/services/export/recommendationEngine.ts          — rule-based recs
```

---

*Delivery Clarity v3.0 — © 2025 Ali Abu Ras — aburasali80@gmail.com*

---

## Package Reference — Dependencies Used by Delivery Clarity

Last verified: 2026-06-02

| Package | Version | Used For | Feature / Area | Runtime Scope | Status | Risk if Removed |
|---------|---------|----------|----------------|---------------|--------|-----------------|
| `next` | 14.2.5 | App Router, SSR, API routes | Core Framework | Shared | Installed | Application fails completely |
| `react` / `react-dom` | ^18.3.1 | UI rendering, hooks, state | Core Framework | Client | Installed | Application fails completely |
| `typescript` | ^5.4.5 | Type safety, interfaces, strict mode | Core Framework | Dev-only | Installed | Type errors uncaught |
| `tailwindcss` | ^3.4.4 | Utility-first CSS styling | UI/Styling | Client | Installed | All styling breaks |
| `sass` | ^1.77.8 | globals.scss global stylesheet | UI/Styling | Client | Installed | Global styles break |
| `xlsx` | ^0.18.5 | Parse Jira CSV/XLSX exports; generate Excel workbook | Upload + Export | Server | Installed | Upload and export completely broken |
| `reactflow` | ^11.11.4 | Interactive hierarchy graph in Work Item Explorer | F2 Work Item Explorer | Client | Installed | Explorer graph fails to render |
| `@dagrejs/dagre` | ^3.0.0 | Hierarchical layout algorithm for React Flow nodes | F2 Work Item Explorer | Client | Installed | Graph layout broken |
| `prisma` | ^5.22.0 | ORM, schema, migrations, SQLite queries | F3 Authentication & Database | Server | Installed | No database access, auth fails |
| `@prisma/client` | ^5.22.0 | Generated Prisma query client | F3 Authentication & Database | Server | Installed | Database queries fail |
| `iron-session` | ^8.0.4 | HTTP-only cookie session management | F3 Authentication & Database | Server | Installed | Login/logout completely broken |
| `bcryptjs` | ^3.0.3 | Password hashing (rounds=12) | F3 Authentication & Database | Server | Installed | Passwords stored in plaintext |
| `@types/bcryptjs` | ^2.4.6 | TypeScript types for bcryptjs | F3 Authentication & Database | Dev-only | Installed | TypeScript errors in auth code |
| `lucide-react` | ^0.427.0 | SVG icon components | UI/Icons | Client | Installed | Icons disappear (minor) |
| `clsx` + `tailwind-merge` | ^2.1.1 / ^2.3.0 | Conditional className, conflict resolution | UI/Styling | Client | Installed | className logic errors |
| `jest` + `ts-jest` | ^29.7.0 / ^29.2.2 | 469 automated tests across 48 test suites (verified 2026-06-07 via `npm test`) | Testing | Dev-only | Installed | No automated testing |

### Cloud Storage SDK Packages (Installed, Dynamically Loaded)

| Package | Purpose | Feature | Status |
|---------|---------|---------|--------|
| `@aws-sdk/client-s3` | Amazon S3 / S3-compatible cloud storage | Cloud Storage | Installed — dynamic import |
| `@azure/storage-blob` | Azure Blob Storage | Cloud Storage | Installed — dynamic import |
| `@google-cloud/storage` | Google Cloud Storage | Cloud Storage | Installed — dynamic import |

### Planned Future Packages (Not Yet Installed)

| Package | Purpose | Feature | Priority |
|---------|---------|---------|---------|
| Jira API client (TBD) | Jira REST API integration | P3 Jira Integration | P3 |
| `nodemailer` ✅ **Installed** | Welcome email on member-request accept | FR-325 | P1 — Done 2026-06-09 |

---

## Cloud Storage & Backup (Implemented — v4.2.x)

**Status:** Implemented and verified. Shipped in PR #3 (P3-01) and hardened in v4.2.1 (cloud restore hardening, credential persistence).

### Goal
Back up the local SQLite database (users, import logs, snapshots, latest-metrics cache, config files) to a self-hosted or cloud storage destination so admins can restore after data loss, and serve user-uploaded profile images through cloud storage when configured.

### Storage Provider Interface (Implemented — `src/types/storage.ts`)
```typescript
export type StorageProviderType = 'local' | 's3' | 'azure' | 'gcp';

export interface StorageProvider {
  readonly type: StorageProviderType;
  upload(key: string, content: Buffer | string, contentType?: string): Promise<string>;
  download(key: string): Promise<string>;
  list(prefix?: string): Promise<CloudObject[]>;
  delete(key: string): Promise<void>;
  test(): Promise<{ ok: true } | { ok: false; error: string; cause?: string; fix?: string }>;
}
```

### Implemented Providers (`src/services/storage/providers/`)
- `LocalProvider` — writes to `data/cloud-backups/` on the host filesystem (default; no credentials needed)
- `S3Provider` — Amazon S3 and S3-compatible endpoints via `@aws-sdk/client-s3` (dynamic import)
- `AzureProvider` — Azure Blob Storage via `@azure/storage-blob` (dynamic import)
- `GcpProvider` — Google Cloud Storage via `@google-cloud/storage` (dynamic import)

Each cloud SDK is loaded dynamically (`storageProvider.ts` factory) so the app starts and runs without any cloud SDK installed — `LocalProvider` is always available as the fallback.

### Supported Operations
- **Provider selection & credentials** — `/admin/settings → Cloud Storage` tab: provider picker (4 cards), per-provider credential forms, redacted display of saved secrets, Test Connection, Upload Backup Now
- **Bucket-first metrics startup** — `/api/metrics/latest` reads `data/latest-metrics.json` from the active cloud provider before falling back to the local cache, so a fresh deployment can boot directly from a cloud backup
- **Cloud-backed user authority** — `syncFromCloud()` runs before login/admin user reads or mutations when cloud storage is active; `pushToCloud()` runs after admin create/update and password-change operations so the user database stays in sync with the cloud backup
- **Backup bundle** — one-click JSON backup of the SQLite DB plus config files (`storage-settings.json`, `latest-metrics.json`, thresholds, orphan rules); restore creates a `.bak` safety copy before overwriting
- **Restore hardening** — security allow-list on restorable file paths, `.bak` rollback on failed restore, auto-restore-on-boot guard (`autoRestore.ts`)
- **Profile images** — when Amazon S3 is the active provider, `/profile` uploads (JPG/PNG/WebP/GIF) are stored under `images/profile/` and served through the authenticated `/api/profile/image` route

### Current Limitations
- Only one provider can be active at a time (no multi-provider replication)
- Profile image upload to cloud storage is implemented for Amazon S3 only; other providers fall back to local storage for images
- No automatic scheduled backups — backups are triggered manually ("Upload Backup Now") or on data-changing admin actions (push-on-change)

### Credential Security
- Credentials are persisted server-side in `data/storage-settings.json` and are never returned to the browser in plaintext — API responses redact secret fields
- Saved credentials survive login, logout, session expiry, refresh, and locked Test Connection / Upload Backup actions; redacted browser-side settings can never overwrite saved server-side secrets with blank values

### Fallback Behaviour
- If no cloud provider is configured, or a cloud operation fails, the system falls back to `LocalProvider` (`data/cloud-backups/`) and surfaces a "local fallback" indicator in the admin UI
- `/api/metrics/latest` falls back from bucket → local cache → live recomputation if all cloud reads fail

### Tests
Covered by `cloudStorage.test.ts`, `cloudRestoreHardening.test.ts`, `storageSettingsPersistence.test.ts`, and `backup.test.ts` (see `product/TEST_CASES.md`, TC-CS-01 to TC-CS-08 and related backup/restore cases).

---

## Backend Integration Gateway (Implemented — Foundation, v4.3)

**Status:** Foundation implemented and tested. **This is not full Jira integration and not full cloud integration** — it is the controlled routing/security/retry/audit layer that *all future* external HTTP calls (Jira API, cloud providers, email, Slack, Teams, push notifications) must be routed through once they're built. No live providers are registered yet; the gateway ships with zero enabled providers and is exercised entirely through its test suite today.

A read-only live Jira integration is now designed (not implemented) on top of this `jira` provider blueprint — see `product/JIRA_INTEGRATION_DESIGN.md` (ARCH-05, 2026-06-20).

### Goal
Today the app makes **zero live external HTTP calls** — Jira import is file-upload/parse only (`src/services/jira/parser.ts`), and cloud storage talks to provider SDKs directly (`src/services/storage/providers/`), not raw HTTP. Before any future feature (Jira live sync, write-back, notifications, coaching evidence fetches, etc.) is allowed to make outbound calls, it must go through one disciplined chokepoint that enforces endpoint allowlisting/SSRF protection, timeout and retry policy, secret redaction, and structured observability — so a single security review covers every future integration instead of one per feature.

### Gateway Interface (`src/server/gateway/`)
```typescript
// types.ts
export type GatewayProviderType =
  | 'jira' | 'aws_s3' | 'azure_blob' | 'gcp_storage'
  | 'email' | 'slack' | 'teams' | 'push_notification' | 'custom';

export type GatewayErrorCategory =
  | 'validation' | 'policy_rejected' | 'timeout' | 'network'
  | 'retryable_http' | 'non_retryable_http' | 'unknown';

export type GatewayRoutingStrategy =
  | 'single' | 'round_robin' | 'weighted_round_robin' | 'failover' | 'least_error_rate';

export interface GatewayRequestOptions {
  provider: GatewayProviderType;
  operation: string;            // e.g. "jira.fetchIssues" — human-readable label, logged
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path?: string;                // appended to the provider's allowlisted base URL — never a raw attacker-controlled URL
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
  userId?: string | null;
  correlationId?: string;
  idempotencyKey?: string;
  routingStrategy?: GatewayRoutingStrategy;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface GatewayResult<T> {
  ok: boolean;
  data?: T;
  status?: number;
  errorCategory?: GatewayErrorCategory;
  error?: string;               // redacted, safe-to-log message
  requestId: string;
  correlationId?: string;
  durationMs: number;
  retryCount: number;
  provider: GatewayProviderType;
  operation: string;
}
```
`callExternal<T>(options): Promise<GatewayResult<T>>` (`externalGateway.ts`) is the **single entry point** — it resolves the provider, policy-validates the endpoint, picks a routing target, executes with timeout/retry, logs every attempt, and returns a typed, redacted result. It never throws; failures come back as `{ ok: false, errorCategory, error }`.

### Implemented Modules (`src/server/gateway/`)
- **`types.ts`** — the shared contract above (`GatewayRequestOptions`, `GatewayResult<T>`, `GatewayLogRecord`, provider/error/routing-strategy unions)
- **`endpointPolicy.ts`** — `validateEndpoint()`: SSRF protection. Enforces `https`-only outside local dev, validates the host against the provider's allowlist, blocks private/internal IP ranges (`10.x`, `172.16-31.x`, `192.168.x`, link-local, etc.) and `localhost` in production, and sanitizes the request path. Returns a structured `{ allowed, reason }` — never throws, never performs a network call when rejected
- **`retryPolicy.ts`** — `DEFAULT_RETRY_POLICY` (10000ms timeout, 2 max retries, exponential backoff), `isRetryable()` (retries `408/429/500/502/503/504`, never retries `400/401/403/404/409/422`), `computeBackoffDelay()`
- **`gatewayLogger.ts`** — `redact()` masks secret-shaped values (tokens, API keys, passwords, cookies, connection strings, service-account JSON) with `[REDACTED]` before anything is logged; `logGatewayCall()` appends a structured `GatewayLogRecord` as a JSON-Lines entry to `data/gateway-audit.jsonl` and silently swallows write errors (mirrors the `.catch(() => {})` convention used for `prisma.auditEvent.create` in `app/api/auth/logout/route.ts`)
- **`providerRegistry.ts`** — `getProviderConfig(type)` / `listRegisteredProviders()` resolve each provider's *blueprint* (which env vars hold its base URL/credentials, extra allowlist hosts, and an `enabled` kill-switch) from **`data/gateway-providers.json`** — falling back to built-in defaults when that file doesn't exist, so the gateway works out of the box. **Nothing about the provider set is static or hard-coded for change purposes**: an operator can repoint a provider to different env-var names, extend its host allowlist, or kill-switch it entirely by editing that JSON file — zero code changes, zero redeploy (`writeProviderConfigFile()` is provided for a future admin UI to manage it). Credential and base-URL *values* are still read from `process.env` **at call time only** — mirroring the `process.env.X ?? default` convention in `src/lib/session.ts` / `src/services/settings/securityCheck.service.ts` — and are never persisted to the config file or returned to the browser. A provider with no configured env vars (or an explicit `"enabled": false` in the config file) reports `enabled: false`, and `callExternal` rejects calls to it before any policy/network step
- **`externalGateway.ts`** — `callExternal<T>()`: looks up the provider → policy-validates the resolved endpoint (SSRF/protocol/host/path) → `resolveRoutingTarget()` picks a candidate (routing strategy) → executes via `fetch` + `AbortController` with timeout and exponential-backoff retry → logs every attempt (redacted) → returns the typed `GatewayResult<T>`

### Why Gateway Records Don't Use the `AuditEvent` Table
Gateway calls are high-volume *operational* telemetry (every outbound HTTP attempt, including retries), not human-readable *user-audit* events like login/logout/upload that the admin UI's audit trail surfaces. Writing every gateway attempt into `AuditEvent` would both pollute that admin-facing trail and require a Prisma migration. Instead, `gatewayLogger.ts` appends redacted JSON-Lines records to `data/gateway-audit.jsonl`, mirroring the existing local-file convention for operational/cache data (`storage-settings.json`, `.cloud-cache-meta.json`) — reversible, schema-free, and keeps the user audit trail clean.

### Security Model (SSRF & Secret Protection)
- **Protocol allowlist** — `https` required outside local development; `http`/`file`/`ftp`/`javascript`/`data` always rejected
- **Host allowlist** — only hosts explicitly registered for a provider may be called; arbitrary hostnames are rejected with `errorCategory: 'policy_rejected'`
- **SSRF protection** — private/internal IP ranges and `localhost` are blocked in production (the registry's allowlisted hosts are the only exception, and only when explicitly configured for local dev)
- **Path/query sanitization** — request paths are validated against the provider's expected pattern before being appended to the allowlisted base URL; raw user-supplied URLs are never dereferenced
- **Secrets never reach the frontend** — the gateway lives entirely under `src/server/`, is imported only from server-side code (API routes / services), reads credentials from `process.env` per call, and `redact()` masks every secret-shaped field before it can be logged or returned in an error message

### Retry, Timeout & Observability
- Defaults: **10000ms timeout**, **2 retries** with exponential backoff; only `408/429/500/502/503/504` are retried, `400/401/403/404/409/422` fail immediately
- Every attempt is logged with: `requestId`, `correlationId`, `userId`, `provider`, `operation`, resolved endpoint, method, start/end timestamps, `durationMs`, HTTP `status`, `retryCount`, `errorCategory`, and a redacted `error` message
- `requestId`/`correlationId`/`idempotencyKey` are present on every request and result — laying the groundwork for future load-balanced/multi-instance deployment (stateless handling, shared config, idempotent retries) without committing to a specific load-balancer architecture today
- `routingStrategy` currently supports only `'single'` (the first registered candidate is used); the type contract already includes `round_robin | weighted_round_robin | failover | least_error_rate` so future routing strategies are additive, not breaking changes

### Current Limitations (Foundation Scope)
- **No live providers are registered.** `listRegisteredProviders()` returns an empty/disabled set until a future feature configures the relevant `process.env` variables — by design, so this closure doesn't over-claim a working Jira/Slack/cloud integration that doesn't exist
- **Existing cloud-storage SDK calls are not yet migrated onto the gateway** — `s3Provider.ts`/`azureProvider.ts`/`gcpProvider.ts` continue to use their native SDKs directly; migrating them is a future hardening task, not part of this foundation
- Only the `single` routing strategy is implemented; `round_robin`/`weighted_round_robin`/`failover`/`least_error_rate` are typed but not yet implemented

### Tests
Covered by `gateway.test.ts` (see `product/TEST_CASES.md`, `TC-GW-01` onward) — endpoint-policy allow/reject decisions (including SSRF cases), retry/backoff behavior, redaction, and an end-to-end `callExternal` happy path against a mocked `fetch`.

---

## P2/P3 — Optional Jira API Integration (Architecture Design Only)

**Status:** Design and backlog planning only. Export-first model remains default.

### Product Positioning
Delivery Clarity is export-first and zero-credential by default. Jira API integration is optional — it must not replace the upload model.

### Future Modes
1. **Export Mode** — default, zero-credential
2. **Connected Jira Mode** — optional API integration
3. **Hybrid Mode** — API fetch + export fallback

### Required Architecture Rule
Future Jira API data MUST flow through the existing analytics pipeline:
```
Jira API response → Jira API adapter → Normalised JiraIssue[] → Existing metrics services → Dashboard
```

### Future Database Tables (Planned)
- `jira_connections` — connection config, URL, credentials (encrypted), test status
- `jira_field_mappings` — canonical field → Jira field mapping per project
- `jira_sync_logs` — sync history, status, issue count
- `jira_suggested_tickets` — recommendations converted to Jira ticket suggestions
- `jira_events` — audit log of all Jira operations

### Write-Back Safety Rules (When Implemented)
- Write-back disabled by default
- Admin must explicitly enable write-back
- User must approve before ticket creation
- No automatic ticket creation
- Preview before send required
- Dry-run mode supported
- Duplicate prevention required
- Never expose Jira credentials to frontend

### Future Jira Events (Planned)
`JIRA_CONNECTION_TEST_STARTED | JIRA_CONNECTION_TEST_SUCCESS | JIRA_CONNECTION_TEST_FAILED | JIRA_SYNC_STARTED | JIRA_SYNC_SUCCESS | JIRA_SYNC_FAILED | JIRA_FIELD_MAPPING_UPDATED | JIRA_TICKET_SUGGESTION_CREATED | JIRA_TICKET_SUGGESTION_APPROVED | JIRA_TICKET_SUGGESTION_REJECTED | JIRA_TICKET_CREATE_STARTED | JIRA_TICKET_CREATE_SUCCESS | JIRA_TICKET_CREATE_FAILED | JIRA_PERMISSION_DENIED`

---

## Email — Welcome Email on Member-Request Accept (Implemented — v4.5.1)

**Status:** Implemented (FR-325). Sends a welcome email to the newly created user when an admin accepts a `UserAddRequest`.

### Configuration

Five env vars in `.env` / `.env.local`. All are optional — if `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` is absent, `sendEmail()` logs a `console.warn` and returns without attempting a connection. The accept request still succeeds.

| Env var | Default | Notes |
|---------|---------|-------|
| `SMTP_HOST` | _(empty — email skipped)_ | SMTP server hostname, e.g. `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` | Use `465` for TLS (sets `secure: true` automatically) |
| `SMTP_USER` | _(empty — email skipped)_ | SMTP auth username |
| `SMTP_PASS` | _(empty — email skipped)_ | SMTP auth password |
| `SMTP_FROM` | `JiraDashboard <noreply@jiradashboard.local>` | Sender display name + address |

### Key Files

- `src/lib/email.ts` — `sendEmail(opts)` (nodemailer wrapper) + `buildWelcomeEmail(name, email, tempPassword)` (returns `{ subject, text, html }`)
- `app/api/admin/user-add-requests/[id]/accept/route.ts` — calls `buildWelcomeEmail` + `sendEmail` after account creation (lines ~116–121), wrapped in `try/catch`

### Testing Locally

Point `SMTP_HOST` at a local SMTP sink such as [Mailpit](https://github.com/axllent/mailpit) (`smtp://localhost:1025`, web UI at `http://localhost:8025`) or [MailHog](https://github.com/mailhog/MailHog). No real emails will be sent.

---

## P4 — Admin & System Notification Center (Planned)

**Status:** Future planning only. Do NOT implement during P0 stabilisation.

### Goal
In-app notification system for admin announcements, system alerts, errors, warnings, and security events.

### Notification Types (Planned)
Admin Announcement, System Alert, Error, Warning, Security Threat, Storage Failure, Jira Integration Failure, Failed Upload, Failed Export, Failed Login Attempt, Data Quality Warning, Maintenance Notice, Release Notice, Action Required, Information

### Notification Severity
`Info | Success | Warning | Error | Critical | Security`

### Notification Audience
`All Users | Admins Only | Specific User | Specific Role | Users Linked to Import`

### Notification Status
`Unread | Read | Acknowledged | Dismissed | Expired`

### Future Database Tables (Planned)
- `notifications` — id, title, message, severity, type, audience, created_by_user_id, requires_acknowledgement, expires_at
- `notification_recipients` — notification_id, user_id, status, read_at, acknowledged_at, dismissed_at
- `notification_events` — notification_id, user_id, event_type, metadata_json

### Suggested UI Routes (Planned)
- `app/notifications/page.tsx`
- `app/admin/notifications/page.tsx`
- `src/components/notifications/NotificationBell.tsx`
- `src/components/notifications/NotificationDropdown.tsx`

---

## P4 — Maintenance Mode (Planned)

**Status:** Future planning only. Part of P4 Communication / Governance Layer.

### Goal
Admin-controlled feature to temporarily prevent normal user access while system upgrades, migrations, or security handling is in progress.

### Behavior When Active
- Normal users redirected to `/maintenance` page
- Admin users retain access if `allowAdminAccess = true`
- Upload, export, sync, write-back operations blocked
- API routes return `503 Service Unavailable` with JSON body

### API Response During Maintenance (Planned)
```json
{ "status": "maintenance", "message": "Delivery Clarity is currently under maintenance.", "expectedReturnAt": "2026-06-02T18:00:00+03:00" }
```

### Future Database Tables (Planned)
- `maintenance_settings` — is_enabled, title, message, expected_return_at, allow_admin_access, enabled_by_user_id
- `maintenance_events` — event_type, user_id, metadata_json

### Maintenance Events (Planned)
`MAINTENANCE_MODE_ENABLED | MAINTENANCE_MODE_DISABLED | MAINTENANCE_SETTINGS_UPDATED | MAINTENANCE_USER_REDIRECTED | MAINTENANCE_ADMIN_ACCESS_GRANTED | MAINTENANCE_UPLOAD_BLOCKED`

### Maintenance Status Values (Planned)
`Enabled | Disabled | Scheduled | Expired`


---

## v4.1 — UX Design System Developer Notes (2026-06-04)

### Pill Button System

All buttons use `globals.scss` utility classes. Do not use `rounded-lg` or `rounded-xl` on buttons.

```scss
// Use these — all rounded-full
.btn-primary    // blue filled
.btn-secondary  // white outlined
.btn-ghost      // transparent
.btn-danger     // red filled
.btn-outline-danger  // red outlined → fills on hover
.btn-green      // green filled
.btn-dark       // slate-900 filled
.btn-warning    // amber outlined
.btn-sm         // size modifier: px-3 py-1 text-xs
.btn-xs         // size modifier: px-2.5 py-0.5 text-[10px]
```

For colour overrides on `btn-primary` or `btn-green` use inline `style={{ background: "#hex" }}`.

### Dashboard Section Switcher

**Files:**
- `src/lib/dashboardSections.ts` — `DASHBOARD_SECTIONS` array (14 entries), `OVERVIEW_KEYS`, `SectionMode` type
- `src/components/dashboard/DashboardSectionSwitcher.tsx` — the sticky tab bar component

**Adding a new section:**
1. Add a section to `DASHBOARD_SECTIONS` in `dashboardSections.ts`
2. Add `<section id="section-{key}">` with `className="dashboard-section ..."` in `dashboard/page.tsx`
3. Add a `CollapsibleTrigger id="{key}"` above the section
4. Add the key to the appropriate `SECTION_GROUPS` array in `DashboardSectionSwitcher`

### Clear Local Data

**Files:**
- `src/lib/clearLocalData.ts` — `hasLocalData()`, `clearLocalData()`, `DC_FIXED_KEYS`
- `src/components/admin/ClearLocalDataPanel.tsx` — admin settings panel

To add a new localStorage key owned by the app: add it to `DC_FIXED_KEYS` in `clearLocalData.ts`.

### Flow Panel Access Control

Set `hideFlowPanel: true` on a `DashboardView` in `src/types/dashboardView.ts` to:
- Hide the entire `<section id="flow-health-panel">`
- Hide the filter row (All / High Risk / Blocked / Needs Review / Clear / Show filters)
- Disable KPI card onClick handlers that open the flow panel
- Skip `setFlowPanelOpen(true)` in `applyQuickFilter`

### Dynamic Imports for Heavy Libraries

`xlsx` and `excelInsightExport.service` are lazy-loaded. Do NOT add static `import * as XLSX from "xlsx"` in any client-side file. Instead:

```typescript
// Inside an async function triggered by user action:
const XLSX = await import("xlsx");
const { downloadInsightWorkbook } = await import("@/services/export/excelInsightExport.service");
```
---

## 12. Deployment

See **`product/DEPLOYMENT_GUIDE.md`** for the full guide. Summary:

### Deployment targets

| Target | Command | Persistence | Recommended |
|--------|---------|------------|-------------|
| **Docker** | `docker compose up -d --build` | Volume mount | ✅ Production |
| **VPS / PM2** | `pm2 start npm -- start` | Local filesystem | ✅ Production |
| **Vercel** | `git push` → auto-deploy | ❌ Ephemeral | Demo only |

### Key files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (deps → builder → runner), non-root user |
| `docker-compose.yml` | Service definition, volume mount, healthcheck, env vars |
| `.env.example` | Template for all environment variables |
| `product/DEPLOYMENT_GUIDE.md` | Full 12-section deployment manual |

### Minimum production env vars

```bash
SESSION_SECRET=<openssl rand -hex 32>   # REQUIRED — 32+ chars
DATABASE_URL=file:./data/delivery_clarity.db
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong password>
```

### nginx upload size

Set `client_max_body_size 25M;` in the nginx site config. Without this, Jira CSV exports > 1 MB will fail with a 413 error.

### Post-deploy

1. Log in and **change the admin password** immediately
2. Visit `/admin/security` and aim for score ≥ 80
3. Test file upload with a real Jira export
4. Set up cron backups (see DEPLOYMENT_GUIDE.md §11)

### Product Tour

**Library:** None — pure React + CSS animations.

**State:** `src/lib/tour.ts` — `dismissTour()`, `completeTour()`, `resetTour()`, `TOUR_STEPS[]`; persisted to `dc_tour_dismissed` / `dc_tour_completed` in localStorage.

**Component:** `src/components/tour/ProductTour.tsx` — lazy-loaded via `dynamic(() => import(...), { ssr: false })`.
- `HighlightRing`: `position:fixed` pulsing border ring around the target element (tracked by `requestAnimationFrame`)
- `TourPopover`: dark `position:fixed` card with progress dots, navigation buttons, keyboard handler
- `Backdrop`: semi-transparent overlay, click to dismiss
- Injects `@keyframes dc-tour-pulse` and `dc-tour-fadein` once via `<style>` tag

**Tour triggers:**
- `/summary` — "Take a tour" button fires `router.push('/dashboard')` then `dc:start-tour` event after 600ms
- `/dashboard` — "Tour" button dispatches `window.dispatchEvent(new CustomEvent('dc:start-tour'))`
- `ProductTour` listens for `dc:start-tour` and sets `active = true`

**Reset for development:** Run `resetTour()` from the browser console, or clear `dc_tour_dismissed` and `dc_tour_completed` from localStorage.

---

## System Error Logger (`src/lib/system-error-logger.ts`)

Centralised helpers that make every database write resilient and observable.

### `logSystemError(opts)`

Writes a row to the `SystemErrorLog` table. Never throws — if the log write itself fails, it is silently swallowed to avoid cascading errors.

```ts
await logSystemError({
  errorCode:   'P2003',
  errorMessage: e.message,
  prismaModel:  'AuditEvent',
  operation:    'create',
  context:      'safeAuditEvent',
  payload:      JSON.stringify(data),  // stored for replay
});
```

### `withDbRetry(fn, opts?)`

Wraps any `async` Prisma call with exponential back-off retries.

```ts
await withDbRetry(
  () => prisma.notification.createMany({ data }),
  { context: 'safeNotifications', retries: 3, delayMs: 400 }
);
```

| Option | Default | Description |
|--------|---------|-------------|
| `retries` | `3` | Maximum retry attempts |
| `delayMs` | `400` | Base delay (doubles each attempt) |
| `context` | `''` | Label stored in SystemErrorLog |

Non-retriable codes (P2003, P2025, P2002, P2014, P2015) are never retried — the error is logged immediately and rethrown.

### `safeAuditEvent(data)`

Drop-in replacement for `prisma.auditEvent.create()`. On Prisma P2003 (foreign key — typically a deleted user still holding a valid session cookie), retries once with `userId: null` to preserve the audit record, and logs the incident to `SystemErrorLog` as `auto-fixed`.

```ts
// Before
await prisma.auditEvent.create({ data: { userId, eventType, ... } });

// After
await safeAuditEvent({ userId, eventType, ... });
```

### `safeNotifications(data, context?)`

Drop-in replacement for `prisma.notification.createMany()`. Wraps with `withDbRetry` and logs failures to `SystemErrorLog`.

### Ghost Session Pattern

Iron-session cookies have an 8-hour TTL. When a user account is deleted the cookie remains valid, causing FK violations on any subsequent write. The canonical guard:

```ts
// In any API route that creates records referencing session.userId
const requester = await prisma.user.findUnique({
  where: { id: session.userId },
  select: { id: true },
});
if (!requester) {
  return NextResponse.json(
    { error: 'Your account no longer exists. Please sign in again.' },
    { status: 401 }
  );
}
```

Additionally, `DELETE /api/admin/users` cancels pending add-requests for the deleted user's email before deletion:

```ts
await prisma.userAddRequest.updateMany({
  where: { requestedEmail: user.email, status: 'pending' },
  data:  { status: 'cancelled', adminDecisionNote: 'User account deleted.' },
});
```

### `SystemErrorLog` — Prisma Model

```prisma
model SystemErrorLog {
  id            String    @id @default(cuid())
  errorCode     String
  errorMessage  String
  prismaModel   String?
  operation     String
  context       String?
  payload       String?   // JSON — used for retry replay
  resolution    String    @default("logged")
  retryCount    Int       @default(0)
  lastRetriedAt DateTime?
  resolvedAt    DateTime?
  createdAt     DateTime  @default(now())
  @@index([errorCode])
  @@index([createdAt])
  @@index([resolution])
}
```

Resolution values: `logged` · `auto-fixed` · `retried` · `resolved` · `skipped`

---

### In-App Notification Bell and APIs (Implemented — v4.5)

**API routes:**
- `GET /api/notifications` (`app/api/notifications/route.ts`) — authenticated; returns current user's `Notification` records, max 50, newest first. Uses `getIronSession` + `prisma.notification.findMany({ where: { recipientUserId: session.userId } })`.
- `PATCH /api/notifications/[id]/read` (`app/api/notifications/[id]/read/route.ts`) — authenticated; validates `notification.recipientUserId === session.userId` before update; returns 404 on mismatch or missing record.

**Component:** `src/components/auth/NotificationBell.tsx`
- Rendered in `src/components/layout/AppShell.tsx` next to `UserMenu` when `showNav` is true
- Uses `useCallback` + `setInterval` for 30-second polling; cleans up on unmount
- Admin role also polls `GET /api/admin/user-add-requests?status=pending` for the pending request count
- Persistent amber strip: `position: fixed`, `top: 56px` (header height), `z-index: 30`; only shown when `isAdmin && pendingRequests > 0`
- Bell wiggle keyframe defined in `tailwind.config.ts` under `theme.extend.keyframes.wiggle` and `theme.extend.animation.wiggle`

**Testing:** `src/__tests__/notifications.test.ts` — 5 tests (TC-NOTIF-01–05)

---

### User Management — Multi-Select Bulk Operations (Implemented — v4.5)

The User Management table (`UserManagementSettings` in `app/admin/settings/page.tsx`) supports per-row checkbox selection and bulk operations:
- `selected: Set<string>` state tracks selected user IDs
- `useRef<HTMLInputElement>` drives the `indeterminate` property on the select-all checkbox via a `useEffect` watching `selected` and `filteredUsers`
- Bulk action bar renders above the table when `selected.size > 0`; bulk role change calls `PATCH /api/admin/users` per user; bulk delete calls `DELETE /api/admin/users` per user with a shared `ConfirmDeleteDialog`
- Selection clears via `useEffect([query, roleFilter])` on filter changes
- Delete (🗑) and pause (⏸/▶) buttons are co-located with the status badge in the final "Status & Actions" column — no horizontal scroll required

---

## Role-Based Delivery Coaching Insights (Implemented — v4.10.0)

Pure interpretation layer over the already-computed `DashboardMetrics` — closes `RBC-01`–`RBC-20` (TODO-List.md Section 16). No new metric calculations were introduced.

**Module layout:** `src/services/coaching/`
- `ceremonyAdvice.service.ts` — `buildCeremonyAdvice(metrics)`, computed once and embedded identically into every visible category (RBC-10–14)
- `coachingConfidence.service.ts` — `aggregateCategoryConfidence(metrics, relevantKeys)` (RBC-17; formula in `product/ALGORITHM_SPEC.md`)
- `coachingMetricsAccess.ts` — `getRelations()`/`getEpics()`, small typed accessors for the `DashboardMetrics` fields (`relations`, `epics`) that `src/types/metrics.ts` declares as `unknown` even though the runtime shape (built in `metrics.service.ts`) is concrete; scoped to this feature, does not touch the existing exported type
- `adminSignals.service.ts` — `getAdminCoachingSignals()` (server-only); reuses `prisma.systemErrorLog.count()`, `readStorageSettings()`, and `getCacheMeta()` (read-only — never `syncFromCloud()`)
- `generators/*.generator.ts` — one pure function per category: `generateScrumMasterInsight()`, `generateProductOwnerInsight()`, `generateEngineeringManagerInsight()`, `generateDeliveryManagerInsight()`, `generateTeamLeadInsight()`, `generateCLevelInsight()`, `generateAdminInsight()` — each `(metrics, ceremonyAdvice) => RoleBasedCoachingInsight`
- `coachingOrchestrator.service.ts` — `visibleCategoriesForRole(role)` (RBC-16 role→category mapping) and `generateAllCoachingInsights(metrics, role, adminSignals?)`

**Types:** `src/types/roleBasedCoaching.ts` — `CoachingCategory` (7 values), `RoleBasedCoachingInsight`, `CeremonyAdvice`, `CoachingEvidence`, `CoachingConfidence`, `CoachingInsightsBundle`. Severity reuses the existing `CheckSeverity` union; confidence band reuses the existing `ConfidenceBand` union — no new severity/confidence scales were introduced.

**Known data-shape constraint:** `calculateReleaseReadiness()` (`releaseReadiness.service.ts`) groups by the raw `Fix Version/s` field, which exists only on originally-uploaded issue records — not on the normalized `FlowItem` shape inside `DashboardMetrics.flow.items` (no Fix Version is captured there). The existing `/release-readiness` and `/readiness` pages already call it with `flow.items` and therefore always get `hasVersionData: false` in practice — a pre-existing gap, not introduced by this feature. The Engineering Manager, Delivery Manager, and C-level coaching generators deliberately avoid calling `calculateReleaseReadiness()` for this reason and instead use `prediction`, `overallDeliveryConfidence`, and `risk` — fields that are reliably populated on `DashboardMetrics`.

**Route:** `app/dashboard/coaching/page.tsx` (Client Component) — fetches `DashboardMetrics` via the existing `loadMetricsWithSource()` and the current role via the existing `GET /api/auth/me`, identical to every other `/dashboard/*` page; additionally fetches `GET /api/coaching/admin-signals` (new, admin-only) only when the resolved role is `admin`. Registered in `DashboardNavSidebar.tsx`'s `ROUTE_ACCESS` map for all 6 roles — category filtering happens inside the page (via `visibleCategoriesForRole()`), not by hiding the nav entry.

**Components:** `src/components/dashboard/CoachingInsightCard.tsx`, `CoachingCategoryTabs.tsx` (tabs render only when a role has >1 visible category — `manager` and `admin`). Severity renders via the existing `Badge` component (`severityToBadgeVariant()` in `src/lib/coachingBadge.ts`), never a raw color.

**Testing:** `src/__tests__/roleBasedCoaching.test.ts` — 20 tests (`TC-RBC-01`–`09` + edge cases per CLAUDE.md §45.1: zero issues, empty `sprint.sprints`, confidence threshold boundaries, undefined `relations`). Suite: 689/71 passing.

## Coaching Insights Redesign & Encouragement Enhancements (Implemented — v4.10.1)

Presentation redesign of the page above plus two small derived-data helpers — closes `RBC-21`–`RBC-26` (TODO-List.md Section 16). No coaching generator, confidence formula, or severity rule is changed.

**New services:**
- `src/services/coaching/coachingTrend.service.ts` — `computeSeverityTrend(current, previous): 'improved' | 'worsened' | 'same'` — pure comparison of `SEVERITY_RANK` (now exported from `src/lib/coachingBadge.ts`; critical=0, high=1, medium=2, low=3); lower rank = more urgent, so a current rank higher than the previous rank is `'improved'`.
- `src/lib/coachingEvidenceLink.ts` — `resolveEvidenceRoute(metricKey): string | null` — static prefix-match table mapping each coaching evidence family to its authoritative `/dashboard/*` route (`flow.*` → flow-health, `throughput.kanban.*` → kanban-health, `throughput.sprint.*` → sprint-status, `relations.*`/`risk.overdueIssues` → priority-attention, `risk.highPriorityOpenIssues`/`prediction.*`/`overallDeliveryConfidence` → delivery-controls, `capacity*` → ownership, `dataQuality.*` → data-quality, `epics[].*` → epic-readiness, `adminSignals.*`/`healthScore`/`completionRate` → summary). No mapping found → `null`, and the evidence chip stays non-interactive.

**Trend data source:** `app/dashboard/coaching/page.tsx` fetches `GET /api/snapshots` (existing Snapshots feature endpoint, newest-first) and, when ≥2 exist, `GET /api/snapshots/:id` for the second-most-recent one; its `metricsJson` is parsed and re-run through the existing `generateAllCoachingInsights()` to get each category's previous severity. This intentionally reuses the existing `DashboardSnapshot` Prisma model and Snapshots API — no new persistence was added, and the trend is silently omitted (not faked) when fewer than 2 snapshots exist or either fetch fails.

**Component changes:**
- `CoachingInsightCard.tsx` — rewritten layout: mood-led hero banner (with trend badge + confidence-aware "Early signal:" prefix + quick-win celebration headline for `low` severity), evidence stat chips (clickable when `resolveEvidenceRoute()` resolves), merged "What to Watch" list, merged "Do This Next" checklist, collapsed-by-default Ceremony Advice accordion (with an `EmptyRow` "all clear" state when nothing fired), "Try This Next Sprint" highlight strip. Tailwind `slate-*` utilities replaced with real design tokens.
- `CoachingCategoryTabs.tsx` — accepts `severityByCategory`; renders a small urgency nudge dot on any non-active tab whose severity is `high`/`critical`.
- `app/dashboard/coaching/page.tsx` — sorts `bundle.categories` by `SEVERITY_RANK` before rendering tabs/default-active category; computes `trendByCategory` and `severityByCategory` and passes them down; dropped the old non-standard `.page` wrapper for the shared `shellStyles.pageBody` convention used by sibling `/dashboard/*` pages.

**Testing:** `src/__tests__/coachingTrend.test.ts` (3 tests) and `src/__tests__/coachingEvidenceLink.test.ts` (2 tests) — `TC-RBC-10`–`13`. Suite: 694/73 passing.

## Retrospective Upload, Insights Engine, and `.xlsx` Template (Implemented — v4.7)

Closes `RETRO-04`–`RETRO-13`, `RETRO-17`, `RETRO-19`–`RETRO-22`, `RETRO-29`, `RETRO-33`–`RETRO-38` (TODO-List.md Section 17). Persistence (`RETRO-15`/`RETRO-30`) and metric-linking (`RETRO-14`) are explicitly out of scope — there is no new Prisma model and nothing is saved server-side; every upload is a stateless preview.

**Module layout:** `src/services/retro/`
- `retroFileParser.service.ts` — `parseRetroFile(buffer, filename)`. For `.csv`, uses a dedicated minimal RFC4180 parser (`parseCsvText()`) rather than the `xlsx` package — `XLSX.read()` was found during implementation to silently reformat ISO-date-like CSV strings (e.g. `"2026-06-08"`) into a locale date string, which would have corrupted any date column on upload. For `.xlsx`/`.xls`, uses `XLSX.read()` (binary cell types are accurate there). For `.md`/`.txt`, uses a heading + bullet heuristic (`parsePlainTextRetro()`). Header aliasing (`HEADER_ALIASES`) accepts both this app's template headers and the original RETRO-05 spec naming.
- `retroInsights.service.ts` — `generateRetrospectiveInsight(record, source, repeatedBlockers?)` and `generateInsightsForRecords(records, source)`, the shared engine behind both the in-app form and the uploaded-file flow. Replaces the old flat-string `generateInsights(form)` that used to live inline in `app/retro/page.tsx` (see `product/ALGORITHM_SPEC.md`'s "superseded" note). `detectRepeatedBlockers(records)` is the cross-record signal that only exists for multi-sprint uploads.
- `retroTemplate.service.ts` — `downloadRetroExcelTemplate()`, client-side `.xlsx` generation using the same `XLSX.writeFile()` pattern as `exportExplorerToExcel()` (`src/services/export/explorerExport.service.ts`).

**Types:** `src/types/retrospective.ts` — `RetroRecord`, `RetroActionItem`, `RetrospectiveInsight` (RETRO-37), `ThemeCategory`/`ThemeMatch`, `RetroDataCorrection`, `BacklogItemType`/`SuggestedBacklogItem`.

**Route:** `POST /api/retro/parse` (`app/api/retro/parse/route.ts`) — session-authenticated (401 if not logged in), validates extension (`.csv`/`.xlsx`/`.xls`/`.md`/`.txt`) and size (≤5 MB), calls `parseRetroFile()` then `generateInsightsForRecords()`, returns `{ records, insights, warnings, corrections }`. No persistence — purely a parse-and-preview endpoint.

**Page:** `app/retro/page.tsx` gained two new views — `upload` (file picker) and `upload-insights` (one shared `InsightPanel` per parsed sprint, plus warnings/corrections). The existing `form`/`insights` views were updated to call the shared engine (`formToRecord()` maps `RetroForm` → `RetroRecord`) instead of the old inline flat-string function, so the in-app form gets theme detection, ownership-gap flags, and duplicate-action-item warnings it didn't have before. The file keeps its pre-existing inline-style convention (it is not on CLAUDE.md §60's named refactor-priority list) — new UI reuses the file's existing `sectionCard`/`inputSt`/`labelSt` style objects rather than introducing a parallel pattern or an unrelated SCSS-module migration.

**Post-release fixes (2026-06-26, same day):** user testing reported the report as "not useful." Root cause: `detectThemes()` ran over `wentWell + didntGoWell + blockers` combined, so positive feedback (e.g. "Automated tests caught regressions") was flagged as a `qa-release` *problem* theme and then cited in suggestions as something to address. Fixed by restricting theme detection to `didntGoWell + blockers` only; `wentWell` still counts toward `confidence` (more filled-in fields = more reliable input) but never toward theme/problem detection. Also added `buildSuggestedBacklogItems()` — concrete, copy-pasteable `story`/`task`/`spike` suggestions (with a Copy button in the UI) distinct from the free-text `nextSprintSuggestions`/`ceremonyRecommendations`, per a direct follow-up request ("suggest stories/tasks for next sprint"). See `product/ALGORITHM_SPEC.md`'s "v4.7" section for both algorithms.

**Testing:** `src/__tests__/retroFileParser.test.ts` (8 tests, `TC-RETRO-08`–`13` + `08b`) and `src/__tests__/retroInsights.test.ts` (14 tests, `TC-RETRO-14`–`25`, including 2 regression tests for the theme-pollution fix). Suite: 710/73 passing.

**Second post-release pass (2026-06-26):** `SuggestedBacklogItem`'s single `rationale` field was replaced with `description` (a standard story/task/spike write-up — "As a team, we want ... so that ..." + acceptance criteria for stories, "Task:"/"Spike:" + acceptance criteria/goal for tasks/spikes) and `evidence` (the real retro signal that triggered it, kept separate so the description reads like an actual backlog item, not retro commentary) — direct follow-up feedback that the original phrasing read as commentary. Also fixed the Copy button silently failing in some contexts (`navigator.clipboard.writeText()` had no fallback); `copyToClipboard()` now falls back to a hidden-textarea/`execCommand` approach and the button shows "Copied!"/failure feedback. Copy and the disabled "Create in Jira" placeholder now share one base style (`backlogItemButtonSt`) with distinct active/disabled variants (`backlogCopyButtonSt`/`backlogJiraButtonSt`), in a footer row inside the item's border.

## Forecast Engine Extraction, Data-Quality-Aware Confidence, and Risk Diagnosis (Implemented — v4.6.1)

Closes `FCAST-14`–`FCAST-26` (TODO-List.md Section 18). The `/forecast` page already had more chart coverage than the original spec — burn-up, burn-down, velocity, sprint performance table, delivery pattern breakdown, delivery levers, next-quarter plan — so this work targets the genuine gaps: `computeForecast()` had **zero** test coverage, confidence ignored Data Quality entirely, and there was no "why" diagnosis beyond a flat adjustments list.

**Extraction:** `computeForecast()` moved from inline in `app/forecast/page.tsx` to `src/services/forecast/forecastEngine.service.ts`, with its types in `src/types/forecast.ts` (`ForecastResult`, `ForecastStatus`, `SprintPoint`, `WeakestFactor`, `WeakestFactorKind`) — same rationale and pattern as the `src/services/retro/retroInsights.service.ts` extraction: a `'use client'` page file can't be imported into Jest, and mirroring ~75 lines of business logic in a test file would have violated CLAUDE.md §29 ("Calculation Single Source of Truth"). Page behavior is unchanged by the move.

**Confidence (FCAST-23):** now blends a structural score (sprint count/velocity-trend/blocked-count) with `metrics.confidence.sprintThroughput`/`velocity`, then applies the same ×0.75 (Weak) / ×0.5 (Critical) Data Quality downgrade multipliers as the Coaching Confidence Score (`product/ALGORITHM_SPEC.md`) — reused as a documented formula, not reinvented, so "Weak data quality" means the same thing everywhere in the app. `confidenceReason` always cites real numbers.

**Weakest-factor diagnosis (FCAST-19/20):** `weakestFactor: WeakestFactor` identifies the single biggest drag on the forecast (blockers > critical items > scope growth > data quality > declining throughput > none), checked in that priority order. Rendered as a "Forecast Diagnosis" card on `/forecast` directly under the status banner, `data-kind` driving its color tone.

**Adjustment rules (FCAST-21):** two new rules beyond the pre-existing set — heavy mid-sprint scope growth and an active Data Quality downgrade — each gated by a real signal.

**New charts:** "Throughput: Required vs. Current" (FCAST-14) — two bars comparing current avg throughput to what's needed to be on-track within 6 sprints. "Risk & Scope Trend" (FCAST-15/16/17, **consolidated into one chart** — all three are risk-signal-over-time views of the same per-sprint `addedScopeCount`/`blockedCount` data; three separate cards would have tripled chart density without adding distinct information). Both live in `app/forecast/page.tsx`; the trend chart's data (`scopeTrend`) is computed in the service, only populated when rich `SprintThroughputSummary` data is available (empty — and the chart hidden — for the legacy 8-sprint-capped shape).

**Testing:** `src/__tests__/forecastEngine.test.ts` — 12 tests (`TC-FCAST-01`–`13`, IDs aligned with the pre-existing manual scenarios in `product/TEST_CASES.md` §9.55 where they overlap). Closes a real gap: `TC-FCAST-04` (at-risk status) existed only as a manual scenario with no automated coverage before this change. Suite: 700/72 passing (figure as of this branch; see TODO-List.md for the final merged-main count).
