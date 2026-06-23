# Delivery Clarity — Release Notes

**Brand:** Ali Delivery Intelligence  
**Slogan:** From messy boards to measurable delivery confidence

---

## v4.9.3 — Storage Gates Closed: Cloud Sync Visibility & Diagnostics (2026-06-23, P0 — in progress, unmerged)

**Scope:** `NEXT-04`/`STORAGE-DEC-01–11`, the last open P0 item: verify the true status of the cloud storage feature and close the three real gaps found.

- Audited the existing storage implementation directly against the code (not assumed from prior notes): confirmed 4 real providers (Local, S3/S3-compatible, Azure Blob, GCP) behind a typed `StorageProvider` interface, with credentials never exposed to the browser.
- New **"Latest Metrics & Cloud Sync"** section on the admin Diagnostics page: shows whether the live dashboard snapshot is available and how old it is, how many cloud backups exist and how fresh the newest one is, and when data was last fetched from / pushed to the cloud provider.
- The Data Source badge (shown across `/dashboard/*`) now also surfaces **last-fetched time** and a **fallback reason** when serving from `localStorage` or no source at all — previously only the provider/key were shown.
- The Cloud Storage admin panel (Admin Settings → Cloud Storage) no longer briefly flashes the "Local" provider as selected while the real saved settings are still loading — it now waits for the real settings before rendering anything interactive.
- 2 new tests; full suite 669/70 passing.

---

## v4.9.2 — Bug Fix: Relation Graph Connecting Edges Never Rendered (2026-06-23, P2 — in progress, unmerged)

**Scope:** `JIRA-13`, a defect flagged (but explicitly not fixed) during `JIRA-12`'s live verification: the Explore Delivery Structure graph's connecting lines never rendered, even when the underlying node/edge data was correct.

