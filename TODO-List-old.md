# Delivery Clarity — TODO List

**Last updated:** 2026-06-07  
**Branch:** codex/flat-admin-settings  
**Version:** v4.2.2 — Release Candidate  
**Release status:** P0 reconciliation pass complete. `npm run lint`, `npm test` (469 tests / 48 suites), and `npm run build` all pass as of 2026-06-07. SRS, Use Cases, Developer Guide, Release Notes, README, and Test Cases are reconciled to the verified code state. Cloud storage is implemented and documented consistently as Done across all product docs. Forced first-login password change (`a6e8eec`) and the flat admin-settings redesign (`208db38`, `e43f3c1`, `7a748a4`, `da51b17`, `1d0148f`) are committed and pushed to this branch — see P1-11. New P1/P2 roadmap items below (Backend Gateway, User Add-Member Request Workflow, Role-Based Coaching Insights, Retrospective module, Forecasting) are Not Started — do not begin until explicitly approved per the priority model.

### Verified status (2026-06-07)

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ Pass — 0 errors (pre-existing `<img>` / `exhaustive-deps` warnings only; `.eslintrc.json` added, `react/no-unescaped-entities` and `auth.ts` require-import errors fixed) |
| Tests | `npm test` | ✅ Pass — 469 tests across 48 suites, 0 failed, 0 skipped |
| Build | `npm run build` | ✅ Pass — compiles and type-checks cleanly |

---

## Permanent P0 Policy — Documentation Must Match Code

> This is always P0. No feature, fix, or PR is complete until documentation is updated.

For every code change (this remains P0 at all times):
- Update each affected document in `product/`.
- Update `/help` and `/developer` in-app docs when user-facing or developer-facing behavior changes.
- Update `product/APPENDIX.md` when new terms, files, routes, storage keys, states, or provider concepts are introduced.
- Update `TODO-List.md` when roadmap status, priority, or sequencing changes.
- PR descriptions must mention docs updated or explicitly state why no docs were affected.

---

## Push Gate — Product Documentation Impact Matrix (New, from 2026-06-07 master prompt)

> Before every push, output this matrix. If any row is "Behind" or "Needs Review," do not push.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| product/SRS.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/BRD.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/USE_CASES.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/USER_JOURNEYS.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/SCENARIOS.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/TEST_CASES.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/DEVELOPER_GUIDE.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/RELEASE_NOTES.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/README.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/ALGORITHM_SPEC.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/TECHNICAL_METHOD.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/APPENDIX.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/PATENT_DISCLOSURE.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/PRIOR_ART_COMPARISON.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| product/CLAIM_CANDIDATE_MATRIX.md | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| Any other product/ file | Yes/No | Yes/No | ... | Done / Behind / Needs Review |

**Hard stop:** if any product file cannot be confirmed reviewed, output `Push blocked: product documentation impact check is incomplete.` If any product file is behind code, output `Push blocked: product documentation is behind code.`

---

## Traceability Rule (New, from 2026-06-07 master prompt)

> Every implemented feature must be traceable end-to-end. If any implemented feature lacks traceability, mark it P0 and fix documentation before new coding.

| Feature | SRS FR ID | Use Case ID | Scenario ID | User Journey ID | Test Case ID | Release Note | TODO Status |
|---|---|---|---|---|---|---|---|
| *(fill per feature — build this matrix as a P0 documentation task before HARD-01/02/03 begin)* | | | | | | | |

| # | Task | Priority | Status |
|---|------|----------|--------|
| TRACE-01 | Build the full traceability matrix above for every shipped v4.2.x feature (cross-reference SRS FR-xxx ↔ UC-xxx ↔ SCN-xxx ↔ UJ-xxx ↔ TC-xxx ↔ Release Notes entry ↔ TODO row) | P0 | ❌ Not started |

---

## Daily Master Prompt Regeneration Rule (New, from 2026-06-07 master prompt)

> At the start of every workday, regenerate the working prompt from current project state — do not reuse yesterday's prompt blindly.

