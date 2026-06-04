# Delivery Clarity — TODO List

**Last updated:** 2026-06-03  
**Branch:** feat/enhancements  
**Version:** v4.0 (in progress — not yet merged to main)  
**Release status:** All P0/P1 features done. P0 documentation alignment in progress. New P1 UX items queued.

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Done — committed and pushed |
| 🔧 | In progress |
| ❌ | Not started |
| 🚫 | Blocked — waiting on dependency |
| 🔍 | Needs verification |
| 📄 | Planning documented only — no code written |

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
| 8.11 | Create new user account via Register page (`/register`) — enable `ALLOW_OPEN_REGISTRATION=true` in `.env` | P1 | ✅ Done — NEXT_PUBLIC_ALLOW_REGISTER wired to login link + register page guard |

---

---

## P0 — Documentation Alignment (2026-06-03)

> Product documentation must never be behind the code. Complete before any new feature work.

| # | Document | What is behind | Priority | Status |
|---|----------|----------------|----------|--------|
| DOC-01 | `product/SRS.md` | Says auth out of scope — auth is fully implemented. Missing all v4 features, routes, Prisma, Docker. | P0 | ✅ Done — v4.0 doc control, scope, constraints, arch, data model, FR-242–285, Addendum A |
| DOC-02 | `product/BRD.md` | Missing v4 Quality & Trust Layer, Calculation Reference, Clear Data, Dashboard sections, roadmap | P0 | ✅ Done — v4.0 doc control, scope rewritten, BR-070–090 added |
| DOC-03 | `product/README.md` | Says v2 throughout. Missing 15+ routes. Old arch diagram. Express backend instructions outdated. | P0 | ✅ Done — full v4 rewrite |
| DOC-04 | `TODO-List.md` | Missing new P1 items, stale date | P0 | ✅ Done |
| DOC-05 | `product/USE_CASES.md` | Missing auth, data quality, snapshots, customer view, dashboard sections, clear data UCs | P1 | ✅ Done — v4.0 doc control; UC-051–059 added |
| DOC-06 | `product/USER_JOURNEYS.md` | Missing onboarding, clear data, section switcher, snapshot journeys | P1 | ✅ Done — v4.0; UJ-015–019 added |
| DOC-07 | `product/SCENARIOS.md` | Missing v4 scenarios | P1 | ✅ Done — v4.0; SCN-017–022 added |
| DOC-08 | `product/TEST_CASES.md` | Test count stale; missing P1 test plans for new features | P1 | ✅ Done — v4.0; test suite matrix (253 tests, 27 suites); TC-DQ, TC-MC, TC-MI, TC-CLD, TC-SD, TC-DS added |
| DOC-09 | `product/DEVELOPER_GUIDE.md` | v4.0, mostly current. Needs Calculation Reference nav note. | P1 | 🔍 Needs review — defer to after P1.1 feature is built |
| DOC-10 | `product/RELEASE_NOTES.md` | Still lists 9.27 perf, mobile polish, register guard as Planned — all are Done | P0 | ✅ Done — completed items moved from Planned to Done; P1 UX queue added |
| DOC-11 | `product/TECHNICAL_METHOD.md` | Missing: data quality, confidence, clear data, dashboard sections methods | P1 | ✅ Done — Methods 9–13 added (Data Quality, Confidence, Missing-Column Impact, Browser Data Reset, Dashboard Section Visibility) |
| DOC-12 | `product/ALGORITHM_SPEC.md` | Missing: Data Quality Score, Metric Confidence, parseDate memo, flowItemByKey algorithms | P1 | ✅ Done — Data Quality Score, Metric Confidence, parseDate memo, flowItemByKey Map, Snapshot Comparison algorithms added |
| DOC-13 | `product/APPENDIX.md` | Missing 15+ new terms: P4, Data Quality Score, Metric Confidence, Clear Local Data, localStorage, Dashboard Section Switcher, etc. | P1 | ✅ Done — added P4 level, sections K/L/M with 20+ new terms |
| DOC-14 | `product/PATENT_DISCLOSURE.md` | Review after P0 docs done | P2 | 📄 Deferred |
| DOC-15 | `product/CLAIM_CANDIDATE_MATRIX.md` | Review after P0 docs done | P2 | 📄 Deferred |
| DOC-16 | `product/PRIOR_ART_COMPARISON.md` | Review after P0 docs done | P2 | 📄 Deferred |

---

## P1 — New UX Features (2026-06-03)

> Start only after P0 documentation alignment is complete.

### P1.1 — Calculation Reference visibility in `/developer` blue side menu

