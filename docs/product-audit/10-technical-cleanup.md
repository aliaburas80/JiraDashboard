# Delivery Clarity — Technical, Security, Privacy & Performance Audit (Checkpoint 5)

**Status: COMPLETE.** Covers the remainder of Checkpoint 5's scope not already placed in `09-ux-and-accessibility.md` §6–8: API-route security, privacy-claim reconciliation, performance, and technical cleanup (duplicate code, dead code, API inventory). No production code was changed to produce this document.

**Evidence basis:** Direct code inspection (grep + read) across all 72 `app/api/**/route.ts` handlers, `src/lib/`, `src/services/storage/`, `prisma/schema.prisma`, `app/privacy/page.tsx`/`app/terms/page.tsx`, `next.config.js`, and `src/components/`. No rendered/runtime verification (no live requests were made against the app; this is static analysis only).

---

## Part 1 — Security

**Overall assessment: no P0/P1 directly-exploitable vulnerability was found.** The auth/admin/IDOR surface is consistently well-guarded — stated plainly because this checkpoint's job includes confirming what's fine, not only what's wrong.

### Checked and confirmed clean
- Passwords hashed with `bcryptjs`, `SALT_ROUNDS = 12` — no plaintext anywhere.
- Reset/verification tokens: 32-byte crypto-random, single-use (nulled after use), time-limited (1h reset / 24h verification).
- Brute-force protection: Postgres-backed rate limiting (survives cold starts) on login (5/min/IP), register/forgot-password/resend (5/hour/IP), change-password (10/15min/user).
- Anti-enumeration: forgot-password, register, resend-verification all return identical responses regardless of account existence (one exception — SEC-01 below).
- All 24 `/api/admin/*` routes independently re-check `session.role === 'admin'` server-side (a local `requireAdmin()` helper), not relying solely on `middleware.ts`. `admin/users` additionally blocks self-lockout and protects super-admin accounts from modification by lesser admins.
- IDOR/BOLA spot-checks (`snapshots/[id]`, `imports/[id]`, `trends`, `members`, `admin/users`) all scope queries by `session.userId`/workspace, with `snapshots` correctly using `findFirst` + workspace filter (404, not 403, to avoid leaking existence) rather than a raw `findUnique` by ID.
- CSV/Excel formula-injection (CLAUDE.md §38.5): `src/lib/exportSafety.ts`'s `sanitizeSpreadsheetCell`/`buildSafeCsv` correctly neutralize `=`/`+`/`-`/`@`/tab/CR-prefixed cells; both export services route through it with no bypass found.
- `dangerouslySetInnerHTML`: only 3 call sites app-wide — 2 render `JSON.stringify()` of static JSON-LD (safe), 1 renders HTML-escaped markdown from a hardcoded allow-list of static doc files (never user input).
- `NEXT_PUBLIC_*` audit: only 2 variables exist app-wide (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ALLOW_REGISTER`), neither a secret.
- Upload parsers (`XLSX.read`, custom CSV parser) genuinely parse content rather than trust the extension — malformed/malicious files typically throw and 400, rather than being silently accepted.

### Findings

```
Finding: middleware.ts's PROTECTED/ADMIN_ONLY matcher never covers /api/*, so every one of the 72 API routes is solely, independently responsible for its own auth check with no shared enforcement layer as a backstop.
Evidence: middleware.ts's matcher config and PROTECTED/ADMIN_ONLY arrays only reference page paths, not /api/*.
Why it matters: verified this is currently handled correctly almost everywhere in this checkpoint's sample, but it's a single-point-of-failure architecture — a new API route added in the future with a forgotten auth check would have zero backstop, unlike page routes which get middleware protection even if a page forgets its own check.
Severity: P2 (architectural risk, not a current exploit)
Confidence: High confidence
```

```
Finding: GET /api/backend-view has an intentional unauthenticated fallback that returns recent import filenames/row counts/status when there's no session.
Evidence: app/api/backend-view/route.ts (unauthenticated branch returns data rather than 401).
Why it matters: reachable directly by URL even though the /backend page itself is session-gated — import filenames and row counts are lower-sensitivity than issue content, but this is still data exposed without authentication that the page-level gating implies should require login.
Severity: P2
Confidence: High confidence
```

```
Finding: POST /api/auth/login returns a distinct 404 "USER_NOT_FOUND" for unknown emails vs. a generic 401 for a wrong password on a known account — inconsistent with every other auth endpoint's anti-enumeration pattern.
Evidence: app/api/auth/login/route.ts (differentiated error responses); contrast forgot-password/register/resend-verification, all of which return identical generic responses regardless of account existence.
Why it matters: an attacker can enumerate registered email addresses by observing which response code they get from the login endpoint alone, even though every sibling auth endpoint was deliberately hardened against exactly this.
Severity: P2
Confidence: High confidence
```

```
Finding: Jira-export and retro-file upload validation is extension/declared-type based, with no magic-byte/content-signature check, though the downstream parser does validate real structure.
Evidence: app/api/upload/route.ts, app/api/retro/parse/route.ts.
Why it matters: mitigated significantly by the parser (XLSX.read/CSV parser) rejecting genuinely malformed content — but a file with a spoofed extension that happens to parse as valid-but-garbage data would not be caught at the validation layer, only downstream.
Severity: P3
Confidence: High confidence
```

```
Finding: Profile image upload trusts the client-declared Content-Type with no server-side image content verification (though image/svg+xml is correctly excluded, preventing stored-SVG-XSS).
Evidence: profile image upload route (src/services/storage/profileImages.ts consumer).
Severity: P3
Confidence: Medium confidence
```

---

## Part 2 — Privacy

**Overall assessment: the strongest claims in `/privacy` (no AI/analytics/third-party tracking, Jira content never in error logs) are genuinely true in code. The weakest are the retention-schedule and sub-processor-disclosure claims.**

### Checked and confirmed clean
- **No analytics/telemetry SDK exists anywhere** in the app (grepped for Segment, Mixpanel, GA/gtag, PostHog, Sentry, Amplitude, Hotjar, FullStory, Datadog RUM, and checked `package.json`) — the "not shared with third-party analytics/advertising/AI services" claim is accurate.
- **Error logging never captures raw Jira content**: `app/api/events/error/route.ts` explicitly documents and enforces "never stores cookies, tokens, form values, or uploaded Jira content" — only message/stack/page/component/severity are persisted.
- **Jira API credentials encrypted at rest** with AES-256-GCM (`src/lib/secret-field.ts`) — matches the claim exactly.
- **Login-attempt IP pruning** is genuinely enforced inline (not just aspirational) on every login/error-report call.
- **Raw uploaded file content is not persisted server-side** — only metadata + derived metrics JSON, consistent with the policy's own framing.
- **"Clear Local Data" dialog copy is honest** — both the code comment and the rendered dialog text correctly state it only clears local storage and does not touch server data, in either storage mode. (This resolves the open question flagged in Checkpoint 2 — see below for what it surfaces instead.)
- No sale/rental/trade of data, no ad cookies, no session-replay tooling found anywhere in dependencies or code.
- `/privacy` and `/terms` are internally consistent with each other on the sub-processors they do name (Render, Neon, Resend/SMTP) — they share the same blind spot (below), rather than contradicting each other.

### Findings

```
Finding: /privacy's specific data-retention windows (e.g. "audit events: 12 months," "error records: 90 days") are not actually enforced by any automated process — the only retention-cleanup code (dataRetention.service.ts) covers just ImportLog and DashboardSnapshot, and its only caller is a manual, admin-triggered cleanup endpoint with no scheduled job anywhere in the repo.
Evidence: src/services/settings/dataRetention.service.ts (no AuditEvent/SystemErrorLog/AppError handling); app/api/admin/cleanup/route.ts (manual-only trigger); no cron/scheduler found anywhere in the codebase.
Why it matters: the policy states unconditional, specific retention windows as if systematically enforced; in reality most listed data categories accumulate indefinitely unless an admin manually intervenes — a data-minimization/storage-limitation claim that overstates what the code actually does.
Severity: P1
Confidence: High confidence
```

**Resolved (2026-07-14):** Owner decision — correct the policy copy rather than build automated enforcement. Added a disclosure paragraph to the "Data retention" section in all 7 languages, stating plainly that the listed periods are targets, that only Jira import data and dashboard snapshots have any deletion tooling today (admin-triggered, not scheduled), and that the other categories don't yet have dedicated deletion tooling. No code changed. See `docs/fix-privacy-retention-window-claims`.

```
Finding: /privacy names only AWS S3 as a cloud sub-processor, but the codebase implements three full cloud storage providers (S3, Azure, GCP) usable both for admin-level cloud backup and a per-user "bring your own cloud" feature.
Evidence: src/services/storage/userStorageProvider.service.ts (type 's3' | 'azure' | 'gcp'); src/services/storage/providers/{azure,gcp}Provider.ts (full implementations).
Why it matters: if Azure or GCP is enabled for any deployment or user, Jira-derived personal data can flow to Microsoft/Google infrastructure never disclosed as a sub-processor — a transparency gap that becomes a real compliance issue (not just a documentation gap) the moment either provider is actually configured for a live user.
Severity: P1 (P0 if Azure/GCP storage is presently enabled for any live account — this audit could not determine live configuration state from code alone)
Confidence: High confidence on the code capability; Medium on live severity (deployment configuration is outside this audit's visibility)
```

**Resolved (2026-07-14):** Owner confirmed: Azure/GCP storage is implemented in code but not enabled for any live deployment today — S3-only in practice. No disclosure gap currently exists, so no policy change was made. This is a live-configuration fact this audit could not determine from code alone (as flagged above); if Azure or GCP is ever enabled for a live account, `/privacy` must be updated before or at that time, not after.

```
Finding: There is no self-service account-deletion feature anywhere in the app, despite /terms directing users who disagree with the terms to "request account deletion" as if it were a supported self-service action with an implied SLA.
Evidence: grep for "delete account"/"close account" across app/ returns nothing outside the legal text itself; the only code path that deletes a User row is the admin-only DELETE /api/admin/users route.
Why it matters: overstates a user's practical ability to exercise data-erasure rights independently — deletion is entirely a manual, ungoverned admin process today, with no enforced timeline despite the 30-day claim in /privacy.
Severity: P2
Confidence: High confidence
```

```
Finding: "Encrypted backup snapshots" (claimed for S3-stored backups) is not enforced at the application level — the S3 upload call sets no ServerSideEncryption parameter, so encryption-at-rest depends entirely on the target bucket's own default configuration, unverified and unenforced by the app.
Evidence: src/services/storage/providers/s3Provider.ts (PutObjectCommand with no SSE parameter).
Severity: P2
Confidence: Medium confidence
```

### Resolution of Checkpoint 2's open question
Checkpoint 2 asked what happens to a cloud-mode user's server data when they click "Clear Local Data." The answer: nothing — and that's accurately disclosed. The real, previously-unstated gap is broader: **no cloud-mode user has any self-service way to delete their server-side data at all**, regardless of which button they click. This is now captured as the account-deletion finding above rather than left as an open question.

---

## Part 3 — Performance

### Dominant finding: no caching layer exists for the app's primary data loader

```text
Finding: loadMetricsWithSource() (src/lib/storage.ts) has zero memoization or caching and is called independently by ~20 separate mount points across the app (app/dashboard/layout.tsx plus 9 /dashboard/* pages plus ~10 top-level pages), each triggering a real network round-trip (fetch with cache: 'no-store') and JSON parse of a payload that can hold thousands of flow items.
Evidence: src/lib/storage.ts (loadMetricsWithSource implementation, no cache); confirmed call sites across app/dashboard/{layout,coaching,data-quality,epic-readiness,flow-health,key-metrics,labels,ownership,priority-attention,trends}/page.tsx and app/{charts,column-mapping,customer,data-quality,delivery-mix,explore,flow-health,forecast,portfolio,readiness,release-readiness,roadmap,sprint-kanban,summary,teams,work-explorer}/page.tsx.
Why it matters: next.config.js's experimental.staleTimes: { dynamic: 0, static: 0 } explicitly disables Next.js's own router cache app-wide (per its own comment, added to fix a data-staleness bug) — so this isn't just an initial-load cost, it re-fires on every soft navigation between any two of these ~20 routes. A single session of clicking through 5 dashboard pages triggers 5 full fetch+parse cycles of the same dataset.
Affected users: all users, on nearly every navigation within the app.
Severity: P1
Confidence: High confidence
```

```text
Finding: app/dashboard/layout.tsx loads DashboardMetrics for its own use but only forwards the result to DashboardNavSidebar, not to {children} via context — so its own fetch buys the 9 child pages nothing, and each redoes the identical fetch independently.
Evidence: app/dashboard/layout.tsx (metrics kept in local state, passed only to <DashboardNavSidebar>, {children} renders with no prop/context).
Why it matters: a context provider in this one layout file would collapse what are currently 10 independent fetches (the layout + 9 child pages) into 1 per dashboard visit — this is the single highest-leverage, lowest-risk fix identified in this entire audit (one file, no API change, no behavior change).
Severity: P1
Confidence: High confidence
```

```text
Finding: Positive/contrast — fetchCurrentUser() (src/lib/currentUser.ts) already implements exactly the caching pattern missing from loadMetricsWithSource(): a module-level cache plus in-flight-promise dedup, added specifically to solve the same "no shared layout, ~28 pages import AppShell directly" problem for user-identity data.
Evidence: src/lib/currentUser.ts (cachedUser/inFlight module state, explanatory comment).
Why it matters: this confirms a working, in-house-proven fix pattern already exists in the codebase for the exact class of problem the two findings above describe — applying the same pattern to the much larger metrics payload is a known-good, low-risk fix, not a novel architecture change.
Severity: n/a (context establishing the fix is low-risk)
Confidence: High confidence
```

### Secondary findings

```text
Finding: app/charts/page.tsx recomputes ~10 unmemoized filter/reduce/map chains over the full flow.items array directly in the component body; both the tab switcher and the chart-visibility customizer panel trigger re-renders that re-run all of them.
Evidence: app/charts/page.tsx (doneBucket/criticalBucket/typeSegs/sprints/capacity/quarters/kanban/labelStats derivations, none wrapped in useMemo).
Why it matters: switching tabs or toggling chart visibility re-executes ~10 passes over up to ~3,600 items with no memoization gate, unlike its sibling pages (work-explorer, dashboard/flow-health), which correctly memoize equivalent derivations.
Severity: P2
Confidence: High confidence
```

```text
Finding: Positive — no list virtualization exists anywhere in the app, but this is low-risk today because the one large-list page (/work-explorer) already caps rendered DOM rows via pagination (PAGE_SIZE=50); no heavy chart/date library is installed at all (charts are hand-rolled SVG), so the hypothesized "large page ships an unsplit heavy dependency" risk does not materialize; the one genuinely large dependency in the app (reactflow, used by /explore) is already correctly next/dynamic-split with ssr:false.
Severity: n/a (checked, clean)
Confidence: High confidence
```

```text
Finding: User-uploaded avatars and the admin theme logo render via plain <img> tags rather than next/image, while every static branding/auth-flow image consistently uses next/image.
Evidence: app/members/page.tsx (avatar <img> inside a .map over the member list — N unoptimized requests for N members), src/components/settings/ProfileTab.tsx, app/admin/theme/page.tsx (logo preview); contrast app/login/page.tsx, app/register/page.tsx, AppShell.tsx, DashboardTopbar.tsx, all using next/image.
Why it matters: these are S3-hosted, user-controllable-size images served with no automatic resizing/format negotiation/lazy-loading — worst case on /members, where it's N requests in a list render, not a single image.
Severity: P2
Confidence: High confidence
```

```text
CORRECTION (2026-07-13, discovered during implementation attempt, not part of the original audit pass):
The admin/theme logo preview is out of scope for this finding entirely — it renders a client-side
FileReader data: URL, not a network image (already correctly exempted with its own eslint-disable
comment); only the two S3-backed avatar sites (ProfileTab.tsx, members/page.tsx) apply.

For those two, applying next/image as recommended above is UNSAFE, not merely unimplemented. Live testing
against the running app (registering a throwaway test account, uploading a real test image, and probing
`/_next/image` directly with and without a session cookie) confirmed: Next's built-in image optimizer
correctly requires authentication on the FIRST fetch of a given optimizer URL (matching
/api/profile/image's own requireUser() check), but its response cache does not re-check authorization on
subsequent hits — once any authenticated request (including the owner's own normal page view) warms the
cache for a given url+width+quality combination, the optimized image bytes are then served to fully
unauthenticated requests indefinitely. Because /members already hands every logged-in user every other
member's exact avatarUrl (their S3 key) as plain page data, any authenticated user — including a free
self-registered account — can trivially cause any other user's avatar to become permanently, publicly
readable with zero authentication, simply by requesting it once through /_next/image.

This exposure is latent today (no code path in the app currently invokes /_next/image for these URLs), but
adopting next/image for either avatar site as this finding recommends would make ordinary avatar rendering
the trigger, converting a theoretical gap into routine exposure. Decision: this finding is downgraded from
"P2, fix via next/image" to "will not fix as originally scoped" — ProfileTab.tsx and members/page.tsx stay
on plain <img> until a genuinely safe path exists (e.g., a custom loader that pre-resizes at upload time
server-side rather than relying on the runtime optimizer against an authenticated route, or an explicit
`unoptimized` prop if the lazy-loading/dimension benefits alone are wanted without touching the optimizer
at all). No code changed as a result of this correction.
```

---

## Part 4 — Technical cleanup

### API route inventory (72 routes)

| Area | Count | Purpose |
|---|---|---|
| `admin/*` | 30 | Admin console backend: config, audit log, backup/restore, cleanup, diagnostics, feedback moderation, issue-type hierarchy, Jira connection CRUD/test/sync, orphan rules, persona preview, security settings, storage sync, system errors, thresholds, user-add-request approval, user management/reset |
| `auth/*` | 8 | Login, logout, register, session (`me`), password change/forgot/reset, email verification resend/verify |
| `profile/*` | 4 | Profile CRUD, image upload, storage-provider selection + connection test |
| `imports/*` | 3 | Import log listing (single, by-id, all) |
| `snapshots/*` | 2 | Save/list and fetch/delete a saved snapshot |
| `notifications/*` | 2 | List notifications; mark one read |
| `user-add-requests/*` | 2 | Self-service access request + status check |
| `metrics`, `metrics/latest` | 2 | Full metrics payload vs. latest-only |
| `upload`, `upload/merge` | 2 | Jira export upload + merge-into-existing variant |
| `health`, `ready` | 2 | Liveness/readiness probes |
| `coaching/admin-signals` | 1 | Admin-only aggregate coaching signal summary — feeds the dormant coaching bundle (`08-metric-dictionary.md` CP3-010) |
| `backend-view` | 1 | Import-log/route-registry overview; doubles as a manual API index |
| `developer-view` | 1 | Hardcoded architecture/services description (not live introspection) |
| `dashboard` | 1 | Static `{status:'ok'}` stub, no live frontend caller — see finding below |
| `entitlement` | 1 | Trial entitlement/time-remaining state |
| `retro/parse` | 1 | Stateless retro-file preview parser, no persistence |
| `docs` | 1 | Serves a fixed allow-list of markdown docs by slug |
| `events/error` | 1 | Public, rate-limited client-error sink |
| `demo-request` | 1 | Public `/promo` lead-gen form handler |
| `feedback` | 1 | Authenticated user feedback submission |
| `jira/sync` | 1 | Manual per-user Jira sync |
| `members` | 1 | Team directory |
| `trends` | 1 | Sprint/period trend series |

### Findings

```text
Finding: Six components under src/components/dashboard/ are exported but have zero import references anywhere else in the codebase (not even tests): DashboardSectionSwitcher.tsx, DraggableMetricTable.tsx, LayoutBuilderPanel.tsx, SaveSnapshotButton.tsx, SprintComparePanel.tsx, WhatChangedPanel.tsx.
Evidence: grep confirms zero non-definition references for each; 1,118 combined lines.
Why it matters: unmounted UI code (drag-and-drop tables, layout builder, sprint-compare, save-snapshot) accumulates type-check/maintenance cost and misleads a reader into thinking these features are live. DashboardSectionSwitcher.tsx and LayoutBuilderPanel.tsx were already flagged as orphaned in CLAUDE.md's own tracked ORPHAN-02 — this finding confirms 4 more files in the same directory share that status, not previously enumerated anywhere.
Severity: P2
Confidence: High confidence
```

**Resolved (2026-07-18):** Deleted all six files — `DashboardSectionSwitcher.tsx`, `DraggableMetricTable.tsx`,
`LayoutBuilderPanel.tsx`, `SaveSnapshotButton.tsx`, `SprintComparePanel.tsx`, `WhatChangedPanel.tsx` (1,118
lines) — plus two shared library files that became fully orphaned as a direct consequence: `src/lib/dashboardSections.ts`
(29 lines; its `section-*` ids described the pre-nav-consolidation single-page dashboard and matched nothing in the
routed `/dashboard/*` pages) and `src/lib/layoutBuilder.ts` (87 lines; imported only by `LayoutBuilderPanel.tsx`),
along with their two dedicated test files, `src/__tests__/dashboardSectionSwitcher.test.ts` and
`src/__tests__/layoutBuilder.test.ts` (230 lines combined), which tested only that now-dead library code and would
otherwise fail on the missing imports. Pre-deletion verification: re-ran `grep -rln "<Name>" app src --include="*.ts"
--include="*.tsx"` for each of the six component names individually — zero references beyond each file's own
definition, confirming the finding wasn't stale. Traced every one of the six files' own imports to check for
collateral shared code: `DashboardSectionSwitcher.tsx`/`LayoutBuilderPanel.tsx` → `dashboardSections.ts` (see above);
`LayoutBuilderPanel.tsx` → `layoutBuilder.ts` (see above); `SaveSnapshotButton.tsx` → `DashboardMetrics`
(`@/types/metrics`, broadly used elsewhere, untouched); `SprintComparePanel.tsx` → `SprintThroughputSummary`/
`SprintThroughput` (`@/types/throughput`, broadly used elsewhere — `app/forecast/page.tsx`,
`SprintThroughputPanel.tsx`, `forecastEngine.service.ts`, etc. — untouched); `WhatChangedPanel.tsx` → `TrendPoint`
(`@/types/trends`, broadly used elsewhere, untouched). Confirmed none of the six had a dedicated SCSS module (all
were `'use client'` components styled inline via className/tokens, no `*.module.scss` sibling existed). While
tracing `ORPHAN-02`'s note about a third file, `DashboardSidebarNav.tsx`, discovered its SCSS module
(`DashboardSidebarNav.module.scss`) is actually still live — imported by the current `DashboardNavSidebar.tsx`
under the old filename, a leftover from an incomplete rename — so `DashboardSidebarNav.tsx` (the `.tsx` file only)
remains a separate, still-undecided orphan question, deliberately left untouched as it was never one of the six
named files in this finding's scope. Full verification: `npm run typecheck` clean; `npm run test` 958/958 tests
passing, 105/106 suites (the 1 failing suite, `jiraConnections.test.ts`, is a pre-existing jest-worker SIGSEGV
parallel-run flake unrelated to this change — confirmed by re-running it alone with `--runInBand`, where all 27
tests pass); `npx eslint .` 1,150 pre-existing warnings / 0 errors (0 new); `npm run lint:css` clean; `npm run build`
compiled the same route count as before the change (64 routes). Executed under the owner's explicit "finish
everything today" session-goal authorization rather than a separate `AskUserQuestion` decision point — noted here
because this session's established pattern for large dead-code removals (`ORPHAN-01`, `ORPHAN-03`) otherwise
required an explicit owner decision step before deleting. Branch: `chore/orphan-02-remove-dead-dashboard-components`.

```text
Finding: /api/dashboard is a static, unused stub route whose name is misleading relative to its content.
Evidence: app/api/dashboard/route.ts returns only {status:'ok', service, version}; grep confirms zero live frontend callers, only referenced from documentation payloads (backend-view, /help).
Severity: P3
Confidence: High confidence
```

```text
Finding: Three separate, hand-maintained descriptions of "what the API surface looks like" exist independently: backend-view's inline route table, developer-view's hardcoded architecture description, and /help's route table.
Evidence: app/api/backend-view/route.ts, app/api/developer-view/route.ts:12-83, app/help/page.tsx.
Why it matters: nothing enforces consistency between these three — a renamed service file or changed health-score weight will silently drift out of sync across some or all of them.
Severity: P3
Confidence: Medium confidence
```

```text
Finding: Inconsistent confirm-dialog usage within a single admin surface — app/admin/settings/page.tsx uses the shared ConfirmDeleteDialog for one action but native window.confirm() for two other destructive actions (auto-restore, restore-from-backup) in the same file; JiraConnectionsPanel.tsx uses only native confirm().
Evidence: app/admin/settings/page.tsx (both patterns present); src/components/admin/JiraConnectionsPanel.tsx.
Severity: P3
Confidence: High confidence
```

```text
Finding: coachingConfidence.service.ts and coachingTrend.service.ts are transitively dead — the former is only consumed by the already-flagged dormant coaching generator bundle (CP3-010), the latter has no caller outside its own test file at all.
Evidence: src/services/coaching/coachingConfidence.service.ts (called only from generators/*.generator.ts); src/services/coaching/coachingTrend.service.ts (no non-test caller).
Why it matters: widens the actual removal/disposition surface of the dead-coaching-bundle decision already flagged in 04-remove-merge-keep.md R-13 — these two files should be included in the same disposition, not treated as separate.
Severity: P2
Confidence: Medium confidence
```

```text
Finding: Identical avatar/icon-size raw pixel literals (32px, 36px) are hand-repeated across independent SCSS modules with no shared size token.
Evidence: src/components/dashboard/RoleColumn.module.scss, src/components/search/GlobalSearch.module.scss (32px each), src/components/dashboard/DashboardTopbar.module.scss (36px).
Severity: P3
Confidence: Medium confidence
```

### Checked and confirmed clean
- The three KPI card components (`DCKpiCard`, `KpiCard`, `MiniKpiCard`) are legitimately different implementations with distinct prop shapes and rendering strategies — not copy-paste duplication.
- Only one CSV-export helper exists (`buildSafeCsv`); `explorerExport.service.ts` correctly reuses it rather than reinventing CSV logic.
- `coachingMetricsAccess.ts`, `roleGridView.mapper.ts`, `adminSignals.service.ts`, `personaPreview.service.ts`, `relationExplorer.service.ts` all have confirmed live production callers — not dead.
- Spot-checked SCSS "duplication" on font-size/border-width values turned out to be correct token-fallback syntax (`var(--text-xs, 11px)`), not a missing-token violation.

---

## Summary

| Category | P1 | P2 | P3 |
|---|---|---|---|
| Security | 0 | 3 (SEC: middleware-per-route architecture, unauthenticated backend-view fallback, login enumeration) | 2 |
| Privacy | 2 (retention enforcement, undisclosed Azure/GCP sub-processors) | 2 (no self-service deletion, unenforced backup encryption) | 0 |
| Performance | 2 (no metrics caching layer, dashboard layout double-fetch) | 2 (unmemoized charts derivations, unoptimized avatar images) | 0 |
| Technical cleanup | 0 | 2 (6 orphaned dashboard components, transitively-dead coaching helpers) | 4 |
| Accessibility (from `09-ux-and-accessibility.md` §6) | 0 | 1 (no skip link) | 1 (latent Card.tsx a11y gap) |

**No Keep/Merge/Remove recommendation is made in this file** beyond what `04-remove-merge-keep.md` already covers; the newly-widened dead-code surface (coaching helpers, 6 dashboard components) is flagged here as evidence feeding that same disposition decision, not resolved independently.
