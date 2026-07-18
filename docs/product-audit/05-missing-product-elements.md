# Delivery Clarity — Missing Product Elements (Checkpoint 4)

**Status: COMPLETE.** This file catalogues functionality a user would reasonably expect but that does not exist — gaps, not bugs — found primarily through feature-parity comparison across similar pages. It does not repeat clarity findings (`03-clarity-and-misleading-data.md`) or calculation findings (`08-metric-dictionary.md`); it is scoped to missing capabilities.

**Evidence basis:** Direct grep/read across the full `app/` tree. One research pass (delegated) was interrupted mid-task by an environment session limit after completing the export-parity finding below (MPE-01) and beginning the pagination check; the lead auditor completed the remaining checks (pagination, search, confirmation dialogs, referenced-but-missing) directly to avoid an incomplete checkpoint. No rendered verification was performed (blocked app-wide).

---

## MPE-01 — Export capability is inconsistent across comparable data-rich pages

```text
Finding: /explore has Excel/CSV export (app/explore/page.tsx, confirmed in Checkpoint 1). Several /dashboard/* pages have CSV export (data-quality, flow-health, key-metrics, priority-attention, trends). But /work-explorer — a full searchable, filterable table of every work item, arguably the single best export candidate in the app — has none. /teams, /portfolio, /delivery-mix, /charts, /customer, and /roadmap also have no export capability at all.
Evidence: grep for export/CSV/Excel handlers across app/ returns matches only in app/dashboard/{data-quality,flow-health,key-metrics,priority-attention,trends}/page.tsx, app/explore/page.tsx, app/help/page.tsx (documentation only), and app/retro/page.tsx. No match in app/work-explorer/page.tsx, app/teams/page.tsx, app/portfolio/page.tsx, app/delivery-mix/page.tsx, app/charts/page.tsx, app/customer/page.tsx, app/roadmap/page.tsx (confirmed via direct grep, zero results in each).
Comparable pages that DO have this capability: /explore (smaller, narrower feature — issue relationship search) and 5 of 9 /dashboard/* sub-pages.
Why it matters: /work-explorer is explicitly a full-dataset browsing tool; a user who filters it down to a relevant subset has no way to take that list out of the app, while a narrower feature (/explore) already has export. /customer in particular is a "Stakeholder Report" explicitly meant to be shared externally (print/Save PDF exists) but has no data export alongside the print option.
Severity: P2
Confidence: High (direct grep, zero matches confirmed per file)
```

## MPE-02 — Pagination is inconsistent across list-heavy pages, several with no cap at all

```text
Finding: Only 4 pages implement any pagination/row-limiting pattern (admin/audit, admin/feedback, dashboard/flow-health, work-explorer). /snapshots, /admin/logs, /admin/users, /members, /backend, and /admin/system-errors render their full list with no page-size limit, slicing, or "load more" pattern.
Evidence: grep for PAGE_SIZE/pageSize/visibleCount/currentPage/setPage( across app/ matches only 4 files. Direct inspection of app/snapshots/page.tsx, app/admin/logs/page.tsx, app/admin/users/page.tsx, app/members/page.tsx, app/backend/page.tsx, app/admin/system-errors/page.tsx confirms no slice/pagination logic in any of them.
Comparable pages that DO have this capability: /work-explorer (PAGE_SIZE=50), /dashboard/flow-health, /admin/audit, /admin/feedback.
Why it matters: /admin/logs is explicitly described in its own page copy as showing counts "across all users" (multi-tenant scale) with no cap; /admin/users and /members are account-management screens whose row count grows with the customer's org size. This was already flagged for /snapshots specifically in Checkpoint 1 as "low risk at that scale" given a documented 20-snapshot cap — but /admin/logs, /admin/users, /members, and /backend have no equivalent cap to make the gap low-risk.
Severity: P2 (P1 for /admin/logs and /admin/users specifically, given no documented volume ceiling analogous to snapshots' 20-item cap)
Confidence: High
```

**Resolved (2026-07-17):** Added client-side pagination to 5 of the 6 flagged pages —
`app/admin/logs/page.tsx`, `app/admin/users/page.tsx`, `app/members/page.tsx`, and `app/backend/page.tsx`
(Import Logs section) at 25 rows/page, `app/snapshots/page.tsx` at 10/page (matches its existing 20-item
documented cap). Each already fetches its full, bounded result set in one request (`/api/imports?all=true`
caps at 100, `/api/backend-view` caps at 50, `/api/snapshots` caps at 20) — none needed a `?page=`/`?limit=`
API change, so pagination is a pure client-side slice of the already-loaded array via a new shared
`paginate()` helper (`src/lib/pagination.ts`, unit-tested in `src/__tests__/pagination.test.ts`), used
identically across all 5 pages. `app/admin/users/page.tsx`'s existing "select all" bulk-action checkbox still
selects every row matching the current filter, not just the visible page, since narrowing a bulk role/delete
action to one page at a time would be a regression, not an improvement. Prev/Next controls match each page's
existing visual system — SCSS Module + design tokens on the three `AdminConsoleLayout`/`page.module.scss`
pages (`admin/logs`, `admin/users`, `backend`), plain Tailwind on `members` and `snapshots` (their existing
convention, no SCSS Module on those two pages). `app/admin/system-errors/page.tsx`, the sixth page named in
this finding, was **not** included in this pass — it wasn't part of the requested scope and remains open.

