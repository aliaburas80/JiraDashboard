# Product Documentation — Delivery Clarity v2

This folder contains all living product documentation for Delivery Clarity v2.

| Document | Description | Version |
|---|---|---|
| [BRD.md](./BRD.md) | Business Requirements Document — objectives, stakeholders, 30+ BRs, personas, risk register | 1.0 |
| [SRS.md](./SRS.md) | Software Requirements Specification — 100+ FRs, API spec, data model, acceptance criteria | 1.0 |
| [USER_JOURNEYS.md](./USER_JOURNEYS.md) | User Journey Maps — 4 persona journeys, emotional arcs, touchpoints, moments of truth | 1.0 |
| [USE_CASES.md](./USE_CASES.md) | Use Cases — 40+ use cases (UC-001–UC-040+) with full flows, actors, exceptions | 1.0 |
| [TEST_CASES.md](./TEST_CASES.md) | Test Cases — 100 test cases (TC-001–TC-100) covering all FRs | 1.0 |
| [SCENARIOS.md](./SCENARIOS.md) | Business Scenarios — 30 real-world scenarios with walkthroughs | 1.0 |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Developer Guide — code-level how-tos for every modification, recipe cookbook | 1.0 |

---

## Quick Start

```bash
npm install && npm run dev
```

The Next.js frontend starts on **http://localhost:3000**.

To also run the standalone Express backend (optional, for import-log persistence and legacy developer wiki):

```bash
cd backend && npm install && npm run dev
```

The backend starts on **http://localhost:4000**.

---

## Application Pages

| Path | Description |
|---|---|
| `/` | Upload page — drag-and-drop or browse for a Jira `.csv`, `.xlsx`, or `.xls` export |
| `/summary` | Overview — high-level KPI cards and sprint health snapshot after a file is loaded |
| `/charts` | Charts — visual analytics: velocity, cycle time, issue-type breakdown, and more |
| `/dashboard` | Full Report — all dashboard sections (Alerts, KPIs, Quarters, Kanban, Sprint, Ownership, Labels, Relations, Readiness, Flow) with section navigation |
| `/developer` | Developer wiki — live, interactive guide covering data flow, adding metrics, field aliases, health thresholds, layout grid, dark mode, and copy-paste recipes |
| `/backend` | Backend status page — shows service health and import-log summary |
| `/help` | Help guide — animated, searchable help covering every metric and dashboard section |

---

## API Routes

All routes are served by the Next.js App Router under `/api/`.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/upload` | Accept a Jira file upload (`.csv`/`.xlsx`/`.xls`, max 20 MB); parse issues, validate, compute metrics, and return `{ issues, warnings, metrics, importLog }` |
| `GET` | `/api/dashboard` | Return the cached dashboard metrics for the current session |
| `GET` | `/api/metrics` | Return the full metrics object (sprint, flow, readiness, KPIs, etc.) |
| `GET` | `/api/imports` | Return the import-log history as JSON |
| `GET` | `/api/health` | Health check — returns `{ status: "ok", service, version }` |
| `GET` | `/api/backend-view` | Render the backend status HTML page |
| `GET` | `/api/developer-view` | Render the developer wiki HTML page |

---

## Architecture Overview

```
JiraDashboard/
├── app/                    # Next.js 14 App Router
│   ├── page.tsx            # Upload page (/)
│   ├── summary/page.tsx    # /summary
│   ├── charts/page.tsx     # /charts
│   ├── dashboard/page.tsx  # /dashboard
│   ├── developer/page.tsx  # /developer
│   ├── backend/page.tsx    # /backend
│   ├── help/page.tsx       # /help
│   └── api/                # API route handlers (Next.js Route Handlers)
│       ├── upload/         # POST /api/upload
│       ├── dashboard/      # GET  /api/dashboard
│       ├── metrics/        # GET  /api/metrics
│       ├── imports/        # GET  /api/imports
│       ├── health/         # GET  /api/health
│       ├── backend-view/   # GET  /api/backend-view
│       └── developer-view/ # GET  /api/developer-view
├── frontend/               # Legacy CRA frontend (v1 reference — not used in production)
│   └── src/
│       ├── App.js
│       ├── components/     # UploadPage, SummaryPage, ChartsPage, DashboardPage, HelpGuide, KpiCard
│       └── styles.css
├── backend/                # Standalone Express backend (v1 reference / optional dev tool)
│   └── src/
│       ├── index.js        # Express server on port 4000
│       ├── routes/upload.js
│       └── services/       # parser, metrics, importLogs, backendView, developerView
├── src/                    # Shared Next.js utilities
│   ├── components/
│   ├── lib/
│   ├── services/
│   └── types/
├── product/                # Living product documentation (this folder)
└── data/                   # Sample Jira exports for local development
```

**Key data flow (v2):**
1. User uploads a Jira export on `/`.
2. `POST /api/upload` parses the file, validates issues, computes metrics, and stores the result in the session/cache.
3. The frontend navigates to `/summary`, `/charts`, or `/dashboard` and fetches data via `GET /api/metrics` or `GET /api/dashboard`.
4. All rendering is client-side React within the Next.js shell; no page reload is required between views.

**Tech stack:** Next.js 14 (App Router) · React 18 · TypeScript · Recharts · Tailwind CSS · XLSX · Node.js

---

## v1 Reference

The `frontend/` and `backend/` directories contain the original v1 implementation (Create React App + standalone Express). They are preserved as a reference and are not used in the production Next.js v2 build. The standalone backend (`backend/`) can still be run independently for import-log inspection or developer-wiki access during local development.

---

## How to Keep These Docs Updated

All documents are **living documents**. Update them when:

- A new feature is requested or built — add BRs, FRs, test cases, use cases, scenarios, and developer recipes.
- A requirement changes — update the affected document and bump the version.
- A bug is found and fixed — add a regression test case.
- A new pattern is established — add a recipe to DEVELOPER_GUIDE.md.

Bump the version number in each document's Document Control section when making significant changes.

---

© 2026 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