| # | Task | Priority | Status |
|---|------|----------|--------|
| UX-01 | Verify Calculation Reference exists in `/developer` blue side menu as its own clearly labelled item | P1 | ✅ Done — confirmed: `🧮 Calculation Reference` in Reference group |
| UX-02 | If not visible, add `Calculation Reference` as distinct menu item (not buried under Help or Metrics) | P1 | ✅ Done — already present, no action needed |
| UX-03 | Active state styling when Calculation Reference is selected | P1 | ✅ Done — blue bg-blue-600 active state already implemented |
| UX-04 | Each calculation must explain: what it is, data source, why used, formula, benefit, alternatives, assumptions, limitations, related code, related doc | P1 | ✅ Done — added `usedIn` + `alternatives` fields to all 24 calculations; render updated to 7-field grid |
| UX-05 | Ensure Calculation Reference is visually separate from Package Reference | P1 | ✅ Done — separate buttons in same Reference group, visually distinct |

### P1.2 — Clear Local Data

| # | Task | Priority | Status |
|---|------|----------|--------|
| UX-06 | Add Clear Local Data option in Admin window / Admin settings | P1 | ✅ Done — `ClearLocalDataPanel` in admin settings Browser Data tab |
| UX-07 | Add Clear Local Data button on Upload/Landing page — only when stored browser data exists | P1 | ✅ Done — "Clear Local Data" button in amber detection banner |
| UX-08 | Detect stored Delivery Clarity browser data on Upload/Landing page (localStorage/sessionStorage keys) | P1 | ✅ Done — `hasLocalData()` in `clearLocalData.ts`, called on mount |
| UX-09 | Show detection message: "Stored Delivery Clarity data was found in this browser." | P1 | ✅ Done — amber banner on upload page and admin panel |
| UX-10 | Confirmation modal with title "Clear Local Data?", warning about session end, Yes/Cancel buttons | P1 | ✅ Done — reuses `ConfirmDeleteDialog` with custom title + label |
| UX-11 | Warning: "This will remove local data and may end your current session. You may need to log in again." | P1 | ✅ Done — exact warning text in `ConfirmDeleteDialog` message prop |
| UX-12 | Clear only Delivery Clarity keys — do not touch unrelated browser data | P1 | ✅ Done — `clearLocalData()` only removes `dc_*` / `dc-*` keys |
| UX-13 | After clearing: show success message, redirect to clean upload page | P1 | ✅ Done — green success banner; redirects after 1.8 s |
| UX-14 | Do not delete server-side import logs unless user explicitly uses server-side delete | P1 | ✅ Done — client-only operation; no API calls in clear path |
| UX-15 | Add tests for clear data detection, confirmation, and clearing behaviour | P1 | ✅ Done — 10 passing tests in `clearLocalData.test.ts` |

### P1.3 — Dashboard Section Show/Hide, Smooth Scroll, and Animation

| # | Task | Priority | Status |
|---|------|----------|--------|
| UX-16 | Add Dashboard Section controls at top of dashboard page immediately after main Overview section | P1 | ✅ Done — `DashboardSectionSwitcher` in sticky bar as Row 0 |
| UX-17 | Section buttons/tabs for all major sections: Overview, Sprints, Kanban, Flow, Risks, Data Quality, Confidence, Work Items, Trends, Snapshots, Recommendations, Readiness | P1 | ✅ Done — 14 section buttons in `DASHBOARD_SECTIONS` array |
| UX-18 | Default view: show Overview only, hide heavy/detail sections | P1 | ✅ Done — "Overview" button mode shows only overview + attention + recommendations |
| UX-19 | Overview mode — shows health score, key KPIs, top risks, data quality, confidence, recommendations summary | P1 | ✅ Done — OVERVIEW_KEYS = {overview, attention, recommendations} |
| UX-20 | Single section mode — click a button: show only that section, hide others | P1 | ✅ Done — `sectionMode = key` hides all other sections via `sectionVisible()` |
| UX-21 | Full View mode — show all sections (button: "Show Full Dashboard") | P1 | ✅ Done — "Full Dashboard" button resets `sectionMode` to `'full'` |
| UX-22 | Smooth scroll to selected section (`scrollIntoView({ behavior: 'smooth' })`) | P1 | ✅ Done — `focusSection()` calls `scrollIntoView({ behavior: 'smooth' })` |
| UX-23 | CSS animation: selected section fades in + slides up; hidden sections fade out/collapse | P1 | ✅ Done — `animate-slide-up` class on all 14 `<section>` elements |
| UX-24 | Reduced-motion support (`@media (prefers-reduced-motion: reduce)`) | P1 | ✅ Done — `globals.scss` media query disables `animate-fade-in` and `animate-slide-up` |
| UX-25 | Active section button highlighted | P1 | ✅ Done — active button gets `bg-blue-600 text-white`; "Full Dashboard" gets `bg-slate-900 text-white` |
| UX-26 | Each large section has its own hide/collapse button | P1 | ✅ Done — existing `CollapsibleTrigger` on every section provides collapse/expand per section |
| UX-27 | Role-based views remain compatible with section show/hide | P1 | ✅ Done — `sectionHeaderVisible` + `sectionVisible` both check `isHidden(key)` first |
| UX-28 | Mobile layout remains clean and usable with section controls | P1 | ✅ Done — switcher row uses `overflow-x-auto` horizontal scroll on mobile |
| UX-29 | Print/customer view remains clean (section controls not printed) | P1 | ✅ Done — `print:hidden` on the sticky bar; SectionNav wrapped in `print:hidden` |
| UX-30 | Add tests for section switcher, scroll, animation states | P1 | ✅ Done — 10 passing tests in `dashboardSectionSwitcher.test.ts` |

