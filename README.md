# Delivery Clarity

**Jira Delivery Intelligence Platform** — turn any Jira CSV or Excel export into sprint health, flow efficiency, risk signals, capacity, and epic readiness in seconds.

> No Jira login required. Upload a file, get a full delivery intelligence dashboard instantly.

---

## What is Delivery Clarity?

Delivery Clarity is a self-hosted analytics platform that transforms raw Jira exports into a comprehensive, actionable delivery health dashboard. It is built for engineering managers, scrum masters, and product owners who need fast, honest answers about project health without digging through Jira manually.

**Core value:**
- Upload once → instant analysis across every dimension of delivery
- Auto-generated action items tell you exactly what to do next
- Manager Quick Overview report ready to paste into a stakeholder update
- Interactive Help guide walks new users through every metric

---

## Features

### Intelligence Engine
| Feature | Description |
|---|---|
| **Delivery Health Score** | 0–100 weighted score combining completion, risk, sprint velocity, orphan ratio, and cycle time — visible as a circular gauge in the dashboard header |
| **Smart Recommendations** | 5 auto-generated, prioritised action cards identifying blockers, stale work, capacity imbalance, orphan items, and critical epics — each deep-links to the relevant section |
| **Predictive Completion** | Velocity-based ETA: `remaining items ÷ daily velocity` → estimated days and date |
| **Manager Quick Overview** | One-click executive report: health banner, 8-cell snapshot grid, 7 report rows each with a Details → deep-link, print-ready |

### Dashboard Sections
| Section | What it shows |
|---|---|
| **Summary bar** | Health status, target vs actual, completion/risk/cycle deltas, action buttons |
| **Smart Recommendations** | Prioritised action cards auto-generated from your data |
| **Attention cards** | Top 3 blockers, overdue items, and orphan items |
| **KPI cards** | Completion %, health alerts, active work, lead time, cycle time, story points |
| **Visual Intelligence** | Health Mix donut, Quarter Progress bars, Work State distribution |
| **Delivery Composition** | Single ring classifying every issue into Done/In Progress/At Risk/Critical/Backlog |
| **Delivery Controls** | Flow efficiency, story point delivery, cycle-time scoring |
| **Quarter Statistics** | Throughput, completion rate, lead/cycle time, top statuses per quarter |
| **Kanban Status Health** | Volume, health counts, and timing per workflow status |
| **Sprint Status** | Velocity, completion rate, points delivered per sprint |
| **Ownership** | Capacity by assignee, epic/parent performance, orphan detection |
| **Labels & Classification** | Label distribution, issue type donut, label health table, parent/project breakdown |
| **Relations** | Link type distribution, most-connected items, blocked-by table |
| **Readiness** | At-risk epics, dependency callouts, release readiness signals |
| **Justification** | Plain-language delivery narrative generated from all signals |
| **Story/Task Flow Health** | Full filtered table with 11 filters: key, status, sprint, assignee, lead, cycle, age, health, reason, label, linked-to |

### Navigation & UX
- **Floating section navigator** — 14 colour-coded dots on the right edge, tracks active section
- **Interactive Help guide** — 17 animated journeys (4–6 steps each), keyboard arrow navigation
- **Dark mode** — system preference detection with manual toggle
- **Mobile responsive** — works down to 375 px; iOS safe-area insets on all modals
- **Print mode** — clean print styles hide all interactive elements

---

## Architecture

```
app/                 Next.js App Router pages and route handlers
src/                 Shared components, domain services, storage, auth, Prisma
prisma/              PostgreSQL schema, migrations, and seed entrypoint
docs/deployment/     Koyeb, Neon, and database migration runbooks
```

Delivery Clarity is now a single Next.js application backed by Prisma and PostgreSQL for production. The legacy `backend/` and `frontend/` directories are not the deployment target for the current app.

Production deployment uses:

- Next.js App Router
- Prisma
- Neon PostgreSQL
- Koyeb Node.js web service
- External object storage for persistent files

---

## How It Works

### 1. Upload Flow

```
User exports Jira → CSV or Excel
       ↓
Browser: POST /api/upload (multipart, max 20 MB by default, max 20 req/15 min)
       ↓
Next.js route handler: src/services/jira/parser.ts
  • Reads file with xlsx library
  • Normalises column headers against 55+ known aliases
  • Returns: issues[], warnings[], headers[], sheetName
       ↓
Validation: src/services/jira/validation.ts
  • Checks Issue Key, Issue Type, Summary, Status are present
  • Returns 422 with specific errors if any are missing
       ↓
Domain metrics: src/services/metrics/metrics.service.ts
  • calculateDashboardMetrics(issues) — synchronous, ~50ms for 500 issues
  • Returns full metrics JSON
       ↓
Frontend: React renders the full dashboard from the JSON payload
  • No page reload. All state held in React useState.
```