## MPE-03 — Search is inconsistent across admin/list pages

```text
Finding: /admin/users, /members, and /work-explorer all have a free-text search input. /snapshots, /admin/logs, /admin/audit, and /backend do not, despite /admin/logs and /admin/audit sharing the same "unbounded list, multi-tenant scale" profile flagged in MPE-02.
Evidence: grep for type="search"/searchQuery/placeholder="Search across app/ matches only app/admin/users/page.tsx:390-391, app/members/page.tsx:105-106, app/work-explorer/page.tsx:233,236. No match in app/snapshots/page.tsx, app/admin/logs/page.tsx, app/admin/audit/page.tsx, app/backend/page.tsx. Note: /admin/audit does have type/date-range filters per Checkpoint 1's inventory — the gap here is specifically free-text search, not all filtering.
Comparable pages that DO have this capability: /admin/users, /members, /work-explorer.
Why it matters: combined with MPE-02, /admin/logs and /admin/audit are the two admin pages with neither pagination nor search over a list that can grow unbounded with usage — the weakest combination found in the audit for an admin-facing operational page.
Severity: P2
Confidence: High
```

**Resolved (2026-07-17):** Added free-text search to all 4 flagged pages. `app/snapshots/page.tsx` (by
snapshot name) and `app/admin/logs/page.tsx` / `app/backend/page.tsx` Import Logs section (by filename or
uploader name/email) filter the already-fetched, bounded array client-side (case-insensitive substring
match), same as the MPE-02 pagination above, and search narrows the list before pagination is applied.
`app/admin/audit/page.tsx` is the one exception: its event log is genuinely unbounded and already paginates
server-side (`/api/admin/audit-events?page=&limit=`), so a client-side filter would only search the current
50-row page and silently miss matches elsewhere — search was added as a new `q` query param on that route
instead (`Prisma` `OR` `contains`/`insensitive` across `eventDescription`, `user.email`, `user.name`),
submitted through the same "Apply"/"Reset" filter bar the page's existing event-type and date-range filters
already use, so it composes with them rather than replacing them.

## MPE-04 — Destructive/state-changing actions are mostly well-guarded; one inconsistency found

```text
Finding: /snapshots (delete) and /backend (delete one/delete all) both correctly use a shared ConfirmDeleteDialog component before firing. /admin/users implements its own confirm state (confirmDelete/confirmBulkDelete) for both single and bulk delete. /admin/system-errors' "Dismiss" action (marks an error resolved) fires immediately on click with no confirmation step at all, unlike its sibling "Retry operation" button in the same row (also immediate, but less consequential since retry doesn't discard the record).
Evidence: app/snapshots/page.tsx:7,23 (ConfirmDeleteDialog); app/backend/page.tsx:7,103-104 (same component); app/admin/users/page.tsx:46,49 (confirmDelete/confirmBulkDelete state); app/admin/system-errors/page.tsx:268-274 (onClick={() => markResolved(log.id)} — no intermediate state).
Comparable pages that DO have this capability: /snapshots, /backend, /admin/users all gate deletion behind a confirm step.
Why it matters: "Dismiss" marking an error resolved is lower-severity than a hard delete (the record isn't destroyed, presumably still queryable), so this is a minor inconsistency rather than a data-loss risk — noted for completeness per the audit's parity-check method, not escalated.
Severity: P3
Confidence: Medium (did not verify whether "resolved" errors remain visible/reversible elsewhere in the admin/system-errors UI, which would fully explain why no confirm step was thought necessary here)
```

**Resolved (2026-07-17):** `app/admin/system-errors/page.tsx` now gates "Dismiss" behind the same
`ConfirmDeleteDialog` component `/snapshots` and `/backend` already use, matching this checkpoint's own
"comparable pages" precedent. Used `danger={false}` (amber, not the red/trash delete styling) since marking
an error resolved isn't destructive — the record stays in the log, just no longer counted as unresolved —
and the dialog's own message states that explicitly, resolving this finding's noted confidence gap about
reversibility.

## MPE-05 — A documented export capability is fully unwired (referenced but missing)

