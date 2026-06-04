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

### UX — Filter Bar Redesign (Tab Style)
- Filter bar buttons (All, High Risk, Blocked, Needs Review) redesigned to match the **section switcher tab style** — no border, no pill/background, icon + label, **coloured underline indicator** for the active filter
- Active state: light blue gradient background + coloured bottom pill (blue / red / orange / purple per filter)
- Inactive state: transparent background, dark slate text, coloured icon on hover
- Red dot badge on "High Risk" when blocked or critical items exist
- Tool buttons (Clear, Show filters, Copy link, Save snapshot) also converted to tab style — no border, just icon + text
- Export button retains green gradient (primary CTA distinction)
- All buttons use `minHeight: 44` for touch accessibility

### P2 — Deployment Guide (9.35)
- New **`product/DEPLOYMENT_GUIDE.md`** — 12-section comprehensive deployment guide
- **Option A — Docker** (recommended): multi-stage Dockerfile + docker-compose walkthrough, volume persistence, healthcheck, useful commands, update procedure
- **Option B — VPS / Bare Metal**: Ubuntu 22.04 steps — Node 20, PM2, Prisma migrate, build, autostart, update procedure
- **Option C — Vercel** (preview/demo only): limitations table explains why SQLite doesn't persist on serverless
- **nginx reverse proxy** config with `client_max_body_size 25M` (required for Jira CSV uploads)
- **SSL / Let's Encrypt** with Certbot + auto-renewal
- **Environment variable reference** table — all 9 variables with required/default/description
- **Post-deploy checklist** — 8-item checklist including security score, password change, backup setup
- **Backup & restore** — Docker volume backup, VPS cron backup, in-app backup tool
- **Troubleshooting table** — 9 common problems with causes and fixes
- Also surfaced in `/developer` (new "Deployment" section), `/help` (new section), `/glossary` (new deployment terms)

### Developer Portal — Global Search
- **Search input** added to the Developer Portal blue sidebar (below the "Developer Portal" header)
- Searches across all three data sources simultaneously: **Calculations** (name, formula, why, usedIn, file, category) · **Packages** (name, usedFor, feature) · **Section labels**
- Results grouped by type with hit count; clicking a calculation result opens that section and expands the matching entry; clicking a package result opens packages and filters to it; clicking a section navigates directly
- Clear button and "Clear search" link; breadcrumb + main content hidden during search to focus on results

### P2 — Action-Owner Assignment in Recommendations (9.34)
- Each Smart Recommendation card now shows an **"+ Assign"** button (when not muted) with the `suggestedOwner` shown as a placeholder
- Clicking opens an inline text input — press Enter or "Save" to assign, Esc to cancel
- Assigned owner displayed as a blue pill badge with **Edit** and **✕** (clear) controls
- All owners persisted to `dc_rec_owners` in localStorage (key: `recKey(type, title)`)
- `suggestedOwner` added to every `smartAction` entry (e.g., "Scrum Master / Delivery Manager" for blockers)
- 8 automated tests (TC-AO-01–08)

### P2 — Executive One-Page PDF Export (9.33)
- New **"Executive PDF"** button (purple) on the `/summary` page
- Generates a **print-optimised single-page HTML** (`executive-summary-{date}.html`) designed to print as one A4 landscape page from any browser (no external PDF library)
- **Layout (3 columns)**: Left — health score header + 6 KPI cards + insights · Centre — top 5 epic progress bars + top 4 team capacity bars · Right — top 3 recommendations with priority dots
- **Print CSS**: `@page { size: A4 landscape; margin: 10mm; }` · `-webkit-print-color-adjust: exact` · `.no-print` on browser hint text
- **XSS-safe**: all user data escaped via `esc()` helper
- Formula lives in `src/lib/executivePdf.ts` — pure, testable; lazy-loaded via `exportUtils.ts`
- 8 automated tests (TC-EP-01–08)

