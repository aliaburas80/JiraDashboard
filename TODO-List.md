# Delivery Clarity — TODO List

**Last updated:** 2026-05-31  
**Branch:** feat/enhancements

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Done — committed and pushed |
| 🔧 | In progress |
| ❌ | Not started |

---

## Abbreviations & Legend

### Priority Levels

| Code | Full Name | Meaning |
|------|-----------|---------|
| P0 | Critical | Must be done first — blocks everything else |
| P1 | High | Important — do right after P0s |
| P2 | Medium | Valuable — do after all P1s are done |
| P3 | Low | Nice to have — do when time allows |

### Feature Codes

| Code | Meaning |
|------|---------|
| F1 | Feature 1 — Throughput & Delivery Analytics |
| F2 | Feature 2 — Work Item Explorer (`/explore`) |
| F3 | Feature 3 — Authentication & Database |
| F4 | Feature 4 — Smart Excel Export |

### Metric & Domain Abbreviations

| Abbreviation | Full Form |
|-------------|-----------|
| SP | Story Points — unit of effort estimation in Agile |
| ST | Sprint — time-boxed delivery cycle (usually 2 weeks) |
| WIP | Work In Progress — items actively being worked on |
| SLA | Service Level Agreement — agreed delivery time target |
| KPI | Key Performance Indicator — headline metric card |
| P50 / P85 / P95 | Percentile — e.g. P85 means 85% of items finish within X days |

### Document Reference Codes

| Code | Full Form |
|------|-----------|
| FR | Functional Requirement — e.g. FR-207 |
| UC | Use Case — e.g. UC-043 |
| TC | Test Case — e.g. TC-T-01, TC-A-01, TC-X-01 |
| TC-T | Test Case — Throughput formulas |
| TC-E | Test Case — Explorer / relation graph |
| TC-A | Test Case — Authentication |
| TC-X | Test Case — Excel export |
| SCN | Scenario — e.g. SCN-012 |
| UJ | User Journey — e.g. UJ-010 |
| BRD | Business Requirements Document |
| SRS | Software Requirements Specification |

### Tech Abbreviations

| Abbreviation | Full Form |
|-------------|-----------|
| DB | Database (SQLite in this project) |
| ORM | Object-Relational Mapper (Prisma in this project) |
| API | Application Programming Interface |
| JWT | JSON Web Token (not used — we use iron-session cookies) |
| TTL | Time To Live — how long a session stays valid |
| SSR | Server-Side Rendering |
| CSV | Comma-Separated Values — Jira export format |
| XLSX | Excel spreadsheet format |

---

## Feature 1 — Throughput & Delivery Analytics

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1.1 | Sprint throughput engine (committed, done, carryover, goal outcome, delivery pattern) | P0 | ✅ Done |
| 1.2 | Mid-sprint pattern detection (Healthy / End-Loaded / Blocked / Scope Instability) | P0 | ✅ Done |
| 1.3 | Kanban flow analytics (monthly periods, flow efficiency, aging WIP, bottleneck) | P0 | ✅ Done |
| 1.4 | SprintThroughputPanel — dashboard component | P0 | ✅ Done |
| 1.5 | MidSprintDeliveryPanel — dashboard component | P0 | ✅ Done |
| 1.6 | KanbanThroughputPanel — dashboard component | P0 | ✅ Done |
| 1.7 | TypeScript types: `src/types/throughput.ts` | P0 | ✅ Done |
| 1.8 | DashboardMetrics extended with `throughput` field | P0 | ✅ Done |

---