### P1 Documentation Updates (after UX features done)

| # | Task | Priority | Status |
|---|------|----------|--------|
| UX-31 | Update `product/SRS.md` for P1.1, P1.2, P1.3 | P1 | ✅ Done — FR-286–289 + A.19/A.20 added |
| UX-32 | Update `product/BRD.md` for P1.1, P1.2, P1.3 | P1 | ✅ Done — BR-091–094 added |
| UX-33 | Update `product/USE_CASES.md` for P1.2 and P1.3 | P1 | ✅ Done — UC-060–062 added |
| UX-34 | Update `product/USER_JOURNEYS.md` for P1.2 and P1.3 | P1 | ✅ Done — UJ-020–021 added |
| UX-35 | Update `product/SCENARIOS.md` for P1.2 and P1.3 | P1 | ✅ Done — SCN-023 (Clear Local Data), SCN-024 (Executive view), SCN-025 (Section Switcher) added |
| UX-36 | Update `product/TEST_CASES.md` for P1.1, P1.2, P1.3 | P1 | ✅ Done — TC-CLD, TC-DS, TC-GH, TC-EV added |
| UX-37 | Update `product/TECHNICAL_METHOD.md` for P1.2 and P1.3 methods | P1 | ✅ Done — Methods 12/13 updated to reflect actual implementation; Method 14 (Pill Button System) added |
| UX-38 | Update `product/RELEASE_NOTES.md` when P1.1, P1.2, P1.3 are done | P1 | ✅ Done — v4.1 section added |

---

## Enhancement Suggestions — Next Product Improvement Backlog

> **Rule:** Complete P0 items in order before moving to P1. Every item must include code + tests + docs + acceptance criteria.

### P0 — Must Start First (Quality, Trust, Privacy)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 9.1 | Data Quality Score after upload — 0–100% score, band, missing-field breakdown, actionable explanation | P0 | ✅ Done — 12 tests passing |
| 9.2 | Metric Confidence Score per KPI — confidence badge + reason on every major metric | P0 | ✅ Done — 14 tests passing |
| 9.3 | Missing-column impact explanation — which fields are missing and which metrics they break | P0 | ✅ Done — 12 tests passing |
| 9.4 | Privacy and data-retention settings — admin controls: retention period, auto-delete, clear all | P0 | ✅ Done — 10 tests passing |
| 9.5 | Delete import history / delete dashboard snapshot — user deletes own data, admin deletes any | P0 | ✅ Done — 10 tests passing |

---

### P1 — Start Only After All P0 Items Are Done