The regenerated prompt must restate: current date, branch, version, code status, documentation status, TODO status, release-notes status, test/build/lint status, what changed yesterday, what is still behind, what is P0 today, what must not be started yet, updated execution order, and updated Definition of Done. If any document is behind code, it becomes P0 immediately.

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
| 3.5 | Real auth API routes: login, logout, inactive register, me, change password | P0 | ✅ Done |
| 3.6 | Login page (`/login`) | P0 | ✅ Done |
| 3.7 | Register route (`/register`) reserved but inactive | P0 | ✅ Done — redirects to `/login`; users are created only by Admin |
| 3.8 | Profile page (`/profile`) | P0 | ✅ Done — editable shared member profile fields |
| 3.9 | Admin logs page (`/admin/logs`) | P0 | ✅ Done |
| 3.10 | UserMenu in header (avatar, name, role badge, sign out) | P0 | ✅ Done |
| 3.11 | Middleware route protection (all app routes guarded) | P0 | ✅ Done |
| 3.12 | Upload API saves ImportLog with userId to SQLite | P1 | ✅ Done |
| 3.13 | `/api/imports` returns logs filtered by user (admin sees all with `?all=true`) | P1 | ✅ Done |
| 3.14 | User management admin module — add/manage/delete users, assign roles (`admin`, `scrum_master`, `product_owner`, `manager`, `c_level`), and filter dashboard/import data by role scope | P1 | ✅ Done — `/admin/settings → Users`, `/api/admin/users`, role-scoped imports, role-default dashboard views, route tests |
| 3.15 | Member directory (`/members`) for logged-in users with profile cards and contact/detail popup | P1 | ✅ Done |

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
| 8.11 | Public Register page guard | P1 | ✅ Superseded — public registration is disabled; user creation is admin-only |

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
| 9.37 | Branding integration across login, favicon, reports, and exports | P2 | ✅ Done — logo SVG on login/register (was plain text); full metadata in layout.tsx (icons, OG, theme-color, twitter); lightning bolt brand mark in HTML report + Executive PDF headers; Excel slogan + author row; AppShell footer v2.0→v4.1; glossary footer v3.0→v4.1; email standardized to ali.aburas@deliveryclarity.app |
| 9.38 | Landing page inside the app | P2 | ✅ Done — /landing: hero (logo + headline + CTAs), stats strip (4 KPIs), "How it works" (3 steps), feature grid (12 cards, each links to its page), gradient CTA footer; "About" nav item in Reference group; "See all 12 features →" link on upload page |

---

### P3 — Nice to Have