## Feature 2 — Work Item Explorer (`/explore`)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 2.1 | Hierarchy reconstruction service (multi-signal: parent key, epic link, prefix) | P0 | ✅ Done |
| 2.2 | Orphan risk detection — 4-class classification with delivery impact | P0 | ✅ Done |
| 2.3 | Relation graph builder (focus + parent + direct children only) | P0 | ✅ Done |
| 2.4 | React Flow visual graph with Dagre layout and custom node cards | P0 | ✅ Done |
| 2.5 | Node styles per issue type (Epic=purple, Story=blue, Bug=red, etc.) | P0 | ✅ Done |
| 2.6 | Orphan node visual treatment (dashed orange border + ORPHAN badge) | P0 | ✅ Done |
| 2.7 | RelationLegend, RelationInsightPanel, RelationStatsCards, RelationDetailsTable | P0 | ✅ Done |
| 2.8 | RelationCharts — 6 chart cards (completion, health, types, assignee, sprint, orphan) | P1 | ✅ Done |
| 2.9 | Field-format bug fix — services handle both FlowItem and raw JiraIssue field names | P0 | ✅ Done |
| 2.10 | "Explore" added to app navigation header | P0 | ✅ Done |

---

## Feature 3 — Authentication & Database

| # | Task | Priority | Status |
|---|------|----------|--------|
| 3.1 | Install: prisma, @prisma/client, iron-session, bcryptjs | P0 | ✅ Done |
| 3.2 | `prisma/schema.prisma` — User, Session, ImportLog, DashboardSnapshot, AuditEvent | P0 | ✅ Done |
| 3.3 | SQLite database created: `data/delivery_clarity.db` | P0 | ✅ Done |
| 3.4 | Seed script — first admin user created | P0 | ✅ Done |
| 3.5 | Real auth API routes: login, logout, register, me | P0 | ✅ Done |
| 3.6 | Login page (`/login`) | P0 | ✅ Done |
| 3.7 | Register page (`/register`) | P0 | ✅ Done |
| 3.8 | Profile page (`/profile`) | P0 | ✅ Done |
| 3.9 | Admin logs page (`/admin/logs`) | P0 | ✅ Done |
| 3.10 | UserMenu in header (avatar, name, role badge, sign out) | P0 | ✅ Done |
| 3.11 | Middleware route protection (all app routes guarded) | P0 | ✅ Done |
| 3.12 | Upload API saves ImportLog with userId to SQLite | P1 | ✅ Done |
| 3.13 | `/api/imports` returns logs filtered by user (admin sees all with `?all=true`) | P1 | ✅ Done |

**First login credentials:**
- Email: `admin@deliveryclarity.com`
- Password: `Admin@DC2025`  
- ⚠️ Change after first login

---

## Feature 4 — Smart Excel Export (17 sheets)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 4.1 | Recommendation engine — 10+ rules, evidence + impact + owner + action per rec | P0 | ✅ Done |
| 4.2 | 17-sheet statistical workbook replacing basic data dump | P0 | ✅ Done |
| 4.3 | Executive Summary — health score, top 5 recs, executive narrative paragraph | P0 | ✅ Done |
| 4.4 | Sprint Throughput, Mid-Sprint, Kanban Flow sheets | P0 | ✅ Done |
| 4.5 | Risks & Blockers, Orphan & Data Quality, Release Readiness sheets | P0 | ✅ Done |
| 4.6 | Cycle & Lead Time — P50/P75/P85/P95 percentile analysis | P0 | ✅ Done |
| 4.7 | Metric Dictionary sheet with formula for every metric | P0 | ✅ Done |
| 4.8 | Export button triggers smart workbook download | P0 | ✅ Done |

---

## UX / Dashboard

| # | Task | Priority | Status |
|---|------|----------|--------|
| 5.1 | All dashboard sections collapsible (same pattern as Quarter Statistics) | P0 | ✅ Done |
| 5.2 | Default open: Key Metrics, Priority Attention, Epic Health & Readiness | P0 | ✅ Done |
| 5.3 | Status chips on each section trigger (count, completion %, trend) | P0 | ✅ Done |
| 5.4 | Upload → dashboard redirect bug fix (sessionStorage vs localStorage mismatch) | P0 | ✅ Done |
| 5.5 | HTML export redesigned — charts/KPIs/insights, no raw issue table | P0 | ✅ Done |

