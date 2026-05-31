# Delivery Clarity — Release Notes

---

## v3.0 — Intelligence Layer (In Progress)

### Feature 1: Advanced Throughput & Delivery Analytics ✅

- **Sprint Throughput Engine** (`src/services/metrics/throughput.service.ts`)
  - Per-sprint: committed, completed, carryover, added scope, goal outcome, delivery confidence
  - Delivery patterns: Healthy Early Progress, End-Loaded, Scope Instability, Blocked Sprint, Late Delivery Risk
  - Cross-sprint: average throughput, average completion %, trend direction (Improving / Declining / Stable)
- **Mid-Sprint Delivery Analysis** (`src/services/metrics/midSprint.service.ts`)
  - Mid-sprint completion % for each sprint
  - Pattern detection and plain-English interpretation
- **Kanban Flow Analytics** (`src/services/metrics/kanbanFlow.service.ts`)
  - Monthly reporting periods for non-sprint issues
  - Flow efficiency (cycle time / lead time × 100)
  - Aging WIP, bottleneck status, flow health classification
- **Dashboard Panels**
  - `SprintThroughputPanel` — sprint table with goal badges, completion bars, trend indicator
  - `MidSprintDeliveryPanel` — per-sprint pattern cards with gauge
  - `KanbanThroughputPanel` — period table with flow health, aging WIP, bottleneck
- **TypeScript Types** (`src/types/throughput.ts`) — full type safety across all throughput data
- **`DashboardMetrics`** — extended with `throughput: ThroughputMetrics` field
- **Bug fix**: Upload → dashboard redirect was broken (sessionStorage vs localStorage key mismatch) — fixed

---

### Feature 4: Smart Excel Export — Statistical Workbook ✅

- **17-sheet statistical Excel workbook** replacing basic data dump
  - 01 Executive Summary — health score, KPIs, top risks, recommendations, narrative
  - 02 Project Health — metric scoring table with interpretation
  - 03 Team Performance — per-assignee delivery metrics
  - 04 Sprint Throughput — full sprint analytics table
  - 05 Mid-Sprint Delivery — pattern analysis per sprint
  - 06 Kanban Flow — period-by-period flow metrics
  - 07 Risks and Blockers — prioritised risk item list
  - 08 Orphan & Data Quality — orphan classification with delivery impact
  - 09 Assignee Workload — load share, bugs, SP per person
  - 10 Story Points Analysis — distribution, velocity forecast, missing SP
  - 11 Cycle & Lead Time — percentile analysis (P50, P75, P85, P95)
  - 12 Throughput Trends — sprint-by-sprint and period-by-period delta
  - 13 Recommendations — rule-based, fully evidenced action list
  - 14 Release Readiness — Go / Conditional Go / No-Go per fix version
  - 15 Dependencies — linked issue analysis
  - 16 Metric Dictionary — plain-English definition for every metric
  - 17 Raw Data Reference — normalised issue data without PII summaries
- **Recommendation Engine** (`src/services/export/recommendationEngine.ts`)
  - 12 detection rules with evidence, impact, suggested owner, suggested action
  - Executive narrative paragraph auto-generated from metrics
- **Export button** — now downloads the 17-sheet statistical workbook

---

### Feature 2: Work Item Explorer (`/explore`) 🔧 Awaiting `npm install reactflow @dagrejs/dagre`

- **Route**: `/explore` — "Explore Delivery Structure"
- **Hierarchy reconstruction** (`src/services/relations/hierarchy.service.ts`)
  - Multi-signal: Parent Key (explicit) → Epic Link (explicit) → Key prefix (inferred, 0.8 confidence)
  - Full ancestor chain and descendant BFS traversal
- **Orphan risk detection** (`src/services/relations/orphanRelation.service.ts`)
  - Classifications: MISSING_EPIC, MISSING_PARENT, FULLY_ORPHANED, DANGLING_LINK
  - Delivery impact and suggested fix per orphan
- **Relation graph builder** (`src/services/relations/relationExplorer.service.ts`)
  - Builds RelationGraph: focus node + ancestors + descendants + siblings + orphans
  - Auto-generated plain-English insights
- **Visual graph** (`src/components/explore/WorkItemGraph.tsx`)
  - React Flow canvas with Dagre hierarchical layout
  - Custom IssueNodeCard per node (type, key, summary, status, assignee, SP, health)
  - Orphan nodes: dashed orange border + "ORPHAN" badge
  - Blocked nodes: red badge
  - Edge styles: parent-child (solid), epic-link (purple), blocks (red animated), orphan (orange dashed)
  - Controls: zoom, fit-view, mini-map
- **Supporting components**: RelationLegend, RelationStatsCards, RelationInsightPanel, RelationDetailsTable
- **Navigation**: "Explore" added to app header

---

### Feature 3: Authentication & Database 🔧 Awaiting `npm install prisma @prisma/client iron-session bcryptjs`

- **Database schema** (`prisma/schema.prisma`) — SQLite via Prisma ORM
  - Tables: User, Session, ImportLog, DashboardSnapshot, AuditEvent
- **Auth library** (`src/lib/auth.ts`) — bcryptjs password hashing (rounds=12)
- **Session library** (`src/lib/session.ts`) — iron-session, HTTP-only secure cookies
- **Prisma client** (`src/lib/prisma.ts`) — singleton to prevent dev hot-reload connection leaks
- **API routes**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/register`, `/api/auth/me`
- **Login page** (`app/login/page.tsx`) — clean, accessible login form
- **Middleware** (`middleware.ts`) — route protection skeleton (activate after packages installed)
- **Rate limiting** — 5 login attempts per minute per IP

---

## v2.0 — Previous Release

- Dark mode, error pages, 40 tests, TypeScript cleanup
- CSV + HTML + Excel export from dashboard sticky bar and summary page
- Export HTML report redesigned: charts, KPIs, insights — no raw issue table
- Developer documentation portal
- Upload restart button in header

---

## v1.0 — Initial Release

- Jira CSV/XLSX upload and parsing
- Dashboard: health score, KPI cards, flow health, capacity, epics, labels, sprint status
- Charts page: visual analytics
- Summary page: health overview
- Backend/import log page
