# Delivery Clarity — Release Notes

**Brand:** Ali Delivery Intelligence  
**Slogan:** From messy boards to measurable delivery confidence

---

## v4.1 — UX Design System & Navigation (In Progress)

**Branch:** `feat/ux-design-system`  
**Last updated:** 2026-06-04  
**Status:** Active development — pill button design system, dashboard section switcher, clear local data, sticky page nav, nav menu icons, flow panel access control

### P1.2 — Clear Local Data
- Detection banner on upload page when stored browser data found
- Confirmation modal ("Clear Local Data?") with session-end warning
- Clears only Delivery Clarity keys (`dc_*`) — never touches unrelated browser data
- "Browser Data" tab in Admin Settings with key inventory panel
- 10 automated tests (TC-CLD-01–10)

### P1.3 — Dashboard Section Switcher
- Sticky tab bar below app header with 14 section navigation tabs
- Mode toggle: Full Dashboard / Overview / single-section focus
- Smooth scroll with dynamic offset (header + sticky bar height)
- IntersectionObserver dot sidebar (SectionNav) tracks active section
- CSS `animate-slide-up` for section entrance with `@media (prefers-reduced-motion)` support
- `scroll-margin-top: 14rem` on all sections for CSS anchor fallback
- Role-based views remain compatible — switcher respects `isHidden()` per view
- Print-clean: all switcher controls hidden in `@media print`
- 10 automated tests (TC-DS-01–10)