| # | Task | Priority | Status |
|---|------|----------|--------|
| 9.6  | Column-mapping preview before dashboard generation | P1 | ✅ Done — 10 tests passing |
| 9.7  | Sample/demo Jira dataset button | P1 | ✅ Done — 35-issue realistic demo dataset |
| 9.8  | First-time onboarding checklist | P1 | ✅ Done — 10 tests passing |
| 9.9  | Role-based dashboard views | P1 | ✅ Done — 5 views, 10 tests passing |
| 9.10 | Customer View | P1 | ✅ Done — 8 tests passing |
| 9.11 | Saved dashboard snapshots | P1 | ✅ Done — 8 tests passing |
| 9.12 | Snapshot comparison | P1 | ✅ Done — 8 tests passing |
| 9.13 | Upload-to-upload trend analysis | P1 | ✅ Done — 10 tests passing |
| 9.14 | "What changed since last upload?" panel | P1 | ✅ Done — 10 tests passing |
| 9.15 | Configurable health thresholds | P1 | ✅ Done — 10 tests passing |
| 9.16 | Configurable orphan detection rules | P1 | ✅ Done — 11 tests passing |
| 9.17 | Recommendation mute/snooze option | P1 | ✅ Done — 10 tests passing |
| 9.18 | Work Item Explorer risk-path highlight | P1 | ✅ Done — 8 tests passing |
| 9.19 | Work Item Explorer largest unfinished branch insight | P1 | ✅ Done — 8 tests passing |
| 9.20 | Work Item Explorer blocked branch filter | P1 | ✅ Done — 8 tests passing |
| 9.21 | Release readiness checklist | P1 | ✅ Done — 10 tests passing |
| 9.22 | Database backup and restore | P1 | ✅ Done — 8 tests passing |
| 9.23 | Production security checklist page | P1 | ✅ Done — 8 tests passing |
| 9.24 | Dockerfile and docker-compose setup | P1 | ✅ Done — Dockerfile + docker-compose.yml |
| 9.25 | Large export white screen fix | P0 | ✅ Done — FLOW_ITEMS_CAP=5,000; QuotaExceeded handling; dashboard warning banner |
| 9.26 | Mobile UX polish for `/explore` | P1 | ✅ Done — search stacks on mobile, graph shorter + no MiniMap, table → card list |
| 9.27 | Performance profiling for 5,000+ issues | P1 | ✅ Done — parseDate memo cache, flowItemByKey Map replaces O(n×groups) filter scans, hoisted today, timing log |

---

### P2 — Future Product Value

| # | Task | Priority | Status |
|---|------|----------|--------|
| 9.28 | Recommendation feedback buttons | P2 | ✅ Done — 👍/👎 buttons on each rec card, toggle behaviour, localStorage persistence, 8 tests passing |
| 9.29b | Recommendation history | P2 | ✅ Done — snapshots in dc_rec_history (max 10), NEW badge, Resolved section, collapsible history panel; 8 tests passing |
| 9.29 | Work Item Explorer export | P2 | ✅ Done — Excel (5 sheets: Summary, All Issues, Risk Items, Orphans, Insights) + CSV; Export dropdown on /explore; 11 tests passing |
| 9.30 | Release confidence trend | P2 | ✅ Done — 0–100 score per upload (completion 55%, blockers 25%, critical 12%, defects 8%); stored in metadataJson; chart + stat card + log column on /trends; 10 tests passing |
| 9.31 | Team-level health comparison | P2 | ✅ Done — /teams page: health score per assignee (completion 50%, critical 30%, blocked 20%), member scorecards, 4 comparison charts, detail table; nav item added; 10 tests passing |
| 9.32 | Cross-team portfolio summary | P2 | ✅ Done — /portfolio page: portfolio score (epics 40%, projects 30%, sprint 20%, data quality 10%), epic progress panel, project cards, quarter bars, epic detail table; nav item added; 10 tests passing |
| 9.33 | Executive one-page PDF export | P2 | ✅ Done — print-optimised single-page HTML (A4 landscape): health score, KPIs, epics, team capacity, top recommendations, insights; "Executive PDF" button on /summary; 8 tests passing |
| 9.34 | Action-owner assignment inside recommendations | P2 | ✅ Done — "Assign" button on each rec card (suggested owner shown as placeholder, custom name saved to dc_rec_owners in localStorage, edit/clear); 8 tests passing |
| 9.35 | Deployment guide for Vercel / Docker / VPS | P2 | ✅ Done — product/DEPLOYMENT_GUIDE.md: 12-section guide covering Docker (recommended), VPS/PM2, Vercel (preview only), nginx reverse proxy, SSL/Let's Encrypt, env var reference, backup/restore, post-deploy checklist, troubleshooting |
| 9.36 | System health/admin diagnostics page | P2 | ✅ Done — /admin/diagnostics: ops score (0-100), DB overview (users/sessions/snapshots), import health (success rate/avg score/processing time), env checks (5 variables), recent audit log, system info (Node/uptime/platform); nav item in Data group; 8 tests passing |
| 9.37 | Branding integration across login, favicon, reports, and exports | P2 | ✅ Done — logo SVG on login/register (was plain text); full metadata in layout.tsx (icons, OG, theme-color, twitter); lightning bolt brand mark in HTML report + Executive PDF headers; Excel slogan + author row; AppShell footer v2.0→v4.1; glossary footer v3.0→v4.1; email standardized to aliaburas80@gmail.com |
| 9.38 | Landing page inside the app | P2 | ❌ Not started |

---

### P3 — Nice to Have