| # | Task | Priority | Status |
|---|------|----------|--------|
| 9.39 | Product tour animation | P3 | ✅ Done — 8-step guided tour: pulsing highlight ring + dark popover, progress dots, Back/Next/Skip, keyboard nav (←/→/Esc); no external library; autoStart on summary page; "Tour" button on dashboard; "Take a tour" on summary; dc_tour_dismissed/completed in localStorage; reduced-motion support; 8 tests passing |
| 9.40 | Advanced theme customization | P3 | ✅ Done — palette panel in AppShell header: 7 accent colours (blue/purple/teal/orange/indigo/rose/slate) via --dc-accent CSS vars; 3 radius presets (sharp/default/rounded) via --radius-md/lg; 3 font sizes (sm/md/lg) on html root; settings in dc_theme_custom localStorage; btn-primary wired to CSS vars; 8 tests passing |
| 9.41 | Custom dashboard layout builder | P3 | ✅ Done — "Layout" button in dashboard sticky bar opens panel: 14 sections with ▲▼ reorder buttons + toggle switches; saves order+visibility to dc_section_layout localStorage; DashboardSectionSwitcher reads custom order/hidden; isHidden() checks both view AND layout prefs; blue dot when layout differs from default; 9 tests passing |
| 9.42 | Advanced chart customization | P3 | ✅ Done — "Customise" button on /charts page opens panel: 11 charts with ▲▼ reorder, toggle visibility, width picker (1/3 · 2/3 · Full); spans applied from prefs via CSS span class; saved to dc_chart_prefs localStorage; blue dot when non-default; 9 tests passing |
| 9.43 | Add Register link in header UserMenu dropdown (when not logged in) | P1 | ✅ Superseded — public registration is inactive; header shows Sign in only |
| 9.44 | Show "Create new account" link on login page always | P1 | ✅ Done |
| 9.45 | Fix Charts page — Best Sprint chip shows abbreviated "S2" instead of full sprint name | P1 | ✅ Done |
| 9.46 | Audit all Charts page KPI chips and truncated values — ensure full names shown in tooltips/titles | P2 | ✅ Done — removed JS truncation from Sprint Velocity VertBar (was >9), Team Load HorizBar (was >14), Kanban Status HorizBar (was >16), GanttChart labels (was .slice(0,32)); SprintVelocityChart: shortName() kept for display but fullName prop added so tooltip shows full sprint name |

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
| P1-11 | Flat admin-settings UI redesign — unified sidebar, top context bar, summary cards, table-first workflow, danger-zone styling, role-based visibility, mobile responsiveness across `/admin/settings`, `/admin/security`, `/admin/diagnostics`, `/admin/logs` | P1 | ✅ Done — `208db38` (apply flat redesign), `e43f3c1` (unify console layout), `7a748a4` (add-user form layout), `da51b17` (header status chips), `1d0148f` (role-scoped user mgmt); committed and pushed |

---

## P0 — Before Jira Integration

> Complete these before starting `feat/jira-api-read-integration`. Jira integration must branch from updated `main` after PR #3 is merged.

| # | Task | Priority | Status |
|---|------|----------|--------|
| JIRA-GATE-01 | Merge PR #3 first — Jira integration depends on the cloud/session groundwork | P0 | ✅ Done — PR #3 merged to `main` on 2026-06-06 |
| JIRA-GATE-02 | Harden cloud restore behavior with tests: `/api/metrics/latest` returns `200 { available:false }`; `latest-metrics.json` is included in backups; pending local changes are not overwritten by bucket restore; `loadMetricsWithSource()` falls back to `localStorage`; saved cloud provider credentials persist across login/logout/session changes | P0 | ✅ Done — `cloudRestoreHardening.test.ts` adds TC-CS-09 to TC-CS-12; `storageSettingsPersistence.test.ts` adds TC-CS-13 to TC-CS-15 |
| JIRA-GATE-03 | Add visible source details: provider, bucket key, last fetched, last pushed, fallback reason | P0 | ❌ Not started |
| JIRA-GATE-04 | Add admin sync health check in Admin Settings / Diagnostics showing whether latest metrics are available and whether the cloud copy is current | P0 | ❌ Not started |
| JIRA-GATE-05 | Cloud Storage tab initial-load guard — when opening ☁️ Cloud Storage, disable provider cards/forms/actions until `/api/admin/storage` fully loads; only enable provider selection if no provider was previously chosen; prevent a temporary default/active state from flashing before server settings arrive | P0 | ❌ Not started |
| JIRA-GATE-06 | Cloud-backed user authority — when cloud storage is active, login/admin user management must sync user DB from cloud first and push user changes back to cloud; users must not rely on browser localStorage for account state | P0 | ✅ Done — `syncFromCloud()` before auth/admin user reads/writes; `pushToCloud()` after admin create/update and password change |
| JIRA-GATE-07 | Email access notifications — configure SMTP/email provider, send each created user their access URL and role, and log delivery status/errors | P0 | ❌ Not started |
| JIRA-GATE-08 | Strict role route authorization matrix — define which pages each role can open; hide disallowed nav routes and enforce protected page access in middleware, not only dashboard section visibility | P0 | ✅ Done — `allowedRoutePrefixesForRole()`, `canAccessRoute()`, AppShell nav filtering, middleware redirects, route matrix tests |
| JIRA-GATE-09 | Write Jira integration design doc before code: auth model, Jira API scope, field mapping, refresh strategy, storage tables, failure modes, and export-upload fallback/default path | P0 | ❌ Not started |
| JIRA-GATE-10 | After JIRA-GATE-01 through JIRA-GATE-09 are done, create `feat/jira-api-read-integration` from updated `main` | P0 | 🚫 Blocked — waiting on prior gates |