- Root cause: the custom React Flow node card (`WorkItemGraph.tsx`'s `IssueNodeCard`) never rendered any `<Handle>` element, so React Flow had no anchor point to compute an edge's SVG path from — the edge data was always correct, only the rendering was broken.
- Fix: added a target handle (top) and source handle (bottom) to match the existing top-to-bottom dagre layout, visually hidden and non-interactive since the graph is read-only.
- Verified live: re-ran the real `AJ-28` Product→Project→Epic→19-children graph; edge count went from 0 visible connector lines to 20, all rendering correctly.
- No data, layout direction, or other component behavior changed — this was purely a missing-markup rendering fix.

---

## v4.9.1 — "Sync Jira" Button on the Dashboard for Every User (2026-06-22, P1 — in progress, unmerged)

**Scope:** `JIRA-14`, requested directly by the user: a way to pull fresh Jira data without going through Admin Settings, available to every logged-in user — not just admins.

- New **"Sync Jira"** button in the dashboard topbar, next to "New Upload," with a spinning-icon loading state.
- Any logged-in user can trigger it — confirmed with the user as an explicit product decision, since the token itself is still never exposed to the client.
- When multiple Jira connections exist, it syncs whichever one most recently fed the live dashboard (falling back to the most recently created if none has synced yet) — also confirmed with the user before building, rather than guessing.
- The all-or-nothing sync logic was extracted into a shared service (`connectionSyncRunner.ts`) so the existing admin-only per-connection route and this new any-user route can't drift apart — the existing admin route's full test suite passes unmodified after the refactor.
- **Verified live as a real non-admin user**: created a temporary `scrum_master` test account, confirmed the button is visible and clickable, and got a real successful sync of 27 issues — then deleted the test account.
- 7 new tests. Suite: **667/70, all passing.**

---

## v4.9.0 — Admin-Configurable Issue Type Hierarchy (2026-06-22, P1 — in progress, unmerged)

**Scope:** `ISSUETYPE-01`, requested directly by the user after the `JIRA-11`/`JIRA-12` fixes: a real settings screen to define issue types and their hierarchy order (Product → Project → Epic → Story → Sub-task), instead of being restricted to the types hardcoded during those fixes.

- New **"Issue Type Hierarchy"** admin screen (Admin Settings → Issue Type Hierarchy): every configured type — built-in or custom — listed with its hierarchy level, icon, color, and the raw Jira "Issue Type" name(s) it matches. Reorder levels with up/down arrows, add a custom type, or delete any non-built-in type.
- The hierarchy is no longer hardcoded TypeScript literals. `IssueNodeType` changed from a closed union to `string` — a genuinely open, admin-defined set of types can't be a compile-time-closed union.
- **Real behavior improvement, not just configurability:** the "does this need a parent inferred" logic generalized from "must specifically be an Epic" to "must be exactly one configured level up." Previously a Sub-task with no parent could get phantom-linked straight to an Epic, skipping its real Story/Task parent — now it correctly looks one level up first.
- Every part of the Explore page (graph, details table, charts) now reads the live configured types instead of a fixed list.
- **Verified live**: added a custom "Strategic Theme" type through the real admin screen, confirmed it persisted, confirmed the real Jira data still resolved correctly through the now-dynamic config, then cleaned up the test type.
- 17 new tests (`TC-IT-01–17`). Suite: **660/69, all passing.**

---

## v4.8.2 — ARCH-05 Fix: Phantom Hierarchy Cycle + "Unknown" Type for Product/Project (2026-06-22, P1 — in progress, unmerged)

**Scope:** Follow-up to `v4.8.1` (`JIRA-12`), found from the user's own screenshots of the just-fixed Explore page.

- Focusing on the middle node of a 3-level chain showed **zero connecting edges**, the root ancestor wrongly tagged both "Orphan" and "Most work," and both ancestors labeled "Unknown" type.
- Root cause: `hierarchy.service.ts`'s prefix-based inference (designed to link a Story with no Epic Link to an Epic sharing its project prefix) fired on the root ancestor too — every issue in a project shares the same key prefix — creating a phantom link that formed a 3-node cycle, which broke ancestor-chain walking and fed a bogus node into the "largest unfinished branch" calculation.
- Fixed with a type-name-independent guard: an issue that's already established as someone else's explicit parent can never also be treated as a leaf needing phantom inference, regardless of its type name (hierarchy level names are admin-configurable per Jira instance, so a guard that doesn't depend on exact type names is more robust).
- Added proper `Initiative`/`Product`/`Project` node types (icon + color) instead of falling back to "Unknown."
- **Verified live**: re-synced the real connection and confirmed the root ancestor now shows its correct type with no stray badges, and "Orphans: 0" in Key Metrics.
- **Found but not fixed, flagged separately (`JIRA-13`):** the relation graph's connecting lines never render at all — reproduced on an unrelated, already-correct graph too, so it predates this fix and isn't something introduced today.
- 5 new tests (`TC-HIER-01–05`) + `TC-E-12/13`. Suite: **643/68, all passing.**

---

## v4.8.1 — ARCH-05 Fix: Multi-Level Parent Hierarchy Lost on Live Sync (2026-06-22, P1 — in progress, unmerged)

**Scope:** Bug fix (`JIRA-11`), reported by the user against real synced data: "Explore Delivery Structure" couldn't show that an Epic's parent had its own parent (e.g. Epic → Initiative → Product), even though the same hierarchy worked fine via CSV upload.

- **Two separate bugs, not one.** `src/services/jira/apiAdapter.ts` never read Jira's standard `fields.parent.key` (a fixed-path field on every issue, not a per-instance custom field — no `fieldMapping` needed, it just wasn't being read). After fixing that, a live re-sync *still* dropped the field — `src/services/jira/sync.ts`'s explicit `fields=` request to Jira's search API never asked for `parent`, so Jira's bulk response omitted it even though a direct single-issue probe confirmed it was there.
- **A second, independent issue in the same area:** `buildRelationGraph()` (`src/services/relations/relationExplorer.service.ts`) only ever rendered one level up from the focus node, by deliberate earlier design. An unused `getAncestorChain()` helper already existed for the full chain — wired it in.
- **Verified live, not just by unit tests:** re-synced the real "Agile Jordan" connection and confirmed the Explore page now renders the full chain — Product → Project → Epic → 19 child stories/tasks — using a temporary debug route to inspect Jira's raw API response (deleted before commit).
- 6 new tests: `TC-JIRA-51/52/53`, `TC-E-09/10/11`.
- Suite: **636/67, all passing.** Lint, typecheck, and build clean.

---

## v4.8.0 — ARCH-05: Fallback Contract — Dashboard Shows Where Data Came From (2026-06-21, P1 — in progress, unmerged)

**Scope:** Sixth and final slice of Phase 1 — `JIRA-08`. JIRA-07 made Jira data actually flow into the dashboard, but the dashboard gave no visible sign of it — and a failed sync, while harmless, was invisible too. This slice closes that gap with a real status badge and confirms the "never wipes last-good data" guarantee in practice, not just in theory.

- **`writeLatestMetrics(metrics, origin?)`** (`src/services/metrics/latestMetricsStorage.ts`) now records where a snapshot came from — `{ source: 'file' | 'jira-api', connectionName?, connectionId? }` — alongside `savedAt`/`metrics`. Backward compatible: old snapshot files with no `origin` field still load fine.
- **`GET /api/metrics/latest`** surfaces that origin: when a snapshot came from a Jira sync, the response reports `source: 'jira-api'` and `connectionName`, taking priority over the existing bucket/cache cloud-transport detection — what matters to a viewer is where the *data* came from, not which storage hop served the file.
- **`DataSourceBadge`** (`src/components/ui/DataSourceBadge.tsx`) gained a `'jira-api'` source and now renders "Jira (ConnectionName) — last synced Xm ago." **Discovered while wiring this up: the badge component existed but had never actually been mounted anywhere in the app** — only its `Provider` was. Mounted it for the first time, in `DashboardTopbar`'s top-right rail, visible across every `/dashboard/*` route.
- **Fallback contract confirmed live, not just by code reading:** synced a real project (7 issues) and saw the badge update; then forced a sync failure (cleared the connection's project filters → `409`) and confirmed `/api/metrics/latest` returned the exact same `savedAt`/`metrics` as before — the last-good Jira snapshot was untouched.
- **Caught via live testing:** `/dashboard/summary` actually redirects to a separate, older `/summary` page that doesn't use `DashboardTopbar` — verification had to use a real `/dashboard/*` route to see the badge.
- New tests: `latestMetricsStorage.test.ts` (4 tests, `TC-JIRA-47–50`) + `TC-CS-13/14/15` in `cloudRestoreHardening.test.ts`.
- Suite: **630/67, all passing.** Lint, typecheck, and build clean.

---

## v4.7.0 — ARCH-05: Manual "Sync Now" — Jira Data Actually Flows In (2026-06-21, P1 — in progress, unmerged)

**Scope:** Fifth slice of Phase 1 — `JIRA-07`. Until now, a connection could be created and tested, but no Jira issue ever reached a dashboard; the only working data path was still the manual CSV/Excel upload. This slice closes that gap.

- **`POST /api/admin/jira-connections/[id]/sync`** + **`src/services/jira/sync.ts`**: builds a safe, bounded JQL from the connection's project keys (never raw JQL text entry — a free-text box could leak an entire backlog via a typo), paginates through the Gateway (Cloud `nextPageToken` / Server-DC `startAt`, capped at 1000 issues per sync as a safety limit), normalizes via `JIRA-06`'s adapter, validates, computes metrics with the existing `calculateDashboardMetrics()`, then updates the live dashboard via `writeLatestMetrics()` — the same mechanism the file-upload route already uses — plus writes an `ImportLog` row (`sourceType: "api"`).
- **All-or-nothing**: a validation or Gateway failure never touches the live dashboard; the last-good data stays in place.
- **Deviated from the original design note** ("+ DashboardSnapshot"): `DashboardSnapshot` is a deliberate user-named milestone capped at 20 per user — auto-creating one on every sync would silently eat that budget for no benefit. `writeLatestMetrics()` is the actual mechanism that updates what the dashboard shows.
- **Two real bugs caught, neither by unit tests alone:**
  1. A unit test (`TC-JIRA-36`) caught that the pagination query object was built but never passed to `callExternal()` — every request would have silently ignored the JQL filter and pagination cursor entirely.
  2. Live testing against the real Jira instance caught that config errors (e.g. no project keys configured) were reported as HTTP 502 — implying an upstream Jira failure — when the request never even reached Jira. Added a `configError` flag distinguishing "never reached Jira" (409) from "Jira/Gateway actually failed" (502).
- **Verified fully end-to-end against the user's real Jira Cloud instance** (not mocks): discovered real project keys via a read-only direct API probe, pointed the connection at a project with real issues (`SAMPLEPROJ`, 7 issues), ran an actual sync, and confirmed the response (`{ totalIssues: 7, doneIssues: 1, healthScore: 48 }`), the `ImportLog` row, and `data/latest-metrics.json` were all correct — then cleaned up the test data and reverted the connection to its original state.
- New tests: `jiraSync.test.ts` (11 tests, `TC-JIRA-29–39`) + 7 new route tests (`TC-JIRA-40–46`, `44b`) in `jiraConnections.test.ts`.
- Suite: **623/66, all passing.** Lint and build clean.

---

## v4.6.0 — ARCH-05: API Adapter + Field Discovery (2026-06-21, P1 — in progress, unmerged)

**Scope:** Fourth slice of Phase 1 — `JIRA-06`, the data-normalization layer that makes the previously-built connect/test plumbing actually useful: converting raw Jira REST issues into the same shape the file-upload pipeline already produces. No UI changes — this is server-only infrastructure, same "no UC for vaporware" treatment as the original Gateway foundation.

- **`src/services/jira/apiAdapter.ts`** (`normalizeJiraIssue()`/`normalizeJiraIssues()`): standard fields (Issue Type, Summary, Status, Project, Assignee, Reporter, Priority, Resolution, Labels, Fix Version/s, Created/Updated/Resolution/Due Date) read from their fixed Jira REST path; custom fields (Story Points, Sprint, Epic Link, Business Value, Risk Score) resolved via the connection's `fieldMapping`, with shape-specific normalization (Sprint handles both the modern array-of-objects format and the legacy greenhopper string; Epic Link handles both a plain key string and an object). Verified the output passes `validateIssueData()` unchanged — `calculateDashboardMetrics()` needs zero changes regardless of data source.
- **`src/services/jira/fieldDiscovery.ts` + `GET /api/admin/jira-connections/[id]/fields`** (unplanned, discovered mid-build, `JIRA-06b`): the adapter's `fieldMapping` can't be populated without knowing an instance's actual `customfield_NNNNN` → name mapping, so built the discovery half too — calls `GET /rest/api/{2|3}/field` through the Gateway.
- Extracted `buildJiraAuthHeader()`/`jiraMyselfPath()`/`jiraFieldPath()` into `src/services/jira/auth.ts`, removing the same auth-header-building logic that had been duplicated across the test-connection, field-discovery, and App Config test-token routes.
- **Verified live against the user's real Jira Cloud instance** (not a mock): field discovery returned all 117 real fields, correctly surfacing both "Story Points" (`customfield_10033`) and "Story point estimate" (`customfield_10016`) by name.
- New tests: `jiraApiAdapter.test.ts` (11 tests, `TC-JIRA-14–24`) + 4 new route tests (`TC-JIRA-25–28`) in `jiraConnections.test.ts`.
- Suite: **604/65, all passing.** Lint and build clean.
- Field-mapping *UI* (picking which discovered field maps to which canonical name) is still deferred — this ships the data plumbing only, not yet wired to any admin screen.

---

## v4.5.5 — App Config: Visible Edit-Mode Styling + Per-Section Save/Test (2026-06-21, P3 — UX polish)

**Scope:** Follow-up to v4.5.4's edit-lock — user reported two remaining gaps: unlocking a section looked visually identical to locked (no clear "you're editing now" cue), and there was no way to save or verify a section's change without scrolling to the single global button at the bottom of the page.

- **Edit-mode styling:** an unlocked section now gets an amber border + ring around the whole card, and its "Lock" button turns amber — clearly distinct from the neutral slate "locked" state.
- **Per-section actions:** each unlocked section now shows its own "Save this section" button (calls the same save endpoint — safe regardless of which sections are locked, since locked fields still hold their loaded values).
- **New: "Test token" for the Jira section** — previously only SMTP had an inline test ("Send Test Email"); Jira had none. Added `POST /api/admin/app-config?action=test-jira`, which verifies the in-progress (possibly unsaved) token against the most recently created `JiraConnection`'s base URL/deployment type through the same Gateway path as the per-connection test, and reports the connected account name or a clear error inline. If no `JiraConnection` exists yet, it says so instead of failing silently.
- Moved "Send Test Email" from the disconnected global action row into the SMTP section itself, next to its new "Save this section" button.
- Verified live in a real browser against the user's actual configured Jira connection: clicked "Test token" and got a genuine successful response (`"Connected to "Test" as Ali Abu Ras"`), confirming the full save → resolve-token → Gateway-call path works end to end, not just in isolation.

### No new automated tests (UI interaction + a thin route wrapper around already-tested Gateway/app-config primitives; manually verified per CLAUDE.md).

---

## v4.5.4 — App Config: Per-Section Edit Lock (2026-06-21, P3 — UX polish)

**Scope:** Fixes per user feedback after using the new Jira Integration tab.

- **Naming:** briefly considered renaming the tab to "App Config / SMTP" for consistency with an older sidebar label, but since this tab now covers SMTP, the Jira API token, and App URL — not just SMTP — the user kept the existing plain "App Config" name (the more accurate one) on both the page header and the sidebar.
- **Per-section edit lock:** all fields in `AppConfigPanel.tsx` (SMTP, Jira API Token, App URL) used to be directly editable at all times. Added an independent "Edit" / "Lock" toggle button to each section header — fields render disabled (grayed out) until that section's Edit button is clicked, reducing the chance of an accidental change to live SMTP/Jira credentials. All three sections auto re-lock after a successful save.
- Verified in a real browser: locked state shows all fields grayed out with "Edit" buttons; clicking one unlocks only that section's inputs (others stay locked); no console errors.

### No new tests (pure UI interaction change, manually verified per CLAUDE.md).

---

## v4.5.3 — ARCH-05: Jira Token Moved to Encrypted App Config (2026-06-20, P1 — in progress, unmerged)

**Scope:** User feedback on the previous slice — explicitly rejected the env-var-only token design ("no need for hard code... this should be in the config"). Moved the Jira API token/PAT into the same encrypted App Config system already used for SMTP credentials, instead of requiring a `.env` edit + server restart.

- `src/lib/app-config.ts`: new `AppJiraConfig`/`AppConfig.jira`, `SafeAppConfig.hasJiraToken`, `getJiraApiToken()` — `GATEWAY_JIRA_API_TOKEN` is now a fallback/override (same precedence as `SMTP_USER`/`SMTP_PASS`), not the primary path.
- New "Jira API Token" field in Admin Settings → App Config (`AppConfigPanel.tsx`), same masked/"leave blank to keep existing" UX as the SMTP password field.
- Both Jira connection routes now resolve the token via `getJiraApiToken()` instead of reading `process.env` directly.
- **Caught via real end-to-end browser testing, not unit tests:** saving the token to encrypted config alone didn't actually work — the Backend Gateway's `getProviderConfig()` independently re-checked `process.env` credential presence regardless of the route's resolved token, so every test-connection call silently failed with "Provider not configured." Fixed by adding `credentialsPresentOverride` to `GatewayRequestOptions`/`ProviderConfigOverrides`, letting a caller with non-env-sourced credentials tell the gateway they're present. Re-verified live: saved a token via App Config, created a connection, clicked Test — got a real outbound HTTP call (a legitimate 401 from the fake test token, not a config-wiring error).
- Updated the connection form's "where to get this info" guide and `.env.example` to describe App Config as the primary path.
- New tests: `TC-GW-23`/`23b` (gateway.test.ts, now 27 tests); `jiraConnections.test.ts` updated to mock `getJiraApiToken()` instead of `process.env`.
- `product/JIRA_INTEGRATION_DESIGN.md` §2 and `product/SRS.md` Addendum G (new FR-341) updated to match.
- Suite: **589/64, all passing.** Lint and build clean.

---

## v4.5.2 — ARCH-05 Phase 1 Continues: Connection Admin UI (2026-06-20, P1 — in progress, unmerged)

**Scope:** Third slice of `product/JIRA_INTEGRATION_DESIGN.md` Phase 1 — the actual admin-facing UI for the routes built in the previous slice. This is the first ARCH-05 slice a user can actually see and click through.

- New "Jira Integration" tab in Admin Settings (`?tab=jira`): `src/components/admin/JiraConnectionsPanel.tsx`, wired into `src/lib/adminConsole.ts` (`ADMIN_TABS`/`Tab`), `AdminNavSidebar.tsx` (`SETTINGS_SUB_ITEMS`), and `app/admin/settings/page.tsx`.
- Form to create a connection (name, deployment type, base URL, Cloud email, project keys) and a "Test connection" button per row showing the live result inline — connected account name on success, the exact error on failure (e.g. the token-not-configured message).
- **Caught via real browser testing, not just unit tests:** `app/admin/settings/page.tsx` has a second, separate `VALID_TABS` array (distinct from `ADMIN_TABS`) gating which `?tab=` values are honored — missed it on the first pass, the tab silently fell back to "User Management" with no error. Fixed.
- Verified end-to-end in a real Chromium browser: empty state, form, connection creation, and the test-connection failure path (token not set) all render correctly; desktop layout unaffected for every other tab.
- Now that an admin can actually reach this feature, added the FR/UC layer that schema-only and API-only slices correctly skipped: `product/SRS.md` Addendum G (FR-337–FR-340), `product/USE_CASES.md` UC-110, `product/TEST_CASES.md` §9.57 cross-referenced.
- Suite: **587/64, all passing** (no new tests this slice — UI verified via manual browser testing per CLAUDE.md, not new automated coverage). Lint and build clean.

---

## v4.5.1 — ARCH-05 Phase 1 Continues: Connection Admin Routes (2026-06-20, P1 — in progress, unmerged)

**Scope:** Second slice of `product/JIRA_INTEGRATION_DESIGN.md` Phase 1 — API routes to create, list, and test a Jira connection. **Still no admin UI** (JIRA-04) — these routes are reachable today only via direct API calls or tests.

- `POST /api/admin/jira-connections` / `GET /api/admin/jira-connections` — admin-only, validates deployment type/base URL/Cloud email, audits creation. Token never accepted in the body, never returned in responses — only a `hasGatewayToken` presence flag (mirrors the existing `app/api/admin/storage` pattern).
- `POST /api/admin/jira-connections/[id]/test` — calls `GET /rest/api/{2|3}/myself` through the existing Backend Integration Gateway (`callExternal()`), with Basic auth for Cloud (email + token) or Bearer auth for Server/DC (PAT). Records `lastSyncStatus`/`lastSyncError` on the connection either way.
- **Gateway enhancement (unplanned, discovered mid-build, `JIRA-05b`):** `callExternal()`/`getProviderConfig()` only ever supported one global base URL per provider type (one env var) — but `JiraConnection` allows multiple admin-configured connections. Added optional `baseUrlOverride`/`extraAllowedHosts` to `GatewayRequestOptions` — additive, backward-compatible, all existing Gateway tests and call sites unaffected. Credential *values* still always come from env only, per the design doc's auth model — never overridden per-connection.
- `GATEWAY_JIRA_API_TOKEN` documented in `.env.example`.
- New tests: `src/__tests__/jiraConnections.test.ts` (13 tests, `TC-JIRA-01–13`) + 2 new Gateway tests (`TC-GW-22`/`22b`). `product/TEST_CASES.md` §9.57 added.
- Suite: **587/64, all passing.** Lint and build clean.

---

## v4.5.0 — ARCH-05 Phase 1 Begins: Jira Connection Schema (2026-06-20, P1 — in progress, unmerged)

**Scope:** User approved implementation of `product/JIRA_INTEGRATION_DESIGN.md`. This entry covers the first slice only — Prisma schema, not yet user-facing. Branch `feature/arch-05-jira-integration`, intentionally **not merged to main** until the full feature (admin UI, sync, tests, docs) is delivered.

- New `JiraConnection` Prisma model (id, name, deploymentType, baseUrl, authEmail, projectFilters, fieldMapping, refresh settings, last-sync status fields, createdByUserId). The Jira API token itself is never stored in this table — only in `GATEWAY_JIRA_API_TOKEN` env, per the design doc's auth model.
- `ImportLog` extended with `sourceType` (`"file" | "api"`) and a nullable `jiraConnectionId` FK; `fileName`/`fileSize`/`fileType` made nullable since they don't apply to API-sourced rows.
- Migration `20260620132026_add_jira_connection` created and applied to the dev DB. Had to baseline 5 pre-existing migrations first (the dev DB was never initialized with migration tracking — only `db push`), via `prisma migrate resolve --applied`.
- **Found and flagged (not fixed, tracked as `DRIFT-01`):** `SystemErrorLog` exists in the dev DB but has no tracked migration at all — a fresh-environment `prisma migrate deploy` would never create it. Pre-existing, unrelated to this change; scoped this migration to exclude it so it didn't error on "table already exists."
- Verified no data loss: all 48 existing `ImportLog` rows and 3 `User` rows intact post-migration. Full suite (572/63), lint, and build all still pass.

### No user-facing changes yet. No new tests yet (schema-only slice; tests land with JIRA-06/07/09).

---

## v4.4.4 — ARCH-05 Design Doc: Jira API Read-Only Integration (2026-06-20, P2 — planning only)

**Scope:** Closed `ARCH-05` in `TODO-List.md` Section 19 with a design document for a future live Jira REST API read integration — **design only, no code implemented**, per this section's "do not implement without explicit approval" rule.

- New `product/JIRA_INTEGRATION_DESIGN.md`: auth model (API token/PAT, routed through the existing `FR-313` Gateway `jira` provider blueprint), API scope (JQL search via guided filters, not raw JQL entry), field mapping (extends the existing CSV column-mapping pattern one layer earlier — Jira field IDs → the same canonical `JiraIssue` shape the file-upload pipeline already produces, so every downstream metric/dashboard needs zero changes), three-tier refresh strategy (manual ships first; scheduled and webhook deferred), a new `JiraConnection` Prisma model plus two new nullable `ImportLog` columns, a failure-mode table (expired token, rate limiting, partial field permissions, partial pagination), and a fallback contract mirroring the existing `loadMetricsWithSource()` dual-source pattern.
- Three-phase rollout plan; non-goals explicitly listed (write-back, OAuth, multi-tenant, raw JQL, incremental sync, webhooks — each deferred to its own future design pass).
- `TODO-List.md` ARCH-05 marked "Design Done — awaiting approval to implement."

### No code changes. No new tests.

---

## v4.4.3 — USERREQ-31 Closure: Full Green Test Suite (2026-06-20, P1)

**Scope:** Closed the last open item from the Add-Member Request follow-up work — the 2 pre-existing, unrelated test failures flagged in USERREQ-31.

- **`adminUsers.test.ts`**: `DELETE /api/admin/users` calls `prisma.userAddRequest.updateMany(...)` to cancel the deleted user's pending add-requests; the mock never defined that method. Added `userAddRequest: { updateMany: jest.fn() }`.
- **`roles.test.ts`**: the 2026-06-16 "Update roles and UI layout/styles" commit intentionally made `/portfolio` and `/teams` universal Analytics routes (visible to every role, per the comment on `ANALYTICS_ROUTES` in `src/lib/roles.ts`), but this test's assertions were never updated to match. Fixed the two stale `toBe(false)` expectations to `toBe(true)`. No production code changed — `allowedRoutePrefixesForRole()` already behaved correctly.
- Suite: **572/63, all passing.** Lint and build clean.

---

## v4.4.2 — Add robots.txt (2026-06-20, P3 — hardening)

**Scope:** No `robots.txt` existed; crawlers were free to index every route, including `/admin/*` and `/api/*`. Per `middleware.ts`'s `PROTECTED` list, every route except `/login` requires authentication — there is no public content to index, so the policy is a blanket disallow.

- Added `public/robots.txt` (`User-agent: *` / `Disallow: /`).
- **Note:** the idiomatic Next.js 14 approach is a native `app/robots.ts` metadata route, which was tried first — but this repo's absolute path contains an apostrophe (`Ali's MacBook Pro`), which trips a real bug in `next/dist/build/webpack/loaders/next-metadata-route-loader.js` (its generated error-handling code wraps a `JSON.stringify()`'d path — which uses double quotes — inside a single-quoted string; the apostrophe in the path terminates that string early, breaking the build with a misleading "Default export is missing" error). Confirmed via an isolated repro in a path with an apostrophe. Used a static `public/robots.txt` instead, which bypasses the loader entirely. Revisit `app/robots.ts` if this directory is ever moved to an apostrophe-free path.

---

## v4.4.1 — USERREQ-25/27 Closure: Rate Limiting + Mobile Layout, Plus Test Suite Repair (2026-06-20, P1)

**Scope:** Closed the two remaining open items from the Add-Member Request Workflow (Section 15): rate limiting and mobile layout. Also fixed pre-existing test/mock drift discovered along the way.

### USERREQ-25 — Rate limiting
- `POST /api/user-add-requests` now rejects a requester's 11th submission within a 10-minute window with HTTP 429 (`SUBMIT_RATE` in-process map, same pattern as the existing login/upload limiters — keyed by `session.userId` since the route is authenticated).
- New test `TC-REQ-18` in `userAddRequests.test.ts`.

### USERREQ-27 — Mobile layout
- `RequestAddMemberModal` was already mobile-correct; verified at 375px in a real browser.
- Found and fixed the actual blocker: `AdminNavSidebar` was a fixed 228px rail with zero responsive breakpoint, squeezing every `/admin/*` page — including the Member Requests queue (`UserAddRequestsPanel`) — off-screen under 768px. Added a collapsible mobile top bar + dropdown nav panel mirroring the existing `AppShell` mobile-nav convention, gated at the same `767px` breakpoint used elsewhere (`AdminNavSidebar.module.scss`, `app/admin/layout.module.scss`). Desktop (≥768px) is visually unchanged.
- Verified end-to-end at 375px: opened the admin menu, navigated to Member Requests, expanded a real pending request, and confirmed the temp-password field, Generate/show-password buttons, decision note, and Accept/Reject buttons all render without overflow.

### Test suite repair (discovered while verifying the above)
- `userAddRequests.test.ts` had 4 silently-broken tests (`TC-REQ-01`, `TC-REQ-04`, `TC-REQ-10`, `TC-REQ-13`) caused by mock drift: the ghost-session requester guard (added in a later commit) made every test's blanket `prisma.user.findUnique` mock resolve `null` for the requester lookup too, and the `safeNotifications`/`safeAuditEvent` refactor switched `notification.create` to `notification.createMany`, which the mocks never picked up. Fixed both — the production code was correct throughout; only the test mocks were stale.
- Flagged (not fixed — different files, out of this change's scope) the same class of bug in `adminUsers.test.ts`/`roles.test.ts`: `DELETE /api/admin/users` calls `prisma.userAddRequest.updateMany(...)` which isn't mocked there. Logged as `USERREQ-31`.
- Suite: 572 tests / 63 suites (570 passing — the 2 `USERREQ-31` failures are pre-existing and unrelated to this change). Lint and build both pass.

---

## v4.3.7 — REC-12/REC-13 Closure: Add-Member Request + Backend Gateway Status Reconciliation (2026-06-20, P0 — documentation)

**Scope:** `TODO-List.md` Section 10 still listed REC-12 and REC-13 as "❌ Not started" even though both underlying features had already been fully implemented and documented in earlier passes (USERREQ-07–24 and GW-01–25). This pass closes the stale status, not new work.

### Documentation
- **REC-12** (User Add-Member Request Workflow): Verified implemented end-to-end — UC-095–UC-099, SCN-050, UJ-035, FR-314–FR-319, `TC-REQ-01` onward. Marked ✅ Done in `TODO-List.md`.
- **REC-13** (Backend Gateway): Verified implemented as a server-only infrastructure foundation (`src/server/gateway/`) with zero live providers and no end-user UI — correctly has no UC authored, consistent with the "no UC for vaporware" principle already documented in `USE_CASES.md`. Anchored to FR-313, `DEVELOPER_GUIDE.md`, `TC-GW-01`–`TC-GW-21` (+05b/15b). Marked ✅ Done in `TODO-List.md`.

### No code changes. No new tests (all referenced TC-REQ-* and TC-GW-* cases already exist).

---

## v4.3.6 — REC-14 Closure + UC-101 Traceability + Roadmap Section 12 Row (2026-06-19, P0 — documentation)

**Scope:** REC-14 verification (Role-Based Coaching), UC-101 back-link additions, and Section 12 matrix row for the Delivery Roadmap feature.

### Documentation
- **REC-14 closed**: Role-Based Coaching feature verified not implemented (COVER-21 — no pages/routes/code exist). Correctly marked as P1 roadmap item; no speculative UC/SCN/UJ/TC authored. Status updated to ✅ Done in TODO-List.md.
- **UC-101** (View Delivery Roadmap): Added `Related UJ: UJ-036`, `Related TC: TC-ROAD-01–TC-ROAD-05`.
- **Section 12 matrix**: New row added for FR-326/327 (Delivery Roadmap — epic cards, forecast labels, filter/sort), anchoring UC-101 / SCN-051 / UJ-036 / TC-ROAD-01–05.

### No code changes. No new tests.

---

## v4.3.5 — REC-15/REC-16 Closure: Retro + Forecast Use Case Traceability (2026-06-19, P0 — documentation)

**Scope:** UC-102/103/104 existed but lacked `Related UJ` / `Related TC` back-links and had no Section 12 matrix rows. This pass closes REC-15 (Retro) and REC-16 (Forecast).

### Documentation
- **UC-102** (View Delivery Forecast): Added `Related UJ: UJ-037`, `Related TC: TC-FCAST-01–TC-FCAST-05`.
- **UC-103** (Run a Sprint Retrospective in App): Added `Related UJ: UJ-038`, `Related TC: TC-RETRO-01–TC-RETRO-07`.
- **UC-104** (Download Retrospective Template): Added `Related SCN: SCN-056`, `Related TC: TC-RETRO-05`.
- **SCN-056** — "Team Member Downloads the Retrospective CSV Template for Offline Use": narrates the `downloadTemplate()` client-side Blob flow. Written in `product/SCENARIOS.md`.
- **UJ-038 Alternate B** — Template Download: 4-step alternate flow for the CSV download path added to UJ-038's table. Written in `product/USER_JOURNEYS.md`.
- **Section 12 matrix**: 3 new rows added for FR-328/329 (Forecast), FR-330/331/332 (Retro form), FR-333 (Template download).
- **REC-15 and REC-16** marked ✅ Done in TODO-List.md.

### No code changes. No new tests (TC-FCAST-01–05 and TC-RETRO-01–07 already exist or are on active branches).

---

## v4.3.0 — System Error Observability, Bulk Admin Operations & Ghost Session Protection (2026-06-18)

### Admin — System Error Log
- Added `/admin/system-errors` — new admin-only page that surfaces every Prisma / database failure captured by the system in real time.
- Each error card uses a two-panel layout: **What failed** (red-accented, error code badge, human-readable cause, raw Prisma message snippet) and **How it was handled** (green / blue / amber per resolution state, with description of what the system did).
- Error codes covered: `P2003` foreign-key constraint, `P2025` record not found, `P2002` unique constraint, `P2014` relation violation.
- Resolution states: `logged` (needs attention), `auto-fixed` (system recovered automatically), `retried` (manually retried), `resolved` (dismissed by admin), `skipped` (cascade prevented).
- Retry action re-runs the stored operation payload (AuditEvent or notification) against the live database.
- Dismiss and "Mark all resolved" bulk actions available.
- Added `SystemErrorLog` Prisma model: `id`, `errorCode`, `errorMessage`, `prismaModel`, `operation`, `context`, `payload` (JSON replay), `resolution`, `retryCount`, `lastRetriedAt`, `resolvedAt`, `createdAt`.
- Added System Errors link to the admin sidebar nav.

### Admin — Bulk User Operations
- Admin users table now supports checkbox multi-select (select all excluding self, or per-row).
- Bulk delete: confirmation dialog before removing all selected users.
- Bulk role change: apply a new role to all selected users in one action.
- Checkbox column is hidden when the admin is the only user in the list.

### Reliability — Ghost Session Protection
- Iron-session cookies persist for 8 hours even after a user account is deleted. API writes referencing the deleted `userId` now return HTTP 401: "Your account no longer exists. Please log in again."
- `DELETE /api/admin/users` cancels all `pending` UserAddRequest entries for the deleted user's email before deletion, preventing orphaned add-request records.
- `POST /api/user-add-requests` validates `session.userId` still exists in the database before creating the record.

### Reliability — Safe Database Helpers (`src/lib/system-error-logger.ts`)
- `safeAuditEvent(data)` — on P2003 retries with `userId: null` (preserving the audit record) and logs as `auto-fixed`.
- `safeNotifications(data, context)` — wraps `notification.createMany` with retry + SystemErrorLog write.
- `withDbRetry(fn, opts)` — exponential back-off retry (default 3 retries, 400 ms base delay); skips non-retriable codes P2003, P2025, P2002, P2014, P2015.
- `logSystemError(opts)` — safe fire-and-forget write to `SystemErrorLog`; never throws.

### Frontend — Admin SCSS Migration
- All 6 admin/backend pages migrated from inline `style={{}}` props to per-page SCSS modules (`page.module.scss`).
- Dynamic data-driven values routed exclusively through CSS custom properties (`--bar-width`, `--role-color`, `--swatch-color`, etc.).
- Status and variant appearances driven by `data-*` attribute SCSS selectors throughout.

### Login / Auth
- Login error alert redesigned: error message shown in red, solution guidance in green, with "Show/Hide solution" toggle and contextual fix advice per error type.

---


## v4.9.3 — Comprehensive Product Doc Audit + Route Security Fix (2026-06-16, P0 — documentation)

### Security
- **Middleware route protection gap closed**: 10 routes added v4.6–v4.9 (`/roadmap`, `/forecast`, `/retro`, `/data-quality`, `/delivery-mix`, `/flow-health`, `/release-readiness`, `/sprint-kanban`, `/work-explorer`, `/column-mapping`) were present in `canAccessRoute()` role allowlists but **missing from the `PROTECTED` array and `config.matcher`** in `middleware.ts`. Unauthenticated requests to these routes were not redirected to `/login`. All 10 routes now correctly included in both `PROTECTED` and `config.matcher`.

### Documentation — SRS.md (v4.5.2 → v4.9.3)
- **§1.2 Scope — dashboard sub-pages**: Corrected "11 dashboard pages" to **15 dashboard pages** with all names listed: summary, priority-attention, sprint, epics, labels, flow-health, throughput, work-explorer, data-quality, release-readiness, delivery-controls, actions, delivery-composition, epic-readiness, kanban-health (sprint-status, key-metrics, ownership, quarter-statistics, visual-analytics added in v4.9.0 refactor were not documented).
- **§1.2 Scope — standalone analytics pages**: Added new section documenting 6 standalone analytics pages that were completely absent from SRS scope: `/data-quality`, `/delivery-mix`, `/flow-health`, `/release-readiness`, `/sprint-kanban`, `/work-explorer`.
- **§8.1 API Route Inventory**: Updated "36 live route handlers" → **44 live route handlers** (verified via `find app/api -name "route.ts"`). Added missing `/api/admin/app-config` row (GET + PUT + POST for SMTP configuration, introduced v4.9.0 Admin Settings console).
- Version bumped 4.5.2 → 4.9.3, date updated, revision history extended with 3 new entries.

### Documentation — DEVELOPER_GUIDE.md
- **File tree**: Updated dashboard section from 11 → 15 routed sub-pages with specific names; added 6 standalone analytics pages; added `src/components/dc-shell/` library with all 6 components; added `AdminNavSidebar`, `DashboardTopbar`, `DashboardSidebarNav`.
- **§3a Frontend Architecture Standards**: New section added documenting the Tailwind-layout / SCSS-identity hybrid architecture, Rule 1 CSS custom property exception, data-attribute pattern for status-driven appearance, and Admin Layout Injection Pattern.
- **§4 Navigation**: Updated to include standalone pages and Planning routes; added subsections for all 21 new routed pages.

### Documentation — APPENDIX.md
- Added 9 new glossary entries: Dashboard Sub-Pages, Standalone Analytics Pages, Smart Actions Page, Delivery Composition Page, DC Shell, DC_NAV_GROUPS, App Config, Admin Layout Injection, Wiki Theme.

### Documentation — USE_CASES.md
- **UC-107 — Navigate Dashboard Sub-Pages**: New use case for DashboardSidebarNav browsing across 15 sections.
- **UC-108 — Access Standalone Analytics Page**: New use case for the 6 standalone analytics routes with per-page postconditions.
- **UC-109 — Admin Manages App Configuration**: New use case for SMTP config via `/admin/settings` App Config tab and `/api/admin/app-config`.

---

## v4.9.2 — P0: Test Fixes + CSS Token System Completion (2026-06-16, P0 — quality)

### Fixed
- **`adminSettingsConsole.test.ts` TC-AC-01**: Updated expected `ADMIN_TABS` ID list from 8 → 9 tabs to include `'config'` (App Config tab added in v4.9.0 but test not updated). All 9 tabs now asserted: `['users', 'requests', 'config', 'retention', 'thresholds', 'orphan', 'backup', 'cloud', 'browser']`.
- **`userAddRequests.test.ts` TC-REQ-10**: Removed stale assertion `expect(body.tempPassword).toBe('ValidPass1')`. The `PATCH /api/admin/user-add-requests/[id]/accept` route deliberately omits `tempPassword` from the response (it is delivered via welcome email per v4.5.1 / FR-325). The assertion was never updated after commit `c00c93b` removed it from the response.

### Verified
- **Test suite**: 571 tests / 63 suites — all passing.
- **Lint**: passes (warnings for legacy inline styles in tech-debt files; zero errors).
- **Build**: `npx next build` passes — all routes compiled successfully.

---

## v4.9.1 — Admin Layout Overhaul + Developer Wiki Theme (2026-06-14, P1 — UI)

### Added
- **`app/admin/layout.tsx`**: New Next.js App Router layout wrapping all `/admin/*` routes. Injects `DashboardTopbar` (fixed 52px header) and `AdminNavSidebar` (fixed 228px left sidebar). Individual admin page files no longer manage their own shell.
- **`src/components/admin/AdminNavSidebar.tsx`** + **`AdminNavSidebar.module.scss`**: Fixed left sidebar with 6 admin nav items (Users, Requests, Settings, Diagnostics, Security, Logs). Active state via `usePathname()`: `--color-primary-soft` background + `--color-primary` text + 700 weight. SCSS tokens only — no hardcoded values.
- **`app/admin/layout.module.scss`**: Shell (flex column, full viewport), body (flex row, `margin-top: var(--header-height)`), main (`margin-left: var(--sidebar-width)`, `padding: var(--space-6)`).
- **`app/developer/layout.tsx`** + **`app/developer/layout.module.scss`**: New layout for `/developer` providing `DashboardTopbar` only (the page owns its own internal docs sidebar).
- **`app/developer/page.module.scss`**: 208-line light wiki theme. `.wiki` root class remaps all `--dc-*` dark palette tokens to light equivalents so every `var(--dc-xxx)` in the 1 650-line page resolves to a light value automatically — no line-by-line edits needed. Key remappings: `--dc-p1 → --color-text-primary`, `--dc-s1 → --color-subtle`, `--dc-s2 → --color-surface`, `--dc-bdr → --color-border`, `--dc-acc → --color-primary`. SCSS sub-rules style sidebar, nav items (active state: blue left border + `color-mix` background), search input, wiki article typography (headings, code blocks, tables, blockquotes, links, `<hr>`), and mobile toggle.

### Changed
- **6 admin page files** (`settings/`, `users/`, `theme/`, `diagnostics/`, `security/`, `logs/`): Removed `<AppShell showNav>` wrappers — shell is now provided by `app/admin/layout.tsx`.
- **`src/components/admin/AdminConsoleLayout.tsx`**: Removed internal two-column grid + `<aside>` (sidebar now injected by layout). Return is now a bare fragment: breadcrumb header → title/description → stats grid → `{children}`. Inline styles migrated from dark `dc-*` fallbacks to light `color-*` semantic tokens.
- **`app/developer/page.tsx`**: Removed `<AppShell showNav>` wrapper. Root div adds `styles.wiki` class. Mobile toggle, nav items, search input, table row hovers — all migrated from inline orange/dark styles to SCSS module classes.

---

## v4.9.0 — Navigation Architecture Overhaul + Frontend Standards (2026-06-14, P1 — architecture)

### Added
- **`src/components/dc-shell/`** — New Delivery Clarity shell component library: `DCActionBoard.tsx`, `DCKpiCard.tsx`, `DCPageSidebar.tsx`, `DCStatusChip.tsx`, `DCTopbar.tsx`, `DeliveryClarityShell.tsx`. Foundation for consistent chrome across non-dashboard pages.
- **`src/styles/_tokens.scss` — 23 legacy token aliases**: Added `--dc-text`, `--dc-text-2`, `--dc-text-3`, `--dc-brand`, `--dc-brand-soft`, `--dc-line`, `--dc-surface`, `--dc-surface-soft`, `--dc-surface-blue`, `--dc-success`, `--dc-success-soft`, `--dc-critical`, `--dc-critical-soft`, `--dc-warning`, `--dc-warning-soft`, `--dc-info`, `--dc-info-soft`, `--n900`, `--n500`, `--blue`, `--dc-shadow-card`, `--dc-purple`, `--dc-purple-soft` as aliases pointing to the semantic `--color-*` layer. This bridges older pages and components that used the legacy names with the current token system.
- **`app/globals.scss` — `.dc-card`, `.dc-kpi-card`, `.dc-kpi-icon`, `.dc-kpi-label`, `.dc-kpi-value`, `.dc-kpi-sub` utility classes**: Used throughout `work-explorer`, `data-quality`, and the `DCKpiCard` component but previously undefined — caused invisible cards and missing borders on those pages.
- **`app/column-mapping/page.tsx`**: Created new `/column-mapping` route with proper AppShell — was a 404 previously. Column mapping preview before dashboard generation.
- **`src/components/dc-shell/navigation.ts` (`DC_NAV_GROUPS`)**: Single source of truth for all navigation items. AppShell now consumes this config — menus are no longer duplicated between AppShell and DashboardTopbar.
- **`/admin/users` User Management page** (`app/admin/users/page.tsx`): Admin page for managing platform users.
- **Load animations**: `@keyframes barGrow`, `@keyframes circleExpand`, `@keyframes fadeSlideUp` added to dashboard bars, charts, and circles — `animation-delay` staggers by index. `@media (prefers-reduced-motion)` disables all animations.

### Changed
- **Dashboard refactored into 11 independent routed pages** under `app/dashboard/[section]/page.tsx`: each section (summary, priority-attention, sprint, epics, labels, flow-health, throughput, work-explorer, data-quality, release-readiness, delivery-controls) is its own Next.js page. Previously a single monolithic `app/dashboard/page.tsx`.
- **4 Deep Dive pages restored** after refactor: `app/dashboard/data-quality/`, `app/dashboard/work-explorer/`, `app/dashboard/release-readiness/`, `app/dashboard/delivery-controls/` (these were inadvertently lost in the initial split and restored in a follow-up commit).
- **`DashboardTopbar`**: Redesigned to correct 3-zone layout — `[Brand zone] [flex-1 spacer] [Nav groups] [Right rail]`. Nav groups now match AppShell groups exactly (same `DC_NAV_GROUPS` source). Active state: blue 2px underline on button. Right rail: "New Upload" CTA + user avatar/menu.
- **AppShell header** brought structurally identical to DashboardTopbar: same 3-zone layout, same nav groups from `DC_NAV_GROUPS`, consistent spacing and token usage.
- **`/summary` page**: Restored as standalone AppShell page (no DashboardTopbar/sidebar injection). Visual style matches the dashboard without adding the sidebar chrome.
- **`app/dashboard/flow-health/`**: Reset Filters + Export CSV controls moved into the filter card (were floating outside).
- **UserMenu**: Wired into DashboardTopbar with role-based sidebar section filtering.

### Fixed
- **`/dashboard` routing**: Corrected Next.js App Router page resolution — dashboard no longer falls through to wrong route.
- **Missing routes in `canAccessRoute`**: `da75e40` added `/column-mapping`, `/data-quality`, `/work-explorer`, `/delivery-mix`, `/flow-health`, `/release-readiness`, `/sprint-kanban` to the role allowlists.
- **`statusDist.map` index**: Missing `index` parameter in flow-health page caused React key warning.
- **Placeholder text**: Ensured `::placeholder` is always `--color-text-muted` / `--dc-p3` across all themes — was white/invisible in some dark contexts.
- **ScoreRing SVG track**: `data-quality/page.tsx` — track circle stroke changed from `rgba(255,255,255,0.12)` (invisible on light background) to `var(--color-border, #e2e8f0)`.
- **Next.js `distDir`**: Redirected build output outside iCloud Drive to prevent chunk eviction during development.

### Architecture — Frontend Standards (permanent, applies to all future changes)
- **Zero inline `style` props** (except CSS custom property exception for data-driven values).
- **SCSS modules** (`ComponentName.module.scss`) for all custom component styling.
- **Tailwind** for layout utilities only (flex, grid, spacing, responsive breakpoints).
- **Design tokens** (`src/styles/_tokens.scss`) as single source of truth — no hardcoded hex values.
- **`clsx`** for conditional class composition.
- **`DC_NAV_GROUPS`** as single nav source — no duplicated item lists.
- **ESLint rule** (`react/forbid-dom-props`) enforces `style` prop prohibition.

---

## v4.8.0 — Dashboard 3-Zone Layout: DashboardTopbar + DashboardSidebarNav (2026-06-13, P1 — UI)

### Added
- **`DashboardTopbar`** (`src/components/dashboard/DashboardTopbar.tsx`): Fixed 52px topbar for `/dashboard`. Logo zone (28px blue square + "Delivery Clarity" + "v4.1"), 6 nav button groups with chevrons, SVG ring health pill (circumference 40.84, r=6.5, color bands ≥75 green / ≥60 amber / ≥40 red / <40 dark-red), "New Upload" CTA, user avatar.
- **`DashboardSidebarNav`** (`src/components/dashboard/DashboardSidebarNav.tsx`): Fixed 228px sidebar replacing the generic shell nav. Health block: score number (mono 28px, colored), progress bar (`linear-gradient(90deg, #DC2626 0%, #EA580C 50%, #D97706 100%)`), 2×2 vitals grid (Complete, Critical, Cycle, Est. done). 15 nav items across 3 groups (Overview 5, Delivery 6, Deep Dive 4) with SVG icons, meta text, and colored chips (cc/cw/cg/cm/cn). Active item: `#EFF6FF` bg + 3px `#2563EB` left accent.
- **`activeSection` state** in `app/dashboard/page.tsx`: default `'summary'`. Sidebar click routes via `SIDEBAR_TO_MODE` map → `setSectionMode` + `setExpandedSections` for 12 keys; `'flow'` opens flow panel; `'data-quality'` sets mode; `'summary'` shows new Delivery Summary section.
- **Delivery Summary section**: shown at `activeSection === 'summary'`: title + "Broadcast" chip, 4 KPI mini-cards (Completion, Critical, Avg Cycle, Est. Completion), alert strip (blocked / overdue / orphans), top 3 smart actions.

### Changed
- **`app/dashboard/page.tsx`**: Replaced `<AppShell showNav>` with a full-page 3-zone layout div (DashboardTopbar fixed at top, DashboardSidebarNav fixed left, scrollable `<main>` at `marginLeft: 228px`). All 14 existing sections remain untouched; `display: none` when Delivery Summary is active. Sticky section-switcher bar updated from `top-14` → `top-0` (now relative to scrollable main).
- Loading state updated to standalone full-height centered div (no AppShell dependency).

---

## v4.7.0 — Theme D Restyle P22: Security Checklist (2026-06-11, P1 — UI)

### Changed
- **KPI stat cards**: Security Score → scoreColor (green ≥80 / amber ≥60 / red <60) with matching toneStyle; Passing → dc-green; Warnings → dc-amber; Manual Review → p2/dc-s3 icon.
- **Score banner**: `rgba(34,197,94,0.06)` bg + `rgba(34,197,94,0.18)` border (or amber/red variants for warn/fail); score in mono 32px with scoreColor; status text scoreColor 13px/600; summary p2 10px; `chip c-gr/c-am/c-rd` badge r100.
- **CHECK ITEM containers**: `bg-white border-slate-*` → dc-s2/bdr r9; hover → dc-s3.
- **Status dots**: 18px circles — pass `rgba(34,197,94,0.12)` + dc-green border + #4ade80 icon; fail `rgba(248,113,113,0.12)` + dc-red border; warn `rgba(245,158,11,0.12)` + dc-amber border; manual `rgba(255,255,255,0.07)` + bdr.
- **Title**: `text-slate-800 font-black` → p1 11px/600.
- **Category badge**: `text-slate-400 uppercase` → `chip c-nt` 8px.
- **Severity badges**: plain colored text → `chip c-rd/c-or/c-am/c-nt` based on severity (critical/high/medium/low).
- **Manual review badge**: `bg-slate-200 text-slate-600` → `chip c-nt` 8px.
- **Description**: `text-slate-500` → p2 10px.
- **Expanded Fix/Action panel**: `bg-blue-50 border-blue-200 text-blue-*` → `rgba(232,93,18,0.04)` bg + `rgba(232,93,18,0.12)` border + `2px solid var(--dc-acc)` left border + `0 7px 7px 0` radius; "Fix / Action" label acc2 9px uppercase; text p2 11px.
- **Chevron**: p2 (collapsed) → acc2 (expanded) with rotation.
- **Section headers**: `text-green-600/amber-600/red-600/slate-500` → dc token colors; 9px uppercase 0.07em tracking.
- **Filter dropdowns**: `border-slate-200 rounded-lg` → dc-s3/bdr r8 p2 text.
- **Count label**: `text-slate-400` → p3.
- **Loading**: `text-slate-400` → p3.
- **Error state**: light red → `rgba(248,113,113,0.07)` bg + `rgba(248,113,113,0.18)` border + `#fca5a5` text.
- **About footer**: `bg-slate-50 border-slate-200` → dc-s2/bdr r12.

---

## v4.6.9 — Theme D Restyle P21: Admin Import Logs (2026-06-11, P1 — UI)

### Changed
- **healthChipClass helper**: >80=`chip c-gr`; 60–79=`chip c-acc`; 40–59=`chip c-am`; <40=`chip c-or` — standardises inconsistent prior banding.
- **KPI stat cards**: Import Logs → p1; Successful → dc-green; Failed → dc-red (or p3 when 0); Avg Health → acc2; icon areas use matching toneStyle backgrounds.
- **Loading state**: `text-slate-400` → `var(--dc-p3)`.
- **Error state**: `bg-red-50 border-red-200 text-red-700` → `rgba(248,113,113,0.07)` bg + `rgba(248,113,113,0.18)` border + `#fca5a5` text.
- **Table container**: `bg-white border-slate-200` → dc-s2/bdr r14.
- **Table header**: `bg-slate-50 border-slate-200` → dc-s1/bdr2; header text p3 10px uppercase 0.07em tracking.
- **User column**: name p1 11px/600; email p3 9px.
- **Filename**: p2 10px truncate ellipsis.
- **Type badge**: `chip c-nt` + mono 9px (was plain uppercase text).
- **Issues**: p1 mono bold.
- **Health chip**: threshold system via healthChipClass.
- **Status badge**: `chip c-gr` / `chip c-rd`.
- **Timestamp**: p3 mono 9px.
- **Row hover**: `rgba(255,255,255,0.025)` via onMouseEnter/Leave.
- **Empty state**: p3 italic.

---

## v4.6.8 — Theme D Restyle P20: Help & Documentation (2026-06-11, P1 — UI)

### Changed
- **Hero**: `chip c-acc` "HELP & DOCS" badge (borderRadius 100); title p1 26px/800; subtitle p2 13px; stat chips dc-s1/bdr r8 with acc2 mono numbers and p3 labels.
- **Search bar**: dc-s2/bdr r12 full-width; p3 🔍 icon; p1 input text; acc focus ring `rgba(232,93,18,0.25)` with 3px box-shadow.
- **Category cards (4 grid)**: `borderTop: '2px solid var(--dc-acc)'`; dc-s2/bdr r10; icon 22px; title p1 14px/600; desc p2 11px; sub-topic pills `chip c-nt` r999; hover → `chip c-acc` colors via onMouseEnter/Leave.
- **Active card state**: dc-s3 bg + `0 0 0 1px rgba(232,93,18,0.18)` box-shadow.
- **Filter pills**: active `chip c-acc` r100; inactive `chip c-nt` + 1px bdr r100.
- **SectionCard collapsed**: dc-s2/bdr r9; p1 13px/600 title; p2 10px count + chevron; hover → dc-s3 bg.
- **SectionCard expanded**: `rgba(232,93,18,0.03)` bg + `rgba(232,93,18,0.14)` border + `2px solid var(--dc-acc2)` left border + `border-radius: 0 9px 9px 0`; title acc2; chevron acc2.
- **AccordionItem rows**: dc-bdr top divider; 5px 8px padding; `rgba(255,255,255,0.04)` hover bg r6; p2 11px/600 question; open state → acc2 text + acc2 chevron.
- **Expanded answer**: p2 13px / 1.75 line-height.
- **Search highlight mark**: `rgba(232,93,18,0.3)` bg + p1 text (replaced light-mode yellow).
- **Inline JSX nodes** (aliases table, API table, export-guide lists, cloud-sync list, export-sheets): converted from Tailwind light-mode classes to dc token inline styles; tables use dc-s1/bdr2 header and dc-bdr row dividers; canonical fields acc2 mono; API routes acc2 mono.
- **Footer**: dc-bdr top; dc-acc "Back to Top" button; p3 copyright text.

---

## v4.6.7 — Theme D Restyle P19: Developer Portal (2026-06-11, P1 — UI)

### Changed
- **Sidebar**: dark `rgba(5,5,5,0.95)` bg + bdr right border; header p1 12px/700; subtitle p2 11px; category labels p3 9px uppercase; nav items active = `rgba(232,93,18,0.11)` bg + acc2 text + acc left border; inactive = transparent/p2; search input dc-s2/bdr r8.
- **Mobile toggle**: blue-600 → `var(--dc-acc, #E85D12)`.
- **Breadcrumb**: "Developer Portal" p2/500; active section p1/600; "From product/" badge → acc orange.
- **Code blocks**: `renderMd()` now outputs `background:var(--dc-s2)` + bdr + r10 + 14px 16px padding + mono 11px 1.8 line-height; syntax: bash commands green, inline comments acc2; text blocks `(required)` → chip-rd inline, parens → acc2.
- **Tables**: dark header dc-s1/bdr2 + p3 uppercase 10px; rows bdr; first-column cells that match route/code pattern → acc2 mono; other first-col → p1; data cols → p2.
- **Headings**: h1 p1 22px/800, h2 p1 16px/800 + bdr2 underline, h3 p1 13px/700 + bdr underline, h4 p1 12px/700.
- **Inline elements**: `<strong>` → p1; `<code>` → dc-s3 bg + acc2 text.
- **Lists/hr/paragraphs**: p2 text; hr bdr.
- **Loading**: acc spinner border; p3 text.
- **Error state**: dark red `rgba(248,113,113,0.07)` bg.
- **Global search results**: dark dc-s2/bdr cards; chip c-gr/c-am status badges; section chips → dark hover acc2.
- **Package Reference**: dc-s2/bdr table container; dc-s1/bdr2 header; rows bdr; package name acc2 mono; scope/status dark badges; feature tag acc orange; filter inputs dark.
- **Calculation Reference**: dc-s2/bdr cards; expanded border acc; dc-s1 expanded bg; formula pre dc-s2/bdr; file ref acc2/mono; labels p3 9px uppercase.

---

## v4.6.6 — Theme D Restyle P18: Glossary & Appendix (2026-06-11, P1 — UI)

### Changed
- **Hero**: `chip c-acc` "REFERENCE" badge (borderRadius 100); title p1 28px/800; subtitle p2 14px; stat KPI cards dc-s2/bdr r8 with acc2 mono values.
- **Search bar**: dc-s2/bdr r12 full-width; p3 🔍 icon; p1 text; focus ring `rgba(232,93,18,0.25)`.
- **Category filter tabs**: active → `rgba(232,93,18,0.12)` bg + acc2 text + 1.5px `rgba(232,93,18,0.22)` border + 100px radius; inactive → transparent + bdr + p2 text; hover p1 text.
- **Term cards**: dc-s2/bdr r9 p3; hover bdr2 via onMouseEnter/Leave; expanded → `rgba(232,93,18,0.2)` border; title p1 13px/600; definition p2 12px/1.6; "Click to expand" prompt p3 10px with ⚡.
- **Tag color system**: P0 → `rgba(232,93,18,0.18)` bg / acc / mono; P1 → `rgba(255,138,76,0.15)` / acc2; P2 → `rgba(245,158,11,0.12)` / `#fcd34d`; P3 → `rgba(255,255,255,0.08)` / p1; delivery → `rgba(34,197,94,0.11)` / `#4ade80`; people → `chip c-nt`; reference/other → `rgba(255,255,255,0.08)` / p2.
- **Empty state & footer**: p3 neutral text; footer bdr top.
- **Removed**: all Tailwind color classes (`bg-white`, `bg-purple-600`, `bg-teal-600`, `text-[#1A1A18]`, `border-[#E4E3DE]`, `CATS.color`, `CAT_ACTIVE`, `BADGE_COLOR`).

---

## v4.6.5 — Theme D Restyle P17: Landing Page (2026-06-11, P1 — UI)

### Changed
- **Zero-credential badge**: `chip c-acc` border-radius 100px (replaced blue pill).
- **Headline accent**: `var(--dc-acc2, #FF8A4C)` (replaced `text-blue-600`).
- **CTA buttons**: Primary → dc-acc `#E85D12`; Secondary → ghost `rgba(232,93,18,0.09)` bg + acc2 text + acc border.
- **Stats strip**: 28+/14 = acc2, 17 = green, 469+ = amber; mono 22px; containers dc-s2/bdr.
- **How it works cards**: dc-s2/bdr; "STEP XX" label → `chip c-acc` 9px; title p1; description p2.
- **Feature grid**: `FeatureCard` dc-s2/bdr with `onMouseEnter` → bdr2 + `translateY(-2px)` + shadow; title p1; description p2; "Open →" acc2.
- **CTA footer**: dark blue gradient removed → `rgba(232,93,18,0.04)` bg + acc border; icon box `rgba(232,93,18,0.12)` with acc2 SVG fill; title p1; subtitle p2; Developer Portal → ghost style; copyright p3.

---

## v4.6.4 — Theme D Restyle P16: Customer View PDF (2026-06-11, P1 — UI)

### Changed — Light mode preserved (print-safe)
- **Health badge**: border-4 → 2px, score font mono 28px, dynamic health color kept (orange for "Needs Attention").
- **Status banner**: `border-l-8` → `border-l-[3px]`, static `#FFF7ED` background, `#E85D12` border accent, text `#222`.
- **MetricPill**: container `border: 1px solid #E8E8E8` (no Tailwind shadow); label `#888` 9px uppercase; value mono 20px. Color updates: Completion=`#111`, In Progress=`#E85D12`, Story Points=`#111`, Blocked=`#DC2626`/green.
- **RiskRow**: all inline styles — high `#DC2626`/`#FEF2F2`, medium `#E85D12`/`#FFF7ED`, low `#6B7280`/`#F8FAFC`.
- **Delivery area bars**: `barColor = pct >= 100 ? #16A34A : #1D4ED8` (blue for partial per stakeholder convention, green for 100%); track `#E8E8E8`.
- **Key Highlights**: container `border: 1px solid #E8E8E8`; insight dots `#1D4ED8`; text `#333`.
- **Print CSS**: `@media print` adds `font-family: 'Plus Jakarta Sans', sans-serif !important`.

---

## v4.6.3 — Theme D Restyle P15: Members Directory (2026-06-11, P1 — UI)

### Changed
- **Header**: title p1 28px/800; subtitle p2 13px; Members/Roles stats → rounded-100px dc-s2/bdr with acc2 values; Request add member → acc orange theme.
- **Search bar**: container removed; input dc-s2/bdr r12 p1 text, p3 icon, focus acc ring.
- **Member cards**: dc-s2/bdr; onMouseEnter → bdr2 + `translateY(-2px)` + shadow; avatar 40px `rounded-full` acc→`#8B2D00` gradient (5-color array); name p1 13px/600; role subtitle p2 10px; role badge `chip c-acc` (admin) / `chip c-am` (manager) / `chip c-nt` (others); email p2 10px; bio p3 10px italic when empty.
- **Skeleton/empty state**: dc-s2/bdr dark.
- **Modal**: dc-s2 + bdr2 + dark shadow; large avatar gradient; role badge chip; close button dark with hover; Detail component dc-s3/bdr, p3 label, p1 value.

---

## v4.6.2 — Theme D Restyle P14: Privacy & Retention (2026-06-11, P1 — UI)

### Changed
- **Toggle switches** (`DataRetentionSettings`): ON state → `var(--dc-acc, #E85D12)` background; OFF state → `var(--dc-s4)` + bdr2 border; thumb transitions from p3 (OFF) to white (ON); size 34×18px, border-radius 100px.
- **Retention period pills**: inactive → transparent bg, bdr border, p2 text, 100px border-radius; active → `rgba(232,93,18,0.12)` bg, 1.5px `rgba(232,93,18,0.3)` border, acc2 text.
- **Save Settings button**: acc `#E85D12` background, white text (replaces blue `btn-primary`).
- **Apply Retention Policy**: ghost outline button — transparent bg, bdr2 border, p1 text.
- **Clear All Data**: `rgba(248,113,113,0.10)` bg + border, `#fca5a5` text; confirm state darkens to 0.20/0.40.
- **Stat cards**: dc-s2/bdr containers; Import Logs/Snapshots = p1; Eligible counts = red when >0, green when 0.
- **Cleanup section**: orange-tinted container `rgba(232,93,18,0.04)` with acc border.
- **Section headers / notes / last-updated**: all → p3 (#505050); warning note is italic.
- **adminConsole.ts retention tab**: Retention Window=acc2, Import Logs/Snapshots=p1, Storage Mode=green(On)/p2(Off), dark `toneStyle` for all icon containers.

---

## v4.6.1 — Theme D Restyle P13: Admin User Management (2026-06-11, P1 — UI)

### Changed
- **Admin sidebar** (`AdminConsoleLayout`): active nav item → `rgba(232,93,18,0.11)` bg + acc2 color + orange left bar; inactive items → dc-p2; "Operational" status badge → `chip c-gr` pill with green dot; search input → dc-s3/bdr; "Open Diagnostics" link → acc2 orange; kbd badge → dc-s1.
- **Stats row** (`buildSettingsStats` users tab): Total Users=dc-p1, Active Users=green, Admin Users=acc2, Role Types=dc-p1; icon containers use per-stat `toneStyle` (dark-compatible inline styles).
- **Add User form**: container → dc-s2/bdr; icon badge → dc-s3; title → p1; subtitle → p2; all inputs/select → dc-s3/bdr/p1 with acc focus ring; "Create User" button → dc-acc background, emoji removed.
- **Feedback toast**: ok → green rgba chip; error → red rgba chip (dark-compatible, no Tailwind light classes).
- **User table**: container → dc-s2/bdr; header section → p1/p2 text; search/filter/refresh → dc-s3/bdr dark inputs; bulk action bar → dc-s1 bg, bulk delete → red rgba; table header → dc-s1/bdr2; avatar circles → acc→#8B2D00 gradient; selected row → `rgba(232,93,18,0.08)`; name inline-edit → p1 with dc-s1 focus; email → p3; role select → dc-s3/bdr/p1; import/snapshot counts → p1; status badge → chip c-gr / chip c-nt; pause button → p2 with amber hover; delete button → p2 with red hover; pagination → acc2 mono.

---

## v4.6 — Roadmap, Forecast, Retro Pages + Planning Nav Group + Help/Glossary UX Redesign (2026-06-10, P1)

### New Pages
- **/roadmap** — Epic-level delivery roadmap: progress bars, health indicators, velocity-based delivery forecasts (complete / within 2 weeks / ~N weeks / ~N months), confidence badges (high/medium/low), expandable detail (remaining issues, sprints est., critical count). Filter tabs: In Progress / All / Critical / Done. Sort by: Forecast / Progress / Name. KPI summary strip + throughput context banner.
- **/forecast** — Delivery forecast page: status banner (on_track / at_risk / off_track / complete / insufficient_data), KPI row (total/done/remaining/avg throughput), inline SVG burn-up chart (actual + forecast + target lines), next-quarter capacity plan, risk signals (blocked/critical counts), actionable recommendations list.
- **/retro** — Sprint retrospective tool: three-card landing (Fill in App, Download Template CSV, Upload coming soon). In-app form: sprint context, What Went Well, What Did Not Go Well, Blockers/Impediments, Action Items (owner + due date + priority). Submit → insights view with suggestions, goal status, action item summary.

### Navigation
- New **Planning** header dropdown group: Roadmap 🗺️, Forecast 🔮, Retro 🔄 — visible to all roles.
- `/roadmap`, `/forecast`, `/retro` added to every role's `allowedRoutePrefixesForRole` allowlist in `src/lib/roles.ts`.
- Delivery group now contains: Readiness, Explore, Customer.

### UX Improvements
- **/help** navigation redesigned: 34 flat tabs → 9 grouped category pills (Getting Started, Dashboard, Planning, Analysis, Export & Data, System, Customization, People, Troubleshooting) with contextual sub-section row. Active group derived from IntersectionObserver.
- **/glossary** navigation redesigned: 12 flat tab pills → compact letter-jump chips (A–L) with icon + letter; tooltip shows full section title.

### Technical
- `computePortfolioSummary()` from `src/lib/portfolioHealth.ts` reused for epic data in roadmap and forecast (no new library).
- Burn-up chart rendered as pure inline SVG — no external charting dependency.
- `forecastEpic()` uses linear velocity extrapolation: `remaining / avgThroughput = sprintsRemaining`, `sprintsRemaining × 2 = weeksRemaining` (2-week sprint assumption).
- Retro template downloaded client-side as CSV with example rows (no server endpoint needed).

### IDs
FR-326–336 · BR-115–117 · UC-101–106 · UJ-036–038 · SCN-051–053

---

## v4.5.2 — Clickable Notifications with Smart Redirect + Tab Navigation Fix (2026-06-10, P1)

### Closed USERREQ-01 (final) — notification UX completion + admin settings deep-link

- **Clickable notifications**: each notification item in `NotificationBell` now navigates on click — `user_add_request_accepted` takes the requester to `/members`; admin gets `/admin/settings?tab=requests`. A small `→` arrow hint is shown on navigable notifications. Click also marks the notification read and closes the dropdown in one action.
- **Admin settings deep-link via `?tab=requests`**: replaced broken `#requests` hash with `?tab=requests` query param. `AdminSettingsPage` reads `useSearchParams()` on mount and sets the initial tab state directly — navigation from the amber banner, notification bell, and in-app links all land on the **Member Requests** tab immediately.
- **Product docs updated:** SRS FR-323 updated, Addendum E added; BRD BR-113/BR-114; TEST_CASES §9.54 (TC-NOTIF-06/07); USE_CASES UC-100; USER_JOURNEYS UJ-035; SCENARIOS SCN-050; APPENDIX new terms; /help, /developer, /glossary in-app routes; TODO-List.md STORAGE-DEC-13 ✅ Done.

---

## v4.5.1 — Auto-Generate Password + Welcome Email on Member Request Accept (2026-06-09, P1)

### Closed USERREQ-01 (partial) — password generation UX + email delivery for new accounts

- **Generate button** in `UserAddRequestsPanel`: clicking "Generate" next to the temp-password field auto-fills a cryptographically random 14-character password (2 uppercase + 2 digits + 2 symbols + 8 mixed, Fisher-Yates shuffled via `crypto.getRandomValues`). The field becomes visible immediately so the admin can review or edit before accepting.
- **Welcome email to new user**: on successful accept, `PATCH /api/admin/user-add-requests/[id]/accept` now calls `sendEmail()` (new `src/lib/email.ts`) delivering a styled HTML + plain-text email to the created user's address containing their email address and temporary password. Sending is **graceful**: if `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` are not configured, the request still succeeds and a `console.warn` is logged — no error is returned to the admin.
- **In-app notification** to the requester remains unchanged and continues to embed the temp password.
- Updated helper text in the password field: "This password will be shared with the requester via in-app notification and sent to the new user by email."
- Updated success banner text after accept to reflect both channels.
- **New `src/lib/email.ts`**: thin nodemailer wrapper; exports `sendEmail()` and `buildWelcomeEmail()`. Configured via five env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`); all documented in `.env.example`.
- **`src/lib/auth.ts`** gains `generateTempPassword()` (server-side, Node `crypto.randomBytes`) for future use.
- **Product docs updated:** SRS Addendum D (FR-319 and FR-321 updated, new FR-325 for email); DEVELOPER_GUIDE SMTP section; RELEASE_NOTES (this entry).

---

## v4.5 — USERREQ UI: Request Modal, Admin Queue, Notification Bell, Bulk User Management (2026-06-09, P1)

### Closed USERREQ-02/03/04/05/06/15/16/17/18/19/20/21/22/23/24/26/29/30 — shipped the full USERREQ UI layer and all related product documentation

- **RequestAddMemberModal** (FR-320): Non-admin users on `/members` see a "Request add member" button that opens a validated modal (name, email, role, reason, optional team/project/notes). High-privilege roles (admin, c_level) require ≥ 20 char reason with warning. On success shows ✅ confirmation.
- **UserAddRequestsPanel** (FR-321): Admin Settings → Member Requests tab — expandable request cards, filter bar (pending/all/decided), decision note input. Accept now requires a **mandatory admin-entered temp password** (amber field with show/hide toggle, strength-validated client and server-side); Accept button is disabled until a valid password is entered. After acceptance, a green copyable password box appears with a Copy button.
- **Updated FR-319 / accept route**: `PATCH /api/admin/user-add-requests/[id]/accept` now requires `tempPassword` in the body (HTTP 400 if missing or weak). Returns `{ ok: true, tempPassword, createdUser }` — password echoed for the UI display.
- **Notification APIs** (FR-322): `GET /api/notifications` returns current user's notifications (max 50, newest first). `PATCH /api/notifications/[id]/read` marks a notification read with ownership guard (404 if not owned).
- **NotificationBell** (FR-323):  header component polls every 30s; red pulsing badge () + bell wiggle (); persistent amber strip banner fixed below the nav header for admins with pending requests (always visible, not just inside dropdown); dropdown with mark-read and mark-all-read.
- **Bulk User Management** (FR-324): Multi-select checkboxes in Users table (select-all with indeterminate state), blue row highlight, bulk action bar (bulk role change + bulk delete with confirm dialog). Delete (🗑) and pause (⏸/▶) buttons merged into the "Status & Actions" column — no horizontal scroll.
- **Product docs added:** SRS Addendum C (FR-320–324) + FR-319 updated + §8.1 inventory updated; USE_CASES UC-097/UC-098/UC-099; USER_JOURNEYS UJ-034; SCENARIOS SCN-049; TEST_CASES §9.51/§9.52 (TC-NOTIF-01–05, TC-REQ-15–16); DEVELOPER_GUIDE notification bell + bulk-select sections; RELEASE_NOTES (this entry); TODO-List.md (USERREQ status rows + impact matrix).
- **Test suite grew from 564 tests / 62 suites → 571 tests / 63 suites** — new `notifications.test.ts` (5 tests: TC-NOTIF-01–05) + TC-REQ-15/16 added to `userAddRequests.test.ts` (now 16 tests).
- `npm run lint` and `npm run build` remain clean.

---

## v4.4 — USERREQ-07–14, USERREQ-28: User Add-Member Request Workflow — Backend Foundation (2026-06-09, P1)

### Closed USERREQ-07–14 and USERREQ-28 (TODO-List.md Section 15) — built the Prisma schema, five API routes, and 14 automated tests for the User Add-Member Request Workflow

- **Scope:** The `UserAddRequest` approval pipeline — the backend data model + API surface that lets any logged-in user formally submit a request to add a new colleague, and allows admins to accept or reject that request in an audited, notification-aware way. This is the backend foundation only; the admin queue UI page (`/admin/settings → User Requests`) and the requester UX widget are P1 follow-up items (USERREQ-16–27).
- **Prisma schema additions** (`prisma/schema.prisma`, USERREQ-07/09 → FR-314/FR-315):
  - New `UserAddRequest` model: `id`, `requestedName`, `requestedEmail`, `requestedRole`, `reason`, `teamOrProject?`, `notes?`, `status` (default `"pending"`), `requestedByUserId` → `User`, `adminDecisionById?`, `adminDecisionAt?`, `adminDecisionNote?`, `createdUserId?`, `createdAt`, `updatedAt`.
  - New `Notification` model: `id`, `recipientUserId` → `User`, `type`, `title`, `message`, `relatedEntityType?`, `relatedEntityId?`, `readAt?`, `createdAt`.
  - `User` model gains two new back-reference relations: `userAddRequests UserAddRequest[] @relation("UserAddRequestRequester")` and `notifications Notification[] @relation("UserNotifications")`.
- **New API routes** (all use the existing `getIronSession`/`SESSION_OPTIONS`/`prisma` patterns matching `app/api/admin/users/route.ts`):
  - `POST /api/user-add-requests` (FR-316): authenticated; validates name/email/role/reason; guards duplicate user email (409) and duplicate pending request (409); creates `UserAddRequest` with `status: "pending"`; writes `user_add_request_submit` AuditEvent (non-blocking).
  - `GET /api/user-add-requests/mine` (FR-317): authenticated; returns the caller's own requests filtered by `requestedByUserId`, max 50 desc.
  - `GET /api/admin/user-add-requests` (FR-318): admin-only; returns all requests with `requestedBy` user info; optional `?status=` filter; max 200 desc.
  - `PATCH /api/admin/user-add-requests/[id]/accept` (FR-319): admin-only; validates `status === "pending"` (409 otherwise); re-checks email availability (409 if taken); creates user with `mustChangePassword: true` + bcrypt-hashed temp password; marks request accepted with decision metadata; creates `Notification` for requester; writes audit event; returns `{ ok: true, createdUser }`.
  - `PATCH /api/admin/user-add-requests/[id]/reject` (FR-319): admin-only; validates `status === "pending"` (409 otherwise); marks rejected; creates `Notification` for requester; writes audit event; returns `{ ok: true }`.
- **Product docs added:** `SRS.md` Addendum B (FR-314–FR-319) + §8.1 inventory updated with 5 new routes; `USE_CASES.md` UC-095/UC-096; `TEST_CASES.md` §9.50 (TC-REQ-01–14); `RELEASE_NOTES.md` (this entry); `TODO-List.md` (USERREQ-07–14 and USERREQ-28 flipped to ✅ Done with impact matrix).
- **Test suite grew from 550 tests / 61 suites → 564 tests / 62 suites** — new `userAddRequests.test.ts` (14 tests: TC-REQ-01–14) covering the full requester + admin API surface with mocked Prisma and session.
- `npm run lint` and `npm run build` remain clean.

---

## v4.3 — HARD-01 Closure: Backend Integration Gateway Foundation (2026-06-08, P1 — controlled chokepoint for all future external calls)

### Closed `HARD-01`/`NEXT-06` (TODO-List.md Section 14, `GW-01`–`GW-25`) — built the routing/security/retry/audit foundation that every future external integration (Jira live API, cloud storage over raw HTTP, email, Slack, Teams, push notifications) MUST route through
- **Scope discipline up front**: the TODO is explicit that this is *"not full Jira integration and not full cloud integration… a controlled backend foundation that all future external calls must use."* Today the app makes **zero live external HTTP calls** (Jira is file-upload/parse only; cloud storage uses provider SDKs directly). So this closure builds only the chokepoint layer — no speculative `fetchJiraIssues()`-style provider business logic, no live providers wired up. `listRegisteredProviders()` reports every provider as `enabled: false` out of the box.
- **New server-only module suite — `src/server/gateway/`** (mirrors the `src/services/storage/` / `src/types/storage.ts` patterns): `types.ts` (the full `GatewayProviderType`/`GatewayResult<T>`/`GatewayRoutingStrategy` contract — the strategy union already enumerates `single | round_robin | weighted_round_robin | failover | least_error_rate` so future load-balancing needs no breaking type change), `endpointPolicy.ts` (SSRF/allowlist/protocol/path validation — `validateEndpoint()` never throws, returns a structured `{ allowed, reason }`), `retryPolicy.ts` (10s timeout, 2 retries, exponential backoff, retryable-status table), `gatewayLogger.ts` (pattern-based secret redaction + JSONL audit append), `providerRegistry.ts` (provider configuration resolution), and `externalGateway.ts` (`callExternal<T>()` — the single entry point that ties all of the above together and never throws).
- **Honoured an explicit user correction mid-build — "don't make anything static, make a config file that can be changed with zero code change"**: the provider registry was redesigned from a static `PROVIDER_BLUEPRINTS` map to a config-file-driven resolver. `getProviderConfig()` now merges built-in `DEFAULT_BLUEPRINTS` (fallback only) with overrides read from `data/gateway-providers.json` at call time — an operator can remap a provider's env-var names, extend its host allowlist, or kill-switch it entirely (`"enabled": false`) by editing that JSON file alone, with **zero code changes and no redeploy** (`writeProviderConfigFile()` ships ready for a future admin UI to manage it). Credential *values* still come from `process.env` only — never persisted to the config file, mirroring the `session.ts`/`securityCheck.service.ts` convention.
- **Security model**: every call passes through `validateEndpoint()` before any network attempt — https-only protocol allowlist in production, per-provider host allowlist, blocked private/internal IP ranges and localhost (SSRF), and raw-string path-traversal detection (run on the *pre-parse* URL string, since `new URL()` silently collapses `/../` segments). `gatewayLogger.redact()` masks token/key/secret/password/cookie/Authorization/Basic/Bearer/connection-string-shaped substrings before any record is ever written — verified by tests asserting real secret values never appear in the log output.
- **Why JSONL, not the `AuditEvent` table**: gateway calls are high-volume *operational* telemetry (every retry attempt would be a row), not human-readable user-audit events — routing them through `prisma.auditEvent` would pollute the admin-facing audit trail and require a migration. Records are appended as redacted JSON-Lines to `data/gateway-audit.jsonl`, mirroring the existing `data/*.json` local-file convention (`storage-settings.json`, `.cloud-cache-meta.json`). Logging failures are swallowed — a broken filesystem must never break the request it's observing.
- **Test suite grew from 527 tests / 60 suites → 550 tests / 61 suites** — new `gateway.test.ts` (`TC-GW-01`–`TC-GW-21` plus `TC-GW-05b`/`TC-GW-15b`, 23 tests total) covering endpoint policy (SSRF/allowlist/traversal/protocol), retry/backoff math, redaction + JSONL logging (including a never-throws-on-write-failure assertion), config-file-driven provider resolution (env-driven enable/disable, JSON remapping, kill-switch), and `callExternal()` end-to-end with a mocked `fetch` (happy path, policy-rejection-before-fetch, SSRF-via-path-injection rejection, retry-then-succeed, retry-exhaustion, non-retryable-status-fails-immediately). `npm run lint` and `npm run build` remain clean.
- Updated `product/DEVELOPER_GUIDE.md` (new "Backend Integration Gateway (Implemented — Foundation, v4.3)" architecture section — the as-built design doc, written to describe the actual config-file-driven implementation, not the originally-sketched static map), `product/SRS.md` (new `FR-313` plus a §8.1 inventory note explaining why the gateway has no dedicated route), `product/USE_CASES.md` (cross-reference note explaining there is intentionally no end-user UC — it's a server-only foundation with no UI), and `TODO-List.md` (`GW-01`–`GW-23` flipped to ✅ Done with cross-reference notes, `GW-24`/`GW-25` annotated, `NEXT-06` flipped to ✅ Done).

---

## v4.2.2 — TRACE-02 Closure: Full App Coverage Validation — All 22 COVER-XX Areas (2026-06-08, P0 — documentation integrity + test coverage)

### Closed the last open P0 traceability item — `TRACE-02` / `NEXT-02` ("Validate that `product/SRS.md`, `product/USE_CASES.md`, and `product/TEST_CASES.md` cover the full app"), the 22-area `COVER-01`–`COVER-22` checklist in `TODO-List.md` Section 8
- **Used a user-approved "survey-first, then cluster" methodology** (the same evidence-based approach that closed `TRACE-01`): rather than guessing at ~30–40 new FRs/UCs/TCs up front, first built a real ground-truth coverage matrix classifying each of the 22 areas as ✅ COVERED / ⚠️ THIN / ❌ GAP by reading the actual source (pages, routes, API routes, roles, DB models, test files), *then* closed only the genuine gaps the matrix revealed.
- **Found 2 of the survey's "thin"/"gap" flags were stale framing, not real gaps** — re-investigation showed both areas already had complete FR/UC/TC/test anchoring and just needed the matrix corrected, the same "stale matrix cell" pattern that closed 3/5 of TRACE-01 cluster #5's flagged items:
  - `COVER-02` (every route covered): `middleware.ts`'s `PROTECTED`/`ADMIN_ONLY` route-protection logic was already fully anchored via `FR-226`/`FR-227`/`FR-235E` + `UC-084`/`UC-085`/`UC-086` + `roles.test.ts` + `middleware.test.ts` (`TC-PW-07`).
  - `COVER-05` (every admin feature covered): users/retention/thresholds/orphan-rules/backup-restore/cloud-storage/diagnostics/security were already anchored via `UC-084` + `adminUsers.test.ts`/`members.test.ts`/`changePassword.test.ts`/`adminSettingsConsole.test.ts`/`orphanRules.test.ts`/`cloudStorage.test.ts`.
- **Closed the one large genuine gap — `COVER-03` (every API route covered)**: discovered that `SRS.md §8 "API Specification"` documented only the **legacy standalone Express `backend/` server** (`backend/src/index.js`/`backend/src/routes/upload.js`), not the live Next.js `app/api/**/route.ts` surface — a different, smaller API. Added a scope-clarifying note distinguishing the two, then wrote an entirely new **`§8.1 — Next.js Application API Route Inventory`**: a 36-row table (Method(s) | Path | Auth | Purpose | FR ref | Notes) covering every live application route.
- **Closed the one narrow genuine gap — `COVER-06` (upload flows covered)**: the landing page's multi-file "Combine multiple exports" merge control had a live route (`POST /api/upload/merge`), UI, and pure dedup function (`mergeIssueArrays()` in `src/lib/mergeIssues.ts`) but **zero FR/UC/TC anchor and zero test coverage**. Per the established "anchor to existing flow, don't mint redundant docs" pattern, wrote new **`FR-312`** (P2 — the multi-file merge contract: 2–10 file limit, dedup-by-`Issue Key`, non-empty/longer-string-wins merge rules, `mergeStats` shape) and **`UC-094`** (User Merges Multiple Jira Exports into One Unified Report), then automated **`TC-UM-01`–`TC-UM-06`** in new `mergeIssues.test.ts` (distinct-keys-kept, duplicate dedup, non-empty-wins-over-empty, longer-string-wins in both orderings, blank/whitespace-key exclusion, three-file merge-stats accuracy — `TEST_CASES.md §9.47`).
- **Discovered and resolved a second ID-integrity issue this session — a TC-ID collision/drift parallel to the FR/UC collisions of `TRACE-01` cluster #6 — while investigating `COVER-11` (security behavior covered)**: a stale manual "F3 — Authentication Tests" table (`TC-A-01`–`TC-A-09`, all "Not Run") in `TEST_CASES.md` had drifted apart from the automated `auth.test.ts`, which had independently grown its own `TC-A-01`–`TC-A-09` IDs for **different** scenarios (e.g. the table's `TC-A-03` = "access `/dashboard` without session → redirect to `/login`" vs. `auth.test.ts`'s `TC-A-03` = "disabled-account login-blocking"). Resolved by:
  - Cross-referencing `TC-A-01`/`02`/`08`/`09` (close matches to `auth.test.ts`'s tests of the same ID) — corrected their status from "Not Run" to ✅ Automated.
  - **Renumbering the five genuinely-colliding rows to the free `TC-A-10`–`TC-A-14` range** (mirroring the FR/UC renumbering precedent from cluster #6) and closing each with new automated coverage: `TC-A-10` (unauthenticated → `/login?redirect=` 307 redirect — new test in `middleware.test.ts`), `TC-A-11`/`TC-A-12` (admin-sees-all-logs / non-admin-admin-redirect — cross-referenced to existing `roles.test.ts` `canViewAllImportData`/`canAccessRoute` route-matrix tests, which already covered these intents under different IDs), `TC-A-13` (logout writes an `auditEvent` and destroys the session — new `logout.test.ts`, 2 tests), `TC-A-14` (upload-while-logged-in persists an `ImportLog` row tagged with `session.userId`; anonymous upload writes nothing — new `uploadUserId.test.ts`, 2 tests).
- **Closed `COVER-12` (error states covered)**: cloud-storage failure modes, snapshot-delete permission errors, and security/diagnostics error reporting were already anchored (`cloudRestoreHardening.test.ts` `TC-CS-09`–`12`, `snapshots.test.ts` `TC-SN-02`/`04`, `securityCheck.test.ts`, `diagnostics.test.ts`). Found one genuine gap: `GET /api/snapshots/:id` guards three distinct error responses — `401` not authenticated, `404` not found, `403` access denied (with admin bypass) — that had no direct route-level test (`snapshots.test.ts` exercises only the `deleteDashboardSnapshot` service layer). Wrote new **`TC-SN-09`–`TC-SN-11`** in new `snapshotLoadErrors.test.ts` (`TEST_CASES.md §9.48`).
- **Confirmed `COVER-17`–`COVER-21` (Gateway, Notifications, Forecasting, Retrospective, Coaching) as correctly-scoped roadmap items per explicit user direction**: these are P1–P3 features with **zero pages, routes, or code** anywhere in the app. Per the user's explicit choice ("Mark as correctly-scoped roadmap"), deliberately did **not** author ~30–40 speculative FR/UC/TC entries describing how an unbuilt feature "should" work — doing so would itself create a documentation-integrity risk (specs that diverge from whatever gets actually built later). Verified all five remain clearly marked "not yet implemented" / roadmap, satisfying `COVER-22` (future roadmap items clearly marked) in the same pass.
- **Test suite grew from 513 tests / 56 suites → 527 tests / 60 suites** (14 new tests across 4 new spec files — `mergeIssues.test.ts` 6, `logout.test.ts` 2, `uploadUserId.test.ts` 2, `snapshotLoadErrors.test.ts` 3 — plus 1 new test, `TC-A-10`, added to the existing `middleware.test.ts`). `npm run lint` and `npm run build` remain clean.
- Updated `product/SRS.md` (§8 scope note + new §8.1 API route inventory + `FR-312`), `product/USE_CASES.md` (`UC-094`), `product/TEST_CASES.md` (renumbered/corrected F3 Authentication Tests table, new §9.47 `TC-UM`, new §9.48 `TC-SN-09–11`), and `TODO-List.md` (all 22 `COVER-XX` rows marked ✅ Done with cross-reference notes, `TRACE-02`/`NEXT-02`/`REC-25` status rows, header "Last updated" line, Section 13 progress paragraph, and Release Status Recommendation) to declare **`TRACE-02` ✅ fully Done**: every `COVER-XX` row closed, zero speculative documentation written for unbuilt features. This — together with `TRACE-01`'s prior closure — clears the traceability/coverage gate that was blocking `HARD-01`/`HARD-02`/`HARD-03`/`RETRO`/Forecasting work.

---

## v4.2.2 — TRACE-01 Cluster #6 Closure & Final Closure: FR↔UC ID-Collision Cleanup + Ownership Index (2026-06-08, P0 — documentation integrity)

### Closed the last remaining TRACE-01 punch-list item — Gaps Summary item 6 ("cross-cutting FR↔UC bundling ambiguity") — and with it, **all of TRACE-01**
- **Investigated the framing and found it was masking a more serious problem**: the bundled `**Related FR**` ranges in `USE_CASES.md` (e.g. "FR-207 to FR-215") weren't actually ambiguous once cross-referenced against the Section 12 matrix — but the investigation surfaced **four genuine ID collisions** in `product/SRS.md`/`USE_CASES.md`, found via `grep -oE "^\*\*FR-[0-9]+[A-Z]?:" product/SRS.md | sort | uniq -d` and an equivalent UC-header check:
  1. **Duplicate `FR-242`/`FR-243`** — the new Smart-Excel-export FRs minted during cluster #3's closure unknowingly collided with the pre-existing Addendum-A "Data Quality Score" `FR-242`/`FR-243` (this pair was self-inflicted, introduced earlier in this same session).
  2. **Duplicate `FR-235D`** — an orphan second definition (dashboard-view role-locking) that no UC/SCN/TC referenced by ID anywhere, shadowing the correct `FR-235D` (forced-password-change redirect, referenced by `UC-086`).
  3. **Duplicate `UC-043`/`UC-044`** — stale pre-v3.0 use cases ("Return from Full Report to Summary" / "Direct URL Access to a Deep Link") colliding with the current v3.0 `UC-043`/`UC-044` that the Section 12 matrix actually anchors to (and that cluster #4 had just extended).
  4. **Phantom `FR-309`** — referenced in `UC-083`'s `**Related FR**` line but never defined in `SRS.md`, alongside a copy-paste-stale `FR-308` reference (the status-chip FR from cluster #5, unrelated to `UC-083`'s cloud-restore flow).
- **Surfaced the expanded scope to the user before touching anything** (this changes *what* gets renumbered, which is the user's call) and received explicit direction to fix all four collisions plus build the index.
- **Renumbered every colliding/orphaned ID to a free, non-colliding number, annotated in place** so the history stays traceable: `FR-242`→`FR-310`, `FR-243`→`FR-311` (both in `SRS.md`, propagated through `USE_CASES.md` UC-089, `SCENARIOS.md` SCN-045, `TEST_CASES.md` F4 export row, `RELEASE_NOTES.md` cluster #3 entry, and `TODO-List.md`), orphan `FR-235D`→`FR-235H`, stale `UC-043`→`UC-092` ("Return from Full Report to Summary"), stale `UC-044`→`UC-093` ("Direct URL Access to a Deep Link"). Each renumbered definition carries a `(renumbered 2026-06-08 from a colliding FR-xxx/UC-xxx — see TODO-List.md Section 12 Gaps Summary item 6)` note.
- **Resolved the `FR-309` phantom by making it real** rather than deleting the reference: wrote a correctly-scoped new `FR-309` in `SRS.md` (P3 — Done) that documents the exact flow `UC-083` narrates — the bucket-backed metrics restore-and-fallback via `GET /api/metrics/latest` → `syncFromCloud()` → `data/latest-metrics.json` → adopt-or-fall-back-to-`dc_metrics_v2`-with-`dc_metrics_source_v1` badge contract — and corrected `UC-083`'s `**Related FR**` line from `FR-307, FR-308, FR-309` to `FR-307, FR-309` (dropping the stale `FR-308` cross-reference).
- **Verified zero duplicate IDs remain** via `grep -oE "^\*\*FR-[0-9]+[A-Z]?:" product/SRS.md | sort | uniq -d` and the equivalent `### UC-` header check on `USE_CASES.md` — both return empty.
- **Built TRACE-01 Appendix B — the FR→UC Ownership Index** (new subsection in `TODO-List.md` Section 12, below the Gaps Summary): a 41-row table expanding all 8 bundled `**Related FR**` ranges into individual FR IDs, each marked with its authoritative "Owning UC" per the Section 12 matrix and classified **Primary** (single, unambiguous owner) or **Co-implemented** (legitimately shared by 2+ UCs implementing the same requirement from the same routes — e.g. `FR-228`/`FR-229`/`FR-230` shared by `UC-047`/`UC-050`, `FR-236` shared by `UC-049`/`UC-089`). This proves the original "ambiguity" framing was inaccurate — the matrix already had unambiguous ownership once the ID collisions were corrected; the bundled ranges were navigable shorthand, not a gap.
- **No source code changed** — this was a pure documentation-integrity pass (ID collisions and cross-reference propagation only), so the test suite remains **513 tests / 56 suites**; `npm run lint` and `npm run build` remain clean.
- Updated `product/SRS.md`, `USE_CASES.md`, `SCENARIOS.md`, `TEST_CASES.md`, and `TODO-List.md` (Gaps Summary item 6 replaced with the full closure narrative, new Appendix B, Section 12 matrix, `TRACE-01`/`NEXT-01` status rows, header, and progress paragraph) to declare **TRACE-01 ✅ fully Done**: zero `GAP — not found` cells, zero ID collisions, all six gap clusters plus UX-14 closed. This clears the path for new P1/P2 development (`NEXT-01`).

---

## v4.2.2 — TRACE-01 Cluster #5 Closure: UX Narrative Residue — UX-02/03/05/11/13 (2026-06-08, P0 — documentation + test coverage)

### Closed the final TRACE-01 gap cluster — the "UX narrative residue" punch-list item (UX-02 Default open sections, UX-03 Status chips on section triggers, UX-05 HTML export redesigned, UX-11 Advanced theme customization, UX-13 Advanced chart customization)
- **Found that 3 of the 5 "GAP — not found" matrix cells were stale, not real gaps** — the anchors already existed elsewhere in the docs and the Section 12 matrix simply hadn't been updated to reference them: `UX-02` was already covered end-to-end by `FR-271/272`, `UC-062`, `SCN-024`, `UJ-021`, and `TC-DV-01,05–10`; `UX-05` already had `UC-076`/`SCN-035`; `UX-11` already had `FR-304`/`UC-081`/`TC-TC-01–08`. Corrected all three matrix rows in `TODO-List.md` to reference their real anchors instead of re-documenting flows that already exist — same root-cause class as the stale `TEST_CASES.md` F4 table found and fixed in cluster #3.
- **Wrote the genuinely-missing pieces for the partially-stale items**: `UJ-031` (Stakeholder Receives and Trusts a Branded HTML Report) for UX-05; `SCN-047` (Engineering Manager Personalises the App to Match Her Team's Brand Colour) and `UJ-032` (Engineering Manager Personalises the App's Look and Feel) for UX-11.
- **Wrote full new narrative anchors for `UX-13` (Advanced chart customization)** — `FR-306`/`TC-CC-01–08` already existed but had no UC/SCN/UJ: added `UC-091` (User Personalises the Charts Page Layout), `SCN-048` (Director Reshapes the Charts Page Around the Two Metrics That Matter to the Board), and `UJ-033` (Director Curates the Charts Page for a Board Presentation).
- **Closed the one true zero-anchor gap, `UX-03` (Status chips on section triggers)**: this cross-cutting visual convention — the `Chip`/`CollapsibleTrigger`/`CHIP_CLS` 5-tier severity-colour system spanning ~16 collapsible dashboard sections — had literally no FR/UC/SCN/TC anywhere and lived purely as inline JSX in `app/dashboard/page.tsx`. Per the chosen "extract + test" approach: extracted `Chip`/`CHIP_CLS`/`chipClass()`/`mostSevereChipType()` into a new pure module `src/lib/dashboardChips.ts` (mirroring the `adminConsole.ts`/`members.ts` extraction pattern from earlier closures), wrote a new `FR-308` (SRS A.20) and `BR-112` (BRD) formally specifying the convention as a written contract, and anchored it with new `UC-090` (Scan Section Health via Status Chips Before Expanding), `SCN-046` (Scrum Master Triages a Long Dashboard by Chip Colour Alone), and `UJ-030` (Scrum Master Triages the Dashboard by Chip Colour).
- **Made a minimal, behaviour-preserving extraction of `buildReportHtml()` out of `exportToHtml`** (`src/lib/exportUtils.ts`) so UX-05's redesigned HTML-report branding markup (lightning-bolt brand mark, "Delivery Clarity" eyebrow, page title, footer attribution) could be tested directly as a pure string-builder, without a DOM/Blob/download side effect getting in the way.
- **Wrote and automated 4 new test cases**: `TC-CH-01–03` (new `dashboardChips.test.ts` — the 5-tier severity→style mapping is complete and distinct, `chipClass(undefined)` falls back to `neutral`, and `mostSevereChipType()` correctly ranks `critical > warning > info > good > neutral` including empty-list and untyped-chip edge cases) and `TC-X-14` (new `exportUtilsHtml.test.ts` — asserts the rendered HTML report contains the brand-mark SVG, "Delivery Clarity" eyebrow, `<title>Delivery Clarity — Report</title>`, "Delivery Report" heading, and the full footer attribution string).
- Test suite count rose from **509 tests / 54 suites → 513 tests / 56 suites** (two new spec files). `npm run lint` and `npm run build` remain clean.
- Updated the `UX-02/03/05/11/13` matrix rows, `UX-TRACE`, `TRACE-01`, `NEXT-01`, and Gaps Summary item 5 in `TODO-List.md` Section 12/13 to reflect that **TRACE-01 gap cluster #5 — and with it the entire UX-narrative-residue punch-list item — is now fully closed**. The Section 12 traceability matrix now has **zero** `GAP — not found` cells; the only remaining TRACE-01 punch-list item is the cross-cutting FR↔UC bundling-ambiguity question (Gaps Summary item 6).

---

## v4.2.2 — TRACE-01 Cluster #4 Closure: Throughput Data-Contract Anchoring (2026-06-08, P0 — documentation + test coverage)

### Closed TRACE-01 gap cluster #4 — F1-07/F1-08 (`src/types/throughput.ts` types and the `DashboardMetrics.throughput` field)
- **Anchored two long-standing data-model gaps to their existing consumer flow** rather than declaring them "not independently traceable": `src/types/throughput.ts` (F1-07 — the `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` types) and `DashboardMetrics.throughput` (F1-08 — required by the existing `FR-215`) are exactly the data contract that `UC-043`'s `SprintThroughputPanel`/`MidSprintDeliveryPanel`/`KanbanThroughputPanel` flow, `SCN-012`'s retrospective-prep scenario, and `UJ-010`'s throughput-review journey already walk through end to end — so rather than minting redundant new docs, the existing anchors were extended to name the data layer they depend on.
- **Extended `UC-043`'s Related-FR range** in `product/USE_CASES.md` from "FR-207 to FR-214" to "FR-207 to FR-215", with an explanatory clause naming each panel as a consumer of the `metrics.throughput: ThroughputMetrics` bundle and pointing at the new `TC-T-11` for its shape-contract test.
- **Added a `**Related:**` line to `SCN-012`** in `product/SCENARIOS.md` (`UC-043, UJ-010, FR-207–FR-215, TC-T-01–TC-T-11`) — the first such cross-reference on this older scenario, bringing it in line with the convention already used on 23 other scenarios. `UJ-010` needed no change — User Journeys in this project don't carry `**Related:**` footer lines, and its step-by-step table already covers the same panels.
- **Wrote and automated 1 new test case `TC-T-11`** in the existing `src/__tests__/throughput.test.ts` (now 11 tests): calls `calculateDashboardMetrics(issues)` and asserts `metrics.throughput` conforms to the full `ThroughputMetrics` contract — `sprint: SprintThroughputSummary` (sprintName, committedCount, completionPct, goalOutcome, deliveryPattern, deliveryConfidence, totalSprints, averageThroughputCount, trendDirection), `kanban: KanbanFlowSummary` (hasKanbanData, periods[], overallFlowHealth), and `midSprint: MidSprintInsight[]` (sprintName, midSprintPct, pattern, isEndLoaded, isScopeUnstable, isBlocked) — directly proving `FR-215`'s data-contract requirement at the integration level (not just the formula level the existing `TC-T-01–10` cover).
- Test suite count rose from **508 tests / 54 suites → 509 tests / 54 suites** (same file, +1 test). `npm run lint` and `npm run build` remain clean.
- Updated the `F1-07/08` rows, `F1-TRACE`, `TRACE-01`, `NEXT-01`, and Gaps Summary item 4 in `TODO-List.md` Section 12/13 to reflect that **TRACE-01 gap cluster #4 is now fully closed** — the smallest of the five clusters, closed via anchoring-and-cross-referencing rather than new FR/UC/SCN authorship since the existing requirement and use case already fully covered this data layer.

---

## v4.2.2 — TRACE-01 Cluster #3 Closure: Smart Excel Export Sheets & Trigger (2026-06-08, P0 — documentation + test coverage)

### Closed TRACE-01 gap cluster #3 — F4-05/06/08 (Smart Excel export Risks & Blockers / Orphan & Data Quality / Cycle & Lead Time / Release Readiness sheets, plus the export-trigger flow)
- **Added two new SRS requirements** to `product/SRS.md` immediately after `FR-241`, formally documenting behaviours that were already implemented and shipped but never written up: **`FR-310`** (the Risks & Blockers, Orphan & Data Quality, Cycle & Lead Time, and Release Readiness sheets must each derive their content directly from the in-memory `DashboardMetrics.flow.items` — covering sort order, suggested-action tiers, summary/detail rows, percentile math, and Go/Conditional-Go/No-Go grouping) and **`FR-311`** (the dashboard sticky bar and the `/summary` page must each expose an Export control that triggers the 17-sheet smart workbook download under the default filename `delivery-clarity-report.xlsx`, and silently record the `download_report` onboarding step without blocking the export if tracking is unavailable). *(Originally numbered `FR-242`/`FR-243` at the time of this entry; renumbered to `FR-310`/`FR-311` on 2026-06-08 after discovering they collided with pre-existing Addendum-A "Data Quality Score" requirements of the same IDs — see the TRACE-01 final closure section above and TODO-List.md Section 12 Gaps Summary item 6.)*
- **Added `UC-089`** (Trigger and Review the Smart Excel Workbook from the Dashboard or Summary Page) to `product/USE_CASES.md` — Main Flow walks through triggering the export and reviewing each of the four previously-undocumented sheets in turn; Alt Flow A covers a healthy dataset with no risks or orphans; Alt Flow B covers onboarding-tracking unavailability. Related FRs: `FR-236`, `FR-310`, `FR-311` (renumbered from `FR-242`/`FR-243` — see note above).
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