---

## Tests

| # | Task | Priority | Status |
|---|------|----------|--------|
| 6.1 | Throughput formula tests TC-T-01 to TC-T-10 (`throughput.test.ts`) | P1 | ✅ Done — 10 passing |
| 6.2 | Work Item Explorer tests TC-E-01 to TC-E-08 (`relationExplorer.test.ts`) | P1 | ✅ Done — 8 passing |
| 6.3 | Auth tests TC-A-01 to TC-A-09 | P1 | ✅ Done — 17 passing (`auth.test.ts`) |
| 6.4 | Excel export tests TC-X-01 to TC-X-06 | P1 | ✅ Done — 15 passing (`excelExport.test.ts`) |

---

## Documentation

| # | Task | Priority | Status |
|---|------|----------|--------|
| 7.1 | `RELEASE_NOTES.md` — v3.0 full changelog | P1 | ✅ Done |
| 7.2 | `DEVELOPER_GUIDE.md` — F1/F2/F3/F4 setup sections | P1 | ✅ Done |
| 7.3 | `PATENT_DISCLOSURE.md` | P1 | ✅ Done |
| 7.4 | `TECHNICAL_METHOD.md` — 8 technical methods with descriptions | P1 | ✅ Done |
| 7.5 | `ALGORITHM_SPEC.md` — pseudocode for all major algorithms | P1 | ✅ Done |
| 7.6 | `PRIOR_ART_COMPARISON.md` — vs Jira, LinearB, Jira Align, Tableau | P1 | ✅ Done |
| 7.7 | `CLAIM_CANDIDATE_MATRIX.md` — 7 patent claim candidates with strength ratings | P1 | ✅ Done |
| 7.8 | `BRD.md` — updated with BR-050 to BR-069 for all v3.0 features | P2 | ✅ Done |
| 7.9 | `TEST_CASES.md` — F1/F2/F3/F4 test case tables added | P2 | ✅ Done |
| 7.10 | `SRS.md`, `USE_CASES.md`, `SCENARIOS.md`, `USER_JOURNEYS.md` — v3.0 updates | P2 | ✅ Done |

---

## Remaining / Future Work

| # | Task | Priority | Status |
|---|------|----------|--------|
| 8.1 | Auth tests automated (TC-A-01 to TC-A-09) | P1 | ✅ Done — 17 passing |
| 8.2 | Excel export tests automated (TC-X-01 to TC-X-06) | P1 | ✅ Done — 15 passing |
| 8.3 | SRS, USE_CASES, SCENARIOS, USER_JOURNEYS updated for v3.0 | P2 | ✅ Done |
| 8.4 | Sprint velocity chart (story points over time) | P2 | ✅ Done — committed vs completed SP per sprint, trend, avg line |
| 8.5 | Saved filter presets (bookmark a filter combination) | P2 | ✅ Done — name, save, apply, delete via localStorage |
| 8.6 | Multi-file upload (merge multiple Jira exports) | P2 | ✅ Done — up to 10 files, dedup by Issue Key, merge stats shown |
| 8.7 | Compare two sprints side-by-side | P2 | ✅ Done — SprintComparePanel with delta indicators and win counter |
| 8.8 | Shareable URL with filter state in query params | P2 | ✅ Done — URL syncs live, "Copy link" button in sticky bar |
| 8.9 | Drag-and-drop column reordering in issue table | P3 | ✅ Done — DraggableMetricTable, persisted to localStorage, Reset button |
| 8.10 | PR merged to main | — | ✅ Done — merged to main 2026-05-31 |
| 8.11 | Create new user account via Register page (`/register`) — enable `ALLOW_OPEN_REGISTRATION=true` in `.env` | P1 | ❌ Not done |

---

*Delivery Clarity v3.0 — © 2025 Ali Abu Ras — aburasali80@gmail.com*