---

## P1 — Current Product Hardening (New, from 2026-06-07 master prompt — Not Started)

> Do not start any of these until the current uncommitted work (forced password change, admin redesign) is committed, pushed, and the P0 documentation gate is closed. Each item requires its own branch per [[feedback_branch_per_feature]] and a full `product/` impact pass before push.

| # | Task | Priority | Status |
|---|------|----------|--------|
| HARD-01 | Backend Integration Gateway foundation — `externalGateway.ts`, `providerRegistry.ts`, `endpointPolicy.ts`, `retryPolicy.ts`, `gatewayLogger.ts`, `types.ts`; endpoint allowlisting, SSRF/private-IP blocking, secret redaction, timeout/retry policy, audit logging, single-provider routing with architecture for future round-robin | P1 | ❌ Not started |
| HARD-02 | User Add-Member Request Workflow — in-app request form (name, email, role, reason), pending-request queue at new `/admin/user-requests` page (must follow the flat admin design from P1-11: same sidebar/top context bar/summary cards/table-first/danger-zone/role visibility/mobile pattern), accept/reject flow, requester notification, duplicate-email and high-privilege-role checks, audit log | P1 | ❌ Not started |
| HARD-03 | Role-Based Delivery Coaching Insights — per-role (Scrum Master, Product Owner, Engineering Manager, Delivery Manager, C-level, Team Lead, Admin) evidence-based suggestions derived from existing metrics; ceremony advice; dashboard section with role tabs/cards and severity badges | P1 | ❌ Not started |

---

## P2 — Product Intelligence / Forecasting / Retrospective (New, from 2026-06-07 master prompt — Not Started)