### UX — App-wide Pill Button Design System
- 9 pill button classes in `globals.scss` (all `rounded-full`):
  `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `btn-outline-danger`,
  `btn-green`, `btn-dark`, `btn-warning`, `btn-sm` / `btn-xs`
- Applied consistently across every page and component
- Icons added to all action buttons (SVG, not emoji)

### UX — Sticky Section Navigation
- `/glossary` — sticky tab bar with active tracking, section scroll, Back to Top button
- `/help` — search bar embedded in sticky nav, section tabs hidden while searching, Back to Top button

### UX — Navigation Menu
- Icons added to all 12 nav items (Analytics, Delivery, Data, Reference groups)
- Dropdown items use tab-button style: icon + label, active indicator dot

### UX — Dashboard Filter Row
- Filter pills (All/High Risk/Blocked/Needs Review) use solid filled pill style:
  active = solid color fill (blue/red/orange/purple), inactive = color-tinted outlined pill
- Entire filter row (pills + actions) hidden when Executive or Product Owner view selected
- Flow panel access control: "Show filters" button, KPI card clicks, and `applyQuickFilter`
  scroll all suppressed when `hideFlowPanel: true`

### Performance
- `xlsx` (~500 KB) now lazy-loaded on first export click — removed from dashboard bundle
- `excelInsightExport.service` loaded dynamically on demand

---

## v4.0 — Quality & Trust Layer (In Progress)

**Branch:** `feat/enhancements`  
**Last updated:** 2026-06-03  
**Status:** Complete — all P0/P1 features shipped; documentation aligned

### P0 Stabilisation (Completed)
- 253 automated tests passing across 21 test suites
- Build verified clean — all routes compile without errors
- All packages installed and Prisma client generated
- Documentation baseline aligned with code

### P1 — Data Quality & Trust
- **9.1** Data Quality Score — 0–100% score, 10-field check, band (Excellent→Critical), plain-English summary, 12 tests
- **9.2** Metric Confidence Score — per-KPI badge (High/Medium/Low/Unreliable/N/A), tooltip with reason + missing fields, 14 tests
- **9.3** Missing-column impact — field-by-field dashboard impact: what you see now, what you'd gain, affected locations, 12 tests
- **9.4** Privacy & data-retention settings — admin controls: 7/30/90/365/forever retention, auto-delete, clear all, 10 tests
- **9.5** Delete import history & snapshots — user deletes own data, admin deletes any, 2-click confirm, 10 tests

### P1 — User Experience
- **9.6** Column-mapping preview — shows before dashboard redirect: mapped/aliased/unrecognised columns, score, missing essentials, 10-second auto-proceed, 10 tests
- **9.7** Sample/demo dataset — 35-issue realistic Jira export, 4 sprints, 3 epics, accessible from upload page
- **9.8** First-time onboarding checklist — 8 steps auto-tracked, compact header chip, dismissible, 10 tests
- **9.9** Role-based dashboard views — 5 views (Full/Executive/Scrum Master/Product Owner/Eng Manager), section hiding, TierSep/Flow Panel hiding, 10 tests
- **9.10** Customer View (`/customer`) — clean stakeholder summary, no technical detail, print/PDF, 8 tests

### P1 — Analytics & History
- **9.11** Saved dashboard snapshots — name, save, list, load, delete, max 20/user, 8 tests
- **9.12** Snapshot comparison — side-by-side 12 metric delta table, ↑↓→ chips, insights, same-data detection, 8 tests
- **9.13** Upload-to-upload trend analysis — SVG line charts for 8 metrics over 30 uploads, timeline, table, 10 tests
- **9.14** "What changed since last upload?" panel — auto delta vs previous upload, 9 metric comparisons, narrative, 10 tests

### P1 — Configuration
- **9.15** Configurable health thresholds — 9 thresholds (cycle, lead, active age, open age, blocked ratio), admin UI, JSON-persisted, 10 tests
- **9.16** Configurable orphan detection rules — parent link fields, exempt types, sub-task flag, risk thresholds, 11 tests
- **9.17** Recommendation mute/snooze — per-card × button, 💤 dropdown (7d/30d/permanent), restore all, 10 tests

### P1 — Work Item Explorer Enhancements
- **9.18** Risk-path highlight — nodes and edges on the path from a risky item to the root turn red in the graph
- **9.19** Largest unfinished branch — the branch with the most open items is highlighted amber; stats card shows root key, open count, completion %
- **9.20** Blocked branch filter — "Blocked only" toggle in Explore; hides all non-blocked items from graph and table, 8 tests

### P1 — Operations & Reliability
- **9.21** Release readiness checklist (`/readiness`) — Go / Conditional Go / No-Go verdict per Fix Version; 7-item checklist; summary chips; 10 tests
- **9.22** Database backup & restore — admin tab: one-click JSON backup (DB + config files), restore with `.bak` safety copy, security allow-list, 8 tests
- **9.23** Production security checklist (`/admin/security`) — 8 automated checks + 5 manual, 0–100 score, production-ready flag, 8 tests
- **9.24** Docker deployment — multi-stage `Dockerfile` (node:20-alpine, non-root user), `docker-compose.yml` with volume mount + healthcheck, `.dockerignore`, `output: 'standalone'` in next.config.js

### P0 — Critical Bug Fixes
- **9.25** Large export white screen fix — `FLOW_ITEMS_CAP = 5,000`; `flow.items` sorted critical-first before cap; `QuotaExceededError` handling in `saveMetrics()` (trim → clear → log); amber warning banner on dashboard when items are capped; `MAX_FILE_SIZE` corrected to 20 MB; upload API warns in response
- Duplicate React key fix — `flowItems` deduplicated by Jira key before rendering; list keys use compound `section-issueKey` pattern
- Favicon 404 fix — `public/favicon.ico` (9-resolution ICO) added; `app/icon.png` removed

### P1 — Navigation
- **P1-10** Grouped sub-menu navigation — flat nav replaced with 4 dropdown groups:
  - **Analytics**: Overview, Full Report, Charts, Trends
  - **Delivery**: Readiness, Explore, Customer
  - **Data**: Snapshots, Backend
  - **Reference**: Glossary, Developer, Help
  - Active group stays blue; each dropdown shows page name + description; mobile hamburger expands a 2-column grid panel

---

## v3.0 — Intelligence Layer (Merged)

### Feature 1 — Throughput & Delivery Analytics
- Sprint throughput engine (committed/completed/carryover/goal outcome/delivery pattern)
- Mid-sprint pattern detection (5 patterns: Healthy/End-Loaded/Blocked/Scope Instability/Late)
- Kanban flow analytics (monthly periods, flow efficiency, aging WIP, bottleneck, flow health)
- SprintThroughputPanel, MidSprintDeliveryPanel, KanbanThroughputPanel on dashboard
- Sprint Velocity Chart (story points over time) on Charts page
- Sprint Comparison Panel (15-metric side-by-side with delta indicators)
- `src/types/throughput.ts` — full TypeScript coverage

### Feature 2 — Work Item Explorer (`/explore`)
- Hierarchy reconstruction (multi-signal: parent key, epic link, key prefix)
- Orphan risk detection — 4-class classification with delivery impact statements
- React Flow visual graph with Dagre layout, custom node cards, pan/zoom, minimap
- RelationCharts — 6 chart cards per issue (completion, health, types, assignee, sprint, orphan)
- Bug fix: field format compatibility (FlowItem and raw JiraIssue)

### Feature 3 — Authentication & Database
- SQLite via Prisma 5 (`data/delivery_clarity.db`)
- Auth API: login (bcrypt, iron-session, rate-limit 5/min), logout, register, me
- Login, Register, Profile, Admin/logs pages
- UserMenu in header (avatar, name, role badge, sign out)
- Middleware route protection (all app routes guarded)
- Upload API saves ImportLog with userId to SQLite
- Admin sees all users' logs; regular user sees only own logs
- **Package note:** `reactflow`, `@dagrejs/dagre`, `prisma`, `@prisma/client`, `iron-session`, `bcryptjs` — all installed and active

### Feature 4 — Smart Excel Export (17 sheets)
- Recommendation engine (10+ rules, evidence + impact + owner + action per rec)
- Executive Summary, Project Health, Team Performance, Sprint Throughput, Mid-Sprint,
  Kanban Flow, Risks & Blockers, Orphan & Data Quality, Assignee Workload, Story Points,
  Cycle & Lead Time, Throughput Trends, Recommendations, Release Readiness,
  Dependencies, Metric Dictionary, Raw Data Reference
- Export button in dashboard sticky bar and summary page

### Dashboard UX
- All dashboard sections collapsible (same pattern as Quarter Statistics)
- Saved filter presets (name, save, apply, delete via localStorage)
- Shareable URL — filter state in query params, "Copy link" button
- Drag-and-drop column reordering in issue table (DraggableMetricTable, localStorage-persisted)
- Multi-file upload — merge up to 10 exports, deduplicate by Issue Key
- Upload → dashboard redirect bug fixed (sessionStorage vs localStorage key mismatch)
- Role-based dashboard view selector (5 views, localStorage-persisted)

### New Routes (v3.0)
- `/explore` — Work Item Explorer
- `/login`, `/register`, `/profile` — Authentication
- `/admin/logs`, `/admin/settings` — Admin management
- `/glossary` — Abbreviations and metric glossary
- `/customer` — Customer-facing delivery summary
- `/snapshots`, `/snapshots/compare` — Snapshot management
- `/trends` — Upload-to-upload trend analysis

---

## v2.0 — Previous Release

- Dark mode, error pages, 40 tests, TypeScript cleanup
- CSV + HTML + Excel export
- Developer documentation portal
- Upload restart button in header

---

## v1.0 — Initial Release

- Jira CSV/XLSX upload and parsing
- Dashboard: health score, KPI cards, flow health, capacity, epics, labels, sprint status
- Charts page: visual analytics
- Summary page: health overview
- Backend/import log page

---

### P1 — UX & Mobile (2026-06-03, Completed)
- **9.26** Mobile UX polish for `/explore` — search bar stacks on mobile, graph height 380px + MiniMap hidden, table replaced with card list below md breakpoint
- **9.27** Performance optimisation for 5,000+ issues — `parseDate` memo cache (Map, reset per request), `flowItemByKey` Map replaces O(n×groups) filter scans in 7 builder functions, hoisted `today`, timing log on every upload
- **8.11** Register page guard — `NEXT_PUBLIC_ALLOW_REGISTER` wired to login link visibility and register page redirect; `.env` and `.env.example` aligned
- **fix** Dashboard horizontal scroll eliminated — `overflow-x-hidden` on `<body>`, sticky filter bar restructured into 2 flex-wrap rows
- **fix** Upload route `MAX_FILE_SIZE` corrected from 200 MB to 20 MB

### P1 — In Queue (Not Yet Started)
- **P1.1** Calculation Reference clearly visible as own item in `/developer` blue side menu
- **P1.2** Clear Local Data — Admin window + Upload/Landing page (with detection, warning, confirmation)
- **P1.3** Dashboard Section Show/Hide controls — Overview/Single/Full modes, smooth scroll, CSS animation, reduced-motion support

---

## Planned — P2/P3/P4 (Not Yet Implemented)

- **P2** Admin Storage & Backup (S3, Azure, GCP) — architecture design only
- **P2/P3** Optional Jira API Integration — export-first model remains default
- **P4** Admin & System Notification Center
- **P4** Maintenance Mode