| # | Task | Priority | Status |
|---|------|----------|--------|
| 9.39 | Product tour animation | P3 | ❌ Not started |
| 9.40 | Advanced theme customization | P3 | ❌ Not started |
| 9.41 | Custom dashboard layout builder | P3 | ❌ Not started |
| 9.42 | Advanced chart customization | P3 | ❌ Not started |
| 9.43 | Add Register link in header UserMenu dropdown (when not logged in) | P1 | ✅ Done |
| 9.44 | Show "Create new account" link on login page always | P1 | ✅ Done |
| 9.45 | Fix Charts page — Best Sprint chip shows abbreviated "S2" instead of full sprint name | P1 | ✅ Done |
| 9.46 | Audit all Charts page KPI chips and truncated values — ensure full names shown in tooltips/titles | P2 | ❌ Not started |

---

---

## P1 — Foundation / Explainability (Next Priority)

| # | Task | Priority | Status |
|---|------|----------|--------|
| P1-01 | Package Reference in `/developer` route — table of all packages, versions, usage, scope, risk | P1 | ✅ Done |
| P1-02 | Calculation Reference in `/developer` route — 25 metrics with formula, inputs, why, benefit, assumptions | P1 | ✅ Done |
| P1-03 | Package Reference in `product/DEVELOPER_GUIDE.md` | P1 | ✅ Done |
| P1-04 | Calculation Reference in `product/DEVELOPER_GUIDE.md` + `ALGORITHM_SPEC.md` | P1 | ✅ Done (DEVELOPER_GUIDE) |
| P1-05 | Production readiness checklist page | P1 | ✅ Done — implemented as 9.23 `/admin/security` + 9.21 `/readiness` |
| P1-06 | Security checklist page (`/admin/security`) | P1 | ✅ Done — implemented in 9.23 |
| P1-07 | Database backup and restore planning | P1 | ✅ Done — implemented in 9.22 |
| P1-08 | Dockerfile and docker-compose setup | P1 | ✅ Done — implemented as 9.24 |
| P1-09 | Performance profiling for 5,000+ issues | P1 | ✅ Done — FLOW_ITEMS_CAP=5,000 + deduplication (9.25) |
| P1-10 | Arrange navigation with grouped sub-menus instead of flat list (Analytics / Delivery / Data / Reference) | P1 | ✅ Done — dropdown groups + mobile hamburger panel |

---

## P2 — Future Architecture / Backlog Design Only

> Document and plan only. Do NOT implement full cloud or full Jira integration now.

| # | Task | Priority | Status |
|---|------|----------|--------|
| P2-01 | Admin Storage & Backup — architecture design, storage provider interface, S3/Azure/GCP planning | P2 | 📄 Planning documented — NO code written |
| P2-02 | Optional Jira API Integration — read-only mode design, field mapping, JQL fetch | P2 | 📄 Planning documented — NO code written |
| P2-03 | Storage database tables design (`storage_settings`, `storage_objects`, etc.) | P2 | 📄 Included in P2-01 docs — NO code written |
| P2-04 | Jira database tables design (`jira_connections`, `jira_field_mappings`, etc.) | P2 | 📄 Included in P2-02 docs — NO code written |

---

## P3 — Full Implementation (After P2 design complete)

> Do NOT start until P2 design is documented and reviewed.

| # | Task | Priority | Status |
|---|------|----------|--------|
| P3-01 | Full S3/Azure/GCP cloud storage implementation | P3 | ❌ Not started |
| P3-02 | Full Jira API read integration | P3 | ❌ Not started |
| P3-03 | Jira write-back (ticket creation from recommendations) | P3 | ❌ Not started |
| P3-04 | Jira OAuth support | P3 | ❌ Not started |
| P3-05 | Multi-provider cloud backup | P3 | ❌ Not started |

---

## P4 — Future Communication / Governance Layer

> Do NOT implement during P0 stabilisation. Plan and document only.

| # | Task | Priority | Status |
|---|------|----------|--------|
| P4-01 | Admin & System Notification Center — in-app notifications, admin-to-user, system-to-admin | P4 | 📄 Planning documented — NO code written |
| P4-02 | Maintenance Mode — admin-controlled, user maintenance screen, audit logs | P4 | 📄 Planning documented — NO code written |
| P4-03 | Email notification channel | P4 | ❌ Planned |
| P4-04 | Slack/Teams webhook notification channel | P4 | ❌ Planned |

---

*Delivery Clarity v4.0 (in progress) — Ali Delivery Intelligence — © 2025 Ali Abu Ras — aburasali80@gmail.com*  
*Slogan: From messy boards to measurable delivery confidence*
