# ARCH-05 — Jira API Read-Only Integration: Design Document

**Status:** Phase 1 implemented (2026-06-20–2026-06-23, see `TODO-List.md` Section 19a, `JIRA-01`–`JIRA-14` + `ISSUETYPE-01`) on `feature/arch-05-jira-integration`, held unmerged until the full feature ships. Phase 2 (§5 tier 2 — scheduled polling) not started; Phase 2's fallback/source-badge half (§8) is already implemented as part of Phase 1. Phase 3 not started.
**Owner:** Ali Abu Ras
**Created:** 2026-06-20
**Closes:** `ARCH-05` in `TODO-List.md` Section 19 (P2 — Architecture / Planning Track)
**Depends on:** `FR-313` Backend Integration Gateway (✅ implemented — `src/server/gateway/`), which already ships a `jira` provider blueprint with no live calls wired up.

---

## 1. Why this exists

Today, getting Jira data into Delivery Clarity requires a human: export a CSV/Excel file from Jira, upload it via `/` (the upload page), and the file is parsed by `src/services/jira/parser.ts` into the app's canonical `JiraIssue` shape (`src/types/jira.ts`). This is reliable and zero-trust (no credentials, no live connection) but means every dashboard view is only as fresh as the last manual export.

This document plans a **read-only** live integration: instead of uploading a file, an admin connects the app directly to a Jira Cloud or Jira Server/Data Center instance via a JQL query, and the app fetches and refreshes issue data on a schedule or on demand — while still producing the exact same `JiraIssue[]` shape the rest of the app (metrics, dashboards, exports) already consumes unchanged.

**Explicitly out of scope for this design:** write-back to Jira (`FUT-JIRA-02`), OAuth 3LO (`FUT-JIRA-03`), and any UI/feature beyond getting issues *in*. Those are separate, larger design efforts gated behind this one landing first.

---

## 2. Auth model

Two Jira deployment types need two different credential shapes. Both are **read-only API tokens**, never OAuth, for v1:

| Deployment | Credential | Header |
|---|---|---|
| Jira Cloud | Email + API token (Atlassian account, scoped to a service account, not a personal login) | `Authorization: Basic base64(email:token)` |
| Jira Server / Data Center | Personal Access Token (PAT) | `Authorization: Bearer <PAT>` |

**Storage (revised 2026-06-30 — implemented):** the token is encrypted per `JiraConnection`, not shared through one global App Config value:
- An admin enters the token while creating a Jira connection in **Admin Settings → Jira Integration**. On save it is AES-256-GCM encrypted with `CONFIG_ENCRYPTION_KEY` and stored in `JiraConnection.apiTokenEncrypted`.
- This lets different Jira connections use different Jira Cloud accounts or Server/DC PATs.
- Server-side routes decrypt the selected connection's token through `src/services/jira/connectionCredentials.ts`; the token is never returned to the client.
- GET responses expose only `hasApiToken: boolean`.
- A "Test connection" action calls `GET /rest/api/{2|3}/myself` to confirm that connection's token is valid and report the authenticated account name, without exposing the token itself. The Backend Gateway still receives `credentialsPresentOverride: true` after the route resolves the encrypted connection token.
- Existing connection rows created before this change have no token; recreate them with a token to enable test/sync.

**Who can configure it:** admin-only, same `ADMIN_ONLY` guard as `/admin/settings`. No non-admin role ever sees or touches the token.

---

## 3. API scope

v1 needs exactly one read endpoint family:

- **Jira Cloud:** `GET /rest/api/3/search/jql` (the new paginated JQL search endpoint that replaced the deprecated `/rest/api/3/search` `startAt`-based pagination in 2024) — `nextPageToken`-based pagination, `maxResults` ≤ 100 per page.
- **Jira Server/DC:** `GET /rest/api/2/search` with `startAt`/`maxResults` pagination (server/DC has not deprecated this).
- Both: `fields` query param restricted to exactly the canonical field set the app needs (see §4) — never `fields=*all`, to keep payloads small and avoid pulling fields with restrictive project permissions that could 403 the whole request.