### P2 — Cross-Team Portfolio Summary (9.32)
- New **`/portfolio`** page — single unified view of the entire delivery portfolio
- **Portfolio Score (0–100)**: weighted formula — epic completion (40%) + project completion (30%) + sprint performance (20%) + data quality (10%)
- **Portfolio bands**: Excellent ≥ 85 / Good ≥ 70 / Moderate ≥ 55 / At Risk ≥ 35 / Critical < 35
- **Sections**: Score banner + insights · KPI strip (6 cards) · Epic Progress panel (scrollable, colour-coded) · Project cards grid · Quarter throughput bars · Epic detail table
- **"Portfolio"** added to Analytics nav group
- Formula lives in `src/lib/portfolioHealth.ts` — pure, testable
- 10 automated tests (TC-PF-01–10)

### P2 — Team-Level Health Comparison (9.31)
- New **`/teams`** page — side-by-side health comparison for all team members (top 10 by workload)
- **Team Health Score (0–100)** per assignee: completion (50 pts) + no-critical (30 pts) + no-blocked (20 pts); bands: Healthy ≥ 70 / At Risk ≥ 40 / Critical < 40
- **Member Scorecards** grid (3 cols): avatar, health score badge, completion bar, issue/done/blocked/critical stats, health distribution pills, load%, avg open age
- **Comparison Charts** (4): Health Score · Completion % · Workload Share · Blocked+Critical — all with colour thresholds
- **Detail Table**: all members with sortable columns (score, band, done%, active, blocked, critical, SP, load, avg age)
- **"Teams"** added to Analytics nav group
- Formula lives in `src/lib/teamHealth.ts` — pure, testable
- 10 automated tests (TC-TH-01–10)

### P2 — Release Confidence Trend (9.30)
- New **Release Confidence Score** (0–100) computed on every upload: completion rate (55 pts) + no-blockers (25 pts) + no-critical (12 pts) + no-defects (8 pts)
- Score stored in `ImportLog.metadataJson` as `releaseConfidenceScore`
- `/trends` page gains: Release Confidence **trend chart** (purple, yMin=0 yMax=100), **stat card** in summary row, and **Rel. Confidence** column in upload log table — all gated on `releaseConfidenceScore != null` so old uploads show `—` gracefully
- Band helper: High ≥ 80 / Medium ≥ 60 / Low ≥ 40 / Critical < 40
- Formula lives in `src/lib/releaseConfidence.ts` — pure, testable, reusable
- 10 automated tests (TC-RC-01–10)

### P2 — Work Item Explorer Export (9.29)
- **Export dropdown** on `/explore` results view (visible once a graph is loaded)
- **Excel export** — 5-sheet workbook:
  - `01 Summary` — focus key, delivery stats, confidence, insights, largest unfinished branch
  - `02 All Issues` — all connected nodes + orphans with health, blocked, risk-path, role columns
  - `03 Risk Items` — filtered to blocked / critical / on-risk-path nodes only
  - `04 Orphans` — orphan nodes only
  - `05 Insights` — generated insight bullets
- **CSV export** — flat table of all issues (same columns as All Issues sheet)
- File named `explorer-{key}-{date}.xlsx / .csv` for easy archiving
- 11 automated tests (TC-EX-01–08)

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


---

## v4.1 — Recommendation Feedback (9.28, 2026-06-04)

### P2 — Recommendation Feedback Buttons
- **9.28** 👍/👎 feedback buttons on every Smart Recommendation card
  - "Helpful? Yes 👍 / No 👎" shown at the card footer
  - Voting the same option twice toggles it off
  - Votes persisted in `dc_rec_feedback` localStorage key
  - Visual state: active vote = solid filled pill (green/red); inactive = outlined
  - `castVote`, `getVote`, `clearVote`, `clearAllFeedback`, `getFeedbackSummary` API in `src/lib/recFeedback.ts`
  - 8 automated tests passing (TC-RF-01–08)

### P2 — Recommendation History (9.29b)
- Snapshots saved to `dc_rec_history` (max 10) each time recommendations change
- Deduplication: identical rec titles do not create a new snapshot
- **NEW badge** on recommendation cards that appeared since the previous upload
- **Resolved section**: strikethrough list of recs fixed since the last upload
- **History panel**: collapsible, shows up to 9 past snapshots with date, health score, and rec list
- `saveRecSnapshot`, `getRecHistory`, `getNewTitles`, `getResolvedRecs`, `clearRecHistory` in `src/lib/recHistory.ts`
- 8 automated tests passing (TC-RH-01–08)