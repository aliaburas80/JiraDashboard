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
| `ALLOW_OPEN_REGISTRATION` | `false` | Set `true` to allow public registration |
| `DATABASE_URL` | `file:./data/delivery_clarity.db` | SQLite DB path (Prisma) |

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
│   ├── globals.scss              # Global styles (Tailwind base + custom)
│   ├── page.tsx                  # / — Upload page (home)
│   ├── summary/page.tsx          # /summary — Health overview
│   ├── charts/page.tsx           # /charts — Visual analytics
│   ├── dashboard/page.tsx        # /dashboard — Full delivery report
│   ├── trends/page.tsx           # /trends — Upload-to-upload trend analysis
│   ├── explore/page.tsx          # /explore — Work Item Explorer (React Flow)
│   ├── readiness/page.tsx        # /readiness — Release readiness checklist
│   ├── customer/page.tsx         # /customer — Customer-facing summary
│   ├── snapshots/page.tsx        # /snapshots — Saved metric snapshots
│   ├── backend/page.tsx          # /backend — Import logs & backend status
│   ├── glossary/page.tsx         # /glossary — Abbreviations & metric guide
│   ├── developer/page.tsx        # /developer — Developer wiki UI
│   ├── help/page.tsx             # /help — FAQ / help guide
│   ├── login/page.tsx            # /login — Authentication
│   ├── register/page.tsx         # /register — New account
│   ├── profile/page.tsx          # /profile — User settings
│   ├── admin/
│   │   ├── logs/page.tsx         # /admin/logs — Import log management
│   │   ├── settings/page.tsx     # /admin/settings — Backup, restore, thresholds
│   │   └── security/page.tsx     # /admin/security — Production security checklist
│   └── api/
│       ├── upload/route.ts       # POST /api/upload — parse + metrics + save log
│       ├── imports/route.ts      # GET  /api/imports — logs (user-scoped or all for admin)
│       ├── snapshots/route.ts    # GET/POST /api/snapshots
│       ├── snapshots/[id]/route.ts # DELETE /api/snapshots/:id
│       ├── auth/login/route.ts   # POST /api/auth/login
│       ├── auth/logout/route.ts  # POST /api/auth/logout
│       ├── auth/register/route.ts # POST /api/auth/register
│       ├── auth/me/route.ts      # GET  /api/auth/me
│       ├── admin/backup/route.ts # GET  /api/admin/backup
│       ├── admin/restore/route.ts # POST /api/admin/restore
│       └── settings/*/route.ts   # GET/POST various admin settings
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx      # Sticky header with 4-group dropdown nav + mobile hamburger
│   │   ├── auth/
│   │   │   └── UserMenu.tsx      # Avatar dropdown (name, role badge, sign out)
│   │   ├── admin/
│   │   │   └── BackupRestoreSettings.tsx
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
│   └── __tests__/                # Jest test suites (280+ tests across 22 files)
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

## 4. Routing Architecture — Pages

All analytics pages are React Client Components (`'use client'`). They call `loadMetricsWithSource()`, which first fetches `/api/metrics/latest` to restore metrics from the bucket-backed server copy, then falls back to browser `localStorage` (`dc_metrics_v2`) if no server/bucket payload is available. If both are missing the router redirects to `/` (upload).

### Navigation structure

The `AppShell` header renders 4 dropdown groups:
- **Analytics**: `/summary`, `/dashboard`, `/charts`, `/trends`, `/teams`, `/portfolio`
- **Reference**: `/landing` (About), `/glossary`, `/developer`, `/help`
- **Delivery**: `/readiness`, `/explore`, `/customer`
- **Data**: `/snapshots`, `/backend`
- **Reference**: `/glossary`, `/developer`, `/help`

Mobile: hamburger button opens a 2-column grid panel below the header.

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

### `app/admin/settings/page.tsx` — Admin Settings (`/admin/settings`)

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
| `jest` + `ts-jest` | ^29.7.0 / ^29.2.2 | 253 automated tests across 21 test suites | Testing | Dev-only | Installed | No automated testing |

### Planned Future Packages (Not Yet Installed)

| Package | Purpose | Feature | Priority |
|---------|---------|---------|---------|
| `@aws-sdk/client-s3` | Amazon S3 cloud storage | P3 Cloud Storage | P3 |
| `@azure/storage-blob` | Azure Blob Storage | P3 Cloud Storage | P3 |
| `@google-cloud/storage` | Google Cloud Storage | P3 Cloud Storage | P3 |
| Jira API client (TBD) | Jira REST API integration | P3 Jira Integration | P3 |
| `nodemailer` (TBD) | Email notification channel | P4 Notifications | P4 |

---

## P2 — Admin Storage & Backup (Architecture Design Only)

**Status:** Design and backlog planning only. Do NOT implement full cloud storage until explicitly instructed.

### Goal
Save uploaded Jira files, parsed data, import logs, dashboard snapshots, Excel exports, and processing metadata to local or cloud storage.

### Storage Provider Interface (Planned)
```typescript
interface StorageProvider {
  name: string;
  type: 'local' | 's3' | 'azure' | 'gcp' | 's3-compatible';
  save(key: string, data: Buffer, metadata?: object): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
}
```

### Storage Object Types (Planned)
- `Original Upload` — raw Jira CSV/XLSX file
- `Normalised Data` — parsed JiraIssue[] JSON
- `Dashboard Snapshot` — full DashboardMetrics JSON
- `Excel Export` — generated .xlsx workbook
- `Import Log` — processing metadata
- `Error Report` — failed upload diagnostics

### Storage Status Values (Planned)
`Pending | Saving | Success | Failed | Retrying | Synced | Permanent Failure | Skipped`

### Future Database Tables (Planned)
- `storage_settings` — provider config, credentials (encrypted), enabled flag
- `storage_objects` — each stored object with key, type, status, size
- `storage_events` — audit log of all storage operations
- `storage_retry_queue` — failed saves queued for retry

### Future Storage Events (Planned)
`STORAGE_SETTINGS_UPDATED | STORAGE_CONNECTION_TEST_STARTED | STORAGE_CONNECTION_TEST_SUCCESS | STORAGE_CONNECTION_TEST_FAILED | STORAGE_SAVE_STARTED | STORAGE_SAVE_SUCCESS | STORAGE_SAVE_FAILED | STORAGE_LOCAL_FALLBACK_USED | STORAGE_RETRY_QUEUED | STORAGE_RETRY_STARTED | STORAGE_RETRY_SUCCESS | STORAGE_RETRY_FAILED | STORAGE_RETRY_LIMIT_REACHED | STORAGE_SYNC_COMPLETED`

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