| # | Task | Priority | Status |
|---|------|----------|--------|
| RETRO-01 | Download Retrospective Template — `.xlsx` template with required columns + Instructions sheet + example rows, downloadable from `/retro`, Upload page, or Help Guide | P2 | ❌ Not started |
| RETRO-02 | Upload Retrospective File — CSV/XLSX/XLS/Markdown/plain-text upload with column mapping, preview, validation, missing-field detection | P2 | ❌ Not started |
| RETRO-03 | Fill Retrospective in App — in-app form (Retro Context, What Went Well, What Didn't Go Well, Blockers, Action Items, Next Sprint Suggestions) with draft save and submit | P2 | ❌ Not started |
| RETRO-04 | Generate Retrospective Insights & Improvement Backlog — themes, repeated blockers, action-item TODO list, owner/due-date gap detection, links to delivery metrics | P2 | ❌ Not started |
| RETRO-05 | Generate Next Sprint Suggestions from Retro — ceremony advice + prioritised suggestions with expected benefit | P2 | ❌ Not started |
| FCAST-01 | Forecasting Progress and Delivery Adjustment Report — `DeliveryForecast` model, on-track/at-risk/off-track status, expected completion date, confidence, gap analysis, adjustment options, charts (planned vs actual, forecast line, required vs current throughput), `/forecasting` dashboard section | P2 | ❌ Not started |

---

## P2 — Architecture / Backlog Design

> Cloud storage design has moved into implementation (P3-01). Jira integration remains design-first: do NOT implement Jira API/OAuth/write-back until the integration design is documented and reviewed.

| # | Task | Priority | Status |
|---|------|----------|--------|
| P2-01 | Admin Storage & Backup — architecture design, storage provider interface, S3/Azure/GCP planning | P2 | ✅ Done — implemented in P3-01; docs updated for bucket-first latest metrics |
| P2-02 | Optional Jira API Integration — read-only mode design, field mapping, JQL fetch | P2 | 🚫 Blocked — promoted to P0 gate JIRA-GATE-05 before implementation |
| P2-03 | Storage database tables design (`storage_settings`, `storage_objects`, etc.) | P2 | ✅ Superseded — current implementation uses `data/storage-settings.json`, provider factory, cache metadata, and backup bundles instead of storage DB tables |
| P2-04 | Jira database tables design (`jira_connections`, `jira_field_mappings`, etc.) | P2 | 🚫 Blocked — include in P0 Jira integration design doc |
| P2-05 | Load-balancer-aware gateway expansion — design `round_robin`, `weighted_round_robin`, `failover`, and `least_error_rate` provider-routing strategies on top of the Backend Integration Gateway's initial `single` mode; stateless request handling, shared DB-backed config, provider health state, correlation IDs | P2 | ❌ Not started — depends on HARD-01 foundation; design only, do not implement routing strategies until HARD-01 ships |
| P2-06 | CI/CD design with GitHub Actions — pipeline stages (lint, test, build, Docker image, deploy), branch/PR gating rules, secrets handling; design doc only | P2 | ❌ Not started |
| P2-07 | PostgreSQL migration assessment — feasibility, schema diff from SQLite/Prisma, migration strategy, rollback plan, performance comparison; assessment doc only | P2 | ❌ Not started |

---

## P3 — Full Implementation (After P2 design complete)

> Do NOT start until P2 design is documented and reviewed.

| # | Task | Priority | Status |
|---|------|----------|--------|
| P3-01 | Full S3/Azure/GCP cloud storage implementation | P3 | ✅ Done — StorageProvider interface; LocalProvider (data/cloud-backups/); S3Provider (@aws-sdk/client-s3, dynamic import); AzureProvider (@azure/storage-blob); GcpProvider (@google-cloud/storage); storageProvider.ts factory; GET/POST /api/admin/storage; Cloud Storage tab in /admin/settings; bucket-first `/api/metrics/latest`; `data/latest-metrics.json` included in backups; localStorage fallback indicator; PR #3 |
| P3-02 | Full Jira API read integration | P3 | 🚫 Blocked — start only after P0 Jira gates are complete and `feat/jira-api-read-integration` is branched from updated `main` |
| P3-03 | Jira write-back (ticket creation from recommendations) | P3 | ❌ Not started |
| P3-04 | Jira OAuth support | P3 | ❌ Not started |
| P3-05 | Multi-provider cloud backup | P3 | ✅ Done for selectable active providers — Local, S3/S3-compatible, Azure Blob, and GCP are implemented. Future enhancement, if needed: simultaneous replication to multiple providers. |
| P3-06 | Full CI/CD deployment automation (GitHub Actions pipelines, automated deploy) | P3 | 🚫 Blocked — do not implement until P2-06 design doc is documented and reviewed |
| P3-07 | PostgreSQL production migration | P3 | 🚫 Blocked — do not implement until P2-07 assessment is documented and reviewed |

---

## P4 — Future Communication / Governance Layer

> Do NOT implement during P0 stabilisation. Plan and document only.

| # | Task | Priority | Status |
|---|------|----------|--------|
| P4-01 | Admin & System Notification Center — in-app notifications, admin-to-user, system-to-admin | P4 | 📄 Planning documented — NO code written |
| P4-02 | Maintenance Mode — admin-controlled, user maintenance screen, audit logs | P4 | 📄 Planning documented — NO code written |
| P4-03 | Email notification channel | P4 | ❌ Planned |
| P4-04 | Slack/Teams webhook notification channel | P4 | ❌ Planned |
| P4-05 | Browser push notifications channel | P4 | ❌ Planned |

---

*Delivery Clarity v4.2.2 (Release Candidate) — Ali Delivery Intelligence — © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app*  
*Slogan: From messy boards to measurable delivery confidence*