**JQL is admin-configured**, not user-typed in v1 — e.g. `project = PROJ AND updated >= -30d ORDER BY updated DESC`. A free-text JQL box is a fast way to leak a project's entire backlog to a misconfigured query; v1 ships with a small set of guided filters (project key(s), optional board/sprint filter, lookback window) that get assembled into JQL server-side, not raw JQL entry. Open question for a future revision: expose raw JQL behind a "I understand this" admin confirmation.

**Every call routes through the existing Gateway** (`callExternal()` in `src/server/gateway/externalGateway.ts`) with `provider: 'jira'`, inheriting its SSRF/host-allowlist protection, timeout (overridden to 30s — Jira search can be slow on large projects), retry/backoff, and redacted audit logging for free. No new HTTP client code is needed.

---

## 4. Field mapping

The Jira REST response uses Jira's internal field IDs (`customfield_10014` for Epic Link, `customfield_10016` for Story Points — these IDs are **per-instance**, not universal) and a deeply nested JSON shape (`issue.fields.status.name`, `issue.fields.assignee.displayName`, etc.). The existing parser already solves an analogous problem for CSV column names via `FIELD_ALIASES` in `src/services/jira/parser.ts` — this design extends that same idea one layer earlier:

1. **Field discovery step:** on first connect (and on-demand via a "Re-detect fields" admin action), call `GET /rest/api/3/field` to fetch the instance's actual field ID → human name mapping (e.g. `customfield_10014` → `"Epic Link"`).
2. **Mapping table:** persist the resolved `{ canonicalField: jiraFieldId }` mapping per connection (see §6) — this is the live-API equivalent of the `column-mapping` page's `ColumnMappingResult`, and should reuse its UI (`app/column-mapping/page.tsx`) almost as-is: same fuzzy-match-by-name logic, same "mapped / aliased / unrecognised" badges, just sourced from `/field` instead of CSV headers.
3. **Normalize step:** a new `src/services/jira/apiAdapter.ts` (not built yet) converts each raw Jira API issue object into the same `Record<string, unknown>` shape `parseJiraFile()` already produces — same canonical keys (`'Issue Key'`, `'Epic Link'`, `'Story Points'`, etc.) — so `validateIssueData()`, `calculateDashboardMetrics()`, and every dashboard page downstream need **zero changes**. This is the central design constraint: the live-API path and the file-upload path converge into the same `JiraIssue[]` before metrics calculation.

Minimum required field set to map (mirrors `ESSENTIAL_FIELDS` + the 9 "important" fields the column-mapping health score already weights): `key`, `issuetype`, `summary`, `status`, `assignee`, `project`, the epic-link custom field, the story-points custom field, `sprint` (via the Agile-board custom field, e.g. `customfield_10020`), `created`, `updated`, `resolutiondate`.

---

## 5. Refresh strategy

Three tiers, ship in this order:

1. **Manual refresh** (v1): an admin clicks "Sync now" on the connection; same UX as today's file upload, just sourced from the API instead of a file input. Synchronous request/response, same loading-state pattern as upload.
2. **Scheduled polling** (v1.1): a configurable interval (default 30 min, minimum 5 min to respect Jira Cloud's rate limits — see §7) triggers a background fetch. Requires a scheduler, which this app does not currently have (no cron/queue infrastructure) — likely a `setInterval`-driven server-side job keyed off a `lastSyncAt` timestamp checked on a lightweight heartbeat request, *not* a new infrastructure dependency, to stay consistent with "do not implement CI/CD or expanded infra without approval."
3. **Webhook-driven** (future, not v1): Jira can push `jira:issue_updated` webhooks to a public endpoint for near-real-time sync. Deferred — requires a publicly reachable endpoint and webhook signature verification, meaningfully larger scope than this design.

Every refresh — manual or scheduled — produces one full `JiraIssue[]` snapshot (re-running the whole JQL, not an incremental diff) for v1. Incremental sync (`updated >= <lastSyncAt>` merged into existing data) is a v1.1+ optimization once the full-refresh path is proven; merging partial updates correctly (handling issues that left the JQL's scope, e.g. moved to a different project) is non-trivial enough to deserve its own design pass.

---

## 6. Storage — schema additions

Extends, rather than replaces, the existing `ImportLog` / `DashboardSnapshot` models (`prisma/schema.prisma`):

```prisma
model JiraConnection {
  id              String   @id @default(cuid())
  name            String                          // admin-facing label, e.g. "Production Jira"
  deploymentType  String                          // "cloud" | "server"
  baseUrl         String                          // e.g. https://yourcompany.atlassian.net
  authEmail       String?                         // Cloud only — paired with the API token (token itself lives in env, never here)
  projectFilters  String                          // JSON array of project keys
  fieldMapping    String                          // JSON: { canonicalField: jiraFieldId }
  refreshMode     String   @default("manual")     // "manual" | "scheduled"
  refreshIntervalMinutes Int @default(30)
  lastSyncAt      DateTime?
  lastSyncStatus  String?                         // "success" | "partial" | "failed"
  lastSyncError   String?                         // redacted error summary
  createdByUserId String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  createdBy  User        @relation(fields: [createdByUserId], references: [id])
  importLogs ImportLog[]
}
```

`ImportLog` gains two nullable columns: `sourceType String @default("file")` (`"file" | "api"`) and `jiraConnectionId String?` (FK to `JiraConnection`, nullable so existing file-upload rows are unaffected). No other existing model changes. `DashboardSnapshot.metricsJson` already stores the full computed-metrics blob regardless of source — unchanged.

The Jira API token itself is stored only as encrypted ciphertext in `JiraConnection.apiTokenEncrypted`. Plaintext exists only transiently during create/test/sync on the server and is never returned in an API response.

---

## 7. Failure modes

| Failure | Detection | Handling |
|---|---|---|
| Invalid/expired token | `401` from Jira | Gateway returns `errorCategory: 'non_retryable_http'`; surface "Reconnect Jira" admin action; do **not** retry (never hammer with a dead token) |
| Rate limited | `429` + `Retry-After` header (Jira Cloud) | Gateway's existing retry/backoff handles `429` as retryable; respect `Retry-After` if present, else exponential backoff already built into `retryPolicy.ts` |
| Network/timeout | fetch throws / abort | `errorCategory: 'timeout'` or `'network'` — fall back per §8, log, surface a "last successful sync: 2h ago" badge rather than a hard error |
| Field permission denied mid-result | Jira returns issues with `fields` partially `null` for fields the API-token's user can't see on some projects | Treat missing required fields as "unmapped" for that issue (same as the file-upload validator already does for missing CSV columns) rather than failing the whole sync |
| JQL returns 0 issues | `200` with empty `issues[]` | Not an error — but warn distinctly from "sync failed" so an admin doesn't mistake an overly-narrow filter for an outage |
| Instance field IDs changed (e.g. a custom field was recreated) | Re-detect step (§4) returns a field mapping that no longer matches stored `fieldMapping` | Admin re-mapping prompt, same UX as the column-mapping page's "unrecognised" state |
| Partial page failure mid-pagination | One page of a multi-page JQL result fails after others succeeded | Do not commit a partial dataset as the new snapshot — all-or-nothing per sync, matching the file-upload model where a single parse either succeeds or fails as a whole |

All failures are logged via the gateway's existing JSONL audit log (`data/gateway-audit.jsonl`) with secrets redacted — no new logging mechanism needed.

---

## 8. Fallback behavior — ✅ Implemented (JIRA-08, 2026-06-21)

Mirrors the existing dual-source contract in `src/lib/storage.ts` (`loadMetricsWithSource()` / `MetricsDataSource`):

- A failed live sync **never** wipes existing data. **Deviated from this section's original wording:** the actual mechanism is `writeLatestMetrics()` (`src/services/metrics/latestMetricsStorage.ts`), not `DashboardSnapshot` — `DashboardSnapshot` is a deliberate user-named, 20-per-user-capped milestone feature; auto-creating one on every sync would silently eat that budget. `writeLatestMetrics()` is the same mechanism the file-upload route already uses, and it's structurally all-or-nothing: the sync route only calls it after validation succeeds, so a 409/422/502 failure leaves the previous snapshot completely untouched. Confirmed live: forced a sync failure and verified `/api/metrics/latest`'s `savedAt`/`metrics` were unchanged.
- `'jira-api'` added to `MetricsDataSource` in `src/lib/storage.ts`, alongside the existing `'bucket' | 'cache' | 'server-local' | 'localstorage' | 'upload' | 'snapshot' | 'none'`. `writeLatestMetrics()` now takes an optional `origin: { source: 'file' | 'jira-api', connectionName?, connectionId? }`, persisted in `latest-metrics.json` and surfaced by `GET /api/metrics/latest` (taking priority over bucket/cache transport detection).
- **Correction to this section's original assumption:** there was no existing source-status badge shown after login — `DataSourceBadge` (`src/components/ui/DataSourceBadge.tsx`) existed but had never been mounted anywhere in the app; only its `DataSourceProvider`/`CloudLoadingBanner` were wired into `app/layout.tsx`. JIRA-08 mounted `<DataSourceBadge compact />` for the first time, in `DashboardTopbar`'s top-right rail (visible on every `/dashboard/*` route), now rendering "Jira (Production) — last synced 14 minutes ago" (full) / "Jira · 14m ago" (compact, with the full text in the `title` tooltip).
- File upload remains fully available even when a Jira connection exists — a user can always override with a fresh manual upload, which simply creates a new `file`-sourced `ImportLog`/snapshot alongside the API-sourced ones (both upload routes now tag `writeLatestMetrics(metrics, { source: 'file' })`). The two sources are not merged; the dashboard always reflects whichever snapshot is most recent, file or API.

---

## 9. Security considerations

- All the SSRF/host-allowlist/protocol/path-traversal protection in `src/server/gateway/endpointPolicy.ts` applies automatically since every call routes through `callExternal()`.
- The admin-configured base URL is validated against the host-allowlist mechanism already in the gateway (extend `allowedHosts` resolution to accept the admin-entered Jira base URL's hostname at connection-creation time, rather than only a static blueprint host).
- Service-account API tokens (not personal tokens) should be a documented recommendation in the admin UI's connection-setup guide, so the integration doesn't silently break when an individual employee's personal token expires or their account is deactivated.
- No write scope is ever requested — Jira API tokens are scoped per-account, not per-permission, so this is an operational/process safeguard (use a read-only-permissioned service account in Jira), documented in the setup guide, not something this app can technically enforce.

---

## 10. Non-goals / explicitly deferred

- Write-back to Jira (`FUT-JIRA-02`) — separate design, requires an approval workflow for any change originating from this app.
- OAuth 2.0 (3LO) support (`FUT-JIRA-03`) — API tokens/PATs are sufficient for a single-tenant admin-configured connection; OAuth only matters if this app ever needs per-user Jira identity, which is out of scope.
- Multi-instance / multi-tenant Jira connections — `JiraConnection` is modeled as a list to allow more than one in principle, but v1 UI only supports configuring and actively syncing one at a time.
- Raw JQL text entry — guided filters only, per §3.
- Incremental/delta sync — full-refresh only, per §5.
- Webhooks — polling only, per §5.

---

## 11. Rollout plan

1. **Phase 0 (this document):** design review and approval.
2. **Phase 1:** `JiraConnection` schema + admin UI (connect, test, field mapping) + manual "Sync now" → produces `ImportLog`/`DashboardSnapshot` identical in shape to file uploads. No scheduling yet.
3. **Phase 2:** scheduled refresh (§5 tier 2) + fallback/source-badge UI (§8).
4. **Phase 3 (re-evaluate):** incremental sync, raw JQL, webhooks — each re-scoped as its own design addendum once Phase 1–2 are in production and proven.

Each phase ships behind the same `npm test`/lint/build gate as every other change in this repo; Phase 1 alone is roughly the size of the original Backend Integration Gateway foundation (`FR-313`) plus the original file-upload pipeline combined, so it should be estimated and reviewed as its own multi-session effort, not a single pass.
