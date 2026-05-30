# Delivery Clarity — Developer Guide

## Document Control
Version 2.0 | 2026-05-30 | Author: Ali Abu Ras

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

There is no separate backend process in v2. Everything runs inside Next.js Route Handlers (`app/api/*/route.ts`). Import logs are persisted to `data/import-logs.json` on the local filesystem (or the server filesystem in production).

The legacy CRA + Express stack lives under `frontend/` and `backend/` and is kept for reference only. It is not used at runtime in v2.

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

For production deployment set `NEXT_PUBLIC_*` variables as needed (none are currently required). The import log file path is derived from `process.cwd()` inside `importLogs.service.ts` and writes to `data/import-logs.json` relative to the server working directory.

### Data flow in a single upload

1. User drops a `.xlsx` / `.csv` file on the home page (`app/page.tsx`).
2. Browser `POST`s the file to `/api/upload`.
3. `parseJiraFile` (parser service) converts the buffer to typed rows and canonicalises column headers.
4. `validateIssueData` (validation service) confirms required fields are present.
5. `calculateDashboardMetrics` (metrics service) computes all KPIs.
6. The route handler writes an import log entry and returns `{ metrics, warnings, importLog }`.
7. The browser stores `metrics` in `sessionStorage` under the key `dc_metrics`.
8. The router pushes to `/dashboard`.

---

## 3. Directory Structure

```
JiraDashboard/
│
├── app/                          # Next.js App Router root
│   ├── layout.tsx                # Root layout — sets <html>, <body>, global font
│   ├── globals.scss              # Global styles (Tailwind base + custom)
│   ├── page.tsx                  # / — Upload page (home)
│   ├── summary/page.tsx          # /summary — Health overview
│   ├── charts/page.tsx           # /charts  — Visual analytics
│   ├── dashboard/page.tsx        # /dashboard — Full delivery report
│   ├── developer/page.tsx        # /developer — Developer wiki UI
│   ├── backend/page.tsx          # /backend — Backend status UI
│   ├── help/page.tsx             # /help — FAQ / help guide
│   └── api/
│       ├── upload/route.ts       # POST /api/upload
│       ├── imports/route.ts      # GET  /api/imports
│       ├── metrics/route.ts      # GET  /api/metrics
│       ├── dashboard/route.ts    # GET  /api/dashboard
│       ├── health/route.ts       # GET  /api/health
│       ├── backend-view/route.ts # GET  /api/backend-view
│       └── developer-view/route.ts # GET /api/developer-view
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx      # Sticky header + nav + footer wrapper
│   │   └── ui/
│   │       ├── Badge.tsx         # Status / health badge pill
│   │       ├── Card.tsx          # White rounded card container
│   │       ├── KpiCard.tsx       # Metric card with accent border
│   │       └── LoadingState.tsx  # Spinner / loading message
│   ├── lib/
│   │   └── utils.ts              # cn(), formatDays(), getHealthBand(), HEALTH_COLORS
│   ├── services/
│   │   ├── jira/
│   │   │   ├── parser.ts         # parseJiraFile(), FIELD_ALIASES, OPTIONAL_FIELDS
│   │   │   └── validation.ts     # validateIssueData()
│   │   ├── imports/
│   │   │   └── importLogs.service.ts  # read/write/build import log entries
│   │   └── metrics/
│   │       └── metrics.service.ts     # calculateDashboardMetrics() — core engine
│   ├── types/
│   │   ├── jira.ts               # JiraIssue, ESSENTIAL_FIELDS, OPTIONAL_FIELDS, status constants
│   │   ├── metrics.ts            # DashboardMetrics, FlowMetrics, SprintMetrics, etc.
│   │   └── api.ts                # UploadResponse, ImportLogEntry, ApiError
│   └── __tests__/
│       └── metrics.test.ts       # Jest unit tests for calculateDashboardMetrics
│
├── data/
│   └── import-logs.json          # Persisted import history (up to 200 entries)
│
├── frontend/                     # Legacy CRA frontend (reference only, not used in v2)
├── backend/                      # Legacy Express backend (reference only, not used in v2)
│
├── product/                      # Product documentation
│   ├── DEVELOPER_GUIDE.md        # This file
│   ├── BRD.md
│   ├── SRS.md
│   └── ...
│
├── package.json                  # Root package — Next.js v2 app
├── tailwind.config.ts
├── tsconfig.json
└── jest.config.js
```

---

## 4. Routing Architecture — Pages

All pages are React Client Components (`'use client'`). They read `dc_metrics` from `sessionStorage` on mount. If the key is missing the router redirects to `/` (upload).

### `app/page.tsx` — Upload (`/`)

Entry point. Renders a drag-and-drop file zone. On file selection:
- Calls `POST /api/upload` with `FormData`
- Stores returned `metrics` in `sessionStorage.setItem('dc_metrics', JSON.stringify(data.metrics))`
- Navigates to `/summary`

No nav bar is shown here (`showNav={false}`).

### `app/summary/page.tsx` — Overview (`/summary`)

Executive one-page summary. Renders:
- Health score banner (score circle, band label, prediction chip)
- Six KPI cards: Completion, Health Alerts, Active Work, Lead Time, Cycle Time, Story Points
- Attention section: blockers, overdue items, orphan count
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

The dashboard pages read `DashboardMetrics` from `sessionStorage`. Access your metric with:

```ts
const metrics = JSON.parse(sessionStorage.getItem('dc_metrics')!) as DashboardMetrics;
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

*Delivery Clarity v2.0 — © 2025 Ali Abu Ras — aburasali80@gmail.com*