### 2. Health Classification (per item)

Every issue receives one of `good`, `warning`, or `critical`:

| Signal | Warning | Critical |
|---|---|---|
| Active work age | > 7 days in progress | > 14 days in progress |
| Cycle time (done items) | > 7 days | > 14 days |
| Waiting age (not started) | > 30 days | — |
| Due date | — | Overdue and not done |
| Priority | — | High/Highest/Critical + open |
| Blocked flag | — | Blocked Flag = true |

Multiple signals combine — a blocked item that is also overdue will have both reasons listed.

### 3. Delivery Health Score (0–100)

```
score =
  completionRate          × 0.28  (% of issues in Done/Closed/Resolved)
  + (1 − criticalRatio)   × 100 × 0.24  (share of issues that are NOT critical)
  + (1 − warningRatio)    × 100 × 0.12  (share of issues that are NOT warning)
  + sprintCompletionRate  × 0.14  (most recent sprint's completion %)
  + (1 − orphanRatio)     × 100 × 0.12  (share of issues that have a parent/epic)
  + cycleTimeScore        × 0.10  (100 minus penalty for cycle time > 3 days)

cycleTimeScore = max(0, 100 − (averageCycleTimeDays − 3) × 8)
```

Score bands: **90–100 Excellent · 75–89 Good · 60–74 Moderate · 40–59 At Risk · 0–39 Critical**

### 4. Predictive Completion

```
oldest_created_date = min(all issue Created Dates)
elapsed_days        = today − oldest_created_date
velocity            = done_issues / elapsed_days   (issues per day)
days_remaining      = remaining_issues / velocity
estimated_date      = today + days_remaining
```

Shown as the 4th delta card in the Summary bar. Hidden when no date data is available.

### 5. Smart Recommendations

Generated client-side from the metrics payload. Priority order:

1. **Blocked critical items** — issues with `health=critical` AND reason includes "block"
2. **Stale active work** — items active for > 14 days
3. **Capacity imbalance** — any assignee holding > 35% of total work
4. **Orphan items** — issues with no Epic Link or Parent Key
5. **Critical epics** — epics with `risk=critical` from readiness analysis
6. **Explicitly blocked by link** — items with inward "Blocks" issue links

### 6. Lead Time vs Cycle Time

| Metric | Formula | Meaning |
|---|---|---|
| **Lead time** | Created Date → Done/Resolution Date | Total elapsed time including backlog waiting |
| **Cycle time** | In Progress Date (or Sprint Start) → Done Date | Active delivery time only |

A large lead-vs-cycle gap (e.g. 14-day lead, 3-day cycle) means items wait a long time before anyone starts them.

### 7. Delivery Composition Ring

Every issue is classified into exactly one segment — no double-counting:

```
Priority order:
  1. Done        → status is Done / Closed / Resolved
  2. Critical    → health = critical AND not done
  3. At Risk     → health = warning AND not done
  4. In Progress → active status AND no health concern
  5. Backlog     → everything else
```

### 8. Linked Issues Detection

Link columns are detected dynamically. Any column matching `*issue link*` is treated as a link column. Common Jira names:

- `Inward issue link (Blocks)` / `Outward issue link (Blocks)`
- `Inward issue link (Relates)` / `Outward issue link (Relates)`
- `Inward issue link (Duplicate)` / `Outward issue link (Duplicate)`

Include these columns in your Jira export to see the Relations section.

---

## Setup

### Prerequisites

- **Node.js** 20 LTS (`nvm use` reads `.nvmrc`)
- **npm** 10
- PostgreSQL for production, with Neon recommended for Koyeb deployments

### Installation

```bash
git clone https://github.com/aliaburas80/JiraDashboard.git
cd JiraDashboard
nvm use
npm ci
npm run db:generate
```

### Configuration

```bash
cp .env.example .env
```

Set `DATABASE_URL`, `SESSION_SECRET`, `CONFIG_ENCRYPTION_KEY`, and storage variables as needed. SQLite is no longer the production database.

### Running (development)

```bash
npm run dev
```

Open **http://localhost:3000**.