```text
Finding: app/developer/page.tsx:542 documents exportImportLogsWorkbook(logs) as a function that "Generate[s] Excel workbook" — described in the developer reference alongside other real, callable functions. It is exported from src/services/imports/importLogs.service.ts:447 but has zero callers anywhere in app/ or src/ outside its own test file.
Evidence: grep -rn "exportImportLogsWorkbook" app src (excluding __tests__) returns only the definition and the /developer documentation line — no import, no button, no API route invocation.
Comparable functionality: /backend (the page that lists import logs) has delete actions wired up but no export button, despite this ready-made export function existing in the same service layer it already imports from.
Why it matters: A technical reader consulting /developer would reasonably conclude this export is a working, reachable feature (it's listed with no "unused"/"planned" qualifier) — it is not. This is the same failure pattern as the already-known /verify-email "contact support" gap (Checkpoint 1): UI or docs promising a capability that isn't actually wired to anything a user can trigger.
Severity: P2
Confidence: High
```

**Resolved (2026-07-14):** Wired up rather than removed. `exportImportLogsWorkbook` itself only ever
handled the nested, file-based fallback log shape (`data/import-logs.json`), which is not what
`/backend`'s live table renders for authenticated users (that table reads Prisma-backed `ImportLog`
records via `/api/backend-view`/`/api/imports`, a flatter shape). Added a second function,
`exportImportLogRecordsWorkbook()`, for that DB-backed shape, plus `GET /api/imports/export` (session-
scoped identically to `GET /api/imports`, admin `?all=true` supported) and an "Export logs" button in
`/backend`'s Import Logs section header, next to the existing "Delete all my logs" button. `/developer`'s
service-function table now documents both functions accurately, including which one is actually live.

## MPE-06 — `/verify-email`'s "contact support" has no rendered contact method (carried forward, re-confirmed, no new instances found)

```text
Finding: app/verify-email/page.tsx:100 tells a user with an expired link to "contact support" with no email/link/form rendered alongside the text. A repo-wide search for other "contact support"/"contact us" instances found exactly one other occurrence (app/promo/DemoRequest.tsx:156), which IS backed by a real, working form — confirming this is an isolated gap, not a widespread pattern.
Evidence: grep -in "contact support|reach out|contact us|support@" app --include="*.tsx" — 2 total matches, only 1 unresolved.
Why it matters: unchanged from Checkpoint 1's original finding — a user locked out at the one point in onboarding where they cannot self-serve (an expired verification link) is given no actual path forward.
Severity: P2 (restated from Checkpoint 1, not a new finding — included here because this checkpoint's "referenced-but-missing" pass is the correct place to confirm it's not part of a larger pattern, which it is not)
Confidence: High
```

**Resolved (2026-07-17):** `app/verify-email/page.tsx`'s error-state message now includes a
`mailto:ali.aburas@deliveryclarity.app` link (pre-filled subject "Verification link expired"), matching the
support-contact email address already used consistently throughout the legal content
(`src/lib/legal-i18n/en.ts`). No new contact channel was invented — this reuses the one address the app
already directs users to elsewhere.

---

## Checked and found adequate (stated plainly, not omitted)

- **Loading-state parity**: cross-checked against `09-ux-and-accessibility.md`'s existing per-route table — no case was found where a page lacking a loading state has an otherwise-identical sibling page that has one; the loading-state gaps already recorded there (e.g. `/teams`, `/portfolio` rendering blank before data resolves) are isolated, not parity mismatches against a sibling.
- **Undo/recovery for destructive actions**: `/admin/users`' "reset-data" action uses a dry-run preview before the actual confirm (per Checkpoint 1's inventory), which is a stronger safety pattern than a plain confirm dialog — a positive finding worth noting, not just an absence of problems.
- **`/snapshots` delete, `/backend` delete**: both correctly confirm before firing (see MPE-04) — the majority of destructive actions in the app are properly guarded, only the one system-errors inconsistency was found.

---

## Summary

| ID | Gap | Severity |
|---|---|---|
| MPE-01 | Export capability inconsistent (`/work-explorer`, `/teams`, `/portfolio`, `/delivery-mix`, `/charts`, `/customer`, `/roadmap` lack it) | P2 |
| MPE-02 | Pagination missing on 6 list pages, most severe on `/admin/logs`, `/admin/users` | P1–P2 |
| MPE-03 | Search missing on `/snapshots`, `/admin/logs`, `/admin/audit`, `/backend` | P2 |
| MPE-04 | `/admin/system-errors` "Dismiss" has no confirm step, unlike sibling delete actions elsewhere | P3 |
| MPE-05 | `exportImportLogsWorkbook` documented in `/developer` as live but never wired to any UI | P2 |
| MPE-06 | `/verify-email` "contact support" has no rendered contact method (confirmed isolated, not a pattern) | P2 |

No Keep/Merge/Remove/Build recommendation is made in this file — these are gap findings for the prioritized backlog to weigh in Checkpoint 6 against everything else found.
