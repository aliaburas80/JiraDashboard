# Delivery Clarity — Software Requirements Specification

---

## Document Control

| Field | Value |
|---|---|
| **Document Title** | Software Requirements Specification — Delivery Clarity |
| **Version** | 4.9.2 |
| **Date** | 2026-06-16 |
| **Author** | Ali Abu Ras (aburasali80@gmail.com) |
| **Status** | Active — Release Candidate (lint: pass, tests: 571/63 passing, build: pass — verified 2026-06-16) |
| **Repository** | https://github.com/aliaburas80/JiraDashboard |
| **Branch** | style/visual-design-updates |

### Revision History

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | 2025-Q3 | Ali Abu Ras | Initial architecture and upload pipeline |
| 0.2 | 2025-Q4 | Ali Abu Ras | Sprint metrics, KPI cards, Help Guide |
| 0.3 | 2026-Q1 | Ali Abu Ras | Manager Report, Smart Recommendations, DeliveryCircle |
| 0.4 | 2026-Q2 | Ali Abu Ras | Visual polish, dark mode, detail panel, accessibility |
| 1.0 | 2026-05-30 | Ali Abu Ras | First formal SRS release (v1 architecture — Express/CRA) |
| 2.0 | 2026-05-30 | Ali Abu Ras | v2 migration to Next.js App Router; all routes updated |
| 3.0 | 2026-05-31 | Ali Abu Ras | F1 Throughput, F2 Explorer, F3 Auth/Database, F4 Excel Export |
| 4.0 | 2026-06-03 | Ali Abu Ras | v4 Quality & Trust Layer; see Section 4.12–4.15 and Addendum A |
| 4.2.1 | 2026-06-06 | Ali Abu Ras | Cloud restore hardening, saved cloud-credential persistence |
| 4.2.2 | 2026-06-07 | Ali Abu Ras | P0 reconciliation pass — P1.1/P1.2/P1.3 marked Done/Verified, storage status reconciled as Implemented, test count normalised to 469 tests / 48 suites, lint/build failures fixed |
| 4.4.0 | 2026-06-09 | Ali Abu Ras | P1 — User Add-Member Request Workflow: FR-314–FR-319 (Prisma models + 5 API routes), Addendum B, §8.1 routes updated, TC-REQ-01–14 automated |
| 4.5.0 | 2026-06-09 | Ali Abu Ras | P1 — USERREQ UI layer: FR-320–FR-324, Addendum C, Notification Bell, Bulk User Management |
| 4.5.1 | 2026-06-09 | Ali Abu Ras | P1 — Auto-generate password UX + welcome email on accept: FR-319/FR-321 updated, FR-325 added, Addendum D, nodemailer wired |
| 4.5.2 | 2026-06-10 | Ali Abu Ras | P1 — Clickable notifications + admin settings tab deep-link: FR-323 updated, Addendum E, BR-113/BR-114, TC-NOTIF-06/07, UC-100, UJ-035, SCN-050 |
| 4.9.0 | 2026-06-14 | Ali Abu Ras | P1 — Navigation architecture overhaul: dashboard refactored into 11 routed pages, DashboardTopbar redesigned (3-zone), AppShell unified via DC_NAV_GROUPS, dc-shell component library, 23 legacy token aliases, /column-mapping page, load animations, frontend standards (SCSS modules / design tokens / zero inline styles) enforced via ESLint |
| 4.9.1 | 2026-06-14 | Ali Abu Ras | P1 — Admin layout overhaul (app/admin/layout.tsx + AdminNavSidebar) + developer wiki light theme (page.module.scss token remapping) |
| 4.9.2 | 2026-06-16 | Ali Abu Ras | P0 — Test fixes: adminSettingsConsole TC-AC-01 (config tab), userAddRequests TC-REQ-10 (tempPassword removed from response); P0 doc pass: RELEASE_NOTES, SRS, DEVELOPER_GUIDE, TEST_CASES, BRD updated; test suite verified 571/63 all passing |
| 4.9.3 | 2026-06-20 | Ali Abu Ras | P1 — ARCH-05 Phase 1 (Jira Connection Admin UI, in progress on `feature/arch-05-jira-integration`, unmerged): FR-337–FR-341, Addendum G, TC-JIRA-01–13, TC-GW-22/22b/23/23b; Jira API token moved from raw env var to encrypted App Config per explicit user request; test suite 589/64 passing |
| 4.9.4 | 2026-06-21 | Ali Abu Ras | P1 — ARCH-05 Phase 1 complete (manual "Sync now" + fallback contract, in progress on `feature/arch-05-jira-integration`, unmerged): FR-342 (sync route, JIRA-07), FR-343 (fallback contract / dashboard source badge, JIRA-08), Addendum G updated, UC-111, TC-JIRA-29–50, TC-CS-13–15; test suite 630/67 passing |
| 4.9.5 | 2026-06-22 | Ali Abu Ras | P1 — Two Explore/relation-graph bug fixes (JIRA-11/JIRA-12, multi-level Jira hierarchy display) plus admin-configurable Issue Type Hierarchy (ISSUETYPE-01): FR-344, UC-112; replaces hardcoded `IssueNodeType`/`TYPE_MAP`/`LEAF_TYPES` with an admin-editable registry; test suite 660/69 passing |
| 4.9.6 | 2026-06-22 | Ali Abu Ras | P1 — "Sync Jira" dashboard button for any logged-in user (JIRA-14): FR-345, UC-113; new `POST /api/jira/sync` (no role check) shares its all-or-nothing implementation with the existing admin-only per-connection route via a new `connectionSyncRunner.ts`; test suite 667/70 passing |
| 4.10.0 | 2026-06-23 | Ali Abu Ras | P1 — Role-Based Delivery Coaching Insights (RBC-01–20): FR-346–FR-352, Addendum H, UC-114, new `/dashboard/coaching` route, 7 category generators reading existing `DashboardMetrics` only (no new calculations), 20 new tests (TC-RBC-01–09 + edge cases); test suite 689/71 passing |
| 4.10.1 | 2026-06-26 | Ali Abu Ras | P1 — Coaching Insights redesign + 6 enhancements (RBC-21–26): FR-353–FR-354, Addendum H.6, presentation-only redesign of `/dashboard/coaching` plus tab urgency sort, quick-win celebration headline, severity trend vs. last saved snapshot, confidence-aware framing, empty-section encouragement, cross-category nudge dot, evidence-chip dashboard links; 4 new tests; test suite 694/73 passing |
| 4.7 | 2026-06-26 | Ali Abu Ras | P2 — Retrospective Upload, Insights Engine, `.xlsx` Template (RETRO-04–13, 17, 19–22, 29, 33–38): FR-355–FR-358, Addendum I, UC-103/104 updated, new `POST /api/retro/parse`, `src/services/retro/*`, shared `RetrospectiveInsight` engine replacing the flat-string `generateInsights()`, 13 new tests (`TC-RETRO-08`–`20`); fixed a real `XLSX.read()` CSV date-mangling bug found during implementation; persistence (RETRO-15/30) and metric-linking (RETRO-14) explicitly deferred; test suite 703/73 passing |
| 4.7.1 | 2026-06-26 | Ali Abu Ras | P2 — Retro report quality fixes after user testing ("retro report not useful"): FR-356 corrected — theme detection no longer runs over positive ("What Went Well") text, fixing a real bug where praise was flagged as a problem theme; FR-356b (new) — `suggestedBacklogItems`, concrete copy-pasteable story/task/spike suggestions (vs. free-text advice) gated by blockers/repeated-blockers/top-theme/missed-goal; 6 new tests (`TC-RETRO-14b/14c`, `TC-RETRO-21`–`25`); test suite 710/73 passing |
| 4.6.1 | 2026-06-27 | Ali Abu Ras | P2 — Forecasting Engine Extraction, Data-Quality-Aware Confidence, Risk Diagnosis, New Charts (FCAST-14–26): FR-359–FR-364, Addendum J, `computeForecast()` extracted to `src/services/forecast/forecastEngine.service.ts` (zero tests before this change → 12 new tests), confidence now folds in Data Quality + per-metric confidence, new "weakest factor" diagnosis, 2 new charts (Throughput Required vs. Current; Risk & Scope Trend); test suite 733/77 passing |
| 4.11.0 | 2026-06-27 | Ali Abu Ras | P1 — TEST-REQ traceability closure (TODO-List.md §22): reconciled `TEST-REQ-01–14` against the actual `TC-REQ-*` IDs, closing 12 of 14 as already-automated and finding 2 real server-side validation gaps. FR-316 updated — `POST /api/user-add-requests` now enforces email format and the high-privilege (admin/c_level) ≥20-character justification rule server-side (previously client-only in `RequestAddMemberModal.tsx`, bypassable via direct API call); added shared `isHighPrivilegeRole()` in `src/lib/roles.ts` used by both the modal and the route. 4 new tests (`TC-REQ-19`, `TC-REQ-20`, `TC-REQ-20b`, plus a submit-audit-event assertion added to `TC-REQ-01`); test suite 736/77 passing. Remaining genuine gaps recorded, not silently closed: `TEST-REQ-12` (true concurrent-request race needs a real-DB integration test, deferred to `FUT-POSTGRES-01`) and `TEST-REQ-14` (mobile layout needs Playwright, not Jest). |
| 4.11.1 | 2026-06-27 | Ali Abu Ras | P0 — `TRACE-04`–`13` traceability-placeholder closure (TODO-List.md §12): `TRACE-04–08` were stale duplicates of already-closed anchors (UX-06/07/08/09, TRACE-01 cluster #1, COVER-16) — marked Done with cross-references, no new docs needed. `TRACE-09/10/12/13` (Gateway, User Add-Member Request, Retrospective, Forecasting) had since shipped but the placeholder rows still said "create once implemented" — closed with real anchors. Found and fixed real staleness in the *other* direction while closing this: `COVER-01/06/07/09/11/12/17/19/20/21/22` still described gateway/forecasting/retrospective/coaching as roadmap-only/unbuilt, months after all four shipped — corrected each row. Also found `UC-102` (View Delivery Forecast) hadn't been updated when FCAST-14–26 merged — added the FR-359–364/Addendum J/§9.55a cross-reference. No code changed; test suite remains 736/77 passing. |
| 4.12.0 | 2026-06-27 | Ali Abu Ras | P1 — Multi-Tenant Organization Phase 1 (schema + isolation core), partial; on `feature/org-phase1-tenant-isolation`, unmerged. New `Organization` model; `organizationId` required on `User`/`ImportLog`/`DashboardSnapshot`/`UserAddRequest`/`Notification`/`JiraConnection` (3-migration sequence — add-nullable → backfill → tighten — verified against the real dev database with zero data loss); `AuditEvent.organizationId` deliberately permanently nullable. New `src/server/tenancy/scopedRepository.ts` mandatory data-access module (12 tests, `TC-ORG-01–12`) plus an ESLint rule banning direct `prisma.<orgScopedModel>.*` calls outside it. `SessionData` now carries `organizationId`. Found and fixed a real isolation gap: `user_add_request` admin notifications were broadcasting across the whole deployment, not scoped to the requester's org. **Not yet done**: ~31 existing route files still read/update/delete via direct Prisma calls (only `.create()` sites were fixed) — explicitly tracked in the ESLint allowlist, not silently left undocumented; full SRS Addendum, `ORG-06` admin scoping, and the route-level `ORG-08`/`ORG-08a` adversarial tests/review remain pending until that migration completes. Test suite 748/78 passing; `tsc`/lint/build clean. |
| 4.12.1 | 2026-06-27 | Ali Abu Ras | P1 — Per-Organization Settings added to design (`ORG-36`–`43`), design only, per explicit user request — six currently-global settings categories (theme/branding, issue type hierarchy, health thresholds, retention, cloud storage, SMTP/app-config) get a single `OrganizationSettings` model (1:1 with `Organization`) instead of disk-JSON/single-blob storage. Flagged a real bug class while designing this: every one of the six services caches its parsed config in an unkeyed module-level variable today — fine for one organization, a cross-tenant leak risk for more than one — so each cache becomes `Map<organizationId, ParsedConfig>`. Theme/branding keeps its existing per-user `localStorage` override layered on top of the new per-org default. Migration folds into the Phase 1 backfill script. Rollout plan grew to 7 phases. No code changed. |
| 4.12.2 | 2026-06-27 | Ali Abu Ras | P1 — Per-Organization Storage Isolation (§3a, `ORG-44`–`46`) and Individual Data Privacy/Sharing/Self-Service Deletion (§11, `ORG-47`–`54`) added to design, design only, per explicit user request. Storage: new `scopedStorage()` helper enforces `orgs/{organizationId}/...` object-key construction server-side, mirroring `scopedRepository` for the storage layer — a shared bucket with only an app-level prefix *convention* was explicitly rejected as insufficient. Individual privacy: confirmed with the user that existing role-based in-org visibility (`admin`/`manager`/`c_level` see all org data) is unchanged — "never shared with others" means org-to-org isolation plus protecting the plain `user` role's data by default (§3.3). Added self-service "Delete My Data" (data only, not account deletion — explicitly scoped out), per-user `UserStorageSettings` override with an org-admin kill switch (`allowUserStorageOverride`), and a `DataShareGrant` model for explicit, revocable, single-resource, same-org-only, non-transitive user-to-user sharing (deliberately no blanket "share everything" grant in v1). Rollout plan grew to 9 phases. No code changed. |

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional, non-functional, data, interface, and security requirements for **Delivery Clarity**, a self-hosted Jira analytics platform. It serves as the authoritative reference for development, testing, stakeholder review, and future maintenance. Every requirement is numbered and traceable to a named codebase component.

### 1.2 Scope

Delivery Clarity accepts Jira CSV or Excel exports and produces a real-time, multi-dimensional delivery health dashboard. The system requires no Jira credentials or network access to Jira at runtime; all computation is performed against the uploaded file. The platform is intended for self-hosting by engineering teams and is accessed via a web browser.

**In scope (v4.0 — current):**
- File upload, parsing, and validation (CSV/XLSX/XLS, max 20 MB, multi-file merge up to 10 files)
- Metric computation across all delivery dimensions (`calculateDashboardMetrics`)
- Interactive dashboard with all named sections, collapsible, role-based views
- Manager Quick Overview report and Smart Recommendations engine
- Interactive Help Guide (17+ sections)
- Story/Task Flow Health table with 11 filters, column reorder, saved presets, shareable URL
- **User authentication and multi-user sessions** — login, register, profile, iron-session cookies
- **SQLite database persistence** via Prisma 5 — User, ImportLog, DashboardSnapshot, AuditEvent
- **Role-based access** — `admin`, `scrum_master`, `product_owner`, `manager`, `c_level`, and legacy `user`; Admin/Manager/C-level can request all import logs, while Scrum Master/Product Owner/user are scoped to their own uploads
- **Data Quality Score** — 0–100% score, 10-field check, plain-English summary
- **Metric Confidence Score** — per-KPI confidence badge with reason and missing-field explanation
- **Missing-column impact explanation** — field-by-field dashboard impact
- **Column-mapping preview** before dashboard generation
- **Sample/demo Jira dataset** — 35-issue realistic export
- **First-time onboarding checklist** — 8 steps auto-tracked
- **Role-based dashboard views** — 5 curated presets
- **Customer View** (`/customer`) — clean stakeholder summary
- **Saved dashboard snapshots** — save, list, load, delete (max 20/user)
- **Snapshot comparison** — side-by-side delta for 12 metrics
- **Upload-to-upload trend analysis** — 8 metrics over 30 uploads
- **"What changed since last upload?" panel**
- **Configurable health thresholds** — 9 thresholds, admin UI, JSON-persisted
- **Configurable orphan detection rules** — parent fields, exempt types, sub-task flag
- **Recommendation mute/snooze** — per-card, 7d/30d/permanent
- **Work Item Explorer risk-path highlight**, largest unfinished branch, blocked branch filter
- **Release Readiness checklist** (`/readiness`) — Go/Conditional Go/No-Go per Fix Version
- **Database backup and restore** — one-click JSON backup, restore with `.bak` safety
- **Production security checklist** (`/admin/security`) — 8 automated + 5 manual checks
- **Docker deployment** — multi-stage Dockerfile + docker-compose with volume and healthcheck
- **Privacy and data-retention settings** — admin-controlled retention period and auto-delete
- **Delete import history and snapshots**
- **F1 Throughput analytics**, **F2 Work Item Explorer**, **F3 Authentication & Database**, **F4 Smart Excel Export (17 sheets)**
- Dark mode, print mode, mobile responsiveness (including `/explore` mobile polish)
- Performance optimised for 5,000+ issues (parseDate memo cache, flowItemByKey Map)
- **Dashboard routed pages** — dashboard refactored into 15 independent Next.js App Router pages under `app/dashboard/[section]/`: summary, priority-attention, sprint-status, epics (epic-readiness), labels, flow-health, key-metrics, kanban-health, visual-analytics, ownership (ownership & capacity), quarter-statistics, smart-actions, delivery-composition, delivery-controls, data-quality
- **Standalone analytics pages** — 6 full-page analytics routes accessible from the nav (not nested under /dashboard): `/data-quality` (Data Quality report), `/delivery-mix` (issue-type/status breakdown), `/flow-health` (flow health table), `/release-readiness` (release readiness checklist), `/sprint-kanban` (sprint + kanban overview), `/work-explorer` (work item explorer standalone)
- **Admin layout injection** — `app/admin/layout.tsx` provides `DashboardTopbar` + `AdminNavSidebar` to all `/admin/*` routes via Next.js layout file; individual pages render content only
- **Developer wiki** — `/developer` renders as a light wiki theme; all dark palette tokens remapped to semantic light values via `.wiki` SCSS class
- **DC shell component library** — `src/components/dc-shell/`: `DCTopbar`, `DCPageSidebar`, `DCKpiCard`, `DCStatusChip`, `DCActionBoard`, `DeliveryClarityShell` — reusable chrome for non-dashboard pages
- **Unified navigation** — `DC_NAV_GROUPS` (`src/components/dc-shell/navigation.ts`) is single source of truth for all nav items; both AppShell and DashboardTopbar consume it
- **`/column-mapping` route** — column mapping preview page before dashboard generation
- **Frontend architecture standards** — zero inline `style` props (ESLint `react/forbid-dom-props`), SCSS modules for all custom styling, Tailwind for layout utilities only, `src/styles/_tokens.scss` as single source of truth for all visual values

**Out of scope (v4.0 — not yet implemented):**
- Jira OAuth or API token direct connection (roadmap P3)
- Real-time Jira data polling (roadmap P3)
- Scheduled email or Slack reports (roadmap P4)
- In-app Notification Center (roadmap P4)
- Maintenance Mode (roadmap P4)
- Jira write-back / ticket creation (roadmap P3)
- AI-generated delivery narrative (roadmap, unscheduled)
- Native mobile application (not planned)

**P1 — Done / Verified (shipped; see FR-283–FR-285 for full acceptance detail):**
- Calculation Reference as clearly visible item in `/developer` blue side menu (P1.1) — Done, Verified, covered by tests and `/developer` docs
- Clear Local Data — Admin window + Upload/Landing page with detection, warning, confirmation (P1.2) — Done, Verified, covered by `clearLocalData.test.ts`
- Dashboard Section Show/Hide controls — Overview/Single/Full modes, smooth scroll, CSS animation, reduced-motion support (P1.3) — Done, Verified, covered by `dashboardSectionSwitcher.test.ts`

### 1.3 Definitions and Acronyms

| Term | Definition |
|---|---|
| **SRS** | Software Requirements Specification |
| **FR** | Functional Requirement |
| **NFR** | Non-Functional Requirement |
| **AC** | Acceptance Criterion |
| **Jira** | Atlassian issue tracking tool whose CSV/XLSX export format is this system's primary input |
| **Issue** | A single row in the Jira export file representing a Story, Task, Bug, Epic, Sub-task, etc. |
| **Health** | Per-issue classification: `good`, `warning`, or `critical`, computed by `getHealthFromIssue` |
| **Health Score** | Aggregate 0–100 integer score for the entire upload, computed by `calculateHealthScore` |
| **Flow item** | An issue annotated with all computed health fields, produced by `getHealthFromIssue` |
| **Sprint** | A named time-box in Jira; read from the `Sprint`, `Actual Sprint`, or `Planned Sprint` field |
| **Epic** | A parent-level Jira issue type; referenced via `Epic Link` or `Parent Key` |
| **Orphan** | An issue with no `Epic Link` and no `Parent Key` |
| **Velocity** | `doneIssues / elapsedDays` — issues completed per calendar day |
| **Lead Time** | Elapsed days from `Created Date` to the resolved/done date |
| **Cycle Time** | Elapsed days from `In Progress Date` (or `Sprint Start`) to the done date |
| **Done** | A status value in `['Done', 'Closed', 'Resolved']` — determined by `isDone()` |
| **Active** | A status value in `['In Progress', 'Code Review', 'QA', 'Testing', 'UAT']` — determined by `isActive()` |
| **Blocked** | An issue where `Blocked Flag == true` |
| **Overdue** | An issue where the `Due Date` has passed and the issue is not done |
| **Delivery Circle** | A single SVG ring classifying every issue into exactly one of five segments with no double-counting |
| **DeliveryCircle** | The React component rendering the Delivery Composition ring |
| **KPI** | Key Performance Indicator — one of six metric cards in the Overview section |
| **Manager Report** | A modal printable executive summary generated by the `ManagerReport` sub-component |
| **Smart Action** | One auto-generated prioritised recommendation card produced by the `SmartActions` sub-component |
| **Flow Table** | The `#flow-health-panel` section rendering a filterable, paginated list of all flow items |
| **Import Log** | JSON file at `backend/data/import-logs.json` storing metadata for every past upload |
| **Section Nav** | The floating right-edge navigation component (`SectionNav`) with 14 colour-coded dots |
| **FAB** | Floating Action Button — the scroll-to-top button (`ScrollToTopFab`) |
| **CRA** | Create React App — the frontend build toolchain |
| **CORS** | Cross-Origin Resource Sharing — controlled by the `ALLOWED_ORIGIN` environment variable |
| **RAM** | Random Access Memory — all uploaded files are processed in RAM via multer `memoryStorage` |
| **BOM** | Byte Order Mark — stripped from CSV headers in `canonicalizeHeader` |
| **ESSENTIAL_FIELDS** | The four required columns: `Issue Key`, `Issue Type`, `Summary`, `Status` |
| **OPTIONAL_FIELDS** | The 53 non-required columns whose absence generates a warning |
| **FIELD_ALIASES** | The mapping table in `parser.js` from 32 Jira column-name variants to canonical field names |
| **IntersectionObserver** | Browser API used by `SectionNav` to detect the currently visible section |
| **Quarter** | A `"YYYY QN"` label derived from an issue's done, created, or updated date |
| **Story Points** | Numeric effort estimate field; parsed by `getStoryPoints` via `parseNumber` |

### 1.4 References

| Reference | Location |
|---|---|
| Project README | `README.md` (repository root) |
| Release Notes | `RELEASE_NOTES.md` (repository root) |
| Metrics Engine | `backend/src/services/metrics.js` |
| File Parser | `backend/src/services/parser.js` |
| Upload Route | `backend/src/routes/upload.js` |
| Validation | `backend/src/utils/validation.js` |
| Import Log Service | `backend/src/services/importLogs.js` |
| Backend Control Center View | `backend/src/services/backendView.js` |
| Express Entry Point | `backend/src/index.js` |
| React Entry Point | `frontend/src/App.js` |
| Dashboard Component | `frontend/src/components/DashboardPage.js` (~2,150 lines) |
| KPI Card Component | `frontend/src/components/KpiCard.js` |
| Help Guide Component | `frontend/src/components/HelpGuide.js` |
| Upload Page Component | `frontend/src/components/UploadPage.js` |
| API Client | `frontend/src/services/api.js` |
| Global Styles | `frontend/src/styles.css` (~3,200 lines) |
| Backend Package | `backend/package.json` |
| Frontend Package | `frontend/package.json` |
| Metrics Unit Tests | `backend/tests/metrics.test.js` |
| Import Log Data | `backend/data/import-logs.json` |

### 1.5 Overview

This document is organised as follows:

- **Section 2** describes the overall product from an architectural perspective.
- **Section 3** details the system architecture, data flow, and state management.
- **Section 4** enumerates every functional requirement, numbered FR-001 through FR-100.
- **Section 5** enumerates non-functional requirements covering performance, security, usability, reliability, and maintainability.
- **Section 6** specifies the full input and output data models.
- **Section 7** covers all external interface requirements.
- **Section 8** provides the complete API specification.
- **Section 9** documents known constraints and limitations.
- **Section 10** provides numbered, testable acceptance criteria.
- **Section 11** is the requirements traceability matrix.

---

## 2. System Overview

### 2.1 Product Perspective

Delivery Clarity is a standalone, self-hosted web application. It has no dependency on a live Jira instance at runtime — it consumes a standard Jira CSV or Excel export produced by any Jira Cloud or Jira Server installation. The system consists of two independently runnable processes:

1. A **Node.js/Express backend** (default port 4000) responsible for file parsing, metric computation, and import logging.
2. A **React single-page application frontend** (default port 3000, or served as a static build) responsible for all data visualisation and user interaction.

The system does not use a relational database. All metric computation is synchronous and in-memory. The only persistent store is `backend/data/import-logs.json`, a flat JSON array written by `importLogs.js` after each successful upload.

### 2.2 Product Functions

At the highest level, Delivery Clarity performs the following functions:

1. **Ingest** a Jira CSV or XLSX file via a browser upload form.
2. **Parse** the file, normalising 32 field aliases to canonical names across 53+ optional fields and 4 essential fields.
3. **Validate** the presence of the four essential fields and return structured errors if any are absent.
4. **Compute** a comprehensive metrics payload via `calculateDashboardMetrics`, covering health classification, delivery scoring, sprint metrics, flow efficiency, capacity, epics, labels, issue types, quarterly breakdown, relations, and predictive completion.
5. **Render** a 14-section interactive dashboard from the metrics payload with no further network calls.
6. **Generate** auto-prioritised Smart Recommendations from the computed metrics client-side.
7. **Present** a one-click, printable Manager Quick Overview report.
8. **Guide** users through an interactive 17-section Help Guide.
9. **Filter** the full issue list via 11 simultaneous filter dimensions in the Flow Health table.
10. **Log** every import attempt with file metadata, extraction statistics, and validation results.

### 2.3 User Classes

| Class | Description | Primary Sections Used |
|---|---|---|
| **Engineering Manager** | Reviews team health, capacity, and sprint delivery; generates stakeholder reports | Dashboard Summary, Manager Report, Sprint Status, Capacity, Smart Recommendations |
| **Scrum Master** | Monitors sprint velocity, blockers, cycle time, and overdue items | Sprint Status, Flow Health, Attention Cards, Smart Recommendations, Help Guide |
| **Product Owner** | Reviews epic readiness, label distribution, customer-visible progress, and quarterly throughput | Readiness, Labels, Quarter Statistics, KPI Cards |
| **Developer** | May inspect individual issue health, linked items, and flow position | Flow Health Table, Relations, Detail Modal |
| **Administrator** | Deploys the system, manages environment variables, reviews import logs | Backend Control Center, Import Log API |

### 2.4 Operating Environment

**Backend:**
- Node.js >= 18 (required; uses native `node --test` test runner)
- npm >= 9
- Runtime RAM: minimum 512 MB recommended for files up to 20 MB
- OS: any POSIX-compatible system or Windows with Node.js support

**Frontend:**
- Built with Create React App (react-scripts 5.0.1), React 18.3.1
- Development server: port 3000
- Production: static files served by any HTTP server (nginx, Caddy, etc.)
- Browser targets (production): `>0.2%`, not dead, not op_mini all
- Browser targets (development): last 1 Chrome, last 1 Firefox, last 1 Safari version
- Minimum screen width: 375 px (iPhone SE viewport)

**Network:**
- Backend and frontend communicate via HTTP REST on `localhost` by default
- `ALLOWED_ORIGIN` environment variable controls CORS; defaults to `*` (all origins) in development

### 2.5 Design and Implementation Constraints

1. **Database:** SQLite via Prisma 5 at `data/delivery_clarity.db`. Stores User, ImportLog, DashboardSnapshot, AuditEvent. Import history is no longer a flat JSON file.
2. **Authentication:** Full auth layer implemented via iron-session (HTTP-only, SameSite=strict cookies). All routes protected by `middleware.ts`. User and admin roles enforced.
3. **File processing:** Synchronous within the Next.js API route lifecycle. For datasets ≤ 5,000 issues, processing completes in < 500ms (optimised with parseDate memo cache and flowItemByKey Map). For exports > 5,000 issues, the top 5,000 highest-risk items are stored; all aggregate metrics use the full dataset.
4. The `xlsx` package (SheetJS) is used for all file reading; handles `.csv`, `.xlsx`, and `.xls` formats.
5. The application is a Next.js 14 App Router multi-page application. Pages are separate routes with server and client components.
6. Computed metrics are stored server-side in `data/latest-metrics.json`, included in cloud backup bundles, and cached in browser `localStorage` (key prefix `dc_`) for fallback. The `FLOW_ITEMS_CAP` is 5,000 items for browser-side `flow.items`.
7. All uploaded file bytes are processed in memory and discarded after the response is sent. No file is written to disk.
8. The standalone Express backend (`backend/`) is a v1 legacy artifact. It is not used in the production v4 Next.js build.
9. Session TTL is configurable via `SESSION_TTL_HOURS` environment variable (default: 8 hours).
10. Rate limit: 5 login attempts per minute per IP; 20 upload requests per 15-minute window per IP.

### 2.6 Assumptions

1. Users will export from Jira using the standard "Export → Excel (all fields)" or "Export → CSV" workflow.
2. Jira column names may vary across Jira versions and configurations; the system handles 32 known alias variants.
3. Users are responsible for including the recommended columns listed in the README; the system degrades gracefully if optional fields are absent.
4. The backend runs on a trusted internal network or behind a reverse proxy that handles TLS termination.
5. A single instance of the backend serves a small team (fewer than 50 concurrent users); horizontal scaling is not in scope.
6. The browser environment supports `IntersectionObserver`, `window.matchMedia`, `navigator.clipboard`, and modern CSS custom properties.

---

## 3. System Architecture

### 3.1 Architecture Diagram (v4.0)

```
┌────────────────────────────────────────────────────────────────────┐
│                     Delivery Clarity v4.0                          │
│                                                                    │
│  Browser                     Next.js 14 App Router (port 3000)     │
│  ┌────────────────────┐      ┌─────────────────────────────────┐   │
│  │  React Client       │ ──► │  app/ pages (SSR + Client)      │   │
│  │  (localStorage)     │ ◄── │  middleware.ts (auth guard)      │   │
│  │  - dashboard data   │      │  app/api/ (Route Handlers)      │   │
│  │  - filter prefs     │      │  ├── auth/login, logout, me     │   │
│  │  - view state       │      │  ├── upload (POST)              │   │
│  └────────────────────┘      │  ├── snapshots (CRUD)           │   │
│                               │  ├── imports (CRUD)             │   │
│                               │  └── admin/* (admin only)       │   │
│                               └────────────┬────────────────────┘   │
│                                            │                        │
│                               ┌────────────▼────────────────────┐   │
│                               │  src/services/                   │   │
│                               │  ├── metrics/ (calculation)      │   │
│                               │  ├── jira/ (parser, validation)  │   │
│                               │  ├── relations/ (explorer)       │   │
│                               │  ├── dataQuality/ (DQ + impact)  │   │
│                               │  ├── export/ (Excel, recs)       │   │
│                               │  └── settings/ (thresholds etc.) │   │
│                               └────────────┬────────────────────┘   │
│                                            │                        │
│                               ┌────────────▼────────────────────┐   │
│                               │  Prisma 5 / SQLite               │   │
│                               │  data/delivery_clarity.db        │   │
│                               │  User, ImportLog, Snapshot,      │   │
│                               │  AuditEvent                      │   │
│                               └────────────────────────────────── ┘  │
└────────────────────────────────────────────────────────────────────┘
```

> **Note:** The `frontend/` (Create React App) and `backend/` (Express) directories are v1 legacy artifacts preserved for historical reference. They are NOT used in the production v4 Next.js build.

### 3.2 Frontend — Next.js 14 App Router (v4.0)

All pages are Next.js App Router routes under `app/`. Client components are marked `'use client'`. Server components handle data fetching and rendering.

**`src/components/layout/AppShell.tsx`** — navigation header with grouped dropdown nav (4 groups: Analytics / Delivery / Data / Reference), hamburger mobile menu, UserMenu, theme toggle.

**`app/dashboard/page.tsx`** — Full Report dashboard. Metrics loaded via `loadMetricsWithSource()`, which tries `/api/metrics/latest` (bucket-backed server metrics) before falling back to `localStorage`. State: 15+ filter controls, role-based view selector, export menu, snapshot save, filter presets, shareable URL sync. First load defaults to the authenticated user's role view unless a manual view is already saved.

**`src/lib/storage.ts`** — `saveMetrics()`, `loadMetricsWithSource()`, `hasMetricsFromAnySource()`, `markMetricsSource()`. Handles `QuotaExceededError` gracefully and records source metadata in `dc_metrics_source_v1`.

**`middleware.ts`** — Next.js middleware protecting all app routes. Redirects unauthenticated users to `/login?redirect=<path>`. Admin routes redirect non-admin users.

### 3.3 Service Layer — src/services/ (v4.0)

**`src/services/metrics/metrics.service.ts`** — `calculateDashboardMetrics(issues)`: synchronous orchestrator. Optimised with `_parseDateCache` (Map memo, reset per call) and `flowItemByKey` (Map for O(1) group lookups). Emits timing log.

**`src/services/jira/parser.ts`** — `parseJiraFile(file)`: reads buffer with SheetJS, normalises headers via `FIELD_ALIASES`, returns `{ issues, warnings, headers, sheetName }`.

**`src/services/dataQuality/dataQuality.service.ts`** — `calculateDataQuality(issues)`: 10-field check, 0–100 score, band, plain-English summary.

**`src/services/dataQuality/missingFieldImpact.service.ts`** — `calculateFieldImpacts(issues)`: per-field impact analysis.

**`src/services/metrics/metricConfidence.service.ts`** — `calculateMetricConfidence(issues)`: per-KPI confidence badge with reason.

**`src/services/export/excelInsightExport.service.ts`** — 17-sheet Excel workbook.

**`src/services/export/recommendationEngine.ts`** — 10+ recommendation rules.

**`src/services/relations/relationExplorer.service.ts`** — `buildRelationGraph(key, issues)`: hierarchy reconstruction, orphan classification, relation graph.

**`src/services/settings/thresholds.service.ts`** — file-based config at `data/health-thresholds.json`, in-memory cached.

**`src/services/settings/orphanRules.service.ts`** — file-based config at `data/orphan-rules.json`, in-memory cached.

**`src/services/settings/backup.service.ts`** — database + config JSON backup and restore.

**`src/services/settings/securityCheck.service.ts`** — 8 automated security checks.

### 3.4 Data Flow (v4.0)

```
1. User logs in via POST /api/auth/login → iron-session cookie set
2. middleware.ts allows authenticated requests through
3. User selects file on Upload page (/)
4. Browser POSTs multipart/form-data to POST /api/upload
5. Rate limiter: 20 req/15min per IP → 429 if exceeded
6. Extension + size check: unsupported → 400; > 20 MB → 413
7. parser.ts reads buffer, normalises headers, returns { issues[], warnings[] }
8. validation.ts checks ESSENTIAL_FIELDS → 422 if missing
9. calculateDashboardMetrics(issues):
     - _parseDateCache = new Map() — reset memo
     - today = new Date() — hoisted
     - flowItems = issues.map(getHealthFromIssue)
     - flowItemByKey = new Map(flowItems) — O(1) lookups
     - All 12+ builder functions run against flowItemByKey
     - Elapsed time logged: "[metrics] calculateDashboardMetrics: Xms for N issues"
10. calculateDataQuality, calculateFieldImpacts, calculateMetricConfidence run
11. ImportLog saved to SQLite via Prisma with userId, fileName, healthScore, etc.
12. AuditEvent saved to SQLite
13. Response: { metrics, warnings, importLog }
14. Server stores latest metrics in `data/latest-metrics.json`; client stores fallback metrics in localStorage via saveMetrics()
15. Client navigates to /dashboard (or /summary if first upload)
16. Dashboard page loads metrics from `/api/metrics/latest` first, then browser localStorage fallback via loadMetricsWithSource()
17. All dashboard sections render from metrics
```

### 3.5 Data Model — Prisma Schema (v4.0)

| Model | Key fields |
|---|---|
| `User` | id, name, email (unique), passwordHash, role (`admin`, `scrum_master`, `product_owner`, `manager`, `c_level`, legacy `user`), isActive, createdAt |
| `ImportLog` | id, userId, fileName, fileSize, fileType, totalIssues, doneIssues, healthScore, processingTimeMs, createdAt |
| `DashboardSnapshot` | id, userId, name, metrics (JSON), createdAt |
| `AuditEvent` | id, userId, eventType, eventDescription, ipAddress, userAgent, createdAt |
| `SystemErrorLog` | id, errorCode, errorMessage, prismaModel, operation, context, payload (JSON), resolution (`logged`/`auto-fixed`/`retried`/`resolved`/`skipped`), retryCount, lastRetriedAt, resolvedAt, createdAt |
| `UserAddRequest` | id, requestedEmail, requestedByUserId, status (`pending`/`approved`/`rejected`/`cancelled`), adminDecisionNote, createdAt |

---

## 4. Functional Requirements

### 4.1 File Upload and Parsing

**FR-001 — Accepted File Formats, Size, and Rate Limits**

The system shall accept file uploads only in the following formats: `.csv`, `.xlsx`, `.xls`. Any other extension shall be rejected with HTTP 400 and a message in the form `"Unsupported file type '<ext>'. Upload a .csv, .xlsx, or .xls Jira export."` The maximum accepted file size is 20 MB (20 × 1024 × 1024 bytes); files exceeding this limit shall return HTTP 413 with the message `"File exceeds the 20 MB size limit. Export a smaller date range or reduce the number of columns."` The upload endpoint is rate-limited to 20 requests per 15-minute window per source IP address. Exceeding the rate limit shall return HTTP 429 with the message `"Too many uploads from this IP. Please wait 15 minutes before trying again."` Rate-limit response headers shall use the standard `RateLimit-*` header format; legacy `X-RateLimit-*` headers shall be disabled.

**FR-002 — Multer Configuration and Memory Storage**

The backend shall configure multer with `memoryStorage()`. Uploaded file bytes shall be held in `req.file.buffer` and shall not be written to any disk location. The multer field name expected in the multipart form is `file` (via `upload.single('file')`). If no file field is present in the request, the endpoint shall return HTTP 400 with the message `"No file uploaded. Please upload a Jira Excel or CSV export."` Any unhandled exception in the parse or metrics pipeline shall return HTTP 500 with the message `"Unable to process Jira export file."` The backend shall log the error to stderr.

**FR-003 — Header Normalisation (FIELD_ALIASES)**

The parser's `canonicalizeHeader(header)` function shall perform the following operations in order:
1. Strip any leading UTF-8 BOM character.
2. Trim leading and trailing whitespace.
3. Convert the header to lowercase.
4. Look up the lowercased value in the `FIELD_ALIASES` map.
5. Return the canonical field name if found, otherwise return the trimmed (pre-lowercase) original value.

The `FIELD_ALIASES` map shall contain at minimum the following 32 entries:

| Alias (lowercased) | Canonical Field |
|---|---|
| `issue key` | Issue Key |
| `issue type` | Issue Type |
| `summary` | Summary |
| `status` | Status |
| `project name` | Project |
| `project key` | Project |
| `custom field (team)` | Team |
| `assignee` | Assignee |
| `reporter` | Reporter |
| `status category` | High Level Status |
| `priority` | Priority |
| `labels` | Labels |
| `resolution` | Resolution |
| `original estimate` | Original Estimate |
| `remaining estimate` | Remaining Estimate |
| `time spent` | Time Spent |
| `created` | Created Date |
| `updated` | Updated Date |
| `resolved` | Resolution Date |
| `due date` | Due Date |
| `parent` | Parent Key |
| `parent key` | Parent Key |
| `comment` | Last Comment |
| `custom field (epic link)` | Epic Link |
| `custom field (epic name)` | Epic Link |
| `custom field (story points)` | Story Points |
| `custom field (story point estimate)` | Story Points |
| `custom field (start date)` | Sprint Start |
| `custom field (target start)` | Sprint Start |
| `custom field (target end)` | Sprint End |
| `custom field (actual start)` | In Progress Date |
| `custom field (actual end)` | Done Date |

**FR-004 — Validation of Essential Fields**

After parsing, `validateIssueData(issues)` shall verify that at least one issue in the dataset has non-empty values for all four ESSENTIAL_FIELDS: `Issue Key`, `Issue Type`, `Summary`, and `Status`. If any essential field is absent from every row (i.e., the column does not exist or is universally blank), the endpoint shall return HTTP 422 with body `{ error: 'Validation failed', details: <array of missing field names>, importLog: <log entry> }`. An import log entry shall be written with `status: 'error'` and the validation errors recorded in `extraction.validationErrors`.

**FR-005 — Optional Field Warning Generation**

After parsing, the system shall compare the normalised headers found in the file against the `OPTIONAL_FIELDS` array (53 entries). Any optional fields absent from the headers shall be listed in a warning string appended to the `warnings` array in the parser's return value. This warnings array shall be included in the 200 response as `warnings`. An empty array indicates all optional fields were found. The `OPTIONAL_FIELDS` array includes (but is not limited to): `Issue Key`, `Issue Type`, `Summary`, `Epic Link`, `Parent Key`, `Project`, `Component`, `Team`, `Assignee`, `Reporter`, `Status`, `High Level Status`, `Priority`, `Risk Level`, `Risk Description`, `Labels`, `Fix Version/s`, `Sprint`, `Sprint Goal`, `Story Points`, `Original Estimate`, `Time Spent`, `Remaining Estimate`, `Created Date`, `Updated Date`, `Sprint Start`, `Sprint End`, `In Progress Date`, `Code Review Date`, `QA Start Date`, `Done Date`, `Due Date`, `Resolution`, `Resolution Date`, `Reopened Count`, `Blocked Flag`, `Blocker Reason`, `Commitment Type`, `Added After Sprint Start`, `Scope Change Type`, `QA Pass`, `UAT Status`, `Defects Count`, `Customer Visible`, `Release Ready`, `Acceptance Criteria Ready`, `Definition of Ready Met`, `Definition of Done Met`, `Business Value`, `Effort Confidence`, `Planned Sprint`, `Actual Sprint`, `Dependencies`, `Stakeholder Owner`, `Requirement Stability`, `Risk Score`, `Last Comment`, and `Issue URL`.

---

### 4.2 Metric Computation

**FR-010 — getHealthFromIssue — All Signals and Thresholds**

The function `getHealthFromIssue(issue, today)` shall compute a health classification for a single issue using the following signals and thresholds:

| Signal | Condition | Classification |
|---|---|---|
| Active work age | `isActive(issue)` AND `ageDays > 7` | `warning` |
| Active work age | `isActive(issue)` AND `ageDays > 14` | `critical` (overrides warning) |
| Cycle time (done items) | `isDone(issue)` AND `cycleDays > 7` | `warning` |
| Cycle time (done items) | `isDone(issue)` AND `cycleDays > 14` | `critical` |
| Waiting age (not started) | `!isActive && !isDone` AND `ageDays > 30` | `warning` |
| Due date | `Due Date` is past AND `!isDone` | `critical` |
| Priority | `Priority` in `['High', 'Highest', 'Critical']` AND `!isDone` | `critical` |
| Blocked flag | `Blocked Flag == true` | `critical` |

Multiple signals shall combine: a blocked item that is also overdue shall have both reasons recorded in its `reason` array. The overall `health` value shall be `'critical'` if any critical signal fires, `'warning'` if only warning signals fire, and `'good'` otherwise.

Computed flow fields returned by `getHealthFromIssue`:
- `leadTimeDays` — `daysBetween(parseDate(issue['Created Date']), getDoneDate(issue))`
- `cycleTimeDays` — `daysBetween(getStartedDate(issue), getDoneDate(issue))`
- `ageDays` — `daysBetween(parseDate(issue['Created Date']), today)`
- `activeAgeDays` — days from `In Progress Date` or `Sprint Start` to today (if active)
- `isBlocked` — `issue['Blocked Flag'] == true`
- `isOverdue` — due date is past and not done
- `isHighPriority` — priority in `['High', 'Highest', 'Critical']` and not done
- `isOrphan` — no `Epic Link` AND no `Parent Key`
- `health` — `'good'` | `'warning'` | `'critical'`
- `reason` — array of human-readable reason strings

**FR-011 — calculateHealthScore — Exact Formula with Weights**

The function `calculateHealthScore({ totalIssues, completionRate, flow, sprint, storyPoints })` shall compute a delivery health score as follows:

```
total           = max(totalIssues, 1)
criticalRatio   = flow.critical / total
warningRatio    = flow.warning / total
orphanRatio     = (count of flow.items where isOrphan) / total
latestSprintRate = sprint.sprints[0].completionRate  (or completionRate if no sprint data)
avgCycle        = flow.averageCycleTimeDays  (or 0 if absent)
cycleScore      = avgCycle === 0 ? 100 : max(0, 100 - (avgCycle - 3) × 8)

raw =
  completionRate                       × 0.28
  + (1 - min(criticalRatio, 1)) × 100  × 0.24
  + (1 - min(warningRatio,  1)) × 100  × 0.12
  + latestSprintRate                   × 0.14
  + (1 - min(orphanRatio,   1)) × 100  × 0.12
  + min(cycleScore, 100)               × 0.10

healthScore = round(clamp(raw, 0, 100))
```

Score bands shall be: 90–100 Excellent · 75–89 Good · 60–74 Moderate · 40–59 At Risk · 0–39 Critical.

**FR-012 — calculatePrediction — Velocity Formula**

The function `calculatePrediction(issues, doneIssues, totalIssues)` shall compute a predictive completion estimate as follows:

1. If `doneIssues >= totalIssues`, return `{ complete: true, daysRemaining: 0 }`.
2. `remaining = totalIssues - doneIssues`
3. Collect all non-null parsed `Created Date` values as epoch milliseconds. If none exist, return `{ complete: false, daysRemaining: null }`.
4. `elapsed = max((Date.now() - min(timestamps)) / 86400000, 1)`
5. `velocity = doneIssues / elapsed`
6. If `velocity < 0.01`, return `{ complete: false, daysRemaining: null }`.
7. `daysRemaining = round(remaining / velocity)`
8. `predictedDate = new Date(now + daysRemaining × 86400000)` formatted as "D Mon YYYY" using `en-GB` locale.
9. Return `{ complete: false, daysRemaining, predictedDate, velocityPerDay: round(velocity, 2) }`.

The prediction card shall be hidden from the Summary bar when `daysRemaining` is null.

**FR-013 — buildFlowMetrics**

`buildFlowMetrics(flowItems)` shall wrap `summarizeFlowItems` to compute aggregate counts (`issues`, `done`, `good`, `warning`, `critical`) and averages (`averageLeadTimeDays`, `averageCycleTimeDays`, `leadTimeSampleSize`, `cycleTimeSampleSize`). It shall append an `items` array sorted: critical items first, then warning, then good; ties within each health tier broken by `ageDays` descending.

**FR-014 — buildSprintMetrics**

`buildSprintMetrics(issues, flowItems)` shall group issues by sprint name using `getSprintName(issue)` (returning the first non-null of `Sprint`, `Actual Sprint`, `Planned Sprint`, or `'No sprint'`). Per sprint, it shall compute: issue count, completed issues, committed story points, completed story points, `completionRate` (issue completion %), `pointCompletionRate` (story point completion %), and the `summarizeFlowItems` spread. The function shall return the top 8 sprints sorted by `completedPoints` descending, plus `hasSprintData` (boolean) and `sprintCount`.

**FR-015 — buildStatusBreakdown (Kanban)**

`buildStatusBreakdown(issues, key, flowItems)` shall group issues by a field key (e.g., `Status` or `High Level Status`) and return per-group: count, story points, done count, and the full `summarizeFlowItems` spread. Results shall be sorted descending by count. This function is called twice for the Kanban section: once with `'Status'` key and once with `'High Level Status'` key; the results are returned as `kanban.byStatus` and `kanban.byHighLevelStatus` respectively.

**FR-016 — buildQuarterMetrics**

`buildQuarterMetrics(issues, flowItems)` shall assign each issue to a quarter using `getQuarterLabel(getQuarterDate(issue))`. `getQuarterDate` returns the first non-null of `Done Date`, `Created Date`, or `Updated Date`. `getQuarterLabel` formats as `"YYYY QN"`. Per quarter: issue counts, done/active breakdown, story point counts, completion rates, a `statusBreakdown` of the top 6 statuses, and `summarizeFlowItems`. Results shall be sorted by quarter label descending, with `'No date'` sorted last.

**FR-017 — buildCapacityMetrics**

`buildCapacityMetrics(issues)` shall group issues by `Assignee`. Per assignee: total issues, active issues, done issues, story points, done story points, and `loadShare` (percentage of all issues held by that assignee). The function shall return the top 10 assignees sorted by issue count descending.

**FR-018 — buildEpicMetrics**

`buildEpicMetrics(issues, flowItems)` shall group issues by `Epic Link` or `Parent Key` (whichever is non-empty). Per epic: issue count, story points, `progress` (% issues done), `pointProgress` (% story points done), and `summarizeFlowItems`. The function shall return the top 10 epics sorted by issue count descending.

**FR-019 — buildLabelMetrics — Multi-Label Handling**

`buildLabelMetrics(issues, flowItems)` shall expand each issue into one entry per label. Labels are parsed by `parseLabels(issue)`, which splits the `Labels` field on `,`, `;`, or `|` delimiters and trims each token. Issues with no labels shall contribute to the `'(unlabeled)'` bucket. Per label: count (of issues bearing that label), done count, `completionRate`, story points, and `summarizeFlowItems`. The function shall return the top 15 labels sorted by count descending, plus `totalLabeled`, `totalUnlabeled`, and `uniqueLabels` counts.

**FR-020 — buildTypeMetrics**

`buildTypeMetrics(issues, flowItems)` shall group issues by `Issue Type`. Per type: count, done count, `completionRate`, story points, and `summarizeFlowItems`. Results sorted descending by count.

**FR-021 — buildProjectMetrics**

`buildProjectMetrics(issues, flowItems)` shall group issues by the `Project` field (normalised from `project name` or `project key` aliases). Per project: count, done count, `completionRate`, story points, and `summarizeFlowItems`. Results sorted descending by count.

**FR-022 — buildParentMetrics**

`buildParentMetrics(issues, flowItems)` shall group only those issues that have a non-empty `Parent Key` field, grouping by that key. Per parent: count, done count, `completionRate`, story points, and `summarizeFlowItems`. The function shall return the top 12 parents sorted by count descending.

**FR-023 — buildLinksMetrics — Dynamic Column Detection**

`buildLinksMetrics(issues)` shall detect link columns dynamically. Any column whose name matches the pattern `*issue link*` (case-insensitive substring) shall be treated as a link column. Known examples: `Inward issue link (Blocks)`, `Outward issue link (Blocks)`, `Inward issue link (Relates)`, `Outward issue link (Relates)`, `Inward issue link (Duplicate)`, `Outward issue link (Duplicate)`.

The function shall return:
- `hasLinks` — boolean, true if any link columns are present
- `totalLinks` — total count of all link references across all issues
- `itemsWithLinks` — count of issues with at least one link
- `linkTypes` — array of `{ type, count, uniqueFrom }` per link column, sorted by count descending
- `linkStats` — summary statistics
- `mostLinked` — top 10 issues by total link count
- `blockedItems` — top 10 items with inward blocking links (columns matching `inward issue link (blocks)`)

**FR-024 — buildRiskMetrics**

`buildRiskMetrics(issues)` shall compute four risk counts:
- `blockedIssues` — count where `Blocked Flag == true`
- `overdueIssues` — count where `Due Date` is in the past AND `!isDone(issue)`
- `highPriorityOpenIssues` — count where `Priority` is in `['High', 'Highest', 'Critical']` AND `!isDone(issue)`
- `openDefects` — count where `Issue Type` is in `['Bug', 'Defect']` AND `!isDone(issue)`

**FR-025 — buildInsights**

`buildInsights(metrics)` shall generate an array of up to 5 human-readable insight strings. Insight content shall cover, in order of evaluation: lead time observations (comparing `averageLeadTimeDays` to threshold), cycle time observations, sprint data presence, critical item count, warning item count, and story point completion rate. Only insights where the condition evaluates as noteworthy shall be included; the array may contain fewer than 5 strings.

---

### 4.3 Dashboard Sections

The dashboard shall render the following 14 named sections in order, identified by their anchor IDs:

**FR-030 — Dashboard Header**

A persistent header shall display: the application name "Delivery Clarity", a Help button (triggers `onOpenHelp('welcome')`), and a dark/light mode toggle button. The header shall remain visible at the top of the page.

**FR-031 — #dashboard-summary — Summary Bar**

The summary bar shall display:
- A `HealthScoreGauge` circular gauge showing the `healthScore` (0–100) with the score band label. Clicking the gauge shall open the Manager Report modal.
- A health status badge combining the score band and issue completion rate.
- A target vs. actual completion comparison.
- Four delta cards: Completion %, Health Alerts count, Active Work count, and Predictive Completion ETA (hidden if `prediction.daysRemaining` is null).
- Confidence badges for `overallDeliveryConfidence` and `customerVisibleProgress` (hidden if data absent).
- Five action buttons: "Quick Overview" (opens Manager Report), "Review high-risk items" (opens Detail panel with top blockers), "Export risk report" (downloads `jira-risk-report.csv`), "Save layout view" (persists filter state to `localStorage`), and "Help" (calls `onOpenHelp('summary')`).

**FR-032 — Sticky Filter Bar**

A sticky bar (offset computed by `stickyTop`) shall display five quick filter buttons:
- **All** — resets all filter state variables, sets `activeQuickFilter` to `'all'`
- **High risk** — sets `healthFilter` to `'critical'`, opens flow panel
- **Blocked** — sets `reasonFilter` to `'block'`, opens flow panel
- **Needs review** — sets `statusFilter` to `'in progress'`, opens flow panel
- **Sprint today** — sets `reasonFilter` to `'today'`, opens flow panel

Plus a **Clear** button (resets all filters, shows "Filters cleared" message), a **Show filters** button (calls `openFlowFilters()` which opens the flow panel and scrolls to the filter inputs), and a **Help** button (calls `onOpenHelp('quickFilters')`).

The bar shall be hidden (`hideStickyFilter = true`) when the flow panel filter section is visible in the viewport.

**FR-033 — SmartActions**

The SmartActions sub-component shall render up to 6 prioritised recommendation cards generated from the `smartActions` useMemo. Each card shall display a title, description, a severity badge, and a deep-link button that applies specific filter combinations and scrolls to the relevant section. Card generation logic is defined in FR-060 through FR-065.

**FR-034 — #section-attention — Attention Cards**

Three highlight cards shall display:
1. **Top blockers** — the top 3 issues where `isBlocked == true`, showing Issue Key, Summary, and health badge.
2. **Overdue items** — the top 3 issues where `isOverdue == true`, showing days overdue.
3. **Orphan items** — the top 3 issues where `isOrphan == true` (no Epic Link and no Parent Key).

Each card shall include a HelpButton calling `onOpenHelp('attention')`.

**FR-035 — #section-overview — KPI Grid**

Six `KpiCard` components shall be rendered displaying the following metrics:

| KPI | Metric Source | Click Action |
|---|---|---|
| Completion % | `completionRate` | Scroll to `#flow-health-panel` |
| Health Alerts | `flow.critical + flow.warning` | Scroll to `#flow-health-panel` |
| Active Work | `activeIssues` | Scroll to `#capacity-section` |
| Lead Time | `flow.averageLeadTimeDays` | Scroll to `#flow-health-panel` |
| Cycle Time | `flow.averageCycleTimeDays` | Scroll to `#flow-health-panel` |
| Story Points | `storyPoints.pointCompletionRate` | Scroll to `#capacity-section` |

Each KpiCard shall render a threshold track visualising the metric relative to healthy/warning/critical thresholds.

**FR-036 — #section-visuals — Visual Intelligence**

The visuals section shall render six chart sub-components:
1. `HealthDonut` — donut chart of good/warning/critical issue counts
2. `QuarterChart` — bar chart of throughput across quarters
3. **Work State Distribution** — `WorkStateChart` showing issue distribution across workflow states
4. **Kanban Distribution** — `StatusGraph` visualising volume per kanban column
5. `SprintCompareChart` — sprint-over-sprint velocity comparison
6. **Orphan Items** — count and visual indicator of orphan issues

**FR-037 — #section-ratios — Delivery Composition**

The `DeliveryCircle` sub-component shall render a single SVG ring classifying every issue into exactly one of five mutually exclusive segments using the following priority order (no double-counting):
1. **Done** — `isDone(issue)` is true
2. **Critical** — `health === 'critical'` AND not done
3. **At Risk** — `health === 'warning'` AND not done
4. **In Progress** — `isActive(issue)` AND no health concern
5. **Backlog** — all remaining issues

Each segment shall display its label, count, and percentage. The ring shall be interactive, highlighting segments on hover.

**FR-038 — #section-delivery-controls — Delivery Controls**

Three control panels shall be displayed:
1. **Flow Efficiency** — `(cycleTimeDays / leadTimeDays) × 100` expressed as a percentage; visualised as a bar.
2. **Story Point Delivery** — `storyPoints.pointCompletionRate` with completed vs. remaining point counts.
3. **Risk Readout** — displays `risk.blockedIssues`, `risk.overdueIssues`, `risk.highPriorityOpenIssues`, and `risk.openDefects`.

**FR-039 — #section-quarters — Quarter Statistics**

A table shall display one row per quarter with columns: Quarter label, Total Issues, Done Issues, Completion Rate, Active Issues, Average Lead Time, Average Cycle Time, Story Points, and top statuses. Quarters shall be sorted descending (most recent first); `'No date'` shall appear last.

**FR-040 — #section-kanban — Kanban Status Health**

A `DistributionDonut` chart shall show volume by workflow status. A `CompactBarChart` shall show health counts (good/warning/critical) per status. A `MetricTable` shall display: Status name, total count, done count, warning count, critical count, average lead time, and average cycle time. Data sourced from `kanban.byStatus`.

**FR-041 — #section-sprint — Sprint Status**

A `DistributionDonut` shall show points per sprint. A `MetricTable` shall display per sprint: Sprint name, total issues, completed issues, completion rate, committed points, completed points, and point completion rate. Data sourced from `sprint.sprints` (top 8 by completed points).

**FR-042 — #section-ownership — Capacity and Epic Performance**

Two sub-sections:
1. **Capacity By Assignee** (id: `#capacity-section`) — `MetricTable` showing per assignee: name, total issues, active issues, done issues, story points, done story points, load share %. Data sourced from `capacity` (top 10).
2. **Epic / Parent Performance** — `MetricTable` showing per epic/parent: key, issue count, done count, progress %, point progress %. Data sourced from `epics` (top 10).

**FR-043 — #section-labels — Labels and Classification**

Up to five sub-sections:
1. **Label Distribution** — bar chart of top 15 labels by issue count.
2. **Issue Type Breakdown** — `DistributionDonut` from `types`.
3. **Label Health & Completion** — `MetricTable` showing per label: count, done, completion rate, warning, critical. Data sourced from `labels.labelStats`.
4. **Parent Key Breakdown** — `MetricTable` from `parents` (top 12), shown only if parent data is present.
5. **Project Breakdown** — `MetricTable` from `projects`, shown only if project data is present.

**FR-044 — #section-relations — Relations**

Three panels:
1. **Link Type Distribution** — chart of `relations.linkTypes` by count.
2. **Most Connected Items** — table of `relations.mostLinked` (top 10) showing issue key, summary, total link count.
3. **Items Explicitly Blocked** — table of `relations.blockedItems` (top 10) showing blocker relationship details.

Entire section hidden when `relations.hasLinks === false`.

**FR-045 — Justification Panel**

A plain-language delivery narrative panel (class `panel-justification`) shall display the `insights` array as styled paragraph text. No anchor id; positioned between Relations and Readiness sections.

**FR-046 — #section-readiness — Readiness**

Two sub-sections:
1. **Top at-risk epics** — list of epics from `epicReadiness` where `risk === 'critical'` or `risk === 'warning'`, showing epic key, progress %, health breakdown, and a "View items" button that opens the Detail modal populated with that epic's flow items.
2. **Dependency callouts** — items from `relations.blockedItems` with callout formatting.

**FR-047 — Detail Modal**

A modal panel (driven by `detailPanel` state) shall display a list of issues with per-issue fields: Issue Key, Summary, Status, Health badge, Assignee, and Reason. Each item shall offer:
- An **Open** button linking to `item.url` or `item.jiraUrl` in a new browser tab (only rendered if the URL is present).
- A **Copy** button copying the issue key/id/summary to the clipboard via `navigator.clipboard`.

The modal shall close on: clicking the close button, clicking the backdrop, or pressing the Escape key.

**FR-048 — #flow-health-panel — Story / Task Flow Health**

A collapsible full-table panel (toggled by `isFlowPanelOpen`) shall render all `filteredFlowItems` with the following columns: Issue Key, Summary, Status, Sprint, Assignee, Lead Time (days), Cycle Time (days), Age (days), Health badge, Reason, Labels, Linked-to issues. The table shall paginate at 100 rows (`flowItemVisibleCount`) with a "Show N more" button to load the next 100. Orphan items shall receive a visual highlight (distinct row class). The full filter form (11 filters) and a Reset button shall be displayed above the table.

---

### 4.4 Navigation

**FR-050 — Floating Section Navigator (SectionNav)**

The `SectionNav` component shall render 14 colour-coded dot buttons on the right edge of the viewport. An `IntersectionObserver` shall track which section is currently visible and highlight the corresponding dot. Clicking any dot shall smooth-scroll to the corresponding section. The 14 sections and their anchor targets are:

| # | Label | Target |
|---|---|---|
| 1 | Summary | `#dashboard-summary` |
| 2 | Attention | `#section-attention` |
| 3 | Overview | `#section-overview` |
| 4 | Visuals | `#section-visuals` |
| 5 | Ratios | `#section-ratios` |
| 6 | Delivery Controls | `#section-delivery-controls` |
| 7 | Quarters | `#section-quarters` |
| 8 | Kanban | `#section-kanban` |
| 9 | Sprint | `#section-sprint` |
| 10 | Ownership | `#section-ownership` |
| 11 | Labels | `#section-labels` |
| 12 | Relations | `#section-relations` |
| 13 | Readiness | `#section-readiness` |
| 14 | Flow Health | `#flow-health-panel` |

**FR-051 — Scroll-to-Top FAB**

The `ScrollToTopFab` component shall render a floating action button that becomes visible when `window.scrollY > 400`. Clicking it shall scroll the page to the top. The button shall be positioned at the bottom-right of the viewport.

**FR-052 — Deep-link Navigation from Manager Report**

The Manager Report modal shall include "Details →" links for 7 report rows. Each link shall close the modal and navigate (smooth scroll) to the corresponding section:

| Report Row | Navigation Target |
|---|---|
| Risk Indicators | closes modal, sets `healthFilter='critical'`, opens flow panel, scrolls to `#flow-health-panel` |
| Sprint Status | closes modal, scrolls to `#section-sprint` |
| Epic Readiness | closes modal, scrolls to `#section-readiness` |
| Capacity | closes modal, scrolls to `#capacity-section` |
| Labels | closes modal, scrolls to `#section-labels` |
| Issue Relations | closes modal, scrolls to `#section-relations` |
| Key Insights | closes modal, scrolls to `#section-overview` |

---

### 4.5 Manager Quick Overview Report

**FR-053 — Manager Report Content**

The `ManagerReport` sub-component shall render a modal containing:

1. A **health banner** displaying the health score, score band label, and a colour-coded status indicator (green/yellow/orange/red corresponding to Excellent/Good/Moderate/At Risk/Critical bands).
2. An **8-cell snapshot grid** displaying: Total Issues, Done Issues, Completion Rate, Active Issues, Blocked Issues, Open Defects, Average Lead Time, Average Cycle Time.
3. Seven report rows, each with a metric label, value, and a "Details →" deep-link button:
   - Risk Indicators: critical count, warning count
   - Sprint Status: latest sprint completion rate, sprint count
   - Epic Readiness: at-risk epic count
   - Capacity: top assignee name and load share %
   - Labels: unique label count, total labelled
   - Issue Relations: total links, items with links
   - Key Insights: first insight string from `insights` array

**FR-054 — Manager Report Print Mode**

The report modal shall include a **Print report** button calling `window.print()`. Global print styles in `styles.css` shall hide all interactive elements (nav bars, buttons, filter panels) and render the report in a clean single-column layout suitable for PDF or paper output.

**FR-055 — Manager Report Actions**

The modal shall provide: a **Close** button in the header, backdrop click to close, and a **Back to dashboard** button at the footer. All close actions shall set `showManagerReport` to `false`.

---

### 4.6 Smart Recommendations

The `smartActions` useMemo shall generate up to 6 recommendation cards. Cards shall be generated in the following priority order; only cards with at least one qualifying issue shall be included:

**FR-060 — Blocked Critical Items**

Trigger: flow items where `health === 'critical'` AND `reason` includes the substring `'block'`. Card action: sets `healthFilter` to `'critical'`, sets `reasonFilter` to `'block'`, opens flow panel, scrolls to `#flow-health-panel`.

**FR-061 — Stale Active Work**

Trigger: flow items where `isActive` is true AND `activeAgeDays > 14`. Card action: opens flow panel, scrolls to `#flow-health-panel` with status filter set to active statuses.

**FR-062 — Capacity Imbalance**

Trigger: any assignee in `data.capacity` where `loadShare > 35` (i.e., one person holds more than 35% of total issues). Card action: scrolls to `#capacity-section`.

**FR-063 — Orphan Items**

Trigger: flow items where `isOrphan === true`. Card action: opens flow panel with a filter that shows only orphans.

**FR-064 — Critical Epics**

Trigger: epics from `epicReadiness` where `risk === 'critical'`. Card action: scrolls to `#section-readiness`.

**FR-065 — Explicitly Blocked by Link**

Trigger: items in `data.relations.blockedItems` (inward blocking links). Card action: scrolls to `#section-relations`.

---

### 4.7 Help Guide

**FR-066 — Help Guide Structure**

The `HelpGuide` component shall render a modal overlay containing an interactive help guide with 17 named sections. Each section consists of an animated journey of 4–6 steps. The active section is controlled by the `helpSection` prop passed from `App.js` (via `onOpenHelp(sectionName)`).

The 17 section names that can be passed as `activeSection` / `helpSection` are: `welcome`, `summary`, `quickFilters`, `attention`, `kpis`, `visuals`, `kanban`, `sprint`, `ownership`, `labels`, `relations`, `readiness`, `justification`, `flow`, `delivery`, `quarters`, `ratios`.

**FR-067 — Help Guide Navigation**

The guide shall support keyboard navigation: the left and right arrow keys shall move between steps within the active section. A close button and the Escape key shall dismiss the guide (`onClose()`). Section tabs or links shall be provided to switch between the 17 sections.

**FR-068 — Help Trigger Points**

Help buttons (`HelpButton` sub-component) shall be rendered adjacent to each section header and panel title throughout the dashboard. Each button shall call `onOpenHelp(topic)` with the topic string corresponding to its section. The following topics are registered as HelpButton call sites: `summary`, `quickFilters`, `attention` (×3 cards), `kpis`, `visuals` (×4 sub-panels), `kanban` (×3), `sprint` (×2), `ownership` (×5), `labels` (×5), `relations` (×4), `readiness` (×3), `justification`, `flow`, `delivery` (×4), `quarters`, `ratios`.

---

### 4.8 Flow Table

**FR-069 — Flow Table Filters**

The `#flow-health-panel` filter form shall provide 11 independent filter inputs. All 11 shall be applied simultaneously via the `filteredFlowItems` useMemo. Filter logic per field:

| Filter Variable | Input Type | Logic |
|---|---|---|
| `keyFilter` | Text | Case-insensitive substring match against `issue['Issue Key']` |
| `summaryFilter` | Text | Case-insensitive substring match against `issue['Summary']` |
| `statusFilter` | Select | Exact match against `issue['Status']`; `'all'` disables filter |
| `sprintFilter` | Select | Exact match against `getSprintName(issue)`; `'all'` disables filter |
| `assigneeFilter` | Select | Exact match against `issue['Assignee']`; `'all'` disables filter |
| `leadMaxFilter` | Number | Include only items where `leadTimeDays <= value`; empty disables filter |
| `cycleMaxFilter` | Number | Include only items where `cycleTimeDays <= value`; empty disables filter |
| `openAgeMaxFilter` | Number | Include only items where `ageDays <= value`; empty disables filter |
| `healthFilter` | Select | Exact match against `health`; `'all'` disables filter |
| `reasonFilter` | Text | Case-insensitive substring match against any string in `reason` array |
| `labelFilter` | Text | Case-insensitive substring match against any string in parsed labels |

The select options for `statusFilter`, `sprintFilter`, `assigneeFilter`, and `healthFilter` shall be derived from `statusOptions`, `sprintOptions`, `assigneeOptions`, and `healthOptions` useMemos respectively (each computed from `flowItems`).

**FR-070 — Flow Table Pagination**

The flow table shall initially render the first 100 items (`flowItemVisibleCount = 100`). A "Show N more" button shall be displayed when `filteredFlowItems.length > flowItemVisibleCount`. Clicking it shall increment `flowItemVisibleCount` by 100. The counter shall reset when any filter changes.

**FR-071 — Flow Table Reset**

A **Reset** button shall clear all 11 filter variables to their initial values and set `activeQuickFilter` to `'all'`.

**FR-072 — Orphan Highlighting**

Flow table rows where `isOrphan === true` shall receive a distinct CSS class (e.g., `row-orphan`) resulting in a visual distinction (e.g., muted background or border indicator) to flag items with no parent or epic.

---

### 4.9 Import Logs

**FR-073 — Import Log Structure**

Every upload attempt (successful or failed after validation) shall produce an import log entry appended to `backend/data/import-logs.json`. Each entry shall have the following structure:

```json
{
  "id": "<timestamp-ms>-<random-6-char>",
  "importedAt": "<ISO 8601 UTC timestamp>",
  "status": "success" | "error",
  "file": {
    "name": "<original filename>",
    "sizeBytes": <integer>,
    "mimetype": "<MIME type string>"
  },
  "extraction": {
    "sheetName": "<first sheet name>",
    "rowCount": <integer>,
    "columnCount": <integer>,
    "headers": ["<header1>", ...],
    "missingOptionalWarnings": ["<warning string>", ...],
    "validationErrors": ["<error string>", ...],
    "error": "<error message or empty string>"
  },
  "statistics": {
    "totalIssues": <integer>,
    "doneIssues": <integer>,
    "activeIssues": <integer>,
    "completionRate": <integer>,
    "averageLeadTimeDays": <float>,
    "averageCycleTimeDays": <float>,
    "criticalItems": <integer>,
    "warningItems": <integer>,
    "statusBreakdown": [...]
  }
}
```

**FR-074 — GET /api/upload/logs**

The endpoint shall return the full `import-logs.json` content as a JSON array, sorted from most recent to oldest.

**FR-075 — GET /api/upload/logs/view**

The endpoint shall return an HTML page (generated by `renderBackendHome()`) displaying all past imports in a human-readable tabular format with file details, column statistics, row counts, and quick links to the health check endpoint and frontend.

**FR-076 — GET /api/upload/logs/export**

The endpoint shall return an `.xlsx` attachment (`Content-Disposition: attachment; filename="import-logs.xlsx"`) containing the full import history serialised as an Excel spreadsheet using the `xlsx` library.

---

### 4.10 Theme and Accessibility

**FR-077 — Dark Mode**

The application shall detect the user's OS colour scheme preference via `window.matchMedia('(prefers-color-scheme: dark)')` on initial load and set `theme` to `'dark'` or `'light'` accordingly. The theme state shall update automatically when the OS preference changes (via `mq.addEventListener('change', handler)`). A manual toggle button shall switch between modes. The active theme shall be applied as the CSS class `dark` or `light` on the root `.app.shell` element. All colour tokens shall use CSS custom properties, with `.dark` class overrides defined in `styles.css`.

**FR-078 — Print Mode**

Print styles in `styles.css` shall activate on `@media print`. Interactive elements hidden in print mode include: the sticky filter bar, SectionNav, ScrollToTopFab, all HelpButton elements, action buttons, and the help guide modal. The Manager Report modal content shall be the primary printable artefact.

**FR-079 — Mobile Responsiveness**

The dashboard shall function on screen widths down to 375 px. CSS media queries shall reflow multi-column grids to single-column stacks at appropriate breakpoints. iOS safe-area insets (`env(safe-area-inset-*)`) shall be applied to modals. Touch targets shall meet a minimum size of 44 × 44 px.

**FR-080 — Keyboard Navigation**

All modals (Detail Modal, Manager Report, Help Guide) shall be keyboard-dismissible via the Escape key. The Help Guide shall support left/right arrow key navigation between steps. All interactive elements shall be reachable via Tab key traversal.

---

## 5. Non-Functional Requirements

### 5.1 Performance

**NFR-001** — `calculateDashboardMetrics(issues)` shall complete in under 200 ms for datasets of up to 1,000 issues on a machine with a modern single-core capable of at least 1 GHz compute throughput.

**NFR-002** — The frontend shall complete initial dashboard render (from receiving the API response to first interactive paint) in under 2 seconds on a machine with at least 8 GB RAM and a modern browser.

**NFR-003** — The 11-filter `filteredFlowItems` useMemo shall recompute in under 100 ms for datasets of 3,500 issues.

**NFR-004** — File upload and full response (parse + validate + metrics) shall complete in under 5 seconds for a 20 MB file on a machine with a modern CPU.

### 5.2 Security

**NFR-005** — The upload endpoint shall enforce a rate limit of 20 requests per 15-minute window per source IP. Response status shall be 429 with the standard `RateLimit-*` headers.

**NFR-006** — CORS shall be restricted to the origin(s) specified in `ALLOWED_ORIGIN`. In production deployments, `ALLOWED_ORIGIN` must be set to a specific origin string; the default "all origins" mode shall only be used in development.

**NFR-007** — The system shall validate file type by extension (`.csv`, `.xlsx`, `.xls`) in the multer `fileFilter` and reject all other types with HTTP 400. MIME type is not relied upon as the sole validation because MIME types can be spoofed.

**NFR-008** — No uploaded file content shall be written to disk; all processing shall occur in RAM via multer `memoryStorage`. Files are implicitly discarded when the request handler returns.

**NFR-009** — The React client bundle shall contain no API keys, credentials, or secrets. All sensitive configuration shall remain in backend environment variables loaded via `dotenv`.

**NFR-010** — The `express.json()` body parser shall be applied globally; the upload route shall use `multer` for multipart processing. No unauthenticated endpoint shall accept arbitrary JSON payloads that could be used for injection attacks.

**NFR-011** — The backend control center at `GET /` is unauthenticated. In multi-user or internet-facing deployments, access to port 4000 must be restricted at the network/proxy layer.

### 5.3 Usability

**NFR-012** — All touch targets in the mobile layout shall have a minimum tap area of 44 × 44 CSS pixels in compliance with WCAG 2.1 Success Criterion 2.5.5.

**NFR-013** — The application shall be operable on screen widths from 375 px (iPhone SE viewport) to full 4K desktop without horizontal scrolling.

**NFR-014** — Colour shall not be the sole means of conveying health status; each health badge shall also include a text label (`good` / `warning` / `critical`).

**NFR-015** — All modals shall trap focus within the modal while open and restore focus to the triggering element when closed.

**NFR-016** — The interactive Help Guide shall require no prior Delivery Clarity experience; each journey shall be self-contained and explain both what a metric means and how to act on it.

### 5.4 Reliability

**NFR-017** — When a Jira export is missing optional fields, the system shall degrade gracefully: sections dependent on absent data shall display a "no data available" placeholder rather than crashing.

**NFR-018** — `parseDate(value)` shall handle Excel serial numbers (range 20,000–80,000), Jira-style dates (`01/Jan/25`), ISO dates (`YYYY-MM-DD`), and numeric dates (`MM/DD/YY`) without throwing. Invalid dates shall return `null`.

**NFR-019** — `daysBetween(start, end)` shall return `null` (not throw) when either date is null or when the computed duration exceeds 3,650 days (a sanity cap against corrupt date fields).

**NFR-020** — The frontend shall not crash when `metrics.relations.hasLinks === false`; the Relations section shall be hidden in this case.

**NFR-021** — React error boundaries are not currently implemented in the codebase; this is a known gap. Any unhandled React render error will result in a blank screen. Error boundary implementation is a recommended future improvement.

### 5.5 Maintainability

**NFR-022** — `metrics.js` shall remain the single authoritative source for all metric computation logic. No metric calculation shall be duplicated in the frontend.

**NFR-023** — `DashboardPage.js` is currently a monolithic ~2,150-line file. Future refactoring shall extract each dashboard section into a dedicated component file. This is tracked as a roadmap item.

**NFR-024** — All environment-specific configuration shall be managed via `.env` files with corresponding `.env.example` templates checked into version control.

**NFR-025** — Unit tests for `calculateDashboardMetrics` shall be maintained in `backend/tests/metrics.test.js`. The test suite shall be runnable with `node --test` (Node.js native test runner, no external test framework required).

### 5.6 Compatibility

**NFR-026** — The backend shall require Node.js >= 18 (native `node --test` runner is used; `express` v4.18.2 requires Node >= 12 but `node --test` is Node 18+).

**NFR-027** — The frontend shall target the last 2 major versions of Chrome, Firefox, Safari, and Edge in production builds (CRA browserslist `>0.2%`, not dead, not op_mini all).

**NFR-028** — The system shall accept Jira exports from both Jira Cloud and Jira Server/Data Center, handling the column name variations via FIELD_ALIASES.

---

## 6. Data Requirements

### 6.1 Input Data Model — Jira Issue Fields

Each row in the upload file represents one Jira issue. After normalisation, the following canonical field names may be present (all are optional except the four ESSENTIAL_FIELDS):

| Canonical Field | Type | Description |
|---|---|---|
| `Issue Key` | String | ESSENTIAL. Unique Jira issue identifier (e.g., `PROJ-123`) |
| `Issue Type` | String | ESSENTIAL. Story, Task, Bug, Epic, Sub-task, Defect, etc. |
| `Summary` | String | ESSENTIAL. One-line issue title |
| `Status` | String | ESSENTIAL. Current workflow status |
| `Epic Link` | String | Epic key this issue belongs to |
| `Parent Key` | String | Parent issue key (next-gen Jira) |
| `Project` | String | Project name or key |
| `Component` | String | Component assignment |
| `Team` | String | Team name |
| `Assignee` | String | Assigned user display name |
| `Reporter` | String | Reporter display name |
| `High Level Status` | String | Status category (e.g., In Progress, Done) |
| `Priority` | String | Highest, High, Medium, Low, Lowest, Critical |
| `Risk Level` | String | Custom risk level field |
| `Risk Description` | String | Free-text risk description |
| `Labels` | String | Comma/semicolon/pipe-separated label list |
| `Fix Version/s` | String | Target release version |
| `Sprint` | String | Sprint name |
| `Sprint Goal` | String | Sprint goal text |
| `Story Points` | Numeric | Effort estimate |
| `Original Estimate` | Numeric | Original time estimate |
| `Time Spent` | Numeric | Logged time |
| `Remaining Estimate` | Numeric | Remaining logged time |
| `Created Date` | Date | Issue creation timestamp |
| `Updated Date` | Date | Last updated timestamp |
| `Sprint Start` | Date | Sprint start date |
| `Sprint End` | Date | Sprint end date |
| `In Progress Date` | Date | Date work began |
| `Code Review Date` | Date | Date code review started |
| `QA Start Date` | Date | Date QA started |
| `Done Date` | Date | Date issue was resolved/closed |
| `Due Date` | Date | Target completion date |
| `Resolution` | String | Resolution type |
| `Resolution Date` | Date | Date resolution was set |
| `Reopened Count` | Numeric | Number of times issue was reopened |
| `Blocked Flag` | Boolean | True if issue is blocked |
| `Blocker Reason` | String | Description of the blocker |
| `Commitment Type` | String | Committed / Stretch / Carryover |
| `Added After Sprint Start` | Boolean | True if added mid-sprint |
| `Scope Change Type` | String | Scope change classification |
| `QA Pass` | Boolean | QA sign-off flag |
| `UAT Status` | String | UAT outcome |
| `Defects Count` | Numeric | Count of associated defects |
| `Customer Visible` | Boolean (string) | `'true'` / `'false'` |
| `Release Ready` | Boolean | Release readiness flag |
| `Acceptance Criteria Ready` | Boolean | AC completeness flag |
| `Definition of Ready Met` | Boolean | DoR flag |
| `Definition of Done Met` | Boolean | DoD flag |
| `Business Value` | Numeric | Business value score |
| `Effort Confidence` | Numeric | Confidence in estimate (1–5) |
| `Planned Sprint` | String | Originally planned sprint |
| `Actual Sprint` | String | Sprint in which work was completed |
| `Dependencies` | String | Free-text dependency description |
| `Stakeholder Owner` | String | Business stakeholder name |
| `Requirement Stability` | String | Stability rating |
| `Risk Score` | Numeric | Calculated risk score |
| `Last Comment` | String | Most recent comment text |
| `Issue URL` | String | Direct URL to the Jira issue |
| `Inward issue link (Blocks)` | String | Issue key(s) this issue blocks |
| `Outward issue link (Blocks)` | String | Issue key(s) blocking this issue |
| `Inward issue link (Relates)` | String | Related issue key(s) |
| `Outward issue link (Relates)` | String | Related issue key(s) |
| `Inward issue link (Duplicate)` | String | Duplicate issue key(s) |
| `Outward issue link (Duplicate)` | String | Duplicate issue key(s) |

### 6.2 Output Metrics Model — calculateDashboardMetrics Return Keys

The full metrics object returned by `calculateDashboardMetrics(issues)` has the following top-level keys:

| Key | Type | Description |
|---|---|---|
| `totalIssues` | Integer | Total count of all issues |
| `doneIssues` | Integer | Count of done issues (`isDone`) |
| `activeIssues` | Integer | Count of in-progress issues (`isActive`) |
| `blockedIssues` | Integer | From `risk.blockedIssues` |
| `openDefects` | Integer | From `risk.openDefects` |
| `completionRate` | Integer | `round(doneIssues / totalIssues × 100)` |
| `customerVisibleProgress` | Integer | % of customer-visible issues that are done |
| `overallDeliveryConfidence` | Float | Average `Effort Confidence` across issues with that field |
| `totalCustomerVisible` | Integer | Count where `Customer Visible == 'true'` |
| `flow` | Object | `{ issues, done, good, warning, critical, averageLeadTimeDays, averageCycleTimeDays, leadTimeSampleSize, cycleTimeSampleSize, items[] }` |
| `sprint` | Object | `{ hasSprintData, sprintCount, sprints[] }` |
| `kanban` | Object | `{ byStatus: [], byHighLevelStatus: [] }` |
| `quarters` | Array | Per-quarter metric objects, most recent first |
| `capacity` | Array | Top 10 assignee metric objects |
| `epics` | Array | Top 10 epic metric objects |
| `labels` | Object | `{ labelStats[], totalLabeled, totalUnlabeled, uniqueLabels }` |
| `types` | Array | Per issue type metric objects |
| `projects` | Array | Per project metric objects |
| `parents` | Array | Top 12 parent key metric objects |
| `relations` | Object | `{ hasLinks, totalLinks, itemsWithLinks, linkTypes[], linkStats, mostLinked[], blockedItems[] }` |
| `risk` | Object | `{ blockedIssues, overdueIssues, highPriorityOpenIssues, openDefects }` |
| `storyPoints` | Object | `{ totalStoryPoints, completedStoryPoints, remainingStoryPoints, pointCompletionRate }` |
| `healthScore` | Integer | 0–100 from `calculateHealthScore` |
| `prediction` | Object | `{ complete, daysRemaining, predictedDate?, velocityPerDay? }` |
| `insights` | Array | Up to 5 human-readable insight strings |

### 6.3 Import Log Schema

The `backend/data/import-logs.json` file is a JSON array of import log entry objects. The schema for each entry is defined in FR-073. The file is appended to (never overwritten entirely) after each upload. A log entry is written for both successful and failed (validation error) uploads. Uploads that fail before reaching the validation stage (multer errors, unsupported format) do not produce a log entry.

### 6.4 Data Persistence Strategy

The system is intentionally stateless with respect to dashboard data:

- **Upload file bytes**: never persisted; held in RAM via `multer memoryStorage`, discarded after response.
- **Computed metrics**: never persisted; recomputed on every upload.
- **Dashboard state**: held in React `useState`; cleared on browser refresh or when `onReset()` is called.
- **Filter state**: optionally saved to `localStorage` via the "Save layout view" button. The key and structure are implementation-defined.
- **Import logs**: persisted in `backend/data/import-logs.json` as a flat JSON array; this is the only durable store.

---

## 7. External Interface Requirements

### 7.1 User Interface

The primary user interface is a browser-based single-page application. It consists of:

1. **Upload Page** (`UploadPage.js`) — a file drop/select form with upload instructions, accepted format list, and a maximum size indicator.
2. **Dashboard Page** (`DashboardPage.js`) — a scrollable long-form analytics dashboard with 14 anchor sections, a floating section navigator, and all interactive modals.
3. **App header** (`App.js`) — persistent application title, Help button, and dark/light mode toggle.
4. **App footer** (`App.js`) — copyright notice and author contact.

All UI state is managed in React. There is no client-side routing; navigation is entirely scroll-based using anchor IDs and `element.scrollIntoView({ behavior: 'smooth' })`.

### 7.2 Hardware Interfaces

The system has no direct hardware dependencies. It requires:
- A machine capable of running Node.js >= 18 (backend)
- A machine with a modern web browser (frontend)
- Network connectivity between the browser and the backend (localhost by default; LAN or VPN in team deployments)

### 7.3 Software Interfaces — Jira CSV/XLSX Format

The system interfaces with Jira exclusively through its file export feature. Jira exports are produced by:
- **Jira Cloud**: Board or Backlog view → Export → Excel (current fields) or Export → CSV
- **Jira Server/Data Center**: Issue Navigator → Export → Excel or CSV

The `xlsx` library (SheetJS Community Edition v0.18.5) reads both `.xlsx` (OOXML) and `.xls` (BIFF8) workbooks, and `.csv` files. The first worksheet of any workbook is used. The first row must be the header row.

Jira exports are not schema-stable; column names vary across Jira versions, configurations, and plugins. The FIELD_ALIASES mechanism (FR-003) handles the 32 most common variants.

### 7.4 Communication Interfaces — HTTP/REST

The frontend communicates with the backend exclusively over HTTP. In development, the backend is at `http://localhost:4000`; the base URL is configurable via `REACT_APP_API_BASE` environment variable. All API calls originate from `frontend/src/services/api.js`.

The upload call is `multipart/form-data`. All other calls are `GET` with no request body. Responses are `application/json` except for `GET /api/upload/logs/view` (HTML) and `GET /api/upload/logs/export` (binary XLSX).

---

## 8. API Specification

> **Scope note (added 2026-06-08 to close TRACE-02/COVER-03):** The five endpoints documented immediately below (`POST /api/upload`, `GET /api/upload/logs`, `GET /api/upload/logs/view`, `GET /api/upload/logs/export`, `GET /api/health`, `GET /`) describe the **legacy standalone Express backend** in `backend/src/index.js` and `backend/src/routes/upload.js` (the pre-v3.0 service, still present in the repo for reference/migration history). They are a **different, smaller API surface** from the live product's Next.js route handlers under `app/api/**/route.ts`. **Section 8.1 below is the authoritative inventory of the live product's 36 Next.js API routes** — the ones the deployed app, its pages, and its test suite actually call.

### POST /api/upload

Uploads a Jira export file for analysis.

**Middleware applied:** `uploadLimiter` (rate limiter), `multer.single('file')` (file handling)

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Accepted extensions: `.csv`, `.xlsx`, `.xls`
- Maximum size: 20 MB

**Success Response — HTTP 200:**
```json
{
  "metrics": { /* full calculateDashboardMetrics return object */ },
  "issues": [ /* array of parsed issue objects */ ],
  "warnings": [ /* array of warning strings */ ],
  "importLog": { /* import log entry as defined in FR-073 */ }
}
```

**Error Responses:**

| Status | Trigger | Response Body |
|---|---|---|
| 400 | Unsupported file extension | `{ "error": "Unsupported file type '<ext>'. Upload a .csv, .xlsx, or .xls Jira export." }` |
| 400 | No file field in request | `{ "error": "No file uploaded. Please upload a Jira Excel or CSV export." }` |
| 413 | File exceeds 20 MB | `{ "error": "File exceeds the 20 MB size limit. Export a smaller date range or reduce the number of columns." }` |
| 422 | Missing essential fields | `{ "error": "Validation failed", "details": ["<field>", ...], "importLog": { ... } }` |
| 429 | Rate limit exceeded | `{ "error": "Too many uploads from this IP. Please wait 15 minutes before trying again." }` |
| 500 | Unhandled parse/metrics exception | `{ "error": "Unable to process Jira export file." }` |

**Rate Limit Headers (on all responses when limit is active):**
- `RateLimit-Limit: 20`
- `RateLimit-Remaining: <n>`
- `RateLimit-Reset: <timestamp>`

---

### GET /api/upload/logs

Returns the full import history.

**No middleware beyond CORS.**

**Response — HTTP 200:**
```json
[ /* array of import log entry objects, most recent first */ ]
```

---

### GET /api/upload/logs/view

Returns an HTML page with import history for browser viewing.

**Response — HTTP 200, Content-Type: text/html**

HTML rendered by `renderBackendHome()` in `backendView.js`. Displays: all past imports in a table with file name, import timestamp, status, row count, column count, and column statistics.

---

### GET /api/upload/logs/export

Returns import history as an Excel file download.

**Response — HTTP 200:**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="import-logs.xlsx"`
- Body: binary XLSX workbook generated by the `xlsx` library

---

### GET /api/health

Returns the service health status.

**Response — HTTP 200:**
```json
{
  "status": "ok",
  "service": "delivery-clarity-backend",
  "version": "1.0.0"
}
```

---

### GET /

Returns the backend control center HTML page.

**Response — HTTP 200, Content-Type: text/html**

Rendered by `renderBackendHome()`. Provides: import history table, file statistics, links to health check, and a link to the frontend.

---

### 8.1 — Next.js Application API Route Inventory (v3.0+, produced 2026-06-08 to close TRACE-02 / Gaps-Summary COVER-03)

This table is the consolidated inventory of all 44 live `app/api/**/route.ts` route handlers — the API surface the deployed product, its pages, and its automated test suite actually exercise (distinct from the legacy backend documented in §8 above). **Auth** reflects the actual `getIronSession`/`session.role` checks read from each handler. **FR ref** cites the existing functional requirement that already documents the route's behaviour in narrative form, where one exists; routes with no FR ref are documented only here and via their consuming page's FR/UC (cited in the Notes column) — `app/api/backend-view/route.ts` itself maintains a partial live `ENDPOINTS` registry that this table supersedes as the authoritative cross-reference.

| Method(s) | Path | Auth | Purpose | FR ref | Notes |
|---|---|---|---|---|---|
| POST | `/api/upload` | Authenticated, rate-limited (`uploadLimiter`) | Parse a Jira CSV/XLSX export and compute dashboard metrics | FR-001, FR-074 | Full request/response/error contract specified in §8 `POST /api/upload` (mirrors the legacy spec; this is the live route) |
| POST | `/api/upload/merge` | No additional session check at the handler (mirrors the page-level guard) | Merge up to 10 Jira exports by Issue Key into one unified `DashboardMetrics` | — | Consumed by the multi-file merge upload flow (COVER-06); 20 MB/file, 10-file caps enforced in-handler |
| GET | `/api/imports` | Authenticated | List import logs (own by default; `?all=true` returns all users' logs for `admin`/`manager`/`c_level`) | FR-233 | — |
| DELETE | `/api/imports/[id]` | Authenticated (own log, or any log if `admin`) | Delete a single import log | — | Backs the `/admin/logs` and `/backend` log-management UI |
| DELETE | `/api/imports/all` | Authenticated (own logs, or all logs if `admin`) | Bulk-delete import logs | — | — |
| GET | `/api/metrics` | Public | Return computed KPI metrics from the latest successful import | — | Legacy/simple metrics accessor; superseded for dashboard loading by `/api/metrics/latest` |
| GET | `/api/metrics/latest` | Public | Bucket-backed latest-metrics + `localStorage` fallback contract (`{ available, metrics, source, provider, key }`) | FR-309 | Full contract specified in FR-309 (written 2026-06-08 to resolve the `UC-083` phantom reference — see Gaps Summary item 6) |
| GET | `/api/dashboard` | Public | Return service status + metadata (`{ status, service, version }`) | — | Lightweight health/identity probe, distinct from the `/dashboard` page |
| GET | `/api/health` | Public | Health check — confirms the API service is running | AC-041 (legacy spec) | The live route returns the same `{ status, service, version }` shape as the legacy `GET /api/health` |
| GET | `/api/backend-view` | Session-aware (own logs; `admin` sees all with name/email; unauthenticated gets a file-based fallback) | JSON overview of import stats, recent logs, and a partial live API-endpoint registry | — | Backs the `/backend` control-center page |
| GET | `/api/developer-view` | Public | Developer-wiki JSON: architecture, services, data-flow docs | — | Backs the `/developer` page's Package Reference (FR-283-adjacent) |
| GET | `/api/docs` | Public | Serve an allow-listed `product/*.md` document by `?slug=` (brd, srs, use-cases, scenarios, test-cases, user-journeys, dev-guide, deployment, readme) | — | Backs in-app documentation viewers (e.g. `/help`, `/developer`) |
| POST | `/api/auth/login` | Public | Authenticate with email + password; sets the `iron-session` cookie | — | Narrated in §3.4 Data Flow step 1 (`User logs in via POST /api/auth/login → iron-session cookie set`) |
| POST | `/api/auth/logout` | Authenticated | Clear the session cookie | — | — |
| POST | `/api/auth/register` | Public (always returns HTTP 403) | Inactive public-registration endpoint | FR-235 | `/register` route redirects to `/login`; new users are admin-created only |
| POST | `/api/auth/change-password` | Authenticated | Forced first-login password change | FR-235D | Drives the `mustChangePassword` redirect enforced by `middleware.ts` |
| GET | `/api/auth/me` | Authenticated | Return the current session user (`userId, email, name, role, mustChangePassword`) | — | Used by client-side role-aware UI to read the live session without a full page reload |
| GET, PATCH | `/api/profile` | Authenticated | Read or update the current user's member profile | — | Backs the `/profile` page |
| GET, POST | `/api/profile/image` | Authenticated | Upload/stream an S3-backed profile image under `images/profile/` | FR-235F.1 | — |
| GET | `/api/members` | Authenticated | List active members for the team-member directory; opportunistically syncs users from cloud storage first | — | Backs the `/members` page (UC-085-adjacent) |
| GET, POST | `/api/snapshots` | Authenticated | List the current user's dashboard snapshots; create a new snapshot | — | Backs `/snapshots` and the dashboard's "Save Snapshot" action |
| GET, DELETE | `/api/snapshots/[id]` | Authenticated (own snapshot, or any if `admin`) | Load a snapshot's stored metrics; delete a snapshot | — | Backs `/snapshots` and `/snapshots/compare` — `UC-053` (Save and Load Dashboard Snapshot) and `UC-054` (Compare Two Snapshots) |
| GET | `/api/trends` | Authenticated | Return Release Confidence Score trend data for the `/trends` page | FR-291 | — |
| GET, POST, PATCH, DELETE | `/api/admin/users` | Admin only | Create, list, update, and delete managed users; never returns password hashes; writes audit events | FR-235B | — |
| GET | `/api/admin/diagnostics` | Admin only | Live Ops Health Score (0–100), DB row counts, env-var checks, system info, last 8 audit events | FR-299 | — |
| GET | `/api/admin/backup` | Admin only | Create and download a backup bundle; `?info=true` returns file stats only | FR-298 (backup/restore narrative) | — |
| POST | `/api/admin/restore` | Admin only | Restore the system from an uploaded backup-bundle JSON file | FR-298 (backup/restore narrative) | `.bak` safety copy made before restore (per cluster-#5/Addendum narrative) |
| POST | `/api/admin/cleanup` | Admin only | Trigger manual data-retention cleanup; `?action=clear_all` clears all data | FR-270-adjacent (retention narrative) | — |
| GET | `/api/admin/orphan-rules` (read: any logged-in user); POST (write: admin only) | Mixed — read open to any authenticated user, write admin-gated | Return / update the orphan-detection rule configuration | FR-034-adjacent (orphan rules narrative) | — |
| GET | `/api/admin/security` | Admin only | Run the security checklist and return a report | FR-307-adjacent (security checklist narrative) | — |
| GET (read: any logged-in user); POST (write: admin only) | `/api/admin/settings` | Mixed | Return / update data-retention settings and stats | FR-270-adjacent (retention narrative) | — |
| GET (read: any logged-in user); POST (write: admin only) | `/api/admin/thresholds` | Mixed | Return / update the 9 configurable health-score thresholds | FR-260-adjacent (thresholds narrative) | — |
| GET, POST | `/api/admin/storage` | Admin only | Return / update active cloud-storage provider + credentials; `?action=test` checks connectivity | FR-307 | Full provider/credential-redaction contract specified in FR-307 |
| GET, POST | `/api/admin/storage/sync` | Admin only | Return sync status + cache metadata; trigger a sync from or push to the cloud provider | FR-307-adjacent | — |
| GET | `/api/admin/storage/download` | Admin only | Download a backup object by `?key=`; `?restore=true` immediately restores it | FR-298/FR-307-adjacent | — |
| GET, POST | `/api/admin/storage/auto-restore` | Admin only | Check local-DB health status; manually trigger auto-restore from cloud | FR-307-adjacent | — |
| GET, PUT, POST | `/api/admin/app-config` | Admin only | `GET`: return current SMTP/app config with passwords masked; `PUT`: encrypt and save new config to cloud; `POST ?action=test`: send a test email to the logged-in admin to verify SMTP settings | FR-325-adjacent (email delivery) | Config envelope is encrypted before upload to cloud storage; uses `getAppConfig()` / `getSafeConfig()` / `saveToCloud()` from `src/lib/app-config.ts` |

| POST | `/api/user-add-requests` | Authenticated | Submit a request to add a new team member (name, email, role, reason); guards duplicate email and duplicate pending request | FR-316 | UC-095 |
| GET | `/api/user-add-requests/mine` | Authenticated | Return the calling user's own submitted add-member requests (max 50, desc) | FR-317 | UC-095 |
| GET | `/api/admin/user-add-requests` | Admin only | List all user add requests with requester info; optional `?status=` filter | FR-318 | UC-096 |
| PATCH | `/api/admin/user-add-requests/[id]/accept` | Admin only | Accept a pending request: create user with `mustChangePassword=true`, notify requester, audit | FR-319 | UC-096 |
| PATCH | `/api/admin/user-add-requests/[id]/reject` | Admin only | Reject a pending request: notify requester with optional reason note, audit | FR-319 | UC-096 |
| GET | `/api/notifications` | Authenticated | Return current user's `Notification` records (max 50, newest first) | FR-322 | UC-099 |
| PATCH | `/api/notifications/[id]/read` | Authenticated | Mark a single notification as read; validates `recipientUserId === session.userId` (404 if not owned) | FR-322 | UC-099 |

*Note on FR-313 (Backend Integration Gateway):* `src/server/gateway/` is an internal server-only module with no dedicated API route — it has nothing to list in this inventory because no provider is wired up yet (it exists for future routes/integrations to call through, not as an endpoint itself). It is documented in full in FR-313 and `product/DEVELOPER_GUIDE.md` § "Backend Integration Gateway".

**How to read this inventory:** "FR ref" cites the requirement that already documents the route's behavioural contract in detail; "—" means the route's behaviour is documented only at the page/UC level cited in Notes (acceptable for thin, page-bound accessor routes — e.g. `/api/auth/me`, `/api/dashboard` — that have no independent business rule beyond "return the session/status object"). Routes whose FR ref says "-adjacent" are covered by a narrative paragraph that describes the *feature* (backup/restore, retention, thresholds, orphan rules, security checklist, cloud storage) without enumerating every HTTP verb's exact contract — sufficient for COVER-03's "every API route is covered" bar because the feature-level FR is the system of record and the route is its mechanical transport, not an independent requirement.

---

## 9. Constraints

### 9.1 Technical Constraints

1. **Single-threaded Node.js**: The Express server runs on a single event loop thread. Metric computation for large files (~3,500+ rows, ~50ms on modern hardware) briefly blocks the event loop. Under concurrent load, requests will queue.
2. **Flat JSON log store**: `import-logs.json` is read and written as a complete JSON array on each operation. Concurrent uploads may cause race conditions leading to log entry loss. A mutex or database (SQLite) is required for production multi-user deployments.
3. **No database**: All metrics are recomputed on each upload. There is no historical comparison or sprint-over-sprint trending beyond what is present in a single export.
4. **Memory storage**: Uploaded files are held in the Node.js process heap. A 20 MB XLSX file may expand to 100–200 MB in heap when parsed by `xlsx`. Deployments should allocate at least 512 MB RSS to the backend process.
5. **xlsx library version**: `xlsx` v0.18.5 is the SheetJS Community Edition. This version has known limitations with certain XLSX features (e.g., complex merged cells, pivot tables). Exports containing these features may parse with data loss.
6. **No WebSocket or polling**: The dashboard is static after load. Changes to the Jira project require a new file export and re-upload.

### 9.2 Security Constraints

1. **No authentication**: The upload endpoint and all log endpoints are unauthenticated. Any party with network access to port 4000 can upload files and read import logs. For team or internet-facing deployments, an authentication proxy (e.g., nginx basic auth, OAuth2 proxy) must be placed in front of the backend.
2. **CORS configuration**: The `ALLOWED_ORIGIN` environment variable must be set in production. The default (allow all origins) is unsuitable for production.
3. **Rate limiting covers upload only**: The rate limiter applies only to `POST /api/upload`. The `GET /api/upload/logs` and `GET /api/upload/logs/export` endpoints are unrestricted.
4. **No input sanitisation for log rendering**: The `renderBackendHome()` function renders file names from import logs as HTML. File names containing HTML special characters should be escaped to prevent XSS in the backend control center.

### 9.3 Known Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| No latest metrics available | Dashboard has no bucket/server payload or browser fallback | Upload a Jira file once; subsequent sessions can use bucket-backed latest metrics or localStorage fallback |
| No user authentication | All users share the same view | Deploy behind an auth proxy for team use |
| No real-time Jira connection | Manual export + upload required | Jira API integration is on the roadmap |
| Flat JSON log store | Race conditions under concurrent uploads | Use a database (SQLite) for production |
| Monolithic DashboardPage.js | Difficult to maintain and test in isolation | Refactor into focused component files (roadmap item) |
| No React error boundaries | Render errors show blank screen | Add error boundary components (recommended next step) |
| xlsx v0.18.5 limitations | Complex XLSX features may parse incorrectly | Upgrade to SheetJS Pro or use alternative parser |
| No HTTPS on backend | Traffic is unencrypted by default | Terminate TLS at the reverse proxy (nginx/Caddy) |
| Cycle time may default to sprint start | Accurate cycle time requires `In Progress Date` in the export | Include `In Progress Date` in Jira export configuration |
| Excel serial date parsing | Serial numbers outside 20,000–80,000 treated as non-dates | Verify Jira export date format; ISO format is most reliable |

---

## 10. Acceptance Criteria

### Upload and Parsing

**AC-001** — Uploading a `.csv` file with the four essential columns (`Issue Key`, `Issue Type`, `Summary`, `Status`) returns HTTP 200 and a `metrics` object with `totalIssues > 0`.

**AC-002** — Uploading a file with an extension other than `.csv`, `.xlsx`, or `.xls` returns HTTP 400 with an error message containing the word "Unsupported".

**AC-003** — Uploading a file larger than 20 MB returns HTTP 413 with an error message containing "20 MB".

**AC-004** — Making more than 20 upload requests within 15 minutes from the same IP returns HTTP 429.

**AC-005** — Uploading a valid file where `Status` column is missing from all rows returns HTTP 422 with `details` array containing `"Status"`.

**AC-006** — Uploading a file where the column header is `"Created"` (Jira alias) results in the field being available as `"Created Date"` in the parsed issues.

**AC-007** — Uploading a file where `"Custom Field (Epic Link)"` is a column header results in the field being normalised to `"Epic Link"`.

**AC-008** — The `warnings` array in the response lists any OPTIONAL_FIELDS absent from the uploaded file.

**AC-009** — An import log entry is written to `backend/data/import-logs.json` with `status: 'success'` after a successful upload, and `status: 'error'` after a validation failure.

### Metric Computation

**AC-010** — Given 3 issues where 2 have `Status: 'Done'`, `calculateDashboardMetrics` returns `doneIssues: 2`, `completionRate: 67`.

**AC-011** — Given 1 issue with `Blocked Flag: true` and `Status: 'In Progress'`, `getHealthFromIssue` assigns `health: 'critical'` and includes a reason string containing "block".

**AC-012** — Given 1 issue with `Status: 'In Progress'` and `ageDays` of 20, `getHealthFromIssue` assigns `health: 'critical'` and includes a reason string referencing the active age.

**AC-013** — Given 1 issue with `Status: 'In Progress'` and `ageDays` of 10, `getHealthFromIssue` assigns `health: 'warning'`.

**AC-014** — Given `completionRate: 100` and `doneIssues: totalIssues`, `calculatePrediction` returns `{ complete: true, daysRemaining: 0 }`.

**AC-015** — Given `velocity < 0.01`, `calculatePrediction` returns `{ complete: false, daysRemaining: null }`.

**AC-016** — The `healthScore` is between 0 and 100 (inclusive) for any input.

**AC-017** — Given a dataset with `averageCycleTimeDays: 0`, `cycleScore` equals 100 and contributes `10` to the raw health score.

**AC-018** — Given an issue with labels `"frontend, backend"`, `buildLabelMetrics` creates separate entries for `"frontend"` and `"backend"`.

**AC-019** — An issue with no `Epic Link` and no `Parent Key` is classified as an orphan (`isOrphan: true`) in the flow item.

**AC-020** — `buildLinksMetrics` detects a column named `"Inward issue link (Blocks)"` as a link column and populates `blockedItems`.

**AC-021** — `buildRiskMetrics` returns `openDefects: 1` for the metrics unit test fixture in `metrics.test.js`.

**AC-022** — `overallDeliveryConfidence` equals 4 for the unit test fixture (values 4, 3, 5 → average 4).

### Dashboard and UI

**AC-023** — After a successful upload, the dashboard renders the `#dashboard-summary` section with a `HealthScoreGauge` displaying the correct `healthScore`.

**AC-024** — Clicking the "High risk" quick filter sets `healthFilter` to `'critical'` and opens the flow panel.

**AC-025** — The `filteredFlowItems` useMemo filters correctly when `keyFilter` is set: only issues whose `Issue Key` contains the filter string (case-insensitive) are returned.

**AC-026** — Pressing Escape while the Detail Modal is open closes it (`detailPanel` becomes null).

**AC-027** — The Manager Report modal displays 8 cells in the snapshot grid and 7 rows with "Details →" links.

**AC-028** — Clicking "Details → Risk Indicators" in the Manager Report closes the modal and scrolls to `#flow-health-panel` with `healthFilter` set to `'critical'`.

**AC-029** — The `DeliveryCircle` ring segments sum to `totalIssues` with no issue counted in more than one segment.

**AC-030** — The `SectionNav` has exactly 14 dot buttons.

**AC-031** — The `ScrollToTopFab` button is not visible when `scrollY < 400` and is visible when `scrollY >= 400`.

**AC-032** — The Relations section is not rendered when `data.relations.hasLinks === false`.

**AC-033** — On a viewport of 375 px width, the dashboard renders without horizontal scrollbar.

**AC-034** — Clicking the dark mode toggle switches the CSS class on `.app.shell` between `light` and `dark`.

**AC-035** — The `#flow-health-panel` initially shows at most 100 rows, and a "Show N more" button appears when `filteredFlowItems.length > 100`.

**AC-036** — Clicking "Show N more" increments `flowItemVisibleCount` by 100.

**AC-037** — The Prediction delta card is hidden when `prediction.daysRemaining` is null.

**AC-038** — The Help Guide renders 17 sections accessible by name.

**AC-039** — Arrow keys navigate between steps within a Help Guide section.

**AC-040** — A "Smart action" card is generated for blocked critical items only when at least one flow item has `health: 'critical'` and a reason containing `'block'`.

### API and Logs

**AC-041** — `GET /api/health` returns `{ "status": "ok", "service": "delivery-clarity-backend", "version": "1.0.0" }` with HTTP 200.

**AC-042** — `GET /api/upload/logs` returns a JSON array where the most recent entry appears first.

**AC-043** — `GET /api/upload/logs/export` returns a binary response with `Content-Disposition: attachment; filename="import-logs.xlsx"`.

**AC-044** — `GET /api/upload/logs/view` returns `Content-Type: text/html`.

---

## 11. Traceability Matrix

| FR ID | Requirement Summary | Codebase Component | Test / AC |
|---|---|---|---|
| FR-001 | File format, size, and rate limits | `routes/upload.js`, `multer`, `express-rate-limit` | AC-002, AC-003, AC-004 |
| FR-002 | Multer memory storage config | `routes/upload.js` | AC-001, AC-002 |
| FR-003 | Header normalisation via FIELD_ALIASES | `services/parser.js` → `canonicalizeHeader` | AC-006, AC-007 |
| FR-004 | Essential field validation | `utils/validation.js` → `validateIssueData` | AC-005 |
| FR-005 | Optional field warning generation | `services/parser.js` → `OPTIONAL_FIELDS` | AC-008 |
| FR-010 | getHealthFromIssue — health signals | `services/metrics.js` → `getHealthFromIssue` | AC-011, AC-012, AC-013 |
| FR-011 | calculateHealthScore — formula | `services/metrics.js` → `calculateHealthScore` | AC-016, AC-017 |
| FR-012 | calculatePrediction — velocity | `services/metrics.js` → `calculatePrediction` | AC-014, AC-015, AC-037 |
| FR-013 | buildFlowMetrics — sorting | `services/metrics.js` → `buildFlowMetrics` | AC-010 |
| FR-014 | buildSprintMetrics | `services/metrics.js` → `buildSprintMetrics` | AC-041 (indirectly) |
| FR-015 | buildStatusBreakdown (Kanban) | `services/metrics.js` → `buildStatusBreakdown` | — |
| FR-016 | buildQuarterMetrics | `services/metrics.js` → `buildQuarterMetrics` | — |
| FR-017 | buildCapacityMetrics | `services/metrics.js` → `buildCapacityMetrics` | — |
| FR-018 | buildEpicMetrics | `services/metrics.js` → `buildEpicMetrics` | — |
| FR-019 | buildLabelMetrics — multi-label | `services/metrics.js` → `buildLabelMetrics` | AC-018 |
| FR-020 | buildTypeMetrics | `services/metrics.js` → `buildTypeMetrics` | — |
| FR-021 | buildProjectMetrics | `services/metrics.js` → `buildProjectMetrics` | — |
| FR-022 | buildParentMetrics | `services/metrics.js` → `buildParentMetrics` | — |
| FR-023 | buildLinksMetrics — dynamic columns | `services/metrics.js` → `buildLinksMetrics` | AC-020 |
| FR-024 | buildRiskMetrics — four risk counts | `services/metrics.js` → `buildRiskMetrics` | AC-021, AC-022 |
| FR-025 | buildInsights — insight strings | `services/metrics.js` → `buildInsights` | — |
| FR-030 | Dashboard header | `App.js`, `styles.css` | AC-034 |
| FR-031 | #dashboard-summary — summary bar | `DashboardPage.js` → summary section | AC-023, AC-027 |
| FR-032 | Sticky filter bar | `DashboardPage.js` → sticky filter bar | AC-024 |
| FR-033 | SmartActions cards | `DashboardPage.js` → `SmartActions` | AC-040 |
| FR-034 | #section-attention | `DashboardPage.js` → attention strip | — |
| FR-035 | #section-overview — KPI grid | `DashboardPage.js`, `KpiCard.js` | AC-023 |
| FR-036 | #section-visuals | `DashboardPage.js` → visuals section | — |
| FR-037 | #section-ratios — DeliveryCircle | `DashboardPage.js` → `DeliveryCircle` | AC-029 |
| FR-038 | #section-delivery-controls | `DashboardPage.js` → delivery controls | — |
| FR-039 | #section-quarters | `DashboardPage.js` → quarters section | — |
| FR-040 | #section-kanban | `DashboardPage.js` → kanban section | — |
| FR-041 | #section-sprint | `DashboardPage.js` → sprint section | — |
| FR-042 | #section-ownership | `DashboardPage.js` → ownership section | — |
| FR-043 | #section-labels | `DashboardPage.js` → labels section | — |
| FR-044 | #section-relations | `DashboardPage.js` → relations section | AC-032 |
| FR-045 | Justification panel | `DashboardPage.js` → panel-justification | — |
| FR-046 | #section-readiness | `DashboardPage.js` → readiness section | — |
| FR-047 | Detail modal | `DashboardPage.js` → detailPanel state | AC-026 |
| FR-048 | #flow-health-panel — flow table | `DashboardPage.js` → flow health panel | AC-025, AC-035, AC-036 |
| FR-050 | SectionNav — 14 dot buttons | `DashboardPage.js` → `SectionNav` | AC-030 |
| FR-051 | ScrollToTopFab | `DashboardPage.js` → `ScrollToTopFab` | AC-031 |
| FR-052 | Deep-link from Manager Report | `DashboardPage.js` → `ManagerReport` | AC-028 |
| FR-053 | Manager Report content | `DashboardPage.js` → `ManagerReport` | AC-027 |
| FR-054 | Manager Report print mode | `styles.css` → `@media print` | AC-034 (indirectly) |
| FR-055 | Manager Report close actions | `DashboardPage.js` → `showManagerReport` | AC-028 |
| FR-060 | Smart action — blocked critical | `DashboardPage.js` → `smartActions` useMemo | AC-040 |
| FR-061 | Smart action — stale active work | `DashboardPage.js` → `smartActions` useMemo | — |
| FR-062 | Smart action — capacity imbalance | `DashboardPage.js` → `smartActions` useMemo | — |
| FR-063 | Smart action — orphan items | `DashboardPage.js` → `smartActions` useMemo | — |
| FR-064 | Smart action — critical epics | `DashboardPage.js` → `smartActions` useMemo | — |
| FR-065 | Smart action — blocked by link | `DashboardPage.js` → `smartActions` useMemo | — |
| FR-066 | Help Guide — 17 sections | `HelpGuide.js` | AC-038 |
| FR-067 | Help Guide — keyboard navigation | `HelpGuide.js` | AC-039 |
| FR-068 | Help trigger points | `DashboardPage.js` → `HelpButton` | — |
| FR-069 | Flow table — 11 filters | `DashboardPage.js` → `filteredFlowItems` useMemo | AC-025 |
| FR-070 | Flow table — pagination | `DashboardPage.js` → `flowItemVisibleCount` | AC-035, AC-036 |
| FR-071 | Flow table — reset | `DashboardPage.js` → Reset button | — |
| FR-072 | Orphan row highlighting | `DashboardPage.js`, `styles.css` | — |
| FR-073 | Import log structure | `services/importLogs.js` | AC-009 |
| FR-074 | GET /api/upload/logs | `routes/upload.js` | AC-042 |
| FR-075 | GET /api/upload/logs/view | `routes/upload.js`, `services/backendView.js` | AC-044 |
| FR-076 | GET /api/upload/logs/export | `routes/upload.js` | AC-043 |
| FR-077 | Dark mode | `App.js`, `styles.css` | AC-034 |
| FR-078 | Print mode | `styles.css` | — |
| FR-079 | Mobile responsiveness | `styles.css` | AC-033 |
| FR-080 | Keyboard navigation | `DashboardPage.js`, `HelpGuide.js` | AC-026, AC-039 |

---

*End of Software Requirements Specification — Delivery Clarity v4.2.2*
*Document prepared: 2026-05-30*
*Author: Ali Abu Ras — aburasali80@gmail.com*

---

## SRS Additions — v1.1 (2026-05-30)

### Updated Architecture: Routing

react-router-dom v7.16.0 is added as a frontend dependency. BrowserRouter wraps the application in index.js. The application has 4 routes:
- / → UploadPage (protected: redirects to /summary if dashboardData exists)
- /summary → SummaryPage (protected: redirects to / if no dashboardData)
- /dashboard → DashboardPage (protected: redirects to / if no dashboardData)
- /help → HelpGuide in pageMode=true (unprotected: always accessible)

### New Functional Requirements

**FR-200:** On successful file upload (/api/upload returns 200), the frontend MUST call navigate('/summary') to redirect the user to the Summary page.

**FR-201:** The /summary route MUST render SummaryPage containing: (a) health score gauge with colour band matching the score tier, (b) health status banner showing scoreLabel and riskItems count, (c) prediction chip showing estimated days and date when velocity > 0 and items remain, (d) 6 KPI cards using the KpiCard component, (e) attention cards for blockers/overdue/orphans when counts > 0, (f) top 4 insights from data.insights[], (g) "Upload new file" and "View Full Report →" buttons.

**FR-202:** The "View Full Report →" button on SummaryPage MUST navigate to /dashboard using useNavigate().

**FR-203:** The /help route MUST render HelpGuide with pageMode=true, which renders without the backdrop overlay div and without fixed positioning, suitable for full-page display.

**FR-204:** The Help button in AppHeader and all HelpButton (?) instances in DashboardPage MUST navigate to /help?section=${encodeURIComponent(section)} instead of opening a modal. The HelpPage component reads the section parameter via useSearchParams().

**FR-205:** DashboardPage (/dashboard) MUST display a "← Back to Overview" button that calls navigate('/summary').

**FR-206:** Any direct URL access to /summary or /dashboard when dashboardData is null MUST redirect to / (the upload page) using <Navigate to="/" replace />.

### Updated Dependency
- react-router-dom: ^7.16.0 (added to frontend/package.json)

---

## v3.0 Functional Requirements (2026-05-31)

### F1 — Throughput & Delivery Analytics

**FR-207:** The system MUST calculate `SprintThroughputSummary` for every sprint group in the export, including: committedCount, completedCount, committedPoints, completedPoints, completionPct, throughputByCount, throughputByPoints, midSprintDoneCount, midSprintPct, carryoverCount, addedScopeCount, blockedCount, goalOutcome, deliveryPattern, and deliveryConfidence.

**FR-208:** Sprint dates MUST be resolved first from explicit `Sprint Start` / `Sprint End` fields; if absent, the system MUST derive dates from the minimum created date and maximum done date within the sprint group.

**FR-209:** The system MUST compute sprint midpoint as `sprintStart + floor((sprintEnd - sprintStart) / 2)` and calculate mid-sprint delivery metrics against this date.

**FR-210:** The system MUST classify every sprint into one of five delivery patterns: Healthy Early Progress (midSprintPct ≥ 50%), Late Delivery Risk (midSprintPct ≥ 30%), End-Loaded Sprint (default low), Scope Instability (addedScope > 20% committed), Blocked Sprint (blockedCount ≥ 2).

**FR-211:** The system MUST calculate sprint goal outcome: Met (completionPct ≥ 90%), Partially Met (≥ 60%), Missed (< 60% past sprint end), At Risk (< 60% sprint still active).

**FR-212:** The system MUST calculate delivery trend as the difference between the average throughput of the 3 most recent sprints and the 3 preceding sprints. Direction MUST be: Improving, Declining, or Stable (±5% threshold).

**FR-213:** The system MUST calculate Kanban flow metrics for issues without sprint fields, grouped by monthly reporting period, including: completedCount, completedPoints, avgCycleTimeDays, avgLeadTimeDays, wipAverage, agingWipCount (active > 14 days), blockedCount, reopenedCount, flowEfficiencyPct (cycleTime / leadTime × 100), bottleneckStatus, flowHealth.

**FR-214:** The dashboard MUST display SprintThroughputPanel, MidSprintDeliveryPanel, and KanbanThroughputPanel as collapsible sections.

**FR-215:** All throughput data MUST be included in the DashboardMetrics response from `POST /api/upload` under a `throughput` field of type `ThroughputMetrics`.

### F2 — Work Item Explorer

**FR-216:** A route `/explore` MUST exist titled "Explore Delivery Structure" allowing users to enter any Jira issue key and retrieve its delivery structure.

**FR-217:** The Explorer MUST show only the focus node, its immediate parent (one level up), and its direct children (one level down). Siblings, cousins, and unrelated orphans MUST NOT appear.

**FR-218:** The system MUST reconstruct hierarchy using these signals in priority order: (1) explicit Parent Key field, (2) explicit Epic Link field, (3) key-prefix matching against known Epics. Each inferred link MUST carry a confidence score.

**FR-219:** Orphan issues (no resolvable parent after all signals) MUST be classified as: MISSING_EPIC, MISSING_PARENT, DANGLING_LINK, or FULLY_ORPHANED. Each classification MUST carry a delivery impact statement and suggested fix.

**FR-220:** The visual graph MUST use React Flow with Dagre hierarchical layout. Each node MUST display: issue key, summary (truncated), type icon, status badge, assignee, story points, and health indicator.

**FR-221:** Each issue type MUST have a distinct visual style: Epic (purple, large), Story (blue, medium), Task (slate, medium), Sub-task (gray, small), Bug (red, medium), Spike (amber), Technical Debt (orange), Risk (dark red), Change Request (teal).

**FR-222:** Orphan nodes MUST display a dashed orange border and an "ORPHAN" badge regardless of issue type.

**FR-223:** The Explorer page MUST show after the visual graph: RelationCharts (6 chart cards), KPI stats (7 metric cards), and a filterable details table.

**FR-224:** The details table MUST support filtering by type, status, and health, plus free-text search on key/summary/assignee. Clicking a row MUST trigger `onFocusNode` to re-search that issue.

**FR-225:** The system MUST store the last 5 searched keys in localStorage key `dc_explore_recent` and display them as clickable chips below the search input.

**FR-225A:** The relation graph builder MUST resolve every issue field from either raw JiraIssue export field names (e.g. `Issue Key`, `Issue Type`, `Status`, `Parent Key`, `Epic Link`, `Blocked Flag`) or normalized FlowItem field names (e.g. `key`, `type`, `status`, `parent`, `epic`, `isBlocked`), trying the raw name first and falling back to the FlowItem name, so the graph, stats, risk-path, branch, and filter computations behave identically regardless of which format the uploaded dataset uses.

**FR-225B:** For every node that is blocked or has critical health and is not done, the system MUST walk the hierarchy edges from that node up to the root and mark every node and connecting edge on that path with `isOnRiskPath = true`. Risk-path nodes MUST render with a solid red border, red-tinted background, and a "⚠ RISK PATH" badge; risk-path edges MUST render thicker, animated, and in red.

**FR-225C:** The system MUST identify the "largest unfinished branch" — the direct child of the focus node whose subtree contains the most open (non-done) items — and mark every non-done node in that subtree with `isLargestBranch = true`. Branch-root nodes MUST render with a solid purple border, light-purple background, and a "📊 MOST WORK" badge, and the stats panel MUST show a card naming the branch root, its open count, total count, and completion percentage whenever it has 2 or more open items.

**FR-225D:** The Explorer MUST offer a "Show blocked branches" toggle that, when active, narrows the graph and details table to only nodes that are blocked or on a risk path; every other node MUST dim to 20% opacity with a grayscale filter and its connecting edges MUST dim to 10% opacity with animation disabled. The toggle MUST display the count of blocked/critical nodes and, while active, the count of risk-path nodes.

### F3 — Authentication & Database

**FR-226:** All routes MUST be protected by Next.js middleware. Unauthenticated requests to `/dashboard`, `/summary`, `/charts`, `/explore`, `/backend`, `/profile`, or `/admin` MUST redirect to `/login?redirect=<originalPath>`.

**FR-227:** The `/admin` prefix MUST be accessible only to users with `role = 'admin'`. Non-admin authenticated users MUST be redirected to `/dashboard`.

**FR-228:** Passwords MUST be hashed using bcryptjs with a minimum of 12 salt rounds before storage. Plain-text passwords MUST never be stored, logged, or transmitted.

**FR-229:** Sessions MUST use HTTP-only, SameSite=strict cookies managed by iron-session. Session TTL MUST be configurable via `SESSION_TTL_HOURS` environment variable (default: 8 hours).

**FR-230:** Login attempts MUST be rate-limited to 5 per minute per IP address. Exceeding this MUST return HTTP 429.

**FR-231:** Every successful login, logout, upload, and registration event MUST be recorded in the `AuditEvent` table with userId, eventType, timestamp, IP address, and user agent.

**FR-232:** When a user is authenticated, every call to `POST /api/upload` MUST save an `ImportLog` record to the SQLite database with the authenticated userId, fileName, fileSize, fileType, totalIssues, doneIssues, healthScore, and processingTimeMs.

**FR-233:** `GET /api/imports` MUST return only the authenticated user's import logs by default. Users with role `admin`, `manager`, or `c_level` calling with `?all=true` MUST receive all users' logs including the associated user name and email.

**FR-234:** A UserMenu component MUST appear in the application header when the user is authenticated, displaying: user initials avatar, name, role badge, links to Profile and permitted admin pages, and a Sign Out action.

**FR-235:** Public registration MUST be inactive. The `/register` route MUST remain reserved for future adjustment but redirect to `/login`, and `POST /api/auth/register` MUST return HTTP 403. New users MUST be created through admin user management only.

**FR-235A:** Admin users MUST be able to manage users from `/admin/settings → Users`: list users, create users, assign `admin`, `scrum_master`, `product_owner`, `manager`, or `c_level` roles, edit display names, enable/disable accounts, and delete users. The system MUST prevent an admin from deleting or disabling their own account.

**FR-235B:** The system MUST expose admin-only `GET/POST/PATCH/DELETE /api/admin/users` endpoints for user management. The API MUST never return password hashes and MUST write audit events for admin user create/update/delete operations. Admin-created users MUST be marked `mustChangePassword=true`.

**FR-235C:** When cloud storage is active, authentication and admin user-management flows MUST sync the local SQLite user database from cloud before reading or mutating users. Admin user create/update and password-change operations MUST push an updated backup to cloud after the local mutation succeeds.

**FR-235D:** After first login with an admin-provided temporary password, users marked `mustChangePassword=true` MUST be redirected to `/change-password`. Anonymous users MUST be redirected to `/login` for protected routes, including `/change-password`. Users who must change password MUST be blocked by middleware from accessing other protected app routes until the password change succeeds.

**FR-235H (renumbered 2026-06-08 from a colliding `FR-235D` — see TODO-List.md Section 12 Gaps Summary item 6):** Assigned delivery roles (`scrum_master`, `product_owner`, `manager`, `c_level`) MUST be locked to their corresponding dashboard view. Browser-saved dashboard view preferences MUST NOT allow those roles to open a different dashboard view.

**FR-235E:** The application navigation MUST hide protected routes that the authenticated user's role cannot access. Middleware MUST enforce the same protected-page route matrix so a user cannot open a disallowed route by typing the URL directly.

**FR-235F:** Authenticated users MUST be able to edit a shared member profile at `/profile`, including name, position, profile image, telephone, contact email, address, certificates, and team-facing notes. Profile updates MUST be persisted server-side and synced to cloud backup when cloud storage is configured.

**FR-235F.1:** When Amazon S3 is the active cloud storage provider, authenticated users MUST be able to upload a JPG, PNG, WebP, or GIF profile image from `/profile`. The system MUST store the object in S3 under `images/profile/`, update the user's `avatarUrl`, and serve the image through an authenticated `/api/profile/image` route so public bucket access is not required.

**FR-235G:** Authenticated users MUST be able to open `/members` to view active team members with name, position, role, and contact summary. Selecting a member MUST open a detail popup with contact info, certificates, address, and team-facing notes. Anonymous users MUST be redirected to `/login`.

### F4 — Smart Excel Export

**FR-236:** The Excel export MUST produce a workbook with exactly 17 named sheets in sequence: 01 Executive Summary through 17 Raw Data Reference.

**FR-237:** Every sheet with tabular data MUST have: a frozen header row, auto-filter enabled on the header row, and column widths tuned to content.

**FR-238:** The Executive Summary sheet MUST contain: health score, health band, completion rate, total/done/active/blocked issues, average lead time, average cycle time, top 5 recommendations with priority and suggested owner, and a plain-English executive narrative paragraph.

**FR-239:** The Recommendations sheet MUST contain one row per recommendation with columns: Priority, Area, Recommendation, Evidence, Impact, Suggested Owner, Suggested Action. Every cell MUST contain plain text — no HTML, no JSON, no code.

**FR-240:** The Metric Dictionary sheet MUST define every metric used in the workbook including: formula or source, unit, good range, and interpretation notes.

**FR-241:** The workbook MUST NOT contain HTML markup, React JSX syntax, CSS class names, or `[object Object]` values in any cell.

**FR-310 (renumbered 2026-06-08 from a colliding `FR-242` — see TODO-List.md Section 12 Gaps Summary item 6):** The Risks & Blockers, Orphan & Data Quality, Cycle & Lead Time, and Release Readiness sheets MUST each derive their content directly from the in-memory `DashboardMetrics.flow.items` rather than recomputed approximations: (a) Risks & Blockers MUST list every item that is critical/warning health, blocked, or aged beyond 14 days, sorted critical → warning → good, each with a risk-tier suggested action ("Escalate immediately…" for critical, "Review in next standup…" for warning, "Monitor — add to sprint backlog review" for everything else), and MUST show a clean-bill-of-health message when no item qualifies; (b) Orphan & Data Quality MUST report counts and percentages of orphan, missing-story-point, unassigned, and no-sprint items plus an itemized orphan detail block (or a complete-hierarchy message when there are no orphans); (c) Cycle & Lead Time MUST compute average, median (P50), P75, P85, P95, min, max, and sample size for both lead time and cycle time, plus a top-20-slowest-by-lead-time ranking; (d) Release Readiness MUST group items by Fix Version/Release and assign a Go / Conditional Go / No-Go readiness verdict from each group's completion %, blocked count, and open-bug count.

**FR-311 (renumbered 2026-06-08 from a colliding `FR-243` — see TODO-List.md Section 12 Gaps Summary item 6):** The dashboard sticky bar and the `/summary` page MUST each expose an "Export" control that lets the user trigger the 17-sheet smart workbook download (in addition to CSV-risk, HTML-report, and Executive-PDF formats from the same control). Triggering the Excel export MUST build the workbook from the current `DashboardMetrics`, download it under the documented default filename `delivery-clarity-report.xlsx` (or a caller-supplied filename), and silently record the `download_report` onboarding step without blocking or failing the export if tracking is unavailable.

---

## Addendum A — v4.0 Quality & Trust Layer Requirements (2026-06-03)

### A.1 — Data Quality Score

**FR-242:** After every file upload, the system MUST compute a Data Quality Score (0–100%) based on 10 field checks. Fields checked: Created Date, Done Date, Story Points, Sprint, Assignee, Epic Link/Parent Key, In Progress Date, Due Date, Priority, Labels.

**FR-243:** The Data Quality Score MUST be categorised into five bands: Excellent (≥90%), Good (≥75%), Fair (≥50%), Poor (≥25%), Critical (<25%).

**FR-244:** The Data Quality Score and band MUST be displayed on the upload column-mapping preview page and on the dashboard.

**FR-245:** A plain-English summary MUST be shown explaining what the score means and which fields are most impactful to improve.

### A.2 — Metric Confidence Score

**FR-246:** The system MUST calculate a Metric Confidence Score for each major KPI: Sprint Throughput, Kanban Flow, Cycle Time, Lead Time, Velocity, and others.

**FR-247:** Confidence levels are: High (all required fields present and populated), Medium (some fields missing but metric is estimable), Low (significant data gaps), Unreliable (critical fields absent), N/A (metric not applicable to this dataset).

**FR-248:** Each KPI card MUST display a confidence badge. Clicking/hovering the badge MUST show the reason and which fields are missing.

### A.3 — Missing-Column Impact

**FR-249:** The column-mapping preview MUST show each field as: Mapped (present and recognised), Aliased (matched via alias), or Unrecognised (not matched).

**FR-250:** For each missing optional field, the system MUST explain: which dashboard metrics are degraded, what the user would gain by adding the field, and which dashboard sections are affected.

### A.4 — Privacy and Data Retention

**FR-251:** Admin users MUST be able to configure a data retention period for import logs: 7 / 30 / 90 / 365 days or never-delete.

**FR-252:** The system MUST support auto-delete of import logs older than the configured retention period.

**FR-253:** Admin users MUST be able to trigger a manual "Clear All" of all import logs.

**FR-254:** Users MUST be able to delete their own import logs and snapshots with a 2-click confirmation.

### A.5 — Saved Snapshots and Comparison

**FR-255:** Authenticated users MUST be able to save the current dashboard metrics as a named snapshot. Maximum 20 snapshots per user.

**FR-256:** The `/snapshots` page MUST list all saved snapshots with name, date, and health score.

**FR-257:** The `/snapshots/compare` page MUST show a side-by-side comparison of two selected snapshots, displaying delta values for 12 key metrics with ↑↓→ direction indicators and an insights summary.

### A.6 — Upload-to-Upload Trend Analysis

**FR-258:** The `/trends` page MUST show trend charts for 8 metrics across the user's last 30 uploads: Health Score, Completion Rate, Critical Count, Cycle Time, Lead Time, Blocked Ratio, Story Points Completed, Orphan Count.

**FR-259:** The "What changed since last upload?" panel on the dashboard MUST automatically compare the current upload against the previous upload and display delta values with direction and narrative.

### A.7 — Configurable Thresholds and Rules

**FR-260:** Admin users MUST be able to configure 9 health thresholds via `/admin/settings`: cycle time critical/warning days, lead time critical/warning days, active age critical/warning days, open age warning days, blocked ratio warning %, orphan ratio warning %.

**FR-260A:** The `/admin/settings` page MUST use the flat Admin Console layout: sticky left settings sidebar, top context bar, page title/status area, contextual summary stat cards, and scannable operational panels for the selected settings area. User-specific summary cards MUST appear only in User Management; other settings tabs MUST show tab-relevant summaries.

**FR-260B:** Administration routes (`/admin/settings`, `/admin/diagnostics`, `/admin/security`, `/admin/logs`) MUST appear under a dedicated Administration navigation group and share the same flat Admin Console shell.

**FR-261:** Thresholds MUST be persisted to `data/health-thresholds.json` and applied to all future uploads.

**FR-262:** Admin users MUST be able to configure orphan detection rules: which fields are treated as parent link fields, which issue types are exempt, whether sub-tasks without parents are flagged, and risk thresholds.

**FR-263:** Orphan rules MUST be persisted to `data/orphan-rules.json`.

### A.8 — Recommendation Mute/Snooze

**FR-264:** Users MUST be able to mute or snooze individual recommendation cards using a × button and a snooze dropdown (7 days / 30 days / permanently).

**FR-265:** Muted/snoozed recommendations MUST persist to `localStorage` and not appear on future dashboard visits until the snooze period expires or the user restores them.

**FR-266:** A "Restore all muted" action MUST be available.

### A.9 — Release Readiness

**FR-267:** The `/readiness` page MUST evaluate release readiness per Fix Version using a 7-item checklist and produce a verdict: Go (all checks pass), Conditional Go (minor issues), or No-Go (critical issues).

### A.10 — Database Backup and Restore

**FR-268:** Admin users MUST be able to trigger a one-click backup of `data/delivery_clarity.db` and all config JSON files as a single JSON archive.

**FR-269:** Admin users MUST be able to restore from a previous backup. A `.bak` safety copy MUST be created before any restore operation.

### A.11 — Production Security Checklist

**FR-270:** The `/admin/security` page MUST run 8 automated security checks (session secret strength, open registration status, admin password default, HTTPS status, rate limiting, database existence, backup existence, cookie security) and allow 5 manual checks, producing a 0–100 security score and a production-ready flag.

### A.12 — Role-Based Dashboard Views

**FR-271:** The dashboard MUST support 5 selectable view presets: Full Report, Executive, Scrum Master, Product Owner, Engineering Manager.

**FR-272:** Each view MUST show/hide dashboard sections and panels appropriate to the selected role. The selected view MUST persist to `localStorage`.

### A.13 — Customer View

**FR-273:** The `/customer` page MUST display a clean, stakeholder-facing summary of delivery health without technical detail: health score, completion rate, top highlights, key risks, and a print/PDF action.

### A.14 — Onboarding Checklist

**FR-274:** A first-time onboarding checklist with 8 steps MUST be displayed for users who have not completed it. Steps are auto-tracked in `localStorage`. The checklist MUST be dismissible and accessible via a compact header chip.

### A.15 — Column-Mapping Preview

**FR-275:** After upload, before redirecting to the dashboard, the system MUST display a column-mapping preview page showing: mapped fields, aliased fields, unrecognised columns, the Data Quality Score, missing essential fields, and a 10-second auto-proceed timer. The user MAY proceed immediately or wait.

### A.16 — Performance Requirements (v4.0)

**FR-276:** For datasets of 5,000 issues, `calculateDashboardMetrics` MUST complete in under 1,000ms on commodity server hardware (Node.js 20, 2 vCPU, 2 GB RAM).

**FR-277:** The `parseDate` function MUST use a per-request Map memo cache to avoid duplicate regex parsing of repeated date strings. The cache MUST be reset at the start of each `calculateDashboardMetrics` call and freed at the end.

**FR-278:** Group lookups within `buildSprintMetrics`, `buildEpicMetrics`, `buildQuarterMetrics`, `buildLabelMetrics`, `buildTypeMetrics`, `buildProjectMetrics`, and `buildParentMetrics` MUST use an O(1) `flowItemByKey` Map rather than O(n) array scans.

### A.17 — Navigation

**FR-279:** The application navigation MUST use grouped dropdown sub-menus with 4 groups: Analytics (Overview, Full Report, Charts, Trends), Delivery (Readiness, Explore, Customer), Data (Snapshots, Backend), Reference (Glossary, Developer, Help).

**FR-280:** On mobile, navigation MUST collapse to a hamburger menu that expands a 2-column grid panel below the header.

### A.18 — Mobile Responsiveness (v4.0)

**FR-281:** The `/explore` page MUST be fully usable on mobile: search bar stacks vertically (button full-width below input), graph height reduces to 380px (vs 540px desktop), MiniMap is hidden below 640px, the details table switches to a card list below 768px.

**FR-282:** The dashboard sticky filter bar MUST NOT cause horizontal scroll on any viewport. Filter pills and action buttons MUST each wrap independently on narrow screens.

### A.19 — P1 Features — Implemented (2026-06-04)

**FR-283 (P1.1 — Done):** The `/developer` page blue side menu includes `🧮 Calculation Reference` as a distinct item in the Reference group. All 24 calculations are documented with: what, data source, why, formula, benefit, alternatives, assumptions, limitations, `usedIn`, and related doc references.

**FR-284 (P1.2 — Done):** "Clear Local Data" is available in Admin Settings (Browser Data tab) and on the Upload page (amber detection banner). Clears all `dc_*` `localStorage`/`sessionStorage` keys after confirmation dialog. Does not touch server-side logs.

**FR-285 (P1.3 — Done):** Dashboard Section Switcher is a sticky tab bar (`DashboardSectionSwitcher`) placed after the main Overview. Supports Full / Overview / single-section modes. Uses `window.scrollTo` with dynamic header+bar offset. `animate-slide-up` + `@media (prefers-reduced-motion)` applied.

### A.20 — v4.1 UX Design System (2026-06-04)

**FR-286:** All interactive buttons throughout the application MUST use the pill button design system defined in `globals.scss`. Primary actions use `btn-primary` (blue, `rounded-full`); secondary/outlined use `btn-secondary`; destructive use `btn-danger` or `btn-outline-danger`; success actions use `btn-green`; low-emphasis use `btn-ghost`.

**FR-287:** Navigation dropdown menus MUST display items with an icon and label in tab-button style. Each item MUST show its icon on the left, label text, and a blue dot indicator when it is the current active page.

**FR-288:** The `/glossary` and `/help` pages MUST each include a sticky section navigation bar (`sticky top-14`) that tracks the active section via `IntersectionObserver` and highlights the corresponding tab. Clicking a tab MUST smooth-scroll to that section with dynamic offset. A "Back to Top" button MUST appear at the page footer.

**FR-289:** The dashboard filter row (All / High Risk / Blocked / Needs Review / Clear / Show filters / Export) MUST be hidden completely when the active dashboard view has `hideFlowPanel: true`. This includes the Executive and Product Owner views. KPI cards that previously linked to the flow panel MUST remove their click handlers when the panel is hidden.

**FR-308 (P3 — Done):** Each collapsible dashboard section trigger MUST display zero or more "status chips" — small rounded badges that summarise the section's state at a glance without expanding it (e.g., "3 blocked", "Updated 2h ago"). Each chip MUST carry one of five severity tiers — `critical`, `warning`, `info`, `good`, or `neutral` (the default when no tier is given) — and MUST be rendered with that tier's distinct colour treatment (red / amber / blue / green / slate respectively) so users can scan section health by colour alone. The tier-to-style mapping MUST be defined in a single shared lookup so all ~16 sections render chips consistently.

**FR-309 (P3 — Done; written 2026-06-08 to resolve a phantom `FR-309` reference in `UC-083` — see TODO-List.md Section 12 Gaps Summary item 6):** On every authenticated page load (`/dashboard`, `/summary`, `/charts`, `/teams`, `/portfolio`, `/readiness`, `/customer`, `/explore`), the client MUST call `GET /api/metrics/latest`, which runs `syncFromCloud()` and reads `data/latest-metrics.json` to return `{ available, metrics, source, provider, key }`. When `available` is true, the client MUST adopt these metrics, persist the source in `dc_metrics_source_v1`, surface it via the header data-source badge, and render the dashboard without requiring a fresh Jira upload. When `available` is false, the client MUST fall back to the `dc_metrics_v2` localStorage cache and label the source "localStorage fallback".

**FR-312 (P2 — Done; written 2026-06-08 to close TRACE-02 / Gaps Summary COVER-06 — the multi-file merge flow had a live route and UI but no FR/UC/TC anchor):** The landing/upload page (`app/page.tsx`) MUST provide a multi-file merge control that accepts 2–10 Jira export files (`.csv`/`.xlsx`/`.xls`, ≤20 MB each) and POSTs them to `POST /api/upload/merge`. The handler MUST: (a) reject requests with 0 files or more than 10 files (HTTP 400), reject any file with an unsupported extension or over the 20 MB cap (HTTP 400, naming the offending file), and reject any file that fails Jira-issue validation (HTTP 422, naming the offending file and listing validation errors); (b) parse every file, then merge the resulting issue arrays via `mergeIssueArrays()` (`src/lib/mergeIssues.ts`), deduplicating by `Issue Key` and — when the same key appears in multiple files — keeping the more informative value per field (non-empty wins over empty; for two non-empty strings, the longer wins); (c) compute `DashboardMetrics` from the merged, deduplicated issue set, persist them via `writeLatestMetrics()`, opportunistically push to cloud storage, and return `{ metrics, warnings, mergeStats }` where `mergeStats` is `{ fileCount, totalBeforeMerge, duplicatesRemoved, uniqueIssues }`. The UI MUST display the merge summary (file count, duplicates removed, unique issues) before redirecting to the dashboard.

**FR-313 (P1 — Done; written 2026-06-08 to close HARD-01/NEXT-06 — Backend Integration Gateway foundation, see TODO-List.md Section 14 GW-01–GW-25):** The system MUST provide a server-only Backend Integration Gateway (`src/server/gateway/`) as the single controlled chokepoint that all *future* outbound calls to external services (Jira, cloud storage, email, Slack, Teams, push notifications, custom HTTP) MUST route through — it is not itself a live integration (no provider is wired up by default; `listRegisteredProviders()` reports every provider as `enabled: false` until its env vars are configured). `callExternal<T>(options)` MUST: (a) resolve the provider's live configuration via `providerRegistry.getProviderConfig()`, which reads env-var name mappings, host-allowlist additions, and an `enabled` kill-switch from `data/gateway-providers.json` (falling back to built-in defaults) — so an operator can remap, extend, or disable any provider with **zero code changes and no redeploy**, while credential *values* are still read from `process.env` at call time only and never persisted to that file; (b) validate the resolved endpoint via `endpointPolicy.validateEndpoint()` before any network attempt — enforcing an https-only protocol allowlist in production, a per-provider host allowlist, SSRF protections (blocking private/internal IP ranges and localhost in production), and raw-string path-traversal detection — returning a structured `{ allowed: false, reason }` (never throwing) on rejection; (c) execute the request with a 10-second timeout, up to 2 retries with exponential backoff on retryable HTTP statuses (`408/429/500/502/503/504`) and network/timeout failures, and no retry on non-retryable statuses (`400/401/403/404/409/422`); (d) log every attempt as a redacted JSON-Lines record appended to `data/gateway-audit.jsonl` (deliberately NOT the `AuditEvent` table — gateway calls are high-volume operational telemetry, not human-readable user-audit events) via `gatewayLogger.logGatewayCall()`, which MUST mask token/key/secret/password/cookie/Authorization/Basic/Bearer/connection-string-shaped substrings before they are ever written; and (e) always return a typed `GatewayResult<T>` (`{ ok, data, error, errorCategory, status, durationMs, retryCount, requestId }`) and never throw. The `GatewayRoutingStrategy` type contract MUST already enumerate `single | round_robin | weighted_round_robin | failover | least_error_rate` so future load-balancing strategies require no breaking type change, even though only `single` is implemented today.

**FR-307 (P3 — Done):** The system MUST provide a cloud storage abstraction layer with a common `StorageProvider` interface (`upload`, `download`, `list`, `delete`, `test`). It MUST implement four providers: Local, AWS S3 (and S3-compatible), Azure Blob Storage, and Google Cloud Storage. Each cloud SDK MUST be loaded dynamically so the app starts without them installed. An admin UI at `/admin/settings → Cloud Storage` MUST allow admins to select the active provider, enter credentials, test connectivity, and manually trigger a backup upload. Settings MUST be persisted to `data/storage-settings.json`; credentials MUST be redacted from API responses.

**FR-306 (P3 — Done):** The `/charts` page MUST provide a Chart Customizer panel that allows users to: (1) toggle visibility of each of the 11 charts; (2) set the column span (1/3, 2/3, or Full width) per chart; (3) reorder charts using up/down controls. All settings MUST persist to `dc_chart_prefs` in localStorage and be applied on every page load. A "Reset" button MUST restore default spans and visibility.

**FR-305 (P3 — Done):** The dashboard MUST provide a Layout Builder panel (accessible via a "Layout" button in the sticky section switcher bar) that allows users to: (1) reorder dashboard sections using up/down controls; (2) toggle section visibility on/off; (3) save their custom layout to `dc_section_layout` in localStorage. The custom order MUST be reflected in the section switcher tab order. Hidden sections MUST be invisible in both the switcher and the dashboard body. A "Reset" button MUST restore the default layout.

**FR-304 (P3 — Done):** The product MUST provide an advanced theme customizer panel accessible from the app header. It MUST allow users to select: (1) accent colour from 7 presets, applied via CSS custom properties that affect `btn-primary` and other accent-coloured elements; (2) corner radius from 3 presets (Sharp/Default/Rounded), applied via `--radius-md` and `--radius-lg` CSS variables; (3) font size from 3 presets (Small/Medium/Large), applied to the `<html>` root element. All settings MUST persist to `dc_theme_custom` in localStorage and be restored on every page load.

**FR-303 (P3 — Done):** The product MUST provide a guided product tour (minimum 8 steps) that highlights key dashboard sections with a pulsing ring and shows a dark popover with title, description, progress dots, and Back/Next/Skip controls. The tour MUST be triggerable from the Overview page ("Take a tour" button) and the Dashboard header ("Tour" button). State MUST be persisted to `dc_tour_dismissed` and `dc_tour_completed` in localStorage. The tour MUST support keyboard navigation (← Back, → Next, Esc Skip) and MUST respect `prefers-reduced-motion`.

**FR-302 (P2 — Done):** All chart labels on the `/charts` page that are visually truncated by CSS MUST use the full, untruncated string as both the CSS-truncated display text and as the `title` attribute tooltip. JavaScript string slicing MUST NOT be used to abbreviate label text before it reaches the DOM — CSS `truncate` class handles visual overflow, and `title` ensures full text is accessible on hover. Sprint Velocity bar labels MAY use short codes (e.g., "S14") for display, but MUST show the full sprint name in the `title` tooltip.

**FR-301 (P2 — Done):** The product MUST provide a `/landing` in-app page that showcases all 12 major features with clickable cards, a 3-step "How it works" section, a 4-stat KPI strip, and a branded CTA footer. The page MUST be accessible from the Reference nav group ("About") and linked from the upload page. Each feature card MUST link directly to the relevant app page.

**FR-300 (P2 — Done):** The login and register pages MUST display the branded logo SVG (`delivery-clarity-logo-horizontal.svg`) instead of plain text. The `app/layout.tsx` metadata MUST include: favicon icons (svg + ico + apple-touch-icon), `themeColor: #2563eb`, OpenGraph tags (title, description, image), and a Twitter card. All HTML report, Executive PDF, and Excel export headers MUST include the brand name, version (v4.1), author (Ali Abu Ras), and email (aliaburas80@gmail.com). The HTML report and PDF MUST include the lightning bolt brand mark SVG in the header.

**FR-299 (P2 — Done):** The system MUST provide a `/admin/diagnostics` page (admin-only) showing a live Ops Health Score (0–100) with weighted penalties for missing SESSION_SECRET (−30), non-production NODE_ENV (−10), open registration (−10), failed imports (−1 each, cap −10), and zero active sessions (−5). The page MUST display: DB row counts (users, sessions, imports, snapshots), import success rate and avg health score, 5 environment variable checks, system info (Node version, platform, uptime), and the last 8 audit events. A `GET /api/admin/diagnostics` endpoint MUST supply this data.

**FR-298 (UX — Done):** The dashboard filter bar buttons (All, High Risk, Blocked, Needs Review, Clear, Show filters, Copy link, Save snapshot) MUST use the same visual style as the section switcher tabs: no border, no pill background, icon + label text, with a coloured bottom-line indicator (3px pill, absolute positioned) for the active filter. Active colours: All=blue, High Risk=red, Blocked=orange, Needs Review=purple. All buttons MUST have `minHeight: 44px` for touch accessibility.

**FR-297 (P2 — Done):** The product MUST include a `product/DEPLOYMENT_GUIDE.md` covering all three deployment targets: Docker (recommended, with docker-compose), VPS/bare-metal (with PM2), and Vercel (preview only). The guide MUST include: environment variable reference, nginx reverse proxy config, SSL setup, post-deploy checklist, backup/restore procedures, and a troubleshooting table. The guide MUST be accessible from the `/developer` in-app page.

**FR-296 (P2 — Done):** The Developer Portal (`/developer`) MUST provide a global search input in the blue sidebar that searches across all calculation names/formulas/descriptions, all package names/descriptions, and all section labels simultaneously. Results MUST be grouped by type (Sections, Calculations, Packages) and clicking a result MUST navigate to the corresponding section and expand/filter the matching item.

**FR-295 (P2 — Done):** Each Smart Recommendation card MUST display an action-owner assignment control. It MUST show a suggested owner (role name from the recommendation engine) as a placeholder. The user MUST be able to assign a custom owner name that is persisted to `localStorage` (`dc_rec_owners`). The assigned owner MUST be displayed as a badge with edit and clear controls. Clearing the field removes the assignment.

**FR-294 (P2 — Done):** The `/summary` page MUST provide an "Executive PDF" button that generates and downloads a print-optimised single-page HTML file (`executive-summary-{date}.html`). The document MUST use A4 landscape layout with 3 columns: (1) health score + KPIs + insights, (2) epic progress + team capacity, (3) top 3 recommendations. All user data MUST be HTML-escaped. No external PDF library is required — the browser print engine is used.

**FR-293 (P2 — Done):** The system MUST provide a `/portfolio` page that aggregates all epics, projects, quarters, and sprint data into a single Portfolio Score (0–100) using the formula: epicAvgCompletion × 0.40 + projectAvgCompletion × 0.30 + sprintAvgCompletion × 0.20 + dataQualityScore × 0.10. The page MUST display: score banner, 6 KPI cards, epic progress panel, project cards, quarter throughput bars, and an epic detail table.

**FR-292 (P2 — Done):** The system MUST provide a `/teams` page that computes and displays a Team Health Score (0–100) per assignee using the formula: (doneIssues/total)×50 + (1−criticalCount/total)×30 + (1−blockedCount/total)×20. The page MUST display: member scorecards, four comparison charts (health score, completion, workload, blocked+critical), and a full detail table. It MUST be accessible from the Analytics nav group.

**FR-291 (P2 — Done):** On every successful upload the system MUST compute a Release Confidence Score (0–100) using the formula: completion rate × 0.55 + (1 − blocked/total) × 25 + (1 − critical/total) × 12 + max(0, 8 − defects × 2). The score MUST be persisted in `ImportLog.metadataJson` as `releaseConfidenceScore` and returned by `GET /api/trends`. The `/trends` page MUST display it as a trend chart, a summary stat card, and a column in the upload log table.

**FR-290 (P2 — Done):** The `/explore` Work Item Explorer MUST provide an Export dropdown button once a graph is loaded. It MUST offer two formats: (1) Excel (.xlsx) — 5-sheet workbook: Summary (focus stats + insights + largest branch), All Issues (all connected nodes + orphans), Risk Items (blocked/critical/risk-path only), Orphans, and Insights; (2) CSV — flat table of all nodes. Files MUST be named `explorer-{key}-{date}.xlsx / .csv`.

**FR-303 (P0 — Done):** The system MUST provide a `/admin/system-errors` page (admin-only) that lists all `SystemErrorLog` entries. Each entry MUST display: error code badge, operation, Prisma model, a human-readable description of the failure cause, a human-readable description of the resolution, the resolution state chip (`logged` / `auto-fixed` / `retried` / `resolved` / `skipped`), retry count, last retried timestamp, and a context label. Unresolved entries MUST show a "Retry operation" button that re-runs the stored payload and a "Dismiss" button that marks the entry resolved. A "Mark all resolved" bulk action MUST be available when unresolved entries exist. The page MUST support filtering by resolution state. A `GET /api/admin/system-errors` endpoint MUST return paginated error logs. A `POST /api/admin/system-errors?action=retry` endpoint MUST re-execute the stored operation. A `PATCH /api/admin/system-errors` endpoint MUST accept `{ id }` (resolve one) or `{ all: true }` (resolve all). The page MUST appear in the admin sidebar navigation.

**FR-302 (P0 — Done):** The admin users table at `/admin/settings → Users` MUST support checkbox-based multi-select. A "select all" checkbox in the table header MUST select all users except the currently authenticated admin. Individual row checkboxes MUST toggle selection. When one or more users are selected a bulk action bar MUST appear offering: "Delete selected" (with a confirmation dialog before execution) and "Change role to…" (a role selector that applies the chosen role to all selected users). The "Delete selected" action MUST cancel any `pending` `UserAddRequest` records for the deleted users' emails before deletion.

**FR-301-sec (P0 — Done):** The system MUST guard against ghost-session foreign-key violations. When an API endpoint performs a database write that references `session.userId`, it MUST first verify the user record exists via a `findUnique` call. If the user no longer exists the endpoint MUST return HTTP 401 with the message "Your account no longer exists. Please sign in again." All `AuditEvent` and `Notification` creation calls MUST use the safe wrappers `safeAuditEvent()` and `safeNotifications()` defined in `src/lib/system-error-logger.ts`; these wrappers automatically retry with `userId: null` on Prisma P2003 errors and log the failure to `SystemErrorLog`. The `DELETE /api/admin/users` handler MUST set the status of all `pending` `UserAddRequest` entries for the deleted user's email to `cancelled` before the deletion query executes.


---

## Addendum B — v4.4 User Add-Member Request Workflow (2026-06-09, P1)

*(Added to close USERREQ-07–14, USERREQ-28 from TODO-List.md Section 15.)*

### B.1 — Prisma Schema: UserAddRequest and Notification Models

**FR-314 (P1 — Done, 2026-06-09):** The Prisma schema MUST include a `UserAddRequest` model with the following fields: `id` (cuid PK), `requestedName` (String), `requestedEmail` (String), `requestedRole` (String — validated against `AppRole`), `reason` (String), `teamOrProject` (String?), `notes` (String?), `status` (String, default `"pending"` — one of: `"pending"`, `"accepted"`, `"rejected"`, `"cancelled"`, `"expired"`), `requestedByUserId` (String FK → User), `adminDecisionById` (String?), `adminDecisionAt` (DateTime?), `adminDecisionNote` (String?), `createdUserId` (String?), `createdAt` (DateTime, now()), `updatedAt` (DateTime, @updatedAt). The User model MUST carry a `userAddRequests UserAddRequest[] @relation("UserAddRequestRequester")` back-reference.

**FR-315 (P1 — Done, 2026-06-09):** The Prisma schema MUST include a `Notification` model with the following fields: `id` (cuid PK), `recipientUserId` (String FK → User), `type` (String — e.g. `"user_add_request_accepted"`, `"user_add_request_rejected"`), `title` (String), `message` (String), `relatedEntityType` (String?), `relatedEntityId` (String?), `readAt` (DateTime?), `createdAt` (DateTime, now()). The User model MUST carry a `notifications Notification[] @relation("UserNotifications")` back-reference.

### B.2 — Requester API

**FR-316 (P1 — Done, 2026-06-09; updated 2026-06-27 — server-side email-format and high-privilege-reason enforcement):** `POST /api/user-add-requests` MUST be authenticated (HTTP 401 for unauthenticated requests). The request body MUST include `requestedName`, `requestedEmail`, `requestedRole`, and `reason` (all required, HTTP 400 if absent). The system MUST: (a) validate `requestedEmail` matches a basic email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), returning HTTP 400 "Please enter a valid email address." if not — this mirrors the existing client-side check in `RequestAddMemberModal.tsx` but is enforced server-side so a direct API call cannot bypass it (TC-REQ-19); (b) validate that `requestedRole` is a member of `ASSIGNABLE_ROLES`; (c) if `requestedRole` is high-privilege (`isHighPrivilegeRole()` in `src/lib/roles.ts` — currently `admin` and `c_level`), require `reason.length >= 20`, returning HTTP 400 "Admin and C-level requests require a detailed justification (at least 20 characters)." if not (TC-REQ-20/TC-REQ-20b); (d) check that no `User` record already exists for the `requestedEmail` (HTTP 409 "An account with this email already exists."); (e) check that no pending `UserAddRequest` already exists for the `requestedEmail` (HTTP 409 "A pending request for this email already exists."); then (f) create the `UserAddRequest` with `status: "pending"` and `requestedByUserId: session.userId`. On success, return HTTP 201 `{ ok: true, request: { id, requestedName, requestedEmail, requestedRole, reason, status, createdAt } }`. MUST write a `user_add_request_submit` `AuditEvent` on success (non-blocking — never fails the request on audit write error; asserted by TC-REQ-01).

**FR-317 (P1 — Done, 2026-06-09):** `GET /api/user-add-requests/mine` MUST be authenticated (HTTP 401 for unauthenticated). Return the calling user's own `UserAddRequest` records ordered by `createdAt` descending (max 50), each serialised as `{ id, requestedName, requestedEmail, requestedRole, reason, teamOrProject, notes, status, adminDecisionAt, adminDecisionNote, createdAt, updatedAt }`. The endpoint MUST NOT return requests belonging to other users.

### B.3 — Admin API

**FR-318 (P1 — Done, 2026-06-09):** `GET /api/admin/user-add-requests` MUST require `session.role === "admin"` (HTTP 401 not authenticated, HTTP 403 non-admin). Returns all `UserAddRequest` rows, each including the `requestedBy` user's `id`, `name`, `email`, and `role`. Accepts an optional `?status=` query parameter to filter by status. Returns max 200 rows ordered by `createdAt` descending.

**FR-319 (P1 — Done, 2026-06-09; updated 2026-06-09 — temp password admin-supplied; updated 2026-06-09 — welcome email added):** `PATCH /api/admin/user-add-requests/:id/accept` MUST require admin. The handler MUST: (a) load the `UserAddRequest` by id (HTTP 404 if not found); (b) verify `status === "pending"` (HTTP 409 if not); (c) re-validate the `requestedRole` is a supported `AppRole` (HTTP 400 if stale); (d) check the `requestedEmail` is not already taken by an existing `User` (HTTP 409 if so); (e) require `tempPassword` in the request body (HTTP 400 "A temporary password is required." if absent; HTTP 400 with strength message if it fails `validatePasswordStrength()` — i.e. < 8 chars, no uppercase, or no digit); (f) create a new `User` with `name`, `email`, `role` from the request and `mustChangePassword: true`, hashing the admin-supplied `tempPassword` at ≥12 bcrypt rounds; (g) update the `UserAddRequest` to `status: "accepted"`, setting `adminDecisionById`, `adminDecisionAt`, `adminDecisionNote` (optional), and `createdUserId`; (h) create a `Notification` for the requester (`type: "user_add_request_accepted"`) embedding the `tempPassword` in the notification message; (i) call `sendEmail()` (FR-325) to deliver a welcome email to `newUser.email` with the `tempPassword` in both plain-text and HTML — this call MUST be wrapped in a `try/catch` and MUST NOT cause the request to fail if SMTP is not configured (graceful degradation); (j) write a `user_add_request_accept` `AuditEvent` (non-blocking); (k) return HTTP 200 `{ ok: true, tempPassword, createdUser: { id, name, email, role, mustChangePassword: true } }` — the `tempPassword` is echoed in the response so the admin queue UI can display and copy it. `PATCH /api/admin/user-add-requests/:id/reject` follows the same auth/validation pattern except it updates `status: "rejected"`, creates a `user_add_request_rejected` notification with an optional `decisionNote` message, and returns `{ ok: true }` without creating a user.

---

## Addendum C — v4.5 USERREQ UI: Request Modal, Admin Queue, Notifications, Bulk User Management (2026-06-09, P1)

*(Added to close USERREQ-02/03/04/05/06/15/16/17/18/19/20/21/22/23/24/26/29/30 from TODO-List.md Section 15.)*

### C.1 — Request Add Member UI

**FR-320 (P1 — Done, 2026-06-09):** The Members page (`/members`) MUST show a "Request add member" button to all authenticated non-admin users (hidden for `role === "admin"`, whose role already has direct access to the Create User form). Clicking the button MUST open `RequestAddMemberModal` — a client-side dialog with the following fields: Full Name (required, String), Email Address (required, valid email format), Requested Role (required, one of `ASSIGNABLE_ROLES + ['user']`), Business Reason (required, String; if the requested role is `admin` or `c_level` the modal MUST display a visible warning and require the reason to be ≥ 20 characters), Team / Project (optional, String), Notes (optional, String). The modal MUST: (a) disable the Submit button while the request is in flight; (b) on `POST /api/user-add-requests` success (HTTP 201), replace the form with a ✅ "Request submitted" confirmation message; (c) on failure, display the server's `error` string inline. On close, the modal unmounts cleanly.

### C.2 — Admin Member Requests Panel

**FR-321 (P1 — Done, 2026-06-09; updated 2026-06-09 — Generate button added):** Admin Settings MUST include a "Member Requests" tab (`id: "requests"`, label "Member Requests", icon "📬") rendered by `UserAddRequestsPanel`. The panel MUST: (a) load requests via `GET /api/admin/user-add-requests` on mount with a default `?status=pending` filter; provide a filter bar (`pending` / `all` / `decided`) and a Refresh button; (b) render each request as an expandable card showing: requested name, email, role badge, status badge, requester name and submission date; (c) when expanded, show full detail (requester email/role, team/project, business reason, notes, decision note if decided); (d) for `status === "pending"` cards, show a **mandatory amber password field** (labelled "Temporary password *") with: a show/hide eye toggle, and a **"Generate" button** that auto-fills a 14-character cryptographically random password (via `generateTempPassword()` using `crypto.getRandomValues`) and sets the field visible so the admin can review it — the field MUST enforce `validatePasswordStrength` rules client-side (≥ 8 chars, ≥ 1 uppercase, ≥ 1 digit) and display inline errors on violation; (e) also show an optional decision-note text input; (f) an Accept (green) button — disabled while the password field is empty or while the request is in flight — that sends `PATCH /api/admin/user-add-requests/[id]/accept` with `{ tempPassword, adminDecisionNote? }` in the body; (g) a Reject (red) button that sends `PATCH /api/admin/user-add-requests/[id]/reject` with `{ adminDecisionNote? }`; (h) after a successful Accept, display a green copyable box showing the `tempPassword` echoed from the server response, with a "Copy" button that writes it to the clipboard; the success message MUST note that a welcome email was sent to the new user and that the requester received the password via in-app notification.

### C.3 — Notification APIs

**FR-322 (P1 — Done, 2026-06-09):** The system MUST expose two notification API routes: (a) `GET /api/notifications` — authenticated (HTTP 401 if not); returns `{ notifications: Notification[] }` for the current session's `userId`, ordered `createdAt` descending, max 50 records, each serialised as `{ id, type, title, message, readAt, createdAt, relatedEntityType, relatedEntityId }`; (b) `PATCH /api/notifications/[id]/read` — authenticated (HTTP 401 if not); loads the `Notification` by `id`; returns HTTP 404 if not found or if `recipientUserId !== session.userId`; sets `readAt` to `new Date()` and returns `{ ok: true }`.

### C.4 — In-App Notification Bell

**FR-323 (P1 — Done, 2026-06-09; updated 2026-06-10 — clickable notification routing + tab deep-link):** The `NotificationBell` component MUST be rendered in the `AppShell` header for all authenticated pages (next to `UserMenu`). The component MUST: (a) poll `GET /api/notifications` every 30 seconds while mounted; (b) for `role === "admin"`, also poll `GET /api/admin/user-add-requests?status=pending` every 30 seconds; (c) display a **red badge** on the bell icon showing `unreadCount + (isAdmin ? pendingRequests : 0)` — hidden when the total is zero; (d) apply a wiggle CSS animation (`animate-wiggle`) to the bell emoji when the badge count is > 0; (e) add a `animate-ping` pulsing ring behind the badge; (f) for admin with `pendingRequests > 0`, render a **persistent amber strip banner** fixed below the navigation header linking to `/admin/settings?tab=requests`; (g) clicking the bell icon opens a dropdown; each notification item MUST: show the appropriate icon (✅/❌/🔔), mark itself read on click, close the dropdown, and **navigate to the contextually correct page** via `router.push()` — `user_add_request_accepted` → `/members` for requester or `/admin/settings?tab=requests` for admin; `user_add_request_rejected` → `/members`; unknown types mark read only with no navigation; navigable items MUST display a `→` arrow hint; (h) a "Mark all read" button bulk-marks all unread notifications; (i) `AdminSettingsPage` (`app/admin/settings/page.tsx`) MUST read the `?tab=` search param via `useSearchParams()` on mount and set the initial tab state — valid values: `users | requests | retention | thresholds | orphan | backup | cloud | browser`; unrecognised values fall back to `'users'`.

### C.5 — Bulk User Management

**FR-324 (P1 — Done, 2026-06-09):** The User Management table in Admin Settings MUST support multi-row selection and bulk operations. Specifically: (a) the first column MUST be a checkbox column — the header cell contains a "select all" checkbox with HTML `indeterminate` state (set when some but not all filtered rows are checked); each data row has a per-row checkbox; (b) selected rows MUST be highlighted (blue background tint `bg-blue-50/60`); (c) the selection set MUST clear automatically when the search query or role filter changes; (d) when `selected.size > 0`, a **bulk action bar** MUST appear above the table showing: the count of selected users, a role dropdown (all ASSIGNABLE_ROLES), a "Change role" button (calls `PATCH /api/admin/users` for each selected user sequentially and updates local state; reports per-user errors without aborting the batch), a "Delete N" button (opens `ConfirmDeleteDialog` then calls `DELETE /api/admin/users` for each selected user and removes from local state), and a "✕ Clear" link to deselect all; (e) the existing delete (🗑) and pause/activate (⏸/▶) action buttons MUST remain visible in the "Status & Actions" column (merged with the status badge) **without requiring horizontal scroll** — the table MUST NOT use `min-w-[880px]` or a separate off-screen Actions column.

---

## Addendum D — v4.5.1 Auto-Generate Password UX + Welcome Email on Accept (2026-06-09, P1)

*(Added to close USERREQ-01 / partial enhancement to FR-319 and FR-321.)*

### D.1 — Password Generation

**FR-319** (see above) and **FR-321** (see above) have been updated. The client-side password generator uses `crypto.getRandomValues(new Uint8Array(32))` (Web Crypto API, available in all modern browsers and Next.js server routes). The server-side `generateTempPassword()` in `src/lib/auth.ts` uses Node's `crypto.randomBytes(32)`. Both produce a 14-character password guaranteed to satisfy `validatePasswordStrength()`: ≥ 2 uppercase, ≥ 2 digits, ≥ 2 special characters (`!@#$%^&*`), remainder drawn from the full combined charset, shuffled via Fisher-Yates. Modulo bias is acceptable at these charset sizes.

### D.2 — Welcome Email

**FR-325 (P1 — Done, 2026-06-09):** When a `UserAddRequest` is accepted the system MUST attempt to send a welcome email to the newly created user's address using `sendEmail()` from `src/lib/email.ts`. The email MUST include: (a) the user's name and email address; (b) the `tempPassword` in both plain-text and HTML body; (c) a link to `/login`; (d) a note that the password must be changed on first login. The sending MUST be **graceful**: wrapped in `try/catch`, never causing the HTTP response to fail. If `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` env vars are absent the utility MUST log a `console.warn` and return without attempting a connection. Configuration is via five env vars: `SMTP_HOST`, `SMTP_PORT` (default `587`), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (default `JiraDashboard <noreply@jiradashboard.local>`). Port 465 uses TLS (`secure: true`); all other ports use STARTTLS. `buildWelcomeEmail(name, email, tempPassword)` produces a reusable `{ subject, text, html }` triple — the HTML is inline-styled for maximum email-client compatibility. The accept route MUST return `emailSent: boolean` in the HTTP 200 response; the admin UI MUST display ✅ "Welcome email sent" or ⚠️ "Email not sent — SMTP not configured" accordingly. The `tempPassword` field MUST NOT appear in the API response — the admin UI reads the password from its own React state (`adminPasswords[id]`).

---

## Addendum E — v4.5.2 Clickable Notifications + Admin Settings Tab Deep-Link (2026-06-10, P1)

*(Added to close remaining USERREQ-01 scope: notification UX completion and admin settings navigation.)*

### E.1 — Clickable Notification Routing

**FR-323** (see C.4 above, updated 2026-06-10). The `resolveNotificationUrl(n, isAdmin)` helper in `NotificationBell.tsx` maps notification types to destination routes. Current routing table:

| `n.type` | Recipient role | Destination |
|---|---|---|
| `user_add_request_accepted` | Requester (non-admin) | `/members` |
| `user_add_request_accepted` | Admin | `/admin/settings?tab=requests` |
| `user_add_request_rejected` | Any | `/members` |
| All other types | Any | No navigation (mark read only) |

A single click on a notification item MUST: (1) mark the notification read (fire-and-forget PATCH); (2) close the dropdown (`setOpen(false)`); (3) navigate to `dest` via `router.push(dest)` if `dest !== null`. Items with a destination MUST show a `→` arrow and use `hover:bg-blue-50` hover state to signal interactivity.

### E.2 — Admin Settings Deep-Link

`AdminSettingsPage` initialises its `tab` state from `useSearchParams().get('tab')` cast to `Tab`. All links from `NotificationBell` (amber banner, dropdown admin panel) now use `/admin/settings?tab=requests` — the hash-based `#requests` anchor is deprecated. Valid `tab` values: `users | requests | retention | thresholds | orphan | backup | cloud | browser`; unrecognised values default to `'users'`.

---

## Addendum F — v4.6 Roadmap, Forecast, Retro Pages + Planning Navigation (2026-06-10, P1)

*(Closes ROADMAP-01, FCAST-01–18, RETRO-01–03/16/18/23–28/31/32, NAV-01/NAV-02.)*

### F.1 — Delivery Roadmap Page (`/roadmap`)

**FR-326 (P1 — Done, 2026-06-10):** The application MUST provide a `/roadmap` page visible to all authenticated roles. The page MUST: (a) load metrics via `loadMetricsWithSource()` and compute portfolio data via `computePortfolioSummary()` from `src/lib/portfolioHealth.ts`; (b) calculate average throughput from `metrics.sprint.sprints[].completedCount` (mean of all sprints with `completedCount > 0`); (c) apply `forecastEpic(epic, avgThroughput)` to each `EpicSummary` to produce an `EpicForecast` — remaining issues, sprints remaining (`remaining / avgThroughput`), weeks remaining (`ceil(sprintsRemaining × 2)`, assuming 2-week sprints), a human forecast label (Complete / Within 2 weeks / ~N weeks / ~N months / Insufficient data), and confidence (high < 2 sprints, medium < 5, low ≥ 5); (d) display four KPI summary cards: Total Epics, Complete, Avg Progress, Critical; (e) show a throughput context strip; (f) provide filter tabs — In Progress / All / Critical / Done; (g) provide sort controls — Forecast / Progress / Name; (h) render each epic as an `EpicCard` with progress bar (colour-coded by health), forecast label, confidence badge, and an expandable detail panel (remaining issues, sprints est., critical count); (i) redirect to `/` if no metrics are available.

**FR-327 (P1 — Done, 2026-06-10):** The `forecastEpic()` function MUST return `forecastLabel: 'Complete'` when `epic.progress >= 100`, `'Insufficient data'` when `avgThroughput <= 0` or `remaining <= 0`, `'Within 2 weeks'` when `weeksRemaining <= 2`, `'~N weeks'` when `weeksRemaining <= 6`, and `'~N months'` otherwise (N = `round(weeksRemaining / 4)`).

### F.2 — Delivery Forecast Page (`/forecast`)

**FR-328 (P1 — Done, 2026-06-10):** The application MUST provide a `/forecast` page visible to all authenticated roles. The page MUST: (a) compute `ForecastResult` from loaded metrics via `computeForecast(metrics)`; (b) calculate status: `complete` if `done >= total`, `insufficient_data` if `avgThroughput <= 0`, `on_track` if `sprintsRemaining <= 6`, `at_risk` if `sprintsRemaining <= 12`, `off_track` otherwise; (c) derive confidence: `high` if `sprintsRemaining < 3`, `medium` if `< 6`, `low` if `>= 6`, `none` if insufficient data; (d) generate `adjustments: string[]` — actionable recommendations based on blocked items, critical count, throughput level, and confidence; (e) build `sprintPoints: SprintPoint[]` for the burn-up chart — each point has actual cumulative done count, plus a forecast extension from the last actual point to the total; (f) display a status banner with icon and description; (g) display KPI row: Total Issues, Done, Remaining, Avg Throughput; (h) render a `BurnUpChart` component — pure inline SVG, no external charting library — showing actual burn-up (solid blue line), forecast extension (dashed blue), and target line (grey dashed); (i) show a "Next Quarter Plan" section: 6 sprints × avgThroughput achievable items vs remaining; (j) show risk signals for blocked count and critical count; (k) list recommendations.

**FR-329 (P1 — Done, 2026-06-10):** The `BurnUpChart` MUST be a pure inline SVG component requiring no external dependency. It MUST use linear `xScale` and `yScale` functions, render gridlines, and plot: the actual burn-up line (solid `#3b82f6`), the forecast extension (dashed `#3b82f6`), and the target horizontal line (dashed `#94a3b8`). The chart MUST gracefully render an empty state when `sprintPoints.length === 0`.

### F.3 — Sprint Retrospective Page (`/retro`)

**FR-330 (P1 — Done, 2026-06-10; upload path completed 2026-06-26):** The application MUST provide a `/retro` page visible to all authenticated roles. The page MUST have five views controlled by local state: (a) **menu** — three-card landing: "Fill in App" (navigates to form view), "Download Template" (triggers client-side `.xlsx` download via `downloadRetroExcelTemplate()`, with a secondary link to the original `.csv` template), "Upload Retro File" (navigates to upload view); (b) **form** — multi-section retrospective form; (c) **insights** — single-record submission result rendered via the shared `InsightPanel`; (d) **upload** — file picker (`.csv`, `.xlsx`, `.xls`, `.md`, `.txt`, max 5 MB); (e) **upload-insights** — preview of every parsed sprint's `InsightPanel`, plus import warnings/corrections, before the user relies on the result. No data is persisted server-side — this is a read-through preview built fresh on each upload.

**FR-331 (P1 — Done, 2026-06-10):** The retro form MUST capture: Sprint Name (required), Team Name, Retro Date (default today), Sprint Goal, Sprint Goal Met (yes / partial / no), What Went Well (multi-entry list), What Did Not Go Well (multi-entry list), Blockers/Impediments (multi-entry list), Action Items (text, owner, due date, priority H/M/L). Each list section MUST support add/remove per entry. The "Submit & Get Suggestions" button MUST be disabled until Sprint Name has a non-empty value.

**FR-332 (P1 — Done, 2026-06-10; superseded 2026-06-26):** ~~On submit, `generateInsights(form)` MUST produce a `string[]` of actionable suggestions...~~ Superseded by FR-356 — the flat-string engine was replaced by the shared `RetrospectiveInsight` engine (`src/services/retro/retroInsights.service.ts`) so the same theme/ownership-gap/duplicate/next-sprint logic applies to both the in-app form and uploaded files. The insights view still displays a goal-status banner and a colour-coded action item summary (red = high, amber = medium, green = low priority).

**FR-333 (P1 — Done, 2026-06-10; template superseded 2026-06-26):** The retrospective template downloaded from `/retro` MUST be an `.xlsx` workbook (FR-357) with the original `.csv` template (Sprint Name, Team Name, Retro Date, Sprint Goal Met, Sprint Goal, What Went Well, What Did Not Go Well, Blocker/Impediment, Action Item, Action Owner, Action Due Date, Action Priority, 2 example rows) still available as a secondary download link.

### F.4 — Planning Navigation Group

**FR-334 (P1 — Done, 2026-06-10):** The `AppShell` header navigation MUST include a top-level **Planning** dropdown group containing: Roadmap (🗺️ `/roadmap`), Forecast (🔮 `/forecast`), Retro (🔄 `/retro`). This group MUST appear between the Delivery group and the Data group. The Delivery group MUST contain: Readiness, Explore, Customer.

**FR-335 (P1 — Done, 2026-06-10):** `allowedRoutePrefixesForRole()` in `src/lib/roles.ts` MUST include `/roadmap`, `/forecast`, and `/retro` for every defined role (`admin`, `scrum_master`, `product_owner`, `manager`, `c_level`, `default/user`). These routes share the `PLANNING_ROUTES` constant.

### F.5 — Help & Glossary Navigation UX

**FR-336 (P1 — Done, 2026-06-10):** The `/help` page navigation MUST replace the flat 34-tab grid with a two-level grouped nav: Row 1 contains 9 category group pills (Getting Started, Dashboard, Planning, Analysis, Export & Data, System, Customization, People, Troubleshooting); Row 2 (shown only when the active group has > 1 section) contains sub-section pills for sections within the active group only. The active group MUST be derived by finding which group contains the current `activeId` (tracked via `IntersectionObserver`). Clicking a group pill MUST scroll to the first section in that group. The `/glossary` page navigation MUST replace the 12-tab pill grid with a compact letter-jump nav: a single row of letter chips (A–L) each showing the section icon and letter; clicking scrolls to the section; hovering shows the full section title via the HTML `title` attribute.

---

## Addendum G — v4.5.1/v4.5.2 ARCH-05 Phase 1: Jira Connection Admin UI (2026-06-20, P1, in progress on `feature/arch-05-jira-integration`, unmerged)

*(Added to close JIRA-04/05/05b/05c from TODO-List.md Section 19a. Design: `product/JIRA_INTEGRATION_DESIGN.md`. Schema-only and API-only prior slices in this same feature — `JiraConnection`/`ImportLog` model additions, the Gateway `baseUrlOverride` enhancement — intentionally have no FR/UC entries per the "no UC for vaporware" principle; this addendum covers only the now-admin-reachable slice. Read-only — no write-back to Jira exists or is planned for this phase. FR-341 (§G.2) revises the original env-var-only auth model after the user explicitly rejected it in favor of the existing encrypted App Config system.)*

### G.1 — Connection Management API

**FR-337 (P1 — Done, 2026-06-20; updated 2026-06-20 — token source moved to encrypted App Config):** `GET /api/admin/jira-connections` and `POST /api/admin/jira-connections` MUST require `session.role === "admin"` (HTTP 401 not authenticated, HTTP 403 non-admin). `POST` MUST validate `name`, `deploymentType` (one of `"cloud"`, `"server"`), and `baseUrl` (a parseable URL) are present (HTTP 400 otherwise); Cloud connections MUST additionally require `authEmail` (HTTP 400 if absent). On success, the system MUST create a `JiraConnection` row and write a `jira_connection_create` `AuditEvent` (non-blocking). `GET` MUST return every connection's fields with `projectFilters`/`fieldMapping` deserialized from their stored JSON, plus a `hasGatewayToken` boolean — the Jira API token/PAT itself MUST NEVER be accepted in the request body or returned in any response; it is resolved via `getJiraApiToken()` (FR-341), never read from `process.env` directly by this route.

**FR-338 (P1 — Done, 2026-06-20; updated 2026-06-20 — token source moved to encrypted App Config):** `POST /api/admin/jira-connections/:id/test` MUST require admin and a connection that exists (HTTP 404 otherwise). It MUST resolve the token via `getJiraApiToken()` (FR-341) and return HTTP 409 if no token is configured (in either encrypted App Config or the `GATEWAY_JIRA_API_TOKEN` env fallback). Otherwise it MUST call `GET /rest/api/3/myself` (Cloud, `Authorization: Basic base64(authEmail:token)`) or `GET /rest/api/2/myself` (Server/DC, `Authorization: Bearer <token>`) through the Backend Integration Gateway's `callExternal()` (FR-313), passing the connection's `baseUrl` as a per-call `baseUrlOverride` and `credentialsPresentOverride: true` (FR-341) rather than relying on the gateway's default env-var checks. On success it MUST update the connection's `lastSyncStatus` to `"success"`, clear `lastSyncError`, and return HTTP 200 `{ ok: true, account }`. On gateway failure it MUST update `lastSyncStatus` to `"failed"` with the gateway's redacted `error` message in `lastSyncError`, and return HTTP 502 `{ ok: false, error, errorCategory }`.

### G.2 — Backend Gateway: Per-Connection Base URL

**FR-339 (P1 — Done, 2026-06-20):** `callExternal()`'s `GatewayRequestOptions` and `getProviderConfig()` (`src/server/gateway/`) MUST accept an optional `baseUrlOverride` and `extraAllowedHosts`, allowing a call site to supply a per-connection base URL instead of relying solely on the provider's single global base-URL env var. This change MUST be additive and backward-compatible: every pre-existing single-argument `getProviderConfig(type)` call site and the full pre-existing `gateway.test.ts` suite MUST continue to pass unmodified.

**FR-341 (P1 — Done, 2026-06-20; updated 2026-06-21 — per-section edit lock + inline test):** The Jira API token/PAT MUST be managed through the same encrypted app-config system as SMTP credentials (`src/lib/app-config.ts`), not a bare environment variable. `AppConfig` MUST include a `jira: { apiToken: string }` field, encrypted into `app-config.json` alongside `smtp`/`appUrl` on save (`PUT /api/admin/app-config`). `SafeAppConfig` MUST expose `hasJiraToken: boolean` without ever returning the token value. `getJiraApiToken()` MUST be the only sanctioned way for server-side code to read the resolved token; it MUST prefer the `GATEWAY_JIRA_API_TOKEN` env var when explicitly set (matching the existing `SMTP_USER`/`SMTP_PASS` env-override precedence for SMTP) and otherwise return the encrypted-config value. Because credential presence is no longer guaranteed to be env-var-only, `GatewayRequestOptions`/`ProviderConfigOverrides` (`src/server/gateway/`) MUST additionally accept an optional `credentialsPresentOverride: boolean` so a caller that resolved a token via `getJiraApiToken()` can tell the gateway's `enabled` check to trust that resolution instead of independently re-checking `process.env`. Admin Settings → App Config MUST expose a "Jira API Token" field using the same masked-password / "leave blank to keep existing" UX as the SMTP password field. Each of the SMTP, Jira API Token, and App URL sections MUST render its inputs disabled until an explicit per-section "Edit" toggle is clicked (visually distinguished with an amber border/ring while unlocked), and MUST re-lock automatically after a successful save. The Jira section MUST additionally expose a "Test token" action (`POST /api/admin/app-config?action=test-jira`) that verifies the in-progress (possibly unsaved) token against the most recently created `JiraConnection`'s `baseUrl`/`deploymentType`/`authEmail` via the same Gateway call as FR-338, returning the connected account name on success or a clear message if no `JiraConnection` exists yet.

### G.3 — Admin UI

**FR-340 (P1 — Done, 2026-06-20; updated 2026-06-20 — token source moved to encrypted App Config):** Admin Settings (`/admin/settings`) MUST expose a "Jira Integration" tab (`?tab=jira`) listing every `JiraConnection` with its name, base URL, deployment type, last sync status badge, and a "Test connection" action that calls FR-338's route and displays the result inline (the account name on success; the exact error message on failure) without a page reload. The tab MUST include a form to create a new connection per FR-337's validation rules, and MUST display a persistent guide explaining where to obtain each field plus a notice that the API token is set via Admin Settings → App Config (FR-341), not through this form. Field-mapping UI is explicitly deferred to a future FR once `JIRA-06`'s `apiAdapter.ts` exists to map fields into.

### G.4 — Manual Sync and Dashboard Fallback Contract

**FR-342 (P1 — Done, 2026-06-21):** `POST /api/admin/jira-connections/:id/sync` MUST require admin and a connection that exists (HTTP 404 otherwise), and MUST resolve the token via `getJiraApiToken()` (HTTP 409 if absent). It MUST build a bounded JQL query from the connection's stored `projectFilters` only — free-text JQL input MUST NEVER be accepted from a request body — and MUST return HTTP 409 (not 502) when the failure occurs before any request reaches Jira (no valid project keys, or a Cloud connection missing its email), distinguishing setup problems from real upstream failures. On a real Gateway/Jira failure it MUST return HTTP 502. Fetched issues MUST be capped at 1000 per sync and MUST be normalized via the JIRA-06 adapter and validated via `validateIssueData()` before anything is written; a validation failure MUST return HTTP 422 and MUST NOT call `writeLatestMetrics()`. On success it MUST call `calculateDashboardMetrics()`, `writeLatestMetrics(metrics, { source: 'jira-api', connectionName, connectionId })` (FR-343), write an `ImportLog` row (`sourceType: "api"`, `jiraConnectionId` set), update the connection's `lastSyncAt`/`lastSyncStatus`/`lastSyncError`, and trigger a non-blocking cloud push. This route MUST be all-or-nothing: any failure path MUST leave the previously published dashboard snapshot completely unchanged.

**FR-343 (P1 — Done, 2026-06-21):** `writeLatestMetrics()` (`src/services/metrics/latestMetricsStorage.ts`) MUST accept an optional `origin: { source: 'file' | 'jira-api', connectionName?, connectionId? }` and persist it alongside the snapshot; omitting it MUST remain valid (backward compatible with snapshots written before this field existed). `GET /api/metrics/latest` MUST surface `source: 'jira-api'` and `connectionName` whenever the latest snapshot's stored origin is `'jira-api'`, taking priority over the route's existing bucket/cache cloud-transport detection. `src/lib/storage.ts`'s `MetricsDataSource` union MUST include `'jira-api'`, and `loadMetricsWithSource()` MUST thread `connectionName` through to `MetricsSourceInfo`. The dashboard MUST render a visible source-status indicator reflecting this — `DataSourceBadge` (`src/components/ui/DataSourceBadge.tsx`), mounted in `DashboardTopbar`'s top-right rail on every `/dashboard/*` route — showing "Jira (ConnectionName) — last synced Xm ago" in full form and "Jira · Xm ago" in compact form, with the full text always available via the `title` attribute. A failed sync (FR-342) MUST NOT alter this indicator or the underlying snapshot in any way.

### G.5 — Admin-Configurable Issue Type Hierarchy

**FR-344 (P1 — Done, 2026-06-22):** Admin Settings MUST expose an "Issue Type Hierarchy" tab listing every configured issue type — built-in or admin-added — with its display label, icon, color, the raw Jira "Issue Type" name(s) it matches, and its hierarchy level (0 = topmost root, increasing values go deeper, e.g. Product → Project → Epic → Story → Sub-task). `GET /api/admin/issue-type-hierarchy` MUST be readable by any logged-in user (the Explore page needs it for every viewer, not just admins); `POST` MUST require admin and MUST reject an empty type list, a non-integer or negative level, a duplicate id, a duplicate raw match name across two types, or the removal of an existing built-in type (built-in types MAY be re-mapped — label, match names, icon, color, and level may all change — but MUST NOT be deletable). The persisted config MUST default safely to `DEFAULT_ISSUE_TYPES` when no config file exists or the stored type list is empty. `src/services/relations/hierarchy.service.ts`'s parent-inference and orphan-detection logic MUST be driven by this configuration rather than a hardcoded type list: an issue with no explicit parent/epic MUST only be inferred a parent from an issue exactly one configured level up sharing its project key prefix (never an arbitrary higher level), and only the configured topmost level MUST be exempt from orphan-flagging by virtue of having no parent. `src/services/relations/relationExplorer.service.ts` and `src/components/explore/nodeStyles.ts` MUST resolve issue type display (label, icon, color) from this same configuration, with `'Unknown'` as the only hardcoded fallback for a raw type matching no configured definition.

### G.6 — Dashboard-Wide Manual Jira Sync

**FR-345 (P1 — Done, 2026-06-22):** A "Sync Jira" action MUST be available on every `/dashboard/*` route to any logged-in user, regardless of role — `POST /api/jira/sync` MUST require only `session.isLoggedIn`, with no role check. It MUST auto-resolve which `JiraConnection` to sync without requiring the caller to specify one: the connection with the most recent `lastSyncAt`, falling back to the most recently created connection when none has ever synced. When no `JiraConnection` exists at all, it MUST return HTTP 404 with a message directing the user to an admin. The sync execution itself (token resolution, Gateway fetch, normalization, validation, metrics calculation, `writeLatestMetrics()`, `ImportLog` write, connection status update) MUST be the same all-or-nothing implementation used by the existing admin-only `POST /api/admin/jira-connections/:id/sync` route (FR-342) — both routes MUST call one shared implementation rather than maintaining independent copies. The Jira API token MUST NOT be exposed to the client through this route at any point.

## Addendum H — v4.10.0 Role-Based Delivery Coaching Insights (2026-06-23, P1)

*(Closes `RBC-01`–`RBC-20` from TODO-List.md Section 16. Pure interpretation layer over the already-computed `DashboardMetrics` — no new domain calculations are introduced; this addendum only adds advice-generation logic and a new dashboard route. Per-role coaching personas are content *categories*, not new `AppRole` values — see §H.1.)*

### H.1 — Role → Category Mapping

**FR-346 (P1 — Done, 2026-06-23):** The system MUST define 7 coaching content categories (`scrum_master`, `product_owner`, `engineering_manager`, `delivery_manager`, `team_lead`, `c_level`, `admin`) distinct from the 6-value `AppRole` enum (`src/lib/roles.ts`), because `manager` is a single `AppRole` that must surface 3 categories. `visibleCategoriesForRole()` (`src/services/coaching/coachingOrchestrator.service.ts`) MUST map: `scrum_master`→`[scrum_master]`; `product_owner`→`[product_owner]`; `manager`→`[engineering_manager, delivery_manager, team_lead]` (Engineering Manager first, matching `defaultDashboardViewForRole()`'s existing EM-first precedent for `manager`); `c_level`→`[c_level]`; `admin`→ all 7 categories; `user` and any unrecognized role → `[team_lead]` (generic contributor default). This mapping MUST NOT require any change to `AppRole`, `User.role`, or existing role-gating logic elsewhere in the app.

### H.2 — Insight Generation

**FR-347 (P1 — Done, 2026-06-23):** Each of the 7 categories MUST have its own pure generator function (`src/services/coaching/generators/*.generator.ts`) accepting the already-computed `DashboardMetrics` and a shared `CeremonyAdvice` object, and returning a `RoleBasedCoachingInsight` (`src/types/roleBasedCoaching.ts`) with: `category`, `healthSummary`, `weakPoints`, `focusAreas`, `recommendedActions`, `preventionAdvice`, `ceremonyAdvice`, `nextSprintSuggestions`, `evidence` (each entry citing a real metric value, never generic text), `severity` (reusing the existing `CheckSeverity` union from `src/types/dataQuality.ts`), and `confidence` (FR-349). Generators MUST NOT perform new metric calculations — only interpretation of fields already present on `DashboardMetrics` (`flow`, `throughput`, `relations`, `capacity`, `risk`, `dataQuality`, `confidence`, `healthScore`, `overallDeliveryConfidence`, `prediction`). The Admin category (`admin.generator.ts`) MAY additionally consume a small operational signal set (FR-348) not derived from `DashboardMetrics`.

**FR-348 (P1 — Done, 2026-06-23):** `GET /api/coaching/admin-signals` MUST require `session.role === "admin"` (HTTP 401/403 otherwise) and return `{ unresolvedErrorCount, storageProvider, cloudSyncOk, cloudSyncFetchedAt }`, computed read-only from existing infrastructure: `prisma.systemErrorLog.count({ where: { resolvedAt: null } })` (same query shape as the existing System Error Log admin route), `readStorageSettings().active` for the provider name, and `getCacheMeta()` (read-only, no network I/O — never `syncFromCloud()`, which would trigger an actual sync) for cloud-sync freshness, treated stale beyond 24 hours for non-local providers. These signals MUST be optional input to `generateAdminInsight()` — when absent, the Admin category MUST omit that evidence rather than fabricate it.

### H.3 — Ceremony Advice

**FR-349 (P1 — Done, 2026-06-23):** `buildCeremonyAdvice(metrics)` (`src/services/coaching/ceremonyAdvice.service.ts`) MUST compute a single `CeremonyAdvice` object (5 ceremony lists: daily standup, refinement, sprint planning, sprint review, retrospective) once per request and embed it identically into every category visible to the requesting role — these are team-wide cadence rules, not role-specific content. Each underlying rule MUST return a sentence only when its trigger condition is actually met in the data (e.g. blocked items present, aging WIP > 0, declining throughput trend, Weak/Critical data quality, Low/Unreliable metric confidence, sprint goal not met, repeated carryover) and MUST cite the real number that triggered it; a rule that does not fire MUST contribute nothing — the system MUST NEVER emit a generic or placeholder ceremony recommendation.

### H.4 — Confidence and Severity

**FR-350 (P1 — Done, 2026-06-23):** `aggregateCategoryConfidence(metrics, relevantKeys)` (`src/services/coaching/coachingConfidence.service.ts`) MUST average the `confidence` value of the given subset of `MetricConfidenceMap` entries, then apply a data-quality downgrade multiplier of ×0.75 when `dataQuality.band === 'Weak'` or ×0.5 when `'Critical'` (×1 otherwise — see `product/ALGORITHM_SPEC.md` "Role-Based Coaching Confidence Score" for the full documented formula), then re-derive the band using the same thresholds as `metricConfidence.service.ts` (≥80 High, ≥60 Medium, ≥40 Low, else Unreliable; sample size 0 across all relevant keys → `'N/A'`). The result MUST include a `reason` string naming the worst-contributing metric and the data-quality band with real numbers; when the band is `'N/A'`, `reason` MUST be a safe-fallback message containing no fabricated percentage.

**FR-351 (P1 — Done, 2026-06-23):** `deriveSeverity(weakPointCount, confidenceScore, criticalSignalPresent)` (`src/lib/coachingBadge.ts`) MUST return `'critical'` when a category-defined critical signal is present (e.g. simultaneous blockers and aging WIP for Scrum Master, a Critical data-quality band for Admin), `'high'` when 3 or more weak points exist, `'medium'` when at least one weak point exists or confidence is below 60, and `'low'` otherwise. `severityToBadgeVariant()` MUST map this to the existing `Badge` component's variant prop (`critical→danger, high→warning, medium→info, low→success`) — business logic MUST NOT return raw colors (CLAUDE.md §28).

### H.5 — Dashboard UI

**FR-352 (P1 — Done, 2026-06-23):** `/dashboard/coaching` MUST be reachable by every `AppRole` (category filtering happens inside the page via FR-346, not by hiding the nav entry) and MUST: fetch `DashboardMetrics` via the existing `loadMetricsWithSource()` client helper and the current role via the existing `GET /api/auth/me`, additionally fetching `GET /api/coaching/admin-signals` only when the resolved role is `admin`; render a `CoachingCategoryTabs` strip only when more than one category is visible to the role (i.e. for `manager` and `admin`); render one `CoachingInsightCard` per the active category showing the severity badge, health summary, weak points, focus areas, evidence panel, recommended actions, prevention advice, ceremony advice (only non-empty ceremony sub-lists), next-sprint suggestions, and a confidence chip (showing the literal "Not available" fallback copy, never a fabricated number, when the band is `'N/A'`). The route MUST be registered in `DashboardNavSidebar.tsx`'s `ROUTE_ACCESS` map for all 6 roles.

## Addendum H.6 — v4.10.1 Coaching Insights Redesign & Encouragement Enhancements (2026-06-26, P1)

*(Closes `RBC-21`–`RBC-26` from TODO-List.md Section 16. Presentation redesign of the FR-352 page plus two small derived-data additions (FR-353 trend, FR-354 evidence routing) — no coaching generator, confidence formula (FR-350), or severity rule (FR-351) is changed by this addendum.)*

**FR-353 (P1 — Done, 2026-06-26):** The Coaching Insights hero banner MUST display a severity-trend indicator (improved/worsened/unchanged) whenever the requesting user has at least 2 saved `DashboardSnapshot` records. `computeSeverityTrend(current, previous)` (`src/services/coaching/coachingTrend.service.ts`) MUST compare `SEVERITY_RANK` (`src/lib/coachingBadge.ts`; critical=0, high=1, medium=2, low=3) between the category's current severity and its severity when `generateAllCoachingInsights()` is re-run against the metrics of the user's second-most-recent saved snapshot (`GET /api/snapshots` ordered newest-first, then `GET /api/snapshots/:id`). This MUST reuse the existing Snapshots feature and Prisma `DashboardSnapshot` model — no new persistence MUST be introduced. When fewer than 2 snapshots exist, or either fetch fails, the trend indicator MUST be silently omitted (never a fabricated "unchanged" default). Category tabs MUST also sort by `SEVERITY_RANK` ascending (most urgent first) and any non-active tab whose severity is `high` or `critical` MUST show a small nudge dot, so urgency is visible without opening every tab.

**FR-354 (P1 — Done, 2026-06-26):** Each coaching evidence chip's `metricKey` MUST be resolved against a static metric-family-to-route lookup (`resolveEvidenceRoute()`, `src/lib/coachingEvidenceLink.ts`) covering `flow.*` → `/dashboard/flow-health`, `throughput.kanban.*` → `/dashboard/kanban-health`, `throughput.sprint.*` → `/dashboard/sprint-status`, `relations.*`/`risk.overdueIssues` → `/dashboard/priority-attention`, `risk.highPriorityOpenIssues`/`prediction.*`/`overallDeliveryConfidence` → `/dashboard/delivery-controls`, `capacity*` → `/dashboard/ownership`, `dataQuality.*` → `/dashboard/data-quality`, `epics[].*` → `/dashboard/epic-readiness`, and `adminSignals.*`/`healthScore`/`completionRate` → `/dashboard/summary`. When a route resolves, the evidence chip MUST render as a navigable link to that route; when no prefix matches, the chip MUST remain non-interactive (tooltip-only), matching its FR-352 behavior. This mapping MUST NOT alter `CoachingEvidence` or any generator's evidence content.

---

## Addendum I — v4.7 Retrospective Upload, Insights Engine, and `.xlsx` Template (2026-06-26, P2)

*(Closes `RETRO-04`–`RETRO-13`, `RETRO-17`, `RETRO-19`–`RETRO-22`, `RETRO-29`, `RETRO-33`–`RETRO-38` from TODO-List.md Section 17. Persistence (`RETRO-15`, `RETRO-30` save-draft) and metric-linking (`RETRO-14`) remain out of scope — see the documentation impact matrix below.)*

### I.1 — File Upload and Parsing

**FR-355 (P2 — Done, 2026-06-26):** `/retro`'s "Upload Retro File" card MUST navigate to an upload view accepting `.csv`, `.xlsx`, `.xls`, `.md`, and `.txt` files up to 5 MB, POSTing to `POST /api/retro/parse` (session-authenticated, 401 if not logged in). `parseRetroFile(buffer, filename)` (`src/services/retro/retroFileParser.service.ts`) MUST: for `.csv`, use a dedicated RFC4180-style parser rather than the `xlsx` library, because `XLSX.read()` silently reformats ISO-date-like strings (e.g. "2026-06-08") into a locale date string when reading CSV text — a correctness bug discovered during implementation; for `.xlsx`/`.xls`, use `XLSX.read()` (binary cell types are accurate there); for `.md`/`.txt`, use a heading + bullet heuristic (FR-356a). Column headers MUST be canonicalized via an alias map covering both this template's headers and the RETRO-05 spec's naming (e.g. "Blockers" and "Blocker/Impediment" both map to `Blocker`). A row with a non-empty "Sprint Name" cell starts a new `RetroRecord`; a row with a blank "Sprint Name" carries the previous row's sprint forward (matching the existing template's multi-row-per-sprint shape) and appends its observation/action fields to that record. Rows appearing before any Sprint Name has been seen are skipped and logged as a `RetroDataCorrection` (never silently dropped without a trace — CLAUDE.md §33). Missing the "Sprint Name" column entirely MUST return 422 with no records. A record with a Sprint Name but zero observations/actions MUST produce a warning, not an error.

**FR-356a (P2 — Done, 2026-06-26):** For `.md`/`.txt` uploads, the parser MUST extract a Sprint Name from a `Sprint Name: ...` or `Sprint: ...` line (case-insensitive), and group bullet lines (`-`, `*`, `•`, or numbered) under the nearest preceding heading matching "went well" → `wentWell`, "did(n't/ not) go well" → `didntGoWell`, "blocker"/"impediment" → `blockers`, "action item"/"next step" → `actions`. Headings are recognised as markdown (`#`/`##`) or a line ending in `:`. If no Sprint Name is found, the record MUST default to `sprintName: 'Untitled Retrospective'` and the parser MUST emit a warning advising the user to verify the preview — this is heuristic parsing, not guaranteed-accurate extraction, and must never silently claim false confidence.

### I.2 — Insights Engine

**FR-356 (P2 — Done, 2026-06-26; corrected 2026-06-26):** `generateRetrospectiveInsight(record, source, repeatedBlockers?)` (`src/services/retro/retroInsights.service.ts`) MUST produce a `RetrospectiveInsight` (`src/types/retrospective.ts`) shared by both the in-app form (one record) and the uploaded-file flow (one or many records), replacing the original flat `string[]` `generateInsights()` (FR-332). It MUST compute: (a) **themes** — keyword-matched categories (process, communication, requirements, qa-release, dependency, technical, planning) over `didntGoWell`+`blockers` text only — **`wentWell` MUST NOT be included**; a bug found shortly after initial release ran theme matching over `wentWell` too, so positive feedback (e.g. "Automated tests caught regressions") was flagged as a "qa-release" theme and then cited in suggestions as something to "address," which user-tested as actively misleading ("retro report not useful") — sorted by match count descending; (b) **ownershipGaps** — action items missing an owner and/or a due date; (c) **duplicateActionItems** — action item text appearing more than once (trimmed, case-insensitive); (d) **nextSprintSuggestions** — free-text ceremony/process advice gated by real signals only: goal not met/partial → re-plan advice, blocker count > 0 → address-blockers advice citing the count, a detected top theme → advice citing the theme's display label, match count, and the actual triggering example sentence (not just the raw category slug); (e) **ceremonyRecommendations** — daily-standup/sprint-planning/retrospective advice gated by blockers/ownership-gaps/pain-points respectively; (f) **confidence** (`high`/`medium`/`low`) derived from how many of `[sprintGoal, goalMet, ...wentWell, ...didntGoWell, ...blockers]` are non-empty (≥4 high, ≥2 medium, else low — `wentWell` IS included here, since more filled-in fields means more reliable input regardless of sentiment). `detectRepeatedBlockers(records)` MUST flag any blocker (trimmed, case-insensitive) appearing in more than one record's de-duplicated blocker set — this signal only exists for multi-record uploads and is embedded identically into every record's insight, the same "compute once, embed everywhere" pattern as the Coaching ceremony advice (FR-349).

**FR-356b (P2 — Done, 2026-06-26; restructured 2026-06-26):** `generateRetrospectiveInsight()` MUST also produce `suggestedBacklogItems: SuggestedBacklogItem[]` — concrete, copy-pasteable story/task/spike suggestions distinct from the free-text `nextSprintSuggestions`, each with `type` (`'story' | 'task' | 'spike'`), `title`, `description`, `evidence`, and `priority`. `description` MUST be written as a standard backlog item body, not a sentence describing the suggestion: for `'story'` items, an "As a team, we want ... so that ..." statement plus an "Acceptance criteria: ..." line; for `'task'`/`'spike'` items, a "Task: ..."/"Spike: ..." action statement plus an "Acceptance criteria: ..."/"Goal: ..." line. `evidence` MUST hold the real retro signal that triggered the suggestion (a quoted blocker/observation, or a mention count) separately from `description`, so the description itself reads like a normal backlog item rather than retro commentary. Every item MUST be traceable to a real signal, never a generic placeholder: a non-repeated blocker → a `'task'` titled `Resolve blocker: "<text>"` (`priority: 'high'`); a blocker present in `repeatedBlockers` → a `'spike'` titled `Investigate root cause: "<text>"` instead of (not in addition to) the resolve task, because escalating to root-cause investigation is the correct next step once a workaround has already failed to stick; the top detected theme → a `'story'` titled `Improve: <THEME_LABEL>` whose `evidence` cites the match count and the actual triggering example sentence (`priority: 'high'` if count ≥ 2, else `'medium'`); `goalMet === 'no'` → a `'spike'` titled `Investigate why the sprint goal was not met` whose `evidence` includes the sprint goal text when present. A retrospective with no blockers, no detected themes, and a met/partial goal MUST produce an empty `suggestedBacklogItems` array, not fabricated suggestions. The UI (`InsightPanel`'s "Suggested Stories & Tasks for Next Sprint" section) renders `description` as the card body, `evidence` as a smaller italic line beneath it, and a Copy button that copies `title` + `description` + `evidence` together; no Jira ticket is created — this remains copy-paste only, consistent with Jira write-back being an explicit P3 roadmap item, not delivered here.

### I.3 — Template

**FR-357 (P2 — Done, 2026-06-26):** `downloadRetroExcelTemplate()` (`src/services/retro/retroTemplate.service.ts`) MUST generate a 2-sheet `.xlsx` workbook client-side (same `XLSX.writeFile()` pattern as `exportExplorerToExcel()`): a "Retrospective" sheet (header row + 4 example rows covering carryover/large-story, late-discovered-blocker, and mid-sprint-scope-change scenarios) and an "Instructions" sheet (how to fill it in, required vs. recommended fields, what happens after upload, and a privacy note advising against uploading customer names or confidential information). The original `.csv` template (FR-333) remains available as a secondary link on the same card.

### I.4 — Scope Note

**FR-358 (P2 — Deferred):** Saving a retrospective record server-side (`RETRO-15`), a "save draft" affordance (`RETRO-30`), and linking retro items to delivery metrics (`RETRO-14`, e.g. carryover ↔ retro theme) are explicitly deferred — this addendum is upload, parsing, and insight-generation only, with no new persistence model. They remain open P2 items in TODO-List.md Section 17.

---

## Addendum J — v4.6.1 Forecast Engine Extraction, Data-Quality-Aware Confidence, Risk Diagnosis, and New Charts (2026-06-27, P2)

*(Closes `FCAST-14`–`FCAST-26` from TODO-List.md Section 18. The forecast page already had more chart coverage than the original spec anticipated — burn-up, burn-down, velocity, sprint performance table, delivery pattern breakdown, delivery levers, next-quarter plan — so this addendum focuses on the genuine gaps: zero test coverage, confidence that ignored Data Quality, no "why" diagnosis, and two new charts, consolidating the originally-separate `FCAST-15`/`16`/`17` chart requests into one to avoid tripling chart density on an already-long page.)*

### J.1 — Forecast Engine Extraction

**FR-359 (P2 — Done, 2026-06-27):** `computeForecast(metrics)` MUST be extracted from `app/forecast/page.tsx` into `src/services/forecast/forecastEngine.service.ts`, with its types (`ForecastResult`, `ForecastStatus`, `SprintPoint`, `WeakestFactor`, `WeakestFactorKind`) in `src/types/forecast.ts` — mirroring the `src/services/retro/retroInsights.service.ts` extraction precedent. This is required to satisfy FCAST-24 (tests) without either importing a `'use client'` page module into Jest or duplicating ~75 lines of business logic inside a test file (CLAUDE.md §29, "Calculation Single Source of Truth"). The page's behavior MUST NOT change as a result of the extraction — confirmed via the pre-existing manual test cases (`TC-FCAST-01`–`05`) and a full visual comparison.

### J.2 — Data-Quality-Aware Confidence and Risk Diagnosis

**FR-360 (P2 — Done, 2026-06-27):** `computeForecast()` MUST fold `metrics.dataQuality` and `metrics.confidence` into forecast confidence, not just sprint count/velocity-trend/blocked-count as before. It MUST: (a) compute a structural score from sprint count/velocity-trend/blocked-count (90/65/35); (b) average `metrics.confidence.sprintThroughput` and `metrics.confidence.velocity` into a metric score; (c) blend the two scores and apply the same data-quality downgrade multipliers as the Coaching Confidence Score (×0.75 Weak, ×0.5 Critical — `product/ALGORITHM_SPEC.md`), reused as a documented formula rather than duplicated invention; (d) re-derive the `high`/`medium`/`low` band from the blended score (≥70/≥40/else); (e) produce a `confidenceReason: string` citing real numbers (sprint count, velocity trend, Data Quality band/score) — never generic, never silent about a downgrade.

**FR-361 (P2 — Done, 2026-06-27):** `computeForecast()` MUST produce a `weakestFactor: WeakestFactor` identifying the single most significant drag on the forecast, checked in priority order: `blockedCount > 3` → `'blockers'`; `criticalCount > 2` → `'blockers'`; total recent added scope `> avgThroughput × 2` → `'scope'`; a Data Quality downgrade applied → `'data_quality'`; declining velocity trend → `'throughput'`; otherwise → `'none'` with a reassuring detail, never a fabricated risk. Each non-`'none'` kind MUST cite the real triggering number. Rendered in the UI as a "Forecast Diagnosis" card (`/forecast`, `data-kind` attribute drives the tone) directly answering "are we on track, and why?" (FCAST-19/20).

**FR-362 (P2 — Done, 2026-06-27):** `adjustments: string[]` MUST gain two new rules beyond the pre-existing set, each gated by a real signal: heavy mid-sprint scope addition (`addedScope > avgThroughput × 2`) → tighten scope-discipline advice; an active Data Quality downgrade → improve-data-quality advice naming the current band. This extends FCAST-21's adjustment categories (scope, data quality) beyond the pre-existing blockers/critical/throughput-trend/descope set.

### J.3 — New Charts

**FR-363 (P2 — Done, 2026-06-27):** `/forecast` MUST render a "Throughput: Required vs. Current" comparison (FCAST-14) — two horizontal bars: current average throughput, and the throughput required to be on-track within 6 sprints at current remaining scope (`remainingIssues / 6`), with a one-line gap summary. Hidden when `status === 'complete'`.

**FR-364 (P2 — Done, 2026-06-27):** `/forecast` MUST render a "Risk & Scope Trend" grouped-bar chart (consolidating FCAST-15/16/17) showing per-sprint mid-sprint-added-scope count and blocked-item count across up to the last 12 sprints, sourced from `SprintThroughput.addedScopeCount`/`blockedCount` (only available with rich `SprintThroughputSummary` data — empty array, and the section hidden, when only the legacy 8-sprint-capped shape is available). Requires ≥2 sprints of rich data to render; otherwise shows the same "Need ≥ 2 sprints" empty state convention as the existing `BurnUpChart`/`CombinedBurnChart`.
