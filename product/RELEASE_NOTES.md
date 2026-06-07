# Delivery Clarity — Release Notes

**Brand:** Ali Delivery Intelligence  
**Slogan:** From messy boards to measurable delivery confidence

---

## v4.2.2 — TRACE-01 Cluster #3 Closure: Smart Excel Export Sheets & Trigger (2026-06-08, P0 — documentation + test coverage)

### Closed TRACE-01 gap cluster #3 — F4-05/06/08 (Smart Excel export Risks & Blockers / Orphan & Data Quality / Cycle & Lead Time / Release Readiness sheets, plus the export-trigger flow)
- **Added two new SRS requirements** to `product/SRS.md` immediately after `FR-241`, formally documenting behaviours that were already implemented and shipped but never written up: **`FR-242`** (the Risks & Blockers, Orphan & Data Quality, Cycle & Lead Time, and Release Readiness sheets must each derive their content directly from the in-memory `DashboardMetrics.flow.items` — covering sort order, suggested-action tiers, summary/detail rows, percentile math, and Go/Conditional-Go/No-Go grouping) and **`FR-243`** (the dashboard sticky bar and the `/summary` page must each expose an Export control that triggers the 17-sheet smart workbook download under the default filename `delivery-clarity-report.xlsx`, and silently record the `download_report` onboarding step without blocking the export if tracking is unavailable).
- **Added `UC-089`** (Trigger and Review the Smart Excel Workbook from the Dashboard or Summary Page) to `product/USE_CASES.md` — Main Flow walks through triggering the export and reviewing each of the four previously-undocumented sheets in turn; Alt Flow A covers a healthy dataset with no risks or orphans; Alt Flow B covers onboarding-tracking unavailability. Related FRs: `FR-236`, `FR-242`, `FR-243`.
- **Added `SCN-045`** (Product Owner Exports the Smart Workbook for an Offline Release Review) to `product/SCENARIOS.md` — a single narrative session that walks through triggering the export, then reading the Risks & Blockers, Orphan & Data Quality, Cycle & Lead Time, and Release Readiness sheets, ending with forwarding the file to stakeholders — closing the SCN/UJ gaps for `F4-05`, `F4-06`, and `F4-08`.
- **Added `UJ-029`** (Product Owner Exports and Reads the Smart Workbook for an Offline Review) to `product/USER_JOURNEYS.md` Section 12, mapping the same flow step-by-step with emotional-state annotations.
- **Wrote and automated 10 new test cases `TC-X-09a`–`TC-X-13b`** in new `src/__tests__/excelExportSheets.test.ts`, exercising the pure `buildInsightWorkbook(metrics)` orchestrator directly: `TC-X-09a/b` cover the Risks & Blockers sheet's critical→warning→good sort order, suggested-action tiers, and clean-bill-of-health empty state; `TC-X-10a/b/c` cover the Orphan & Data Quality sheet's summary counts/percentages, orphan detail rows, and complete-hierarchy empty state; `TC-X-11a/b` cover the Cycle & Lead Time sheet's P50/P75/P85/P95/Average percentile math (verified against a hand-computable 1–10 day fixture) and slowest-items ranking; `TC-X-12` covers the Release Readiness sheet's Go/Conditional-Go/No-Go grouping across three Fix Version cohorts; `TC-X-13`/`TC-X-13b` cover the `exportToExcel` trigger producing a 17-sheet workbook under the default filename `delivery-clarity-report.xlsx` and honoring a custom filename. A `jest.mock('xlsx', ...)` wrapper around `XLSX.writeFile` was used to intercept the real disk write (a `jest.spyOn` attempt failed with "Cannot redefine property: writeFile" since the export isn't configurable).
- **Discovered and corrected a stale `product/TEST_CASES.md` table**: the `F4 — Excel Export Tests` section described 6 *manual, Not Run* cases (`TC-X-01`–`06`) that didn't match the 8 cases already automated in `excelExport.test.ts` (which uses sub-IDs like `TC-X-01b`, `TC-X-02a/b/c`, `TC-X-07`, `TC-X-08`). Replaced it with a corrected table listing all 18 real `TC-X-01`–`13b` cases as ✅ Pass.
- Test suite count rose from **498 tests / 53 suites → 508 tests / 54 suites** (1 new file, 10 new tests). `npm run lint` and `npm run build` remain clean.
- Updated the `F4-05/06/08` rows, `F4-TRACE`, and Gaps Summary item 3 in `TODO-List.md` Section 12 to reflect that **TRACE-01 gap cluster #3 is now fully closed** — documentation anchoring, stale-table correction, and test automation all complete in one pass.

---

## v4.2.2 — TRACE-01 Cluster #2 Closure: Work Item Explorer Risk & Branch Insights (2026-06-08, P0 — documentation + test coverage)

### Closed TRACE-01 gap cluster #2 — F2-05/06/07/09/11/12/13 (Work Item Explorer visuals, filters, and "Needs verification" items)
- **Added four new SRS requirements** to `product/SRS.md` immediately after `FR-225`, formally documenting behaviours that were already implemented and shipped but never written up: **`FR-225A`** (relation-graph field accessors must resolve both raw JiraIssue export field names and normalized FlowItem field names), **`FR-225B`** (risk-path highlight — mark every node/edge from a blocked-or-critical, not-done node up to the root), **`FR-225C`** (largest-unfinished-branch insight — identify and badge the direct child subtree with the most open items, plus its stats card), **`FR-225D`** (blocked-branch filter toggle that narrows and dims the graph/table to the at-risk subset).
- **Added `UC-088`** (Investigate Delivery Risk and Branch Health in the Work Item Explorer) to `product/USE_CASES.md` — Main Flow covers risk-path/largest-branch/filter end to end; Alt Flow A covers the no-risk dataset case; Alt Flow B documents the dual raw/FlowItem field-format compatibility behaviour. Related FRs: `FR-225A–D`.
- **Added `SCN-044`** (Delivery Manager Reads the Visual Graph and Filters to Risk) to `product/SCENARIOS.md` — a single narrative session that walks through node styles per issue type, the orphan badge/dashed-border treatment, the legend/insight-panel/stats-cards/details-table quartet, the risk-path glow, the largest-branch badge, and the blocked-branch filter together — closing the SCN/UJ gaps for `F2-05`, `F2-06`, and `F2-07` as well as `F2-11/12/13`.
- **Added `UJ-028`** (Delivery Manager Investigates Risk Paths and Branch Health in the Explorer) to `product/USER_JOURNEYS.md` Section 11, mapping the same flow step-by-step with emotional-state annotations.
- **Re-verified the three "Needs verification" items at the code level**: read `computeRiskPaths()`, `computeLargestUnfinishedBranch()` (both in `relationExplorer.service.ts`), and the `ExplorePage`/`WorkItemGraph` `dimNonRiskPath` filter/dimming logic line by line against their documented behaviour, and re-ran the existing `riskPath.test.ts`/`largestBranch.test.ts`/`blockedBranchFilter.test.ts` suites (24 tests, all passing). **`F2-11`, `F2-12`, `F2-13` move from 🔍 Needs verification to ✅ Done.**
- **Wrote and automated 6 new test cases `TC-FF-01`–`TC-FF-06`** in new `src/__tests__/fieldFormatCompat.test.ts`, exercising `buildRelationGraph()` against fixtures that use *only* raw JiraIssue field names, *only* FlowItem field names, and a *mixed* dataset — proving `issueKey`/`type`/`summary`/`isDone`/`isBlocked`/`parentKey`/hierarchy-depth resolve identically either way, and that risk-path computation correctly walks across a mixed-format hierarchy. No code extraction was needed — the field accessors `f()`/`getIssueKey()`/`isDone()`/`isBlocked()` in `relationExplorer.service.ts` and `getKey()`/`getEpicLink()`/`getParentKey()` in `hierarchy.service.ts` were already pure and reachable through the exported `buildRelationGraph()`.
- Test suite count rose from **492 tests / 52 suites → 498 tests / 53 suites** (1 new file, 6 new tests). `npm run lint` and `npm run build` remain clean.
- Updated `product/TEST_CASES.md` with `**Related:**` cross-references on the `F2`/`9.18`/`9.19`/`9.20` sections and a new `§9.45 — Work Item Explorer Field-Format Compatibility (TC-FF-01 to TC-FF-06)`, and updated the `F2-05/06/07/09/11/12/13` rows, `F2-TRACE`, and Gaps Summary item 2 in `TODO-List.md` Section 12 to reflect that **TRACE-01 gap cluster #2 is now fully closed** — documentation anchoring, code-level re-verification, and test automation all complete in one pass.

---

## v4.2.2 — UX-14 Test Automation: Flat Admin-Settings Console (2026-06-07, P0 — test coverage)

### Closed all 3 remaining test-writing gaps for UX-14 (flat admin-settings redesign)
- **`TC-AC-01`** (console loads with sidebar/context-bar/status area showing the current tab's name and description): asserted via `activeTabMeta()` resolving each of the 7 tabs to its label/description (with a first-tab fallback for unknown ids) and `ADMIN_TABS` listing every sidebar entry with a label and icon.
- **`TC-AC-02`** (switching tabs swaps the main panel in place without a full layout reload): asserted via `activeTabMeta()` resolving a distinct tab per selection and `buildSettingsStats()` returning tab-specific stat cards (and an empty array for unrecognised tabs) for all 7 tabs — proving panel content is driven purely by the selected `Tab` while the sidebar/layout (`ADMIN_TABS`) stays constant.
- **`TC-AC-03`** (Users tab is table-first with inline role/status editing and contextual summary cards): asserted via `buildSettingsStats('users', …)` producing correct total/active/admin summary cards (incl. the "No users yet" zero-division guard), `roleOptionsFor()` returning the right assignable-role set for plain vs. elevated users, and `matchesUserFilter()` narrowing the inline-editable table by name/email search and role filter.
- Added new `src/__tests__/adminSettingsConsole.test.ts` (11 tests). Extracted the page's pure helpers `Tab`, `ADMIN_TABS`, `activeTabMeta()`, `retentionLabel()`, `buildSettingsStats()`, `ManagedUser`, `roleOptionsFor()`, and `matchesUserFilter()` out of `app/admin/settings/page.tsx` into a new `src/lib/adminConsole.ts` module so they can be unit-tested directly without React component-rendering infrastructure — the same pattern used for `src/lib/members.ts` in the cluster #1 closure below.
- Test suite count rose from **481 tests / 51 suites → 492 tests / 52 suites** (1 new file, 11 new tests). `npm run lint` and `npm run build` remain clean.
- Updated `product/TEST_CASES.md` §9.44 to flip all 3 `TC-AC` rows from `❌ Not Run` to `✅ Automated`, and updated the UX-14/Gaps-Summary entries in `TODO-List.md` Section 12 to reflect that **UX-14 is now fully closed** — both the documentation-anchoring layer and the underlying test-automation layer.

---

## v4.2.2 — TRACE-01 Cluster #1 Test Automation: Admin/Member/Password-Change (2026-06-07, P0 — test coverage)

### Closed all 14 remaining test-writing gaps from the TRACE-01 cluster #1 closure (below)
- **`TC-AU-06`/`TC-AU-07`** (admin self-disable-protection 400, duplicate-email 409): added to `src/__tests__/adminUsers.test.ts`, asserting the existing `app/api/admin/users/route.ts` branches at lines 130–132 and 98–99.
- **`TC-MD-05`–`TC-MD-08`** (active-only sorted query, search filter, contact-email fallback, anonymous-401): added new `src/__tests__/members.test.ts`. Extracted the page's pure helpers `matchesMemberQuery()` and `contactEmailFor()` (plus `initialsFor()`) out of `app/members/page.tsx` into a new `src/lib/members.ts` module so they can be unit-tested directly without React component-rendering infrastructure (this project's Jest setup is Node-environment only — no `@testing-library/react`/jsdom).
- **`TC-PW-07`** (middleware redirects every protected route to `/change-password` while `mustChangePassword = true`, with no redirect loop on `/change-password` itself): added new `src/__tests__/middleware.test.ts`, exercising the real `middleware()` function against constructed `NextRequest` instances with a mocked `iron-session` session.
- **`TC-PW-08`–`TC-PW-10`** (reject new-password-equals-temporary, successful change clears `mustChangePassword`/writes `password_change` AuditEvent/updates session, reject wrong current password): added new `src/__tests__/changePassword.test.ts` against `app/api/auth/change-password/route.ts`. Also corrected the `TC-PW-08` expected-message text in `TEST_CASES.md` to match the actual route copy ("New password must be different from **the temporary password**", not "your current password").
- Test suite count rose from **469 tests / 48 suites → 481 tests / 51 suites** (3 new files, 2 new cases added to an existing file). `npm run lint` and `npm run build` remain clean.
- Updated `product/TEST_CASES.md` §9.43 to flip all 14 rows from `❌ Not Run` to `✅ Automated`, and updated the F3-14/15/16 rows plus Gaps Summary item 1 in `TODO-List.md` Section 12 to reflect that **TRACE-01 gap cluster #1 is now fully closed** — both the documentation-anchoring layer and the underlying test-automation layer.

---

## v4.2.2 — TRACE-01 Traceability: Admin/Member/Password-Change Documentation (2026-06-07, P0 — documentation only)

### Traceability matrix (TRACE-01) — first pass and gap closure
- Compiled and inserted the **first-pass full traceability matrix** required by `TRACE-01` into `TODO-List.md` Section 12 — ~50 rows cross-referencing every shipped Feature 1–4 / UX item against SRS FR IDs, Use Cases, Scenarios, User Journeys, Test Cases, and Release Notes. The pass found **~38% of cross-reference cells missing** (`GAP — not found`) and produced a prioritized Gaps Summary punch-list.
- **Closed the highest-priority gap cluster** identified by the matrix — Feature 3 admin/user/member items `F3-14` (Admin User Management), `F3-15` (Member Directory `/members`), and `F3-16` (Forced First-Login Password Change) — which previously had **zero** Use Case, Scenario, User Journey, or formally-numbered Test Case anchoring.
- Added Use Cases **`UC-084`** (Admin Manages User Accounts), **`UC-085`** (Browse Member Directory), **`UC-086`** (Complete Forced First-Login Password Change) to `product/USE_CASES.md`, each documenting the actual implemented flows, alternate flows (duplicate email 409, self-disable/self-delete 400, password-mismatch, weak/repeated-password 400, wrong-temporary-password 401), and Related FRs (`FR-235A`, `FR-235B`, `FR-235C`, `FR-235D`, `FR-235G`).
- Added Scenarios **`SCN-039`**–**`SCN-042`** to `product/SCENARIOS.md` narrating: an admin onboarding a new Scrum Master, an admin attempting to disable/delete their own account (self-protection), a new Product Owner looking up a colleague's contact info, and a new hire completing the forced password-change flow end to end.
- Added User Journeys **`UJ-024`**–**`UJ-026`** to `product/USER_JOURNEYS.md` (Section 10, "v4.2.2 — Admin & Member Management Journeys") mapping the same three flows step-by-step with emotional-state annotations.
- Added formal Test Case IDs **`TC-AU-01`–`TC-AU-07`**, **`TC-MD-01`–`TC-MD-08`**, **`TC-PW-01`–`TC-PW-10`** to `product/TEST_CASES.md` §9.43 — mapping `TC-AU-01–05` to the existing `adminUsers.test.ts` suite, `TC-MD-01–04`/`TC-PW-01–04` to existing `roles.test.ts` route-access checks, and `TC-PW-05–06` to existing `auth.test.ts` password-strength/hash tests (cross-referenced to `TC-A-00a–d`/`TC-A-08a–c`). The remaining 14 IDs (`TC-AU-06/07`, `TC-MD-05–08`, `TC-PW-07–10`) are recorded as `❌ Not Run` with exact file/line references to the untested code branches — converting what were open documentation gaps into a concrete, locatable test-writing backlog.

### Known limitations / what remains open
- `TRACE-01` itself remains 🔧 **In progress**, not ✅ Done — at the time of this pass three further gap clusters identified by the matrix were still open: Feature 2 Explorer visuals/filters (`F2-05/06/07/09/11/12/13`), Excel export sheet documentation (`F4-05/06/08`), and UX items (`UX-02/03/05/11/13`) while `UX-14` was anchored with `UC-087`, `SCN-043`, `UJ-027`, and `TC-AC-01–TC-AC-03`. **Update (2026-06-08):** the Feature 2 Explorer cluster (`F2-05/06/07/09/11/12/13`) was subsequently closed too — see "TRACE-01 Cluster #2 Closure: Work Item Explorer Risk & Branch Insights" above. Only the Excel export sheets (`F4-05/06/08`), F1-07/08, and UX narrative backfill (`UX-02/03/05/11/13`) remain open.
- The 14 newly-identified `❌ Not Run` test cases above were documentation/planning entries only in *this* pass — the actual test code had not yet been written, and `npm test` count (469/48) was unchanged by this pass since no test files were added or modified. **Update:** all 14 were subsequently automated the same day — see the "TRACE-01 Cluster #1 Test Automation" section above (now 481/51 passing).
- This is a **documentation-only** change; no application code, routes, schemas, or UI were modified. Lint/build/test status is unaffected (carried over from the prior v4.2.2 P0 reconciliation pass below).

---

## v4.2.2 — P0 Reconciliation & Release Candidate Verification (2026-06-07)

### Status reconciliation (P0 — documentation/code alignment pass)
- **Lint**: Fixed — `next lint` had no ESLint configuration (`next/core-web-vitals` added via `.eslintrc.json`); 22 pre-existing `react/no-unescaped-entities` errors and 2 unresolvable `@typescript-eslint/no-require-imports` directives fixed. `npm run lint` now passes with only pre-existing `<img>`/`exhaustive-deps` warnings remaining.
- **Build**: Fixed — `npm run build` was failing to compile because of the same lint errors once ESLint was configured (Next.js runs lint during build). Build now compiles and type-checks cleanly.
- **Tests**: Verified — `npm test` passes **469 tests across 48 suites** (was previously documented inconsistently as 253/21, 280+/22, 310+, and 375/36 across different files). All product docs and the `/landing` stats strip are now normalised to **469 tests / 48 suites**, verified 2026-06-07.
- **SRS**: P1.1 (Calculation Reference), P1.2 (Clear Local Data), and P1.3 (Dashboard Section Switcher) were marked "Done" in the FR section but contradicted by a "Planned P1 (queued — not yet started)" list earlier in the same document — corrected to a single "Done / Verified" status. SRS version bumped to 4.2.2 and footer corrected from "v1.0.0" to "v4.2.2".
- **USE_CASES**: Introduction/scope still described "Delivery Clarity v1.0" with "40 use cases only" and listed "User authentication and multi-user workspaces" and "Historical sprint-over-sprint comparison" as out of scope — both have been implemented for several releases. Scope section rewritten for v4.2.x: authentication, role-based access, admin user management, snapshots/trends, cloud storage, Clear Local Data, Dashboard Section Switcher, and Calculation Reference are now listed as in scope and implemented; only the not-yet-built P1/P2 roadmap items (Backend Gateway, User Add-Member Request Workflow, Role-Based Coaching Insights, Retrospective module, Forecasting) remain out of scope.
- **Storage status**: `product/DEVELOPER_GUIDE.md` still described Cloud Storage as "Design and backlog planning only — Do NOT implement" with a "(Planned)" interface, while BRD/SRS/RELEASE_NOTES/TODO/TEST_CASES already documented it as implemented and shipped (PR #3, hardened in v4.2.1). Replaced the stale planning section with the actual implemented architecture (`StorageProvider` interface, four providers, bucket-first metrics startup, cloud-backed user authority, backup/restore hardening, credential security, fallback behaviour, current limitations).
- **TODO-List.md**: Rewritten to reflect current branch (`codex/flat-admin-settings`), version (v4.2.2), and a P0–P4 priority structure with explicit status values; added the new P1/P2 roadmap items from the Delivery Clarity master prompt (Backend Integration Gateway, User Add-Member Request Workflow, Role-Based Delivery Coaching Insights, Retrospective Upload/Template/In-App Form, Forecasting & Delivery Adjustment Report) as Not Started.

**Release candidate verdict:** v4.2.2 is marked **Release Candidate** — lint, tests, and build all pass; SRS, Use Cases, Developer Guide, Release Notes, README, Test Cases, and TODO are reconciled to the verified code state as of 2026-06-07.

---

## v4.2.2 — Admin User Management & Role Scope (2026-06-06)

### Auth / users
- Added admin-managed users in `/admin/settings → Users`: create users, assign roles, update display names, and enable/disable accounts.
- Added admin delete-user support with confirmation, self-delete protection, audit events, and cloud sync after user removal.
- Expanded `/profile` into an editable team profile: name, position, profile picture URL, telephone, contact email, address, certificates, and shared team info.
- Added S3-backed profile image upload from `/profile`; images are stored under `images/profile/` and served through authenticated `/api/profile/image` URLs.
- Fixed production startup: local `npm start` and Docker now run the full Next production server so App Router pages, API routes, and static chunks resolve without 404s.
- Normalized relative SQLite `DATABASE_URL` values at Prisma startup so production runs open `data/delivery_clarity.db` reliably.
- Added `/members` for logged-in users: searchable member cards with position/role, plus a detail popup for contact info and shared profile details.
- Added roles: `admin`, `scrum_master`, `product_owner`, `manager`, and `c_level`; existing `user` remains supported for legacy/open-registration accounts.
- Added `GET/POST/PATCH/DELETE /api/admin/users` with admin-only access, password-strength checks, duplicate-email protection, first-login password-change enforcement, and audit events.
- Role-scoped import visibility now allows Admin, Manager, and C-level users to request all import logs; Scrum Master and Product Owner remain scoped to their own uploads.
- Dashboard first-load view now locks assigned delivery roles to their role view: Scrum Master, Product Owner, Engineering Manager, or Executive. Saved browser preferences cannot override assigned roles.
- Cloud-backed user authority: login/admin user management syncs from cloud first when cloud storage is active, and admin create/update or password-change flows push the user DB backup back to cloud.
- Locked public registration: the login page no longer links to registration, `/register` redirects to `/login`, and `POST /api/auth/register` returns 403 for future-only registration code.
- Added strict protected-page route visibility/enforcement by role: disallowed routes are hidden from the AppShell navigation and blocked in middleware.
- Redesigned `/admin/settings` to match the attached flat admin settings mockup: sticky settings sidebar, flat top context bar, page-level status, contextual summary cards, and a table-first Users workflow.
- Added a dedicated Administration navigation group and applied the same flat admin console layout to Settings, Diagnostics, Security, and Import Logs.
- Polished the admin header utility chips so setup progress and data-source status stay compact and do not wrap into the navigation area.
- Added shared role helpers and automated tests for role labels, import visibility, cloud-backed admin user changes, dashboard role locking, and route access.

### Documentation
- Kept documentation policy as permanent P0 and updated TODO, release notes, SRS, developer guide, test cases, and appendix for the new role model.

---

## v4.2.1 — Cloud Restore Hardening Tests (2026-06-06)

### Jira integration gate
- Merged PR #3 to `main` before starting the next Jira integration gate.
- Added automated coverage for the cloud restore startup contract: `/api/metrics/latest` first-run fallback response, `latest-metrics.json` backup inclusion, pending-push restore protection, and browser `localStorage` fallback.
- Fixed cloud storage credential persistence so saved provider credentials survive login, logout, session expiry, refresh, and locked Test connection / Upload backup actions. Redacted browser settings can no longer overwrite saved server-side secrets with blank values.
- Updated TODO and test documentation so TC-CS-09 through TC-CS-12 are tracked as automated pre-Jira integration gates.

---

## v4.2 — Bucket-First Metrics Startup & Documentation Sync (2026-06-06)

### Cloud-backed dashboard startup
- Added `data/latest-metrics.json` as the server-side latest `DashboardMetrics` payload.
- Included `latest-metrics.json` in backup bundles alongside SQLite, settings, orphan rules, retention settings, and import logs.
- Added `GET /api/metrics/latest` for bucket/server metrics loading. It returns HTTP 200 with `available:false` when no latest metrics file exists yet, avoiding noisy 404s during first-run fallback.
- Updated dashboard, overview, charts, readiness, customer, teams, portfolio, and explorer pages to use `loadMetricsWithSource()`: bucket-backed server metrics first, browser `localStorage` fallback second.
- Updated login/register startup to sync from cloud before using the local server database where possible.
- Added source metadata in `dc_metrics_source_v1`; the header badge now distinguishes bucket/cache, fresh upload, snapshot, server-local, and `localStorage fallback`.
- Protected pending local changes from being overwritten by an older bucket restore when `pendingPush` is true.

### Documentation
- Updated all `product/` documents plus `/help` and `/developer` content so cloud storage, latest metrics, and fallback behavior match the current code.

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

### UX — Summary Page CTA Toolbar Redesign
- Replaced 8 scattered colored pill buttons with a single **action toolbar** — white card, `border-radius: 9999px`, subtle shadow, 3 logical groups separated by thin dividers
- **Group 1 (Utility)**: Upload · Take tour — neutral icon color (#64748b)
- **Group 2 (Export)**: Excel (green) · Exec PDF (purple) · HTML (teal) — icon color only, no background fill
- **Group 3 (Navigate)**: Charts (blue) · Full Report (dark) · Customer (teal) — same pattern
- Hover: icon-colored tint background + text changes to icon color; smooth 150ms transition
- No colored backgrounds on any button — color lives only in the icon SVG

### P3 — Cloud Storage Integration (P3-01)
- New **`StorageProvider` interface** — `upload()`, `download()`, `list()`, `delete()`, `test()` — cleanly abstracted from provider
- **4 providers** (all use dynamic imports so SDKs are optional at runtime):
  - `LocalStorageProvider` — `data/cloud-backups/` directory (no credentials needed)
  - `S3StorageProvider` — AWS S3 + S3-compatible (MinIO, Backblaze B2, Cloudflare R2) via `@aws-sdk/client-s3`
  - `AzureStorageProvider` — Azure Blob Storage via `@azure/storage-blob`
  - `GcpStorageProvider` — Google Cloud Storage via `@google-cloud/storage`
- **`storageProvider.ts` factory** — `getActiveProvider()`, `createProvider()`, `uploadBackupToCloud()`, `listCloudBackups()`; settings in `data/storage-settings.json`
- **`GET /api/admin/storage`** — returns settings (credentials redacted), provider info, cloud backup list
- **`POST /api/admin/storage`** — update active provider + credentials; `?action=test` tests connectivity; `?action=upload` creates and uploads a backup
- **☁️ Cloud Storage tab** in `/admin/settings` — provider picker (4 cards), per-provider credential forms, SDK install hint, Test Connection / Upload Backup Now buttons, cloud backup list table
- 8 automated tests (TC-CS-01–08)

### P3 — Advanced Chart Customization (9.42)
- New **"Customise"** button in the `/charts` page header opens a **Chart Customizer panel**
- **Toggle visibility** — show/hide any of the 11 charts individually
- **Column span** — per-chart width picker: `1/3` · `2/3` · `Full` (replaces hardcoded span values)
- **Reorder** — ▲▼ arrows change the order of charts in the panel (panel order reflects render order once reordering is wired fully; span + visibility apply immediately)
- **Blue dot** on "Customise" button when settings differ from defaults
- **Reset** button restores all charts visible with original spans
- Settings persisted to `dc_chart_prefs` localStorage; applied on every page load via `getChartPrefs()`
- `isChartVisible(id)` and `chartSpan(id)` helpers replace hardcoded span values in charts/page.tsx
- 9 automated tests (TC-CC-01–08)

### P3 — Custom Dashboard Layout Builder (9.41)
- New **"Layout"** button in the dashboard sticky bar (right side of section switcher row) opens a **Layout Builder panel**
- **Reorder sections** with ▲ / ▼ arrow buttons — changes the order of tabs in the section switcher
- **Toggle visibility** per section with a toggle switch — hidden sections disappear from the switcher and the dashboard (slide-out hidden)
- **Blue dot** on the "Layout" button indicates a custom (non-default) layout is active
- **Reset** button restores default order and visibility
- Layout persisted to `dc_section_layout` in localStorage; survives page reloads
- `DashboardSectionSwitcher` accepts new `orderedKeys` prop for custom tab order
- `isHidden()` checks both the role-based view AND the user's layout prefs
- 9 automated tests (TC-LB2-01–08)

### P3 — Advanced Theme Customization (9.40)
- New **palette icon (🎨)** in the AppShell header (next to dark mode toggle) opens a **Theme Customizer panel**
- **Accent colour** — 7 presets via circular swatches: Blue (default) · Purple · Teal · Orange · Indigo · Rose · Slate
  - Applied via `--dc-accent`, `--dc-accent-hover`, `--dc-accent-shadow` CSS variables on `<html>`
  - `btn-primary` wired to these variables — all primary action buttons change colour immediately
- **Corner radius** — 3 presets: Sharp (6/10px) · Default (12/18px) · Rounded (18/24px)
  - Applied via `--radius-md` and `--radius-lg` CSS variables (already used in `.card` and layout)
- **Text size** — 3 presets: Small (13px) · Medium (14px) · Large (16px) — set on `html` root, scales all `rem` units
- **Reset** button restores all defaults; settings persist to `dc_theme_custom` in localStorage
- Initialised on every page load via `initThemeCustom()` in AppShell `useEffect`
- 8 automated tests (TC-TC-01–08)

### P3 — Product Tour Animation (9.39)
- **8-step guided tour** — no external library (no Shepherd.js, Intro.js, etc.); pure React + CSS
- **Pulsing highlight ring**: `position:fixed` ring with `box-shadow` pulse animation around the target dashboard section
- **Dark popover**: animated card with progress dots, step counter, title, description, Back / Next / Skip / Finish buttons
- **Tour steps**: Welcome → Section Switcher → Health Score → Priority Attention → Smart Recommendations → Sprint Throughput → Work Item Explorer (CTA navigates) → Done
- **Triggers**: "Tour" button (info icon) on `/dashboard` header card; "Take a tour" button on `/summary` CTA row; auto-starts via `dc:start-tour` custom event
- **Keyboard**: ← Back, → Next, Esc = Skip
- **State**: `dc_tour_dismissed` + `dc_tour_completed` in localStorage; `resetTour()` available for testing
- **Accessibility**: `role="dialog"` on popover, `aria-label` with step info, `@media (prefers-reduced-motion)` disables animations
- **Lazy-loaded** via Next.js `dynamic()` — zero bundle cost until first use
- 8 automated tests (TC-PT-01–08)

### P2 — Charts KPI Chip & Truncation Audit (9.46)
- Removed JS string truncation from 4 chart label sites — CSS `truncate` + `title` attribute now handle display and tooltip correctly:
  - **Sprint Velocity VertBar**: was `s.name.slice(0, 9) + '…'` → passes full sprint name; tooltip shows it
  - **Team Load HorizBar**: was `c.assignee.slice(0, 14) + '…'` → passes full assignee name
  - **Kanban Status HorizBar**: was `k.name.slice(0, 16) + '…'` → passes full status name
  - **GanttChart labels**: was `(e.epic || label).slice(0, 32)` → passes full name; `title={r.label}` now shows the complete epic/sprint name
- **SprintVelocityChart**: `shortName()` ("S14") kept for bar display; added `fullName` prop so `title` shows the complete sprint name on hover (e.g. "Sprint 14" not "S14")

### Help — Export Sheets Reference
- New **"Export Sheets Reference"** section added to `/help` listing all export outputs:
  - 17-sheet main Excel workbook — all sheet names, descriptions, and content
  - 5-sheet Work Item Explorer Excel — all sheet names and content
  - Executive PDF — layout description
  - HTML report — section descriptions

### P2 — In-App Landing Page (9.38)
- New **`/landing`** page — full product showcase accessible from the nav (Reference → About)
- **Hero**: Delivery Clarity logo + headline "From messy boards to measurable delivery confidence" + Upload and Dashboard CTAs
- **Stats strip**: 4 cards — 28+ metrics, 17 Excel sheets, 14 dashboard sections, 469+ tests (count corrected 2026-06-07 to match the verified test suite)
- **How it works**: 3-step process — Export from Jira → Upload in seconds → Act on insights
- **Feature grid**: 12 clickable feature cards (Sprint Throughput, Work Item Explorer, Trends, Team Health, Portfolio, Release Readiness, Visual Analytics, Customer View, Smart Export, Snapshots, Data Quality, Admin Diagnostics) — each links directly to its page
- **CTA footer**: Dark gradient section with brand mark, upload button, developer portal link
- **"See all 12 features →"** link added below the upload page hero description
- **"About"** (🏠) added to Reference nav group

### P2 — Branding Integration (9.37)
- **Login & Register pages**: `<Image>` logo SVG replaces plain text "Delivery Clarity" heading — shows `delivery-clarity-logo-horizontal.svg` (200×62)
- **app/layout.tsx metadata**: Added full metadata — `icons` (favicon.svg, favicon.ico, apple-touch-icon), `themeColor: #2563eb`, `openGraph` (title, description, image), `twitter` card
- **HTML report export**: Lightning bolt brand mark (gradient square + SVG) added to header alongside "Delivery Report" title; footer updated to "Delivery Clarity v4.1 · Ali Abu Ras · aliaburas80@gmail.com"
- **Executive PDF export**: Same brand mark added to header; footer updated with version and email
- **Excel workbook** (17 sheets): Added slogan "From messy boards to measurable delivery confidence" and author row to Executive Summary sheet
- **Version consistency**: AppShell footer `v2.0` → `v4.1`; Glossary footer `v3.0` → `v4.1`
- **Email consistency**: All UI and export footers now use `aliaburas80@gmail.com`

### P2 — System Health / Admin Diagnostics (9.36)
- New **`/admin/diagnostics`** page — live system health snapshot, admin-only
- **Ops Health Score (0–100)**: SESSION_SECRET set (−30), NODE_ENV production (−10), registration locked (−10), failed imports (−1 each, capped −10), active sessions (−5 if zero)
- **Sections**: Score banner · DB Overview (users/active/sessions/snapshots KPI cards) · Import Health (success rate, avg health score, avg processing time, last import) · Environment checks (5 vars with pass/fail) · System info (Node version, platform, uptime) · Recent audit events (last 8) · Quick links to other admin pages
- **API**: `GET /api/admin/diagnostics` — admin-only; aggregates DB counts, import stats, env checks, recent audit log
- **Refresh** button for live re-fetch; "Security Report →" shortcut to full security page
- **"Diagnostics"** added to Data nav group (🩺 icon)
- 8 automated tests (TC-SD-01–08)

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
- **9.24** Docker deployment — multi-stage `Dockerfile` (node:20-alpine, non-root user), `docker-compose.yml` with volume mount + healthcheck, `.dockerignore`, full Next production runtime

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

## Remaining Planned — P2/P3/P4

- **P2/P3** Optional Jira API Integration — export-first model remains default
- **P4** Admin & System Notification Center
- **P4** Maintenance Mode

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