### Production build

```bash
npm run build
npm run start
```

`npm run start` runs `prisma migrate deploy` before starting Next.js on `0.0.0.0:$PORT`.

### Deployment

- Koyeb deployment guide: [docs/deployment/KOYEB_DEPLOYMENT.md](docs/deployment/KOYEB_DEPLOYMENT.md)
- Database migration guide: [docs/deployment/DATABASE_MIGRATION.md](docs/deployment/DATABASE_MIGRATION.md)
- Deployment audit: [docs/deployment/KOYEB_NEON_AUDIT.md](docs/deployment/KOYEB_NEON_AUDIT.md)

For Koyeb, local application files are not persistent. Use object storage (`STORAGE_DRIVER=s3` or another supported cloud provider) for backups, app config, and persistent file artifacts.

---

## Exporting from Jira

1. Open your Jira project or board
2. Go to **Backlog** or the full issue list view
3. Click **Export → Excel (all fields)** or **Export → CSV**
4. Include the columns below for the richest analysis
5. Upload the file to Delivery Clarity

### Key columns

| Column | Required | Powers |
|---|---|---|
| Issue Key | ✅ | Everything |
| Issue Type | ✅ | Type breakdown |
| Summary | ✅ | Flow table, action items |
| Status | ✅ | All health and flow metrics |
| Sprint | | Sprint velocity, comparison |
| Story Points | | Point-based capacity |
| Assignee | | Capacity, load distribution |
| Created Date | | Lead time, prediction |
| Resolution Date | | Lead time |
| Done Date | | Cycle time |
| In Progress Date | | Cycle time (accurate) |
| Epic Link | | Epic readiness, orphans |
| Parent Key | | Parent hierarchy (next-gen Jira) |
| Labels | | Label distribution and health |
| Priority | | High-priority risk detection |
| Due Date | | Overdue detection |
| Blocked Flag | | Blocker identification |
| Inward/Outward issue link (Blocks) | | Relations section |

**Tip:** Export the full backlog, not just the active sprint.

---

## API Reference

### `POST /api/upload`

Upload a Jira export for analysis.

- **Content-Type:** `multipart/form-data`, field name `file`
- **Accepted:** `.csv`, `.xlsx`, `.xls`
- **Max size:** 20 MB
- **Configurable with:** `MAX_UPLOAD_MB`
- **Rate limit:** 20 requests per 15 minutes per IP

| Status | Meaning |
|---|---|
| 200 | Success — returns `{ metrics, issues, warnings, importLog }` |
| 400 | No file or unsupported file type |
| 413 | File exceeds 20 MB |
| 422 | Missing required Jira fields |
| 429 | Rate limit exceeded |
| 500 | Processing error |

### `GET /api/upload/logs`
Import history as JSON.

### `GET /api/upload/logs/view`
Browser-viewable import history with file statistics.

### `GET /api/upload/logs/export`
Import history as `.xlsx`.

### `GET /api/health`
```json
{ "status": "ok", "service": "delivery-clarity", "version": "2.0.0", "timestamp": "..." }
```

### `GET /api/ready`
Checks required runtime infrastructure, including a minimal database query. Returns `503` with a sanitized body when the app is not ready.

---

## Project Structure

```
JiraDashboard/
├── .env.example                    # All environment variables documented
├── .gitignore
├── README.md
├── RELEASE_NOTES.md
├── app/                            # Next.js App Router
├── src/                            # Shared app code, services, components
├── prisma/                         # PostgreSQL schema, migrations, seed
├── docs/deployment/                # Koyeb and Neon deployment docs
│
└── backend/, frontend/             # Legacy standalone projects, not current deployment target
```

---

## Known Limitations

| Limitation | Impact |
|---|---|
| Upload parser is request-bound | Keep `MAX_UPLOAD_MB` conservative on small Koyeb instances |
| Koyeb local filesystem is ephemeral | Use object storage for persistent files |
| Startup migrations assume one replica | Move migrations to a release step before scaling replicas |

---

## Roadmap

- [ ] Jira OAuth / API token direct connection (auto-refresh)
- [ ] Historical comparison: sprint-over-sprint health trending
- [ ] User authentication and project workspaces
- [ ] Scheduled email / Slack reports
- [ ] Custom health thresholds per project
- [ ] SQLite persistence for import logs
- [ ] Component refactor: split `DashboardPage.js` into focused files
- [ ] AI-generated delivery narrative via Claude API

---

## License

© 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
