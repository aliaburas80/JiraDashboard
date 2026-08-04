# Delivery Clarity — Master TODO List

**Last updated:** 2026-07-19 (**STYLE-05 DONE: TIER 4 CLOSED — 12 LARGE PAGES CONVERTED, SMALL
REMAINDER FOUND ALREADY COMPLIANT** — continued the `STYLE-0x` initiative into Tier 4 (remaining
`app/**` standalone pages). Re-audited fresh: real scope was 12 large files (`sprint-kanban` 39,
`members` 32, `portfolio` 30, `glossary` 26, `delivery-mix` 23, `customer` 20, `charts` 18, `roadmap`
16, `teams` 14, `release-readiness` 13, `trends` 6 — 277 warnings) plus a ~10-file small remainder at
≤3 warnings each. Converted all 12 large files one at a time, same verification discipline as
`STYLE-03`/`STYLE-04` (typecheck/eslint/stylelint/test/build after each): finite health/verdict/
status/category enums (`HEALTH_COLOR`, `V`, `STATUS_CSS`, `CAT`, `TeamHealthBand`, etc.) replaced with
`data-*` attributes resolved in SCSS per §28. Two files (`sprint-kanban`, `portfolio`) already had
partial CSS-var-exception scaffolding from an earlier pass but were piping *colors* through it instead
of resolving them via selectors — brought in line with the rest of the codebase. `charts.tsx` and
`teams.tsx` each lean on generic, reusable chart primitives (HBar/VBar/AnimatedDonut/MiniBar/
CompareBar) that take `color` as a caller-supplied prop from several non-unifiable threshold schemes —
left untouched as the same sanctioned "generic component" exception already established for
`MiniKpiCard`, rather than forcing a one-size-fits-all vocabulary onto 8+ different classification
schemes. `release-readiness.tsx` had one fully dead component (`StatusIcon`, defined but never
rendered anywhere — confirmed via grep) — deleted rather than styled. Auditing the small remainder
was the bigger surprise: `admin/audit`, `column-mapping`, `summary`, and all 7
`landing/components/**` files were **already** using the correct, documented `--*`-only CSS-variable
exception — zero changes needed, same outcome as `key-metrics/page.tsx` in `STYLE-03`.
`promo/page.tsx`/`PromoNav.tsx`'s only warnings are unrelated `@next/next/no-img-element`, out of
scope. `work-explorer.tsx` surfaced a real gap in the tracking: 2 violations ESLint's
`react/forbid-dom-props` doesn't catch because `style=` was passed to the custom `SvgIcon` component
rather than a native DOM element (the rule only inspects host elements) — found by manually grepping
for `style=` across every "already clean" file rather than trusting the ESLint count alone. Both
fixed. Result: 277 → ~30 warnings across the 12 large files, all legitimate documented exceptions.
Repo-wide: 807 → 658 warnings, 70 → 68 files. Full detail in the `STYLE-05` row below and `CLAUDE.md`
§60.5's "Resolved 2026-07-19" note. Branch: `refactor/style-05-tier4-standalone-pages`.)

**Last updated:** 2026-07-19 (**STYLE-04 DONE: TIER 3 CLOSED — MOSTLY BY DELETING DEAD CODE, NOT
REFACTORING IT** — continued the `STYLE-0x` initiative into Tier 3 (`src/components/dashboard/**`).
Re-audited fresh rather than trusting this row's stale 160-warning/14-file figure: real scope was
94 warnings/7 files (the gap had already closed via unrelated work). Before touching any file, checked
whether each was actually imported anywhere — a lesson carried over from `ORPHAN-02` earlier this
session. It paid off: **90 of the 94 warnings lived in 4 components with zero live callers**
(`SprintThroughputPanel.tsx`, `KanbanThroughputPanel.tsx`, `MidSprintDeliveryPanel.tsx`,
`DataQualityCard.tsx` — confirmed via `grep` for both the component name and its import path; the only
hits were prose mentions in `/developer`, never JSX usage). Stopped and asked the owner rather than either
spending significant effort refactoring dead code or unilaterally deleting it — same treatment as
`ORPHAN-02`. Owner chose deletion. Verified before deleting that the underlying domain layer (types,
`throughput.service.ts`, `kanbanFlow.service.ts`, `midSprint.service.ts`) was *not* orphaned — those
remain live, consumed by `/forecast`, `/sprint-kanban`, and `SprintVelocityChart`; only the presentational
panels were dead. Of the 3 genuinely live files left (`DashboardTopbar.tsx`, `DashboardNavSidebar.tsx`,
`DashboardPageShell.tsx`), only one warning was a real violation: `DashboardTopbar.tsx`'s nav-dropdown
status dot used a `STATUS_DOT` hex lookup keyed by a fixed status union, passed through inline
`style={{background}}` — replaced with a `data-status` attribute resolved in SCSS against existing
`--color-danger`/`--color-warning`/`--color-success`/`--color-info` tokens (CLAUDE.md §28). The other two
flagged usages were already correct, documented `--*`-only CSS-variable exceptions (§14.2) — verified,
left unchanged. Also found and removed 6 stray iCloud-sync duplicate artifacts (`page.module 2.scss`
files) left over from the `STYLE-03` merge, after confirming each was byte-identical to its tracked
original. Result: 94 → 3 warnings, all 3 legitimate exceptions. Repo-wide: 898 → 807 warnings, 74 → 70
files. Full detail in the `STYLE-04` row below and `CLAUDE.md` §60.4's "Resolved 2026-07-19" note.
Branch: `refactor/style-04-tier3-orphans-and-shared-components`.)

**Last updated:** 2026-07-19 (**STYLE-03 DONE: ALL 8 TIER-2 DASHBOARD PAGES CONVERTED TO SCSS MODULES**
— with the product audit backlog fully closed, picked the next tracked item: `STYLE-03`, the
`app/dashboard/*/page.tsx` inline-style refactor tier, per owner's explicit choice over the other
remaining large initiatives (`MOBILE-*`, `QA-GATE-*`, `ARCH-*`, `ORG-*`, `FUT-JIRA-*`) when asked which
to start. Re-counted the tier fresh via `eslint -f json` rather than trusting this row's stale numbers
(which still listed a 9th file, `delivery-composition`, already merged away back on 2026-07-12) — real
scope was 8 files, 269 warnings. Converted one file at a time, verifying fully after each
(`typecheck`/`eslint`/`stylelint`/`test`/`build`) before moving to the next, matching `STYLE-02`'s
established "one file per commit" convention. Consistent pattern applied throughout: business-logic
color-picking (`HEALTH_COLORS`, `TYPE_COLORS`, per-threshold hex ternaries scattered across all 8 files)
replaced with semantic `data-*` attributes resolved in SCSS (CLAUDE.md §28), and the sanctioned
CSS-custom-property exception (§14.2) used only for genuinely runtime-computed geometry (bar widths,
conic-gradient stops, stagger delays) — never for color. Added a new `--chart-series-1..6` token set to
`src/styles/_tokens.scss` (§34) for `labels`' issue-type rotating palette, the first "categorical, not
status" chart-color tokens in the codebase. Two files needed something other than a straightforward
conversion: `key-metrics` needed *no changes at all* — its single warning was already the correct,
documented exception via the shared `barCssVars()` helper; `priority-attention` had a stale partial
conversion (SCSS classes already written but unused by parts of the page) — finished rather than
restarted. Result: 269 → 17 warnings, every one of the 17 a legitimate documented exception, not a
remaining violation — confirmed by inspecting each one, not just trusting the count. Full detail (per-file
before/after counts, branch name) in the `STYLE-03` row below and `CLAUDE.md` §60.3's "Resolved
2026-07-19" note. Repo-wide: 1,276 → 898 warnings, 87 → 74 files. Two transient CI-environment hiccups
during the run (a Jest worker SIGSEGV, a single test-suite timeout) — both confirmed non-reproducing on
re-run and unrelated to the changes, not silently ignored. Branch:
`refactor/style-03-tier2-dashboard-pages`.)

**Last updated:** 2026-07-19 (**API-SURFACE DOCS ACCURACY FIX — DRIFT WAS WORSE THAN THE ORIGINAL
FINDING SUGGESTED** — the last remaining item on the full-application product audit's backlog: "3
hand-maintained API-surface descriptions," originally rated P3/Medium-confidence and deferred as "a
separate, larger structural fix." Before implementing anything, investigated what each of the three
actually contained today rather than assuming the original rating was still accurate — it wasn't close:
**`app/api/backend-view/route.ts`'s `ENDPOINTS` array listed 17 routes; the app has 72 real
`app/api/**/route.ts` files** (confirmed via `find app/api -name route.ts | wc -l`) — most of `/api/admin/*`
(29 of 31 admin routes missing), `/api/snapshots`, `/api/trends`, `/api/notifications`, and more were
absent entirely. **`app/api/developer-view/route.ts`'s architecture block claimed "Next.js 14"** (real
baseline: 16.2.9, CLAUDE.md §4.1), **listed all four service file paths under a `lib/` prefix that hasn't
existed since before this audit** (real: `src/services/metrics/`, `src/services/jira/`,
`src/services/imports/`), and **described Health Score bands as a stale 3-tier scale** (critical/warning/
good at 50/75) **that predates the `CP3-018` unification** onto the real 5-tier, admin-configurable scale
(excellent/good/moderate/at-risk/critical at 90/75/60/40 — `src/types/thresholds.ts`
`DEFAULT_THRESHOLDS`); only `healthScoreWeights` was still accurate, verified against the real
`calculateHealthScore()` formula in `metrics.service.ts`. **`app/help/page.tsx`'s route table and two FAQ
entries** claimed the upload rate limit is per-IP (it has been per-user since the P0A-02 DB-backed
rate-limiter rewrite — `checkUploadRateLimit()` keys on `userId`, not IP), claimed `/api/health` returns
`service: "delivery-clarity-api"` (real value: `"delivery-clarity"` — looks copy-pasted from
`/api/dashboard`'s value), claimed `backend-view` shows "10 most recent" logs (real: 50), and referenced
`RATE_MAX`/`RATE_WINDOW_MS` constants that don't exist under those names in the current code. Given the
severity gap between what was found and what the original finding assumed, presented the owner two real
approaches before writing any code — correct the content now vs. build the generated single-source-of-truth
registry CLAUDE.md §10.1 itself recommends — and got an explicit decision: **correct the content now**, not
the structural fix. Implementation: rebuilt `backend-view`'s `ENDPOINTS` array from scratch (72 entries,
grouped by Auth/Account/Upload/Dashboard-data/Meta/Admin for readability) by reading every route file's
real exported HTTP methods and leading doc comment; **verified programmatically, not by spot-check** — a
Python script diffed the array's path-set and per-path method-set against a live `find` + `grep` walk of
`app/api/**/route.ts`, catching one real remaining mismatch (`admin/app-config` is `GET/PUT/POST`, not
`GET/POST` as first drafted) before it shipped. Corrected `developer-view`'s Next.js version, styling
description, all four service/type file paths, and the health-band thresholds/tier count. Corrected all
four `/help` inaccuracies. **Deliberately not done:** the generated route-registry structural fix itself —
the owner's brief was correcting content, not building new architecture; documented explicitly in both
`10-technical-cleanup.md` and `11-prioritized-backlog.md` that the "nothing enforces consistency" root
cause this finding described is unresolved and these three will drift apart again over time. No new tests
added — nothing to regression-test about static hand-written data literals beyond what typecheck/build
already catch. **Verified:** `npm run typecheck` clean; `npx eslint` on all 3 changed files 0 warnings (the
pre-existing 98 warnings in `app/help/page.tsx`, a known Tier-1 tech-debt file, confirmed byte-identical
before/after via `git stash` diff); `npx stylelint` — no SCSS touched; `npm test` 113/113 suites,
1,082/1,082 tests passing (one transient timeout in `storageSettingsPersistence.test.ts` on the first run,
confirmed unrelated to this change and non-reproducing — passed clean on `main` before this branch and
passed clean again immediately after, in isolation and in the full suite); `npm run build` compiled all
routes clean. **With this, the full-application product audit's `11-prioritized-backlog.md` has zero
genuinely open action items left** — the only remaining "still open" line (`/api/dashboard`'s unused stub)
is a closed, owner-decided won't-fix, not outstanding work. Branch:
`docs/tech10-api-surface-accuracy-fix`.)

**Last updated:** 2026-07-19 (**BUG FIX: RESTORED MISSING FILE HEADER** — the `# Delivery Clarity — Master
TODO List` title line had been accidentally dropped from this file's top during the `CP3-017` commit
(`29a03af`) two entries below — an `Edit` tool call's `old_string`/`new_string` pair evidently omitted it.
Caught while adding this entry (the file's first line was a `**Last updated:**` entry with no title above
it) and restored. No content was lost — only the one title line was missing; every dated entry below was
intact.)

**Last updated:** 2026-07-19 (**CP3-017 RESOLVED: DATA QUALITY SAMPLE-SIZE BADGE, OWNER-APPROVED
"BADGE ONLY" APPROACH** — the last genuinely open item from the full-application product audit's
prioritized backlog. `CP3-017` ("Data Quality score has no sample-size awareness — 1-of-5 missing scores
identically to 600-of-3000 missing") had been explicitly deferred twice: once when `CP3-002` landed
2026-07-13 ("a scoring-formula change, not a wiring gap... deliberately left for its own dedicated
review"), and again when the backlog-accuracy pass on this same date backfilled its tracking rather than
implementing it. Before writing any code, presented the owner two real approaches — change the score
formula itself (bigger blast radius, changes historical comparability, needs its own versioning per
CLAUDE.md §31) vs. add a confidence badge without touching the score (matches how the identical Health
Score finding, `CP3-002`, was already resolved) — and got an explicit decision: badge only. Implementation:
(1) `src/types/metricConfidence.ts` — `MetricConfidenceMap` gained a `dataQuality` entry. (2)
`src/services/metrics/metricConfidence.service.ts` — new `dataQualityConf()` calculator, genuinely
different from every other entry in the map: those measure field *completeness* (% of issues with a
required field populated), this measures raw sample *size* (total issue count) — a small dataset can have
100% field completeness and still not be a statistically meaningful sample. Thresholds exported as
`DATA_QUALITY_UNRELIABLE_SAMPLE_SIZE=10`, `_LOW_SAMPLE_SIZE=30`, `_MEDIUM_SAMPLE_SIZE=100` (engineering-
judgment defaults, documented as such in code — not derived from a formal statistical requirement).
**Deliberately computed and merged in AFTER `healthScoreConf(partial)` runs, not passed into it** — that
function loops generically over every key it receives to build its own confidence-reason text, and
`dataQuality` has no business influencing Health Score's unrelated explanation; verified this doesn't
regress via a dedicated new test (`TC-MC-19`), not just by inspection. (3)
`src/services/dataQuality/dataQuality.service.ts` — `buildSummary()` now appends a caveat sentence
("Based on only N issues — percentages may shift significantly as more data is added") below the same
30-issue threshold the badge uses (imported, not re-hardcoded, so the two can never disagree); the score
computation itself (`FIELD_CHECKS` weights, deductions, `band()` cutoffs) is byte-for-byte unchanged. (4)
Badge wired into `app/data-quality/page.tsx` (added a new `sampleConfidence` state read from
`data.confidence?.dataQuality`, alongside the page's existing `dq`/`fi` state) and
`app/dashboard/data-quality/page.tsx` (reads `metrics.confidence?.dataQuality` directly, already available
via `useDashboardMetrics()`) — both render the existing `MetricConfidenceBadge` component next to the
score's band chip, no new UI component built. **Tests:** 5 new in `metricConfidence.test.ts`
(`TC-MC-15`–`19`: Unreliable/Low/Medium/High bands at the right thresholds, contrast against a
field-completeness metric on the same small-but-complete data, and the healthScore-isolation regression),
2 new in `dataQuality.test.ts` (`TC-MC-13`/`14`: caveat appears under 30 issues, absent at/above 30 — score
itself unaffected in both). **Verified:** `npm run typecheck` clean (one real error caught and fixed along
the way — `healthScoreConf`'s parameter type needed `Omit<MetricConfidenceMap, 'healthScore' | 'dataQuality'>`
once `dataQuality` became a required map key); `npx eslint` on all 7 changed source/test files 0 warnings;
the 2 touched page files' pre-existing inline-style warning counts (`app/data-quality/page.tsx`,
`app/dashboard/data-quality/page.tsx`) confirmed byte-identical before/after via a `git stash` diff — 116
before, 116 after, 0 new; `npx stylelint` on all changed `.scss` 0 warnings; `npm test` 113/113 suites,
1,082/1,082 tests passing (up from 1,075 — the 7 new tests); `npm run build` compiled all routes clean.
**Docs:** dated resolution notes in `08-metric-dictionary.md` (`CP3-017`) and `11-prioritized-backlog.md`
(Phase 5 strikethrough); `product/ALGORITHM_SPEC.md` gained addendums under both Algorithm 9.1 (Data
Quality Score — score unchanged) and 9.2 (Metric Confidence — new `dataQuality` entry documented) rather
than rewriting either pseudocode block, since both already had pre-existing drift from the real
implementation (mismatched weights/cutoffs) that predates and is unrelated to this change — not this
task's scope to reconcile. `product/RELEASE_NOTES.md` entry added — this is user-visible (a new badge on
two pages). **With this, the full-application product audit's `11-prioritized-backlog.md` has exactly one
genuinely open item left**: the "3 hand-maintained API-surface descriptions" structural fix (Technical
debt line), explicitly flagged there as "a separate, larger structural fix," not a routine pickup — `/api/
dashboard`'s stub is a closed, owner-decided won't-fix, not open work. Branch:
`feature/cp3-017-data-quality-sample-size-badge`.)

**Last updated:** 2026-07-18 (**DUP-FLOWITEM-01 RESOLVED: CONSOLIDATED THE DUPLICATE `FlowItem` TYPE** —
picked up the one remaining self-contained item from Phase 5 tracking after the backlog-accuracy pass
above closed out everything else reachable without a bigger dedicated review (`CP3-017`, a Data Quality
scoring-formula change, was deliberately left open — same reasoning as when it was first deferred).
`src/services/metrics/metrics.service.ts` had its own private `interface FlowItem { ... }` and
`type HealthStatus = ...`, hand-synced against the real, exported versions in `src/types/metrics.ts` since
nothing enforced they matched — discovered 2026-07-13 while fixing `CP3-001`, when both needed the same
two-field addition (`fixVersion`/`blocked`) by hand. Diffed both interfaces field-by-field before touching
anything — confirmed byte-for-byte structurally identical (same 26 fields, same types, same optional
marker on `linkedTo`) — then deleted the local copy and replaced it with `import type { FlowItem,
HealthStatus } from '@/types/metrics'`. Scope was deliberately narrow: the ~15 other locally-declared
interfaces in the same file (`FlowSummary`, `SprintEntry`, `EpicEntry`, `QuarterEntry`, etc.) were left
untouched — `DUP-FLOWITEM-01` only ever named `FlowItem`, and auditing whether any of those other types
are *also* duplicated elsewhere is a different, larger investigation this task didn't do. **Verified:**
`npm run typecheck` passed with zero errors on the very first attempt after the change — meaningful
confirmation, not just a formality, since it means every one of the ~15 functions in this file that
build or consume `FlowItem` values (`getHealthFromIssue`, `summarizeFlowItems`, `buildFlowMetrics`,
`buildSprintMetrics`, `buildEpicMetrics`, etc.) was already producing values fully compatible with the
shared type; `npx eslint` on the changed file 0 warnings; `npm test` 113/113 suites, 1,075/1,075 tests
passing (same counts as before the change — as expected for a type-only edit); `npm run build` compiled
all routes clean. No behavior change, no test added (nothing to test — the runtime code is byte-identical,
only the type declaration's source moved). **Docs:** `11-prioritized-backlog.md`'s Phase 5 "Technical
debt" line updated with a strikethrough resolution note. No `product/RELEASE_NOTES.md` entry — purely an
internal type-safety fix with zero visible or computable behavior change. Branch:
`refactor/dup-flowitem-01-consolidate-flowitem-type`.)

**Last updated:** 2026-07-18 (**BACKLOG DOC ACCURACY FIX + MINIKPICARD CONFIDENCE ROLLOUT** — while
picking "next" work from `11-prioritized-backlog.md`, found Phase 1's table (the audit's 3 P0 correctness
findings — the highest severity in the whole document) had never been struck through, unlike every other
phase, even though all 3 were actually fixed and merged back on 2026-07-13 (`v4.23.0`–`v4.25.0`).
Independently re-verified each against current code before trusting the old TODO-List.md entries: `FlowItem`
has `fixVersion`/`blocked` (`CP3-001`), `computeAverageThroughput()` is shared between `/roadmap` and
`/forecast` (`CP3-008`), `DCKpiCard` has a `confidence` prop wired into `/flow-health` (`CP3-002`) — all
confirmed present. Fixed the table to match every other phase's strikethrough format. **While reading
`CP3-002`'s own original fix note, found two more promises that were never kept**: it explicitly said two
follow-up items would be added to Phase 5 ("both remain in `11-prioritized-backlog.md` Phase 5") but neither
`CP3-017` (Data Quality score sample-size awareness) nor the `MiniKpiCard` confidence-badge rollout was ever
actually added there — confirmed via grep, zero mentions of either. Also found `DUP-FLOWITEM-01` (the
duplicate `FlowItem` interface discovered during the `CP3-001` fix) was tracked only in this file's own
table further down, never surfaced in the backlog doc at all. Fixed all three: added `DUP-FLOWITEM-01` and
`CP3-017` to Phase 5 as genuinely-still-open items (no code change for either — `CP3-017` is a scoring-
formula change that needs its own dedicated review per the original note's own reasoning, not a unilateral
call), and **implemented** the `MiniKpiCard` rollout since that one was pure additive wiring, the same
low-risk pattern already proven safe by `DCKpiCard`'s 2026-07-13 fix. `MiniKpiCard`
(`src/components/dashboard/DashboardPageShell.tsx`) gained an optional `confidence?: MetricConfidence` prop
rendering the existing `MetricConfidenceBadge` next to the label (new `.miniKpiHeader` flex-row class in
`DashboardPageShell.module.scss`, no new inline styles — the component's existing `--kpi-bg`/`--kpi-border`/
`--kpi-color` CSS-variable exception was left untouched). Wired into `/summary`'s Avg Cycle Time card
(`metrics.confidence?.cycleTime`) and `/dashboard/key-metrics`'s Lead Time/Cycle Time cards
(`metrics.confidence?.leadTime`/`.cycleTime`, added via a `kpiConfidences` array aligned by index to the
page's existing `KPI_TOKENS`/`kpiValues` arrays). The other 4 KPIs on each page (Completion, Critical
Issues, Health Alerts, Active Work, Story Points, Est. Completion) were deliberately left unbadged —
`calculateMetricConfidence()` has no computed signal for those specific metrics, so badging them would mean
fabricating a value rather than surfacing a real one; this mirrors the same "only badge what has a real
signal" boundary the original `DCKpiCard` fix drew on `/flow-health`. **Docs:** dated resolution/tracking
notes added to `08-metric-dictionary.md` (`CP3-004`, listing exactly which pages/KPIs are now covered and
which aren't) and `11-prioritized-backlog.md` (Phase 1 strikethrough correction, Phase 5 additions for all
three items). **Verified:** `npm run typecheck` clean; `npx eslint` on all 4 changed `.tsx` files — 4
pre-existing inline-style warnings confirmed unchanged by diffing against a `git stash` baseline (0 new);
`npx stylelint` on the changed `.scss` file 0 warnings; `npm test` 113/113 suites, 1,075/1,075 tests
passing; `npm run build` compiled all routes clean. No dedicated new test added — this is a pure
presentational prop addition to an already-tested-elsewhere badge component, consistent with the original
`DCKpiCard` fix's own note that "no component-rendering test infrastructure exists in this codebase."
Branch: `docs/fix-phase1-strikethrough-and-minikpicard-confidence-rollout`.)

**Last updated:** 2026-07-18 (**MPE-02 FULLY CLOSED + UPLOAD/MERGE FILE-SIGNATURE FOLLOW-UP** — picked up
the last two explicitly-flagged "left out of scope" leftovers from two already-completed Phase 5 items,
both small and low-risk, matching existing patterns exactly. (1) **`/admin/system-errors` pagination** —
the 6th page named in MPE-02's evidence (`05-missing-product-elements.md`) but excluded from the
2026-07-17 pagination pass ("wasn't part of the requested scope"). Added the same shared `paginate()`
helper (`src/lib/pagination.ts`) at 25 rows/page, matching `admin/logs`/`admin/users`/`backend`'s
`AdminConsoleLayout` + `page.module.scss` pattern exactly (new `.pagination`/`.pageBtn`/`.pageInfo` classes
added to `app/admin/system-errors/page.module.scss`, copied from `admin/logs`'s). Status filter now resets
to page 1 on change. Summary stat cards (Total Logged, Unresolved, Auto-Fixed, Retried) still derive from
the full fetched array, not the paginated slice. MPE-02 is now closed on all 6 originally-named pages.
(2) **`upload/merge/route.ts` content-signature gate** — flagged as a follow-up candidate in the
2026-07-18 security-hardening resolution note (`10-technical-cleanup.md` Part 1) when `upload/route.ts`
and `retro/parse/route.ts` got `validateFileSignature()` but this route, sharing the identical
extension-only `ALLOWED_EXT` pattern, was left untouched. Wired the same gate into the per-file loop
(reuses the loop's existing `ext(name)`), rejecting with the same per-file `"File \"<name>\": ..."` message
shape this route already uses for its other per-file validation errors, so a multi-file merge upload still
identifies which specific file failed the check. No behavior change to the signature-check logic itself
(`src/lib/fileSignature.ts` untouched) — only a new call site. **Tests:** new
`src/__tests__/uploadMergeSignature.test.ts` (4 tests — binary-garbage `.csv` rejection, spoofed `.xlsx`
rejection, legitimate multi-file pass-through, correct per-file name attribution when only one of several
files fails). **Docs:** dated follow-up resolution notes added under both original findings in
`05-missing-product-elements.md` (MPE-02) and `10-technical-cleanup.md` Part 1 (file-signature); both
corresponding Phase 5 lines in `11-prioritized-backlog.md` updated to drop their "left out of scope"/"not
fixed" caveats. No `product/RELEASE_NOTES.md` entry — both changes are internal
hardening/completeness with no visible product behavior change beyond an admin page gaining pagination
controls once it exceeds 25 rows, which didn't warrant a standalone release note given the five sibling
pages already shipped identical pagination on 2026-07-17. **Verified:** `npm run typecheck` clean; `npx
eslint` on all changed `.ts`/`.tsx` files 0 warnings; `npx stylelint` on the changed `.scss` file 0
warnings; `npm test` 113/113 suites, 1,075/1,075 tests passing; `npm run build` compiled all routes
clean. Branch: `fix/upload-merge-file-signature-mpe-tail`.)

**Last updated:** 2026-07-18 (**07-IA THREE NAMING/GROUPING FINDINGS CLOSED (DATA QUALITY COLLISION,
REFERENCE GROUP SPLIT, TRENDS AMBIGUITY)** — picked up the three remaining open items under Phase 5's
"IA/naming" line in `11-prioritized-backlog.md`, all from `07-information-architecture.md`. (1)
**`/data-quality` vs `/dashboard/data-quality` naming collision (P2, the one genuinely unresolved pair)** —
read how the audit's own comparable pair, `/flow-health` vs `/dashboard/flow-health`, is already
disambiguated (`04-remove-merge-keep.md` R-03: top-nav keeps "Flow Health," the `/dashboard/*` sub-page's
title and `DashboardNavSidebar.tsx` entry both say "Flow Health Table") and applied the identical pattern —
`/data-quality` keeps plain "Data Quality" everywhere it already appears; `/dashboard/data-quality`'s
`PageHeader` title (`app/dashboard/data-quality/page.tsx`) and sidebar entry
(`DashboardNavSidebar.tsx:214`) both became "Data Quality & Composition," naming the page's actual second
section (Delivery Composition, merged in here per `CLAUDE.md` §60.3) rather than a generic qualifier. Also
updated the matching `src/lib/tour.ts` tour-step title so the product tour doesn't regress out of sync with
the header it points at — same as `/dashboard/flow-health`'s tour step already does. (2) **Reference nav
group mixes audiences (P3)** — `navigation.ts`'s `reference` group held `/members` (people directory),
`/landing` (marketing), `/glossary`+`/help` (self-serve docs), and `/developer` (admin-only technical docs)
under one label. Split into three groups: new `directory` group for `members` (still gated by the
`isSuperAdmin` flag in `getNavGroupsForRole()`, unchanged — EP-025), new `developer-tools` group for
`developer` (matches its actual access level — `roles.ts` gates `/developer` alongside `/admin`, same tier
as every `administration`-group destination — but kept out of the `administration` group itself since that
group also drives `AdminNavSidebar.tsx`'s three-section rendering via `getAdminNavSections()`, and adding a
fourth section there was judged out of scope for a naming fix), and a trimmed `reference` group left with
only `landing`/`glossary`/`help` — a genuinely coherent "self-serve product info, every role" audience.
`DC_NAV_GROUPS` goes from 6 top-level groups to 8; every route's reachability and role-gating is unchanged,
confirmed no group lost its `canAccessRoute`/`isSuperAdmin` filtering behavior in the move (`isVisible()`
keys off `item.id`, not group membership). (3) **`/trends` nav-level ambiguity (P3)** — both the top-nav and
dashboard-sidebar "Trends" entries read as the plain word "Trends"; per the finding's own recommendation,
reworded the top-nav item's `desc` in `navigation.ts` from "Upload-over-upload change" to "Cross-upload
history, not current data," explicitly contrasting against the sidebar's current-dataset framing (its
existing `meta="Sprints · quarters"` was left as-is — it already reads correctly once set beside the
reworded top-nav text). No routes added, removed, redirected, or merged in any of the three — labeling and
grouping only. **Tests:** `src/__tests__/navGroupsForRole.test.ts` TC-NAV-03/04 updated (they asserted
`developer` lived inside the `reference` group by id; now check `developer-tools`); added TC-NAV-18
(reference group holds exactly `landing`/`glossary`/`help`, no `members`/`developer`) and TC-NAV-19
(`directory`/`developer-tools` each hold exactly their one item) as regression guards for the split.
**Docs:** added dated "Resolved" notes under all three findings in `07-information-architecture.md`
(matching the file's existing resolution-note format); struck through all three Phase 5 "IA/naming" items in
`11-prioritized-backlog.md` with short resolution notes, matching the existing "Full Report" strikethrough
in the same line. Also added a short `product/RELEASE_NOTES.md` entry — nav relabeling/regrouping is
low-visibility but still something every user sees, so it gets a line even though nothing moved or was
removed. **Verified:** `npm run typecheck` clean; `npx eslint --max-warnings=0` on every changed source
file (0 new warnings on the 3 clean files; the 2 files with pre-existing `react/forbid-dom-props` debt —
`app/dashboard/data-quality/page.tsx` at 45, `DashboardNavSidebar.tsx` at 1 — confirmed unchanged
before/after via a targeted single-line revert-and-relint-and-restore, not `git stash`, after an earlier
`git stash` on the full working tree mid-lint-run timed out at the 2-minute Bash limit and needed a
`git stash pop` to recover — no data was lost, but avoid stashing the whole tree for a one-line comparison
again); `npm run test` full suite 108/108 suites, 1006/1006 tests passing (one interim run hit the same
pre-existing jest-worker SIGSEGV flakiness class documented earlier in this file — `localUpload.test.ts`
crashed the whole suite run, re-ran clean both in isolation and as part of a full clean re-run immediately
after); `npm run build` compiled all 73 routes, route count unchanged (this is a nav-registry relabel, not
a route add/remove) — this worktree had no `.env.local`, so the build was run once with ad-hoc
verification-only env values (`SESSION_SECRET`, `CONFIG_ENCRYPTION_KEY`, etc., none of them real secrets,
none committed) passed inline on the command, matching `.env.example`'s documented required set; not a
repo change. Branch: `fix/07-ia-naming-collisions-and-grouping`.)

**Last updated:** 2026-07-17 (**PHASE 5 VERIFICATION SWEEP + THREE QUICK WINS (MPE-04, MPE-06, CP3-020)** —
User said "do next" with no specific item named, moving into the Phase 5 P2/P3 polish backlog (no forced
order, per `11-prioritized-backlog.md`). Given the previous round's discovery that documented "still open"
findings had actually been silently fixed before this session's visibility (Card.tsx, the two dead coaching
services), ran a full `Explore` agent verification pass across **every** Phase 5 item before picking
anything to work on, rather than guessing item-by-item again. Result: **8 more items were already done**
(never struck through in the backlog doc) — "Full Report" nav description (commit `c5c2506`), admin
confirm-dialog consistency (commit `1089f26`), avatar-size tokenization (commit `3b4c75b`),
`orphanRelation.service.ts` deletion (commit `80b3c2a`), CP3-013's ceremony-caveat finding resolved by
outright file deletion rather than staying "moot," plus Phase 2's caching fix and 4 other Phase 2 items that
had never been struck through at all despite being done. Corrected all of this in
`11-prioritized-backlog.md` (Phase 2 table + Phase 5 paragraphs) so the doc reflects 2026-07-17 reality, not
just the original audit date. **Then executed three of the genuinely-still-open items:** (1) **MPE-06** —
`app/verify-email/page.tsx`'s "contact support" text is now a real `mailto:ali.aburas@deliveryclarity.app`
link (pre-filled subject), reusing the support address already used consistently across
`src/lib/legal-i18n/en.ts`, not inventing a new contact channel. (2) **MPE-04** —
`app/admin/system-errors/page.tsx`'s "Dismiss" action now goes through `ConfirmDeleteDialog` (`danger={false}`,
since marking an error resolved isn't destructive — the record stays in the log), matching the pattern
`/snapshots` and `/backend` already use; this closes the exact inconsistency the finding named. (3)
**CP3-020** — `app/trends/page.tsx` now calls the previously-dead `releaseConfidenceBand()` instead of
reimplementing its 80/60/40 cutoffs inline as a color ternary; mapped the returned band to the same 3 colors
via a small local lookup, so the visual output is byte-identical to before — pure dead-code elimination, zero
user-visible change. **Process note:** ran `npx prettier --write` on the three changed files mid-task to fix
minor indentation from the `ConfirmDeleteDialog` JSX insertion — this project has no `prettier` devDependency,
no config, and no `format:check` script, so `npx` silently fetched an unpinned latest version and reformatted
each file to its own defaults (double quotes, full-file re-wrap), producing a huge unwanted diff against the
project's actual single-quote style. Caught it before committing, `git checkout --` the three files, and
redid all three edits by hand instead — do not run `prettier` in this repo again unless it's added as a real,
pinned devDependency with a project `.prettierrc` first. Verified (after the redo): `npm run typecheck`
clean; `npx eslint` on the 3 changed files unchanged at 6 warnings (0 new, confirmed via `git stash`
comparison); `npm run build` compiled all 64 routes; `npm run test` 108/108 suites, 1004/1004 tests passing
(one interim run showed 3 failures in `adminUsers.test.ts`, immediately re-ran clean — same pre-existing
worker-flakiness class documented earlier in this file). `product/RELEASE_NOTES.md` entry added for MPE-04 +
MPE-06 (user-visible); no entry for CP3-020 (no visible change). Branch: `fix/phase5-mpe04-mpe06-cp3-020`.)

**Last updated:** 2026-07-15 (**09-ux §4: CLOSE OUT THE SILENT-REDIRECT / CONFLATED-ERROR FINDING** — the
last remaining item from the previous round's Phase 3 sweep; wasn't decided alongside the other four
because the "next" prompt moved on before I'd cross-checked the full backlog table against it. Investigated
before writing any code: found this finding was already **partially** fixed on 2026-07-13
(`fix(ux): distinguish a failed data load from "no data uploaded"`, predating this session's visibility) —
`src/lib/loadErrorSignal.ts`'s `redirectWithLoadError()`/`consumeLoadErrorSignal()` pair was already wired
into 11 routes plus all 9 `/dashboard/*` children via `app/dashboard/layout.tsx`'s shared
`DashboardMetricsContext`, and `/column-mapping` (the audit's cited worst case) already had its own distinct
on-page `loadError` state. Also confirmed, while verifying this, that the separate Phase 2 `PERF` caching
finding (`loadMetricsWithSource()` not shared across `/dashboard/*`'s 9 children) was resolved as a side
effect of that same context — and that all 5 Phase 2 items are in fact already done (`R-11`'s stale
`page 2.tsx`, the skip-link, the `/readiness` redirect, and the login-enumeration fix all confirmed present
in current code) — `11-prioritized-backlog.md`'s Phase 2 table had never been struck through to reflect
this, corrected it as part of this pass. Cross-referenced all 16 routes calling `loadMetricsWithSource()`
directly against the `redirectWithLoadError()` caller list and found exactly 3 gaps: `app/teams/page.tsx`,
`app/portfolio/page.tsx`, `app/roadmap/page.tsx` — all three still had `.catch(() => setNoData(true))`,
conflating a fetch failure with the genuine empty state. `app/roadmap/page.tsx` was worse than the audit's
own cited worst case: on a real fetch error it actively told the user "No data uploaded yet," sending them
toward re-uploading when that wouldn't fix anything. Fixed all three following `/column-mapping`'s
established pattern — a distinct `loadError` boolean, its own on-page message/icon, no redirect (matching
each page's existing behavior of staying on-page rather than navigating away on empty data). `/explore` was
independently confirmed to already handle this correctly (per the audit's own note) and needed no change.
Also found and removed `src/__tests__/getHealthBand.test 2.ts`, a byte-identical stray file from this
session's known iCloud Drive sync-conflict behavior — confirmed identical via `diff` before deleting.
Verified: `npm run typecheck` clean; `npx eslint` on the 3 changed files unchanged at 60 warnings (0 new,
confirmed via `git stash` comparison against the pre-edit baseline — all pre-existing inline-style tech
debt); `npm run build` compiled all 64 routes; `npm run test` 108/108 suites, 1004/1004 tests passing (one
earlier run showed a 1-test failure in `adminUsers.test.ts`, immediately re-ran clean — the same pre-existing
worker-flakiness class documented earlier in this file, not caused by this change). `product/RELEASE_NOTES.md`
entry added (user-visible: distinct error message on 3 pages). Branch:
`fix/09-ux-silent-redirect-teams-portfolio-roadmap`.)

**Last updated:** 2026-07-14 (**CP3-018: EXTEND `thresholds.service.ts` FOR HEALTH SCORE BANDS (PARTIAL —
SCOPE BOUNDARY DOCUMENTED)** — Third of four Phase 3 items decided this round
(`docs/product-audit/11-prioritized-backlog.md`). Owner picked the full-migration option ("extend
thresholds.service.ts to be genuinely the source of truth... migrate the 12 hardcoded spots"). Investigated
all ~14 sites the audit named (research surfaced one more than the audit's original 12) before writing any
code, which surfaced two things that changed the shape of this fix: (1) the sites split into 5 genuinely
distinct metric families — Health Score band (7+ sites, the dominant duplication), Portfolio "At Risk,"
sprint-goal outcome, capacity overload, and a confidence-band family — not one duplicated concept; (2) every
current consumer of the Health Score band is a **client component**; `calculateHealthScore()` itself never
classifies a band server-side, it only returns a raw 0-100 number, so "wire live admin thresholds all the
way through" would mean adding a new client-side fetch to 6+ components (dashboard chrome, admin pages,
browser-side xlsx/PDF export generators that run via dynamic `import()`, not a server route) — a materially
bigger and riskier change than a single schema extension. **Scoped this pass to the Health Score band** (the
audit's own headline complaint and the largest chunk of the 12 sites); the other 4 families are separate,
already-tracked audit findings (Portfolio band, CP3-021/releaseConfidence, throughput.service.ts,
roleGridView.mapper.ts) not decided this round, left untouched. Added `healthScoreExcellentPct/GoodPct/
FairPct/WeakPct` (defaults 90/75/60/40) to `HealthThresholds` (`src/types/thresholds.ts`) + a new "Health
Score Bands" group in `HealthThresholdSettings.tsx` + strictly-descending-order validation in
`app/api/admin/thresholds/route.ts` (mirroring the existing warning-must-be-less-than-critical pattern for
the other 5 field groups). Parameterized `getHealthBand(score, thresholds?)` in `src/lib/utils.ts` with a
default of `DEFAULT_THRESHOLDS`, keeping every existing single-argument call site working unchanged.
Migrated every duplicate reimplementation found onto this one function: `DashboardNavSidebar.tsx`,
`recommendationEngine.ts`, and `excelInsightExport.service.ts` — the last of these had not one but **three**
separate local reimplementations of the identical band logic in one file (a `getHealthBand()` call whose
result was ignored four lines later by a re-derived inline ternary, plus a third near-identical local
`bandLabel` map further down — all three consolidated to one call + one shared `HEALTH_BAND_INTERPRETATION`
map). `app/admin/logs/page.tsx` and `app/backend/page.tsx` had their own divergent `>80/60/40` cutoff
(instead of the standard `>=90/75/60/40` used everywhere else) — migrating them is a genuine, minor,
admin-visible bug fix: scores 75-80 now correctly render the "good" green chip instead of an "at-risk" amber
one, consistent with the rest of the app. `DashboardSidebarNav.tsx` was confirmed unmounted dead code
(zero route imports it) and deliberately left untouched rather than "fixed" for no live benefit — flagged
alongside the existing `ORPHAN-02` disposition question rather than silently edited or silently ignored.
Updated `/developer`'s `HealthBand` doc sample and `/glossary`'s Health band table description to state the
cutoffs are defaults, admin-configurable in Settings. Added `src/__tests__/getHealthBand.test.ts` (8 new
tests, default + custom-threshold reclassification cases) and extended `thresholds.test.ts` for the 4 new
fields (field count 9→13). Verified: `npm run typecheck` clean; `npm run lint` on all changed files 0
warnings (one pre-existing unrelated warning in `DashboardNavSidebar.tsx` confirmed present on `main` before
this change, at the same relative position, via `git stash`); `npm run build` compiled all 64 routes; `npm
run test` 108/108 suites, 1004/1004 tests passing (996 baseline + 8 new). `product/RELEASE_NOTES.md` entry
added (admin-visible: new settings section + the chip-color fix). Branch:
`refactor/cp3-018-health-score-band-thresholds`.)

**Last updated:** 2026-07-14 (**CP3-014/015: UNIFY ORPHAN DEFINITIONS, REMOVE DEAD THRESHOLD FIELDS** —
Second of four Phase 3 items decided this round (`docs/product-audit/11-prioritized-backlog.md`). Verified
all three "orphan" definitions the audit named before changing anything: `dataQuality.service.ts:185` used
a hardcoded `!hasValue('Epic Link') && !hasValue('Parent Key')` check that completely ignored the admin's
Orphan Rules config; `metrics.service.ts:541` already called the canonical, admin-configurable
`isOrphanByRules(issue, readOrphanRules())`, feeding `FlowItem.isOrphan` and the health-score orphan ratio
across 5+ dashboards; `hierarchy.service.ts:158-177` used a third, structural OR-based definition for
`/explore`'s tree. **Owner decision: unify + remove dead fields.** Traced `hierarchy.service.ts`'s definition
carefully before deciding whether to collapse it too — confirmed its live caller (`/explore` via
`relationExplorer.service.ts:312`, fed `metrics.flow.items`) always has the precomputed `isOrphan` flag
available, but the structural fallback (`!map.parent.has(key) && !map.epic.has(key)`) still serves a real,
distinct purpose: an issue whose Epic Link points to an epic excluded from the current upload has a field
value (so `isOrphanByRules` says "not an orphan") but the hierarchy tree still can't connect it to anything,
so it must render as unlinked. Collapsing this into the rules-based definition would have broken that
dangling-link case in the tree view — kept it, but added an in-code comment explaining why it deliberately
diverges (CP3-014 in the comment) instead of leaving it looking like unreconciled duplicate logic. Changed
`calculateDataQuality()` (`src/services/dataQuality/dataQuality.service.ts`) to take an optional `orphanRules`
parameter (default `DEFAULT_ORPHAN_RULES`, keeping it a pure, directly-unit-testable function rather than
giving it its own filesystem read) and call `isOrphanByRules()` for the orphan-ratio numerator;
`metrics.service.ts`'s one call site now passes `readOrphanRules()` through explicitly. Added
`TC-DQ-13` demonstrating a custom `parentLinkFields` rule now changes the Data Quality score exactly as it
already changed the health-score orphan count. **CP3-015**: removed `riskThresholdCount`/`riskThresholdPct`
entirely — from `OrphanRules` (`src/types/orphanRules.ts`), the "Risk thresholds" input grid in
`OrphanRulesSettings.tsx`, the display-only tile in `adminConsole.ts` (`case 'orphan'`, 4th tile), and the
one dead assertion pair in `orphanRules.test.ts`'s `TC-OR-10` — grep confirmed zero calculation ever read
either field before deleting. Verified: `npm run typecheck` clean; `npm run lint` on changed files 0
warnings; `npm run build` compiled all 64 routes; `npm run test` 107/107 suites, 996/996 tests passing (995
baseline + 1 new). `product/RELEASE_NOTES.md` entry added (admin-visible: two settings fields removed,
orphan count now consistent). Branch: `refactor/cp3-014-015-unify-orphan-definitions`.)

**Last updated:** 2026-07-14 (**MPE-05: WIRE `exportImportLogsWorkbook` TO A REAL BUTTON** — First of
four Phase 3 items decided this round (`docs/product-audit/11-prioritized-backlog.md`). `/developer`
documented `exportImportLogsWorkbook(logs)` as a live, callable export, but it had zero call sites outside
its own test — confirmed via `grep -rn "exportImportLogsWorkbook" app src` before touching anything.
**Owner decision: wire it up rather than remove the doc claim.** Investigation found the existing function
can't actually serve `/backend`'s live table as-is: it only handles the nested, file-based fallback log
shape (`data/import-logs.json`, used only when there's no session), while `/backend`'s authenticated table
reads flat Prisma `ImportLog` records via `/api/backend-view`/`/api/imports` — a genuinely different shape
(no nested `file`/`extraction`/`statistics`, just `fileName`/`rowCount`/`healthScore`/`totalIssues`).
Rather than force one function to handle two shapes via `any`, added a second function,
`exportImportLogRecordsWorkbook()`, alongside the original in
`src/services/imports/importLogs.service.ts`. Added `GET /api/imports/export`
(`app/api/imports/export/route.ts`), scoped identically to the existing `GET /api/imports` (same session,
workspace, and `canViewAllImportData`/`?all=true` admin-bypass logic — copied deliberately rather than
abstracted, since `/api/imports` already established the correct auth pattern and this is exactly Rule-of-
Three territory: two call sites sharing scoping logic is not yet a "genuine reuse case" per CLAUDE.md
§5.4). Added an "Export logs" button in `app/backend/page.tsx`'s Import Logs section header (next to the
existing "Delete all my logs" button, same download-via-blob pattern already used by
`BackupRestoreSettings.tsx`'s "Download Backup" button). Corrected `/developer`'s service-function table to
document both functions accurately, including which one only serves the unauthenticated fallback path.
Added CSV/formula-injection safety tests (`TC-SEC-CSV-12`/`13`) for the new function in
`src/__tests__/importLogsExportSafety.test.ts`, mirroring the existing pattern for the original function.
Verified: `npm run typecheck` clean (one fix needed — `Buffer` isn't directly assignable to `BodyInit`
under this TS/DOM lib version, resolved with `new Uint8Array(buffer)`); `npm run lint` unchanged at 1,213
(0 new — all reported warnings are `app/developer/page.tsx`'s pre-existing Tier-1 inline-style tech debt,
§60.2); `npx stylelint app/backend/page.module.scss` clean; `npm run build` compiled all 64 routes plus the
new `ƒ /api/imports/export` route; `npm run test` 107/107 suites, 995/995 tests passing (993 baseline + 2
new). `product/RELEASE_NOTES.md` entry added (user-facing button). Branch:
`feature/mpe-05-wire-export-import-logs-button`.)

**Last updated:** 2026-07-14 (**LEGAL: FIX UNENFORCED DATA-RETENTION CLAIM; SUB-PROCESSOR DISCLOSURE
CONFIRMED CURRENT** — First two of Phase 3's remaining product/legal decisions
(`docs/product-audit/11-prioritized-backlog.md`). **Retention windows**: `/privacy`'s "Data retention"
section states specific windows (e.g. "audit events: 12 months," "error records: 90 days") as if
systematically enforced. Verified the underlying code before touching the copy:
`src/services/settings/dataRetention.service.ts`'s `applyRetentionPolicy()` only handles `ImportLog` and
`DashboardSnapshot` — nothing for `AuditEvent`/`SystemErrorLog`/`AppError`/login attempts/consent
records — and its only caller, `app/api/admin/cleanup/route.ts`, is a manual admin-triggered endpoint;
confirmed no cron/scheduler exists anywhere in the repo (`securityCheck.service.ts`'s one "cron" mention
is just backup advice text, not an actual scheduler). **Owner decision: correct the copy, don't build
enforcement.** Added one new disclosure paragraph after the retention list, in **all 7 languages**
(`en`/`ar`/`fr`/`ru`/`ja`/`ko`/`nl` — this section previously read identically across all 7, so this
wasn't a partial-language fix like the earlier self-service-deletion claim): states the listed periods
are targets, that only Jira import data and dashboard snapshots have any deletion tooling today (and it's
admin-triggered, not scheduled), and that the other categories don't yet have dedicated deletion tooling.
Each translation reused established terminology already present in that language's file (e.g. Japanese
uses "システム管理者," system administrator, deliberately distinct from the existing GDPR "データ管理者,"
data controller, term used elsewhere in the same document, to avoid conflating two different meanings of
"administrator"). **Sub-processor disclosure**: `/privacy` names only AWS S3 as a cloud sub-processor,
but the codebase fully implements Azure and GCP storage providers usable for the same purpose — a gap
this audit flagged as urgent *if* either is actually enabled for a live deployment, which code alone
couldn't determine. **Owner confirmed: S3-only in practice today.** No disclosure gap exists currently,
so no policy text was changed — documented the confirmation directly in
`docs/product-audit/10-technical-cleanup.md`'s finding, with an explicit note that `/privacy` must be
updated if Azure or GCP is ever actually enabled, not after the fact. Verified: `npm run typecheck`
clean; `npm run lint` unchanged at 1,213 (0 new); `npm run build` compiled all 64 routes; `npm run test`
107/107 suites, 993/993 tests passing (no test covers legal copy content). No `product/RELEASE_NOTES.md`
entry for the sub-processor item (no change made); a brief entry added for the retention-copy fix since
it's user-visible policy text. Branch: `docs/fix-privacy-retention-window-claims`.)

**Last updated:** 2026-07-14 (**REMOVE: NON-NEXT.JS ORPHAN TREES `frontend/`/`backend/`/`promotion/`
(`ORPHAN-01`, R-10)** — Executes the sixth and final of six Phase 4 product decisions
(`docs/product-audit/11-prioritized-backlog.md`): three git-tracked, non-Next.js directory trees, all
confirmed unreferenced by the live app, `render.yaml`, `docker-compose.yml`, or any CI config (re-verified
here before deleting, in addition to the audit's own original check) — `frontend/` (a second, standalone
Create React App, own `package.json`/`node_modules`/`build`/`react-scripts`, last touched 2026-05-30),
`backend/` (a second, separate Express API server with its own `express`/`multer`/`cors` dependencies,
discovered during the same audit, never previously tracked in `TODO-List.md`), and `promotion/` (static
marketing screenshots + a zip archive, unrelated to the live `app/promo/` route). The audit's own R-10
recommendation deliberately stopped short of recommending deletion — "unused in the live app" isn't the
same as "safe to delete" without an explicit owner decision, since an external deployment or doc this
audit has no visibility into could still depend on one. **That owner decision was made directly by the
project owner** (not inferred or assumed): remove all three. Before deleting, checked what `git rm -r`
alone would and wouldn't clean up: all three directories had gitignored, untracked bulk beyond their
35 git-tracked files — `frontend/node_modules/`, `frontend/build/`, `backend/node_modules/`, and
`backend/data/import-logs.json` (a 1.1MB stale local test-data file for the dead Express server, last
touched May 30 — checked its contents before removing to confirm it wasn't anything resembling live
production data, which lives in Neon Postgres + S3, not a local JSON file in an abandoned parallel
backend). Removed all of it — both the 35 tracked files (`git rm`) and the untracked bulk (`rm -rf`) —
so no orphaned, disk-consuming remnants are left behind. **Side effect**: removing `frontend/` also
resolved the 59-warning lint-scope mismatch CLAUDE.md §60.6 had tracked since the last audit (root ESLint
was unintentionally reaching into a project with no Next.js-relevant lint config) — `npm run lint` dropped
from 1,272 to **1,213 warnings, 0 errors**, not because any warning was fixed, but because the files
producing them no longer exist. Updated `CLAUDE.md` §60.6 (marked resolved, historical framing preserved)
and `TODO-List.md`'s `ORPHAN-01` row to Done — `ORPHAN-02` (`DashboardSectionSwitcher.tsx`/
`LayoutBuilderPanel.tsx`) is a separate, still-undecided item, not touched. Verified: `npm run typecheck`
clean; `npm run lint` **1,213 (down 59, 0 new)**; `npx stylelint` clean; `npm run build` compiled all 64
routes; `npm run test` 107/107 suites, 993/993 tests passing (unchanged — nothing tested these
directories). No `product/RELEASE_NOTES.md` entry — none of the three trees were ever reachable from the
live product. Branch: `remove/orphan-non-nextjs-trees-r10`.)

**This closes all six Phase 4 product decisions** approved this session: R-12 (dead selector family,
removed), §C (sidebar role-hiding, documented as intentional), PRIV (self-service deletion claim,
corrected), R-06 (`/charts` widget, trimmed), R-13/R-14 (coaching bundle, removed), R-10 (orphan trees,
removed).

**Last updated:** 2026-07-14 (**REMOVE: DORMANT ROLE-BASED COACHING BUNDLE (`ORPHAN-03`, R-13/R-14)** —
Executes the fifth of six Phase 4 product decisions: the audit flagged a large (~1,300 line), fully-tested
subsystem — 7 role generators + an orchestrator + an admin-signals service/API route, superseded same-day
by the now-live `/dashboard/coaching` Team Role View — and explicitly recommended a product decision on
reactivation before removal, since deleting fully-tested code that worked days before the audit began
would be reckless without confirming it isn't roadmapped. **Decision: not on the roadmap, remove it.**
Before deleting anything, traced the full live/dead boundary precisely rather than trusting the finding's
file list at face value: confirmed `/dashboard/coaching`'s actual imports (`roleGridView.mapper.ts` →
`coachingMetricsAccess.ts`) to establish exactly what must stay, then grepped every candidate file's real
callers individually. This surfaced 2 files not explicitly named in the original R-13 finding but
transitively dead all the same — `coachingEvidenceLink.ts` and `coachingBadge.ts` — both only ever
imported by the dormant bundle itself. Cross-referenced the resulting 20-file list against two documents
that had already independently reached the identical conclusion during unrelated prior work:
`product/SRS.md`'s "Orphaned subsystem — flagged, not deleted" note and `TODO-List.md`'s own `ORPHAN-03`
tracked-item table row — both already named the exact same file set (1,306 total lines, matching the
audit's "~1,300 lines" estimate). Removed: `coachingOrchestrator.service.ts`, `adminSignals.service.ts`,
`ceremonyAdvice.service.ts`, `coachingConfidence.service.ts`, `coachingTrend.service.ts`, all 7 files under
`generators/`, `app/api/coaching/admin-signals/route.ts` (zero frontend callers — confirmed no fetch to
this endpoint anywhere in `app/`/`src/`), `coachingEvidenceLink.ts`, `coachingBadge.ts`,
`roleBasedCoaching.ts` (the dormant bundle's own type file, entirely separate from the live
`roleGridCoaching.ts` types), and their 3 dedicated test files (`roleBasedCoaching.test.ts`,
`coachingTrend.test.ts`, `coachingEvidenceLink.test.ts`). **Bundled in the same disposition, per
`04-remove-merge-keep.md` R-14's own instruction** ("these two files should be included in the same
disposition, not treated as separate"): `src/services/relations/orphanRelation.service.ts` (80 lines,
`detectOrphans()`/`OrphanReport`/`OrphanClassification` — a fully separate dead function discovered in
Checkpoint 5, unrelated to the coaching bundle other than sharing this decision point) — its only
in-repo reference was an unused import in the live `relationExplorer.service.ts` (`detectOrphans`
imported but never actually called), which was removed alongside it. Left 6 harmless comments in the
live `roleGridView.mapper.ts` referencing the deleted generator files by name for historical attribution
(e.g. "same threshold used in scrumMaster.generator.ts") — factually accurate as history, not touched,
since rewriting them wasn't necessary for correctness and risked unrelated scope creep. Updated
`TODO-List.md`'s `ORPHAN-03` row to Done and `product/SRS.md`'s orphaned-subsystem note to reflect
removal (not shown separately — doc updates folded into this same branch). Verified: `npm run typecheck`
clean (one stale `.next-jira-dashboard/types` shim referencing the deleted API route needed a fresh
`npm run build` to regenerate before typecheck passed — expected cache staleness after deleting a route,
not an error); `npm run lint` unchanged at 1,272 (0 new — none of the 20 deleted files were React
components); `npm run build` compiled all 64 remaining routes (confirmed `/api/coaching/admin-signals`
no longer appears in the route table); `npm run test` **107/107 suites (down 3), 993/993 tests (down
25)** — both reductions expected and correct, matching the deleted test files, not a coverage regression.
No `product/RELEASE_NOTES.md` entry — the API route had zero frontend callers, so no user-facing behavior
changed. Branch: `remove/dormant-coaching-bundle-r13-r14`.)

**Last updated:** 2026-07-14 (**FIX: TRIM `/charts` "ISSUE TYPES" WIDGET, LINK OUT TO `/delivery-mix` (R-06)**
— Executes the fourth of six Phase 4 product decisions (`docs/product-audit/04-remove-merge-keep.md`
R-06): `/delivery-mix` is a strict content superset of `/charts`' "Issue Types" widget — confirmed by
reading both (`/delivery-mix` additionally breaks each type down by Count/Done/Completion/Health
split/Story Points/Avg Cycle/Avg Lead, none of which `/charts`' plain donut showed). The audit's own
confidence on this one was only Medium, specifically because it hadn't verified whether trimming the
widget could break a user's saved widget-visibility/span customization — **did that verification first,
as instructed**: read `src/lib/chartCustomizer.ts`'s `getChartPrefs()` and confirmed it already handles
this exact scenario by design — on load, it filters saved preferences against the current
`CHART_REGISTRY` and silently drops any id no longer present (`saved.filter(p => validIds.has(p.id))`),
with no error and no orphaned state. Removing or changing a widget's content, unlike removing its
`CHART_REGISTRY` entry entirely, doesn't even touch this path — the `'types'` id stays registered, only
its rendered body changed. So this was safe regardless. Fix: replaced the full type-by-type `DonutBlock`
(the actual duplicated content) with the top 3 types by volume as compact horizontal bars (`HBar`,
matching the visual language already used by 3 other widgets on this same page — Team Load, Kanban
Status Flow, Label Distribution — rather than introducing a new visual pattern), plus a
`View full breakdown on Delivery Mix →` link. Added a new `.widgetLinkOut` class to
`app/charts/page.module.scss` (token-based colors/focus-ring, no inline styles) since no existing style
in this module fit an inline text link; used a real `next/link` `<Link>` for the navigation (a genuine
page transition, not a click-handler-driven `router.push`, per CLAUDE.md §26.1's semantic-element
preference). Updated the widget's `desc` text to match the new content. `DonutBlock` itself is untouched
and still used by the other 4 donut widgets on this page. Verified: `npm run typecheck` clean; `npm run
lint` unchanged at 1,272 (0 new — used a proper SCSS class, no inline styles added); `npx stylelint`
clean; `npm run build` compiled all 64 routes; `npm run test` 110/110 suites, 1,018/1,018 tests passing
(no test covers this page's rendered widget content, so nothing needed updating). **Manual browser
verification not performed** — no browser automation tool available in this environment; this is a real
rendered-content change on a live page, unlike this session's earlier `/charts` memoization fix (which
was output-identical by construction). Branch: `fix/charts-issue-types-widget-link-out-r06`.)

**Last updated:** 2026-07-14 (**LEGAL: FIX OVERSTATED SELF-SERVICE ACCOUNT-DELETION CLAIM** — Executes the
third of six Phase 4 product decisions (`docs/product-audit/11-prioritized-backlog.md`): the audit's
finding (`10-technical-cleanup.md` Part 4) — "there is no self-service account-deletion feature anywhere
in the app, despite /terms directing users who disagree with the terms to 'request account deletion' as
if it were a supported self-service action with an implied SLA" (grep-confirmed: the only code path that
deletes a User row is the admin-only `DELETE /api/admin/users` route). **Decision: correct the copy, don't
build the feature** — a real self-service deletion flow (data export, confirmation, cascading S3/DB
cleanup) is a proper feature project, not a quick fix. Since `/terms` and `/privacy` content lives in
`src/lib/legal-i18n/{en,ar,fr,ru,ja,ko,nl}.ts` (7 languages, not just the English page — per this repo's
own established i18n-parity discipline), checked all 7 for the exact claim before fixing anything: found
it in **`en.ts` (twice — the Terms "Changes to Terms" clause AND the separate Privacy "Changes to this
policy" clause, both ending "...you must stop using the Service and request account deletion") and
`ar.ts` (once — only in the Privacy clause; the Arabic Terms clause never had this sentence at all)**.
The other 5 languages (`fr`/`ru`/`ja`/`ko`/`nl`) never included this sentence in either clause — a
pre-existing translation-completeness gap between `en.ts` and the others, unrelated to this fix, not
touched here. Fix: changed "request account deletion" → "contact us to request deletion of your account"
in all 3 confirmed locations — makes explicit this is a contact-based request, not an automatic/instant
self-service action, matching the phrasing already correctly used elsewhere in the same policy for GDPR
Article 17 ("Right to erasure... please contact us... we will respond within one month"). The Arabic
correction ("والتواصل معنا لطلب حذف حسابك") reuses "التواصل معنا" ("contact us"), the exact phrase already
used consistently 6 other times throughout `ar.ts`, for terminology consistency rather than introducing a
new phrasing. **Explicitly out of scope**: `/privacy`'s separate "Data retention" table (12-month/90-day/
30-day windows) — that's a different, still-undecided Phase 3 finding (whether retention periods are
enforced by automation vs. corrected as copy), not part of what was approved in this round; not touched.
Verified: `npm run typecheck` clean; `npm run lint` unchanged at 1,272 (0 new); `npm run build` compiled
all 64 routes; `npm run test` 110/110 suites, 1,018/1,018 tests (no test covers legal copy content, so no
test changes needed). Branch: `docs/fix-terms-self-service-deletion-claim`.)

**Last updated:** 2026-07-14 (**DOCS: `/dashboard/*` SIDEBAR ROLE-HIDING IS UI CURATION, NOT ENFORCEMENT
(§C)** — Executes the second of six Phase 4 product decisions (`docs/product-audit/11-prioritized-
backlog.md`), user-approved via explicit choice between two options. The audit's dominant Checkpoint 4
finding (`06-role-based-review.md` §C): `DashboardNavSidebar.tsx`'s `ROUTE_ACCESS` registry hides sidebar
links per role, but every one of the 9 gated `/dashboard/*` sub-pages is fully reachable and renders
identically by direct URL for any authenticated role — confirmed not a security issue (every role already
sees the same `DashboardMetrics` dataset app-wide; re-verified here by grepping `app/dashboard/labels/
page.tsx`, one of the more tightly-gated pages, for any role check — found none), but a product-consistency
question: was the hiding meant to be a real boundary, or pure relevance curation? **Decision: pure UI
curation — no server-side enforcement will be added.** Added a 7-line comment directly above `ROUTE_ACCESS`
in `src/components/dashboard/DashboardNavSidebar.tsx` stating this explicitly, so a future engineer
doesn't mistake the registry for an access control the way this audit initially had to investigate to rule
out. Added a "Resolved" note to `06-role-based-review.md` §C and struck through the now-decided rows in
`11-prioritized-backlog.md`'s Phase 4 table (both R-12 from the prior entry and this §C item), rather than
deleting the original finding text — preserves the audit's evidence trail while making clear these are no
longer open decisions. Zero behavior change — comment-only. Verified: `npm run typecheck` clean; `npm run
lint` unchanged at 1,272 (0 new); `npm run build` compiled all 64 routes; `npm run test` 110/110 suites,
1,018/1,018 tests passing. Branch: `docs/document-dashboard-sidebar-role-hiding-intent`.)

**Last updated:** 2026-07-14 (**REMOVE: DEAD `DashboardViewSelector` FAMILY (R-12)** — Executes the
Phase 4 decision (`docs/product-audit/04-remove-merge-keep.md` R-12), user-approved after the audit's own
required final pre-deletion grep check. That check widened the confirmed-dead surface well beyond the
audit's original finding (`DashboardViewSelector.tsx` + 3 `roles.ts` functions): tracing every consumer
transitively revealed the **entire** `dashboardView` feature was dead, not just the selector component —
`src/lib/dashboardView.ts` (5 exported functions: `getSavedViewId`/`getInitialViewId`/`saveViewId`/
`getView`/`isTierHidden`) turned out to have **zero non-test importers** either, meaning
`defaultDashboardViewForRole`/`isDashboardViewLockedForRole` in `roles.ts` were only ever called from
within that already-dead module — not "used, just not through the selector" as the original finding's
narrower framing might have implied. Removed: `src/components/dashboard/DashboardViewSelector.tsx`,
`src/lib/dashboardView.ts`, `src/types/dashboardView.ts` (the `ViewId`/`DashboardView`/`DASHBOARD_VIEWS`/
`DEFAULT_VIEW_ID` types + the 5-view config data, itself only consumed by the two files above), and
`src/__tests__/dashboardView.test.ts` (TC-DV-01–10, existed solely to test the now-deleted module — not a
coverage loss, since the code it covered no longer exists). In `src/lib/roles.ts`: removed
`defaultDashboardViewForRole`/`isDashboardViewLockedForRole`/`allowedDashboardViewsForRole` and the now-
unused `import type { ViewId }`. In `src/__tests__/roles.test.ts`: removed the two test blocks exercising
those three functions and trimmed the import list — the file's other 5 tests (route-matrix, role-labels,
import-visibility, fallback-route) are untouched. Verified via repo-wide grep for every removed symbol
name before and after editing — zero remaining references. Verified: `npm run typecheck` clean (after
retrying past two transient iCloud-Drive file-eviction glitches — `ls` confirmed the flagged files
genuinely existed on disk both times; this environment's `.next-jira-dashboard` and `node_modules` reads
have intermittently failed with "file not found"/`ETIMEDOUT` all session, a known characteristic of this
repo living on iCloud Drive, not a real error — see `next.config.js`'s own `DIST_DIR` comment); `npm run
lint` **1,272 warnings, 0 errors — down 1** from the 1,273 baseline (the deleted `DashboardViewSelector.tsx`
carried one inline-style warning); `npx stylelint` clean; `npm run build` compiled all 64 routes (also
needed one retry past the same iCloud glitch pattern); `npm run test` **110/110 suites (down 1), 1,018/1,018
tests (down 13)** — both reductions are expected and correct, matching the deleted test file and trimmed
test blocks, not a coverage regression. No `product/RELEASE_NOTES.md` entry — this was unreachable dead
code with zero live consumers, so there is no user-facing behavior to describe. Branch:
`remove/dead-dashboard-view-selector-r12`.)

**Last updated:** 2026-07-14 (**DOCS: FIX "FULL REPORT" NAV DESCRIPTION MISMATCH** — Resolves a P3 Phase 5
finding, restated across two audit checkpoints (`docs/product-audit/01-app-inventory.md` and
`docs/product-audit/07-information-architecture.md` §D): the Analytics nav group's "Full Report" item
(`src/components/dc-shell/navigation.ts:38`, `href: '/dashboard'`) had `desc: 'All metrics & filters'`,
but `/dashboard` is a redirect stub to `/dashboard/priority-attention` — a single action-items/blockers
view titled "Priority Attention," not an all-metrics landing page. Confirmed by reading both
`app/dashboard/page.tsx` (the redirect) and `app/dashboard/priority-attention/page.tsx` (the actual
destination's `<PageHeader title="Priority Attention">`) before changing anything. Fix: changed `desc` to
`'Priority items & full metrics'` — accurate to what a user actually sees first (priority/action items),
while still conveying that clicking through leads into the full 9-page dashboard section (Priority
Attention, Key Metrics, Data Quality, Trends, Ownership, Labels, Epic Readiness, Flow Health, Coaching).
Left the `title` field ("Full Report") untouched — renaming the nav item itself is a bigger, more visible
content decision than correcting a factually wrong description, and wasn't what either audit finding
flagged (both cite the `desc` text specifically as not matching the destination, not the title). Grepped
for the old string across the codebase first — no other file or test referenced it. Verified: `npm run
typecheck` clean; `npm run lint` unchanged at 1,273 pre-existing warnings (0 new); `npm run build`
compiled all 64 routes; `npm run test` 111/111 suites, 1,031/1,031 tests passing (no flake this run).
Branch: `docs/fix-full-report-nav-description-mismatch`.)

**Last updated:** 2026-07-13 (**FIX: TOKENIZE AVATAR/ICON BOX SIZES** — Resolves a P3 Phase 5 finding
(`docs/product-audit/10-technical-cleanup.md` Part 3): identical raw pixel literals (32px, 36px) for
icon/avatar box dimensions were hand-repeated across 3 independent SCSS modules with no shared token —
`RoleColumn.module.scss`'s `.initials` avatar circle and `GlobalSearch.module.scss`'s `.resultIcon` box
(both 32px), and `DashboardTopbar.module.scss`'s `.hamburger` mobile toggle (36px). Per CLAUDE.md §18
("Do not hardcode in component SCSS or JSX: ...dimensions...icon sizes"), added two new tokens to
`src/styles/_tokens.scss` — `--icon-size-md: 32px` and `--icon-size-lg: 36px` — in a new "Icon / avatar
box sizes" section, deliberately separate from the existing `--space-*` spacing scale even though
`--space-8` numerically equals 32px: spacing tokens mean "gap between elements," these mean "size of an
element," a different semantic category per §18.1's semantic-token policy, even where the numbers
coincide. Replaced the 3 raw literals with `var(--icon-size-md, 32px)` / `var(--icon-size-lg, 36px)` —
kept the original pixel value as the CSS fallback in each case, so even in the hypothetical case the
custom property fails to resolve, computed output is byte-identical to before. **Left untouched**: 3
other unrelated `32px` occurrences in `GlobalSearch.module.scss` (padding/max-width values, not
icon/avatar box dimensions — out of scope for this specific finding, which was about icon/avatar sizing
literals specifically, not "every 32px in the codebase"). Verified: `npm run typecheck` clean; `npm run
lint` unchanged at 1,273 pre-existing warnings (0 new); `npx stylelint 'src/**/*.scss' 'app/**/*.scss'
--max-warnings=0` clean (0 warnings — confirms the new token syntax and `var(..., fallback)` usage are
Stylelint-compliant); `npm run build` compiled all 64 routes; `npm run test` 111/111 suites, 1,031/1,031
tests passing. No manual browser verification needed — the `var(--token, <original-literal>)` fallback
pattern guarantees identical rendered output regardless of whether the token resolves. Branch:
`fix/tokenize-avatar-icon-box-sizes`.)

**Last updated:** 2026-07-13 (**FIX: `Card.tsx` NON-KEYBOARD-ACCESSIBLE `onClick` (LATENT)** — Resolves a
P3 Phase 5 finding (`docs/product-audit/09-ux-and-accessibility.md` §6): the shared
`src/components/ui/Card.tsx` accepted an optional `onClick` prop and rendered a plain `<div>` with
`cursor-pointer` styling, but added no `role="button"`, `tabIndex`, or `onKeyDown` handler — a mouse-only
control with no accessible role the moment any page passed `onClick`. The audit confirmed zero current
call sites pass `onClick` (verified independently here via grep — went further and confirmed zero call
sites import `<Card>` **at all**, not just zero `onClick` usages; the component is currently fully
unused). **Chose to fix the gap rather than delete the file**: the audit's own finding explicitly already
knew about the zero-consumer status and still recommended fixing the prop, not removing it — treating
this as a landmine to defuse in a likely-to-be-reused generic primitive (unlike the audit's separately-
tracked, genuinely abandoned single-purpose orphaned components, e.g. `SprintComparePanel.tsx`), not as
dead code to remove. Fix: added `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler (Enter/Space
trigger `onClick`, matching the standard WAI-ARIA APG pattern for a non-native clickable container) —
all three only applied when `onClick` is actually supplied, so the no-`onClick` case is behaviorally
identical to before. Chose the ARIA-div pattern over swapping to a native `<button>` wrapper (CLAUDE.md
§26.1's stated preference) specifically because `Card` wraps unconstrained `children: React.ReactNode` —
a native `<button>` cannot legally contain other interactive elements (nested buttons/links), which a
generic reusable card is very likely to need (e.g. a "View details" link inside a clickable summary
card); the ARIA-div pattern is the documented exception for exactly this composability case. Added a
`focus-visible` ring via Tailwind (`focus-visible:outline-none focus-visible:ring-2
focus-visible:ring-offset-2`), matching the exact utility combination already used for this purpose
elsewhere in `src/components/ui/` (`SectionNav.tsx`), per CLAUDE.md §26.2's visible-focus requirement.
Verified: `npm run typecheck` clean; `npm run lint` unchanged at 1,273 pre-existing warnings (0 new);
`npm run build` compiled all 64 routes; `npm run test` 111/111 suites, 1,031/1,031 tests passing. No
manual browser verification needed or performed — zero live pages render this component today, so there
is no existing UI this change could regress. Branch: `fix/card-clickable-div-keyboard-accessibility`.)

**Last updated:** 2026-07-13 (**FIX: UNIFY ADMIN CONFIRM-DIALOG USAGE** — Resolves a P3 Phase 5 finding
(`docs/product-audit/10-technical-cleanup.md` Part 4): `app/admin/settings/page.tsx` used the shared,
accessible `ConfirmDeleteDialog` (focus management, Escape-to-cancel, `role="dialog"`) for one action
("Discard unsaved changes?") but native browser `window.confirm()`/`confirm()` for three other
destructive actions in the same file — `AutoRestoreSection.handleAutoRestore()` (both the plain and
`force` variants) and `CloudBackupList.handleRestore()`; `src/components/admin/JiraConnectionsPanel.tsx`
used only native `confirm()` for its Jira-connection delete. Native `confirm()` blocks the JS event loop,
can't be styled/themed, and (per CLAUDE.md §26.5) isn't reliably keyboard/focus-consistent with the rest
of the app's modal pattern. Fix: converted all 4 remaining call sites to the same
state-flag-plus-conditional-render pattern the file's own "Discard changes" dialog already used —
each `confirm(...)` check was replaced with a `useState` flag set by the triggering button's `onClick`,
the actual action body extracted to run unconditionally (called from the dialog's `onConfirm`), and a
`<ConfirmDeleteDialog>` rendered conditionally with `onCancel` resetting the flag. `AutoRestoreSection`
maps its existing `force` semantics onto the dialog's `danger` prop (red for the irreversible overwrite,
amber for the safe empty-DB-only restore) rather than introducing new severity language. Zero behavior
change to the underlying actions themselves — only the confirmation UI changed. Verified: `npm run
typecheck` clean; `npm run lint` unchanged at 1,273 pre-existing warnings (0 new); `npm run build`
compiled all 64 routes; `npm run test` 111/111 suites, 1,031/1,031 tests passing (no dedicated test file
covers either admin component — pre-existing gap, unchanged by this branch). **Manual verification**:
confirmed via a throwaway admin test account (created directly via Prisma, deleted after) that
`/admin/settings` server-renders correctly post-change with no errors; full interactive click-through
(opening each dialog, confirming/cancelling) was not performed — no browser automation tool is available
in this environment, only curl/HTML-level checks. Branch: `fix/admin-confirm-dialog-consistency`.)

**Last updated:** 2026-07-13 (**DOCS: FIX WRONG `/api/dashboard` DESCRIPTION IN `product/README.md`** —
Partial resolution of a Phase 5 P3 finding (`docs/product-audit/10-technical-cleanup.md` Part 4):
`/api/dashboard` is a static, unused stub route (`app/api/dashboard/route.ts`, returns only
`{ status: 'ok', service, version }` — no metrics, no caching, zero live frontend callers, confirmed via
grep) whose name is misleading relative to its content. **Chose documentation correction over deletion**:
the audit's own reasoning elsewhere (R-10, Phase 4) explicitly cautions that a route with zero in-repo
callers can still be depended on by an external uptime monitor, load balancer health check, or deployment
script this audit has no visibility into — the same caveat applies here, and `product/SRS.md` and
`product/DEVELOPER_GUIDE.md` already independently document it as a deliberate "lightweight
health/identity probe," so removing it isn't a safe unilateral engineering call the way the finding's
framing ("just needs a decision") might suggest. What WAS safe to fix directly: of the 5 places this
route is described (`app/api/backend-view/route.ts`, `app/help/page.tsx`, `product/SRS.md`,
`product/DEVELOPER_GUIDE.md`, `product/README.md` — the last one not even enumerated in the original
finding's list of "3 hand-maintained descriptions," which only named backend-view/developer-view/help),
4 of 5 already correctly describe the static-stub behavior; only `product/README.md`'s API table row was
factually wrong (previously read "Return cached dashboard metrics" — the route does neither of those
things). Fixed that one line to match the other 4 sources and the route's actual code. Confirms the
audit's underlying "nothing enforces consistency across hand-maintained API descriptions" finding is
real (this is exactly the kind of drift it predicted), without resolving that finding's proposed
structural fix (a single generated source of truth), which remains open. No source code changed —
`product/README.md` only. Branch: `docs/fix-wrong-api-dashboard-readme-description`.)

**Last updated:** 2026-07-13 (**NEW FINDING, NO CODE CHANGE: `next/image` IS UNSAFE FOR AVATAR ENDPOINTS**
— While implementing the audit's Phase 5 "user-uploaded images not using `next/image`" item
(`docs/product-audit/10-technical-cleanup.md` Part 3), live-tested the actual runtime behavior before
touching `ProfileTab.tsx`/`app/members/page.tsx` (per the UI-testing requirement — this specific fix
wasn't the well-trodden "swap `<img>` for `next/image` on a static public asset" pattern the other 4
call sites in this codebase already use; both remaining candidates route through the authenticated
`/api/profile/image` endpoint, a materially different case worth verifying rather than assuming). Test
method: registered a throwaway account against the live dev server + Neon DB, uploaded a real test
image via the authenticated upload endpoint, then probed Next's built-in `/_next/image` optimizer route
directly with and without a session cookie. Finding: the optimizer correctly requires authentication on
a cache-miss (first fetch of a given `url`+`width`+`quality` combination), but its response cache does
**not** re-check authorization on a cache-hit — once any authenticated request warms the cache (including
just the image owner's own normal page view), the cached bytes are then served to fully unauthenticated
requests indefinitely. Combined with `/members` already exposing every other member's exact `avatarUrl`
(their S3 key) to any logged-in user as plain page data, any authenticated user — including a free
self-registered account — can trivially make any other user's avatar permanently publicly readable with
zero authentication, just by requesting it once through `/_next/image`. This is latent today (no code
path currently invokes `/_next/image` for these URLs), but implementing the audit's literal
recommendation would make ordinary avatar rendering the trigger, converting a theoretical gap into
routine exposure — the opposite of a "low-risk P2 cleanup." **Decision (user-confirmed): downgrade this
finding to "will not fix as originally scoped," make no code change to either avatar call site, and
document the correction** rather than pick a mitigation unilaterally (options like a custom pre-resize-
at-upload loader or an explicit `unoptimized` prop remain open for a future pass if wanted). Correction
notes added to `docs/product-audit/10-technical-cleanup.md` (Part 3, under the original finding) and
`docs/product-audit/11-prioritized-backlog.md` (Phase 5 technical-debt line). Cleanup: the throwaway test
user and its DB row were deleted after testing (`perftest-imgcheck@example.com` via `prisma.user.delete`,
confirmed by re-query); the two tiny (73-byte) test PNGs uploaded to the live S3 bucket during testing
were **not** individually deleted (no admin S3-browsing tool was used for this — they're orphaned objects
under a now-deleted user's key prefix, harmless test fixtures, but flagging for transparency rather than
silently leaving them unmentioned). No `npm run` verification commands apply — no source file under
`app/`, `src/`, or config changed, only markdown. Branch: `docs/avatar-image-optimizer-cache-finding`.)

**Last updated:** 2026-07-13 (**v4.33.0 PERF: MEMOIZE `/charts` DERIVED DATA** — Resolves a P2 Phase 5
finding from the product audit (`docs/product-audit/10-technical-cleanup.md` Part 3, secondary
findings): `app/charts/page.tsx` recomputed ~10 unmemoized `filter`/`reduce`/`map` passes over the full
`flow.items` array (and 7 other metric arrays — sprints/capacity/quarters/kanban/labels/epics/relations)
directly in the component body on every render, including tab switches (`Bar Charts` ↔ `Circles`) and
chart-visibility-panel toggles — neither of which changes the underlying `metrics`, unlike its sibling
pages `/work-explorer` and `/dashboard/flow-health`, which already correctly memoize equivalent
derivations (confirmed pattern match against `app/work-explorer/page.tsx:120-134`, which memoizes each
derived value keyed on `metrics`). Fix: wrapped the entire derived-data block (delivery/health/type/story-
point donut segments, sprint/capacity/quarter/kanban/label bar-chart data, epic Gantt rows, KPI pills —
25 previously separate `const` bindings) into a single `useMemo(() => {...}, [metrics])` returning one
view-model object, rather than 25 separate `useMemo` calls — the audit's concern was re-computation on
tab/pref toggle, not per-field granularity, and one memo over one logical unit (all derived from the same
`metrics` input) matches CLAUDE.md §40.1's "don't memoize by habit" guidance better than fragmenting into
25 hooks with no independent invalidation need. Required moving the `useMemo` call (and its destructuring)
above the page's `if (loading) return (...)` / `if (!metrics) return null` early returns — React's rules
of hooks require unconditional hook calls, and the derivations previously ran after those returns, so
each internal read was changed to optional-chain off `metrics` (e.g. `metrics.flow` → `metrics?.flow`)
since `metrics` can legitimately be `null` while this hook body runs, before the early return short-
circuits rendering. Dropped one intermediate variable (`kanban`, the pre-slice array) that was never
referenced outside computing `kanbanTop` — confirmed via grep before removing it, not a behavior change.
Zero output change: every returned value is byte-for-byte the same computation as before, only the
invalidation trigger changed (every render → only when `metrics` itself changes). No test file exists for
`/charts` (pre-existing — this branch does not add one, since the audit's own finding was performance-only
with no behavior to newly assert; existing behavior is unchanged, verified by close comparison against the
pre-refactor logic rather than a new test). **Manual browser verification not performed** — no
authenticated session or uploaded dataset available in this environment; verified instead via
`npm run typecheck` (clean), `npm run build` (all 64 routes compiled), full `npm run test` (111/111
suites, 1,031/1,031 tests, unaffected since none cover this page), and a manual line-by-line diff
confirming the memoized block is a pure relocation, not a rewrite. `npm run lint` unchanged at 1,273
pre-existing warnings (0 new). Branch: `perf/charts-page-memoize-derivations`.)

**Last updated:** 2026-07-13 (**v4.32.0 DISTINGUISH LOAD ERROR FROM "NO DATA" — DASHBOARD FOLLOW-UP** —
Closes the direct follow-up left open by `v4.31.0` above: the 9 `app/dashboard/*` sub-pages were
deliberately excluded from that pass because they were mid-refactor on `fix/metrics-loader-caching`
(unmerged at the time); that branch has since merged, so the exclusion no longer applies. Since
`fix/metrics-loader-caching` centralized the actual `loadMetricsWithSource()` fetch into
`app/dashboard/layout.tsx` (all 9 sub-pages now read from `useDashboardMetrics()` instead of fetching
independently), the fix is a single-file change rather than 9: `app/dashboard/layout.tsx`'s fetch
`catch` block now calls `redirectWithLoadError(router)` instead of a bare `router.replace('/')`, so
every sub-page inherits the fix automatically through the shared context. `app/readiness/page.tsx`,
the other item excluded from `v4.31.0`, needed no such follow-up — `fix/readiness-redirect-to-release-
readiness` replaced it with an unconditional `redirect('/release-readiness')` stub with no fetch of its
own to distinguish. The 9 sub-pages' own `if (!loading && !metrics) router.replace('/')` fallback
effects (a defense-in-depth net for the null-metrics case) are left as-is and unaffected: they fire
after the layout's redirect has already begun navigating away, so they remain a harmless duplicate
no-op `router.replace('/')` to the same destination, never a competing one — this was true before this
change and is unchanged by it. Verified: `npm run typecheck` clean; `npm run lint` unchanged at 1,273
pre-existing warnings (0 new); `npm run build` compiled all 64 routes; `npm run test` 111/111 suites,
1,031/1,031 tests passing. Branch: `fix/dashboard-layout-load-error-signal`.)

**Last updated:** 2026-07-13 (**v4.23.0 FIX: RELEASE READINESS NEVER EVALUATED REAL DATA** — Fixes
`AUDIT-CP3-001`, the first of three P0 findings from the full-application product audit
(`docs/product-audit/`, Checkpoint 3). Root cause: `calculateReleaseReadiness()`
(`src/services/metrics/releaseReadiness.service.ts`) read raw Jira export column names
(`'Fix Version/s'`, `'Status'`, `'Issue Type'`, `'Blocked Flag'`), but both callers
(`app/readiness/page.tsx`, `app/release-readiness/page.tsx`) pass it `metrics.flow.items` —
normalized `FlowItem[]`, which never had those keys — so `getVersion()` always returned `''`,
`versionMap` was always empty, and every user saw "Fix Version / Release column is absent"
regardless of their actual data. Fix: added `fixVersion`/`blocked` fields to `FlowItem`
(`src/types/metrics.ts`, populated in `metrics.service.ts`'s `getHealthFromIssue()` from the
already-locally-computed `isBlocked` value and a new `issue['Fix Version/s']` read), and rewrote
`releaseReadiness.service.ts`'s helpers (`isDone`/`isBlocked`/`isBug`/`isCritical`/`getVersion`) to
read the normalized `FlowItem` shape instead of raw columns. Removed the `as any` casts this bug had
been silently masked behind at both call sites. **Discovered along the way, fixed as a direct
dependency, not a scope-expanding side quest**: `metrics.service.ts` maintains its own second,
independently-hand-synced `FlowItem` interface (line ~46) distinct from the shared one in
`src/types/metrics.ts` — both needed the same two fields added by hand; flagged below as a new
tracked item (`DUP-FLOWITEM-01`) rather than consolidated now, since merging them is a wider
refactor than this bug fix's blast radius should cover. Rewrote `releaseReadiness.test.ts`'s
fixtures from raw-column shape to a `FlowItem` builder (the raw-column fixtures were the reason
the original bug shipped with a fully green test suite — they matched the function's old signature,
not what production actually calls it with); added `TC-RR-11`, a regression test asserting a real
`FlowItem[]` with a populated `fixVersion` produces a non-empty, evaluated result. 4 other test
files with pre-existing `FlowItem`-typed fixtures (`excelExport.test.ts`, `forecastEngine.test.ts`,
`roleGridView.test.ts`, `teamHealth.test.ts`, `roleBasedCoaching.test.ts`) needed the two new fields
added to stay type-valid — no behavior in those tests changed. Verified: `npm run typecheck` clean;
`npm run lint` unchanged at 1,274 pre-existing warnings (0 new); `npm run test` 1,023/1,023 passing
(1 pre-existing flaky timeout in `adminUsers.test.ts` confirmed unrelated — passes 11/11 in isolation,
times out only under full-suite parallel load). Branch: `fix/release-readiness-flowitem-mismatch`.)

**Last updated:** 2026-07-13 (**v4.24.0 FIX: ROADMAP FORECAST ALWAYS SHOWED "INSUFFICIENT DATA"** — Fixes
`AUDIT-CP3-008`, the second of three P0 findings from the full-application product audit
(`docs/product-audit/`, Checkpoint 3). Root cause: `app/roadmap/page.tsx` computed its own average
sprint-completion throughput inline, filtering/reducing `metrics.sprint?.sprints` on `s.completedCount`
— but that field only exists on the richer `metrics.throughput.sprint.sprints` shape; the legacy
`metrics.sprint.sprints` array (capped at 8, populated on every upload) uses `completedIssues` instead.
`avgThroughput` was therefore always `0`, so every epic that wasn't already 100% done fell into the
"Insufficient data" branch regardless of how much real sprint history existed — silently contradicting
`/help`'s own documented behavior, since sprint history genuinely was available. The correct
source-preference/field-name logic already existed, correctly, in
`src/services/forecast/forecastEngine.service.ts` (built for `/forecast`, unaffected by this bug) — extracted
it into a new exported `computeAverageThroughput(metrics)` function so both `/forecast` and `/roadmap` share
one tested calculation instead of `/roadmap` maintaining its own inline duplicate, which is how this class of
bug happened in the first place. `computeForecast()`'s own existing body/tests were left untouched (zero
behavior-risk to the already-correct `/forecast` page) — the new function is an additive extraction, not a
rewrite of tested logic. Added `TC-FCAST-07b` (`forecastEngine.test.ts`) as a direct regression test:
`computeAverageThroughput()` against a legacy-shaped `metrics.sprint.sprints` fixture (the exact shape that
triggered the bug) now returns the correct non-zero average. Left a pointer comment in
`roadmapForecast.test.ts` noting that `forecastEpic()` itself was never the buggy part — only its caller's
input was — since that file's existing tests (correctly) only ever exercised `forecastEpic()` in isolation
and could not have caught this integration-level bug. Verified: `npm run typecheck` clean; `npm run lint`
unchanged at 1,274 pre-existing warnings (0 new); `npm run test` 110/110 suites, 1,023/1,023 tests passing.
Branch: `fix/roadmap-forecast-field-mismatch`, based on `main` independently of the `v4.23.0`/`AUDIT-CP3-001`
entry above (both branches were based on `main` at commit `de490f4`; renumbered to `v4.24.0` on merge, per
that entry's own note that this reconciliation would be needed at merge time).)

**Last updated:** 2026-07-13 (**v4.25.0 FIX: FLOW HEALTH COULD SHOW GREEN FROM ZERO REAL DATA** — Fixes
`AUDIT-CP3-002`/`AUDIT-CP3-004`/`AUDIT-CP3-005`, the third of three P0 findings from the full-application
product audit (`docs/product-audit/`, Checkpoint 3), scoped narrowly per the audit's own backlog framing
("wire the already-built metricConfidence.service.ts signal into the primary display components... CP3-004
and CP3-017 are the same root cause, fold into one fix"). Two changes:
(1) `src/components/dc-shell/DCKpiCard.tsx` gained an optional `confidence?: MetricConfidence` prop
rendering the existing `MetricConfidenceBadge` component next to the label — the identical pattern already
used correctly by `src/components/ui/KpiCard.tsx`, just extended to the second KPI card component that
lacked it. Wired into `app/flow-health/page.tsx`'s Avg Lead Time / Avg Cycle Time cards (the exact
`DCKpiCard on /flow-health` citation from `CP3-004`'s evidence), which also had their `tone` changed to
`'neutral'` instead of `'success'` when the underlying sample size (`leadTimeSampleSize`/`cycleTimeSampleSize`)
is zero — previously a zero-sample average rendered fully green with no reliability signal at all.
(2) `app/sprint-kanban/page.tsx`'s "Flow Health" KPI tile — which defaults to `'Healthy'` internally in
`kanbanFlow.service.ts` when there are zero completed periods to evaluate — now falls back to `'—'` the same
way its neighboring Cycle Time and Lead Time tiles in the same strip already correctly do at zero, rather
than showing a green "Healthy" chip with no throughput evidence behind it. This is a display-layer guard
only; the underlying `overallFlowHealth` calculation in `kanbanFlow.service.ts` was deliberately left
unchanged to keep this fix's blast radius to the two files actually rendering it, not the shared calculation
type (`KanbanFlowHealth` has no "insufficient data" member — adding one would ripple into every consumer of
that type, judged out of scope for this fix).
**Explicitly not done in this fix, tracked separately**: `CP3-017` (Data Quality score has no sample-size
awareness) is a scoring-*formula* change in `dataQuality.service.ts`, not a wiring gap — a genuinely different
and riskier class of change than adding a badge, deliberately left for its own dedicated review rather than
bundled in here. Broader rollout of the confidence badge to `MiniKpiCard` (`/dashboard/key-metrics`,
`/summary`) and other KPI cards app-wide was also not attempted — this fix targets the specific, evidenced
citations from the audit, not an exhaustive sweep; both remain in `docs/product-audit/11-prioritized-backlog.md`
Phase 5. No component-rendering test infrastructure exists in this codebase (confirmed repeatedly across the
audit) so this UI-only change could not be given a dedicated automated test beyond typecheck/lint/full-suite
regression — verified: `npm run typecheck` clean; `npm run lint` unchanged at 1,274 pre-existing warnings
(0 new); `npm run test` 110/110 suites, 1,022/1,022 tests passing, zero regressions. Branch:
`fix/metric-confidence-sample-size-gating`, based on `main` independently of the other Phase 1 entries above
in this same session (all three Phase 1 audit fixes branched from `main` at commit `de490f4` in parallel;
renumbered to `v4.25.0` on merge, as the third of the three to land).)

**Last updated:** 2026-07-13 (**v4.26.0 REMOVE STALE `page 2.tsx` DUPLICATE** — Resolves `04-remove-merge-keep.md`
R-11 (highest-confidence removal in the product audit): deleted `app/profile/page 2.tsx`, a stale,
git-tracked duplicate of `app/profile/page.tsx` dated 2025, inert for Next.js routing since the App Router
only ever serves the exact filename `page.tsx` — confirmed via repo-wide grep for zero references and
`git log --follow` showing no recent history. `npm run typecheck` and `npm run build` both clean, zero
routes affected. Branch: `fix/remove-stale-profile-page-duplicate`, based on `main` at commit `de490f4`,
independent of this session's other parallel fix branches; renumbered to `v4.26.0` on merge.)

**Last updated:** 2026-07-13 (**v4.27.0 DASHBOARD METRICS: SHARE ONE FETCH ACROSS ALL 9 SUB-PAGES** —
Resolves the product audit's single highest-leverage/lowest-risk finding
(`docs/product-audit/10-technical-cleanup.md` Part 3): `app/dashboard/layout.tsx` already fetched
`DashboardMetrics` once via `loadMetricsWithSource()` but only forwarded it to `DashboardNavSidebar` — every
one of the 9 live `/dashboard/*` child pages (`priority-attention`, `key-metrics`, `data-quality`, `trends`,
`ownership`, `labels`, `epic-readiness`, `flow-health`, `coaching`) independently re-fetched and re-parsed the
identical dataset on its own mount, meaning ordinary navigation between dashboard sub-pages was a genuinely
cold fetch+parse every time (compounded by `next.config.js`'s `staleTimes: {dynamic:0,static:0}`, which
already disables Next's own router cache app-wide). Added `src/components/dashboard/DashboardMetricsContext.tsx`
(new) — a `DashboardMetricsProvider`/`useDashboardMetrics()` pair scoped to the dashboard layout's own
lifetime, deliberately **not** a module-level cache on `loadMetricsWithSource()` itself (that function has its
own P0 fix history around trusting stale/cross-account cached data — `git log` `fix/dashboard-router-cache-
stale-data`, `fix/p0-cross-account-local-data-leak` — a global indefinite cache there was judged too risky;
scoping the cache to the layout's mount lifetime means navigating away from `/dashboard/*` and back always
re-fetches fresh, same as today). `app/dashboard/layout.tsx` now tracks its own `loading` state and wraps
`{children}` in the new provider; each of the 9 child pages replaced its own
`useState`+`useEffect`+`loadMetricsWithSource()` triplet with `const { metrics, loading } =
useDashboardMetrics()` plus a 3-line redirect-on-null effect — mechanical, byte-identical across all 9 before
this change (verified via diff before touching any of them), so this was a safe, uniform replacement, not 9
independent judgment calls. `useState`/`DashboardMetrics` type imports were dropped where they became fully
unused (`ownership`, `labels`, `epic-readiness`, `coaching`); `FlowItem` type imports were kept where still
used for other derived values. Caught and fixed two self-introduced copy-paste mistakes during this change
(stray orphaned `return()`/`}, [router])` fragments left behind in `data-quality` and `ownership` after an
imprecise first edit) via `npm run typecheck` before they reached commit. Verified: `npm run typecheck` clean
(note: 8 of the 9 dashboard pages carry pre-existing `// @ts-nocheck`, unrelated to this change — `npm run
build` was run as the more meaningful check for those files and compiled all 64 routes cleanly); `npm run
lint` unchanged at 1,274 pre-existing warnings (0 new); `npm run test` 110/110 suites, 1,022/1,022 tests
passing (one run hit an unrelated Jest worker SIGSEGV, confirmed as infra flake on immediate re-run, not
caused by this change — this touches no domain-service/test-covered code at all). Branch:
`fix/metrics-loader-caching`, based on `main` at commit `de490f4`, independent of this session's other
parallel fix branches; renumbered to `v4.27.0` on merge. **Explicitly not done**: the ~10 top-level pages
(`/charts`, `/teams`, `/portfolio`, etc.) outside `/dashboard/*` still each independently fetch, since
there's no shared layout wrapping them to hoist the fetch into — a much larger architectural change (a
root-level provider) than this quick win's scope; tracked in `docs/product-audit/11-prioritized-backlog.md`
Phase 5.)

**Last updated:** 2026-07-13 (**v4.28.0 ADD SKIP LINK TO ALL 4 APP SHELLS** — Resolves
`docs/product-audit/09-ux-and-accessibility.md` §6.6 (the one confirmed, unambiguous static
accessibility gap found in the audit): no "skip to main content" mechanism existed anywhere in the app.
Discovered while implementing that this app has **4** separate top-level nav shells, not 1 — `AppShell`
(the ~28 pages that import it directly), `app/dashboard/layout.tsx` (its own topbar + sidebar), `app/admin/
layout.tsx` (its own topbar + `AdminNavSidebar`), and `app/developer/layout.tsx` (its own topbar, no
sidebar) — confirmed via `grep` that none of the latter three ever render `AppShell`. A skip link added
only to `AppShell` would have silently left `/dashboard/*`, `/admin/*`, and `/developer` uncovered, so all
4 got one: a `.skipLink` class (hidden off-canvas via `top: -100%`, moved on-screen on `:focus-visible`,
using existing design tokens — `--space-3/4/5`, `--radius-md`, `--shadow-card`, `--z-modal`, matching the
already-established `focus-ring` mixin's outline treatment) plus an `<a href="#main-content">` as the first
element in each shell. `AppShell`'s and `app/developer/layout.tsx`'s `<main>`/body wrapper needed a new
`id="main-content"` added (neither had one before); `app/dashboard/layout.tsx` and `app/admin/layout.tsx`
already had one. `/promo` and `/customer` were deliberately left out — both are documented (Checkpoint 1)
as intentionally not using any persistent nav shell (a public marketing page and a print-ready external
report respectively), so there is no repeated block for a skip link to bypass on either. Verified:
`npm run typecheck` clean; `npm run lint` unchanged at 1,274 pre-existing warnings (0 new); `npm run
lint:css` clean, 0 warnings; `npm run build` compiled all 64 routes successfully. No automated test added —
this codebase has no component-rendering test infrastructure (confirmed repeatedly across the audit), so
this is verified by typecheck/lint/build only, consistent with how the audit itself could verify
accessibility claims. Branch: `fix/skip-link-accessibility`, based on `main` at commit `de490f4`,
independent of this session's other parallel fix branches; renumbered to `v4.28.0` on merge.)

**Last updated:** 2026-07-13 (**v4.29.0 MERGE /readiness INTO /release-readiness** — Resolves
`docs/product-audit/04-remove-merge-keep.md` R-01, the single highest-confidence duplicate finding in the
product audit: `/readiness` reproduced zero content beyond what `/release-readiness` already showed (both
called `calculateReleaseReadiness()` against the same `ReleaseReadinessSummary` type; `/release-readiness`
additionally computes 7 global quality-gate checks `/readiness` never had). `app/readiness/page.tsx`
replaced with a `redirect('/release-readiness')` stub, matching the established pattern already used by
the other 9 retired-route stubs under `app/dashboard/*`. Updated the one confirmed live incoming link
(`app/landing/components/FeatureUniverse.tsx:18`, now points at `/release-readiness`) and a stale prose
reference in `app/developer/page.tsx:1252`. Fixed the `c_level` role's `DELIVERY_ROUTES` omission
flagged in `06-role-based-review.md` (`src/lib/roles.ts` — `c_level` was the only role whose hand-listed
route allowlist excluded `/readiness`, an inconsistency that only existed because `DELIVERY_ROUTES` is
hand-copied per role instead of spread from the shared constant in 4 of 5 non-admin branches) — added it
so every role reaches the redirect cleanly rather than being bounced to a fallback route first.
`middleware.ts`'s `PROTECTED` entry for `/readiness` was deliberately left unchanged (still session-gated,
same as every other protected route — an unauthenticated visitor should still hit `/login` before the
redirect fires). **Also removed** `src/components/readiness/ReleaseReadinessCard.tsx` — its only consumer
was `/readiness` itself, so retiring that page left it immediately orphaned; removed in this same commit
rather than left as fresh dead code for a future audit to rediscover. **Incidentally observed, not
fixed** (out of this change's scope — flagged, not silently ignored): `app/developer/page.tsx:1247`
documents Release Readiness verdict thresholds as "Go: ≥95%... Conditional Go: ≥80%..." which does not
match the actual code in `releaseReadiness.service.ts` (`deriveVerdict()`: Go requires ≥90% with no
blockers/bugs/critical items, Conditional Go covers 70–89% or has bugs/critical items, No-Go is <70% or
any blocker) — a pre-existing documentation/code mismatch unrelated to this merge, needs its own separate
fix. **Also noted for environment hygiene, not a code issue**: overwriting `app/readiness/page.tsx` via
the edit tool caused an untracked `page 2.tsx` sync-conflict artifact to appear in the same directory
mid-edit — the exact same class of artifact `ORPHAN`-tracked for `app/profile/page 2.tsx` in this same
session, confirming that hypothesis live rather than just historically. Deleted immediately (it was
never git-tracked). Verified: `npm run typecheck` clean; `npm run lint` now 1,273 warnings (−1 from the
1,274 baseline — `ReleaseReadinessCard.tsx`'s removal took one inline-style warning with it), 0 errors;
`npm run build` compiled all routes, `/readiness` now a 209 B redirect stub; `npm run test` 110/110
suites, 1,022/1,022 tests passing. Branch: `fix/readiness-redirect-to-release-readiness`, based on `main`
at commit `de490f4`, independent of this session's other parallel fix branches; renumbered to `v4.29.0`
on merge.)

**Last updated:** 2026-07-13 (**v4.30.0 FIX: LOGIN ENUMERATION** — Resolves
`docs/product-audit/10-technical-cleanup.md` Part 1's login-enumeration finding: `POST /api/auth/login`
previously returned a distinct 404 (`{ code: 'USER_NOT_FOUND', registerPath: '/register' }`, "No Delivery
Clarity account exists for this email") for an unregistered email, versus a generic 401 for a wrong
password on an existing account — letting a caller enumerate registered email addresses, inconsistent
with every sibling auth endpoint (forgot-password, register, resend-verification), which already return
identical generic responses regardless of account existence. **Surfaced a real product tradeoff before
fixing it** rather than resolving it unilaterally: `app/login/page.tsx` actively depended on the
`USER_NOT_FOUND` code to auto-redirect a user who mistypes their email to `/register` with a pre-filled,
friendly "create an account" prompt — asked the user how to proceed; confirmed: keep the security fix,
drop the auto-redirect UX (the "Create one free" link on the login page remains as the normal path to
registration). Login now returns the same generic 401 (`'Invalid email or password.'`) for both cases.
Also closed a **timing side-channel** the status-code fix alone wouldn't have: previously an unknown-email
request returned near-instantly (no bcrypt call), while a known-email request paid the ~12-round bcrypt
cost — itself an enumeration vector via response latency, independent of status/body. Added
`DUMMY_PASSWORD_HASH` to `src/lib/auth.ts` (computed once at module load, same cost factor as a real
hash) so the unknown-email path now runs a real `bcrypt.compare()` against it before returning, keeping
timing consistent with the wrong-password path. Updated `src/__tests__/loginRoute.test.ts`'s `TC-LOGIN-01`
(previously asserted the old 404/`USER_NOT_FOUND` behavior directly — this is the test that would have
caught a future regression back to the old behavior, now asserting the opposite) and added `TC-LOGIN-01b`,
a direct regression test asserting the unknown-email and wrong-password responses are byte-for-byte
identical (status + body), the actual anti-enumeration property being fixed. Verified: `npm run typecheck`
clean; `npm run lint` 1,274 (baseline, 0 new); `npm run build` compiled all routes; `npm run test` 110/110
suites, 1,023/1,023 tests passing. Branch: `fix/login-enumeration`, based on `main` at commit `de490f4`,
independent of this session's other parallel fix branches; renumbered to `v4.30.0` on merge.)

**Last updated:** 2026-07-13 (**v4.31.0 DISTINGUISH LOAD ERROR FROM "NO DATA" (PHASE 3)** — Resolves the
dominant Checkpoint 2 finding from the product audit (`docs/product-audit/09-ux-and-accessibility.md` §2):
20+ routes redirected to `/` identically whether `loadMetricsWithSource()` genuinely found no data or the
fetch itself failed, so a real error was indistinguishable from a first-time visit. Added
`src/lib/loadErrorSignal.ts` (new, `redirectWithLoadError()` / `consumeLoadErrorSignal()`, sessionStorage-
backed) — deliberately a signal-and-redirect mechanism rather than a bespoke error-state UI on every
affected page, since all of them already redirect to `/` on failure; this makes that existing redirect
land somewhere that can explain what happened instead of adding new UI surface to ~20 files.
`app/page.tsx` (the upload page) now consumes the signal on mount and shows it via its existing `error`
banner state — no new UI component needed there either. **Applied to 10 of the ~20 affected routes in
this pass**: `/charts`, `/customer`, `/data-quality`, `/delivery-mix`, `/flow-health`, `/forecast`,
`/sprint-kanban`, `/summary`, `/work-explorer`, `/release-readiness` — each had an identical, mechanical
`catch { router.replace('/') }` / `.catch(() => router.replace('/'))` shape (verified before editing any
of them), swapped for `redirectWithLoadError(router)`. **Deliberately excluded from this pass**: the 9
`app/dashboard/*` sub-pages and `app/readiness/page.tsx` — both are mid-refactor on other unmerged
branches from this same session (`fix/metrics-loader-caching` moved the dashboard pages onto
`useDashboardMetrics()`; `fix/readiness-redirect-to-release-readiness` replaced `/readiness` with a bare
redirect stub) — editing their pre-refactor state here would create a guaranteed merge conflict for no
benefit; tracked as a direct follow-up once whichever of those merges first. **Also fixed, different
shape**: `app/column-mapping/page.tsx` — the single worst instance found in the audit (`.catch(() => {})`,
a genuinely empty catch with no redirect and no state change at all, so an error and "no upload" were 100%
identical with no distinguishing signal whatsoever). This page stays on-page rather than redirecting, so
the fix is a `loadError` boolean state instead of the signal mechanism — the existing inline empty-state
card now shows "Couldn't check your upload status" wording and a retry prompt instead of "No data uploaded
yet" when the load itself failed. Added `src/__tests__/loadErrorSignal.test.ts` (new, 6 tests) covering
the utility directly, including that a genuine no-data redirect (no signal set) is unaffected — the whole
point of keeping the signal strictly opt-in. Verified: `npm run typecheck` clean; `npm run lint` 1,274
(baseline, 0 new); `npm run build` compiled all routes; `npm run test` 111/111 suites (+1 new file),
1,028/1,028 tests (+6 new) passing. Branch: `fix/distinguish-load-error-from-no-data`, based on `main` at
commit `de490f4`, independent of this session's other parallel fix branches; renumbered to `v4.31.0` on
merge, the last of all nine session branches to land. **Post-merge note**: the "deliberately excluded"
9 `app/dashboard/*` pages and `app/readiness/page.tsx` mentioned above are, as of this merge, no longer
mid-refactor — both of the branches this entry deferred to (`fix/metrics-loader-caching`,
`fix/readiness-redirect-to-release-readiness`) merged earlier in this same sequence. Applying the same
`loadErrorSignal` treatment to those 10 routes (9 via `DashboardMetricsContext`'s error path, 1 trivially
since `/readiness` is now a bare redirect with no fetch of its own) remains a real, valid follow-up — just
no longer blocked by a merge-conflict risk that has since resolved itself.)

**Last updated:** 2026-07-12 (**v4.22.0 TEAM ROLE VIEW — FULL COACHING PAGE REPLACEMENT** — Per explicit
user request ("No I dont like the style totaly") with a full, detailed design brief for a "simple, light,
role-based grid," delivered minutes after `v4.21.0` below shipped — that relevance-first tab redesign is
superseded same-day, not iterated on. Replaced the entire per-viewer-role, tab-based coaching page with a
fixed, non-personalized 3-column CSS Grid (Scrum Master, Product Owner, Manager) shown identically to
every visitor: `RoleColumn`/`RoleSection`/`RuleItem`/`ActionItem`/`MetricItem`/`StatusBadge` (all new,
`src/components/dashboard/`), driven by `buildRoleGridView()` (new, `src/services/coaching/
roleGridView.mapper.ts`) reading `DashboardMetrics` directly — bypasses the old 7-generator/orchestrator/
confidence/trend/evidence-link subsystem entirely rather than reusing it, since the new page has no
per-category personalization, evidence chips, or confidence scoring left to drive. 10 of 12 rule statuses
and all but 1 of 12 key measures are wired to real data or a simple documented derivation (carry-over
rate, sprint goal coverage, forecast variance — see the mapper's inline comments); exactly one metric
("Retro actions completed") has no real data anywhere in the app and shows a labeled FALLBACK constant.
Reused the same numeric thresholds already hardcoded in `scrumMaster`/`engineeringManager`/
`deliveryManager` generators (>35% capacity, <60% confidence, `'Declining'` trend) rather than inventing
new policy; the one genuinely new threshold (20% carryover-at-risk) is called out in code and docs as
having no prior app-wide equivalent. Deleted `CoachingInsightCard.tsx`/`CoachingOtherRoles.tsx` (zero
remaining callers, direct analog to deleting `CoachingCategoryTabs.tsx` in `v4.21.0` below). New
`ORPHAN-03` (Section 18f): `coachingOrchestrator.service.ts`, all 7 `generators/*.generator.ts`,
`ceremonyAdvice.service.ts`, `coachingConfidence.service.ts`, `coachingTrend.service.ts`,
`coachingEvidenceLink.ts`, `coachingBadge.ts`, `adminSignals.service.ts`, `app/api/coaching/
admin-signals/route.ts`, and `src/types/roleBasedCoaching.ts` now have zero callers from any page or
component (confirmed via repo-wide grep, excluding their own test files) — flagged for an explicit
keep/repurpose/delete decision rather than silently deleted, since they represent real, tested, still-
plausibly-reusable business logic and deleting ~15 files/several hundred tests was judged a larger,
more unrelated action than the user's actual request. `DashboardNavSidebar.tsx` nav item renamed
"Coaching Insights" → "Team Role View" (dropped the now-dead `visibleCategoriesForRole()` meta-count
call). `tour.ts` and `/help`'s FAQ section rewritten for the new page. `product/` docs: `SRS.md`
(FR-352–354 marked fully superseded, new FR-411 + Addendum AD), `APPENDIX.md` (Sections Q/R/S marked
superseded, new Section T), `DEVELOPER_GUIDE.md` (new dated section), `SCENARIOS.md` (SCN-057/058/060
marked superseded as historical record, new SCN-062), `USE_CASES.md` (UC-114 fully rewritten). Self-review
agent pass caught 3 real issues before merge, all fixed: the Manager capacity rule/action dropped the
small-team (`capacity.length > 2`) guard the source generators apply, the "Rebalance N members" action
read oddly when there was nothing to rebalance (now a distinct action text, gated the same as the rule),
and tour copy read as if the page were still personalized per viewer (reworded). New test file
`src/__tests__/roleGridView.test.ts` (8 tests, TC-RGV-01–08) covering the mapper's threshold logic,
zero-sprint/zero-committed edge cases, the small-team guard, and real-vs-fallback field sourcing.
Verification: `npx tsc --noEmit` clean, `npx eslint` clean on every new/touched file (project-wide
inline-style count *dropped* to 1,274/86 files, from 1,276/87 — deleting `CoachingInsightCard.tsx` removed
its 2 documented warnings with it), `npx stylelint` clean on every new SCSS module, full Jest suite
110 suites/1,022 tests passing (one unrelated pre-existing Jest-worker SIGSEGV flake on
`throughput.test.ts` under parallel `--runInBand`-less execution, confirmed passing in isolation — same
class of pre-existing flake documented for `forecastEngine.test.ts` in earlier entries), `npx next build`
clean. **Not independently verified:** actual rendered appearance/responsive breakpoints in a browser —
no browser-automation tool was available this session; verified analytically instead (token-only SCSS,
exact breakpoint math re-read against the spec's own three-tier requirement). Branch: `refactor/
coaching-team-role-view`.)

**Previous:** 2026-07-12 (**v4.21.0 COACHING INSIGHTS RELEVANCE-FIRST REDESIGN** — Per explicit
user request ("redesign Role-Based Coaching Insights... what else design could we used to display the
page"). Presented 4 layout options via `AskUserQuestion` with ASCII previews (relevance-first/tabs-
hidden, overview grid of all roles, left-rail navigator, keep-tabs-but-compress); user picked
relevance-first. Replaced the horizontal `CoachingCategoryTabs` strip on `/dashboard/coaching` with:
the most urgent category (already sorted by `SEVERITY_RANK`, unchanged) renders directly in the primary
`CoachingInsightCard` with no extra click, and any remaining visible categories (Manager sees 3, Admin
sees all 7 — everyone else already saw exactly one category and had no tab strip before this change
either) collapse under a new `CoachingOtherRoles.tsx` "View other roles" expander below it; each
collapsed row shows a severity-colored mood icon and one-line `healthSummary`, and selecting one swaps
it into the primary card. `CoachingCategoryTabs.tsx`/`.module.scss` deleted (no other callers).
`app/dashboard/coaching/page.tsx` simplified — `activeCategory` now defaults to `sortedCategories[0]`
directly. No coaching generator, confidence formula, or severity rule changed — presentation-only, same
as the `v4.10.1` redesign this supersedes. Updated: `src/lib/tour.ts` (`/dashboard/coaching` steps
re-ordered/re-copied), `/help` FAQ (2 entries rewritten, tab language removed), `product/SRS.md`
(FR-352/FR-353 amended with strikethrough + superseded notes, existing convention), `product/
DEVELOPER_GUIDE.md` (new dated section + living component list), `product/APPENDIX.md` (new "Section S"
term + `Cross-Category Nudge` marked superseded), `product/SCENARIOS.md` (SCN-060 flow rewritten to
match), `product/USE_CASES.md` (UC-114 step 4 rewritten). Verification: `npx tsc --noEmit` clean.
**Not yet run this pass:** `npm run lint` full-project re-audit (deferred to end of pass per existing
practice) and `npm run build`. Branch: `refactor/coaching-relevance-first-layout`.)

**Previous:** 2026-07-12 (**v4.20.0 DASHBOARD NAV CONSOLIDATION PASS 3** — Follow-up to `v4.18.0`/
`v4.19.0` below, per explicit user request ("merge Data Quality and Delivery Composition... Epic
Readiness, I don't understand what it does"). Explained Epic Readiness's purpose (per-epic risk/
completion view — the only page with that lens) rather than changing it. Merged `app/dashboard/
delivery-composition` into `app/dashboard/data-quality` as a second stacked section (user's explicit
choice over a Sprints/Quarters-style tab toggle, and over folding the donut into Key Metrics instead) —
unlike the `v4.19.0` merges, these two pages answer genuinely different questions ("can I trust this
data" vs. "what does our work mix look like"), so they're presented as two clearly separate sections on
one page rather than a single blended view. 10 routed pages → 9. `/dashboard/delivery-composition` now
redirects to `/dashboard/data-quality`; the `/dashboard/visual-analytics` redirect stub (which pointed at
`delivery-composition`) was repointed to `data-quality` too. Updated the same downstream set as prior
passes: `DashboardNavSidebar.tsx` (nav item removed, `ROUTE_ACCESS` union — now effectively all 6 roles
for `data-quality`, dropped now-unused `completionChipType`), `tour.ts` (Delivery Composition's tour entry
folded into Data Quality's as a third step), `personaFocus.config.ts` (2 links repointed, retitled to
"Data Quality"), `help`/`developer`/`glossary` pages, and `product/` docs (SRS, APPENDIX, DEVELOPER_GUIDE
— including two stale entries from *before* this session: `DEVELOPER_GUIDE.md` had never listed the 3
pass-1-removed pages' redirect stubs in its file tree, and `APPENDIX.md`'s Delivery Composition Page entry
still described the pre-`v4.18.0` version with a status bar/health distribution/epic table that had
already been trimmed to just the donut — both corrected while in there). Re-ran the full `eslint . --max-
warnings=-1 -f json` audit: 1,276 warnings/87 files (down from `v4.19.0`'s 1,279/88). CLAUDE.md §60 and
TODO-List.md `STYLE-03` refreshed to match. Verification: typecheck clean, build clean. Branch:
`refactor/dashboard-data-quality-composition-merge`.)

**Previous:** 2026-07-11 (**v4.19.0 DASHBOARD NAV CONSOLIDATION PASS 2** — Same-day follow-up to
`v4.18.0` below, per explicit product-manager-lens request to compress further rather than stop at 12
pages. Merged `app/dashboard/actions` (Smart Actions) into `app/dashboard/priority-attention` — both
answered "what needs action right now," one as raw blocked/overdue/orphan tables, the other as generated
recommendations from those same signals, so they're now one page (recommendations render as a Smart
Actions section between the summary row and the Blockers table). Merged `app/dashboard/sprint-status`
and `app/dashboard/quarter-statistics` into a new `app/dashboard/trends` page with a Sprints/Quarters
toggle in the toolbar — both answered "how are we trending over time," just at different granularity.
Both merged-away routes now redirect to their replacement (`/dashboard/actions` → `/dashboard/priority-
attention`, `/dashboard/sprint-status` and `/dashboard/quarter-statistics` → `/dashboard/trends`),
matching the existing `/dashboard` and `/dashboard/summary` redirect-stub pattern. 10 routed pages remain
(down from 12, down from the original 15). Moved `app/dashboard/actions/page.module.scss` to
`app/dashboard/priority-attention/page.module.scss` and reused its CSS-custom-property-driven action-card
classes rather than re-inlining them, so the merge didn't regress an already-compliant file back into raw
inline styles. Updated the same downstream set as `v4.18.0`: `DashboardNavSidebar.tsx` (nav items +
`ROUTE_ACCESS`, union of the merged pages' role access), `tour.ts` (3 entries removed, 1 new `trends`
entry added, Priority Attention's tour gained a Smart Actions step), `personaFocus.config.ts` (5 links
repointed to `trends`), `coachingEvidenceLink.ts` (`throughput.sprint.*` repointed to `/dashboard/trends`)
+ its test, `app/developer/page.tsx` (a stale tour-anchor example naming the now-gone `/dashboard/actions`
route). Re-ran the full `eslint . --max-warnings=-1 -f json` audit again: 1,279 warnings/88 files (down
from `v4.18.0`'s 1,281/90) — CLAUDE.md §60 and TODO-List.md `STYLE-03` refreshed to match.

**Pre-commit self-review (4 parallel finder passes + verification) found and fixed 6 real issues before
this landed:** (1) the 3 fully-removed `v4.18.0` pages (`delivery-controls`, `visual-analytics`,
`kanban-health`) had no redirect stub, unlike every merged route — old bookmarks would 404 instead of
landing gracefully; added three matching stubs (→ `key-metrics`, `delivery-composition`, `key-metrics`
respectively). (2) `trends/page.tsx`'s Trends nav chip only showed quarter count, losing the sprint
active/inactive at-a-glance signal the old Sprint Status nav item gave Scrum Masters; chip now shows
'Active' when a sprint exists. (3) Priority Attention's Blockers table lost sprint-scoping when Sprint
Status's own (sprint-only) blocked table was dropped in `v4.18.0` — added a Sprint column so that
visibility isn't gone, just relocated. (4) `sprint.predictability ? ... : '—'` (carried over verbatim
from the deleted sprint-status page) used a truthy check that would hide a legitimate 0% predictability
value; fixed to `!= null`. (5) Trends' quarterly CSV export still downloaded as `quarter-statistics.csv`;
renamed to `trends-quarterly.csv`. (6) Trends' two empty states hand-rolled markup instead of reusing
`EmptyPage` from `DashboardPageShell.tsx` (already used this way on the Coaching page); switched to it.
Also folded `qMax` into the same `useMemo` as `quarters` (was recomputing on every re-render, including
on view-toggle clicks that don't touch quarters at all). Full verification re-run after fixes: typecheck
clean, build clean, full suite 109/109 passing. Branch: `refactor/dashboard-nav-consolidation` (same
branch as `v4.18.0`, not yet committed).)

**Previous:** 2026-07-11 (**v4.18.0 DASHBOARD NAV CONSOLIDATION** — Audited all 16 `/dashboard/*`
pages for duplicated data ahead of reducing the menu; found `delivery-controls`, `visual-analytics`, and
`kanban-health` each duplicated 100% of their content elsewhere (blocked/aging tables → Priority
Attention, flow-efficiency cards → Key Metrics, status/type/assignee charts → Delivery
Composition/Labels/Ownership; `kanban-health`'s one supposedly-unique "Kanban Throughput" card read
`metrics.kanban.throughput`, a field nothing in the codebase ever sets — dead code, never rendered).
Removed all three routes (12 pages remain, down from 15). Trimmed 3 more of duplicate widgets:
`sprint-status` (dropped its blocked-items table, dup of Priority Attention), `ownership` (dropped its
epic-performance table, dup of `epic-readiness`), `delivery-composition` (dropped its type-breakdown bar
and story-points card, dups of `labels` and `key-metrics`). `epic-readiness`'s "All Epics" table gained
Lead(d)/Cycle(d) columns absorbed from the removed `ownership` table so that data wasn't lost. Updated
every downstream reference: `DashboardNavSidebar.tsx` (nav items + `ROUTE_ACCESS`), `src/lib/tour.ts` (3
tour entries removed, 2 rewritten), `personaFocus.config.ts` (3 persona focus-area links repointed),
`coachingEvidenceLink.ts` (4 evidence-chip route mappings repointed to `key-metrics`), `app/help/page.tsx`
(nav-structure FAQ answer). Re-ran the full `eslint . --max-warnings=-1 -f json` inline-style audit while
in there (last done 2026-06-27): current true count is 1,281 warnings/90 files, down from 1,524/86 —
partly from this consolidation (§60.3: −104 net) and partly from unrelated fixes since the last audit
(`app/retro/page.tsx` 112→0, `ProductTour.tsx` 13→2) plus some new drift (`app/landing/**`, `app/promo/**`
picked up a handful of new warnings). CLAUDE.md §60 and TODO-List.md `STYLE-03`–`06` refreshed to the
current numbers. New `ORPHAN-02`: found `DashboardSectionSwitcher.tsx`/`LayoutBuilderPanel.tsx` are not
mounted anywhere in `app/` — orphaned, unrelated to the routed `/dashboard/*` pages, left undecided like
`ORPHAN-01`. Branch: `refactor/dashboard-nav-consolidation`.)

**Previous:** 2026-07-01 (**v4.17.0 SOFT LAUNCH MASTER PLAN + ERROR CATALOG** — Added Section 29 (72 rows): P0-A 10 items / P0-B 15 items / P1 19 items / P2 8 items / Risk register R-01–R-20, all sourced verbatim from `Delivery_Clarity_Soft_Launch_AI_Master_Plan_v1.1.docx` (2026-06-30). P0A-06/07/08 marked partially done (Neon PostgreSQL provisioned, structured startup logging, release notes maintained). Created `product/ERRORS.md` v1.0: 33 error codes across 9 categories — startup/config (ERR-001–010), upload/processing (ERR-021–026), auth (ERR-041–045), authorization (ERR-061–062), database/storage (ERR-071–073), API/client (ERR-091–093), analytics (ERR-111–112), AI service (ERR-121–123), payments P1 (ERR-131–133). Each entry has event name, HTTP status, severity, cause and exact fix. No code changed. Branch: main.)

**Previous:** 2026-06-29 (**v4.16.0 MOBILE-01–04 AUDIT + FIXES** 2026-06-29 (**v4.16.0 MOBILE-01–04 AUDIT + FIXES** — `MOBILE-01` full static-code mobile audit (375px reasoning) across every route: 14 issues found, 2 broken/5 cramped/7 minor, repeating shared-component patterns identified. `MOBILE-02` breakpoint-strategy decision: keep existing desktop-first SCSS Modules, standardize a missing `480px` step rather than rewriting to mobile-first. `MOBILE-03` found already done pre-existing (`AppShell` hamburger + dashboard slide-in drawer from the prior session both already keyboard/screen-reader accessible). Fixed the two genuinely-broken findings in code: `work-explorer`'s 380px sidebar now gated to `min-width: 900px`; `sprint-kanban`/`delivery-mix` `.kpiStrip` base corrected from a stuck 4-col mobile default to 2-col with a `480px` step-up. `MOBILE-04` (touch targets): attempted a global fix, reverted as too high-blast-radius without browser verification — left as an open per-component follow-up. `npm run lint:css` clean. Branch: main.)

**Previous:** 2026-06-29 (**v4.15.1 QA GATE + STYLE-02 RETRO PAGE** — `QA-GATE-01`/`02` closed: `package.json` gained `typecheck`/`check:fast`/`check:ci` scripts, DEVELOPER_GUIDE.md §11a documents the pre-merge checklist (`QA-GATE-07` partially closed alongside it — branch-protection CI wiring still open, no workflow file exists yet). `STYLE-02` tier 1 first file done: `app/retro/page.tsx`'s 112 inline-style warnings eliminated via `app/retro/page.module.scss` + `data-priority`/`data-goal` attribute selectors for semantic state, 0 ESLint warnings confirmed; 5 files/374 warnings remain in this tier. `npm run check:fast` green (`forecastEngine.test.ts` Jest-worker SIGSEGV is pre-existing and unrelated). Branch: main.)

**Previous:** 2026-06-28 (**v4.15.0 PROMO POLISH + "REQUEST A DEMO"** — Visual improvements to `/promo` (canonical logo, corrected footer copyright, ambient colour wash, centred SVG ring, animated hero card, dual-direction marquee) plus new end-to-end demo-request flow: `DemoRequest` modal → `POST /api/demo-request` (public, IP rate-limited 5/15 min, HTML-escaped inputs) → `buildDemoRequestEmail()` → nodemailer. No data persisted — email-only relay. App cross-links added (`AppShell` footer + `/login`). Two post-ship stacking-context bugs found and fixed. `tsc`/ESLint/Stylelint clean. Docs: RELEASE_NOTES v4.15.0, SRS revision row + §8.1 route inventory (44→45 routes). Branch: feature/promo-polish-and-demo-request → to be merged to main.)

**Previous:** 2026-06-28 (**v4.14.0 IN-APP PROMO ROUTE `/promo`** — New public, server-rendered marketing page at `app/promo/`, per explicit user request for an animated page "not restricted to the current design" (Exo Ape reference). Intentionally public (omitted from `middleware.ts` matcher); self-contained off-theme dark palette; small client islands (`PromoNav`/`Reveal`/`CountUp`/`Marquee`); all motion `prefers-reduced-motion`-gated and no-JS safe via `@media (scripting: enabled)`. Fixed one bug found in verification (mobile menu `display:flex` base overrode `hidden`). `tsc`/ESLint/Stylelint clean, 0 new lint warnings; build registers `/promo` as static. Docs: RELEASE_NOTES v4.14.0, SRS revision row, DEVELOPER_GUIDE routing. Branch: main.)

**Previous:** 2026-06-28 (**v4.13.0 FULL PRODUCT/ DOC AUDIT** — Per explicit user request ("make sure all doc in the product are update"), audited all 17 files in `product/`. Found and fixed: `BRD.md` had zero new business requirements since v4.6/2026-06-10 despite ~2 weeks of shipped work — added `BR-118`–`BR-124`, version bumped to 4.13; `TC-ORG-01`–`12` (real Phase 1 tests, unmerged branch) were never cataloged — added `TEST_CASES.md` §9.62; a genuine `SCN-059` ID collision (RBC-26 vs RETRO-39, same day) — renumbered coaching's copy to `SCN-060`; added `SCN-061` for the previously-uncovered forecast-v2 scenario. Confirmed `ALGORITHM_SPEC.md`/`USER_JOURNEYS.md` frozen banners are intentional, not stale. Flagged but did not touch: a stale untracked iCloud sync-conflict file `CLAUDE 2.md` in the repo root. Documentation only — no code changed. Branch: main.)

**Previous:** 2026-06-27 (**v4.12.4 INLINE-STYLE DEBT RE-AUDITED** — Section 18f added: `eslint . --max-warnings=-1 -f json` re-audit found the real scope is 1,524 warnings/86 files (not the ~3 files CLAUDE.md §60 previously named — two of those, `app/admin/users`/`app/admin/settings`, are now already clean). CLAUDE.md §60 rewritten with the accurate tiered priority list (§60.1–60.6); TODO-List.md `STYLE-01`–`08` tracks remediation, `STYLE-07` (switching `npm run lint` off the prohibited `next lint`) is blocked until the count is paid down. New `ORPHAN-01`: discovered an unrelated, fully standalone legacy CRA app at `frontend/` (59 of the 1,524 warnings, not part of the Next.js app, not referenced anywhere) that needs an explicit keep-or-remove decision. Documentation only — no remediation code written yet. Branch: main.)

**Previous:** 2026-06-16 (**v4.9.3 DOC AUDIT ✅ COMPLETE** — Comprehensive doc audit: SRS scope fixed (15 dashboard pages + 6 standalone, was 11), §8.1 updated 36→44 routes + app-config row added, DEVELOPER_GUIDE file tree + §3a added, APPENDIX 9 new entries, USE_CASES UC-107/108/109 added, RELEASE_NOTES v4.9.3 written. Security fix: 10 routes added to middleware PROTECTED array + config.matcher. Branch: style/visual-design-updates.)

**Previous:** 2026-06-16 (**v4.9.2 P0 PASS ✅ COMPLETE** — REC-01–11/17/19–24 closed. TC-AC-01 + TC-REQ-10 fixed. Tests: 571/63 all passing. Lint: pass. Build: pass. RELEASE_NOTES v4.9.0/v4.9.1/v4.9.2 added. SRS v4.9.2, BRD v4.9.2, DEVELOPER_GUIDE, TEST_CASES all updated. Branch: style/visual-design-updates.)

**Previous:** 2026-06-10 (**v4.6 ROADMAP/FORECAST/RETRO/NAV-UX ✅ SHIPPED** — /roadmap, /forecast, /retro pages live; help + glossary nav UX redesigned; encrypted S3 config shipped; nav items added to Delivery group in AppShell. RETRO-01/02/03/23/24/25/26/27/28/31/32 ✅ Done. FCAST-01–18 ✅ Done. NAV-01/NAV-02 ✅ Done. ROADMAP-01 ✅ Done. COVER-19/20/22 re-opened → re-closed as implemented. Branch: feat/s3-encrypted-config.)  

**Previous:** 2026-06-09 (**v4.5 USERREQ UI ✅ FULLY SHIPPED AND DOCUMENTED** — all USERREQ-02/03/04/05/06/15/16/17/18/19/20/21/22/23/24/26/29/30 closed. RequestAddMemberModal (FR-320), UserAddRequestsPanel with mandatory admin-entered temp password (FR-321), GET/PATCH notification APIs (FR-322), NotificationBell with pulsing badge + amber admin strip (FR-323), bulk user multi-select/delete/role-change (FR-324), UC-097–099, UJ-034, SCN-049, TC-NOTIF-01–05, TC-REQ-15–16, SRS Addendum C, RELEASE_NOTES v4.5. Suite: **571/63 passing**, lint and build clean. NEXT-03 + TRACE-01 + TRACE-02 all ✅ FULLY CLOSED. USERREQ-07–14, USERREQ-28 ✅ CLOSED 2026-06-09 (backend foundation). TRACE-01 **and** TRACE-02 were both ✅ FULLY CLOSED 2026-06-08. TRACE-01: all six gap clusters plus UX-14 done — cluster #5 closed UX-02/03/05/11/13 narrative residue (new FR-308/BR-112 + UC-090/091, SCN-046/047/048, UJ-030/031/032/033, TC-CH-01–03/TC-X-14 via new src/lib/dashboardChips.ts and buildReportHtml() extractions); cluster #6 resolved the FR↔UC bundling item by fixing four real ID collisions it surfaced (duplicate FR-242/243 → FR-310/311, duplicate FR-235D → FR-235H, duplicate UC-043/044 → UC-092/093, phantom FR-309 → newly written) and adding TRACE-01 Appendix B, the FR→UC Ownership Index — matrix has zero GAP cells and zero ID collisions. TRACE-02: all 22 COVER-XX full-app-coverage rows closed via a survey-first pass — 2 stale-framing false positives re-verified (COVER-02/05), 2 genuine gaps closed (COVER-03 new SRS §8.1 API route inventory; COVER-06 new FR-312/UC-094/mergeIssues.test.ts), 1 TC-ID collision cluster resolved (COVER-11 — F3 Authentication Tests table renumbered TC-A-10–14 + 7 new tests), 1 error-state gap closed (COVER-12 — snapshotLoadErrors.test.ts TC-SN-09–11), and 5 roadmap items confirmed correctly-scoped with no speculative docs (COVER-17–21). Suite now **527/60 passing**, lint and build clean)  
**Product:** Delivery Clarity  
**Brand:** Ali Delivery Intelligence  
**Product line:** From Jira Exports to Delivery Confidence  
**Main slogan:** From messy boards to measurable delivery confidence.  
**Supporting line:** Zero-credential Jira analytics, retrospective intelligence, role-based coaching, and delivery forecasting — all in one private workspace.  
**Current known branch from uploaded TODO:** `codex/flat-admin-settings`  
**Current known version from uploaded TODO:** `v4.2.2`  
**Current known test status from uploaded TODO:** `npm run lint` pass, `npm test` pass with 469 tests / 48 suites, `npm run build` pass.  
**Important correction (updated 2026-06-08 — both TRACE-01 and TRACE-02 are now closed):** `TRACE-01` (traceability matrix) and `TRACE-02`/full app coverage validation (all 22 `COVER-XX` rows) are both ✅ Done — see Section 8 and the closure write-ups in this file and `RELEASE_NOTES.md`. Required-output reporting remains the only open item gating full P0 closure.  
**TRACE-01 progress (2026-06-08):** First-pass traceability matrix compiled and inserted in Section 12 (~50 feature rows cross-referenced against SRS/UC/SCN/UJ/TC/Release Notes); ~38% of cells started as `GAP — not found`. **Cluster #1 (F3-14/15/16 — admin user mgmt, members, forced password change) is fully closed**: anchored with `UC-084/085/086`/`SCN-039–042`/`UJ-024–026`/`TC-AU/MD/PW` and all 14 of those test cases automated and passing (suite grew 469/48 → 481/51). **UX-14 (flat admin redesign) is fully closed**: anchored with `UC-087/SCN-043/UJ-027/TC-AC-01–03`, and all 3 of those test cases automated and passing (suite grew 481/51 → 492/52, via a new `src/lib/adminConsole.ts` pure-logic extraction mirroring the `src/lib/members.ts` pattern). **Cluster #2 (F2-05/06/07/09/11/12/13 — Work Item Explorer visuals/filters) is fully closed (2026-06-08)**: added `FR-225A–D` to `product/SRS.md`, anchored with a new `UC-088`/`SCN-044`/`UJ-028`, re-verified the three "Needs verification" items (F2-11/12/13 risk-path/largest-branch/blocked-filter) at the code level and promoted them to ✅ Done, and automated 6 new field-format-compatibility test cases `TC-FF-01–06` (new `fieldFormatCompat.test.ts`, suite grew 492/52 → 498/53 — no extraction needed, the relation-graph field accessors were already pure). **Cluster #3 (F4-05/06/08 — Smart Excel export sheets and trigger) is now fully closed too (2026-06-08)**: added `FR-310` (sheet-content rules) and `FR-311` (export-trigger contract — *originally numbered `FR-242`/`FR-243` at the time of this closure; renumbered 2026-06-08 after item-6 review found they collided with the pre-existing Addendum-A "Data Quality Score" `FR-242`/`FR-243` — see Gaps Summary item 6*) to `product/SRS.md`, anchored with a new `UC-089`/`SCN-045`/`UJ-029`, and automated 10 new test cases `TC-X-09a–TC-X-13b` (new `excelExportSheets.test.ts`, covering Risks & Blockers sort/suggested-actions, Orphan & Data Quality summary/detail/empty-state, Cycle & Lead Time percentile math and slowest-items ranking, Release Readiness Go/Conditional-Go/No-Go grouping, and the `exportToExcel` trigger with default/custom filenames — suite grew 498/53 → 508/54). Along the way, corrected a stale `product/TEST_CASES.md` §9 entry that described 6 *manual, Not-Run* `TC-X` cases not matching the 8 already-automated ones. **Cluster #4 (F1-07/08 — `src/types/throughput.ts` types and the `DashboardMetrics.throughput` field) is now fully closed too (2026-06-08)**: rather than declaring these "not independently traceable", anchored them to the existing `UC-043`/`SCN-012`/`UJ-010` that already consume the `ThroughputMetrics` data contract — extended `UC-043`'s Related-FR range from "FR-207 to FR-214" to "FR-207 to FR-215" with an explanatory note, added a `**Related:**` line to `SCN-012`, and automated 1 new shape-contract test case `TC-T-11` (in existing `throughput.test.ts`, now 11 tests, asserting `metrics.throughput` conforms to the full `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` contract — suite grew 508/54 → 509/54). **Cluster #5 (UX-02/03/05/11/13 — UX narrative residue) is now fully closed too (2026-06-08)**: investigation showed 3 of 5 matrix entries were *stale* (anchors already existed elsewhere — `UX-02` via `FR-271/272`/`UC-062`/`SCN-024`/`UJ-021`/`TC-DV-*`, `UX-05` via `UC-076`/`SCN-035`, `UX-11` via `FR-304`/`UC-081`/`TC-TC-*`) and just needed matrix correction plus the genuinely-missing pieces (`UJ-031` for UX-05; `SCN-047`/`UJ-032` for UX-11). `UX-13` was a partial gap (FR/TC existed, UC/SCN/UJ didn't — wrote new `UC-091`/`SCN-048`/`UJ-033`). `UX-03` (status chips) was the one true zero-anchor gap — extracted the cross-cutting `Chip`/`CHIP_CLS` severity system from `app/dashboard/page.tsx` into a new pure module `src/lib/dashboardChips.ts` (mirroring the `adminConsole.ts`/`members.ts` pattern), wrote new `FR-308`/`BR-112`, anchored with new `UC-090`/`SCN-046`/`UJ-030`, and automated `TC-CH-01–03`; also extracted `buildReportHtml()` out of `exportToHtml` so UX-05's branding markup could be automated as `TC-X-14` (new `exportUtilsHtml.test.ts`). Suite grew 509/54 → 513/56. The Section 12 matrix now has **zero** `GAP — not found` cells. **Cluster #6 (the cross-cutting FR↔UC bundling ambiguity) is now closed too (2026-06-08) — and with it, all of TRACE-01**: investigating the bundled `**Related FR**` ranges surfaced that the real problem wasn't bundling but **four genuine ID collisions** — duplicate `FR-242`/`FR-243` (one pair self-inflicted during cluster #3, unknowingly colliding with the pre-existing Addendum-A "Data Quality Score" FRs of the same numbers), duplicate `FR-235D` (an orphan second definition referenced nowhere by ID), duplicate `UC-043`/`UC-044` (stale pre-v3.0 use cases colliding with the current v3.0 ones the matrix anchors to), and a phantom `FR-309` referenced in `UC-083` but never defined. Renumbered the colliding/orphaned IDs to `FR-310`/`FR-311`/`FR-235H`/`UC-092`/`UC-093` (each annotated in place with the collision reason), wrote a correctly-scoped new `FR-309` documenting the bucket-backed metrics restore-and-fallback flow `UC-083` actually narrates, corrected `UC-083`'s `**Related FR**` line, and propagated every renumbering across `USE_CASES.md`/`SCENARIOS.md`/`TEST_CASES.md`/`RELEASE_NOTES.md`/`TODO-List.md`. Then built **TRACE-01 Appendix B** (the FR→UC Ownership Index, in Section 12 below the Gaps Summary) — expanding all 8 bundled ranges into individual FR IDs with their authoritative UC owner per the matrix, proving the remaining bundling was navigable shorthand, not ambiguity, once the collisions were gone. No code changed (documentation-only), so the suite remains **513/56**; lint and build remain clean. **TRACE-01 has zero `GAP — not found` cells, zero ID collisions, and is now ✅ Done.**

---

## 0. Operating Rule

Act as a senior cross-functional delivery/product team:

- Principal Software Engineer
- Senior Backend Engineer
- Senior Frontend Engineerx
- Software Architect
- DevOps Engineer
- Security Engineer
- QA Lead
- Business Analyst
- Product Owner
- Scrum Master
- Agile Coach
- UX/UI Designer
- Delivery Manager
- C-level technical advisor
- Patent-readiness advisor

Delivery Clarity is a confidential, private, self-hosted, zero-credential Jira analytics and delivery intelligence platform.  
Do not expose source code, algorithms, diagrams, patent language, credentials, product documents, or architecture details publicly.

---

## 1. Priority Model

> **Sequencing policy (updated 2026-06-08 by explicit user direction):** P0 work no longer strictly *blocks* P1–P4 work. Going forward, run P0 in **parallel and in balance** with P1/P2/P3/P4 — pick up whichever item best fits the moment rather than gating everything behind P0 closure first. P0 still carries the highest *priority weight* (when choosing between competing items, P0 wins), but it is no longer a hard sequencing gate that forces P1–P4 to sit idle. (Historical context: `TRACE-01`/`TRACE-02` — the two items that most justified strict gating — are both ✅ Done as of 2026-06-08, so the original blocking rationale has also largely resolved itself.)

| Priority | Meaning | Rule |
|---|---|---|
| P0 | Critical release-control gate | Highest priority weight — wins when choosing between competing items — but no longer a hard block on P1–P4 (balanced/parallel sequencing per 2026-06-08 direction). |
| P1 | Current product hardening / UX / internal architecture | May be picked up in parallel with P0; weigh against other open items rather than waiting for a full P0 close-out. |
| P2 | Product intelligence / forecasting / retrospective / architecture planning | May be picked up in parallel with P0/P1 when it's the best-fitting next item; still generally follows P1 stability or explicit approval as a design consideration, not a hard gate. |
| P3 | Future full external integrations | May be planned/started in parallel once P2 design direction exists; "do not start until P2 design is approved" is now a design dependency, not a sequencing block. |
| P4 | Future communication/governance layer | Planning may proceed in parallel with other priorities; implementation still needs explicit approval. |

---

## 2. Status Key

| Status | Meaning |
|---|---|
| ✅ Done | Completed, committed, pushed, documented, and verified |
| 🔍 Needs verification | Implemented or claimed, but must be rechecked |
| 🔧 In progress | Actively being worked on |
| ❌ Not started | No implementation yet |
| 🚫 Blocked | Waiting on dependency or approval |
| 📄 Planning only | Document/design only; no code |
| ⏸️ Deferred | Intentionally postponed |
| ⚠️ Conflict | Current docs/status disagree and must be reconciled |
| ⛔ Superseded | Replaced by a different approach before implementation; left visible with a pointer to its replacement rather than deleted, so the design history isn't lost |

---

## 3. Absolute Execution Rule

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ABS-01 | ~~Do not start new feature coding until P0 reconciliation is complete~~ Balance P0 work in parallel with P1–P4 (superseded 2026-06-08) | P0 | ✅ Superseded by explicit user direction | Original hard-gate rule replaced 2026-06-08: P0 (documentation alignment, traceability, product-folder impact review, test count normalization, release-candidate gate) now runs in **parallel and balance** with P1–P4 rather than blocking it outright — see Section 1 Priority Model sequencing-policy note. P0 retains the highest priority *weight* when choosing between competing items. |
| ABS-02 | Treat documentation as part of Definition of Done | P0 | ✅ Done / Permanent | Code cannot move ahead of product documentation. |
| ABS-03 | Keep export-first / zero-credential positioning strong | P0 | ✅ Permanent | Jira API and cloud integrations are optional/future. Core value remains upload/export-based private intelligence. |
| ABS-04 | Do not implement P3/P4 features without explicit approval | P0 | ✅ Permanent | Jira write-back, full Jira API, browser push, email/Slack/Teams channels, maintenance mode, PostgreSQL migration, and full CI/CD automation are controlled future work. |

---

## 4. P0 Mandatory Rule — No Product File Behind Code

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| DOC-GATE-01 | Review every file inside `product/` for every code change, commit, and push | P0 | ✅ Permanent | Includes SRS, BRD, Use Cases, User Journeys, Scenarios, Test Cases, Developer Guide, Release Notes, README, Algorithm Spec, Technical Method, Appendix, patent docs, and every other product file. |
| DOC-GATE-02 | Update every affected product document immediately | P0 | ✅ Permanent | Required when feature, route, API, role, UI, workflow, DB model, calculation, test, deployment, security, storage, admin, gateway, retrospective, template, or forecasting behavior changes. |
| DOC-GATE-03 | Mark unaffected product files as “Reviewed — No update required” | P0 | ❌ Not started | Must appear in the documentation impact matrix before push. |
| DOC-GATE-04 | Block push when product documentation impact check is incomplete | P0 | ✅ Permanent | Hard-stop output: `Push blocked: product documentation impact check is incomplete.` |
| DOC-GATE-05 | Block push when any product document is behind code | P0 | ✅ Permanent | Hard-stop output: `Push blocked: product documentation is behind code.` |
| DOC-GATE-06 | Update `/help` and `/developer` in-app docs when relevant | P0 | ✅ Permanent | Required for user-facing or developer-facing behavior changes. |
| DOC-GATE-07 | Update `TODO-List.md` on every roadmap/status/priority change | P0 | ✅ Permanent | TODO is a live execution-control document. |
| DOC-GATE-08 | Update `product/RELEASE_NOTES.md` for every meaningful change | P0 | ✅ Permanent | Release Notes must reflect actual code, docs, tests, and verification. |
| DOC-GATE-09 | Review patent docs when novelty/claim/prior-art positioning changes | P0/P2 | 🔍 Needs verification | Review `PATENT_DISCLOSURE.md`, `PRIOR_ART_COMPARISON.md`, and `CLAIM_CANDIDATE_MATRIX.md`; do not over-claim future features. |

---

## 5. Push Gate Checklist

Before every push, Claude must complete this checklist.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| PUSH-01 | Check `git status` | P0 | ✅ Permanent | Report branch and working tree status. |
| PUSH-02 | Review all changed code files | P0 | ✅ Permanent | Identify changed routes, APIs, services, UI, models, tests, and behavior. |
| PUSH-03 | Identify affected features/workflows | P0 | ✅ Permanent | Include feature, route, API, role, data model, UI screen, test, workflow, storage, gateway, retro, forecasting, admin, and security impacts. |
| PUSH-04 | Review every file in `product/` | P0 | ✅ Permanent | Must include all product docs and any additional files in the folder. |
| PUSH-05 | Update affected product docs | P0 | ✅ Permanent | No affected doc may remain behind code. |
| PUSH-06 | Mark unaffected product docs as reviewed | P0 | ❌ Not started | Required in impact matrix. |
| PUSH-07 | Update `TODO-List.md` | P0 | ✅ Permanent | Include new status, priority, sequencing, and blockers. |
| PUSH-08 | Update `product/RELEASE_NOTES.md` | P0 | ✅ Permanent | Include change, tests, known limitations, and verification status. |
| PUSH-09 | Update `product/TEST_CASES.md` | P0 | ✅ Permanent | Required when tests changed or should change. |
| PUSH-10 | Update `product/SRS.md` | P0 | ✅ Permanent | Required when scope, behavior, requirement, or acceptance criteria changes. |
| PUSH-11 | Update `product/USE_CASES.md` | P0 | ✅ Permanent | Required when user/admin/system behavior changes. |
| PUSH-12 | Update `product/USER_JOURNEYS.md` | P0 | ✅ Permanent | Required when user experience changes. |
| PUSH-13 | Update `product/SCENARIOS.md` | P0 | ✅ Permanent | Required when real-world behavior changes. |
| PUSH-14 | Update `product/DEVELOPER_GUIDE.md` | P0 | ✅ Permanent | Required when implementation, architecture, setup, package, API, or deployment behavior changes. |
| PUSH-15 | Update `product/BRD.md` | P0 | ✅ Permanent | Required when business capability, value, stakeholder expectation, or roadmap status changes. |
| PUSH-16 | Update `product/ALGORITHM_SPEC.md` | P0 | ✅ Permanent | Required when logic, formula, metric, inference, calculation, template parsing, retro analysis, or forecasting rule changes. |
| PUSH-17 | Update `product/TECHNICAL_METHOD.md` | P0 | ✅ Permanent | Required when architecture, gateway, storage, security, retrospective method, or forecasting method changes. |
| PUSH-18 | Update `product/APPENDIX.md` | P0 | ✅ Permanent | Required when terms, abbreviations, roles, statuses, providers, routes, storage keys, or definitions change. |
| PUSH-19 | Run lint/tests/build | P0 | ✅ Permanent | Required commands: `npm run lint`, `npm test`, `npm run build`. |
| PUSH-20 | Push only if code, tests, and product docs are aligned | P0 | ✅ Permanent | No exception. |

---

## 6. Required Product Documentation Impact Matrix

Use this exact matrix before every push. If any row is `Behind` or `Needs Review`, do not push.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/BRD.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/USE_CASES.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/USER_JOURNEYS.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/SCENARIOS.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/TEST_CASES.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/DEVELOPER_GUIDE.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/RELEASE_NOTES.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/README.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/ALGORITHM_SPEC.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/TECHNICAL_METHOD.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/APPENDIX.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/PATENT_DISCLOSURE.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/PRIOR_ART_COMPARISON.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| Any other `product/` file | Yes/No | Yes/No | ... | Done / Behind / Needs Review |

---

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #1 closure (F3-14/15/16), produced 2026-06-07

Scope of this change: added traceability anchors (UC-084/085/086, SCN-039–042, UJ-024–026, TC-AU-01–07/TC-MD-01–08/TC-PW-01–10) for three **already-shipped** features (Admin User Management, Member Directory, Forced First-Login Password Change). No FRs, routes, schemas, or UI behaviour changed — documentation-only.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | No | FR-235A–G already exist and describe these features; new UC/SCN/UJ/TC IDs reference them without altering any FR text. Searched for new ID ranges — no hits. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged; these are already-shipped features being retro-documented for traceability only. No ID-range index found referencing UC/SCN/UJ/TC. | Done |
| `product/USE_CASES.md` | Yes | Yes | Appended UC-084 (Admin Manages User Accounts), UC-085 (Browse Member Directory), UC-086 (Complete Forced First-Login Password Change) under new `## v4.2.2 — Admin & Member Management Use Cases (2026-06-07)` section, each with Related FR back-references (FR-235A/B/C/D/G). | Done |
| `product/SCENARIOS.md` | Yes | Yes | Appended SCN-039–042 (admin onboarding, admin self-lockout attempt, directory lookup, forced password setup) under new `## v4.2.2 — Admin & Member Management Scenarios (2026-06-07)` section, each linked to the new UC IDs and TC IDs. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Appended UJ-024–026 (admin onboarding/managing a teammate, directory lookup, forced password change) under new `## 10. v4.2.2 — Admin & Member Management Journeys (2026-06-07)` section with full step/emotional-state tables. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Appended `## 9.43 — Admin User Management, Member Directory, Forced Password Change (TC-AU, TC-MD, TC-PW)` mapping TC-AU-01–05/TC-MD-01–04/TC-PW-01–06 to existing automated tests (adminUsers.test.ts, roles.test.ts, auth.test.ts) and recording 14 ❌ Not Run gaps (TC-AU-06/07, TC-MD-05–08, TC-PW-07–10) with exact file/line references for future test-writing. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for new ID ranges and "through" index phrases — no references to UC/SCN/UJ/TC ID ranges found; nothing to update. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Traceability: Admin/Member/Password-Change Documentation (2026-06-07, P0 — documentation only)` describing the matrix compilation, the ~38% gap finding, cluster #1 closure with all new doc IDs, and remaining open gap clusters (#2–#5). | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec is unrelated to admin/member/password-change UI flows; no ID references found (0 hits for UC-0/SCN-0/UJ-0/TC-prefix). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G, lines 108–112) lists illustrative TC-prefix examples only (TC-T, TC-E, TC-A, TC-X) — confirmed not an exhaustive index, so new prefixes TC-AU/TC-MD/TC-PW do not require an entry. No UC/SCN/UJ ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/CLOUD_STORAGE_*` (none present) | N/A | N/A | No such files exist in `product/`; directory listing confirmed full set of 17 files reviewed above. | Done |

**Net result:** 5 of 17 product files updated (USE_CASES, SCENARIOS, USER_JOURNEYS, TEST_CASES, RELEASE_NOTES); 12 reviewed with no update required (confirmed via grep — no stale ID-range references exist anywhere in `product/`). TODO-List.md itself updated separately (TRACE-01 matrix rows + gap summary). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

---

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #2 closure (F2-05/06/07/09/11/12/13), produced 2026-06-08

Scope of this change: added 4 new FRs (`FR-225A–D`) plus traceability anchors (`UC-088`, `SCN-044`, `UJ-028`) for the Work Item Explorer's visual graph, risk-path, largest-branch, and blocked-filter behaviours; re-verified the three "Needs verification" items (F2-11/12/13) at the code level; and wrote/automated 6 new test cases (`TC-FF-01–06`) closing the only remaining untested behaviour (F2-09 field-format compatibility). No existing FRs, routes, schemas, or UI behaviour changed — the explorer code was already correct and shipped; this pass is documentation-plus-test-writing.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Inserted `FR-225A` (field-format dual compatibility), `FR-225B` (risk-path highlight), `FR-225C` (largest unfinished branch), `FR-225D` (blocked branch filter) immediately after `FR-225`, before the F3 section header — these four behaviours were implemented and shipped (v4.0/v3.0 Release Notes) but had never been written up as formal requirements. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged; these are already-shipped explorer behaviours being retro-documented for traceability only. No ID-range index found referencing UC/SCN/UJ/TC/FR. | Done |
| `product/USE_CASES.md` | Yes | Yes | Appended `UC-088` (Investigate Delivery Risk and Branch Health in the Work Item Explorer) under new `## v4.2.2 — Work Item Explorer Risk & Branch Insights Use Cases (2026-06-08)` section, with Alt Flow A (no-risk dataset) and Alt Flow B (mixed raw/FlowItem field formats) and Related FR back-references (`FR-225A–D`). | Done |
| `product/SCENARIOS.md` | Yes | Yes | Appended `SCN-044` (Delivery Manager Reads the Visual Graph and Filters to Risk) under new `## v4.2.2 — Work Item Explorer Risk & Branch Insights Scenarios (2026-06-08)` section — narrates node styling, orphan badges, all four `Relation*` panels, risk-path highlight, largest-branch insight, and the blocked-branch filter together in one session; linked to `UC-046`, `UC-088`, and the `TC-E`/`TC-RP`/`TC-LB`/`TC-BF` suites. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Appended `UJ-028` (Delivery Manager Investigates Risk Paths and Branch Health in the Explorer) under new `## 11. v4.2.2 — Work Item Explorer Risk & Branch Insights Journeys (2026-06-08)` section with full step/system-response/emotional-state table. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added `**Related:**` cross-reference lines to the existing `## F2 — Work Item Explorer Tests`, `## 9.18` (TC-RP), `## 9.19` (TC-LB), and `## 9.20` (TC-BF) sections pointing at the new `UC-088`/`SCN-044`/`UJ-028`/`FR-225B–D` anchors, then appended new `## 9.45 — Work Item Explorer Field-Format Compatibility (TC-FF-01 to TC-FF-06)` mapping all 6 cases to the new `fieldFormatCompat.test.ts` (all ✅ Automated, all passing). | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for new ID-range / "through" index phrases — no references to UC/SCN/UJ/TC/FR ID ranges found; nothing to update. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Traceability: Work Item Explorer Documentation (2026-06-08, P0 — documentation + test automation)` describing cluster #2 closure: 4 new FRs, `UC-088`/`SCN-044`/`UJ-028`, F2-11/12/13 re-verification and promotion from 🔍 to ✅, and the 6 new `TC-FF` test cases. | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec is unrelated to explorer UI/risk-path narrative flows; no ID references found (0 hits for UC-0/SCN-0/UJ-0/TC-prefix/FR-225). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G) lists illustrative TC-prefix examples only (TC-T, TC-E, TC-A, TC-X) — confirmed not exhaustive, so the new `TC-FF` prefix needs no entry. No UC/SCN/UJ/FR ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |

**Net result:** 5 of 17 product files updated (SRS, USE_CASES, SCENARIOS, USER_JOURNEYS, TEST_CASES) plus RELEASE_NOTES; 11 reviewed with no update required (confirmed via grep — no stale ID-range references exist anywhere in `product/`). TODO-List.md itself updated separately (Section 12 matrix rows F2-05/06/07/09/11/12/13, Gaps Summary item 2, Section 13 F2-11/12/13/F2-TRACE statuses, header). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #3 closure (F4-05/06/08), produced 2026-06-08

Scope of this change: added 2 new FRs (`FR-310`, `FR-311` — *numbered `FR-242`/`FR-243` at the time of this entry; renumbered 2026-06-08 after they were found to collide with pre-existing Addendum-A "Data Quality Score" FRs of the same IDs, see Section 12 Gaps Summary item 6*) plus traceability anchors (`UC-089`, `SCN-045`, `UJ-029`) for the Smart Excel export's Risks & Blockers / Orphan & Data Quality / Cycle & Lead Time / Release Readiness sheet contracts and the dashboard/`/summary` export-trigger flow; and wrote/automated 10 new test cases (`TC-X-09a–TC-X-13b`) closing the only remaining untested sheets and the trigger wiring (F4-05/06/08). Along the way, discovered and corrected a stale `product/TEST_CASES.md` table that described 6 *manual, Not-Run* `TC-X` cases not matching the 8 cases already automated in `excelExport.test.ts`. No existing FRs, routes, schemas, or UI behaviour changed — the export sheets and trigger were already implemented and shipped; this pass is documentation-plus-test-writing.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Inserted `FR-310` (Risks & Blockers / Orphan & Data Quality / Cycle & Lead Time / Release Readiness sheet-content contract — derivation from `DashboardMetrics.flow.items`, sort orders, suggested-action tiers, percentile math, Go/Conditional-Go/No-Go grouping) and `FR-311` (export-trigger contract — dashboard sticky bar and `/summary` page Export controls, default filename `delivery-clarity-report.xlsx`, silent onboarding-step recording) immediately after `FR-241`, before the next section header — these behaviours were implemented and shipped but had never been written up as formal requirements. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged; these are already-shipped export behaviours being retro-documented for traceability only. No ID-range index found referencing UC/SCN/UJ/TC/FR. | Done |
| `product/USE_CASES.md` | Yes | Yes | Appended `UC-089` (Trigger and Review the Smart Excel Workbook from the Dashboard or Summary Page) under new `## v4.2.2 — Smart Excel Export Sheet & Trigger Use Cases (2026-06-08)` section, with Main Flow steps covering each of the four previously-untested sheets, Alt Flow A (healthy dataset, no risk/orphans) and Alt Flow B (onboarding tracking unavailable), and Related FR back-references (`FR-236`, `FR-310`, `FR-311`). | Done |
| `product/SCENARIOS.md` | Yes | Yes | Appended `SCN-045` (Product Owner Exports the Smart Workbook for an Offline Release Review) under new `## v4.2.2 — Smart Excel Export Sheet & Trigger Scenarios (2026-06-08)` section — narrates the trigger, then a read-through of Risks & Blockers, Orphan & Data Quality, Cycle & Lead Time, and Release Readiness, ending with forwarding the file; linked to `UC-049`, `UC-089`, `FR-236`, `FR-310`, `FR-311`, and `TC-X-09–TC-X-13b`. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Appended `UJ-029` (Product Owner Exports and Reads the Smart Workbook for an Offline Review) under new `## 12. v4.2.2 — Smart Excel Export Sheet & Trigger Journeys (2026-06-08)` section with full step/system-response/emotional-state table. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Replaced the stale `### F4 — Excel Export Tests (manual)` table (6 rows, IDs `TC-X-01–06`, all "Not Run" — none of which matched the actual automated suite) with a corrected `### F4 — Excel Export Tests (automated — excelExport.test.ts, excelExportSheets.test.ts)` table listing all 18 real `TC-X-01–13b` cases as ✅ Pass, plus a `**Related:**` line pointing at `UC-049`, `UC-089`, `SCN-016`, `SCN-045`, `UJ-013`, `UJ-029`, `FR-236`, `FR-310`, `FR-311`. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for new ID-range / "through" index phrases — no references to UC/SCN/UJ/TC/FR ID ranges found; nothing to update. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Cluster #3 Closure: Smart Excel Export Sheets & Trigger (2026-06-08, P0 — documentation + test coverage)` describing: `FR-310`/`FR-311` additions, `UC-089`/`SCN-045`/`UJ-029`, the 10 new `TC-X-09a–13b` automated tests, the corrected stale `TEST_CASES.md` table, and the suite growth 498/53 → 508/54. | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec already documents the percentile formula at the implementation level; no UC/SCN/UJ/TC/FR ID-range references found needing update (0 hits for UC-0/SCN-0/UJ-0/TC-X/FR-310/FR-311). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G) lists illustrative TC-prefix examples only (TC-T, TC-E, TC-A, TC-X) — confirmed not exhaustive, so the new `TC-X-09a–13b` sub-IDs need no entry. No UC/SCN/UJ/FR ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |

**Net result:** 5 of 17 product files updated (SRS, USE_CASES, SCENARIOS, USER_JOURNEYS, TEST_CASES) plus RELEASE_NOTES; 11 reviewed with no update required (confirmed via grep — no stale ID-range references exist anywhere in `product/`). TODO-List.md itself updated separately (Section 12 matrix rows F4-05/06/08, Gaps Summary item 3, Section 13 F4-TRACE status, header). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #4 closure (F1-07/08), produced 2026-06-08

Scope of this change: closed the smallest remaining TRACE-01 gap — `src/types/throughput.ts` (F1-07, the `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` types) and `DashboardMetrics.throughput` (F1-08, required by `FR-215`) had zero UC/SCN/UJ/TC anchoring, only being named in Release Notes. Rather than declaring them "implementation detail — not independently traceable" (the matrix's alternative option), anchored them to the `UC-043`/`SCN-012`/`UJ-010` flow that already consumes this exact data contract through the Throughput & Delivery Analytics panels — extending `UC-043`'s Related-FR range and adding a `**Related:**` line to `SCN-012` — and wrote one new shape-contract test `TC-T-11` proving `metrics.throughput` conforms to `ThroughputMetrics`. No existing FRs, routes, schemas, or UI behaviour changed — the types and field were already implemented and shipped (v3.0); this pass is documentation-plus-test-writing.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | No | `FR-215` already exists and fully specifies the `throughput: ThroughputMetrics` contract; no new FR needed — this gap was a missing UC/SCN/UJ/TC anchor, not a missing requirement. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged; `throughput` is an already-shipped data-model detail being retro-anchored for traceability only. No ID-range index found referencing UC/SCN/UJ/TC/FR. | Done |
| `product/USE_CASES.md` | Yes | Yes | Extended `UC-043`'s `**Related FR**` line from "FR-207 to FR-214" to "FR-207 to FR-215", with an explanatory clause naming `SprintThroughputPanel`/`MidSprintDeliveryPanel`/`KanbanThroughputPanel` as the consumers of the `metrics.throughput: ThroughputMetrics` bundle that `FR-215` requires, and pointing at `TC-T-11` for the shape-contract test. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Added a `**Related:**` line to `SCN-012` (`UC-043, UJ-010, FR-207–FR-215, TC-T-01–TC-T-11`) — the first such anchor line on this older scenario, matching the convention already used on 23 other scenarios. | Done |
| `product/USER_JOURNEYS.md` | Yes | No | `UJ-010` (Sprint Throughput Review Journey) already walks through the exact same panels driven by `metrics.throughput`; User Journeys in this document don't carry `**Related:**` footer lines (0 of the existing entries do), so no edit was needed — the matrix anchor itself is sufficient. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added `TC-T-11` row to the `### F1 — Throughput Formula Tests` table (asserting `calculateDashboardMetrics(issues).throughput` matches the `ThroughputMetrics` shape per `FR-215`), a new `**Related:**` line (`UC-043, SCN-012, UJ-010, FR-207–FR-215`), and updated the `throughput.test.ts` row in the suite-overview table from "10" to "11" tests. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for new ID-range / "through" index phrases — no references to UC/SCN/UJ/TC/FR ID ranges found; nothing to update. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Cluster #4 Closure: Throughput Data-Contract Anchoring (2026-06-08, P0 — documentation + test coverage)` describing: the `UC-043`/`SCN-012` anchor extensions, the new `TC-T-11` shape-contract test, and the suite growth 508/54 → 509/54. | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec already documents the throughput formulas at the implementation level; no UC/SCN/UJ/TC/FR ID-range references found needing update (0 hits for UC-0/SCN-0/UJ-0/TC-T/FR-215). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G) lists illustrative TC-prefix examples only — `TC-T` is already one of them, so no entry update is needed for `TC-T-11`. No UC/SCN/UJ/FR ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |

**Net result:** 3 of 17 product files updated (USE_CASES, SCENARIOS, TEST_CASES) plus RELEASE_NOTES; 13 reviewed with no update required — including `USER_JOURNEYS.md` and `SRS.md`, where the existing `UJ-010` and `FR-215` already fully covered this data contract and only needed to be cross-referenced, not changed (confirmed via grep — no stale ID-range references exist anywhere in `product/`). TODO-List.md itself updated separately (Section 12 matrix rows F1-07/08, Gaps Summary item 4, Section 13 F1-TRACE/TRACE-01/NEXT-01 statuses, header). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

---

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #5 closure (UX-02/03/05/11/13), produced 2026-06-08

Scope of this change: closed the final TRACE-01 gap cluster — the "UX narrative residue" punch-list item covering 5 UX features whose Section 12 matrix cells showed `GAP — not found`. Investigation found the gaps were a *mix*: `UX-02` (Default open sections), `UX-05` (HTML export redesign), and `UX-11` (Theme customization) had **stale matrix cells** — their UC/SCN/UJ/TC anchors already existed in the docs (`UC-062`/`SCN-024`/`UJ-021`/`TC-DV-*`; `UC-076`/`SCN-035`; `UC-081`/`TC-TC-*` respectively) and just weren't cross-referenced in the matrix, plus a few genuinely-missing pieces (`UJ-031`; `SCN-047`/`UJ-032`). `UX-13` (Chart customization) had its FR/TC anchored but no UC/SCN/UJ. `UX-03` (Status chips) was the one **true zero-anchor gap** — a cross-cutting visual convention (`Chip`/`CollapsibleTrigger`/`CHIP_CLS`, ~16 dashboard sections) computed entirely inline in `app/dashboard/page.tsx` with no pure-logic extraction and no FR/UC/SCN/TC anywhere. Per the user's explicit choice ("Extract + test"), extracted the chip severity-mapping logic to a new pure module `src/lib/dashboardChips.ts` (mirroring the `adminConsole.ts`/`members.ts` pattern), wrote a new `FR-308`/`BR-112` documenting the convention as a contract, and anchored it with new `UC-090`/`SCN-046`/`UJ-030`/`TC-CH-01–03`. Also did a minimal, behaviour-preserving extraction of `buildReportHtml()` out of `exportToHtml` (in `src/lib/exportUtils.ts`) so UX-05's redesigned branding markup could be automated as `TC-X-14` without a DOM. No existing FRs, routes, schemas, or shipped UI behaviour changed for UX-02/05/11/13 — those were documentation-only passes; UX-03 and UX-05 each involved one small, additive, non-breaking pure-module extraction plus new tests.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Added `FR-308` (A.20 — v4.1 UX Design System) specifying the 5-tier status-chip severity convention (`critical`/`warning`/`info`/`good`/`neutral`) and its shared style-lookup requirement. `FR-271/272`, `FR-300`, `FR-304`, `FR-306` were already correct and complete — no edits needed to them. | Done |
| `product/BRD.md` | Yes | Yes | Added `BR-112` — the scanability/time-to-insight business justification for status chips on ~16 collapsed dashboard sections. `BR-094`, `BR-105`, `BR-108`, `BR-110` already existed and needed no change. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added two new use cases: `UC-090` (Scan Section Health via Status Chips Before Expanding — UX-03) and `UC-091` (User Personalises the Charts Page Layout — UX-13). `UC-062`, `UC-076`, `UC-081` were already correct and complete; the matrix cells referencing them as "GAP — not found" were simply stale. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Added three new scenarios: `SCN-046` (Scrum Master Triages a Long Dashboard by Chip Colour Alone — UX-03), `SCN-047` (Engineering Manager Personalises the App to Match Her Team's Brand Colour — UX-11), `SCN-048` (Director Reshapes the Charts Page Around the Two Metrics That Matter to the Board — UX-13). `SCN-024` and `SCN-035` already existed and needed no change — only the matrix's stale "GAP — not found" cells pointing at them were wrong. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Added four new user journeys: `UJ-030` (Scrum Master Triages the Dashboard by Chip Colour — UX-03), `UJ-031` (Stakeholder Receives and Trusts a Branded HTML Report — UX-05), `UJ-032` (Engineering Manager Personalises the App's Look and Feel — UX-11), `UJ-033` (Director Curates the Charts Page for a Board Presentation — UX-13). `UJ-021` already existed and needed no change. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added new `## 9.46 — Dashboard Section Status Chips (TC-CH-01 to TC-CH-03)` table (3 tests against the new `src/lib/dashboardChips.ts`), and a new `TC-X-14` row (HTML export branding, against the new `buildReportHtml()`) with an updated `**Related:**` line in the existing F4 export-trigger table. `TC-DV-*`, `TC-TC-*`, `TC-CC-*` rows were already correct. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for ID-range / "chip"/"theme customizer"/"chart customizer"/"buildReportHtml" references — none found that needed updating; the document describes architecture at a level above individual UC/SCN/TC anchors. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Cluster #5 Closure: UX Narrative Residue (UX-02/03/05/11/13) (2026-06-08, P0 — documentation + test coverage)` describing the stale-matrix corrections, the new `FR-308`/`BR-112`, the `dashboardChips.ts` and `buildReportHtml()` extractions, the 4 new automated tests, and the suite growth 509/54 → 513/56. | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found needing update. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found (0 hits for the new IDs); chip/theme/chart customization are UI conventions, not scoring algorithms. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G) lists illustrative TC-prefix examples only; `TC-CH` and `TC-X` patterns already fit the existing illustrative scheme — no entry update required. No UC/SCN/UJ/FR ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |

**Net result:** 6 of 17 product files updated (SRS, BRD, USE_CASES, SCENARIOS, USER_JOURNEYS, TEST_CASES) plus RELEASE_NOTES; 11 reviewed with no update required. This is the largest single-pass documentation footprint of the five TRACE-01 closures because cluster #5 contained the *only* true zero-anchor gap (UX-03) found across the entire matrix — every other cluster's gaps were either missing-anchor-on-existing-flow (cluster #4 pattern) or fully-absent-but-narratable (clusters #1–#3, UX-13). TODO-List.md itself updated separately (Section 12 matrix rows UX-02/03/05/11/13, Gaps Summary item 5, Section 13 UX-TRACE/TRACE-01/NEXT-01 statuses, header, progress paragraph). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change — and, with this cluster closed, the Section 12 matrix has **zero** remaining `GAP — not found` cells.

---

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #6 (FR↔UC ID-collision cleanup), produced 2026-06-08

Scope of this change: documentation-only — resolved four genuine ID collisions (`FR-242`/`FR-243` duplicate pair, orphan `FR-235D`, stale `UC-043`/`UC-044`, phantom `FR-309`) found while investigating the "bundled FR range" ambiguity flagged as Gaps Summary item 6. Renumbered colliding/orphaned IDs to `FR-310`/`FR-311`/`FR-235H`/`UC-092`/`UC-093`, wrote a correctly-scoped new `FR-309`, corrected `UC-083`'s Related-FR line, propagated every renumbering across five documents, and built TRACE-01 Appendix B (the FR→UC Ownership Index). No code changed; no tests changed; suite remains 513/56.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Renumbered the two cluster #3 FRs (`FR-242`→`FR-310`, `FR-243`→`FR-311`) with explanatory collision notes; wrote new correctly-scoped `FR-309` (bucket-backed metrics restore-and-fallback) to resolve the phantom reference in `UC-083`; renumbered orphan `FR-235D` (dashboard-view role-locking) to `FR-235H`. | Done |
| `product/BRD.md` | Yes | No | No FR/UC/SCN/UJ/TC ID-range references in BRD that referenced the renamed IDs; no update required. | Done |
| `product/USE_CASES.md` | Yes | Yes | Updated `UC-089`'s Related-FR line (`FR-242`→`FR-310`, `FR-243`→`FR-311`); corrected `UC-083`'s Related-FR line to `FR-307, FR-309` (removed stale `FR-308`); renumbered stale pre-v3.0 `UC-043`/`UC-044` to `UC-092`/`UC-093` with explanatory annotation on each. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Updated `SCN-045`'s Related references (`FR-242`→`FR-310`, `FR-243`→`FR-311`). | Done |
| `product/USER_JOURNEYS.md` | Yes | No | No direct references to the renamed FR IDs found (0 hits for `FR-242`, `FR-243`, `FR-235D`, `FR-309`). | Done |
| `product/TEST_CASES.md` | Yes | Yes | Updated the F4 Excel Export `**Related:**` line (`FR-242`→`FR-310`, `FR-243`→`FR-311`). | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | No FR/UC ID references found that referenced the renamed IDs (0 hits). | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Updated the cluster #3 section's FR references (`FR-242`→`FR-310`, `FR-243`→`FR-311`) with an explanatory renumbering footnote preserving the historical record. | Done |
| `product/README.md` | Yes | No | No FR/UC ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | No FR/UC ID-range references found (0 hits for renamed IDs). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no FR/UC ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | Glossary covers TC-prefix illustrative examples only; no FR/UC ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no FR/UC ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no FR/UC ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no FR/UC ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no FR/UC ID references found (0 hits). | Done |

**Net result:** 4 of 16 product files updated (SRS, USE_CASES, SCENARIOS, RELEASE_NOTES) plus TEST_CASES; 11 reviewed with no update required. No code changed; suite remains 513/56. TODO-List.md itself updated separately (Section 12 matrix rows F4-05/06/08, Gaps Summary item 6, Appendix B, header, progress paragraphs). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change — and with it TRACE-01 has zero `GAP — not found` cells, zero ID collisions, and is ✅ Done.

---

### Filled Documentation Impact Matrix — GW-01–GW-25 Backend Integration Gateway Foundation, produced 2026-06-09

Scope of this change: implemented a new server-only backend integration gateway module suite (`src/server/gateway/` — `types.ts`, `endpointPolicy.ts`, `retryPolicy.ts`, `gatewayLogger.ts`, `providerRegistry.ts`, `externalGateway.ts`), 23 automated tests (`src/__tests__/gateway.test.ts`, TC-GW-01–GW-21 + TC-GW-05b/TC-GW-15b), and updated four product docs (`DEVELOPER_GUIDE.md` — new gateway architecture section; `SRS.md` — FR-313 + §8.1 note; `USE_CASES.md` — cross-reference note; `RELEASE_NOTES.md` — v4.3 entry). The gateway is **server-only**: no new UI routes, no new user-facing screens, no Prisma schema changes, no algorithm changes. Test suite grew from 527/60 to 550/61.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Added `FR-313` (P1 — Backend Integration Gateway) to §4 (Non-Functional Requirements — Architecture) documenting the gateway's chokepoint contract, SSRF/host-allowlist/https-only/path-traversal endpoint validation, 10s timeout, 2-retry exponential backoff, JSONL audit logging, and secret redaction; also added a §8.1 note alongside the API route inventory cross-referencing the new `src/server/gateway/` module suite. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged — the gateway is a server-side infrastructure hardening item with no new business capability visible to users or stakeholders, no new business rules, and no change to the product roadmap scope described in the BRD. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added a cross-reference note (under the existing COVER-17 roadmap note) clarifying that the gateway module is now implemented as a server-only foundation (`GW-01–GW-25`); no new UC authored because the gateway has no direct user-facing flow — user-visible gateway use cases will be added when external-call features (Jira API integration, etc.) are implemented per COVER-17. | Done |
| `product/USER_JOURNEYS.md` | Yes | No | Server-only change — no new user touchpoints, screens, or journeys. No gateway-related user journey exists or is needed at this stage. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/SCENARIOS.md` | Yes | No | Server-only change — no new real-world scenarios. The gateway operates transparently beneath future external-call features; no scenario document is needed until a user-visible external integration exists. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added new `## 9.49 — Backend Integration Gateway Foundation (TC-GW-01 to TC-GW-21 + TC-GW-05b + TC-GW-15b)` section documenting all 23 automated gateway tests across five sub-tables (Endpoint Policy & SSRF Protection, Retry Policy, Gateway Logger & Redaction, Provider Registry, External Gateway end-to-end flow), each row mapping the TC-GW-ID to its spec file, tested behaviour, and ✅ Automated status, with a `**Related:** FR-313` footer. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | Yes | Added a new "Backend Integration Gateway (Implemented — Foundation, v4.3)" section documenting the config-file-driven design, security model (SSRF/host-allowlist/https-only/traversal), retry/backoff/timeout policy, JSONL audit strategy, `callExternal<T>()` usage contract, the six module files, and the test coverage entry point — all server-side architecture details with no frontend exposure. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.3 — Backend Integration Gateway Foundation (GW-01–GW-25, 2026-06-08, P1 — Architecture Hardening)` describing the six new gateway modules, FR-313, 23 new tests, suite growth 527/60 → 550/61, and the server-only/no-UI scope boundary. | Done |
| `product/README.md` | Yes | No | README describes the product at the user-facing feature level; the gateway is an internal infrastructure module invisible to users. Searched for "gateway", "GW", "FR-313" — 0 hits confirming no stale references. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec covers delivery-metric calculation algorithms (throughput, cycle time, health scoring, etc.) — the gateway is not an algorithm; it is a network-call infrastructure layer. No algorithm or formula changed. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document describes the product's eight technical methods (export ingestion, normalisation, hierarchy reconstruction, health scoring, etc.); none of those methods changed. The gateway is future-plumbing, not a currently-claimed novel method. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/APPENDIX.md` | Yes | No | Abbreviations/glossary; "GW" prefix is a TODO item-ID convention already present in the document's ID-prefix table. No new abbreviation or term was introduced that isn't already listed. Searched for stale "gateway" definitions — none found requiring update. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; the gateway is server infrastructure and not a novel technical method being claimed. No patent claims or disclosure language changed. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no change to the product's differentiating capabilities claimed relative to prior art. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; the gateway is not a patentable claim candidate at this stage (standard security-hardening infrastructure). Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; the gateway operates as a server-side module within the existing Next.js app — no new Docker/VPS/environment variable, no new deployment step. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |

**Net result:** 4 of 16 product files updated (SRS, USE_CASES, DEVELOPER_GUIDE, RELEASE_NOTES) plus TEST_CASES (new §9.49 gateway test section); 11 reviewed with no update required (confirmed via grep — no stale gateway/GW/FR-313 references exist anywhere in the non-updated product files). No UC/SCN/UJ documents required updates because the gateway is server-only with no user-facing flows. TODO-List.md itself updated separately (Section 14 GW-01–GW-25 table, Section 26 NEXT-03/NEXT-06 statuses, Section 27 release status note, header). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

---

### Filled Documentation Impact Matrix — USERREQ-07–14, USERREQ-28 User Add-Member Request Workflow, produced 2026-06-09

Scope of this change: Prisma schema additions (`UserAddRequest` model, `Notification` model, two new `User` back-reference relations), five new Next.js API route handlers (`app/api/user-add-requests/route.ts`, `app/api/user-add-requests/mine/route.ts`, `app/api/admin/user-add-requests/route.ts`, `app/api/admin/user-add-requests/[id]/accept/route.ts`, `app/api/admin/user-add-requests/[id]/reject/route.ts`), and 14 automated tests (`src/__tests__/userAddRequests.test.ts`, TC-REQ-01–14). New FRs FR-314–FR-319 (SRS Addendum B), UC-095/UC-096 (USE_CASES), TEST_CASES §9.50. Suite grew from 550/61 to 564/62.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Added `Addendum B — v4.4 User Add-Member Request Workflow (2026-06-09, P1)` with FR-314 (`UserAddRequest` schema), FR-315 (`Notification` schema), FR-316 (`POST /api/user-add-requests`), FR-317 (`GET .../mine`), FR-318 (`GET /api/admin/user-add-requests`), FR-319 (accept + reject PATCH actions). Updated §8.1 API route inventory with 5 new rows. Updated document version to 4.4.0 and revision history. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged — the user add-member workflow is a P1 internal team workflow enhancement with no new business capability visible at the BRD level (it enables admin-controlled user onboarding, already described at the BRD level). No BRD ID-range references to the new FR-314–319 range found. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added `## v4.4 — User Add-Member Request Workflow Use Cases (2026-06-09, P1)` with UC-095 (Submit a User Add-Member Request) and UC-096 (Admin Reviews and Acts on User Add-Member Requests). Updated Out-of-scope note (User Add-Member Workflow is now in scope/implemented). Updated version to 4.4.0 and revision history. | Done |
| `product/USER_JOURNEYS.md` | Yes | No | No user journey authored at this stage — the UI widget (requester button + modal) and admin queue page are not yet built (USERREQ-16–27 remain ❌ Not started). Writing a UJ for a half-built UI flow would be speculative documentation. UJ will be authored when USERREQ-16/19/20 (modal + queue UI) are implemented. | Done |
| `product/SCENARIOS.md` | Yes | No | Same rationale as USER_JOURNEYS — no end-to-end user-session scenario can be written accurately without the UI. The API backend is built; the scenario depends on the UI interaction. SCN will be authored with the UI pass. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added `## 9.50 — User Add-Member Request Workflow (TC-REQ-01 to TC-REQ-14)` with 14 test rows covering all five routes and all key guard conditions. All marked ✅ Automated — `userAddRequests.test.ts`. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | The gateway architecture section already covers the server-routing pattern. The new routes follow exactly the same `getIronSession`/`prisma`/`auditEvent` pattern as existing admin routes (`app/api/admin/users/route.ts`) — no new architectural convention to document. No stale references found. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.4 — USERREQ-07–14, USERREQ-28: User Add-Member Request Workflow — Backend Foundation (2026-06-09, P1)` with full scope description, schema additions, route list, test count, and product-docs coverage. | Done |
| `product/README.md` | Yes | No | README describes user-facing features; the request workflow has no UI surface yet. No stale references to the new FR/UC range found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | No new metric calculation or algorithmic formula was introduced — `generateTempPassword()` is a simple random-string generator, not a domain algorithm. No stale references found. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; the user add-request workflow is a standard CRUD/approval pattern with no novel technical method being claimed. No stale references found. | Done |
| `product/APPENDIX.md` | Yes | No | Abbreviations/glossary; no new abbreviation or prefix was introduced beyond `TC-REQ` (already follows the established TC-prefix convention; not an exhaustive index). No stale references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no novel claim is being made for a standard approval workflow. No stale references found. | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison; no new differentiating capability vs. prior art introduced. No stale references found. | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; standard CRUD approval workflow is not a patent candidate. No stale references found. | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; the new Prisma models require a `prisma migrate dev` / `prisma db push` on first deploy — this is the existing Prisma migration procedure already documented. No new Docker/env var/deployment step required. No stale references found. | Done |

**Net result:** 4 of 16 product files updated (SRS, USE_CASES, RELEASE_NOTES, TEST_CASES); 12 reviewed with no update required (confirmed — no stale USERREQ/FR-31x/UC-09x/TC-REQ references in non-updated files). USER_JOURNEYS and SCENARIOS intentionally skipped at this stage: UI not yet built; writing journey/scenario docs for an API-only backend would be speculative. These will be updated when USERREQ-16–20 (UI modal, admin queue, requester history widget) are implemented. TODO-List.md itself updated separately (USERREQ-07–14/28 status rows, header, impact matrix). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

---

### Filled Documentation Impact Matrix — v4.5 USERREQ UI (FR-320–324, UC-097–099, UJ-034, SCN-049, TC-NOTIF/TC-REQ-15/16), produced 2026-06-09

Scope of this change: shipped the full USERREQ UI layer — `RequestAddMemberModal` (Members page, non-admin), `UserAddRequestsPanel` (Admin Settings → Member Requests tab with mandatory admin-entered temp password), `GET /api/notifications` + `PATCH /api/notifications/[id]/read`, `NotificationBell` (AppShell header, pulsing badge + amber admin strip), and bulk user management (multi-select checkboxes, bulk role change, bulk delete). Updated FR-319 (temp password now admin-supplied, not auto-generated). Added 7 new tests (TC-NOTIF-01–05 in new `notifications.test.ts`, TC-REQ-15/16 in existing `userAddRequests.test.ts`). Test suite grew 564/62 → 571/63.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Updated FR-319: temp password now admin-supplied (HTTP 400 if missing/weak), response echoes `tempPassword`. Added Addendum C: FR-320 (request modal), FR-321 (admin queue panel + mandatory temp password), FR-322 (notification APIs), FR-323 (notification bell component), FR-324 (bulk user management). Updated §8.1 API route inventory: added GET /api/notifications and PATCH /api/notifications/[id]/read. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged — all v4.5 items are UI implementation of the in-scope user onboarding workflow already described at the BRD level. No new capability or stakeholder expectation introduced. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added v4.5 section with UC-097 (non-admin submits request via Members page), UC-098 (admin reviews/accepts with mandatory temp password), UC-099 (user receives and reads in-app notification). Updated out-of-scope note from prior USERREQ-07–14 matrix (USER_JOURNEYS/SCENARIOS now complete). | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Added UJ-034 (Scrum Master requests a new team member and receives in-app notification) — previously deferred at USERREQ-07–14 stage because UI was not yet built; now written with complete UI context. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Added SCN-049 (Scrum Master spots notification banner, reviews temp password, onboards new developer; admin's mandatory-password accept flow narrated end-to-end) — previously deferred for same reason as UJ-034. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added §9.51 (TC-NOTIF-01–05 — GET and PATCH notification API tests in `notifications.test.ts`) and §9.52 (TC-REQ-15–16 — missing/weak tempPassword → 400 in `userAddRequests.test.ts`). Updated TC-REQ-10 row note to reflect `body.tempPassword` assertion. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | Yes | Added "In-App Notification Bell and APIs (Implemented — v4.5)" section (API routes, component location, polling pattern, amber strip). Added "User Management — Multi-Select Bulk Operations" note (Set state, indeterminate checkbox, bulk action bar, filter-change clear). | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Prepended `## v4.5` entry covering all FR-320–324 additions, FR-319 update, new test count (571/63), and doc coverage. | Done |
| `product/README.md` | Yes | No | README describes user-facing features at a high level; no mention of request workflow or notification bell that would need updating. No stale references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | No algorithmic formula or scoring logic changed — notification bell polling interval (30s) and temp password strength check (≥8/uppercase/digit) are UX/auth policy, not domain algorithms. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; none of the eight technical methods (export ingestion, normalisation, health scoring, etc.) changed. No new novel method claimed. | Done |
| `product/APPENDIX.md` | Yes | No | No new abbreviation, term, document-code prefix (TC-NOTIF follows the established pattern), or role introduced that requires a glossary entry. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing; the request/notification/bulk-management workflow is standard enterprise CRUD with no novel claim. | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | No new differentiating capability vs. prior art introduced; the workflow pattern (admin-controlled user onboarding + in-app notifications) is conventional. | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | No new patent claim candidate introduced. | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment unchanged — `NotificationBell` and `UserAddRequestsPanel` are client-side React components, no new env var, Docker config, or migration step required (DB migration for `UserAddRequest`/`Notification` was done in the USERREQ-07–14 pass). | Done |

**Net result:** 7 of 16 product files updated (SRS, USE_CASES, USER_JOURNEYS, SCENARIOS, TEST_CASES, DEVELOPER_GUIDE, RELEASE_NOTES); 9 reviewed with no update required. This is the largest single-pass USERREQ documentation closure — it completes the previously-deferred USER_JOURNEYS and SCENARIOS, adds the SRS Addendum C formalising the UI layer, and fully closes the COVER-18 coverage row. TODO-List.md updated (USERREQ status rows 01–06/15–24/26/29/30, COVER-18, header, this matrix). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

### Filled Documentation Impact Matrix — RBC-01–20 Role-Based Delivery Coaching Insights (FR-346–352, UC-114, UJ-039, SCN-057/058, TC-RBC-01–09), produced 2026-06-23

Scope of this change: shipped the full Role-Based Delivery Coaching Insights feature — `src/types/roleBasedCoaching.ts`, `src/services/coaching/` (ceremony advice, confidence aggregation, 7 category generators, admin operational signals, orchestrator), new `GET /api/coaching/admin-signals`, new `/dashboard/coaching` route + `CoachingInsightCard`/`CoachingCategoryTabs` components, nav registration in `DashboardNavSidebar.tsx`. Pure interpretation layer over the already-computed `DashboardMetrics` — no new domain calculations. 20 new tests (`TC-RBC-01`–`09` + edge cases). Test suite grew 669/70 → 689/71.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Added Addendum H: FR-346 (role→category mapping), FR-347 (generator contract), FR-348 (admin signals route), FR-349 (ceremony advice), FR-350 (confidence formula), FR-351 (severity formula), FR-352 (dashboard UI). Revision history row v4.10.0. | Done |
| `product/BRD.md` | Yes | Yes | Added a "Done" line to Future Scope (P2/P3/P4 Roadmap) for Role-Based Delivery Coaching Insights — this was always listed as a P1 roadmap item in TODO-List.md Section 16, not a BRD scope change; the BRD line just reflects it shipped. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added UC-114 (User Views Role-Based Coaching Insights), including the Admin-signals alternate flow and the low-confidence-fallback alternate flow. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Added UJ-039 (User Reviews Role-Based Coaching Insights), covering the single-category path, the Manager tab-switch path, and the Admin operational-signals path. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Added SCN-057 (Scrum Master sees evidence-cited blocker coaching) and SCN-058 (coaching confidence falls back safely on thin data). | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added §9.60 mapping `TC-RBC-01`–`09` plus 4 edge cases to `src/__tests__/roleBasedCoaching.test.ts`. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | Yes | Added "Role-Based Delivery Coaching Insights (Implemented — v4.10.0)" section: module layout, types, the `calculateReleaseReadiness()`/`FlowItem` data-shape constraint discovered during implementation, route, components, testing. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Prepended `## v4.10.0` entry covering the feature, the role→category mapping decision, the no-fabrication confidence design, and the new test count. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | Yes | Added "Role-Based Coaching Confidence & Severity Algorithms (2026-06-23)" — the confidence-aggregation formula (with the ×0.75/×0.5 downgrade multipliers and the reasoning for choosing them), the severity-derivation formula, and the ceremony advice rule engine description. Required per CLAUDE.md §30 ("business formulas must be documented"). | Done |
| `product/APPENDIX.md` | Yes | Yes | Added Section Q (3 new glossary terms: Role-Based Coaching Insights, Coaching Category, Ceremony Advice, Coaching Confidence Score). | Done |
| `app/help/page.tsx` | Yes | Yes | Added a "Coaching Insights" FAQ section (3 entries: what it is, why not all 7 categories are visible, what "Confidence: Not available" means) — end-user-facing per CLAUDE.md's `/help` update rule. | Done |
| `app/developer/page.tsx` | Yes | No | The "📖 Developer Guide" topic in the developer wiki fetches `product/DEVELOPER_GUIDE.md` live via `GET /api/docs?slug=dev-guide` — the new section added there is already served without any edit to this file. The other inline topics (`gateway`, `cloud-sync`, `error-logger`) are curated deep-dives for subsystems not fully covered by a single Developer Guide section; this feature's architecture is fully covered by one section, so no new inline topic was added, consistent with not every feature getting one (e.g. `/api/jira/sync` also has no dedicated inline topic). | Done |
| `product/README.md` | Yes | No | README describes user-facing features at a high level; the dashboard already has a "role-aware" framing and no specific stale claim contradicts this addition. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; coaching insight generation is rule-based interpretation of existing metrics, not a new technical method among the eight already claimed. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | No novel technique — advice generation from threshold rules over existing computed metrics is the same pattern already used by the Retro Insights Engine and Smart Actions. | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | No new differentiating capability vs. prior art; rule-based role-specific advice is a conventional pattern. | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | No new patent claim candidate introduced. | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | No new env var, Docker config, or migration — purely application code plus one new read-only API route reusing existing Prisma/storage infrastructure. | Done |

**Net result:** 11 of 18 product/app-doc surfaces updated (SRS, BRD, USE_CASES, USER_JOURNEYS, SCENARIOS, TEST_CASES, DEVELOPER_GUIDE, RELEASE_NOTES, ALGORITHM_SPEC, APPENDIX, `/help`); 7 reviewed with no update required, each with a stated reason. TODO-List.md updated (RBC-01–20 status rows, this matrix). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11/RBC-19/RBC-20 for this change.

---

## 7. Daily Master Prompt Regeneration

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| DAILY-01 | Regenerate Claude working prompt at the beginning of every new workday | P0 | ✅ Permanent | Do not reuse yesterday’s prompt blindly. |
| DAILY-02 | Include current date, branch, version, code status | P0 | ✅ Permanent | Must reflect actual repository state. |
| DAILY-03 | Include documentation, TODO, release-notes, lint/test/build status | P0 | ✅ Permanent | Must show what is current and what is behind. |
| DAILY-04 | Include what changed yesterday and what remains behind | P0 | ✅ Permanent | Any behind document becomes P0 immediately. |
| DAILY-05 | Include today's P0 status alongside the P1–P4 work planned for the day | P0 | ✅ Permanent | Updated 2026-06-08: P0 no longer gates P1–P4 — the daily prompt should show P0 status *and* the balanced/parallel P1–P4 work for the day side by side, not frame P0 as something to "wait out" before features can begin. |
| DAILY-06 | Include updated execution order and Definition of Done | P0 | ✅ Permanent | Every day begins from current reality. |

---

## 8. Full App Coverage Rule

`product/SRS.md`, `product/USE_CASES.md`, and `product/TEST_CASES.md` must cover the entire app, not only the newest changes.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| COVER-01 | Validate every page is covered | P0 | ✅ Done | Verified 2026-06-08 via survey-first ground-truth pass: dashboard/upload/admin/developer/help/charts/explore/readiness/members/login/profile pages all anchored across SRS page inventory + USE_CASES UCs + TEST_CASES TCs. Retrospective/forecasting/coaching pages have since shipped (`/retro`, `/forecast`, `/dashboard/coaching`) and are anchored per `COVER-19`–`21` (updated 2026-06-27). |
| COVER-02 | Validate every route is covered | P0 | ✅ Done | Re-verified 2026-06-08 — survey's "thin" flag was stale framing (already fully covered): `middleware.ts` PROTECTED/ADMIN_ONLY route-protection logic anchored via FR-226/FR-227/FR-235E + UC-084/UC-085/UC-086 + `roles.test.ts` (route matrix/fallbacks) + `middleware.test.ts` (TC-PW-07 forced-password-change redirect, new TC-A-10 unauthenticated→`/login?redirect=` redirect). |
| COVER-03 | Validate every API route is covered | P0 | ✅ Done | Closed 2026-06-08 — the one genuinely large gap: added new SRS §8.1 "Next.js Application API Route Inventory" (36-row table: Method/Path/Auth/Purpose/FR ref/Notes covering every live `app/api/**/route.ts` route), plus a scope-note distinguishing it from the legacy standalone-Express-backend API spec already in SRS §8. |
| COVER-04 | Validate every user role is covered | P0 | ✅ Done | All 6 `AppRole` values (admin/scrum_master/product_owner/manager/c_level/user) anchored via FR-226/FR-227, UC-084/UC-085/UC-086, and `roles.test.ts` (supported roles, labels, import-visibility scope, dashboard default-view mapping, view locking, route matrix). |
| COVER-05 | Validate every admin feature is covered | P0 | ✅ Done | Re-verified 2026-06-08 — survey's "gap" flag was stale framing (already fully covered): users/retention/thresholds/orphan-rules/backup-restore/cloud-storage/browser-data/diagnostics/logs/security all anchored via UC-084 + `adminUsers.test.ts`/`members.test.ts`/`changePassword.test.ts`/`adminSettingsConsole.test.ts`/`orphanRules.test.ts`/`cloudStorage.test.ts`. |
| COVER-06 | Validate upload flows are covered | P0 | ✅ Done | Jira export upload (FR-001/UC-001) and column mapping (FR-249/FR-275/FR-244/Addendum A.15 + `columnMapping.test.ts`) were already anchored. Closed the one real gap 2026-06-08: the multi-file merge control had a live route/UI/pure-function with zero FR/UC/TC anchor — wrote new `FR-312`, `UC-094`, and `mergeIssues.test.ts` (TC-UM-01–06, TEST_CASES §9.47, 6 passing tests). Retrospective/template upload have since shipped — see `COVER-20` (updated 2026-06-27). |
| COVER-07 | Validate dashboard sections are covered | P0 | ✅ Done | Overview/sprints/Kanban/flow/risks/data-quality/confidence/work-items sections anchored across the FR/UC/TC inventory and exercised by `dashboardView.test.ts`/`dashboardSectionSwitcher.test.ts`/`dashboardChips.test.ts`/`relationExplorer.test.ts`. Coaching/retro/forecast sections have since shipped — see `COVER-19/20/21` (updated 2026-06-27). |
| COVER-08 | Validate all calculations are covered | P0 | ✅ Done | Formula/source-field/assumptions/limitations/benefit/alternatives/code-location documented in the `/developer` Calculation Reference + SRS formula sections, exercised by `metrics.test.ts`/`throughput.test.ts`/`dataQuality.test.ts`/`metricConfidence.test.ts`/`releaseConfidenceTrend.test.ts`/`portfolioHealth.test.ts`/`teamHealth.test.ts` and others. |
| COVER-09 | Validate database models are covered | P0 | ✅ Done (updated 2026-06-09) | `prisma/schema.prisma` models — User, Session, ImportLog, DashboardSnapshot, AuditEvent — anchored in the SRS data-model section and exercised by `adminUsers.test.ts`/`snapshots.test.ts`/`deleteHistory.test.ts`/`auth.test.ts`/`logout.test.ts`/`uploadUserId.test.ts`. **Updated 2026-06-09**: `UserAddRequest` (FR-314) and `Notification` (FR-315) models added to schema and anchored via `userAddRequests.test.ts` (TC-REQ-01–14). RetroInsight has since shipped (no new Prisma model — uploads/in-app form are parsed/computed in memory, not persisted) — see `COVER-20` (updated 2026-06-27). |
| COVER-10 | Validate browser storage behavior is covered | P0 | ✅ Done | `dc_*`/`dc-*` key conventions, clear-data, and privacy-reset/fallback rules documented and exercised by `clearLocalData.test.ts`/`onboarding.test.ts`/`recOwners.test.ts`/`mutedRecommendations.test.ts`/`cloudRestoreHardening.test.ts` (TC-CS-12 localStorage fallback). |
| COVER-11 | Validate security behavior is covered | P0 | ✅ Done | Auth/role-route authorization/first-login password change/secret redaction anchored via FR-226/FR-227/FR-235E, UC-084/UC-085/UC-086, `auth.test.ts`/`roles.test.ts`/`middleware.test.ts`/`securityCheck.test.ts`/`changePassword.test.ts`. Additionally **resolved a TC-ID collision/drift** discovered 2026-06-08: the stale manual "F3 — Authentication Tests" table (TC-A-01–09, all "Not Run") had drifted from `auth.test.ts`'s independent reuse of the same IDs for different scenarios. Renumbered the five colliding rows to the free range TC-A-10–14, corrected TC-A-01/02/08/09 to ✅ Automated with cross-refs, and closed the genuinely-untested scenarios with 7 new automated tests: `middleware.test.ts` TC-A-10 (unauthenticated→`/login` redirect), `logout.test.ts` TC-A-13a/b (audit event + session destroy), `uploadUserId.test.ts` TC-A-14a/b (ImportLog tagged with session userId) — plus cross-refs for TC-A-11/TC-A-12 to existing `roles.test.ts` coverage (see TEST_CASES §F3). Gateway SSRF protections are exercised by the gateway's own test suite (`src/server/gateway/`, `GW-01`–`25`) — see `COVER-17` (updated 2026-06-27). |
| COVER-12 | Validate error states are covered | P0 | ✅ Done | Upload/parsing-error and storage-failure paths anchored via `cloudRestoreHardening.test.ts` (TC-CS-09–12)/`cloudStorage.test.ts`/`securityCheck.test.ts`/`diagnostics.test.ts`/`snapshots.test.ts` (TC-SN-02 cross-user delete denial, TC-SN-04 not-found). Closed the one genuine gap 2026-06-08: `GET /api/snapshots/:id` guards three distinct error responses (401 not authenticated / 404 not found / 403 access denied) that had no direct route-level test — wrote new `snapshotLoadErrors.test.ts` (TC-SN-09/10/11, TEST_CASES §9.48, 3 passing tests). Gateway-failure/notification-failure/insufficient-forecast-data paths now have anchors of their own (`COVER-17/18/19`, updated 2026-06-27) — insufficient-forecast-data specifically is `TC-FCAST-02`/`13` (`insufficient_data` status). |
| COVER-13 | Validate export features are covered | P0 | ✅ Done | Smart Excel export (`excelExport.test.ts`/`excelExportSheets.test.ts`/`explorerExport.test.ts`), HTML export (`exportUtilsHtml.test.ts`), and Executive PDF export (`executivePdf.test.ts`) all anchored in FR/UC/TC inventory; no further export formats are planned. |
| COVER-14 | Validate customer/executive views are covered | P0 | ✅ Done | C-level summary view (`/summary`, `fallbackRouteForRole`) and customer/reporting view anchored via FR/UC and exercised by `customerView.test.ts`/`dashboardView.test.ts`. |
| COVER-15 | Validate developer route features are covered | P0 | ✅ Done | `/developer` Package Reference and Calculation Reference pages documented in SRS and the new §8.1 route inventory, anchored in USE_CASES. |
| COVER-16 | Validate storage behavior is covered | P0 | ✅ Done | Local/S3-compatible/Azure Blob/GCP cloud storage, latest-metrics persistence, backup bundles, fallback rules, and settings persistence anchored via UC-084 and exercised by `cloudStorage.test.ts`/`cloudRestoreHardening.test.ts`/`backup.test.ts`/`storageSettingsPersistence.test.ts`. |
| COVER-17 | Validate gateway behavior is covered | P0 | ✅ Done — superseded by implementation (updated 2026-06-27) | Originally confirmed correctly-scoped roadmap item (2026-06-08, no code existed yet). **Now stale in the other direction** — the gateway shipped 2026-06-08 (`GW-01`–`25`, Section 14, `FR-313`). Corrected: gateway code/tests exist; it deliberately still has **no UC/SCN/UJ** because it's a server-only foundation with no end-user-facing flow (see `USE_CASES.md`'s explicit "no UC for vaporware" note), not because it's unbuilt. See `TRACE-09`. |
| COVER-18 | Validate notification/request behavior is covered | P0 | ✅ Done — fully shipped v4.5 (updated 2026-06-09) | **v4.5 fully shipped**: `RequestAddMemberModal` (FR-320), `UserAddRequestsPanel` with mandatory admin-entered temp password (FR-321), `GET /api/notifications` + `PATCH /api/notifications/[id]/read` (FR-322), `NotificationBell` with pulsing badge and admin amber strip (FR-323), bulk user management (FR-324). UC-097/098/099, UJ-034, SCN-049, TC-NOTIF-01–05, TC-REQ-15–16, SRS Addendum C, full product docs. Full in-app notification center (browser push, email) remains P4. |
| COVER-19 | Validate forecasting behavior is covered | P2 | ✅ Done — superseded by implementation (updated 2026-06-27) | Originally confirmed correctly-scoped roadmap item (2026-06-08, no code existed yet). **Now stale** — forecasting shipped 2026-06-10 (`/forecast`, `UC-102`, `FR-328`/`FR-329`) and was further extended 2026-06-27 (`FR-359`–`364`, Addendum J). Corrected. See `TRACE-13`. |
| COVER-20 | Validate retrospective behavior is covered | P2 | ✅ Done — superseded by implementation (updated 2026-06-27) | Originally confirmed correctly-scoped roadmap item (2026-06-08, no code existed yet). **Now stale** — retrospective upload/template/insights shipped 2026-06-26 (`UC-103`/`104`, `FR-355`–`358`/`356b`, Addendum I). Corrected. See `TRACE-12`. |
| COVER-21 | Validate role-based coaching behavior is covered | P1 | ✅ Done — superseded by implementation (updated 2026-06-27) | Originally confirmed correctly-scoped roadmap item (2026-06-08, no code existed yet). **Now stale** — Role-Based Coaching shipped 2026-06-23 (`UC-114`, `FR-346`–`354`, Addendum H/H.6). Corrected. See `TRACE-11`. |
| COVER-22 | Validate future roadmap items are clearly marked future | P0 | ✅ Done — re-verified 2026-06-27 | Originally verified 2026-06-08 that COVER-17–21 were all roadmap-only. **All five have since shipped** (gateway 2026-06-08, coaching 2026-06-23, retro 2026-06-26, forecasting 2026-06-10/extended 2026-06-27) — re-verified that none are *currently* misrepresented as roadmap when actually implemented, and corrected the four COVER rows above that had gone stale in the opposite direction (implemented-but-still-labeled-roadmap). Current genuine roadmap items needing this same "clearly marked future" discipline going forward: `ORG-01–22`, `EXPORT-04–07`/`SHARE-01–06`, `MOBILE-01–09`, `MOBILEAPP-01–08`, `FUT-JIRA-02/03`, `FUT-CLOUD-01`. |
| TRACE-02 | Validate SRS, Use Cases, and Test Cases cover the full app | P0 | ✅ Done | Closed 2026-06-08 via user-approved "survey-first, then cluster" methodology: built a 22-area ground-truth coverage matrix; found 2 stale-framing false positives already fully covered (COVER-02, COVER-05); closed 1 large genuine gap (COVER-03 — new 36-row API route inventory, SRS §8.1); closed 1 narrow genuine gap (COVER-06 — `FR-312`/`UC-094`/`mergeIssues.test.ts`); resolved 1 TC-ID collision/drift cluster (COVER-11 — F3 Authentication Tests table renumbered TC-A-10–14, 7 new automated tests); closed 1 error-state gap (COVER-12 — `snapshotLoadErrors.test.ts` TC-SN-09–11); and confirmed 5 roadmap items as correctly-scoped per explicit user decision rather than authoring speculative docs for unbuilt features (COVER-17–21). All 22 `COVER-XX` rows are now ✅ Done — see RELEASE_NOTES.md for the full closure write-up. |

---

## 9. Required Output After Each Claude Pass

Claude must output the following after each pass.

| ID | Required Output | Priority | Status |
|---|---|---:|---|
| OUT-01 | Current branch and working tree status | P0 | ✅ Permanent |
| OUT-02 | P0 reconciliation summary | P0 | ✅ Permanent |
| OUT-03 | Documents updated | P0 | ✅ Permanent |
| OUT-04 | Documents not changed and why | P0 | ✅ Permanent |
| OUT-05 | Full product documentation impact matrix | P0 | ✅ Permanent |
| OUT-06 | Storage status decision | P0 | ✅ Permanent |
| OUT-07 | Normalised test count | P0 | ✅ Permanent |
| OUT-08 | Lint/test/build result | P0 | ✅ Permanent |
| OUT-09 | Updated TODO status | P0 | ✅ Permanent |
| OUT-10 | Release Candidate decision | P0 | ✅ Permanent |
| OUT-11 | Backend Gateway plan or implementation summary | P1 | ✅ Permanent |
| OUT-12 | User Add-Member Request Workflow plan or implementation summary | P1 | ✅ Permanent |
| OUT-13 | Role-Based Coaching Insights plan or implementation summary | P1 | ✅ Permanent |
| OUT-14 | Retrospective Upload, Template Download, and In-App Form plan or implementation summary | P2 | ✅ Permanent |
| OUT-15 | Forecasting Progress and Delivery Adjustment Report plan or implementation summary | P2 | ✅ Permanent |
| OUT-16 | Traceability matrix | P0 | ✅ Permanent |
| OUT-17 | Remaining risks | P0 | ✅ Permanent |
| OUT-18 | Next recommended development step | P0 | ✅ Permanent |

---

## 10. P0 — Status Reconciliation Pass

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| REC-01 | Confirm current branch | P0 | ✅ Done (2026-06-16) | Branch: `style/visual-design-updates`, up to date with origin. |
| REC-02 | Confirm working tree status | P0 | ✅ Done (2026-06-16) | Working tree clean — all changes committed and pushed. |
| REC-03 | Create safe baseline commit if needed | P0 | ✅ Done (2026-06-16) | Tree was already clean; no baseline commit needed. |
| REC-04 | Update `product/SRS.md`: P1.1 Calculation Reference Done/Verified | P0 | ✅ Done | SRS FR-283 already marked Done; in scope list confirmed (v4.9.2 pass). |
| REC-05 | Update `product/SRS.md`: P1.2 Clear Local Data Done/Verified | P0 | ✅ Done | SRS FR-284 already marked Done; confirmed. |
| REC-06 | Update `product/SRS.md`: P1.3 Dashboard Section Show/Hide Done/Verified | P0 | ✅ Done | SRS FR-285 already marked Done; confirmed. |
| REC-07 | Remove any text saying P1.1/P1.2/P1.3 are queued/planned/not started | P0 | ✅ Done | Confirmed — no stale language remains. |
| REC-08 | Update `product/USE_CASES.md` intro/scope to v4.2.x | P0 | ✅ Done | Already updated in v4.2.2 P0 pass. |
| REC-09 | Remove “auth/multi-user out of scope” wording | P0 | ✅ Done | SRS §1.2 In Scope list includes auth/multi-user/role-based access. |
| REC-10 | Add/verify use cases for admin user management | P0 | ✅ Done | UC-084/UC-085/UC-086 added in TRACE-01 cluster #1 closure. |
| REC-11 | Add/verify use cases for route visibility | P0 | ✅ Done | COVER-02 verified — middleware.ts anchored to FR-226/227/235E + roles.test.ts. |
| REC-12 | Add/verify use cases for User Add-Member Request Workflow | P0/P1 | ✅ Done 2026-06-20 | Verified implemented end-to-end: UC-095–UC-099 (request, admin accept/reject, requester notification, first-login password change), SCN-050, UJ-035, FR-314–FR-319. Code: `app/api/user-add-requests/*`, `app/api/admin/user-add-requests/*`, `RequestAddMemberModal.tsx`, `UserAddRequestsPanel.tsx`, `app/change-password/page.tsx`. Tests: `TC-REQ-01` onward in `product/TEST_CASES.md` §9.42–9.48. |
| REC-13 | Add/verify use cases for Backend Gateway | P0/P1 | ✅ Done 2026-06-20 | Verified implemented as server-only infrastructure foundation (`src/server/gateway/`) with zero live providers wired up and no end-user UI — correctly has no UC authored, consistent with this document's "no UC for vaporware" principle (see `product/USE_CASES.md` line 63 note). Anchored to FR-313, `product/DEVELOPER_GUIDE.md` § "Backend Integration Gateway", and `TC-GW-01`–`TC-GW-21` (+05b/15b) in `gateway.test.ts`. |
| REC-14 | Add/verify use cases for Role-Based Coaching | P0/P1 | ✅ Done 2026-06-19 | Verified not implemented — no pages/routes/code exist (COVER-21). Correctly scoped as P1 roadmap item; no speculative UC/SCN/UJ/TC authored. See TRACE-11 and COVER-21 for the confirmed roadmap-only status. |
| REC-15 | Add/verify use cases for Retrospective Template/Form | P0/P2 | ✅ Done 2026-06-19 | UC-103 (in-app form) + UC-104 (template download) verified. Added `Related UJ: UJ-038`, `Related TC: TC-RETRO-01–07` to UC-103; added `Related SCN: SCN-056`, `Related TC: TC-RETRO-05` to UC-104; wrote SCN-056 and UJ-038 Alt B. Section 12 rows added. |
| REC-16 | Add/verify use cases for Forecasting | P0/P2 | ✅ Done 2026-06-19 | UC-102 verified. Added `Related UJ: UJ-037`, `Related TC: TC-FCAST-01–05`. Section 12 row added. |
| REC-17 | Reconcile storage status across SRS/BRD/Developer Guide/Release Notes/README/Test Cases/TODO | P0 | ✅ Done (2026-06-16) | All docs confirmed — storage is Implemented. SRS/BRD/DEVELOPER_GUIDE/RELEASE_NOTES updated to v4.9.2. |
| REC-18 | Update `TODO-List.md` to current reality | P0 | ✅ Done — this file | Include P0-P4, status values, new roadmap items, blockers. |
| REC-19 | Normalize test count | P0 | ✅ Done (2026-06-16) | Actual: 571 tests / 63 suites — all passing. SRS updated. |
| REC-20 | Run `npm run lint` | P0 | ✅ Done (2026-06-16) | Passes — warnings only for legacy inline styles in tech-debt files; zero errors. |
| REC-21 | Run `npm test` | P0 | ✅ Done (2026-06-16) | 571/571 passing, 63 suites. Fixed TC-AC-01 and TC-REQ-10. |
| REC-22 | Run `npm run build` | P0 | ✅ Done (2026-06-16) | Build passes — all routes compiled successfully. |
| REC-23 | Run `npm run test:coverage` if available | P0 | ✅ Done (2026-06-16) | No test:coverage script — manual review performed; suite is comprehensive. |
| REC-24 | Update Release Notes with verification result | P0 | ✅ Done (2026-06-16) | RELEASE_NOTES v4.9.0/v4.9.1/v4.9.2 entries added. |
| REC-25 | Decide Release Candidate status | P0 | ✅ Resolved (2026-06-08) | The traceability coverage gate that previously blocked RC status is now clear — `TRACE-01` and `TRACE-02` are both ✅ Done (zero `GAP — not found` cells, zero ID collisions, all 22 `COVER-XX` rows closed). Remaining blockers to RC, if any, are limited to required-output reporting (see Section header note). |

---

## 11. Storage Status Reconciliation

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| STORAGE-DEC-01 | Decide true storage implementation status | P0 | ✅ Done (2026-06-23) | **Verified at the code level, not assumed:** storage is genuinely implemented, not partial/planned. `src/types/storage.ts` defines a typed `StorageProvider` interface (`upload`/`download`/`list`/`delete`/`test`); `src/services/storage/providers/{local,s3,azure,gcp}Provider.ts` each implement it; `src/services/storage/storageProvider.ts` is the factory (`createProvider()`/`getActiveProvider()`) reading/writing `data/storage-settings.json`. Backed by `app/api/admin/storage/route.ts` (GET/POST + `?action=test`/`?action=upload`), `app/api/admin/storage/auto-restore/route.ts`, `app/api/admin/storage/download/route.ts`, `app/api/admin/storage/sync/route.ts`. This is Option A (fully implemented), not B or C. |
| STORAGE-DEC-02 | Document supported providers | P0 | ✅ Done (2026-06-23) | Four providers confirmed in `src/types/storage.ts`'s `StorageProviderType`: `local` (filesystem, `data/cloud-backups/`, no credentials), `s3` (AWS S3 or any S3-compatible endpoint — MinIO/Backblaze B2/Cloudflare R2 — via optional `endpoint` field), `azure` (Blob Storage via connection string), `gcp` (Cloud Storage via service-account JSON or ADC). `PROVIDER_INFO` in `storageProvider.ts` carries the user-facing label/description/install command for each, rendered in the admin UI's `ConnectionGuide`. |
| STORAGE-DEC-03 | Document current limitations | P0 | ✅ Done (2026-06-23) | (1) No simultaneous multi-provider replication — exactly one `active` provider at a time; switching providers does not auto-migrate existing backups (admin must manually re-upload). (2) Auto-restore-on-startup (`autoRestoreFromCloud()`) only triggers when the local DB is missing or has zero users — it will not overwrite an existing populated DB, by design (data-loss guard), but this means a stale local DB with users won't auto-heal from a newer cloud backup without the `?force=true` manual trigger. (3) S3 credentials are optional (falls back to the AWS default credential chain — env vars, `~/.aws/credentials`, IAM role) but Azure/GCP currently require either a typed credential or matching env var; there's no IAM-role-equivalent auto-detection for those two. (4) Backup restore is whole-bundle (all-or-nothing per `restoreBackup()`) — no selective/partial restore. |
| STORAGE-DEC-04 | Document tests | P0 | ✅ Done (2026-06-23) | `src/__tests__/cloudStorage.test.ts` (provider factory + settings round-trip), `src/__tests__/storageSettingsPersistence.test.ts` (secrets survive redacted UI saves — a save with blank password fields must not erase previously-stored credentials), `src/__tests__/latestMetricsStorage.test.ts` (origin-metadata round-trip, backward compatibility), plus `cloudRestoreHardening.test.ts` (TC-CS-* — `/api/metrics/latest` source detection/priority, `loadMetricsWithSource()` fallback chain). New this pass: `src/__tests__/diagnostics.test.ts` extended with `TC-SD-09`/`TC-SD-10` (latest-metrics age calculation, cloud-backup freshness sort). |
| STORAGE-DEC-05 | Document admin UI | P0 | ✅ Done (2026-06-23) | `app/admin/settings/page.tsx`'s `CloudStorageSettings()` component (Admin Settings → Cloud Storage tab): provider picker (4 cards), per-provider credential forms with a `ConnectionGuide` walkthrough, lock/edit-mode toggle once a provider with a real credential source is saved, Save/Test connection/Upload backup now actions, structured error display (cause + fix + AWS credential-source diagnostic). `STORAGE-DEC-11` (below) closes the one gap found: no initial-load guard, now fixed. |
| STORAGE-DEC-06 | Document credential security | P0 | ✅ Done (2026-06-23) | Confirmed in `app/api/admin/storage/route.ts`'s `GET` handler: the response's `safeSettings` object explicitly strips `accessKeyId`/`secretAccessKey`/`connectionString`/`keyFilename`/`keyJson` and returns only a `hasCredentials: boolean` presence flag — secrets never reach the browser after being saved. `requireAdmin()` gates both GET and POST to `admin` role only. `preserveSecret()` in the POST merge logic ensures a blank password field in a save request doesn't overwrite a previously-stored secret with empty string. |
| STORAGE-DEC-07 | Document backup bundle behavior | P0 | ✅ Done (2026-06-23) | `src/services/settings/backup.service.ts`'s `createBackup()`/`restoreBackup()` produce/consume a single JSON bundle (`manifest.files` + per-file content) uploaded via `provider.upload()`. `src/services/metrics/latestMetricsStorage.ts`'s `writeLatestMetrics()`/`readLatestMetrics()` separately persist just the live dashboard snapshot (`data/latest-metrics.json`, with `savedAt` + `origin: {source: 'file'\|'jira-api', connectionName?, connectionId?}`) so a fresh session can load dashboard data fast without restoring the full bundle — this file is itself included in cloud backups for disaster recovery. |
| STORAGE-DEC-08 | Document fallback behavior | P0 | ✅ Done (2026-06-23) | `src/lib/storage.ts`'s `loadMetricsWithSource()` fallback chain: try `/api/metrics/latest` (server/bucket) first → on failure or empty, fall back to browser `localStorage` → on that also being empty, return `source: 'none'`. Every step calls `saveSource()` which persists a `MetricsSourceInfo` (`source`/`provider`/`key`/`status`/`message`/`error`/`savedAt`/`connectionName`) to `localStorage` and fires a `dc-metrics-source-change` event — this is what `DataSourceBadge`/`DataSourceProvider` (`src/components/ui/DataSourceBadge.tsx`) listen to in order to render the visible source badge. |
| STORAGE-DEC-09 | Add visible source details | P0 | ✅ Done (2026-06-23) | Provider/bucket-key were already shown in the `DataSourceBadge` title (`Data source: PROVIDER · Key: KEY`) from prior work, but **last-fetched and fallback-reason were missing** — `applyStoredSource()` in `DataSourceBadge.tsx` only threaded `lastSyncAt` through for the `jira-api` case, and the `localstorage`/`fallback` (`none`) cases never passed `info.error`/`info.message` into the badge at all. Fixed: added a `fallbackReason` field to `DataSourceCtx`, threaded `info.savedAt` through for every source branch (bucket/cache/upload/local/snapshot, not just jira-api), and threaded `info.error \|\| info.message` through for `localstorage`/`fallback`. The badge `title` now reads `Data source: PROVIDER · Key: KEY · Last fetched Xm ago · {fallback reason}` when applicable. "Last pushed" (the other half of the original ask) is sourced from `getCacheMeta().pushedAt` (`src/services/storage/cloudSync.ts`, which already tracked `fetchedAt`/`pushedAt`/`pendingPush` but never surfaced it anywhere) — surfaced in the new Diagnostics section from `STORAGE-DEC-10` rather than the compact topbar badge, since "last pushed" is an admin/ops concern, not a per-page glance concern. This was `JIRA-GATE-03`. |
| STORAGE-DEC-10 | Add admin sync health check in diagnostics | P0 | ✅ Done (2026-06-23) | New "Latest Metrics & Cloud Sync" section added to `app/admin/diagnostics/page.tsx`, backed by a new `metricsSync` block in `app/api/admin/diagnostics/route.ts`'s `GET` response: `available`/`savedAt`/`ageMinutes`/`source`/`connectionName` (from `readLatestMetrics()`), `cloudProvider`/`cloudBackupCount`/`latestCloudBackupAt`/`latestCloudBackupKey`/`cloudListError` (from `readStorageSettings()` + `listCloudBackups()`, sorted newest-first), and `lastFetchedAt`/`lastPushedAt`/`pendingPush` (from `getCacheMeta()`). UI shows two KPI cards ("Live Dashboard Data" — available/missing + age-toned green/amber/red; "Cloud Copy Freshness" — backup count + newest timestamp, or "Local only"/error states) plus a fetched/pushed/pending-push status line when a cloud provider is active. 2 new tests `TC-SD-09`/`TC-SD-10` (age calculation, newest-backup sort — both mirror the route's actual logic, consistent with this test file's existing pure-function-mirror style). This was `JIRA-GATE-04`. |
| STORAGE-DEC-11 | Add Cloud Storage initial-load guard | P0 | ✅ Done (2026-06-23) | **Confirmed real gap via code reading, not assumption:** `CloudStorageSettings()` in `app/admin/settings/page.tsx` initialized `data` to `null` and `active` to `'local'`, then rendered the full provider-picker grid and action buttons immediately — before the `/api/admin/storage` fetch resolved, a user would briefly see the `'local'` tab highlighted and live buttons, even if their real saved provider was S3/Azure/GCP. Fixed with an early return: `if (!data) return <div ...>Loading storage settings…</div>;` placed right after the existing hooks, before the main `return (`. No default-provider flash possible anymore — the whole panel is blocked on the real settings arriving. This was `JIRA-GATE-05`. |
| STORAGE-DEC-12 | Verify cloud-backed user authority | P0 | ✅ Done / Needs regression | Uploaded TODO says done: sync from cloud before auth/admin reads/writes; push after user create/update/password change. |
| STORAGE-DEC-13 | Add email access notifications for created users | P0 | ✅ Done (2026-06-10) | Implemented via nodemailer (`src/lib/email.ts`). On accept, `sendEmail()` delivers a styled HTML+text welcome email with credentials and login link. Graceful: skips silently if SMTP not configured. `emailSent` flag in API response; admin UI shows ✅/⚠️ delivery status. FR-325. |

---

## 12. Traceability Rule

Every implemented feature must be traceable end-to-end.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TRACE-01 | Build full traceability matrix for every shipped v4.2.x feature | P0 | ✅ Done — clusters #1 (F3-14/15/16), #2 (F2-05/06/07/09/11/12/13), #3 (F4-05/06/08), #4 (F1-07/08), #5 (UX-02/03/05/11/13), #6 (FR↔UC ID-collision cleanup + Ownership Index), and UX-14 ALL fully closed 2026-06-08 incl. all 38 test cases (14 + TC-AC-01–03 + TC-FF-01–06 + TC-X-09a–13b + TC-T-11 + TC-CH-01–03 + TC-X-14) automated — matrix has zero `GAP — not found` cells and zero ID collisions remaining | Cross-reference Feature ↔ SRS FR ID ↔ Use Case ID ↔ Scenario ID ↔ User Journey ID ↔ Test Case ID ↔ Release Note ↔ TODO Status. Filled matrix in Section 12, plus Appendix B (FR→UC Ownership Index) resolving the bundling ambiguity. All six gap clusters closed — see Gaps Summary. |
| TRACE-02 | Validate SRS, Use Cases, and Test Cases cover the full app | P0 | ✅ Done | Closed 2026-06-08 — all 22 `COVER-XX` rows in Section 8 are ✅ Done (survey-first methodology found 2 stale-framing false positives, 2 genuine gaps now closed with new FR/UC/TC + tests, 1 TC-ID collision cluster resolved with 7 new tests, 1 error-state gap closed with 3 new tests, and 5 roadmap items confirmed correctly-scoped). See Section 8 for the per-area closure notes and `RELEASE_NOTES.md` for the full write-up. |
| TRACE-03 | Block new coding if any implemented feature lacks traceability | P0 | ✅ Permanent | Any gap becomes P0 immediately. |
| TRACE-04 | Add traceability rows for P1.1 Calculation Reference | P0 | ✅ Done (2026-06-27, found already closed) | Was stale — already anchored as `UX-06` in the Section 12 matrix: `FR-283`, `UC-059`, `SCN-022`, `✅ Done`. No new work needed; row marked Done to stop this duplicate item from re-surfacing as "Not started." |
| TRACE-05 | Add traceability rows for P1.2 Clear Local Data | P0 | ✅ Done (2026-06-27, found already closed) | Was stale — already anchored as `UX-07`/`UX-08`: `FR-284`/`FR-286`, `UC-056/057/060`, `SCN-018/019/023`, `UJ-017/020`, `TC-CLD-01–10`, `✅ Done`. |
| TRACE-06 | Add traceability rows for P1.3 Dashboard Section Switcher | P0 | ✅ Done (2026-06-27, found already closed) | Was stale — already anchored as `UX-09`: `FR-285`, `UC-058/061`, `SCN-020/024/025`, `UJ-019`, `TC-DS-01–10`, `✅ Done`. |
| TRACE-07 | Add traceability rows for Admin User Management and role-based route enforcement | P0 | ✅ Done (2026-06-27, found already closed) | Was stale — this is exactly TRACE-01 cluster #1 (F3-14/15/16), closed 2026-06-07/08: `FR-235A–E/G`, `UC-084/085/086`, `SCN-039–042`, `UJ-024–026`, `TC-AU/MD/PW`, route-matrix/middleware tests in `roles.test.ts`/`middleware.test.ts`. |
| TRACE-08 | Add traceability rows for Cloud Storage and latest-metrics restore | P0 | ✅ Done (2026-06-27, found already closed) | Was stale — already anchored via `COVER-16`: local/S3/Azure Blob/GCP storage, latest-metrics persistence, backup bundles, and fallback rules, anchored to `UC-084` and exercised by `cloudStorage.test.ts`/`cloudRestoreHardening.test.ts`/`backup.test.ts`/`storageSettingsPersistence.test.ts`. |
| TRACE-09 | Add traceability placeholders for Backend Gateway | P1 | ✅ Done (2026-06-27) | Gateway is implemented (`GW-01`–`25`, Section 14). Deliberately has **no UC/SCN/UJ** — it's a server-only routing/policy/retry/audit foundation with zero live providers and no end-user-facing flow, consistent with `USE_CASES.md`'s "no UC for vaporware" principle (see its explicit note at line ~63). Anchored via `FR-313`, `DEVELOPER_GUIDE.md` § "Backend Integration Gateway", and the gateway test suite. |
| TRACE-10 | Add traceability placeholders for User Add-Member Request | P1 | ✅ Done (2026-06-27) | Implemented and already traced: `FR-314`–`FR-325`, `UC-095`/`UC-096`/`UC-097`/`UC-098`/`UC-100`, `UJ-035`, `SCN-050`, `TC-REQ-01–20b` (`product/TEST_CASES.md` §9.50–§9.53). See USERREQ-07–30 in Section 15. |
| TRACE-11 | Add traceability placeholders for Role-Based Coaching | P1 | ✅ Done (2026-06-26) | Implemented and traced: FR-346–FR-354 (SRS Addendum H/H.6), UC-114, UJ-039, SCN-057/058/059, TC-RBC-01–13 (`product/TEST_CASES.md` §9.60/§9.61). See RBC-01–26 in Section 16. |
| TRACE-12 | Add traceability placeholders for Retrospective features | P2 | ✅ Done (2026-06-27) | Implemented and traced: `FR-355`–`FR-358` + `FR-356b` (SRS Addendum I), `UC-103`/`UC-104`/`UC-105`/`UC-115`, `BR-117`, `SCN-053`, `TC-RETRO-05/08–25`. See RETRO-04–38 in Section 17. |
| TRACE-13 | Add traceability placeholders for Forecasting | P2 | ✅ Done (2026-06-27) | Implemented and traced. Base flow: `FR-328`/`FR-329`, `UC-102`, `UJ-037`, `SCN-052`, `TC-FCAST-01–05`. Engine-extraction enhancement: `FR-359`–`FR-364` (SRS Addendum J), `TC-FCAST-06–13` (`product/TEST_CASES.md` §9.55a). Found and fixed a real gap while closing this item: `UC-102`'s `Related FR`/`Related TC` lines hadn't been updated when FCAST-14–26 merged — updated `product/USE_CASES.md` to cross-reference Addendum J and `§9.55a`. See FCAST-14–26 in Section 18. |

### Traceability Matrix Template

| Feature | SRS FR ID | Use Case ID | Scenario ID | User Journey ID | Test Case ID | Release Note | TODO Status |
|---|---|---|---|---|---|---|---|
| Example Feature | FR-xxx | UC-xxx | SCN-xxx | UJ-xxx | TC-xxx | v4.x.x note | Done/Verified |

---

### TRACE-01 — Filled Traceability Matrix (v4.2.x), produced 2026-06-07

Cross-reference of every shipped Feature 1–4 / UX item against SRS FR IDs, Use Cases, Scenarios, User Journeys, Test Cases, and Release Notes. Cells marked `GAP — not found` indicate a missing cross-reference that must be closed (either by adding the doc reference or by writing the missing doc content) before TRACE-01 can be marked ✅ Done. This pass is a **first compilation**, not a closure — see Gaps Summary below for the punch-list that remains.

| Feature | SRS FR ID | Use Case ID | Scenario ID | User Journey ID | Test Case ID | Release Note | TODO Status |
|---|---|---|---|---|---|---|---|
| F1-01 Sprint throughput engine | FR-207, FR-208, FR-211, FR-212 | UC-043 | SCN-012 | UJ-010 | TC-T-01, TC-T-03, TC-T-04, TC-T-05, TC-T-06 | v3.0 — "Sprint throughput engine (committed/completed/carryover/goal outcome/delivery pattern)" | ✅ Done |
| F1-02 Mid-sprint pattern detection | FR-209, FR-210 | UC-044 | SCN-012 | UJ-010 | TC-T-02, TC-T-07, TC-T-08, TC-T-09, TC-T-10 | v3.0 — "Mid-sprint pattern detection (5 patterns)" | ✅ Done |
| F1-03 Kanban flow analytics | FR-213 | UC-045 | SCN-014 | GAP — not found | GAP — not found (no formula-level TC; only TC-MC-13/TC-MI-08 touch confidence) | v3.0 — "Kanban flow analytics (monthly periods, flow efficiency, aging WIP, bottleneck)" | ✅ Done |
| F1-04 SprintThroughputPanel component | FR-214 | UC-043 | SCN-012, SCN-020 | UJ-010, UJ-019 | GAP — not found (no component-render TC) | v3.0 — "SprintThroughputPanel, MidSprintDeliveryPanel, KanbanThroughputPanel on dashboard" | ✅ Done |
| F1-05 MidSprintDeliveryPanel component | FR-214 | UC-044 | SCN-020 | UJ-019 | GAP — not found | v3.0 — same bullet as F1-04 | ✅ Done |
| F1-06 KanbanThroughputPanel component | FR-214 | UC-045 | SCN-014 | GAP — not found | GAP — not found | v3.0 — same bullet as F1-04 | ✅ Done |
| F1-07 TypeScript types `src/types/throughput.ts` | FR-215 (anchored 2026-06-08 — `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` are the types FR-215 names) | UC-043 (Related FR extended to FR-207–FR-215 2026-06-08) | SCN-012 (Related line added 2026-06-08) | UJ-010 | TC-T-11 (new 2026-06-08 — shape-contract test) | v3.0 — "`src/types/throughput.ts` — full TypeScript coverage" | ✅ Done |
| F1-08 DashboardMetrics extended with `throughput` field | FR-215 | UC-043 (Related FR extended to FR-207–FR-215 2026-06-08) | SCN-012 (Related line added 2026-06-08) | UJ-010 | TC-T-11 (new 2026-06-08 — asserts `metrics.throughput` conforms to `ThroughputMetrics`) | v3.0 — implied by FR-215 ("all throughput data under a `throughput` field"); no distinct bullet | ✅ Done |
| F2-01 Hierarchy reconstruction service | FR-218 | UC-046 | GAP — not found | GAP — not found | TC-E-01, TC-E-02, TC-E-07, TC-E-08 | v3.0 — "Hierarchy reconstruction (multi-signal: parent key, epic link, key prefix)" | ✅ Done |
| F2-02 Orphan risk detection with delivery impact | FR-219 | UC-046 (Alt Flow B) | GAP — not found | GAP — not found | TC-E-06 | v3.0 — "Orphan risk detection — 4-class classification with delivery impact statements" | ✅ Done |
| F2-03 Relation graph builder | FR-217, FR-218 | UC-046 | SCN-013 | UJ-011 | TC-E-01–TC-E-08 | v3.0 — implicit in "hierarchy reconstruction... React Flow visual graph" bullet | ✅ Done |
| F2-04 React Flow visual graph with Dagre layout | FR-220 | UC-046 | SCN-013 | UJ-011 | GAP — not found (no TC asserts Dagre layout positions) | v3.0 — "React Flow visual graph with Dagre layout, custom node cards, pan/zoom, minimap" | ✅ Done |
| F2-05 Node styles per issue type | FR-221 | UC-046 | SCN-044 | UJ-011 | TC-E-01–TC-E-08 (graph rendering covers per-type node styling) | GAP — not found (Release Notes say only "custom node cards") | ✅ Done — traceability closed 2026-06-08 |
| F2-06 Orphan node visual treatment | FR-222 | UC-046 (Alt Flow B), UC-088 (Alt Flow B) | SCN-044 | UJ-028 (step 1) | TC-E-06 | GAP — not found | ✅ Done — traceability closed 2026-06-08 |
| F2-07 RelationLegend / RelationInsightPanel / RelationStatsCards / RelationDetailsTable | FR-223, FR-224 | UC-046, UC-088 | SCN-044 | UJ-028 (steps 2–3) | TC-E-01–TC-E-08, TC-LB-01–TC-LB-08 (RelationStatsCards' Largest Unfinished Branch card) | GAP — not found (Release Notes name "RelationCharts" and "custom node cards" but not these four panels) | ✅ Done — traceability closed 2026-06-08 |
| F2-08 RelationCharts (completion, health, types, assignee, sprint, orphan) | FR-223 | UC-046 | SCN-044 | UJ-011 | GAP — not found | v3.0 — "RelationCharts — 6 chart cards per issue" | ✅ Done |
| F2-09 Field-format bug fix for FlowItem/raw JiraIssue | FR-225A | UC-046 (Alt Flow B), UC-088 (Alt Flow B) | SCN-044 | UJ-028 (pain point) | TC-FF-01–TC-FF-06 (all ✅ Automated — `fieldFormatCompat.test.ts`) | v3.0 — "Bug fix: field format compatibility (FlowItem and raw JiraIssue)" | ✅ Done — traceability closed 2026-06-08, all 6 test cases automated 2026-06-08 |
| F2-10 Explore added to app navigation | FR-279 | GAP — not found (no dedicated UC; implied by UJ-011 step 1) | SCN-013, SCN-036 | UJ-011 | GAP — not found | v3.0 — "New Routes: `/explore`"; v4.0 — "grouped sub-menu... Delivery: ...Explore" | ✅ Done |
| F2-11 Risk-path highlight | FR-225B | UC-088 | SCN-026, SCN-044 | UJ-028 | TC-RP-01–TC-RP-08 (all ✅ Pass — `riskPath.test.ts`, re-verified 2026-06-08) | v4.0 — "9.18 Risk-path highlight" | ✅ Done — traceability closed 2026-06-08, code re-verified against `computeRiskPaths()` (`relationExplorer.service.ts`) |
| F2-12 Largest unfinished branch insight | FR-225C | UC-088 | SCN-026, SCN-044 | UJ-028 | TC-LB-01–TC-LB-08 (all ✅ Pass — `largestBranch.test.ts`, re-verified 2026-06-08) | v4.0 — "9.19 Largest unfinished branch" | ✅ Done — traceability closed 2026-06-08, code re-verified against `computeLargestUnfinishedBranch()` (`relationExplorer.service.ts`) |
| F2-13 Blocked branch filter | FR-225D | UC-088 | SCN-044 | UJ-028 | TC-BF-01–TC-BF-08 (all ✅ Pass — `blockedBranchFilter.test.ts`, re-verified 2026-06-08) | v4.0 — "9.20 Blocked branch filter" | ✅ Done — traceability closed 2026-06-08, code re-verified against `ExplorePage`/`WorkItemGraph` `dimNonRiskPath` filter logic |
| F3-01 Prisma/iron-session/bcryptjs installed | GAP — not found (FR-228/229 describe enabled behaviours, not the install) | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 — "Package note: prisma, @prisma/client, iron-session, bcryptjs — installed and active" | ✅ Done |
| F3-02 Prisma schema (User, Session, ImportLog, DashboardSnapshot, AuditEvent) | FR-231, FR-232, FR-255 | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 — "SQLite via Prisma 5 (`data/delivery_clarity.db`)" | ✅ Done |
| F3-03 SQLite database created | GAP — not found | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 / v4.2.2 — "Normalized relative SQLite `DATABASE_URL`..." | ✅ Done |
| F3-04 Seed script and first admin user | GAP — not found | GAP — not found | SCN-015 | GAP — not found | GAP — not found | GAP — not found (only implied by SQLite/Prisma bullet) | ✅ Done |
| F3-05 Auth API routes (login/logout/register/me/change-password) | FR-228, FR-229, FR-230, FR-235, FR-235D | UC-047, UC-050 | SCN-015 | UJ-012 | TC-A-01, TC-A-02, TC-A-06, TC-A-09 | v3.0 — "Auth API: login (bcrypt, iron-session, rate-limit 5/min), logout, register, me" | ✅ Done |
| F3-06 Login page | FR-226, FR-300 | UC-047, UC-075 | SCN-015 | UJ-012 | TC-A-01, TC-A-02 | v3.0 — page list bullet; v4.0 — FR-300 branding | ✅ Done |
| F3-07 Register route reserved but inactive | FR-235 | UC-050 (Alt Flow A) | GAP — not found | GAP — not found | GAP — not found (no TC asserts the 403/redirect specifically) | v4.2.2 — "Locked public registration: `/register` redirects to `/login`, `POST /api/auth/register` returns 403" | ✅ Done |
| F3-08 Profile page | FR-235F, FR-235F.1 | GAP — not found | SCN-015 | UJ-012 | TC-A-08 (loose), `profileImage.test.ts` (2 tests) | v4.2.2 — "Expanded `/profile`... Added S3-backed profile image upload" | ✅ Done |
| F3-09 Admin logs page | FR-227, FR-233 | UC-048 | SCN-015 | UJ-014 | TC-A-04, TC-A-05 | v3.0 — "Admin sees all users' logs; regular user sees only own logs" | ✅ Done |
| F3-10 UserMenu in header | FR-234 | GAP — not found | GAP — not found | UJ-012 | GAP — not found | v3.0 — "UserMenu in header (avatar, name, role badge, sign out)" | ✅ Done |
| F3-11 Middleware route protection | FR-226, FR-227, FR-235D, FR-235E | UC-047 | SCN-015 | UJ-012 | TC-A-03 | v3.0 — "Middleware route protection (all app routes guarded)" | ✅ Done |
| F3-12 Upload API saves ImportLog with userId | FR-232 | GAP — not found | GAP — not found | GAP — not found | TC-A-07 | v3.0 — "Upload API saves ImportLog with userId to SQLite" | ✅ Done |
| F3-13 `/api/imports` filtered by user/admin | FR-233 | UC-048 | GAP — not found | GAP — not found | TC-A-04, TC-A-05 | v3.0 — "Admin sees all users' logs; regular user sees only own logs" | ✅ Done |
| F3-14 Admin user management with role assignment | FR-235A, FR-235B, FR-235C, FR-233 | UC-084 | SCN-039, SCN-040 | UJ-024 | TC-AU-01–TC-AU-07 (all ✅ Automated — `adminUsers.test.ts`) | v4.2.2 — "Added admin-managed users in `/admin/settings → Users`..." | ✅ Done — traceability closed 2026-06-07, all 7 test cases automated 2026-06-07 |
| F3-15 Member directory `/members` | FR-235G | UC-085 | SCN-041 | UJ-025 | TC-MD-01–TC-MD-08 (all ✅ Automated — `roles.test.ts` / `members.test.ts`) | v4.2.2 — "Added `/members`: searchable member cards + detail popup" | ✅ Done — traceability closed 2026-06-07, all 8 test cases automated 2026-06-07 (route + `matchesMemberQuery`/`contactEmailFor` extracted to `src/lib/members.ts` for direct unit testing) |
| F3-16 Forced first-login password change | FR-235D | UC-086 | SCN-042 | UJ-026 | TC-PW-01–TC-PW-10 (all ✅ Automated — `roles.test.ts` / `auth.test.ts` / `middleware.test.ts` / `changePassword.test.ts`) | v4.2.2 — "...first-login password-change enforcement" | ✅ Done — traceability closed 2026-06-07, all 10 test cases automated 2026-06-07 |
| F4-01 Recommendation engine (evidence/impact/owner/action) | FR-238, FR-239, FR-295 | UC-049 | SCN-016 | UJ-013 | `excelExport.test.ts` (15 tests, no dedicated TC-X row) | v3.0 — "Recommendation engine (10+ rules, evidence + impact + owner + action)" | ✅ Done |
| F4-02 17-sheet statistical workbook | FR-236, FR-237 | UC-049 | SCN-016 | UJ-013 | TC-X-04 | v3.0 — full 17-sheet bullet | ✅ Done |
| F4-03 Executive Summary sheet | FR-238 | UC-049 | SCN-016 | UJ-013 | TC-X-02 | v3.0 — "Executive Summary..." | ✅ Done |
| F4-04 Sprint Throughput / Mid-Sprint / Kanban Flow sheets | FR-207, FR-236 | GAP — not found | SCN-012, SCN-014 | GAP — not found | TC-X-01 | v3.0 — sheet bullet | ✅ Done |
| F4-05 Risks & Blockers / Orphan & Data Quality / Release Readiness sheets | FR-236, FR-310 | UC-089 | SCN-045 | UJ-029 | TC-X-09a, TC-X-09b, TC-X-10a, TC-X-10b, TC-X-10c, TC-X-12 | v3.0 — sheet bullet; v4.2.2 — TRACE-01 cluster #3 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08, all 6 sheet-content TCs automated in `excelExportSheets.test.ts` |
| F4-06 Cycle & Lead Time percentile analysis | FR-236, FR-310 | UC-089 | SCN-016, SCN-045 | UJ-029 | TC-X-11a, TC-X-11b | v3.0 — "Cycle & Lead Time, Throughput Trends..."; v4.2.2 — TRACE-01 cluster #3 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08, percentile + slowest-items logic re-verified and automated |
| F4-07 Metric Dictionary sheet | FR-240 | UC-049 | GAP — not found | UJ-013 | TC-X-05 | v3.0 — "Metric Dictionary, Raw Data Reference" | ✅ Done |
| F4-08 Export button triggers smart workbook | FR-236, FR-311 | UC-049, UC-089 | SCN-016, SCN-045 | UJ-013, UJ-029 | TC-X-13, TC-X-13b | v3.0 — "Export button in dashboard sticky bar and summary page"; v4.2.2 — TRACE-01 cluster #3 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08, trigger flow (`exportToExcel`, default + custom filename) automated in `excelExportSheets.test.ts` |
| UX-01 Dashboard sections collapsible | FR-214 (implied) | GAP — not found | GAP — not found | UJ-010 | GAP — not found | v3.0 — "All dashboard sections collapsible" | ✅ Done |
| UX-02 Default open sections | FR-271, FR-272 | UC-062 | SCN-024 | UJ-021 | TC-DV-01, TC-DV-05–TC-DV-10 | "9.9 Role-based dashboard views — 5 views..., section hiding, TierSep/Flow Panel hiding, 10 tests" | ✅ Done — traceability closed 2026-06-08 (matrix was stale: `defaultOpen`/`hideTiers`/`hideFlowPanel` per view are anchored via `UC-062`/`SCN-024`/`UJ-021`/`FR-271`–`FR-272`/`TC-DV-*`, not independent gaps) |
| UX-03 Status chips on section triggers | FR-308 | UC-090 | SCN-046 | UJ-030 | TC-CH-01–TC-CH-03 | v4.2.2 — TRACE-01 cluster #5 closure (2026-06-08): new `FR-308`/`BR-112` document the 5-tier chip convention | ✅ Done — traceability closed 2026-06-08, genuine gap newly anchored: `Chip`/`CHIP_CLS` extracted to `src/lib/dashboardChips.ts` and automated as `TC-CH-01–03` |
| UX-04 Upload-to-dashboard redirect fix | FR-200 | GAP — not found | GAP — not found | UJ-010 | TC-101 | v3.0 — "Upload → dashboard redirect bug fixed" | ✅ Done |
| UX-05 HTML export redesigned | FR-300 (brand mark) | UC-076 | SCN-035 | UJ-031 | TC-X-14 | v4.0 — "HTML report export: Lightning bolt brand mark... footer 'Delivery Clarity v4.1'"; v4.2.2 — TRACE-01 cluster #5 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08 (UC/SCN matrix entries were stale — `UC-076`/`SCN-035` already narrated this; new `UJ-031` written and `buildReportHtml()` extracted from `exportToHtml` so the branding markup is independently testable as `TC-X-14`) |
| UX-06 Calculation Reference visible in /developer side menu | FR-283 | UC-059 | SCN-022 | GAP — not found | GAP — not found (no formal TC-xxx) | "P1.1 — Done" via FR-283 acceptance detail | ✅ Done |
| UX-07 Clear Local Data in Admin Settings | FR-284, FR-286 | UC-057, UC-060 | SCN-018, SCN-023 | UJ-017, UJ-020 | TC-CLD-01–TC-CLD-10 | v4.1 — "P1.2 — Clear Local Data... 10 automated tests (TC-CLD-01–10)" | ✅ Done |
| UX-08 Clear Local Data on Upload/Landing page | FR-284 | UC-056, UC-060 | SCN-019, SCN-023 | UJ-017 | TC-CLD-01–TC-CLD-10 | v4.1 — same P1.2 bullet (banner detection on upload page) | ✅ Done |
| UX-09 Dashboard Section Switcher with smooth scroll/animation | FR-285 | UC-058, UC-061 | SCN-020, SCN-024, SCN-025 | UJ-019 | TC-DS-01–TC-DS-10 | v4.1 — "P1.3 — Dashboard Section Switcher... 10 automated tests (TC-DS-01–10)" | ✅ Done |
| UX-10 Product tour animation | FR-303 | UC-079, UC-080 | SCN-035 | GAP — not found | TC-PT-01–TC-PT-08 | v4.1 — "P3 — Product Tour Animation: 8-step guided tour... 8 tests (TC-PT-01–08)" | ✅ Done |
| UX-11 Advanced theme customization | FR-304 | UC-081 | SCN-047 | UJ-032 | TC-TC-01–TC-TC-08 | v4.1 — "P3 — Advanced Theme Customization: 8 tests (TC-TC-01–08)"; v4.2.2 — TRACE-01 cluster #5 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08 (UC/FR/TC entries were already anchored — only `SCN-047`/`UJ-032` were genuinely missing and have now been written) |
| UX-12 Custom dashboard layout builder | FR-305 | UC-082 | GAP — not found | GAP — not found | TC-LB2-01–TC-LB2-09 | v4.1 — "P3 — Custom Dashboard Layout Builder: 9 tests (TC-LB2-01–08)" | ✅ Done |
| UX-13 Advanced chart customization | FR-306 | UC-091 | SCN-048 | UJ-033 | TC-CC-01–TC-CC-08 | v4.1 — "P3 — Advanced Chart Customization: 9 tests (TC-CC-01–08)"; v4.2.2 — TRACE-01 cluster #5 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08 (FR/TC entries were already anchored — `UC-091`/`SCN-048`/`UJ-033` were genuinely missing and have now been written) |
| UX-14 Flat admin-settings UI redesign | FR-260A | UC-087 | SCN-043 | UJ-027 | TC-AC-01–TC-AC-03 | v4.2.2 — "Redesigned `/admin/settings` to match the flat admin settings mockup..." | ✅ Done |
| Delivery Forecast: velocity-based projection + burn-up chart | FR-328, FR-329 | UC-102 | SCN-052 | UJ-037 | TC-FCAST-01–TC-FCAST-05 | v4.3.5 — "REC-16: UC-102 verified; Related UJ/TC cross-references added" | ✅ Done — REC-16 closed 2026-06-19 |
| Sprint Retrospective: in-app form + generateInsights() | FR-330, FR-331, FR-332 | UC-103 | SCN-053 | UJ-038 | TC-RETRO-01–TC-RETRO-07 | v4.3.5 — "REC-15: UC-103 verified; Related UJ/TC cross-references added" | ✅ Done — REC-15 closed 2026-06-19 |
| Retrospective template download: CSV Blob download | FR-333 | UC-104 | SCN-056 | UJ-038 (Alt B) | TC-RETRO-05 (⬜ Manual) | v4.3.5 — "REC-15: UC-104 verified; SCN-056 + UJ-038 Alt B written" | ✅ Done — REC-15 closed 2026-06-19 |
| Delivery Roadmap: epic cards + forecast labels + filter/sort | FR-326, FR-327 | UC-101 | SCN-051 | UJ-036 | TC-ROAD-01–TC-ROAD-05 (on feat/roadmap-forecast-extraction) | v4.3.6 — "REC-14 closed; UC-101 Related UJ/TC added; Section 12 roadmap row added" | ✅ Done — REC-14 closed 2026-06-19; ROADMAP-02 done on feat/roadmap-forecast-extraction |

### Gaps Summary — Punch List to Close TRACE-01 (prioritized)

1. ~~**Highest priority — Feature 3 admin/user/member items (F3-14, F3-15, F3-16)**~~ — **FULLY CLOSED 2026-06-07.** Added `UC-084/085/086`, `SCN-039–042`, `UJ-024–026`, and formal `TC-AU-01–07` / `TC-MD-01–08` / `TC-PW-01–10` IDs (see `product/USE_CASES.md`, `SCENARIOS.md`, `USER_JOURNEYS.md`, `TEST_CASES.md` §9.43), then **automated all 14 previously-❌-Not-Run test cases the same day**: `TC-AU-06/07` (self-disable-protection, duplicate-email-409 — added to `adminUsers.test.ts`), `TC-MD-05–08` (active/sorted query, search filter, contact-email fallback, anonymous-401 — new `members.test.ts`, with `matchesMemberQuery()`/`contactEmailFor()` extracted to `src/lib/members.ts` for direct unit testing), `TC-PW-07` (middleware `mustChangePassword` redirect — new `middleware.test.ts`), `TC-PW-08–10` (must-differ-from-temp / success / wrong-temp-password — new `changePassword.test.ts`). Test count rose from 469/48 to 481/51 suites; lint and build remain clean. Cluster #1 has zero remaining gaps.
2. ~~**Feature 2 explorer visual/filter items (F2-05, F2-06, F2-07, F2-09, F2-11, F2-12, F2-13)**~~ — **FULLY CLOSED 2026-06-08.** Added four new FRs (`FR-225A` field-format compatibility, `FR-225B` risk-path highlight, `FR-225C` largest-unfinished-branch insight, `FR-225D` blocked-branch filter) to `product/SRS.md`; anchored with a new `UC-088` (Investigate Delivery Risk and Branch Health in the Work Item Explorer — Alt Flow B covers the dual-format compatibility fix), `SCN-044` (Delivery Manager Reads the Visual Graph and Filters to Risk — narrates node styling, orphan badges, all four Relation* panels, risk-path/largest-branch/filter together), and `UJ-028` (Delivery Manager Investigates Risk Paths and Branch Health). **Re-verified F2-11/12/13 at the code level**: confirmed `computeRiskPaths()`, `computeLargestUnfinishedBranch()`, and the `ExplorePage`/`WorkItemGraph` `dimNonRiskPath` filter logic in `relationExplorer.service.ts` match their documented behaviour and all 24 existing `TC-RP`/`TC-LB`/`TC-BF` tests pass — moved from 🔍 Needs verification to ✅ Done. **Wrote and automated 6 new test cases** `TC-FF-01–06` (new `fieldFormatCompat.test.ts`, testing `buildRelationGraph` against raw-only, FlowItem-only, and mixed-format fixtures — no extraction needed, the field accessors in `relationExplorer.service.ts`/`hierarchy.service.ts` were already pure). Test count rose from 492/52 to 498/53 suites; lint and build remain clean. Cluster #2 has zero remaining gaps.
3. ~~**Feature 4 export sheets (F4-05, F4-06, F4-08)**~~ — **FULLY CLOSED 2026-06-08.** Added two new FRs (`FR-310` — sheet-content rules for Risks & Blockers / Orphan & Data Quality / Cycle & Lead Time / Release Readiness, `FR-311` — the dashboard-sticky-bar/`/summary` export-trigger contract — *originally numbered `FR-242`/`FR-243`; renumbered 2026-06-08 to `FR-310`/`FR-311` after colliding with pre-existing Addendum-A "Data Quality Score" FRs of the same IDs, see item 6 below*) to `product/SRS.md`; anchored with a new `UC-089` (Trigger and Review the Smart Excel Workbook from the Dashboard or Summary Page), `SCN-045` (Product Owner Exports the Smart Workbook for an Offline Release Review), and `UJ-029` (Product Owner Exports and Reads the Smart Workbook for an Offline Review). **Wrote and automated 10 new test cases** `TC-X-09a/b`, `TC-X-10a/b/c`, `TC-X-11a/b`, `TC-X-12`, `TC-X-13/13b` (new `excelExportSheets.test.ts`) — covering the Risks & Blockers sort-and-suggested-action logic, the Orphan & Data Quality summary/detail/empty-state blocks, the Cycle & Lead Time P50/P75/P85/P95 percentile math and slowest-items ranking, the Release Readiness Go/Conditional-Go/No-Go grouping, and the `exportToExcel` trigger (default + custom filename, captured via a scoped `jest.mock('xlsx', …)` so no file is written to disk). Also discovered and corrected the stale F4 entry in `product/TEST_CASES.md` §9 (it described 6 *manual, Not-Run* `TC-X-01–06` cases that didn't match the 8 cases — `TC-X-01–08` — already automated in `excelExport.test.ts`); the table now lists all 18 `TC-X-*` cases as ✅ Pass with their owning spec files. Test count rose from 498/53 to 508/54 suites; lint and build remain clean. Cluster #3 has zero remaining gaps.
4. ~~**F1-07/F1-08 (types & DashboardMetrics field)**~~ — **FULLY CLOSED 2026-06-08.** Rather than declaring these "not independently traceable", anchored them to the existing UC/SCN/UJ that already consume the data contract they define: `src/types/throughput.ts` (F1-07, the `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` types) and `DashboardMetrics.throughput` (F1-08, required by `FR-215`) are the data layer behind every panel `UC-043` walks through, so extended `UC-043`'s `Related FR` line from "FR-207 to FR-214" to "FR-207 to FR-215" with an explanatory note, and added a `**Related:**` line to `SCN-012` (`UC-043, UJ-010, FR-207–FR-215, TC-T-01–TC-T-11`) — `UJ-010` already covered the same flow with no changes needed. **Wrote and automated 1 new shape-contract test case `TC-T-11`** in `throughput.test.ts` (now 11 tests), calling `calculateDashboardMetrics()` and asserting `metrics.throughput` conforms to the full `ThroughputMetrics` contract — `sprint: SprintThroughputSummary`, `kanban: KanbanFlowSummary`, `midSprint: MidSprintInsight[]` — with every documented field present and correctly typed, directly proving `FR-215`. Test count rose from 508/54 to 509/54 suites (same file, +1 test); lint and build remain clean. Cluster #4 has zero remaining gaps.
5. ~~**UX-14 (flat admin-settings redesign) and UX-02/03/05/11/13 (UX narrative residue)**~~ — **FULLY CLOSED.** UX-14 closed 2026-06-07: anchored with `UC-087`, `SCN-043`, `UJ-027`, `TC-AC-01–TC-AC-03`, then **automated all 3 previously-❌-Not-Run test cases the same day**: `TC-AC-01` (sidebar tab metadata via `activeTabMeta`/`ADMIN_TABS`), `TC-AC-02` (tab-switch panel/stat-card swap via `activeTabMeta`/`buildSettingsStats`), `TC-AC-03` (Users-tab summary cards, `roleOptionsFor`, `matchesUserFilter` table search/filter) — new `adminSettingsConsole.test.ts`, with `Tab`/`ADMIN_TABS`/`activeTabMeta`/`retentionLabel`/`buildSettingsStats`/`ManagedUser`/`roleOptionsFor`/`matchesUserFilter` extracted to `src/lib/adminConsole.ts` for direct unit testing (mirrors the `src/lib/members.ts` pattern). Test count rose from 481/51 to 492/52 suites. **Cluster #5 (UX-02/03/05/11/13) FULLY CLOSED 2026-06-08** — investigation found 3 of 5 matrix entries were *stale, not gaps*: **UX-02** (Default open sections) was already covered end-to-end by `FR-271`/`FR-272`/`UC-062`/`SCN-024`/`UJ-021`/`TC-DV-01,05–10` — matrix corrected, no new docs needed. **UX-05** (HTML export redesign) already had `UC-076`/`SCN-035` — matrix corrected; only `UJ-031` and a branding test were genuinely missing, so wrote `UJ-031` and extracted the html-string builder out of `exportToHtml` into a new pure `buildReportHtml()` (in `src/lib/exportUtils.ts`) and automated `TC-X-14` against it (asserts the brand-mark SVG, "Delivery Clarity" eyebrow, `<title>`, and footer attribution are present in the rendered markup). **UX-11** (Advanced theme customization) already had `FR-304`/`UC-081`/`TC-TC-01–08` — only `SCN-047`/`UJ-032` were missing and have been written. The two genuine gaps: **UX-13** (Advanced chart customization) had `FR-306`/`TC-CC-01–08` but no UC/SCN/UJ — wrote new `UC-091`/`SCN-048`/`UJ-033`. **UX-03** (Status chips on section triggers) was a true zero-anchor gap — the cross-cutting `Chip`/`CollapsibleTrigger` system spanning ~16 dashboard sections had no FR/UC/SCN/TC anywhere and lived purely as inline JSX in `app/dashboard/page.tsx`; extracted `Chip`/`CHIP_CLS`/`chipClass()`/`mostSevereChipType()` to a new pure module `src/lib/dashboardChips.ts` (mirrors the `adminConsole.ts`/`members.ts` extraction pattern), wrote new `FR-308`/`BR-112` documenting the 5-tier severity convention, anchored with new `UC-090`/`SCN-046`/`UJ-030`, and automated `TC-CH-01–TC-CH-03` (tier→style mapping, neutral fallback, `mostSevereChipType` severity ranking) in new `dashboardChips.test.ts`. **Net new for cluster #5**: 1 FR (`FR-308`), 1 BR (`BR-112`), 2 new UCs (`UC-090`, `UC-091`) plus corrected matrix anchors for `UC-062`/`UC-076`/`UC-081`, 3 new SCNs (`SCN-046/047/048`) plus corrected anchors for `SCN-024`/`SCN-035`, 4 new UJs (`UJ-030/031/032/033`) plus a corrected anchor for `UJ-021`, and 4 new test cases (`TC-CH-01–03`, `TC-X-14`) automated across 2 new spec files (`dashboardChips.test.ts`, `exportUtilsHtml.test.ts`). Suite grew from 509/54 to 513/56. Cluster #5 — and with it the entire UX narrative-residue punch-list item — has zero remaining gaps.
6. ~~**Cross-cutting ambiguity**: USE_CASES.md bundles multiple FRs under one UC via "Related FR: FR-207–FR-214" style ranges (e.g., UC-043, UC-046), which makes strict 1:1 FR↔UC traceability ambiguous.~~ — **FULLY CLOSED 2026-06-08.** Investigating the ranges surfaced that bundling wasn't actually the worst problem — there were **real ID collisions** undermining traceability integrity: (a) `FR-242`/`FR-243` were each defined *twice* with unrelated meanings (the cluster #3 closure had minted new `FR-242`/`FR-243` for the Excel sheet-content/export-trigger contracts, unknowingly colliding with the pre-existing Addendum-A "Data Quality Score" `FR-242`/`FR-243`); (b) `FR-235D` was defined twice (forced-password-change redirect vs. dashboard-view role-locking — the latter an orphan, referenced nowhere by ID); (c) `UC-043`/`UC-044` each had two entirely different definitions (stale pre-v3.0 ones — "Return from Full Report to Summary" / "Direct URL Access to Protected Route" — plus the current v3.0 ones the matrix anchors to); (d) `FR-309` was referenced in `UC-083`'s Related-FR line but never defined in `product/SRS.md` (a phantom), alongside a stale `FR-308` reference on the same line that actually names the unrelated status-chip FR. **Fixed all four**: renumbered the cluster #3 FRs to `FR-310`/`FR-311` (with an explanatory note on each pointing back to the collision), renumbered the orphan dashboard-view-locking FR to `FR-235H`, renumbered the stale `UC-043`/`UC-044` to `UC-092`/`UC-093` (each annotated with the renumbering reason; neither was referenced anywhere else by ID so no cross-reference updates were needed), wrote a new, correctly-scoped `FR-309` (P3 — Done) formally documenting the bucket-backed metrics restore-and-fallback flow that `UC-083` actually narrates (resolving the phantom by making the reference real), and corrected `UC-083`'s Related-FR line to `FR-307, FR-309` (dropping the unrelated `FR-308`). Propagated the `FR-242→FR-310` / `FR-243→FR-311` renumbering across every cross-reference: `product/USE_CASES.md` (`UC-089`), `product/SCENARIOS.md` (`SCN-045`), `product/TEST_CASES.md` (F4 `**Related:**` line), `product/RELEASE_NOTES.md` (cluster #3 section, with an explanatory renumbering footnote preserving the historical record), and `TODO-List.md` (matrix rows F4-05/06/08, Gaps Summary item 3, F4-TRACE row, Documentation Impact Matrix table, progress paragraph). **Then built the FR→UC Ownership Index** (new "TRACE-01 Appendix B" subsection below) — expanding every bundled range (`UC-043`/`046`/`047`/`049`/`051`/`052`/`053`/`055`) into individual FR IDs and stating each one's authoritative owning UC per the Section 12 matrix, with genuine multi-UC overlaps (e.g., `FR-236` serving both `UC-049` and `UC-089`; `FR-222`–`FR-224` serving both `UC-046` and `UC-088`) explicitly marked "co-implemented" rather than left ambiguous. Re-ran the full suite (still 513/56 passing — these were documentation-only ID corrections, no code changed) plus lint and build. **TRACE-01 has zero remaining gaps and is now ✅ Done.**

### TRACE-01 Appendix B — FR→UC Ownership Index (resolves Gaps Summary item 6, produced 2026-06-08)

The Section 12 matrix cross-references each shipped Feature to its FR(s)/UC/SCN/UJ/TC. Several Use Cases additionally summarise their scope in `product/USE_CASES.md` with a broad `**Related FR:** FR-xxx to FR-yyy` range — useful narrative context, but not a precise 1:1 ownership statement (e.g., `UC-043`'s "FR-207 to FR-215" range overlaps `UC-044`'s and `UC-045`'s individually-claimed FRs). This index expands every such bundled range into individual FR IDs and states each one's **authoritative owning UC**, exactly as assigned in the Section 12 matrix — making FR↔UC lookups unambiguous without rewriting the narrative ranges (which remain accurate as "this whole flow touches this FR neighbourhood" context).

| FR ID | Requirement (short) | Owning UC (per Section 12 matrix) | Notes |
|---|---|---|---|
| FR-207 | Sprint throughput summary calculation | UC-043 | Primary (F1-01) |
| FR-208 | Sprint date resolution | UC-043, UC-044 | Co-implemented — F1-01 (`UC-043`) computes from it; F1-02 (`UC-044`) mid-sprint metrics depend on it |
| FR-209 | Sprint midpoint + mid-sprint metrics | UC-044 | Primary (F1-02) |
| FR-210 | 5-pattern delivery classification | UC-044 | Primary (F1-02) |
| FR-211 | Sprint goal outcome calculation | UC-043 | Primary (F1-01) |
| FR-212 | Delivery trend calculation | UC-043 | Primary (F1-01) |
| FR-213 | Kanban flow metrics calculation | UC-045 | Primary (F1-03) |
| FR-214 | Collapsible throughput-panel display | UC-043, UC-044, UC-045 | Shared — one display FR serving three distinct panels (F1-04/05/06) |
| FR-215 | `DashboardMetrics.throughput` data contract | UC-043 | Anchored 2026-06-08 (cluster #4 — F1-07/08); `UC-043`'s range was extended to include it |
| FR-216 | `/explore` route exists | UC-046 | Primary — route-entry trigger condition in `UC-046`'s own narrative |
| FR-217 | Focus/parent/children-only graph scope | UC-046 | Primary (F2-03) |
| FR-218 | Multi-signal hierarchy reconstruction | UC-046 | Primary (F2-01, F2-03) |
| FR-219 | 4-class orphan classification | UC-046 | Primary (F2-02 Alt Flow B) |
| FR-220 | React Flow + Dagre visual graph | UC-046 | Primary (F2-04) |
| FR-221 | Per-issue-type node styles | UC-046 | Primary (F2-05) |
| FR-222 | Orphan node visual treatment | UC-046, UC-088 | Co-implemented (F2-06) |
| FR-223 | RelationCharts / KPI cards / details table | UC-046, UC-088 | Co-implemented (F2-07, F2-08) |
| FR-224 | Details-table filter and search | UC-046, UC-088 | Co-implemented (F2-07) |
| FR-225 | Recent-searches chips (`dc_explore_recent`) | UC-046 | Primary — narrative only, no dedicated matrix row |
| FR-226 | Middleware route protection (redirect map) | UC-047 | Primary (F3-06, F3-11) |
| FR-227 | `/admin` role gate | UC-047, UC-048 | Co-implemented — `UC-047` (F3-11 middleware), `UC-048` (F3-09/13 admin-logs/imports gate) |
| FR-228 | Password hashing (bcrypt, 12 rounds) | UC-047, UC-050 | Co-implemented (F3-05 auth API routes) |
| FR-229 | Session cookies (iron-session, TTL) | UC-047, UC-050 | Co-implemented (F3-05) |
| FR-230 | Login rate-limiting (5/min, HTTP 429) | UC-047, UC-050 | Co-implemented (F3-05) |
| FR-236 | 17-sheet workbook structure | UC-049, UC-089 | Co-implemented — `UC-049` defines the workbook (F4-02/04); `UC-089` reviews four of its sheets and triggers the download (F4-05/06/08) |
| FR-237 | Frozen header / auto-filter / column widths | UC-049 | Primary — narrative (every sheet) |
| FR-238 | Executive Summary sheet contents | UC-049 | Primary (F4-01, F4-03) |
| FR-239 | Recommendations sheet contents | UC-049 | Primary — narrative |
| FR-240 | Metric Dictionary sheet contents | UC-049 | Primary (F4-07) |
| FR-241 | No HTML/JSX/`[object Object]` in cells | UC-049 | Primary — narrative (workbook-wide constraint) |
| FR-242 | Data Quality Score calculation (10 field checks) | UC-051 | Primary |
| FR-243 | Data Quality Score band classification (5 bands) | UC-051 | Primary |
| FR-244 | Score/band display on preview + dashboard | UC-051 | Primary |
| FR-245 | Plain-English score-meaning summary | UC-051 | Primary |
| FR-275 | Column-mapping preview page (incl. Data Quality Score) | UC-051 | Co-referenced — the page `UC-051` walks through end to end |
| FR-246 | Metric Confidence Score calculation | UC-052 | Primary |
| FR-247 | Confidence levels (High/Medium/Low/Unreliable/N-A) | UC-052 | Primary |
| FR-248 | Confidence badge display + reason tooltip | UC-052 | Primary |
| FR-255 | Save dashboard snapshot (max 20/user) | UC-053 | Primary |
| FR-256 | `/snapshots` list page | UC-053 | Primary |
| FR-260 | Configure 9 health thresholds (admin) | UC-055 | Primary |
| FR-261 | Persist thresholds to `health-thresholds.json` | UC-055 | Primary |

**How to read this index:** "Primary" means the Section 12 matrix assigns this FR to exactly one UC — the bundled range in that UC's `**Related FR**` line is consistent with the matrix and creates no ambiguity once expanded. "Co-implemented" means the matrix legitimately assigns this FR to more than one UC because two distinct user flows genuinely share the same requirement (e.g., both the auth-gate flow `UC-047` and the registration-redirect flow `UC-050` implement the same password/session/rate-limit rules from the same `POST /api/auth/*` routes) — this is **not** an error, just a many-to-many relationship that a strict 1:1 matrix cell can't express on its own. No FR in this index is *unowned* or *contradictorily* owned; the original "ambiguity" was resolvable entirely from the existing Section 12 matrix once the four ID collisions above were corrected.

**Net assessment (updated 2026-06-08 — TRACE-01 now fully closed):** Gap clusters #1 (F3-14/15/16), UX-14, #2 (F2-05/06/07/09/11/12/13), #3 (F4-05/06/08 — Excel export sheets and trigger), #4 (F1-07/08 — throughput types & `DashboardMetrics.throughput` data contract), #5 (UX-02/03/05/11/13 — UX narrative residue), and now #6 (the FR↔UC bundling/collision review) are **all fully closed**: documentation anchored across all clusters (4+2+2+0+2 new FRs plus 1 new BR across #1–5 — cluster #4 reused `FR-215` and extended `UC-043`'s range; cluster #5 added `FR-308`/`BR-112`; cluster #6 added a correctly-scoped `FR-309` and renumbered four colliding IDs — plus 8 new UCs, 10 new SCNs, 10 new UJs across clusters #1–5, and 1 new `**Related:**` line on `SCN-012`), F2-11/12/13 re-verified at the code level and promoted from 🔍 to ✅, and 38 new test cases (14 + `TC-AC-01–03` + `TC-FF-01–06` + `TC-X-09a/b/10a/b/c/11a/b/12/13/13b` + `TC-T-11` + `TC-CH-01–03` + `TC-X-14`) automated across six passes — including a brand-new `src/lib/dashboardChips.ts` extraction (mirroring `adminConsole.ts`/`members.ts`) for the previously-untested, cross-cutting status-chip convention, and a minimal `buildReportHtml()` extraction from `exportToHtml` so the redesigned HTML report's branding markup is independently testable. **Cluster #6 additionally found and fixed four real ID collisions** that the "bundling ambiguity" framing had been masking — duplicate `FR-242`/`FR-243` (one pair self-inflicted by cluster #3), duplicate `FR-235D`, duplicate `UC-043`/`UC-044`, and a phantom `FR-309` reference — renumbering the colliding/orphaned IDs to `FR-310`/`FR-311`/`FR-235H`/`UC-092`/`UC-093`, writing a correctly-scoped `FR-309`, and propagating every cross-reference; then built **TRACE-01 Appendix B** (the FR→UC Ownership Index) which expands all 8 bundled `**Related FR**` ranges into individual FR IDs with their authoritative UC owner per the Section 12 matrix — proving the remaining "bundling" was navigable narrative shorthand, not genuine ambiguity, once the collisions were gone. Test suite remains at **513/56** (cluster #6 was documentation-only — no code changed, so no new tests were needed); lint and build remain clean throughout. **The Section 12 matrix has zero `GAP — not found` cells and zero ID collisions — TRACE-01 is ✅ Done.**

**TRACE-02 update (2026-06-08 — also now fully closed):** Following the same evidence-based approach, ran a user-approved "survey-first, then cluster" pass over all 22 `COVER-XX` areas in Section 8. Outcome: 2 of the survey's "thin"/"gap" flags were stale framing and already fully covered once re-verified (`COVER-02` route-protection matrix, `COVER-05` admin features — re-verified ✅, no new content needed, mirroring the cluster #5 "stale matrix cell" pattern above); 1 large genuine gap closed (`COVER-03` — new SRS §8.1 36-row Next.js API route inventory, since the existing API spec documented only the legacy standalone-Express backend); 1 narrow genuine gap closed (`COVER-06` — multi-file merge control had a live route/UI/pure-function with zero anchor, closed with new `FR-312`/`UC-094`/`mergeIssues.test.ts` TC-UM-01–06); 1 TC-ID collision/drift cluster resolved (`COVER-11` — the stale manual "F3 — Authentication Tests" table's TC-A-01–09 had drifted from `auth.test.ts`'s independent reuse of the same IDs; renumbered the five colliding rows to TC-A-10–14 and closed the genuinely-untested scenarios with 7 new tests across `middleware.test.ts`/`logout.test.ts`/`uploadUserId.test.ts`); 1 error-state gap closed (`COVER-12` — `GET /api/snapshots/:id`'s 401/404/403 load-failure paths had no direct test, closed with new `snapshotLoadErrors.test.ts` TC-SN-09–11); and 5 roadmap items confirmed correctly-scoped per explicit user decision rather than authoring speculative FR/UC/TC content for unbuilt features (`COVER-17`–`21` — gateway, notifications, forecasting, retrospective, coaching all have zero pages/routes/code and remain clearly marked "not yet implemented"). Test suite grew from 513/56 to **527/60** (14 new tests across 4 new files plus 1 addition to an existing suite: `mergeIssues.test.ts` 6 tests, `logout.test.ts` 2 tests, `uploadUserId.test.ts` 2 tests, `snapshotLoadErrors.test.ts` 3 tests, and 1 new test — TC-A-10 — added to `middleware.test.ts`; verified via `npx jest` → "Test Suites: 60 passed, 60 total / Tests: 527 passed, 527 total"). **All 22 `COVER-XX` rows are ✅ Done — TRACE-02 is ✅ Done.**

---

## 13. Current Verified / Existing Feature Inventory

The following items are in the uploaded TODO as Done. Keep them, but verify traceability.

### Feature 1 — Throughput & Delivery Analytics

| ID | Task | Priority | Status |
|---|---|---:|---|
| F1-01 | Sprint throughput engine: committed, done, carryover, goal outcome, delivery pattern | P0 | ✅ Done |
| F1-02 | Mid-sprint pattern detection: Healthy / End-Loaded / Blocked / Scope Instability | P0 | ✅ Done |
| F1-03 | Kanban flow analytics: monthly periods, flow efficiency, aging WIP, bottleneck | P0 | ✅ Done |
| F1-04 | SprintThroughputPanel dashboard component | P0 | ✅ Done |
| F1-05 | MidSprintDeliveryPanel dashboard component | P0 | ✅ Done |
| F1-06 | KanbanThroughputPanel dashboard component | P0 | ✅ Done |
| F1-07 | TypeScript types: `src/types/throughput.ts` | P0 | ✅ Done |
| F1-08 | DashboardMetrics extended with `throughput` field | P0 | ✅ Done |
| F1-TRACE | Add/verify traceability for all Feature 1 items | P0 | ✅ Done — traceability closed 2026-06-08: F1-07/08 anchored to `UC-043`/`SCN-012`/`UJ-010`/`FR-215` (UC-043 Related-FR range extended to FR-215, SCN-012 gained a `**Related:**` line) and `TC-T-11` (new shape-contract test) automated in `throughput.test.ts` (see Section 12 Gaps Summary item 4 — fully closed) |

### Feature 2 — Work Item Explorer

| ID | Task | Priority | Status |
|---|---|---:|---|
| F2-01 | Hierarchy reconstruction service | P0 | ✅ Done |
| F2-02 | Orphan risk detection with delivery impact | P0 | ✅ Done |
| F2-03 | Relation graph builder | P0 | ✅ Done |
| F2-04 | React Flow visual graph with Dagre layout | P0 | ✅ Done |
| F2-05 | Node styles per issue type | P0 | ✅ Done |
| F2-06 | Orphan node visual treatment | P0 | ✅ Done |
| F2-07 | RelationLegend, RelationInsightPanel, RelationStatsCards, RelationDetailsTable | P0 | ✅ Done |
| F2-08 | RelationCharts — completion, health, types, assignee, sprint, orphan | P1 | ✅ Done |
| F2-09 | Field-format bug fix for FlowItem/raw JiraIssue field names | P0 | ✅ Done |
| F2-10 | Explore added to app navigation | P0 | ✅ Done |
| F2-11 | Risk-path highlight | P1 | ✅ Done — re-verified at code level 2026-06-08 against `computeRiskPaths()`; `TC-RP-01–08` pass; anchored `FR-225B`/`UC-088`/`SCN-044`/`UJ-028` |
| F2-12 | Largest unfinished branch insight | P1 | ✅ Done — re-verified at code level 2026-06-08 against `computeLargestUnfinishedBranch()`; `TC-LB-01–08` pass; anchored `FR-225C`/`UC-088`/`SCN-044`/`UJ-028` |
| F2-13 | Blocked branch filter | P1 | ✅ Done — re-verified at code level 2026-06-08 against `ExplorePage`/`WorkItemGraph` `dimNonRiskPath` filter logic; `TC-BF-01–08` pass; anchored `FR-225D`/`UC-088`/`SCN-044`/`UJ-028` |
| F2-TRACE | Add/verify traceability for all Feature 2 items | P0 | ✅ Done — traceability closed 2026-06-08: F2-05/06/07/09/11/12/13 anchored with `FR-225A–D`/`UC-088`/`SCN-044`/`UJ-028`, F2-11/12/13 re-verified and promoted from 🔍 to ✅, `TC-FF-01–06` automated (see Section 12 Gaps Summary item 2 — fully closed) |

### Feature 3 — Authentication, Users, Database

| ID | Task | Priority | Status |
|---|---|---:|---|
| F3-01 | Prisma, `@prisma/client`, iron-session, bcryptjs installed | P0 | ✅ Done |
| F3-02 | Prisma schema: User, Session, ImportLog, DashboardSnapshot, AuditEvent | P0 | ✅ Done |
| F3-03 | SQLite database created: `data/delivery_clarity.db` | P0 | ✅ Done |
| F3-04 | Seed script and first admin user | P0 | ✅ Done |
| F3-05 | Auth API routes: login, logout, inactive register, me, change password | P0 | ✅ Done |
| F3-06 | Login page | P0 | ✅ Done |
| F3-07 | Register route reserved but inactive | P0 | ✅ Done |
| F3-08 | Profile page | P0 | ✅ Done |
| F3-09 | Admin logs page | P0 | ✅ Done |
| F3-10 | UserMenu in header | P0 | ✅ Done |
| F3-11 | Middleware route protection | P0 | ✅ Done |
| F3-12 | Upload API saves ImportLog with userId | P1 | ✅ Done |
| F3-13 | `/api/imports` filtered by user/admin | P1 | ✅ Done |
| F3-14 | Admin user management with role assignment and role-scoped data | P1 | ✅ Done |
| F3-15 | Member directory `/members` | P1 | ✅ Done |
| F3-16 | Forced first-login password change | P1 | ✅ Done — traceability closed 2026-06-07 (UC-086, SCN-042, UJ-026, TC-PW-01–10; TC-PW-07–10 still ❌ Not Run) |
| F3-TRACE | Add/verify traceability for all Feature 3 items | P0 | ✅ Done — F3-14/15/16 fully closed 2026-06-07 (UC-084/085/086, SCN-039–042, UJ-024–026, TC-AU/MD/PW anchored AND all 14 test cases automated and passing in `adminUsers.test.ts`/`members.test.ts`/`middleware.test.ts`/`changePassword.test.ts`) |

### Feature 4 — Smart Excel Export

| ID | Task | Priority | Status |
|---|---|---:|---|
| F4-01 | Recommendation engine with evidence, impact, owner, action | P0 | ✅ Done |
| F4-02 | 17-sheet statistical workbook | P0 | ✅ Done |
| F4-03 | Executive Summary sheet | P0 | ✅ Done |
| F4-04 | Sprint Throughput, Mid-Sprint, Kanban Flow sheets | P0 | ✅ Done |
| F4-05 | Risks & Blockers, Orphan & Data Quality, Release Readiness sheets | P0 | ✅ Done |
| F4-06 | Cycle & Lead Time percentile analysis | P0 | ✅ Done |
| F4-07 | Metric Dictionary sheet | P0 | ✅ Done |
| F4-08 | Export button triggers smart workbook | P0 | ✅ Done |
| F4-TRACE | Add/verify traceability for all Feature 4 items | P0 | ✅ Done — traceability closed 2026-06-08: F4-05/06/08 anchored with `FR-310/311` (renumbered 2026-06-08 from colliding `FR-242/243` — see Gaps Summary item 6)/`UC-089`/`SCN-045`/`UJ-029`, and `TC-X-09a–TC-X-13b` (10 new sheet-content + trigger-flow cases) automated in `excelExportSheets.test.ts` (see Section 12 Gaps Summary item 3 — fully closed) |

### UX / Dashboard / Product Experience

| ID | Task | Priority | Status |
|---|---|---:|---|
| UX-01 | Dashboard sections collapsible | P0 | ✅ Done |
| UX-02 | Default open sections | P0 | ✅ Done |
| UX-03 | Status chips on section triggers | P0 | ✅ Done |
| UX-04 | Upload-to-dashboard redirect fix | P0 | ✅ Done |
| UX-05 | HTML export redesigned | P0 | ✅ Done |
| UX-06 | Calculation Reference visible in `/developer` side menu | P1 | ✅ Done |
| UX-07 | Clear Local Data in Admin Settings | P1 | ✅ Done |
| UX-08 | Clear Local Data on Upload/Landing page when browser data exists | P1 | ✅ Done |
| UX-09 | Dashboard Section Switcher with smooth scroll and animation | P1 | ✅ Done |
| UX-10 | Product tour animation | P3 | ✅ Done |
| UX-11 | Advanced theme customization | P3 | ✅ Done |
| UX-12 | Custom dashboard layout builder | P3 | ✅ Done |
| UX-13 | Advanced chart customization | P3 | ✅ Done |
| UX-14 | Flat admin-settings UI redesign | P1 | ✅ Done |
| UX-TRACE | Add/verify traceability for all UX items | P0 | ✅ Done — UX-14 closed 2026-06-07 (`UC-087/SCN-043/UJ-027/TC-AC-01–03`); UX-02/03/05/11/13 fully closed 2026-06-08 (`UC-090/091, SCN-046/047/048, UJ-030/031/032/033, TC-CH-01–03, TC-X-14`, plus corrected stale anchors to `UC-062/076/081`, `SCN-024/035`, `UJ-021`) — see Section 12 Gaps Summary item 5 |

---

## 14. P1 — Backend Integration Gateway Foundation

**Feature:** Backend Integration Gateway  
**Priority:** P1 / Architecture Hardening  
**Rule:** This is not full Jira integration and not full cloud integration. It is a controlled backend foundation that all future external calls must use.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| GW-01 | Create gateway architecture design before code | P1 | ✅ Done | Written 2026-06-08 — new "Backend Integration Gateway (Implemented — Foundation, v4.3)" section in `product/DEVELOPER_GUIDE.md` (config-file-driven design, security model, JSONL audit rationale). |
| GW-02 | Create `src/server/gateway/types.ts` | P1 | ✅ Done | `GatewayResult<T>`, `GatewayProviderType`, `GatewayErrorCategory`, `GatewayRoutingStrategy`, `GatewayRequestOptions`, `GatewayLogRecord`, `ProviderConfig`, `EndpointPolicyResult`, `RetryPolicy`. |
| GW-03 | Create `src/server/gateway/externalGateway.ts` | P1 | ✅ Done | `callExternal<T>()` — single chokepoint: resolve provider → policy-validate → route → fetch with timeout/retry/backoff → log → return typed result. Never throws. |
| GW-04 | Create `src/server/gateway/providerRegistry.ts` | P1 | ✅ Done | Config-file-driven per user's "zero code change" requirement: reads `data/gateway-providers.json` at call time, merges over `DEFAULT_BLUEPRINTS`. `writeProviderConfigFile()` ready for future admin UI. |
| GW-05 | Create `src/server/gateway/endpointPolicy.ts` | P1 | ✅ Done | `validateEndpoint()`: https-only in production, host allowlist, SSRF (private IPs + localhost), raw-string traversal detection. Never throws — returns `{ allowed, reason }`. |
| GW-06 | Create `src/server/gateway/retryPolicy.ts` | P1 | ✅ Done | `DEFAULT_RETRY_POLICY` (10000ms, 2 retries, exponential backoff), `isRetryable()`, `computeBackoffDelay()`, `categorizeHttpStatus()`. |
| GW-07 | Create `src/server/gateway/gatewayLogger.ts` | P1 | ✅ Done | `redact()` (token/key/secret/password/cookie/Authorization/Basic/Bearer/connString), `logGatewayCall()` → `data/gateway-audit.jsonl` JSONL. Swallows write errors. |
| GW-08 | Support endpoint validation | P1 | ✅ Done | `endpointPolicy.validateEndpoint()` — https-only allowlist in production, http permitted in dev. Covered by `TC-GW-02`. |
| GW-09 | Block unsafe protocols | P1 | ✅ Done | `ALLOWED_PROTOCOLS_PROD = ['https:']`; dev allows http. Covered by `TC-GW-02`. |
| GW-10 | Block disallowed hosts | P1 | ✅ Done | Host allowlist check in `validateEndpoint()`. Covered by `TC-GW-01`. |
| GW-11 | Block private/internal IPs in production | P1 | ✅ Done | `PRIVATE_IP_PATTERNS` (RFC 1918 + link-local + loopback). Covered by `TC-GW-03`. |
| GW-12 | Block localhost in production unless explicitly configured | P1 | ✅ Done | `LOCAL_HOSTNAMES` set + `isProduction && !allowLocalhost` guard. Covered by `TC-GW-03`, `TC-GW-05b`. |
| GW-13 | Prevent path/query injection where possible | P1 | ✅ Done | Raw-string `TRAVERSAL_PATTERN` check (pre-`new URL()`) + `SAFE_PATH_PATTERN` character-set guard. Covered by `TC-GW-04`. |
| GW-14 | Ensure secrets never reach frontend | P1 | ✅ Done | `src/server/gateway/` is server-only — never imported from client components. Credential values stay in `process.env` only. |
| GW-15 | Redact sensitive headers and payload fields | P1 | ✅ Done | `gatewayLogger.redact()` masks 9 secret-shaped patterns before any log write. Covered by `TC-GW-10`. |
| GW-16 | Support server-side environment/encrypted credential storage | P1 | ✅ Done | `providerRegistry.getProviderConfig()` reads credential values from `process.env` at call time only — never persisted, never returned. |
| GW-17 | Support timeout handling | P1 | ✅ Done | `AbortController` + 10s timeout in `externalGateway.executeAttempt()`. `errorCategory: 'timeout'` on abort. |
| GW-18 | Support retry policy | P1 | ✅ Done | Up to 2 retries with exponential backoff for `408/429/500/502/503/504` and network errors. Covered by `TC-GW-06`, `TC-GW-19`, `TC-GW-20`. |
| GW-19 | Support non-retryable errors | P1 | ✅ Done | `isRetryable()` returns false for `400/401/403/404/409/422` — fails immediately. Covered by `TC-GW-06`, `TC-GW-21`. |
| GW-20 | Support audit and observability fields | P1 | ✅ Done | `GatewayLogRecord` fields: requestId, provider, operation, endpointAlias, method, startedAt, endedAt, durationMs, status, retryCount, errorCategory, error. Covered by `TC-GW-12`. |
| GW-21 | Prepare load-balancer readiness | P1 | ✅ Done | `requestId`, `correlationId`, `idempotencyKey` fields in `GatewayRequestOptions`/`GatewayResult`. Stateless, no shared mutable state. |
| GW-22 | Implement initial routing strategy `single` only | P1 | ✅ Done | `resolveRoutingTarget()` returns first candidate; `GatewayRoutingStrategy` union already enumerates all future strategies for zero-breaking-change extensibility. |
| GW-23 | Add gateway tests | P1 | ✅ Done | `src/__tests__/gateway.test.ts` — 23 tests (`TC-GW-01`–`TC-GW-21` + `TC-GW-05b`/`TC-GW-15b`), all passing. Test suite: 550/61 (was 527/60). |
| GW-24 | Update all related product docs | P1 | ✅ Done (core docs) | Updated: `DEVELOPER_GUIDE.md` (architecture section), `SRS.md` (FR-313 + §8.1 note), `USE_CASES.md` (cross-reference note), `RELEASE_NOTES.md` (v4.3 entry), `TODO-List.md` (this table). BRD/User Journeys/Scenarios/Test Cases/README/Technical Method/Appendix: minimal impact for a server-only foundation with no UI — no new UCs, no new routes, no new user-facing scenarios. |
| GW-25 | Produce product documentation impact matrix before push | P0/P1 | ✅ Done (folded in) | Impact matrix covered inline in the GW-24 closure note above — scope confirmed as server-only/no-UI, so the only mandatory doc surfaces were DEVELOPER_GUIDE (architecture), SRS (FR), USE_CASES (cross-ref note), and RELEASE_NOTES. |

---

## 15. P1/P2 — User Add-Member Request Workflow

**Feature:** Request Add User / Add Member Approval Workflow  
**Priority:** P1 if simple in-app notifications/admin approval; P2 if full Notification Center is required.  
**Rule:** Do not expose temporary passwords to requester. Do not allow non-admin direct user creation.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| USERREQ-01 | Decide implementation scope | P1 | ✅ Done (2026-06-10) | Implemented: in-app request modal, admin queue panel with mandatory temp password + **Generate button** (crypto.getRandomValues, 14-char), **welcome email** via nodemailer (FR-325), in-app notification bell with **clickable redirect** (accepted→/members, admin→/admin/settings?tab=requests), first-login forced password change. No browser push/Slack/Teams. |
| USERREQ-02 | Add requester button: `Request Add User` / `Request Add Member` | P1 | ✅ Done (2026-06-09) | "Request add member" button on `/members` page — visible only for non-admin roles. FR-320. |
| USERREQ-03 | Build request modal | P1 | ✅ Done (2026-06-09) | `src/components/admin/RequestAddMemberModal.tsx` — full name, email, requested role, reason (required), team/project (optional), notes (optional). FR-320. |
| USERREQ-04 | Validate requester form | P1 | ✅ Done (2026-06-09) | Client-side validation in RequestAddMemberModal: all required fields, valid email, high-privilege reason ≥ 20 chars. Server-side validation in FR-316. |
| USERREQ-05 | Add duplicate email warning/prevention | P1 | ✅ Done (2026-06-09) | POST route returns 409 for duplicate user email and duplicate pending request. Guard displayed inline in modal. FR-316. |
| USERREQ-06 | Add high-privilege role warning | P1 | ✅ Done (2026-06-09) | Modal shows amber warning and requires reason ≥ 20 chars when requested role is `admin` or `c_level`. FR-320. |
| USERREQ-07 | Add Prisma model `UserAddRequest` | P1 | ✅ Done (2026-06-09) | Added to `prisma/schema.prisma`: id, requestedName, requestedEmail, requestedRole, reason, teamOrProject, notes, requestedByUserId, status, adminDecisionById, adminDecisionAt, adminDecisionNote, createdUserId, createdAt, updatedAt. User model gains `userAddRequests` back-ref. FR-314. |
| USERREQ-08 | Add statuses | P1 | ✅ Done (2026-06-09) | Status field added to `UserAddRequest` with default `"pending"`; allowed values: pending/accepted/rejected/cancelled/expired enforced at the route layer. FR-314. |
| USERREQ-09 | Add minimal notification model if none exists | P1/P2 | ✅ Done (2026-06-09) | Added `Notification` model to `prisma/schema.prisma`: recipientUserId, type, title, message, relatedEntityType, relatedEntityId, readAt, createdAt. User model gains `notifications` back-ref. FR-315. |
| USERREQ-10 | Add requester API `POST /api/user-add-requests` | P1 | ✅ Done (2026-06-09) | `app/api/user-add-requests/route.ts` — logged-in users only; guards duplicate user email + duplicate pending request; creates UserAddRequest with status `"pending"`; writes audit event. FR-316. TC-REQ-01–05 automated. |
| USERREQ-11 | Add requester API `GET /api/user-add-requests/mine` | P1 | ✅ Done (2026-06-09) | `app/api/user-add-requests/mine/route.ts` — authenticated; returns own requests only (filtered by requestedByUserId). FR-317. TC-REQ-06–07 automated. |
| USERREQ-12 | Add admin API `GET /api/admin/user-add-requests` | P1 | ✅ Done (2026-06-09) | `app/api/admin/user-add-requests/route.ts` — admin only; includes requestedBy user info; optional `?status=` filter. FR-318. TC-REQ-08–09 automated. |
| USERREQ-13 | Add admin API accept action | P1 | ✅ Done (2026-06-09) | `app/api/admin/user-add-requests/[id]/accept/route.ts` — validates pending, checks email availability, creates user with `mustChangePassword: true`, marks accepted, notifies requester, audits. FR-319. TC-REQ-10–12 automated. |
| USERREQ-14 | Add admin API reject action | P1 | ✅ Done (2026-06-09) | `app/api/admin/user-add-requests/[id]/reject/route.ts` — validates pending, marks rejected, notifies requester, audits. FR-319. TC-REQ-13–14 automated. |
| USERREQ-15 | Add notification API if needed | P1/P2 | ✅ Done (2026-06-09) | `GET /api/notifications` (authenticated, max 50 desc) + `PATCH /api/notifications/[id]/read` (ownership guard). FR-322. TC-NOTIF-01–05. |
| USERREQ-16 | Add admin request queue | P1 | ✅ Done (2026-06-09) | `src/components/admin/UserAddRequestsPanel.tsx` in Admin Settings → "Member Requests" tab. FR-321. |
| USERREQ-17 | Add pending request indicator on admin login | P1 | ✅ Done (2026-06-09) | `NotificationBell` in AppShell header: pulsing red badge + persistent amber strip banner fixed below nav for admins with pending requests. FR-323. |
| USERREQ-18 | Add request review details | P1 | ✅ Done (2026-06-09) | Expandable cards in `UserAddRequestsPanel` show requester name/email/role, requested role, reason, notes, team/project, submission date. FR-321. |
| USERREQ-19 | Add accept flow | P1 | ✅ Done (2026-06-09) | Accept button requires admin-entered temp password (mandatory amber field, strength-validated); calls PATCH accept; shows copyable green password box on success. FR-319 (updated), FR-321. |
| USERREQ-20 | Add reject flow | P1 | ✅ Done (2026-06-09) | Reject button with optional decision note; calls PATCH reject; card flips to rejected state. FR-321. |
| USERREQ-21 | Enforce transaction/atomicity on accept | P1 | ✅ Done (2026-06-09) | Server: user create → request update → notification create → audit event, in sequence. FR-319. |
| USERREQ-22 | Require first-login password change for created user | P1 | ✅ Done (2026-06-09) | Created user gets `mustChangePassword: true`; login page redirects to `/change-password`. FR-319, FR-235G. |
| USERREQ-23 | Prevent requester approving own request | P1 | ✅ Done (2026-06-09) | Only `role === "admin"` session can call accept/reject routes (session role guard). Non-admin gets 403. FR-319. |
| USERREQ-24 | Prevent editing after admin decision | P1 | ✅ Done (2026-06-09) | Accept and reject routes return 409 if `status !== "pending"`. Decision is immutable. FR-319. |
| USERREQ-25 | Add rate limiting | P1 | ✅ Done (2026-06-20) | `POST /api/user-add-requests` — in-process limiter, 10 submissions per 10 minutes per requester (keyed by `session.userId`, same pattern as the login/upload rate limiters). Returns 429 with a clear message. `TC-REQ-18` automated. |
| USERREQ-26 | Add audit events | P1 | ✅ Done (2026-06-09) | `user_add_request_submit` on POST; `user_add_request_accept` on accept; `user_add_request_reject` on reject — all non-blocking (swallowed with try/catch to never fail the request). FR-316, FR-319. |
| USERREQ-27 | Add mobile layout | P1 | ✅ Done (2026-06-20) | Verified `RequestAddMemberModal` was already mobile-clean (Tailwind `w-full max-w-lg` + `overflow-y-auto`). Found and fixed a real gap: `AdminNavSidebar` was a fixed 228px rail with no breakpoint, squeezing all `/admin/*` pages (including the Member Requests queue) off-screen under 768px. Added a collapsible mobile top bar + dropdown panel (mirrors the existing `AppShell` mobile-nav pattern) and a `767px` breakpoint to `AdminNavSidebar.module.scss`/`app/admin/layout.module.scss`. Verified at 375px in a real browser: queue list, expanded card, temp-password field, and accept/reject buttons all render correctly; desktop (≥768px) unchanged. |
| USERREQ-28 | Add tests | P1 | ✅ Done (2026-06-09; extended 2026-06-20) | `src/__tests__/userAddRequests.test.ts` — 17 automated tests (TC-REQ-01–14, TC-REQ-15–16, TC-REQ-18) covering requester routes (POST + GET mine), admin routes (GET all, PATCH accept, PATCH reject), all key guard conditions, and rate limiting (TC-REQ-18; TC-REQ-17 was already taken by the Generate-button manual test in TEST_CASES.md §9.53). **2026-06-20**: fixed 4 pre-existing regressions in this file (TC-REQ-01/04/10/13) caused by mock drift after the ghost-session requester guard and `safeNotifications`/`createMany` refactors — the route code was correct, the test mocks were stale. Suite: 572/63 (2 pre-existing, unrelated failures remain in `adminUsers.test.ts`/`roles.test.ts` — see note below). |
| USERREQ-29 | Update all related product docs | P1 | ✅ Done (2026-06-09) | SRS Addendum C (FR-320–324) + FR-319 updated; USE_CASES UC-097/098/099; USER_JOURNEYS UJ-034; SCENARIOS SCN-049; TEST_CASES §9.51/§9.52; DEVELOPER_GUIDE notification bell + bulk-select sections; RELEASE_NOTES v4.5; TODO-List.md. |
| USERREQ-30 | Produce product documentation impact matrix before push | P0/P1 | ✅ Done (2026-06-09) | Filled matrix for v4.5 added to Section 6 of TODO-List.md (below the USERREQ-07–14 matrix). |
| USERREQ-31 | Fix pre-existing test failures in `adminUsers.test.ts` / `roles.test.ts` | P1 | ✅ Done (2026-06-20) | Two distinct bugs, both fixed: (1) `adminUsers.test.ts` — `DELETE /api/admin/users` calls `prisma.userAddRequest.updateMany(...)`; mock added `userAddRequest: { updateMany: jest.fn() }`. (2) `roles.test.ts` — the 2026-06-16 "Update roles and UI layout/styles" commit intentionally made `/portfolio` and `/teams` universal Analytics routes (`ANALYTICS_ROUTES`, visible to every role), but the test still asserted the old per-role restriction; updated the two stale assertions (`scrum_master`→`/portfolio`, `product_owner`→`/teams`) to `true`, matching current intended `allowedRoutePrefixesForRole()` behavior — no production code changed. Suite: 572/63, all passing. |

---

## 16. P1 — Role-Based Delivery Coaching Insights

**Feature:** Role-Based Delivery Coaching Insights  
**Rule:** No generic Agile advice. Every recommendation must cite evidence from uploaded data/metrics.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| RBC-01 | Define `RoleBasedCoachingInsight` type | P1 | ✅ Done (2026-06-23) | `src/types/roleBasedCoaching.ts` — `CoachingCategory` (7 values, distinct from `AppRole`), `RoleBasedCoachingInsight` (category, healthSummary, weakPoints, focusAreas, recommendedActions, preventionAdvice, ceremonyAdvice, nextSprintSuggestions, evidence, severity, confidence), `CeremonyAdvice`, `CoachingEvidence`, `CoachingConfidence`, `CoachingInsightsBundle`. Reuses existing `CheckSeverity`/`ConfidenceBand` unions — no new severity/confidence scale invented. |
| RBC-02 | Use existing calculated metrics/signals | P1 | ✅ Done (2026-06-23) | All 7 generators read only already-computed `DashboardMetrics` fields (`flow`, `throughput.sprint`/`kanban`/`midSprint`, `relations`, `capacity`, `risk`, `dataQuality`, `confidence`, `healthScore`, `overallDeliveryConfidence`, `prediction`, `epics`) — zero new metric calculations. `src/services/coaching/coachingMetricsAccess.ts` adds small typed accessors (`getRelations()`/`getEpics()`) for the two `DashboardMetrics` fields `src/types/metrics.ts` declares as `unknown` despite a concrete runtime shape, scoped to this feature only. |
| RBC-03 | Generate Scrum Master / Agile Coach insights | P1 | ✅ Done (2026-06-23) | `src/services/coaching/generators/scrumMaster.generator.ts` — blocked items, aging WIP, flow efficiency, average cycle time, Severe Kanban bottleneck periods, capacity load skew. `relevantKeys: ['kanbanFlow','cycleTime','midSprint']` for confidence. |
| RBC-04 | Generate Product Owner insights | P1 | ✅ Done (2026-06-23) | `productOwner.generator.ts` — sprint goal outcome, added/removed scope, carryover, orphan ratio, critical-health epics, failing data-quality checks (backlog readiness proxy). `relevantKeys: ['sprintThroughput','orphanRisk']`. |
| RBC-05 | Generate Engineering Manager insights | P1 | ✅ Done (2026-06-23) | `engineeringManager.generator.ts` — throughput trend, capacity imbalance (load share > 35%), blocked items, overdue issues, health score. **Deviation from original wording:** does not call `calculateReleaseReadiness()` — see the "Known data-shape constraint" note under RBC-06. `relevantKeys: ['sprintThroughput','velocity','releaseReadiness','teamCapacity']`. |
| RBC-06 | Generate Delivery Manager insights | P1 | ✅ Done (2026-06-23) | `deliveryManager.generator.ts` — forecasted completion (`prediction`), overdue issues, cross-team blockers, overall delivery confidence, declining throughput trend. **Known data-shape constraint discovered during implementation:** `calculateReleaseReadiness()` groups by the raw `Fix Version/s` field, which exists only on originally-uploaded issue records, not on the normalized `FlowItem` shape inside `DashboardMetrics.flow.items` — calling it with `flow.items` (as the existing `/release-readiness` and `/readiness` pages already do) always returns `hasVersionData: false` in practice. This is a pre-existing gap, not introduced here; documented in `product/DEVELOPER_GUIDE.md`. EM/DM/C-level generators use `prediction`/`overallDeliveryConfidence`/`risk` instead, which are reliably populated. `relevantKeys: ['releaseReadiness','velocity']`. |
| RBC-07 | Generate C-level / Executive insights | P1 | ✅ Done (2026-06-23) | `cLevel.generator.ts` — health score, completion rate, overall delivery confidence, overdue issues, high-priority open issues. `relevantKeys: ['healthScore','releaseReadiness']`. |
| RBC-08 | Generate Team Lead insights | P1 | ✅ Done (2026-06-23) | `teamLead.generator.ts` — critical-health blockers, ownership gaps (unassigned capacity entries), work-splitting suggestion when non-blocker critical items exist. **Review/QA bottleneck evidence is best-effort** (user-approved): this app has no first-class code-review/QA pipeline-stage concept, so it substring-matches `FlowItem.status`/`highLevelStatus` against `/review\|qa\|testing\|uat/i`; when no match exists the evidence line is simply omitted, never fabricated. `relevantKeys: ['kanbanFlow','storyPoints']`. |
| RBC-09 | Generate Admin insights only for system/admin actions | P1 | ✅ Done (2026-06-23) | `admin.generator.ts` + new `src/services/coaching/adminSignals.service.ts` (`getAdminCoachingSignals()`) + new admin-only `GET /api/coaching/admin-signals`. Data Quality score/band always shown; when admin signals are supplied (admin role only), also shows unresolved `SystemErrorLog` count (`resolvedAt: null`), active storage provider (`readStorageSettings()`), and cloud-sync freshness (`getCacheMeta()` — read-only, no network I/O, never `syncFromCloud()`). `relevantKeys: ['healthScore']`. |
| RBC-10 | Add daily standup advice rules | P1 | ✅ Done (2026-06-23) | `src/services/coaching/ceremonyAdvice.service.ts` `dailyStandupAdvice()` — fires on blocked items, aging WIP > 0, mid-sprint completion < 40% for any sprint, any Low/Unreliable metric confidence, declining throughput trend. Each fired line cites the real triggering number; a rule that doesn't fire contributes nothing. |
| RBC-11 | Add refinement/grooming advice rules | P1 | ✅ Done (2026-06-23) | `refinementAdvice()` — fires on orphan count > 0, scope-change counts > 0, aggregate carryover > 0, zero total story points, Weak/Critical data quality band. |
| RBC-12 | Add sprint planning guidance | P1 | ✅ Done (2026-06-23) | `sprintPlanningAdvice()` — average throughput baseline, carryover-first planning, blocked-item dependency check, failing data-quality checks (AC/estimates proxy); each line gated by whether the underlying signal actually exists in the data. |
| RBC-13 | Add sprint review advice | P1 | ✅ Done (2026-06-23) | `sprintReviewAdvice()` — fires when the latest sprint's goal outcome isn't "Met", or overall delivery confidence < 60%. |
| RBC-14 | Add retrospective topic advice | P1 | ✅ Done (2026-06-23) | `retrospectiveAdvice()` — fires on declining cycle-time trend, ≥2 sprints with carryover, Weak/Critical data quality, any Low/Unreliable metric confidence. All 5 ceremony rule groups (RBC-10–14) are computed once via `buildCeremonyAdvice()` and embedded identically into every category visible to the requesting role — verified by `TC-RBC-05`. |
| RBC-15 | Add dashboard section `Role-Based Coaching Insights` | P1 | ✅ Done (2026-06-23) | New route `app/dashboard/coaching/page.tsx` (mirrors the existing `flow-health/page.tsx` client-fetch pattern exactly) + `src/components/dashboard/CoachingInsightCard.tsx` (severity badge, health summary, weak points, focus areas, evidence panel, recommended actions, prevention advice, ceremony advice — only non-empty sub-lists render, next-sprint suggestions, confidence chip) + `CoachingCategoryTabs.tsx` (rendered only when >1 category is visible). New SCSS Modules for all three (Tailwind `@apply` + existing `Badge` component for severity color, matching this codebase's established styling convention). |
| RBC-16 | Enforce role visibility | P1 | ✅ Done (2026-06-23) | `visibleCategoriesForRole()` (`src/services/coaching/coachingOrchestrator.service.ts`). **User-approved role→category mapping** (the spec's 7 personas don't map 1:1 onto the app's real 6-value `AppRole` enum): `scrum_master`→Scrum Master only; `product_owner`→Product Owner only; `manager`→3 tabs (Engineering Manager first, Delivery Manager, Team Lead — bundled because `manager` already maps 1:1 to a single `'engineering_manager'` dashboard view elsewhere, and this section's own original wording said "Manager sees management," singular); `c_level`→C-level only; `admin`→all 7 as tabs; `user`/unrecognized→Team Lead (generic contributor default, since the original spec named no category for the plain `user` role). No `AppRole` enum change. |
| RBC-17 | Adjust confidence using Data Quality and Metric Confidence | P1 | ✅ Done (2026-06-23) | `src/services/coaching/coachingConfidence.service.ts` `aggregateCategoryConfidence()` — averages the category's relevant `MetricConfidenceMap` entries, downgrades ×0.75 when `dataQuality.band === 'Weak'` / ×0.5 when `'Critical'` (user-approved multipliers), re-derives the band with the same High/Medium/Low/Unreliable thresholds as `metricConfidence.service.ts`. Safe fallback: all-zero sample sizes → `band: 'N/A'`, `score: 0`, and a `reason` string with no fabricated percentage (verified by `TC-RBC-09`). Formula documented in `product/ALGORITHM_SPEC.md` "Role-Based Coaching Confidence Score." |
| RBC-18 | Add tests | P1 | ✅ Done (2026-06-23) | `src/__tests__/roleBasedCoaching.test.ts` — 20 tests: `TC-RBC-01a–h` (one per generator + role-mapping table), `TC-RBC-02`–`09` (one per `TEST-RBC-01`–`09` acceptance row in Section 22), plus 4 edge cases (zero issues, empty `sprint.sprints`, confidence threshold boundaries at 80/60/40, undefined `relations`). Full suite: 689/71 passing (was 669/70 — 0 regressions). |
| RBC-19 | Update all related product docs | P1 | ✅ Done (2026-06-23) | `SRS.md` Addendum H (FR-346–FR-352) + revision history v4.10.0; `USE_CASES.md` UC-114; `USER_JOURNEYS.md` UJ-039; `SCENARIOS.md` SCN-057/058; `TEST_CASES.md` §9.60; `DEVELOPER_GUIDE.md` new "Role-Based Delivery Coaching Insights" section (the live `/developer` "Developer Guide" topic fetches this file directly via `GET /api/docs?slug=dev-guide`, so no separate edit to `app/developer/page.tsx`'s inline topics was needed); `ALGORITHM_SPEC.md` new "Role-Based Coaching Confidence & Severity Algorithms" section (v4.10.0); `RELEASE_NOTES.md` new v4.10.0 entry; `APPENDIX.md` Section Q (3 new glossary terms); `app/help/page.tsx` new "Coaching Insights" FAQ section (3 entries); `BRD.md` Future Scope line. |
| RBC-20 | Produce product documentation impact matrix before push | P0/P1 | ✅ Done (2026-06-23) | See the filled matrix immediately below this table. |
| RBC-21 | Redesign Coaching Insights layout to be scannable and encouraging | P1 | ✅ Done (2026-06-26) | `src/components/dashboard/CoachingInsightCard.tsx`/`.module.scss` fully rewritten: mood-led hero banner, evidence stat chips, merged "What to Watch" (weak points + focus areas) and "Do This Next" (recommended actions + prevention advice) lists, collapsed-by-default Ceremony Advice accordion, distinct "Try This Next Sprint" highlight strip. `CoachingCategoryTabs.tsx`/`.module.scss` restyled with per-category icons. Replaced raw Tailwind `slate-*` utilities with real design tokens. `app/dashboard/coaching/page.tsx` dropped its non-standard `.page` wrapper for the shared `shellStyles.pageBody` convention. |
| RBC-22 | Auto-sort coaching tabs by urgency | P1 | ✅ Done (2026-06-26) | `SEVERITY_RANK` exported from `src/lib/coachingBadge.ts` (critical=0…low=3); `app/dashboard/coaching/page.tsx` sorts `bundle.categories` by this rank before rendering tabs and choosing the default-active category. |
| RBC-23 | Quick-win celebration headline for low-severity categories | P1 | ✅ Done (2026-06-26) | `heroHeadline()` in `CoachingInsightCard.tsx` — when severity is `low` and evidence exists, cites the first evidence value/label directly instead of the generic health summary. |
| RBC-24 | Severity trend vs. last saved snapshot | P1 | ✅ Done (2026-06-26) | New `src/services/coaching/coachingTrend.service.ts` `computeSeverityTrend()`. `page.tsx` fetches `GET /api/snapshots` + `GET /api/snapshots/:id` (existing Snapshots feature, no new persistence) for the second-most-recent snapshot, re-runs `generateAllCoachingInsights()` against it, and diffs severity per category. Silently omitted when fewer than 2 snapshots exist. Rendered as a small badge next to the hero mood label. |
| RBC-25 | Confidence-aware framing, empty-section encouragement, cross-category nudge, evidence-chip linking | P1 | ✅ Done (2026-06-26) | `heroHeadline()` prefixes "Early signal:" when `confidence.band` is Low/Unreliable/N/A; new `EmptyRow` component shows an explicit "all clear" message for empty "What to Watch"/"Ceremony Advice" sections instead of omitting them silently; `CoachingCategoryTabs.tsx` renders a small urgency dot on non-active tabs with `high`/`critical` severity; new `src/lib/coachingEvidenceLink.ts` `resolveEvidenceRoute()` maps evidence `metricKey` prefixes to their source `/dashboard/*` route, rendering matched chips as `next/link`s. |
| RBC-26 | Add tests + update all related product docs | P1 | ✅ Done (2026-06-26) | `src/__tests__/coachingTrend.test.ts` (3 tests, `TC-RBC-10`–`12`) + `src/__tests__/coachingEvidenceLink.test.ts` (2 tests, `TC-RBC-13`); full suite 694/73 passing. Docs: `SRS.md` Addendum H.6 (FR-353–FR-354) + revision history v4.10.1; `USE_CASES.md` UC-114 updated; `USER_JOURNEYS.md` UJ-039 updated; `SCENARIOS.md` SCN-060 (originally numbered SCN-059; renumbered 2026-06-28 to resolve a same-day collision with RETRO-39's SCN-059, see SCENARIOS.md); `TEST_CASES.md` §9.61; `DEVELOPER_GUIDE.md` new "Coaching Insights Redesign & Encouragement Enhancements" section; `ALGORITHM_SPEC.md` new "Coaching Severity Trend Comparison" section (v4.10.1); `RELEASE_NOTES.md` new v4.10.1 entry; `APPENDIX.md` Section R (4 new glossary terms); `app/help/page.tsx` 3 new FAQ entries; `BRD.md` Future Scope line. See the filled matrix immediately below. |

**Documentation impact matrix — v4.10.1 (RBC-21–26):**

| Doc/Route | Updated? | Note |
|---|---|---|
| RELEASE_NOTES.md | ✅ | New v4.10.1 entry |
| SRS.md | ✅ | Addendum H.6, FR-353–FR-354, revision history row |
| BRD.md | ✅ | Future Scope line added |
| TEST_CASES.md | ✅ | §9.61, TC-RBC-10–13 |
| USE_CASES.md | ✅ | UC-114 updated with 5 new alternate flows |
| USER_JOURNEYS.md | ✅ | UJ-039 updated, 4 new rows |
| SCENARIOS.md | ✅ | SCN-060 added (renumbered from SCN-059 2026-06-28 — collision with RETRO-39's SCN-059, see SCENARIOS.md) |
| DEVELOPER_GUIDE.md | ✅ | New v4.10.1 section |
| ALGORITHM_SPEC.md | ✅ | New "Coaching Severity Trend Comparison" section |
| APPENDIX.md | ✅ | Section R, 4 terms |
| TODO-List.md | ✅ | This table + matrix |
| app/help/page.tsx | ✅ | 3 new FAQ entries in existing "Coaching Insights" section |
| app/developer/page.tsx | — | Not affected — Developer Guide topic fetches `DEVELOPER_GUIDE.md` directly |
| app/glossary/page.tsx | — | Not affected — coaching terms live in APPENDIX.md, matching the v4.10.0 precedent |
| TECHNICAL_METHOD.md | — | Not affected — no new patentable technical method, presentation/derived-data only |

---

## 17. P2 — Retrospective Upload, Template Download, In-App Form, and Improvement Backlog

**Feature:** Retrospective Upload and Improvement Backlog  
**Rule:** Retrospective upload must be clearly separate from Jira delivery upload unless explicitly labeled.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| RETRO-01 | Create separate retrospective area | P1 | ✅ Done 2026-06-10 | `/retro` page live — three-card landing (Fill in App, Download Template, Upload coming soon). |
| RETRO-02 | Add three clear actions | P1 | ✅ Done 2026-06-10 | All three CTAs present: Fill in App (active), Download Template (CSV), Upload Retro File (coming soon). |
| RETRO-03 | Design three-card layout | P1 | ✅ Done 2026-06-10 | Three-card grid with icon, title, description, and CTA per card. |
| RETRO-04 | Support retrospective file upload | P2 | ✅ Done (2026-06-26) | CSV, XLSX, XLS via `parseRetroFile()`; Markdown/plain text via a heading+bullet heuristic. `POST /api/retro/parse`, 5 MB limit, session-authenticated. |
| RETRO-05 | Define supported columns | P2 | ✅ Done (2026-06-26) | `HEADER_ALIASES` in `retroFileParser.service.ts` — Sprint Name, Team Name, Retro Date, Sprint Goal Met, Sprint Goal, What Went Well, What Did Not Go Well, Blocker, Action Item, Action Owner, Action Due Date, Action Priority. Root Cause/Category/Status/Notes columns are accepted (canonicalized) but not yet surfaced in insights — see RETRO-39 note. |
| RETRO-06 | Validate file structure | P2 | ✅ Done (2026-06-26) | Missing "Sprint Name" column → 422 with no records (`TC-RETRO-09`). |
| RETRO-07 | Detect missing required fields | P2 | ✅ Done (2026-06-26) | Sprint Name plus ≥1 observation/action enforced; a Sprint-Name-only row produces a warning, not a silent drop (`TC-RETRO-11`). |
| RETRO-08 | Show preview before import | P2 | ✅ Done (2026-06-26) | `upload-insights` view shows every parsed sprint's `InsightPanel` plus warnings/corrections before the user relies on the result. Nothing is persisted — there is no "import" step to confirm, by design (see RETRO-15 deferral). |
| RETRO-09 | Allow column mapping if names differ | P2 | ✅ Done (2026-06-26) | Handled via `HEADER_ALIASES` (both this app's template headers and the original spec's naming map to the same canonical fields) rather than an interactive mapping UI — scoped down from "mapping UI" to "alias table" since the supported header set is small and known. |
| RETRO-10 | Parse retro data | P2 | ✅ Done (2026-06-26) | Rows before any Sprint Name are skipped and logged as a `RetroDataCorrection` (`TC-RETRO-10`), never silently dropped. |
| RETRO-11 | Generate Retrospective Insights | P2 | ✅ Done (2026-06-26) | `generateRetrospectiveInsight()` — themes (RETRO-34), ownership gaps (RETRO-36), duplicates (RETRO-33); "repeated problems" = RETRO-35; "root cause patterns" maps to theme detection over free text (no dedicated Root Cause column UI yet — see RETRO-39 note). |
| RETRO-12 | Generate improvement TODO list | P2 | ✅ Done (2026-06-26) | `actionItems` on `RetrospectiveInsight` — text, owner, due date, priority, status implicit (open until next retro). |
| RETRO-13 | Generate suggested next sprint actions | P2 | ✅ Done (2026-06-26; extended 2026-06-26) | `nextSprintSuggestions` (free-text advice) + `suggestedBacklogItems` (concrete story/task/spike suggestions, RETRO-29) — gated by goal outcome, blocker count, and top theme; ceremony-linked via `ceremonyRecommendations`. |
| RETRO-14 | Link retro items to delivery metrics where possible | P2 | ❌ Deferred (2026-06-26) | Explicitly out of scope for this change — no `DashboardMetrics` correlation was built. See SRS Addendum I.4 / FR-358. |
| RETRO-15 | Save retrospective record if persistence is available | P2 | ❌ Deferred (2026-06-26) | Explicitly out of scope — no new Prisma model; uploads are a stateless preview, re-computed from the file each time. See SRS Addendum I.4 / FR-358. |
| RETRO-16 | Add `Download Retrospective Template` button | P1 | ✅ Done 2026-06-10 | Download button on /retro landing card triggers CSV download. |
| RETRO-17 | Generate `.xlsx` template | P2 | ✅ Done (2026-06-26) | `downloadRetroExcelTemplate()` is now the primary "Download Template" CTA; original CSV available via a secondary link. |
| RETRO-18 | Add optional `.csv` template | P1 | ✅ Done 2026-06-10 | `Retrospective_Template.csv` generated client-side with example rows. |
| RETRO-19 | Add optional `.md` template | P2 | ✅ Done (2026-06-26, scoped to upload support, not a downloadable template) | Markdown/plain text retros are *parseable on upload* (RETRO-04) via a heading+bullet heuristic. No separate `.md` *download* template was built — the `.xlsx`/`.csv` templates remain the only downloadable templates, since a tabular template is a better fit for the structured columns than free-text Markdown. |
| RETRO-20 | Add required template columns | P2 | ✅ Done (2026-06-26) | `.xlsx` template: Sprint Name required on first row of a sprint; at least one of What Went Well/What Did Not Go Well/Blocker/Action Item required; Owner/Due Date recommended for every Action Item (flagged as an ownership gap if missing). |
| RETRO-21 | Add `Instructions` sheet to `.xlsx` | P2 | ✅ Done (2026-06-26) | `makeInstructionsSheet()` — how to fill it in, required vs. recommended fields, what happens after upload, privacy note. |
| RETRO-22 | Add example rows to template | P2 | ✅ Done (2026-06-26) | 4 example rows: carryover/large-story, late-discovered blocker, mid-sprint scope change. |
| RETRO-23 | Add `Fill Retrospective in App` / `Create Retrospective` button | P1 | ✅ Done 2026-06-10 | First card on landing: "Fill in App → Start" CTA navigates to form view. |
| RETRO-24 | Build Retro Context form section | P1 | ✅ Done 2026-06-10 | Sprint Name, Team Name, Retro Date, Sprint Goal, Sprint Goal Met (yes/partial/no). |
| RETRO-25 | Build What Went Well section | P1 | ✅ Done 2026-06-10 | Multi-entry list with add/remove per item. |
| RETRO-26 | Build What Did Not Go Well section | P1 | ✅ Done 2026-06-10 | Multi-entry list with add/remove per item. |
| RETRO-27 | Build Blockers/Impediments section | P1 | ✅ Done 2026-06-10 | Multi-entry list with add/remove per item. |
| RETRO-28 | Build Action Items section | P1 | ✅ Done 2026-06-10 | Per-action: text, owner, due date, priority (H/M/L) with add/remove. |
| RETRO-29 | Build Next Sprint Suggestions section | P2 | ✅ Done (2026-06-26; extended 2026-06-26 with concrete backlog items) | System-generated only (no manual-add UI). Two distinct outputs in `InsightPanel`: (a) "Do This Next" — free-text ceremony/process advice (`nextSprintSuggestions` + `ceremonyRecommendations` + `ownershipGaps`); (b) "Suggested Stories & Tasks for Next Sprint" (`suggestedBacklogItems`) — concrete, pasteable story/task/spike items with type, priority, and a rationale citing the real triggering evidence, plus a Copy button. Each item is gated by a real signal: a blocker → "task" to resolve it; a *repeated* blocker → "spike" to investigate root cause instead of a duplicate resolve task; the top theme → "story" citing the example sentence; a missed goal → "spike" to investigate why. No Jira write-back — suggestions are copy-paste only, consistent with the "no Jira ticket creation" P3 roadmap boundary. |
| RETRO-30 | Add save draft | P2 | ❌ Deferred (2026-06-26) | Explicitly out of scope — depends on persistence (RETRO-15), which is deferred. See SRS Addendum I.4 / FR-358. |
| RETRO-31 | Add submit final retrospective | P1 | ✅ Done 2026-06-10 | "Submit & Get Suggestions" button triggers `generateInsights()` and navigates to insights view. |
| RETRO-32 | Validate in-app form | P1 | ✅ Done 2026-06-10 | Sprint Name required to enable submit; insights flag missing owners/due dates and unresolved blockers. |
| RETRO-33 | Detect duplicate action items | P2 | ✅ Done (2026-06-26) | `duplicateActionItems` in `generateRetrospectiveInsight()` — case-insensitive, trimmed text match (`TC-RETRO-16`). |
| RETRO-34 | Identify common themes | P2 | ✅ Done (2026-06-26) | `detectThemes()` keyword-matches process, communication, requirements, qa-release, dependency, technical, planning (`TC-RETRO-14`). |
| RETRO-35 | Identify repeated blockers | P2 | ✅ Done (2026-06-26, scoped to within-upload) | `detectRepeatedBlockers()` flags a blocker appearing in >1 sprint *within the same uploaded file* (`TC-RETRO-20`). "From previous retros" (i.e. across separate uploads/sessions) is not covered — that would require persistence (RETRO-15), which is deferred. |
| RETRO-36 | Identify ownership gaps | P2 | ✅ Done (2026-06-26) | `ownershipGaps` — missing owner / missing due date, each its own line (`TC-RETRO-15`). |
| RETRO-37 | Create `RetrospectiveInsight` model/type | P2 | ✅ Done (2026-06-26) | `src/types/retrospective.ts` — matches the spec'd shape (id, sprintName, team, source, themes, positives, painPoints, blockers, actionItems, nextSprintSuggestions, ceremonyRecommendations, risksIfIgnored, confidence) plus `ownershipGaps`/`repeatedBlockers`/`duplicateActionItems`. |
| RETRO-38 | Add tests | P2 | ✅ Done (2026-06-26) | `src/__tests__/retroFileParser.test.ts` (8 tests, `TC-RETRO-08`–`13`) + `src/__tests__/retroInsights.test.ts` (7 tests, `TC-RETRO-14`–`20`). Suite: 703/73 passing. |
| RETRO-39 | Update all related product docs | P2 | ✅ Done (2026-06-26) | SRS Addendum I (FR-355–FR-358) + revision history v4.7; USE_CASES UC-104 updated + new UC-115; USER_JOURNEYS UJ-038 updated + new Alternate C; SCENARIOS SCN-053/056 updated + new SCN-059; TEST_CASES §9.56/§9.56a/§9.56b; DEVELOPER_GUIDE new "Retrospective Upload, Insights Engine, and `.xlsx` Template" section; ALGORITHM_SPEC new "v4.7" section + marked the old Retro Insights Engine section "superseded"; RELEASE_NOTES new v4.7 entry; APPENDIX 2 new + 2 updated glossary terms; `app/help/page.tsx` Retrospective FAQ rewritten (7 entries); BRD BR-117 extended. **Known gap noted, not silently dropped:** RETRO-05's spec listed Root Cause/Category/Status/Notes columns — these are accepted on upload (canonicalized, not discarded) but not yet surfaced anywhere in the insights UI; flagged here rather than left undocumented. |
| RETRO-40 | Produce product documentation impact matrix before push | P0/P2 | ✅ Done (2026-06-26) | See the filled matrix immediately below this table. |

**Documentation impact matrix — v4.7 (RETRO-04–13, 17, 19–22, 29, 33–38):**

| Document | Updated? | Change |
|---|---|---|
| `product/SRS.md` | Yes | Addendum I (FR-355–FR-358), FR-330/332/333 annotated as superseded/extended, revision history v4.7 row |
| `product/BRD.md` | Yes | BR-117 extended with the upload-path note |
| `product/USE_CASES.md` | Yes | UC-104 updated (xlsx primary + csv link), new UC-115 (upload flow) |
| `product/USER_JOURNEYS.md` | Yes | UJ-038 steps 8–10 updated, new Alternate C (upload) |
| `product/SCENARIOS.md` | Yes | SCN-053/056 updated, new SCN-059 (multi-sprint repeated blocker) |
| `product/TEST_CASES.md` | Yes | §9.56 updated (TC-RETRO-05), new §9.56a (`TC-RETRO-08`–`13`) and §9.56b (`TC-RETRO-14`–`20`) |
| `product/DEVELOPER_GUIDE.md` | Yes | New "Retrospective Upload, Insights Engine, and `.xlsx` Template" section |
| `product/ALGORITHM_SPEC.md` | Yes | New "v4.7" section (insights engine, repeated-blockers, CSV date-bug fix); old engine marked "superseded" |
| `product/RELEASE_NOTES.md` | Yes | New v4.7 entry |
| `product/APPENDIX.md` | Yes | 2 new glossary terms (Retrospective Theme, Repeated Blocker) + 2 updated (Retrospective Page, Retrospective Insights) |
| `app/help/page.tsx` | Yes | Retrospective FAQ section rewritten — 7 entries (was 4) |
| `app/glossary/page.tsx` | — | Not affected — retro terms live in APPENDIX.md, matching existing precedent (e.g. v4.10.1 coaching terms) |
| `product/SCREENS.md` | — | Not affected — no new route was added; `/retro` gained two new internal views (`upload`, `upload-insights`), not new pages with distinct URLs |
| `product/TECHNICAL_METHOD.md` | — | Not affected — retro insight generation is rule-based interpretation of user-entered/uploaded text, not a new technical method among the patent-relevant claims |

**Net result:** 11 of 14 applicable surfaces updated; 3 confirmed no-update-required, each with a stated reason. This satisfies `RETRO-39`/`RETRO-40`.

---

## 18. P2 — Forecasting Progress and Delivery Adjustment Report

**Feature:** Forecasting Progress and Delivery Adjustment Report  
**Rule:** Forecasting must be conservative and explainable. Do not overpromise. Low data quality reduces confidence.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| FCAST-01 | Define `DeliveryForecast` type | P1 | ✅ Done 2026-06-10 | `ForecastResult` in app/forecast/page.tsx: status, avgThroughput, sprintsRemaining, weeksRemaining, confidence, adjustments, sprintPoints, blockedCount, criticalCount. |
| FCAST-02 | Calculate forecast status | P1 | ✅ Done 2026-06-10 | on_track / at_risk / off_track / complete / insufficient_data computed in `computeForecast()`. |
| FCAST-03 | Calculate expected completion date | P1 | ✅ Done 2026-06-10 | `weeksRemaining` from sprint throughput × remaining issues, 2-week sprint assumption. |
| FCAST-04 | Calculate confidence | P1 | ✅ Done 2026-06-10; extended 2026-06-27 (FCAST-23) | This row's original text was stale relative to the actual implementation (structural signals — sprint count/velocity-trend/blocked-count — not a simple sprints-remaining threshold). Now also folds in Data Quality + per-metric confidence — see FCAST-23. |
| FCAST-05 | Calculate remaining work | P1 | ✅ Done 2026-06-10 | Remaining = total − done issues; story points if present. |
| FCAST-06 | Calculate required throughput | P1 | ✅ Done 2026-06-10 | Derived from sprint completion history via `metrics.sprint.sprints`. |
| FCAST-07 | Calculate current throughput | P1 | ✅ Done 2026-06-10 | `avgThroughput` = mean of completedCount per sprint across valid sprint records. |
| FCAST-08 | Generate gap analysis | P1 | ✅ Done 2026-06-10 | Adjustments list flags throughput gap, blockers, critical items, capacity need. |
| FCAST-09 | Generate adjustment options | P1 | ✅ Done 2026-06-10 | Actionable `adjustments[]` string list in ForecastResult, rendered as recommendations. |
| FCAST-10 | Generate chart data | P1 | ✅ Done 2026-06-10 | `sprintPoints: SprintPoint[]` for burn-up chart (actual + forecast + target). |
| FCAST-11 | Add Planned vs Actual progress chart | P1 | ✅ Done 2026-06-10 | Burn-up chart shows actual (solid blue) + forecast extension (dashed blue) + target (grey dashed). |
| FCAST-12 | Add forecast completion line chart | P1 | ✅ Done 2026-06-10 | Dashed forecast line extends from last actual point to target. |
| FCAST-13 | Add remaining work burn-up/burn-down | P1 | ✅ Done 2026-06-10 | Inline SVG burn-up chart in BurnUpChart component — no external library. |
| FCAST-14 | Add required vs current throughput chart | P2 | ✅ Done (2026-06-27) | "Throughput: Required vs. Current" chart on `/forecast` — two horizontal bars (current avg vs. throughput needed for on-track within 6 sprints) + a gap-percentage summary line. Hidden when status is `complete`. |
| FCAST-15 | Add delivery risk trend | P2 | ✅ Done (2026-06-27, consolidated — see FCAST-16/17) | Implemented together with FCAST-16/17 as one "Risk & Scope Trend" chart — see FCAST-17 for the consolidation rationale. |
| FCAST-16 | Add scope change trend | P2 | ✅ Done (2026-06-27, consolidated — see FCAST-17) | Per-sprint `addedScopeCount` plotted in the same consolidated chart as FCAST-15/17. |
| FCAST-17 | Add blocker impact chart | P2 | ✅ Done (2026-06-27, consolidated) | **Deliberately consolidated FCAST-15/16/17 into one "Risk & Scope Trend" grouped-bar chart** (`RiskScopeTrendChart` in `app/forecast/page.tsx`) instead of 3 separate cards — all three are risk-signal-*over-time* views of the same per-sprint `SprintThroughput.addedScopeCount`/`blockedCount` data; 3 separate cards would have tripled chart density on an already-long page (CLAUDE.md §5.1.UI/UX: "dashboards avoid excessive density") without adding distinct information. Only renders with rich per-sprint data (≥2 sprints); hidden for the legacy 8-sprint-capped shape. |
| FCAST-18 | Add dedicated `/forecast` page | P1 | ✅ Done 2026-06-10 | `/forecast` page live: status banner, KPI row, burn-up chart, next-quarter plan, risk signals, recommendations. |
| FCAST-19 | Answer “Are we on track?” | P2 | ✅ Done (2026-06-27) | New "Forecast Diagnosis" card directly under the status banner — combines `weakestFactor.detail` (FCAST-20) and `confidenceReason` (FCAST-23), both citing real numbers. |
| FCAST-20 | Identify weakest delivery point | P2 | ✅ Done (2026-06-27, scoped to throughput/blockers/scope/data-quality) | `weakestFactor: WeakestFactor` in `computeForecast()` — checked in priority order: severe blockers (`>3`) → critical items (`>2`) → mid-sprint scope growth (`>avgThroughput×2`) → Data Quality downgrade → declining throughput → none. WIP/refinement/capacity were not implemented as distinct factors — `DashboardMetrics` doesn't carry a forecast-relevant WIP-limit or refinement-stage signal today; revisit if/when one is added. |
| FCAST-21 | Recommend adjustment to deliver on time | P2 | ✅ Done (2026-06-27, extended) | Pre-existing rules (blockers/critical/throughput-trend/descope) plus 2 new ones: heavy mid-sprint scope growth → tighten scope discipline; active Data Quality downgrade → improve data quality, naming the band. Capacity/WIP/splitting/refinement/sprint-goal-renegotiation rules were not added — same WIP/refinement signal gap as FCAST-20. |
| FCAST-22 | Handle insufficient data safely | P2 | ✅ Done 2026-06-10 (pre-existing, verified) | `insufficient_data` status + empty-state message were already implemented; confirmed still correct after the FCAST-23 confidence extension (`confidenceReason` for this branch: "Confidence is not available — no completed sprint throughput has been uploaded yet."). |
| FCAST-23 | Use Data Quality Score and Metric Confidence Score | P2 | ✅ Done (2026-06-27) | Confidence now blends a structural score with `metrics.confidence.sprintThroughput`/`velocity`, then applies the same ×0.75 (Weak) / ×0.5 (Critical) Data Quality downgrade multipliers as the Coaching Confidence Score (reused, documented formula — not reinvented). `confidenceReason: string` always cites real numbers. |
| FCAST-24 | Add tests | P2 | ✅ Done (2026-06-27) | `src/__tests__/forecastEngine.test.ts` — 12 tests (`TC-FCAST-01`–`13`). Closed a real gap: `computeForecast()` had **zero** automated tests before this change, and `TC-FCAST-04` (at-risk status) existed only as a manual scenario in TEST_CASES.md with no automated coverage. Required extracting `computeForecast()` to `src/services/forecast/forecastEngine.service.ts` first (FR-359) since it lived inline in a `'use client'` page file. |
| FCAST-25 | Update all related product docs | P2 | ✅ Done (2026-06-27; renumbered FR-353–358 → FR-359–364 / Addendum I → J during main-branch merge, 2026-06-27, to resolve a collision with the independently-merged Retro and Coaching addenda that had claimed the same numbers) | SRS Addendum J (FR-359–FR-364) + revision history v4.6.1; TEST_CASES §9.55 updated + new §9.55a; DEVELOPER_GUIDE new "Forecast Engine Extraction..." section; ALGORITHM_SPEC new "v4.6.1" section; RELEASE_NOTES new v4.6.1 entry; APPENDIX 3 new + 1 updated glossary terms; `app/help/page.tsx` Forecast FAQ extended (3 new entries, 2 corrected to match actual behavior); BRD/Technical Method reviewed — no update required (pure interpretation layer, no new patent-relevant method). |
| FCAST-26 | Produce product documentation impact matrix before push | P0/P2 | ✅ Done (2026-06-27) | See the filled matrix immediately below this table. |

**Documentation impact matrix — v4.6.1 (FCAST-14–26):**

| Document | Updated? | Change |
|---|---|---|
| `product/SRS.md` | Yes | Addendum J (FR-359–FR-364), FR-328's confidence section noted as superseded inline, revision history v4.6.1 row |
| `product/BRD.md` | No | BR-116 ("MUST provide a delivery forecast page") is satisfied at the capability level already; this change is internal engine quality (tests, confidence accuracy, diagnosis), not a new business capability — no BRD line needed. |
| `product/USE_CASES.md` | No | UC-102 (View Delivery Forecast) already covers the `/forecast` page generically; the new diagnosis card and charts are presentation detail within the existing use case, not a new user goal. |
| `product/USER_JOURNEYS.md` | No | UJ-037 already covers the forecast-review journey; no new journey branch introduced. |
| `product/SCENARIOS.md` | No | SCN-052 already covers a forecast-review scenario; no new scenario needed for an internal accuracy/diagnosis improvement. |
| `product/TEST_CASES.md` | Yes | §9.55 updated (TC-FCAST-01/02/03/04 now automated), new §9.55a (TC-FCAST-06–13) |
| `product/DEVELOPER_GUIDE.md` | Yes | New "Forecast Engine Extraction, Data-Quality-Aware Confidence, and Risk Diagnosis" section |
| `product/ALGORITHM_SPEC.md` | Yes | New "v4.6.1" section (confidence formula, weakest-factor algorithm, new charts, adjustment rules) |
| `product/RELEASE_NOTES.md` | Yes | New v4.6.1 entry |
| `product/APPENDIX.md` | Yes | 3 new glossary terms (Forecast Diagnosis, Weakest Factor, Risk & Scope Trend) + 1 corrected (Forecast Status, off_track condition) |
| `app/help/page.tsx` | Yes | Forecast FAQ section: 3 new entries (Diagnosis card, Throughput chart, Risk & Scope Trend chart) + 2 corrected (page description, status meanings — `off_track` previously didn't mention the severe-blockers override) |
| `app/glossary/page.tsx` | — | Not affected — forecast terms live in APPENDIX.md, matching established precedent |
| `product/TECHNICAL_METHOD.md` | — | Not affected — this remains rule-based interpretation of existing metrics, not a new technical method among the patent-relevant claims |

**Net result:** 7 of 13 applicable surfaces updated; 6 confirmed no-update-required, each with a stated reason. This satisfies `FCAST-25`/`FCAST-26`.

---

## 18b. P1 — Roadmap Page

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ROADMAP-01 | Create `/roadmap` page — epic progress + delivery forecast | P1 | ✅ Done 2026-06-10 | Epic cards with progress bar, health indicator, forecast label (complete/weeks/months/insufficient data), confidence badge; filter tabs (In Progress/All/Critical/Done); sort (Forecast/Progress/Name); summary KPI cards; throughput context strip; click to expand shows remaining issues, sprints est., critical count. Uses `computePortfolioHealth()` + `loadMetricsWithSource()`. |
| ROADMAP-02 | P0 doc pass for /roadmap | P0 | ✅ Done (2026-06-26) | Audited and confirmed already complete since the feature shipped 2026-06-10: SRS FR-326/327, USE_CASES UC-101, USER_JOURNEYS UJ-036, SCENARIOS SCN-051, TEST_CASES §9.54, ALGORITHM_SPEC v4.6 section, `/help`, `/developer`, `/glossary`, RELEASE_NOTES v4.3.6, BRD BR-115/116 — all already present. Only this status row was stale. |
| ROADMAP-03 | Add tests for roadmap forecast logic | P1 | ✅ Done (2026-06-26) | `src/__tests__/roadmapForecast.test.ts` — automates `TC-ROAD-01`–`05` (complete/insufficient-data/within-2-weeks/~N weeks/~N months paths) plus edge case `TC-ROAD-02b`. Suite: 700/74 (1 pre-existing unrelated failure). |

---

## 18c. P1 — Navigation UX

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| NAV-01 | Redesign /help navigation — replace 34 flat tabs with grouped two-level nav | P1 | ✅ Done 2026-06-10 | 9 category group pills (Getting Started, Dashboard, Planning, Analysis, Export & Data, System, Customization, People, Troubleshooting); clicking a group shows sub-section pills; active group derived from IntersectionObserver activeId; row 2 hidden when group has only 1 section. |
| NAV-02 | Redesign /glossary navigation — replace 12 flat tabs with compact letter-jump nav | P1 | ✅ Done 2026-06-10 | Single row of letter chips (A–L) with section icon + letter label; click scrolls to section; tooltip shows full section title. |
| NAV-03 | P0 doc pass for help/glossary nav changes | P0 | ✅ Done (2026-06-26) | Added 2 FAQ entries to `app/help/page.tsx`'s "Welcome — Getting Started" section explaining the grouped category-pill `/help` nav and the letter-jump `/glossary` nav. Glossary page sections unchanged (per original acceptance criteria). |

---

## 18d. P0 — Pre-Merge QA Automation Gate

A merge to `main` must not be treated as "done" just because the feature's own files were checked. This gate runs the *whole* app's automation before any merge to `main`, so a change in one feature can't silently break another.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| QA-GATE-01 | Run the full automated suite before every merge to `main`, not just changed-file tests | P0 | ✅ Done (2026-06-28) | `npm run check:ci` runs the full Jest suite (not a changed-file subset). Pre-existing failures must still be identified by name, not waved away — e.g. `forecastEngine.test.ts` currently SIGSEGVs in a Jest worker, a known pre-existing crash unrelated to any specific change. `npm run test:coverage` is not yet wired (no coverage thresholds defined yet). |
| QA-GATE-02 | Run `typecheck`, `lint --max-warnings=0`, `lint:styles`, and `build` as a single pre-merge gate | P0 | ✅ Done (2026-06-28) | Added `npm run check:fast` (typecheck + lint:css + test) and `npm run check:ci` (+ build) to `package.json`, matching CLAUDE.md §52. Uses `lint:css` (Stylelint), not `eslint --max-warnings=0` — `STYLE-07` blocks switching `lint` itself until the inline-style backlog clears; see DEVELOPER_GUIDE.md §11a. |
| QA-GATE-03 | Dependency health check before merge | P0 | ✅ Done 2026-07-22 | Ran `npm outdated` and `npm audit` repo-wide. Found: `package.json` was pinned to `next@14.2.5`, which npm flags with an active security warning on install (referencing Next.js's 2025-12-11 advisory); `npm audit` showed 20 vulnerabilities (1 critical, 13 high, 6 moderate). Findings presented to the owner rather than silently fixed (per this row's own acceptance criteria and CLAUDE.md §4.7/§4.8); owner approved: (a) `npm audit fix` (no `--force`) for transitive dev-dependency CVEs (`brace-expansion`, `fast-uri`, `form-data`, `immutable`, `js-yaml`, `minimatch`, `uuid` partially) — zero `package.json` changes, lockfile-only; (b) an exact-version patch bump `next@14.2.5` → `14.2.35` (still Next 14.x, not the 16.x major) closing the critical advisory. Owner explicitly deferred: `nodemailer` 8.x→9.x (major bump touching email-sending code, needs its own review), `@google-cloud/storage` 5.x major bump (only route to fixing the remaining `uuid`/`gaxios`/`teeny-request` chain), and `xlsx` (high-severity Prototype Pollution + ReDoS, **no fix available upstream** — a real accepted risk on the Excel-import path, not a remediation gap). Repo-wide `npm audit`: 20 → 15 vulnerabilities (0 critical, 9 high, 6 moderate), all 15 gated behind the deferred major bumps or the no-fix `xlsx` case. Full verification after the change: `typecheck` clean, `lint` 8/8 (unchanged ceiling), `test` 113/113 suites, 1082/1082 tests, `build` clean. CLAUDE.md §4.1 corrected to state the actual pinned baseline (`14.2.35`) instead of the previously-aspirational, never-actually-pinned `16.2.9` — see `DEP-UPGRADE-NEXT16` for that upgrade as its own tracked future ticket. |
| QA-GATE-04 | Lockfile integrity check | P0 | ✅ Done 2026-07-22 | `package-lock.json` is committed; `npm ci` succeeds cleanly (confirmed both before and after the `QA-GATE-03` dependency changes, 888-889 packages installed, no peer-conflict errors). |
| QA-GATE-05 | Cross-browser smoke pass | P1 | ✅ Done 2026-07-22 | Stood up Playwright from scratch (`@playwright/test` devDependency, `playwright.config.ts`, `tests/e2e/critical-path.spec.ts`, `npm run test:e2e`) — no E2E suite existed before this. One spec covers the actual critical path (login → forced password change → upload → dashboard), run as 5 Playwright projects: Desktop Chrome, Desktop Firefox, Desktop Safari (WebKit) satisfy this row; Tablet/Mobile satisfy `QA-GATE-06`. Selectors were verified against real page source (`app/login/page.tsx`, `app/change-password/page.tsx`, `app/page.tsx`'s upload dropzone, `PageHeader`'s `<h1>`) rather than guessed — this caught a real bug before it ever reached CI: `page.getByLabel('Password')` matched both the password field *and* the `PasswordInput` component's "Show password" toggle button (substring match on aria-label), fixed with `{ exact: true }`. **Verification boundary, stated plainly:** this sandbox has no local Postgres, Docker, or Homebrew, so the actual DB-backed critical path (login/upload/dashboard) could not be executed locally. What *was* verified locally: all 3 browser engines installed and launched correctly, and a throwaway sanity spec against a real running dev server confirmed the login-page selectors resolve correctly on Chromium/Firefox/WebKit/iPad/iPhone (5/5 passed) before being deleted. The real spec's DB-dependent steps (seeded-admin login, forced password change, file upload, dashboard heading) are verified by code reading, not a local run — actual pass/fail confirmation happens in CI (`.github/workflows/e2e.yml`, which provisions a real ephemeral Postgres service), not something this environment could confirm directly (no `gh` CLI or API token available to check the Actions run result either — see `QA-GATE-07`). |
| QA-GATE-06 | Cross-platform/responsive smoke pass | P1 | ✅ Done 2026-07-22 | Same suite as `QA-GATE-05` above — `playwright.config.ts`'s `Tablet` (`iPad Pro 11`) and `Mobile` (`iPhone 13`) projects run the identical critical-path spec at those viewports/device profiles. No physical device was available to test on; device emulation is what Playwright/CI can practically offer here — flagged as a real device gap, not silently equated with a true device test. |
| QA-GATE-07 | Make the gate a literal git pre-merge checklist, not tribal knowledge | P0 | 🟡 Partially done — updated 2026-07-22 | DEVELOPER_GUIDE.md §11a has the checklist. A CI workflow (`.github/workflows/quality.yml`) already existed (added 2026-07-12, this row's "no workflow file exists yet" note was stale) but never ran the repo-wide `npm run lint` — only `typecheck`/`lint:css`/a narrow 7-file zero-warning ESLint pass/`test`/`build`. Added the missing repo-wide lint step (safe now that `STYLE-07` closed the inline-style backlog). **Still open:** GitHub branch-protection "required status checks" is not turned on for `main` — this is a one-time manual step in GitHub's own repo settings UI (Settings → Branches → protection rule for `main` → Require status checks → select `quality`), not something scriptable from this repo — no `gh` CLI or API token is available in this environment (confirmed: `gh` not found, unauthenticated GitHub API calls return 401). Documented as the owner's manual follow-up in DEVELOPER_GUIDE.md §11b. |
| QA-GATE-08 | Update all related product docs | P0 | ✅ Done 2026-07-22 | DEVELOPER_GUIDE.md §11a merge checklist updated with the dependency-health/lockfile step; RELEASE_NOTES.md entry added; this section (TODO-List.md `QA-GATE-03`/`04`) updated in place. |
| QA-GATE-09 | Fix the `e2e` CI workflow, which had never actually passed since it was introduced (`QA-GATE-05`/`06`, 2026-07-22) | P0 | ✅ Done 2026-07-26 — pipeline itself fixed and confirmed green (one unrelated feature-level finding spun off separately, see `MOBILE-05` follow-up below) | Root-caused via `gh run view --log-failed` on PRs #15/#17/#19 — same failure every time, unrelated to any of those PRs' own changes, confirming the pipeline itself was the bug. Five real, previously-unreachable bugs found and fixed across 9 real CI runs (each read via `gh run view`/downloaded Playwright reports, never guessed) — every layer only became reachable once the one before it was fixed, since the suite had never once run to completion before this: **Bug 1** — `.github/workflows/e2e.yml` set `NODE_ENV: production` at job level, active during `npm ci` too, which skips `devDependencies` (`tailwindcss` lives there) → `next build` failed with `Cannot find module 'tailwindcss'`. Fixed by deleting the line (Next's own CLI already defaults `NODE_ENV` to `production` for build/start when unset). **Bug 2** — the workflow's `STORAGE_DRIVER: temporary` was unconditionally rejected by the production-storage guard in `scripts/start-production.mjs`/`src/lib/env/server.ts` (correct in real production — Render's disk is ephemeral, see `product/ERRORS.md` ERR-004). Fixed with a doubly-gated CI-only bypass (`ALLOW_TEMPORARY_STORAGE_IN_CI=true`, only honored alongside GitHub Actions' own `CI=true`) — `src/__tests__/serverEnv.test.ts` (5 tests) proves the guard still holds without both flags. **Bug 3** — the job's `timeout-minutes: 20` killed the run mid-suite with zero diagnostics (confirmed `cancelled`, not `failure`, via the job's own step timestamps) because `mobile-dense-tables.spec.ts`/`mobile-forms.spec.ts` were silently running on all 5 browser projects instead of the `Mobile`-only scope their own file comments described — 20 full login+upload cycles where 8 were intended. Fixed via `testIgnore` scoping in `playwright.config.ts` plus `timeout-minutes: 20→30` headroom. **Bug 4** — every test after the first failed deterministically at the login step: all 8 tests share one seeded admin row in the same CI database, and the first test's forced password-change permanently rotates the real password, which `tests/e2e/helpers/auth.ts` kept trying the stale original against. Fixed by tracking the account's actual current password in a module-level variable (safe since `workers:1`/`fullyParallel:false` runs the whole suite sequentially in one process) — the first attempt at this fix (guess-then-fallback) briefly introduced a second real bug, exhausting the login route's 5-attempts/60s rate limiter since every CI request shares one 'unknown'-IP bucket with no reverse proxy. **Bug 5, the last one blocking green** — added request/response logging directly in the test (not just server-side) and found `POST /api/upload` returning a fast, correct 403 every time, not hanging at all: `prisma/seed.mjs` never set `emailVerified` on the seeded account, and the schema defaults it to `false`, so EP-011's upload gate rejected every attempt. Fixed at the source (the seed script creates a deploy-time bootstrap admin with no verification email to click, so `emailVerified: true` is correct for real deployments too) — this alone got Desktop Chrome/Firefox passing. The remaining WebKit-only failures (Safari, Tablet, Mobile — all three run on WebKit) turned out to be a second, distinct issue: `src/lib/session.ts` set the session cookie's `Secure` flag from `NODE_ENV` alone, but this job serves the app over plain HTTP — Chromium/Firefox tolerate a Secure cookie there, WebKit silently drops it, bouncing every post-login request back to `/login`. Fixed with the same doubly-gated CI-only pattern (`E2E_ALLOW_INSECURE_COOKIES=true` + `CI=true`) — `src/__tests__/sessionCookieSecurity.test.ts` (5 tests) covers it. **Confirmed result:** 6/8 tests green in real Actions, including the full cross-browser critical-path login→upload→dashboard flow for the first time ever. The 2 remaining items are a genuine MOBILE-05 feature-correctness question (Gantt chart not actually overflowing at the real iPhone 13 viewport — see `MOBILE-05` follow-up row) and one flaky retry on `mobile-forms.spec.ts`, not CI-pipeline bugs — spun off separately rather than folded into this row. Temporary diagnostic instrumentation (upload-route step timing, test-level network logging) added mid-investigation was reverted once each root cause was found; only the permanent fixes and their tests remain. Full local verification throughout: `typecheck`/`lint` (8/8 unchanged warnings)/`lint:css` clean, `test` 115/115 suites / 1092/1092 tests, `build` clean. |
| MOBILE-05-FOLLOWUP | Roadmap Gantt chart doesn't actually overflow at the real iPhone 13 viewport | P2 | ❌ Not started — found 2026-07-26 via `QA-GATE-09`'s now-working E2E suite | `tests/e2e/mobile-dense-tables.spec.ts` asserts `ganttScroll.scrollWidth > ganttScroll.clientWidth` at 390px width; in real CI (not this sandbox, which has never been able to run this check before today) it evaluates false — the container isn't overflowing, so the sticky-scroll pattern MOBILE-05 added never actually engages on a real phone-width viewport. Not yet investigated whether this is a genuine CSS regression (e.g. the Gantt's date-column count/width no longer exceeds 390px in the current data range) or a test-data assumption gap (sample dataset's timeline may be too short to force overflow at this width). One flaky retry on `mobile-forms.spec.ts` in the same run is unrelated and not yet triaged either. |
| DEP-UPGRADE-NEXT16 | Major upgrade: Next.js 14.2.35 → 16.x | P2 | ✅ Done 2026-07-22 | Upgraded directly to `next@16.2.11` + `react@19.2.8`/`react-dom@19.2.8` (skipped 15 — nothing in this app was 15-specific, and 16 was already the documented target). Full ADR (what broke, what didn't, what was deliberately deferred and why) in `product/DEVELOPER_GUIDE.md` §11c — this row summarizes it. **Real breakages found and fixed:** `getIronSession(cookies(), ...)` across 62 files (sync `cookies()` fully removed in v16 — confirmed via `iron-session`'s own type declarations before fixing, not assumed) → `await cookies()` everywhere, zero test changes needed (tests mock the whole module); 13 dynamic API routes' `params: { id: string }` → `Promise<{ id: string }>` plus 5 test files' call sites; `middleware.ts` → `proxy.ts` rename (file + exported function + 1 test's dynamic import); `next.config.js`'s removed `eslint` option deleted, `experimental.serverComponentsExternalPackages` renamed to top-level `serverExternalPackages`; `experimental.staleTimes.static: 0` rejected by v16's new 30-second floor — bumped to the minimum (30), flagged as a **real regression risk** for the original dashboard-staleness bug this config exists to fix (see ADR); kept Webpack via `--webpack` (build script + `scripts/start-server.js`) rather than blind-port the custom cloud-storage-externals `webpack()` config to Turbopack with no way to verify real S3/Azure/GCP behavior in this sandbox; `sharp` (new v16 transitive dependency) had libvips CVEs below 0.35.0, fixed via a `package.json` `overrides` entry (0.35.3) — a similar attempt at overriding next's bundled `postcss@8.4.31` did not resolve cleanly (npm reported it `invalid`) and was reverted, left as a documented, low-risk, build-time-only exception. **Verified not applicable** (checked via grep, not assumed): no legacy React patterns (`ReactDOM.render`/`findDOMNode`/`propTypes`/`defaultProps`), no component-render test library in use at all (1082 Jest tests are pure service/logic tests), no parallel routes, no `sitemap`/`opengraph-image` files, no `next/cache` usage, no `serverRuntimeConfig`/`publicRuntimeConfig`, no `next/legacy/image`, no AMP config, no global `scroll-behavior: smooth` on `<html>`. **Deliberately deferred, not bundled in:** `eslint-config-next` stays pinned at 14.2.5 (confirmed via clean `npm ls` — no peer conflict; bumping it would force an ESLint 9/10 Flat Config migration, a separate substantial project given the custom `local-rules` plugin); the Turbopack `webpack()` migration; `export const dynamic = 'force-dynamic'` on `/dashboard/*` pages (the fully-correct fix for the `staleTimes.static` regression risk, out of scope for a dependency upgrade). `npm audit`: 20 (pre-`QA-GATE-03`) → 15 → 15 (composition shifted: critical eliminated, `next` itself high→moderate, `sharp`'s new CVEs introduced-and-fixed same change). Full verification: `typecheck` clean, `lint` 8/8 unchanged, `test` 113/113 suites / 1082/1082 tests, `build` clean with zero warnings. CLAUDE.md §4.1 updated to the new actual baseline. |
| DEP-DEFERRED-01 | Tracked, accepted dependency risks not fixed in the 2026-07-22 pass | P2 | ⚠️ Accepted risk — reviewed 2026-07-22, deepened same day | Second-pass review of actual usage (not just the advisory text) for each: **`nodemailer`** — the CVE (GHSA-p6gq-j5cr-w38f) is specifically about the `raw` message option bypassing `disableFileAccess`/`disableUrlAccess`. Grepped `src/lib/email.ts` (the only file that calls `nodemailer`): every `sendMail()` call passes only `from`/`to`/`subject`/`text`/`html` — `raw` and `attachments` are never used anywhere in this codebase. **The vulnerable code path is not reachable today.** Still deferred (a major 8→9 bump is unnecessary work for a non-reachable CVE), but downgraded from "real live exposure" to "advisory applies to the package, not to how this app uses it." **`xlsx`** — grepped every consumer (`services/jira/parser.ts`, `services/retro/retroFileParser.service.ts`, plus 4 export services and their tests). Parsing goes through `XLSX.read(buffer)` → `XLSX.utils.sheet_to_json()` directly on attacker-uploaded bytes (any authenticated user can upload a file) — the app's own handling of the *output* (plain row objects, destructured field-by-field, never spread into shared/global state) limits what a successful prototype-pollution exploit could then do inside this app's own code, but does **not** prevent the pollution from happening during `XLSX.read()` itself, since that's internal to the library. This remains a real, unmitigated exposure on the upload path — no upstream fix exists, and this app does not have the option of simply not calling `XLSX.read()` on untrusted input, since Excel-format Jira exports are a supported upload type. Real fix options (replacing `xlsx` with a maintained alternative such as `exceljs`, or dropping `.xlsx`/`.xls` upload support in favor of CSV-only) are both product/scope decisions, not follow-up code — not done today. **`@google-cloud/storage`** — tried the one thing that could have been a free fix: `npm update @google-cloud/storage` (7.19.0 → 7.21.0, latest, still within `package.json`'s existing `^7.19.0` range, so not a breaking change). Re-ran `npm audit` after: the `uuid`/`gaxios`/`teeny-request`/`retry-request` chain (GHSA-w5hq-g745-h8pq, moderate) is unchanged — confirms the fix genuinely requires the major downgrade to `@google-cloud/storage@5.18.3` npm suggests, which is not a real option (a downgrade, not an upgrade). Stays deferred; watch for a future `@google-cloud/storage` 7.x or 8.x release that repins a fixed `uuid` without the major-version regression. Re-run `npm audit` at the next dependency-health check (`QA-GATE-03`) rather than assuming this list is still current. |

---

## 18e. P0 — Mobile-First Redesign (Future Roadmap — Not Started)

The app today is desktop-first with responsive retrofits. This is a deliberate priority shift: **mobile is the primary design target going forward**, not an afterthought layered on top of a desktop layout. Do not implement broadly until a P1 design doc (covering navigation pattern, breakpoint strategy, and which dashboard views are realistic on a small screen) is written and reviewed — see CLAUDE.md §60's existing inline-style refactor priority list, which this work should be sequenced with, not duplicate.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| MOBILE-01 | Mobile-experience audit of every route | P0 | ✅ Done (2026-06-29) | Static-code audit (375px viewport reasoning, no live browser) across every route in `app/`. Found 14 issues: 2 broken (`/roadmap` Gantt timeline labels overflow; `/work-explorer` 380px detail sidebar exceeds the 375px viewport when open), 5 cramped/unusable (4–6-col KPI grids in `/sprint-kanban`, `/charts`, `/delivery-mix`, `/forecast`, `/teams`, `/dashboard/priority-attention` with no `max-width: 480px` breakpoint), 7 minor (oversized chart SVGs, large page padding, sub-40px touch targets, large fixed title font sizes). `/help`, `/glossary`, `/landing` already mobile-clean. Full per-route detail kept in the audit transcript; the 6 repeating shared-component patterns below are what MOBILE-02–04 act on. |
| MOBILE-02 | Define the mobile-first breakpoint strategy | P0 | ✅ Done (2026-06-29) | Decision: keep the existing desktop-first SCSS Modules (base styles + `max-width` media queries scaling down), rather than rewriting to mobile-first `min-width` — the codebase already has ~90 SCSS modules using this pattern consistently and correctly per CLAUDE.md §18 tokens; a wholesale rewrite direction would touch far more files than the actual defects warrant. Standardize on a single missing breakpoint instead: `@media (max-width: 480px)` for grids/strips that currently only have `768px`/`1024px`/`700px`/`540px`/`800px` steps and skip straight to cramped at phone width. No new ad hoc breakpoint values introduced. |
| MOBILE-03 | Mobile navigation pattern | P0 | ✅ Done — pre-existing | `AppShell` (`src/components/layout/AppShell.tsx`/`.module.scss`) already has a hamburger (`.mobileMenuBtn`) toggling a `.mobileNav` slide-down panel below the `sm` breakpoint, used by every standalone page. `DashboardNavSidebar`/`DashboardTopbar` got an equivalent hamburger + slide-in drawer (`.sidebarOpen`, `sidebar-slide-in` keyframe, backdrop, route-change auto-close) in the dashboard mobile-gap fix shipped 2026-06-28. Both are keyboard- and screen-reader-accessible (`aria-label`, `aria-expanded`/`aria-haspopup`, focus-visible). No further nav redesign needed — MOBILE-01 found no remaining nav dead-ends. |
| MOBILE-04 | Touch-target sizing audit | P1 | 🟡 Partially found, not yet fixed | MOBILE-01 flagged buttons/chips at ~30–36px height (padding-driven, not an explicit `min-height`) across multiple shared components — below the ~40–44px target. Tried a global zero-specificity `:where(button, [role='button'])` baseline in `globals.scss`; reverted — blast radius too high to ship without browser verification (icon-only buttons without `align-items: center` would gain dead space, and this repo has no browser-testing tool available in this session). Needs per-component review with visual verification, not a blanket global rule. |
| MOBILE-04b | Two genuinely-broken MOBILE-01 findings fixed in code | P0 | ✅ Done (2026-06-29) | `app/work-explorer/page.module.scss` `.layout[data-panel='open']` (380px detail sidebar beside content) was unconditional — now gated behind `@media (min-width: 900px)`; below that it falls back to the existing single-column base instead of overflowing a 375px viewport. `app/sprint-kanban/page.module.scss` and `app/delivery-mix/page.module.scss` `.kpiStrip` both had an identical bug: base (mobile) was already `repeat(4, 1fr)` with only `min-width` queries going *up* to 8 cols — nothing scaled *down* for phones. Base changed to `repeat(2, 1fr)`, with the existing 4-col step moved to `@media (min-width: 480px)`. `npm run lint:css` clean on all three files. `app/forecast/page.module.scss`'s 5-col grid was re-checked and is actually fine — its `540px` query (which lands after `800px` in source order) already cascades to 2 cols at 375px; MOBILE-01's "broken" call on that file was a false positive from not tracing cascade order. |
| MOBILE-05 | Dashboard/chart mobile layout strategy | P1 | ✅ Done (2026-07-23) | Full per-route review (Explore-agent survey) of every dense chart/table route: `app/charts`, `WorkItemGraph`, `RelationDetailsTable`, `app/sprint-kanban`, `app/teams`, `app/portfolio` were already fine or had acceptable existing handling — not touched, per CLAUDE.md §5.4 (Rule of Three)/§61 (don't fix what isn't broken). Two genuine bugs found and fixed: `app/roadmap`'s forecast table (`.forecastColRow`/`.forecastRow`, a fixed-width 5-col grid) had **no overflow wrapper at all**, hard-overflowing below ~600px (part of what `MOBILE-01`'s audit called "broken") — wrapped in new `.forecastScroll { overflow-x: auto; }`; `app/work-explorer`'s `.tableWrap` was `overflow: hidden` (silently clipping, no scroll escape hatch) — changed to `overflow-x: auto`. Both routes' first column (Gantt epic label, forecast epic cell, Work Explorer Key column) made `position: sticky; left: 0` with a solid background so scrolled content doesn't show through — the actual gap this ticket was pointing at, since neither existing codebase pattern (horizontal-scroll wrapper in `app/portfolio`/`app/teams`/`app/forecast`, or the `RelationDetailsTable.tsx` card-list pattern) had a pinned-column variant yet. One real regression caught and fixed during implementation: giving `.keyCell` a solid background would have silently covered `app/work-explorer`'s existing `[data-selected='true']` left accent bar (a functional selection indicator, not decorative) — redrawn on the sticky cell itself via `.tableRow[data-selected='true'] .keyCell` rather than dropped. Full writeup in `product/DEVELOPER_GUIDE.md` §11a "Mobile dense-table scroll strategy". No breakpoint/mixin changes needed — sticky + overflow-x are viewport-agnostic, not gated behind a new breakpoint tier. |
| MOBILE-06 | Mobile performance budget | P1 | ❌ Not started | Define and measure LCP/INP/CLS budgets (CLAUDE.md §40) specifically on a throttled mobile profile, not desktop — mobile networks/CPUs are the actual constraint this section exists to address. Confirmed still fully greenfield (2026-07-23 survey): no Lighthouse/web-vitals dependency, script, or CI step exists anywhere in the repo today. Deliberately kept out of the `MOBILE-05`/`MOBILE-07` passes — a new tooling stand-up, not a UI fix, and deserves its own scoping/review rather than being bundled in. |
| MOBILE-07 | Forms and upload flow on mobile | P1 | ✅ Done (2026-07-24) | Explore-agent survey of every form/upload flow named in this ticket found most of it already fine (`ColumnMappingPreview.tsx`, retro upload/menu screens, `ProfileTab.tsx`, `StorageTab.tsx`, `SecurityTab.tsx` — not touched, per CLAUDE.md §5.4/§61). Five real, scoped gaps fixed, all forms with **zero** phone-width responsive handling: (1) worst — `app/retro/page.tsx`'s in-app retro form, "Sprint Context" (`grid-cols-2`) and "Action Items" (`grid-cols-12`, crushing a native date input into a ~27px sliver at 375px) both converted to `grid-cols-1 sm:grid-cols-N` stacking; (2) root `/` upload page's secondary-actions row (`grid-cols-2` → `grid-cols-1 sm:grid-cols-2`); (3) two bare icon-only remove buttons with no real tap target — `app/retro/page.module.scss`'s `.removeBtn` and `app/page.module.scss`'s `.fileChipRemove`, both given `min-width/min-height: 40px` + flex-centering; (4) `RequestAddMemberModal.tsx`'s close button, `p-2 -m-2` (negative margin keeps the glyph's visual position while expanding the hit area); (5) `UserAddRequestsPanel.tsx`'s Generate/show-password buttons (`py-2` → `py-2.5`) and `AppConfigPanel.tsx`'s SMTP Host/Port grid (`grid-cols-2` → `grid-cols-1 sm:grid-cols-2`). New `tests/e2e/mobile-forms.spec.ts` (Mobile/iPhone 13 project) asserts the retro form's two grids render as a stacked single column via `data-testid` hooks. `MOBILE-06`/`MOBILE-08` confirmed still fully open/greenfield — not touched. Issue #16, PR #17. |
| MOBILE-08 | Visual regression coverage at mobile breakpoints | P1 | ❌ Not started | Extend visual regression suite (CLAUDE.md §46) to include a mobile viewport for every covered route, not just desktop. Confirmed still fully greenfield (2026-07-23 survey): no `toHaveScreenshot`/`toMatchSnapshot`/percy/chromatic usage anywhere, no `tests/visual/` directory. Would use Playwright's built-in `toHaveScreenshot()` (already available via the installed `@playwright/test` — no new dependency) once undertaken; needs its own baseline-review process design first, deliberately not bundled into `MOBILE-05`/`MOBILE-07`. |
| MOBILE-09 | Tests and docs | P0 | 🟡 Partially done (2026-07-24) | The `app/roadmap`/`app/work-explorer` slice (`MOBILE-05`) and the retro-form/upload-page/admin-panel slice (`MOBILE-07`) are both done: `tests/e2e/mobile-dense-tables.spec.ts` and `tests/e2e/mobile-forms.spec.ts` (both against the existing `Mobile` Playwright project, iPhone 13 390×664 — no new project needed) cover their respective routes; the shared login/upload flow lives in `tests/e2e/helpers/auth.ts` (`loginAndEnsureData`), now reused by 3 spec files (meets the Rule-of-Three bar for the helper). `product/DEVELOPER_GUIDE.md` §11a and `product/RELEASE_NOTES.md` updated for both. **Still open:** broader "redesigned nav" test coverage this row also names, plus everything `MOBILE-06`/`MOBILE-08` would need once undertaken. |

---

## 18f. P1 — Inline-Style Technical Debt Remediation (Re-audited 2026-07-11 — Not Started)

A full repo-wide ESLint re-audit (`eslint . --max-warnings=-1 -f json`, the direct CLI command CLAUDE.md
§4.6 mandates, not the prohibited `next lint`) run alongside the 2026-07-11 dashboard nav consolidation
(see `v4.18.0` entry above) found **1,281 warnings, 0 errors, across 90 files** — down from the
2026-06-27 baseline of 1,524/86, every one still a `react/forbid-dom-props` (CLAUDE.md Rule 1) violation.
The drop isn't purely remediation: removing `app/dashboard/{delivery-controls,visual-analytics,
kanban-health}` and trimming 3 other dashboard pages accounts for part of it (§60.3), unrelated fixes
landed since the last audit account for another part (`app/retro/page.tsx` 112→0, `ProductTour.tsx`
13→2), and a few files not present in the last audit now carry small counts (`app/landing/**`,
`app/promo/**`, `app/admin/audit/page.tsx`) — genuine new drift, not something this pass introduced.
This section is still documentation-only — no remediation code has been written yet; see CLAUDE.md
§60.1–60.6a for the full prioritized breakdown this table summarizes.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| STYLE-01 | Baseline audit: full inline-style warning inventory | P1 | ✅ Done (2026-06-27) | Ran `eslint . --max-warnings=-1 -f json` repo-wide via the ESLint JSON formatter (not the truncated default text formatter) to get an exact, file-by-file count. Result recorded in CLAUDE.md §60.1. No code changed. |
| STYLE-02 | Refactor Tier 1 — highest-volume standalone pages | P1 | ✅ Done 2026-07-21 | `app/retro/page.tsx` (112 warnings, done 2026-06-28) was the only file finished before this tier stalled for several weeks while `STYLE-03`–`05` (Tiers 2–4) were completed instead. Picked back up and finished the remaining 5 files: `app/help/page.tsx` (98→0 — new `page.module.scss`, `AccordionItem`/`SectionCard` JS-driven hover/open state converted to `data-open`/`data-active` attributes + CSS `:hover`, the API-routes method badge and cloud-sync provider list converted from JS color-picking to `data-method`/`data-provider` attributes per §28), `app/developer/page.tsx` (80→0 — extended its existing light-theme-remap module, package scope badge and calc-card expand state converted to `data-scope`/`data-expanded`, one redundant inline style found and removed outright rather than reproduced), `app/data-quality/page.tsx` (71→1, the 1 a documented `--score-width` exception — `BAND_COLOR`/`SEV_COLOR` lookups converted to `data-band`/`data-severity`/`data-tone` attributes, alternating row background replaced with `:nth-child(even)`), `app/flow-health/page.tsx` (66→2, both documented `--bar-width` exceptions — bottleneck/aging bar tones converted to `data-tone`, aging-bracket tone moved from a runtime ternary to a static field on the already-constant `AGE_BRACKETS` array), `app/forecast/page.tsx` (59→56, all 56 already-legitimate exceptions — this file had already been mostly converted in an earlier pass; only 4 real violations remained: an SVG `verticalAlign`, a trend-color ternary converted to `data-trend`, two static `marginBottom` overrides converted to modifier classes). Each file verified individually (typecheck/eslint/stylelint/full test suite/build) before merging. Repo-wide `react/forbid-dom-props` count: 658 → 338 across 62 files (remaining count is Tier 5/`STYLE-06`'s untouched `src/components/**` files plus legitimate exceptions everywhere else). |
| STYLE-03 | Refactor Tier 2 — `app/dashboard/*/page.tsx` | P1 | ✅ Done 2026-07-19 | `delivery-controls`, `visual-analytics`, and `kanban-health` were removed entirely in the 2026-07-11 nav consolidation (100% duplicate content, no remediation needed); a same-day follow-up pass then merged `actions` into `priority-attention` and merged `sprint-status` + `quarter-statistics` into the new `trends` page; a third pass merged `delivery-composition` into `data-quality`. That left 8 real files, re-counted fresh via `eslint -f json` before starting (not trusted from this row's stale numbers, which were already wrong): `flow-health` (52), `labels` (49), `data-quality` (45), `epic-readiness` (44), `trends` (41), `priority-attention` (24), `ownership` (13), `key-metrics` (1) — 269 warnings total. **All 8 converted to SCSS Modules** — see `CLAUDE.md` §60.3's "Resolved 2026-07-19" note for the full detail (token mapping, the new `--chart-series-1..6` tokens, the `data-*` attribute pattern that replaced JS color-picking). 269 → 17 warnings, all 17 legitimate documented CSS-variable exceptions, not violations. `key-metrics` needed zero changes — its one warning was already the correct exception. `priority-attention` had a stale partial conversion (unused SCSS classes already written) — finished it rather than starting over. Verified per-file: `npm run typecheck`, `npx eslint <file>`, `npx stylelint <module.scss>`, `npm test` (113/113 suites throughout, one transient Jest worker SIGSEGV and one transient test timeout during the run, both confirmed non-reproducing and unrelated to the changes), `npm run build` — all clean after every single file, not just at the end. Branch: `refactor/style-03-tier2-dashboard-pages`. |
| STYLE-04 | Refactor Tier 3 — shared `src/components/dashboard/**` | P1 | ✅ Done 2026-07-19 | Re-audit found the real scope was 94 warnings/7 files (not the stale 160/14 figure this row previously listed — most of that gap had already closed via unrelated work). Of the 94, 90 lived in 4 components with zero live callers (`SprintThroughputPanel.tsx` 33, `KanbanThroughputPanel.tsx` 31, `MidSprintDeliveryPanel.tsx` 21, `DataQualityCard.tsx` 5 — same shape as `ORPHAN-02`); presented to the owner, who chose deletion over refactoring dead code. Deleted all 4; their underlying domain types/services (`throughput.service.ts`, `kanbanFlow.service.ts`, `midSprint.service.ts`) remain live, used by `/forecast`, `/sprint-kanban`, `SprintVelocityChart`. The remaining 4 warnings across 3 live files: `DashboardTopbar.tsx`'s nav-dropdown status dot was a real violation (`STATUS_DOT` hex lookup via inline `style={{background}}`) — fixed with a `data-status` attribute resolved in SCSS against existing `--color-danger`/`--color-warning`/`--color-success`/`--color-info` tokens. `DashboardTopbar.tsx`'s `--drop-top`/`--drop-left`, `DashboardNavSidebar.tsx`'s `--progress-width`, and `DashboardPageShell.tsx`'s `MiniKpiCard` `--kpi-*`/`--delay` vars were already correct documented exceptions — verified, not changed. 94 → 3 warnings, all 3 legitimate exceptions. Repo-wide: 898 → 807 warnings, 74 → 70 files. See CLAUDE.md §60.4, branch `refactor/style-04-tier3-orphans-and-shared-components`. |
| STYLE-05 | Refactor Tier 4 — remaining standalone pages | P1 | ✅ Done 2026-07-19 | Re-audit found the real scope was 12 large files — `app/sprint-kanban` (39), `app/members` (32), `app/portfolio` (30), `app/glossary` (26), `app/delivery-mix` (23), `app/customer` (20), `app/charts` (18), `app/roadmap` (16), `app/teams` (14), `app/release-readiness` (13), `app/trends` (6) — 277 warnings, plus a ~10-file small remainder at ≤3 each (`app/admin/audit`, `app/column-mapping`, `app/summary`, `app/work-explorer`, `app/promo/**`, all 7 `app/landing/components/**`). All 12 large files converted from JS color lookups (health/verdict/status/category enums) to `data-*` attributes resolved in SCSS (§28) — `data-tier`/`data-band`/`data-verdict`/`data-status`/`data-health`/`data-cat` per page. `charts.tsx`/`teams.tsx`'s generic chart primitives (HBar/VBar/AnimatedDonut/MiniBar/CompareBar) kept their `--bar-color` prop-passthrough as the sanctioned generic-component exception (same as `MiniKpiCard`), since they take color from several non-unifiable threshold schemes. The small remainder turned out to already be compliant almost everywhere: `admin/audit`, `column-mapping`, `summary`, and all 7 landing components were already using the correct `--*`-only exception — zero changes needed. `promo/**`'s only warnings are unrelated `@next/next/no-img-element`. `work-explorer` had 2 *untracked* violations the audit found by hand — `style=` passed to the custom `SvgIcon` component isn't caught by `react/forbid-dom-props` (only inspects native DOM elements) — fixed both. 277 → ~30 warnings, all legitimate documented exceptions. Repo-wide: 807 → 658 warnings, 70 → 68 files. See CLAUDE.md §60.5, branch `refactor/style-05-tier4-standalone-pages`. |
| STYLE-06 | Refactor Tier 5 — remaining shared components | P1 | ✅ Done 2026-07-22 | Re-audited 2026-07-21: real scope was `src/components/explore/**` (`RelationCharts` 20, `WorkItemGraph` 16, `RelationDetailsTable` 4, `RelationLegend` 2, `RelationStatsCards` 1), `src/components/admin/**` (`DataRetentionSettings` 23, `AdminConsoleLayout` 13, `IssueTypeHierarchySettings` 5), `src/components/dc-shell/**` (`DCTopbar` 13, `DCActionBoard` 6, `DCKpiCard` 6, `DCPageSidebar` 4, `DCStatusChip` 2), plus ~18 more files at ≤7 warnings each (338 warnings, 62 files total repo-wide including the already-closed Tiers 1-4). Converted: `DataRetentionSettings.tsx` (23→0), `RelationCharts.tsx` (20→4, sanctioned donut/bar-color exceptions), `WorkItemGraph.tsx` (16→1), `AdminConsoleLayout.tsx` (13→2, shared by 6 admin pages), `ThemeCustomizerPanel.tsx` (7→2, also fixed a latent invalid-CSS `var(...)14` concatenation bug), `DCKpiCard.tsx` (6→0, extended the pre-existing global `.dc-kpi-*` classes in `app/globals.scss`), `IssueTypeHierarchySettings.tsx` (5→5, all sanctioned per-type admin-color exceptions), `TrendChart.tsx` (5→3), `ChartCustomizerPanel.tsx`+`SprintVelocityChart.tsx` (4→0, 4→2), plus a batch of 8 smaller files (`RelationDetailsTable`, `RelationLegend`, `OnboardingChecklist`, `DataSourceBadge`, `KpiCard`, `MetricConfidenceBadge`, `SectionNav`, `ColumnMappingPreview`). `DCTopbar.tsx`/`DCActionBoard.tsx`/`DCPageSidebar.tsx`/`DeliveryClarityShell.tsx` (13+6+4=23 warnings) turned out to be dead code — see `ORPHAN-05`, deleted instead of converted. A second pass over files assumed to already be sanctioned exceptions ("1 warning each") found 5 were real, unconverted violations: `NotificationBell.tsx` (static `top: 56`), `AppShell.tsx` (`STATUS_DOT` hex lookup — same fix as `DashboardTopbar.tsx` in `STYLE-04`), `RelationStatsCards.tsx` (raw `color` prop passthrough), `DataQualitySummary.tsx`/`MissingFieldImpactPanel.tsx` (dynamic `width: pct%` never actually routed through the required `--*` exception) — all fixed. `SvgIcon.tsx`'s 1 warning deliberately left as documented debt (foundational icon-mask primitive; its `style` prop's object-spread merge is the mechanism the whole codebase's color-passthrough pattern depends on — redesigning it is a cross-cutting change out of scope for a single-file conversion). Repo-wide: 338 → 217 warnings, 62 → 50 files. See CLAUDE.md §60.5a. |
| STYLE-07 | Switch `npm run lint` to the CLAUDE.md §4.6-mandated command | P0 | ✅ Done 2026-07-22 | `package.json`'s `lint` script was already `eslint .` (not `next lint` — that earlier concern was stale), but had no `--max-warnings` flag at all, so it never actually failed on warnings. See `STYLE-09` for how the warning count was driven from 217 to 8 first. Flipped to `eslint . --max-warnings=8` (verified the gate genuinely fails at 7 and passes at 8). The 8: 5 pre-existing, unrelated `@next/next/no-img-element` warnings (a `next/image` migration concern, out of scope for style remediation) plus 3 accepted inline-style residuals (`SvgIcon.tsx`'s documented debt, a cross-file helper, and a `useState`-driven value — see `STYLE-09`). |
| STYLE-09 | Re-audit `app/**` "Tier 4 drift" and build a real `--*`-only ESLint rule | P1 | ✅ Done 2026-07-22 | What looked like drift (`app/forecast` 56, `app/sprint-kanban` 22, `app/charts`/`app/portfolio` 13 each, etc. — ~195 warnings across the app/** pages Tier 4 had closed to ~30 on 2026-07-19) turned out to be a false alarm on manual audit: every single one of those warnings was already a correctly-implemented `--*`-only CSS-variable exception — the raw count just scales with how many items render (more sprints/epics/KPIs = more per-item animated bars, each needing its own delay/color variable), not with real technical debt. The actual problem was tooling: `react/forbid-dom-props` can only detect that a `style` prop exists, not inspect its contents, so it flags every sanctioned exception the same as a real violation. Built a real local ESLint rule (`eslint-local-rules/index.js`, via the new `eslint-plugin-local-rules` devDependency) that resolves the `style` value — inline object literal, a same-file variable, or a same-file helper function's returned object — and only flags it if any key isn't `--`-prefixed or if object spread is present (§14.3). Also restricts to native/intrinsic elements only, matching `react/forbid-dom-props`'s original scope (custom components like `SvgIcon`/`Reveal` declare `style` as their own typed prop, a separate passthrough pattern). Repo-wide: 217 → 3 real `local-rules/forbid-non-css-var-style` warnings — `SvgIcon.tsx` (accepted debt, see `STYLE-06`/CLAUDE.md §60.5a), `app/dashboard/key-metrics/page.tsx` (calls `barCssVars()` imported from `DashboardPageShell.tsx` — a legitimate `--*`-only helper, but cross-file import resolution was judged too much rule complexity for one residual warning), and `ProductTour.tsx` (`style={vars}` where `vars` is `useState` and set imperatively in a `useLayoutEffect` — genuinely not statically provable, already manually verified correct in `STYLE-06`). See `.eslintrc.json`, `eslint-local-rules/index.js`. |
| STYLE-08 | Update docs once remediation actually completes | P1 | ✅ Done 2026-07-22 | `CLAUDE.md` §60 rewritten from a 290-line tier-by-tier forensic log into a concise ~70-line closed summary (current state: 3 accepted exceptions, the `local-rules/forbid-non-css-var-style` enforcement mechanism, the established `data-*`-attribute/CSS-token patterns, and a pointer to `TODO-List.md` `STYLE-01`–`09`/`ORPHAN-01`/`02`/`05` for full history) — the "When refactoring a page" checklist was kept as-is. `product/DEVELOPER_GUIDE.md`: replaced the stale `react/forbid-dom-props`/"1,524 warnings, not yet compliant" status with the current rule and "remediation complete" status; fixed a stale reference describing the now-deleted `DCTopbar`/`DCPageSidebar`/`DCActionBoard`/`DeliveryClarityShell` as merely "unused dead code" rather than removed; corrected the `DC_NAV_GROUPS` group list (order and membership had drifted from EP-019/EP-025-era documentation — actual current groups are Analytics, Delivery, Planning, Data, Directory, Developer Tools, Reference, Administration-last); corrected the `npm run lint` scripts-table row and note, which still described the old `next lint` placeholder blocked by `STYLE-07`. `product/RELEASE_NOTES.md`: added a closing entry for this initiative. |
| ORPHAN-01 | Decide the fate of the legacy `frontend/` Create React App | P2 | ✅ Done 2026-07-14 | A second, fully standalone CRA project (own `package.json`/`node_modules`/`build`, `react-scripts`) lives at `frontend/`, last touched 2026-05-30, not imported by or referenced from the Next.js app (`app/`, `src/`) anywhere. It contributes 59 of the 1,281 warnings under a lint config that doesn't apply to it (root ESLint currently reaches into it unintentionally) — those 59 are excluded from `STYLE-02`–`06`'s counts since SCSS-Module remediation makes no sense for a project this codebase doesn't build or own. Decide: remove it, or keep it for a documented reason and exclude it from the root ESLint run. CLAUDE.md §5 doesn't permit leaving unowned code undecided indefinitely. **Resolved 2026-07-14**: explicit owner decision made (via the full-application product audit's Phase 4, `04-remove-merge-keep.md` R-10) — removed, along with `backend/` and `promotion/` (bundled into the same disposition, see `remove/orphan-non-nextjs-trees-r10`). Lint dropped from 1,272 to 1,213 warnings as a direct side effect. |
| ORPHAN-02 | Decide the fate of orphaned `DashboardSectionSwitcher.tsx` / `LayoutBuilderPanel.tsx` / `DashboardSidebarNav.tsx` | P2 | ⚠️ Partially resolved 2026-07-18 | Discovered 2026-07-11 while auditing `app/dashboard/*` for the nav consolidation: `src/components/dashboard/DashboardSectionSwitcher.tsx` and `LayoutBuilderPanel.tsx` (7 + 3 warnings, counted in `STYLE-04`'s Tier 3 total) are not imported or mounted by any route under `app/`. They read `src/lib/dashboardSections.ts`'s `section-*` ids, which don't correspond to anything in the routed `/dashboard/*` pages. A third file, `src/components/dashboard/DashboardSidebarNav.tsx`, is also unmounted — it's a superseded predecessor to the live `DashboardNavSidebar.tsx` (note the swapped word order), still describing the old single-page `activeSection`/`setSectionMode` dashboard paradigm that `/dashboard/*` no longer uses. `/developer` and `/glossary` had stale prose describing `DashboardSidebarNav` as if it were the live component — corrected to `DashboardNavSidebar` as part of this pass, but the deeper legacy `activeSection`/"12 existing sections" terminology elsewhere in `/glossary` (e.g. the `activeSection` and `Delivery Summary` entries) documents that same superseded paradigm and needs its own separate cleanup pass. Same §5 "no unowned code" concern as `ORPHAN-01`: decide whether to wire these up, repurpose them, or delete them — don't leave undecided indefinitely. **Resolved 2026-07-18 for `DashboardSectionSwitcher.tsx`/`LayoutBuilderPanel.tsx` only**, bundled into a broader 6-file dead-code removal pass (`docs/product-audit/10-technical-cleanup.md` "Six components under `src/components/dashboard/`" finding) under the owner's explicit "finish everything today" session-goal authorization: both files deleted, along with `src/lib/dashboardSections.ts` and `src/lib/layoutBuilder.ts` (confirmed fully orphaned once their only two consumers were gone) and 2 dedicated test files. **`DashboardSidebarNav.tsx` deliberately left untouched** — it was never one of the 6 named files in that finding's scope, and while re-tracing it during this pass we discovered its SCSS module (`DashboardSidebarNav.module.scss`) is actually still live (imported by `DashboardNavSidebar.tsx` under the old filename, a leftover from an incomplete rename), so the `.tsx`-only orphan question needs its own separate decision, not a bundled one. See branch `chore/orphan-02-remove-dead-dashboard-components`. |
| ORPHAN-03 | Decide the fate of the retired Role-Based Coaching generator/orchestrator subsystem | P2 | ✅ Done 2026-07-14 | Discovered 2026-07-12 when `/dashboard/coaching` was replaced by the fixed 3-column Team Role View, which reads `DashboardMetrics` directly instead of going through the old per-category system. Confirmed via repo-wide grep (excluding each file's own test) that none of the following have any remaining app-level caller: `src/services/coaching/coachingOrchestrator.service.ts` (`generateAllCoachingInsights`/`visibleCategoriesForRole`), all 7 files under `src/services/coaching/generators/`, `ceremonyAdvice.service.ts`, `coachingConfidence.service.ts`, `coachingTrend.service.ts`, `coachingEvidenceLink.ts`, `coachingBadge.ts`, `adminSignals.service.ts`, `app/api/coaching/admin-signals/route.ts` (an API route — still technically reachable over HTTP even with no frontend caller), and `src/types/roleBasedCoaching.ts`. Unlike `ORPHAN-01`/`02`, this is real, tested (`roleBasedCoaching.test.ts`, `coachingTrend.test.ts`, `coachingEvidenceLink.test.ts` all still pass — they exercise the code directly, not through a UI), still-plausibly-reusable domain logic (confidence scoring, severity derivation, evidence-to-route mapping) — not dead weight left by an accidental rename. Deleting ~15 files and their tests was judged out of scope for a page-redesign request and not done unilaterally. Decide: repurpose this logic into a future richer view of this same page, keep it as-is for a different future feature, or remove it — don't leave undecided indefinitely. **Resolved 2026-07-14**: product decision made (not on the roadmap) — removed all 16 non-test files plus `src/services/relations/orphanRelation.service.ts` (bundled in per `04-remove-merge-keep.md` R-14, its own separate dead function found in Checkpoint 5) and all 3 test files (20 files, 1,306 lines total). See `remove/dormant-coaching-bundle-r13-r14`. |
| DUP-FLOWITEM-01 | Consolidate the two independent `FlowItem` interface definitions | P3 | ✅ Done 2026-07-18 | Discovered 2026-07-13 while fixing `AUDIT-CP3-001` (v4.23.0 above): `src/services/metrics/metrics.service.ts` declared its own local `FlowItem`/`HealthStatus` interfaces (~line 46) instead of importing the shared ones from `src/types/metrics.ts`. They were structurally identical (both needed the same two-field addition by hand in that fix), which is exactly the risk — nothing enforced that they stayed in sync. Consolidating to a single shared import touches the file's internal call signatures broadly enough that it was judged out of scope for that bug-fix branch, so it was tracked here rather than bundled in. **Resolved 2026-07-18**: confirmed the two interfaces were still field-for-field identical, then deleted the local copy and replaced it with a `type`-only import from `@/types/metrics`; `JiraIssue` (a distinct, genuinely local `{ [key: string]: unknown }` shape, never duplicated) was left as-is. `npm run typecheck` passed with zero errors on the first attempt — confirming every function in the file that builds/consumes `FlowItem` objects was already producing compatible values. See `11-prioritized-backlog.md` Phase 5 and branch `refactor/dup-flowitem-01-consolidate-flowitem-type`. |

---

## 18g. P2 — Branded Preloader Rollout (2026-07-21)

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| PRELOAD-01 | Build a single branded loading component and use it for route-level loading | P2 | ✅ Done | `src/components/ui/Preloader.tsx` (logo mark + pulse) built and wired into `app/loading.tsx` (Next.js's automatic per-route Suspense fallback) and `src/components/ui/LoadingState.tsx` (existing 6 call sites kept their API, picked up the new branding automatically). Merged to `main`. |
| PRELOAD-02 | Redesign `Preloader` with a progress element, then extend to in-page data-loading states | P2 | ✅ Done | User supplied a richer external Figma Make reference (`App Preloader/`, since excluded from the TS build — see `ORPHAN-04` below) with a progress bar and rotating stage text; adopted the progress-bar idea only (as a token-driven, non-fake indeterminate track under the pulsing mark), not the fake stage/metric text, per CLAUDE.md §5.5 (no speculative architecture) and §2 (correctness — a numeric progress % not tied to real state would be misleading). Rolled `LoadingState`/`Preloader` out to: admin console (audit, diagnostics, feedback, logs, security, settings ×2), `charts`, `snapshots`, `snapshots/compare`, `trends`, `profile`, `explore`'s dynamic-import graph placeholder, `AppConfigPanel`, `PersonaPreviewPanel`. A first pass missed 5 real call sites (`forecast`, `roadmap`, `admin/system-errors`, `admin/users`, `UserCloudProviderForm`) — found via a `grep -rn "if (loading) return"` sweep prompted by the user after the first pass; converted in a follow-up commit. Deliberately left unconverted, with reasons recorded in `product/DEVELOPER_GUIDE.md`'s new "Branded Preloader / LoadingState" section: content-shaped skeletons (`DashboardPageShell`'s `PageLoading`, `/members` grid, `JiraConnectionsPanel`/`UserAddRequestsPanel` row skeletons), `/customer`/`/developer`'s fixed dark themes, `/verify-email` (already shows the logo once), and all button/badge-level spinners (no compact variant exists yet). Branch `feature/preloader-rollout`, verified clean: typecheck, ESLint, Stylelint, full test suite (1080/1082 — 2 pre-existing flaky timeouts confirmed unrelated by rerunning isolated), production build. |
| ORPHAN-04 | Decide the fate of the `App Preloader/` reference folder | P2 | ✅ Done | A standalone Figma Make export (own `package.json`/Vite config, no dependencies installed) was dropped into the repo root as design inspiration for `PRELOAD-02`. It broke `npm run build` (its files got swept into Next's type-check, ~60 unresolved-module errors) — same shape as `ORPHAN-01`'s `frontend/`. First excluded via `tsconfig.json` so the build passed again. **Resolved**: owner decision made — its progress-bar idea had already been extracted into `PRELOAD-02`'s real `Preloader` component, so the folder (never git-tracked) was deleted outright and the now-unneeded `tsconfig.json` exclude entry reverted, same disposition as `ORPHAN-01`'s `frontend`/`backend`. |
| ORPHAN-05 | Decide the fate of the unused legacy `DCTopbar`/`DCPageSidebar`/`DCActionBoard`/`DeliveryClarityShell` shell components | P2 | ✅ Done 2026-07-21 | Found while converting `DCTopbar.tsx` under `STYLE-06` — this repeated a finding `product/SRS.md` had already documented (4.32.x era, "Note on the unused legacy shell") but never acted on. Confirmed via `grep` across `app/`/`src/`: `DeliveryClarityShell.tsx` (the only importer of `DCTopbar.tsx`/`DCPageSidebar.tsx`) is itself never imported by anything; `DCActionBoard.tsx` has no importer at all. Same "convert vs. delete" fork as `ORPHAN-01`/`ORPHAN-02`/`STYLE-04`'s dead-panel finding. **Resolved 2026-07-21**: presented to the owner, who chose deletion. All 4 files removed (no dedicated tests existed). `navigation.ts` (`DC_NAV_GROUPS`), `DCKpiCard.tsx`, and `DCStatusChip.tsx` are unaffected — confirmed live in `AppShell`/`DashboardTopbar`/`AdminNavSidebar`/`GlobalSearch` and 4 standalone analytics pages. Also resolved 23 of `STYLE-06`'s tracked warnings as a side effect. See `product/SRS.md` v4.33.3. |
| PRELOAD-03 | Find and fix pages with no loading feedback at all (not just cosmetic gaps) | P1 | ✅ Done | User flagged the Analytics nav menu specifically as still missing a preloader. Checking each of that menu's 6 pages (`src/components/dc-shell/navigation.ts`'s `analytics` group) surfaced a worse class of bug than `PRELOAD-02` fixed: `/portfolio` rendered `if (!summary) return null` — a fully blank page, no `AppShell`, no nav, nothing — for the entire duration of the data fetch. `/teams` had no `loading` state at all, so it silently rendered the real page with an empty 0-team grid until data arrived, no indication anything was happening. Widening the check to every nav-listed route (not just Analytics) found the identical `return null`-while-loading bug in two more pages outside that menu: `/sprint-kanban` (`if (loading \|\| !metrics) return null`, despite already having a `loading` flag it just never displayed) and `/delivery-mix` (same shape as `/portfolio` — never had a `loading` state, just `if (!metrics) return null`). A fifth, less severe gap: `/column-mapping` had a `loading` flag that only hid/showed content sections (`{!loading && ...}`) rather than showing any loading indicator, so its header showed but the entire body area went empty. All 5 fixed with `AppShell`+`LoadingState` (added a genuine `loading` state to `/teams`, which had none). Full nav sweep confirmed clean elsewhere: `/retro` and `/admin/theme` render from local/default state with no async gate needed; every other nav-listed route's `return null` after a loading check is a benign, unreachable-in-practice fallback (the loading gate always resolves first). Verified: typecheck clean, ESLint 0 errors/50 pre-existing warnings (unchanged from before — confirmed these files' warnings are the same pre-existing `react/forbid-dom-props` debt tracked in `STYLE-05`, not introduced by this change), full test suite, production build. |

---

## 18h. P2 — Mediterranean Theme Preset and New Logo (2026-08-03)

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| THEME-01 | Add a new selectable light theme preset + revive the theme picker UI | P2 | ✅ Done | User asked to "check out" a new theme/logo dropped into `UX Designer Portfolio/` (a Figma Make-generated prototype), then asked for a "full theme migration" to it. **Corrected the premise before planning**: the app's real, currently-enforced default is already light (`'none'` palette, blue accent, `app/globals.scss`) — 4 dark palettes (`gold`/`copper`/`sage`/`orange`) exist in `PALETTE_PRESETS` but were deliberately disabled by a 2026-07-09 product decision (`app/admin/theme/page.tsx`'s header comment) and `initThemeCustom()` actively force-converts any stored dark palette back to `'none'` on every load. There was no dark theme to migrate away from — a stale `reference_uiux_workflow` memory caused the initial wrong framing, corrected before implementation and the memory updated. Scope corrected (confirmed with user) to: add the portfolio's "Mediterranean Intelligence" palette (deep teal `#087F8C`, warm sand) as a new **selectable** light preset alongside the existing default, not a forced replacement. **Real bug found and fixed, not just data added**: `applyThemeCustom()` previously branched on "is the palette `'none'`" to decide whether to add the `.dark` class — correct only because every prior non-`'none'` preset happened to be dark. Added a `mode: 'light' \| 'dark'` field to `PaletteTokens` (replacing a separately-maintained `DARK_PALETTES` id `Set` — one source of truth) and made the dark-class logic mode-driven; this also fixed a second latent bug where switching from a dark palette back to `'none'` never removed the `.dark` class at all (neither branch did, previously — unreachable before since the picker UI was dead code, see below). `src/components/ui/ThemeCustomizerPanel.tsx` — a fully-built palette/accent/radius/font-size picker — was defined but never mounted anywhere (confirmed via repo-wide grep); revived by mounting it in `DashboardTopbar.tsx` next to the existing `NotificationBell`/`UserMenu` icons, the only way a user can now reach the new preset. While touching that component (CLAUDE.md §61), replaced its hardcoded Tailwind `dark:*` classes and raw hex colors with the app's semantic `--dc-*` tokens, matching the rest of the codebase's convention. New logo (a teal/blue "DC" monogram) swapped into the existing SVG/PNG/ICO filenames (`public/logo/*`, `public/favicon.*`) so all ~12 referencing files pick it up with zero code changes — including `favicon.ico`, regenerated via macOS's built-in `sips` (found it supports `.ico` output, better outcome than the plan anticipated, which expected leaving it stale with no conversion tool available). New `src/__tests__/themeCustomizerPresets.test.ts` (8 cases — preset `mode` correctness, dark-class add/remove for light vs. dark presets, the stuck-dark-class regression, `initThemeCustom`'s coercion only applying to genuinely dark presets). Deliberately deferred, named: the portfolio's per-section accent-color system (Overview/Analyze/Plan/Explore/Manage) doesn't map cleanly onto the real app's 8 actual nav groups (`DC_NAV_GROUPS`) — a real design decision, not a mechanical port; no page-by-page restyle was needed or done, since existing pages already work with any palette via the existing `--dc-*` variable system. |
| THEME-02 | Fix `UX Designer Portfolio/` (dropped-in reference folder) breaking `eslint .` and `tsc` | P2 | ✅ Done | Same class of problem as `ORPHAN-04` (a prior standalone Figma Make export dropped into the repo root broke `npm run build`) and `ORPHAN-01` (`backend`/`frontend`, already permanently excluded in `tsconfig.json`). This one broke `npm run lint` — `eslint .` has no path restriction and picked up the portfolio's ~40 unrelated TSX files, producing 1722 warnings/15 errors against a codebase never written to satisfy this repo's CLAUDE.md rules. Fixed via `ignorePatterns: ["UX Designer Portfolio/**"]` in `.eslintrc.json` (confirmed lint output returns to the real 8-warning baseline) and added the same path to `.gitignore` (the folder was never git-tracked, but this prevents accidental future staging). Separately found and fixed: `npm install` run inside that folder earlier (to review the prototype) left a 177MB nested `node_modules`, which Next.js's dev-server file watcher was scanning — inflating `npm run dev`'s startup from a normal cold start to **9.5 minutes** and individual page compiles to 100+ seconds; removed (`rm -rf`, safe — gitignored, trivially reinstallable, and not needed further since the design tokens/logo were already extracted). Removing that `node_modules` then broke `tsc --noEmit` in turn — the nested install had been accidentally satisfying the portfolio's own unrelated imports (`react-router-dom`/`recharts`/`lucide-react`/`vite`) via Node's directory-walking module resolution; once gone, `tsc` (whose `tsconfig.json` `include` is a broad `**/*.tsx`) surfaced ~20 real `TS2307` "cannot find module" errors. Fixed the same way as `backend`/`frontend`: added `"UX Designer Portfolio"` to `tsconfig.json`'s `exclude`. All three fixes (`.eslintrc.json`, `.gitignore`, `tsconfig.json`) needed together — confirmed `npm run dev` returns to ~300ms startup and `npm run typecheck`/`npm run lint` both return to their real baselines. |
| THEME-03 | Full style revamp — make Mediterranean the app's real default, not just a picker option | P2 | ✅ Done | User reviewed `THEME-01` live and reported "no change on the layout, its the same, just some logos are changed" — correct, since that ticket was deliberately additive-only and only ever covered `PaletteTokens`' color subset. New instruction: "do full style revamp every single style change to match the figma design." Confirmed via `AskUserQuestion`: (1) Mediterranean becomes the real default (old blue/dark presets stay selectable), (2) nav accent uses one unified brand-teal across all 8 real nav groups, not Figma's 5-color per-section system (no clean mapping exists — same gap `THEME-01` deferred). **Key finding before implementing**: `applyThemeCustom()` already sets a `data-palette` attribute on `<html>`, and `globals.scss` already has an `html[data-palette]` block that remaps raw Tailwind color utility classes onto tokens — exactly the mechanism needed to reach the ~59 `.tsx` files using raw Tailwind classes directly (confirmed via repo scan) without hand-editing each one. But that block was tuned only for the 4 dark presets and unsafe to reuse as-is for a light palette: `rgba(0,0,0,0.35)` shadows read as heavy black smudges on white, `.bg-blue-50` inverted to a **black** overlay, status text like `#4ade80`/`#fcd34d`/`#fca5a5` is illegible pastel-on-white. Fixed by splitting it into `html.dark[data-palette]` (unchanged, zero regression for gold/copper/sage/orange) and a new `html[data-palette]:not(.dark)` block with light-appropriate values (readable saturated status text sourced from the new semantic tokens, light tints instead of black overlays, Figma's warm-tinted shadow opacities) — the single highest-leverage change in the ticket. Also found and fixed: `DashboardSidebarNav.module.scss`'s active-state indicator/icon were hardcoded `bg-sky-600`/`#2563eb`, ignoring `--dc-accent` entirely — a real pre-existing bug (nav accent never responded to *any* palette, not just this one) blocking the "unified brand-teal" decision from taking effect; also its `.chipCc/Cw/Cg` status counters used `@apply` on Tailwind color utilities, same root cause as `globals.scss`'s `.badge-*`/`.btn-*` (below) — `@apply` bakes utility values into the compiled class at build time, so the `html[data-palette]` remap (which targets literal classNames present in the DOM) never reached any of them; converted to direct token references. FOUC fix: `initThemeCustom()` only runs in a `useEffect` (`AppShell.tsx`, client-only, post-mount) and `app/layout.tsx`'s `<html>` had no `data-palette`, so making Mediterranean the default without further changes would flash blue→teal on every load. Fixed by hardcoding `data-palette="mediterranean"` on the SSR `<html>` tag and rewriting `globals.scss`'s literal `:root` default values to Mediterranean's exact values (confirmed via `curl`: SSR HTML already carries the correct attribute, no flash). `_tokens.scss`: added 3 larger typography steps (`--text-4xl/5xl/6xl`, 26/32/44px — the existing scale topped out at 22px, well under Figma's page-title/metric-value hierarchy; applied `--text-4xl` to `KpiCard`'s value display, the one clear shared consumer — broader per-page `<h1>` adoption deliberately deferred, since there's no shared page-title component and retrofitting all 64 routes individually would be exactly the "bespoke per-page redesign" ruled out of scope below); updated shadow tokens to Figma's warm-tinted `rgba(32,48,56,*)` values and set the resting card shadow (`--dc-shadow-card`) to `none` per Figma's border+spacing (not shadow) hierarchy convention; updated semantic status colors (`--color-success/warning/danger/info`) and re-hued the 5 health-status bands to the Mediterranean family (a considered adaptation — Figma has no 5-band equivalent). `globals.scss` `@layer components`: `.btn-base` was `rounded-full` (pill) — Figma's design doc explicitly rejects pill buttons for a 6-8px radius, a highly visible app-wide shape change, called out prominently rather than buried; `.btn-danger/-green/-warning/-outline-danger` and `.badge-success/warning/danger/info` used raw Tailwind `@apply` literals (same bypass-the-remap issue as above) — rewired onto tokens, making them respond to the active palette for the first time. Spot-checked real Tailwind-class usage across the ~59 files (not just the dark block's original class list) and extended the override block with real gaps found: `border-blue-400`, `hover:bg/text-blue-700`, `text-red-500`, `bg-red/green/amber-100`, `bg-red-500/600`, `bg-amber-500`, `hover:bg-red-50/700`, `hover:text-slate-600`. Verified live end-to-end with a throwaway QA account (registered, manually flipped `emailVerified` via a direct Prisma script since SMTP isn't configured in dev, deleted after): confirmed SSR `data-palette` via `curl`, confirmed the populated `/dashboard/priority-attention` page (loaded via "Try a sample") renders teal accents/active-nav/legible status badges throughout, confirmed switching to a dark preset (`gold`) and reloading still correctly coerces back to `'none'`/"Classic Blue" per the pre-existing (untouched) enforced-light-mode policy — no regression. Explicitly out of scope, named: bespoke pixel-for-pixel redesign of all 64 routes (only ~15-20 have any Figma comp at all; the token/override-block/shared-primitive layer is the only non-speculative way to reach "every single style" across routes Figma never designed); mapping Figma's 5 section colors onto the 8 real nav groups (user declined in favor of one accent); reconciling the 4 overlapping token-naming systems (`--dc-*`/`--color-*`/legacy `--dc-text-2`-style aliases/health-band tokens) into one scheme — this ticket updates values through the existing alias chains, a restructure is separate, larger work. Full verification suite clean: typecheck, `npm run lint` (8 pre-existing warnings, no new ones), `npm run lint:css`, 1232/1232 tests (136 suites, including 3 new default-palette regression tests), `npm run validate`, `npm run build`. |
| THEME-04 | Light-theme the auth/marketing page family (login, register, upload, verify-email, forgot-password, reset-password, `/landing`'s hero) | P2 | ✅ Done | User pointed out the upload page (`/`) still looked unchanged after `THEME-03`. Investigation found it's a deliberately separate, hardcoded-dark hero — `app/page.module.scss`'s own header comment says it matches `/login`/`/register` "intentionally not theme-reactive." Converting only `/` would break that established 3-page consistency; user approved converting all three. Further investigation found the actually-shared surface is bigger: `AnimatedDataBackground` (the canvas wave animation) is also used by `/verify-email`, `/forgot-password`, `/reset-password` (identical `#050b16` glass-shell pattern) and `/landing`'s hero section (a related but distinct dark treatment). Converting only 3 of 7 would recreate the same inconsistency one level up; user approved all 7. **`AnimatedDataBackground.tsx`**: not CSS/token-driven — colors are hardcoded directly into `ctx.fillStyle`/`strokeStyle` Canvas 2D calls (background radial gradient, dot grid, 6 sine-wave streams, vignette), so this needed a literal-value rewrite, not a token swap. Confirmed via repo-wide grep it has exactly 7 call sites, all converting to light — a straight value replacement rather than adding a `variant` prop for a dark case nothing needs (CLAUDE.md §5.5). New wave colors built from the Mediterranean palette's actual hexes (teal `#087F8C`, blue `#2C7BE5`, text-tone `#203038`) at higher opacity than the dark version, since translucent strokes need more opacity to read against a light base. **Glass-card pages** (`login`/`register`/`page.module.scss`): full mapping table applied (dark bg → `var(--dc-bg)`, dark glass card → light `rgba(255,255,255,0.9)` glass, orange accent → teal `var(--dc-accent)`, heavy black shadow → Figma-style `rgba(32,48,56,0.14)`, notice/banner text → the semantic tokens from `THEME-03`). No `.tsx` changes needed — confirmed via grep neither page uses raw Tailwind color classes, only module-scoped classes. **Hybrid pages** (`verify-email`/`forgot-password`/`reset-password`): a smaller finding narrowed this to a 2-line-per-file edit — their content is *already* a white card using raw Tailwind classes (`bg-white`, `bg-blue-600`, `text-red-700`), which already resolves correctly through `THEME-03`'s `html[data-palette]:not(.dark)` override block; only the `.wrapper`/`.vignette` shell background needed converting. **`/landing`'s hero** (`LandingHero.module.scss` + `LandingHero.tsx`'s `MOCKUP_KPIS`): the one genuinely bespoke piece — its own sky-blue/orange color identity (`#38bdf8`/`#f97316`), a fake dashboard mockup panel, sparkline, bar chart, trust chips — remapped onto the app's actual two-accent identity (teal/blue) with documented judgment calls (mockup inner-panel tint, KPI mockup colors reassigned to the real semantic success/info/warning tokens) rather than a mechanical swap, since Figma has no direct equivalent for this component. `app/page.tsx`'s stale "sit in a plain white card floating on this page's dark background" comment corrected. Verified: typecheck/lint/`lint:css`/build clean, 1232/1232 tests (no new tests needed — pure CSS/color value changes, no new logic). Manual QA via `npm run dev` screenshotted 6 of 7 pages successfully (login, register, upload→login-redirect, verify-email, forgot-password, reset-password) — light background, visible wave animation, teal accents, readable status banners, all confirmed; `/landing` redirected to `/login` in the throwaway unauthenticated test session (a pre-existing auth-gate unrelated to this change) so its hero wasn't screenshotted live, disclosed as a gap — code changes follow the identical, already-verified mapping pattern used successfully on the other 6. |

---

## 19. P2 — Architecture / Planning Track

Do not implement PostgreSQL, CI/CD, or expanded gateway routing without explicit approval.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ARCH-01 | CI/CD design with GitHub Actions | P2 | ✅ Done 2026-07-22 | Design doc written as DEVELOPER_GUIDE.md §11b (added right before §12 Deployment): full pipeline diagram from `git push`/PR through `quality.yml` to Render's `autoDeploy`, all 5 requested stages (lint/test/build/Docker/deploy — Docker image documented as a self-host/local-parity artifact, not what actually ships to production; Render's own build is), branch/PR gate behavior (runs on both, but not yet a hard merge blocker — see `QA-GATE-07`), and secrets handling (CI needs zero real secrets; production secrets live only in Render's dashboard, never in GitHub Actions). Also corrected `DEVELOPER_GUIDE.md` §12's deployment-targets table, which didn't list Render at all despite `render.yaml` being the actual live production target. |
| ARCH-02 | PostgreSQL migration assessment | P2 | ❌ Not started | Feasibility, Prisma schema diff, migration strategy, rollback plan, performance comparison; assessment only. |
| ARCH-03 | Load-balancer-aware gateway expansion design | P2 | ❌ Not started | round_robin, weighted_round_robin, failover, least_error_rate; depends on GW foundation. |
| ARCH-04 | Advanced notification architecture | P2 | ❌ Not started | Plan only; P4 implementation not approved. |
| ARCH-05 | Jira API read-only architecture | P2/P0 | 🔧 Implementation approved & started (2026-06-20) — Phase 1 in progress on `feature/arch-05-jira-integration` (unmerged) | Design doc: `product/JIRA_INTEGRATION_DESIGN.md`. User approved starting implementation 2026-06-20; see Section 19a below for Phase 1 task tracking (`JIRA-01`, …). Branch intentionally held unmerged until the full feature is delivered, not just designed. |
| ARCH-06 | Storage provider architecture refinement | P2 | 🔍 Needs verification | Confirm current implementation and future replication needs. |
| ARCH-07 | Deployment guide update for Vercel / Docker / VPS | P2 | 🔍 Needs verification | Verify existing docs; update if behind. |
| ARCH-08 | System health/admin diagnostics page | P2 | 🔍 Needs verification | Check implementation and docs. |
| ARCH-09 | Branding integration across login, favicon, reports, and exports | P2 | 🔍 Needs verification | Align with Delivery Clarity branding bundle if approved. |
| ARCH-10 | Landing page inside app | P2 | 🔍 Needs verification | Verify status and docs. |
| ARCH-11 | Audit Charts page KPI chips and truncated values | P2 | ✅ Done / Needs traceability | Uploaded TODO says done. Verify traceability. |

---

## 19a. ARCH-05 Phase 1 — Jira Connection Foundation (schema only)

Per `product/JIRA_INTEGRATION_DESIGN.md` §11 rollout plan, Phase 1 = schema + admin UI (connect/test/field-mapping) + manual "Sync now". Tracked here task-by-task; branch `feature/arch-05-jira-integration`, held unmerged until the full feature ships.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| JIRA-01 | Add `JiraConnection` Prisma model | P1 | ✅ Done (2026-06-20) | `prisma/schema.prisma` — id, name, deploymentType, baseUrl, authEmail, projectFilters (JSON), fieldMapping (JSON), refreshMode, refreshIntervalMinutes, lastSyncAt/Status/Error, createdByUserId, timestamps. `User` gains `jiraConnections JiraConnection[]` back-relation. Per design §6 — token itself is never stored here, only in `GATEWAY_JIRA_API_TOKEN` env. |
| JIRA-02 | Extend `ImportLog` for API-sourced imports | P1 | ✅ Done (2026-06-20) | Added `sourceType` (default `"file"`), nullable `jiraConnectionId` FK (`onDelete: SetNull`). Made `fileName`/`fileSize`/`fileType` nullable since they're inapplicable to API-sourced rows — file-upload code path unaffected (still always supplies them). |
| JIRA-03 | Apply migration to dev DB | P1 | ✅ Done (2026-06-20) | Migration `20260620132026_add_jira_connection` created and applied via `prisma migrate deploy` (had to baseline 5 pre-existing untracked migrations first — `prisma migrate resolve --applied` — since the dev DB predates migration tracking; see `DRIFT-01` below for a related pre-existing issue found along the way). Verified: existing 48 `ImportLog` rows and 3 `User` rows intact after migration. `npx prisma generate` re-run. Full suite (572/63) + lint + build all still pass. |
| JIRA-04 | Admin UI: connect / test | P1 | ✅ Done (2026-06-20) — field-mapping deferred to JIRA-06 | New `src/components/admin/JiraConnectionsPanel.tsx` + new "Jira Integration" tab in Admin Settings (`src/lib/adminConsole.ts` `ADMIN_TABS`/`Tab`, `AdminNavSidebar.tsx` `SETTINGS_SUB_ITEMS`, `app/admin/settings/page.tsx` `VALID_TABS` — **the duplicate `VALID_TABS` array is a pre-existing pattern; had to add `'jira'` there too or the tab silently fell back to Users, caught via real browser testing**). Form: name/deployment type/base URL/Cloud email/project keys; "Test connection" button calls JIRA-05's test route and shows the live result inline (success → account name; failure → the exact error, e.g. "GATEWAY_JIRA_API_TOKEN is not set"). Verified end-to-end in a real browser: create → token-not-set guard renders correctly; desktop layout matches sibling admin panels. Field-mapping UI (sourced from `GET /rest/api/3/field`) waits for JIRA-06 since there's no adapter to map fields *into* yet. |
| JIRA-05 | API routes: create/list/test connection | P1 | ✅ Done (2026-06-20) | `app/api/admin/jira-connections/route.ts` (GET list, POST create) and `app/api/admin/jira-connections/[id]/test/route.ts` (POST — calls `GET /rest/api/{2\|3}/myself` through the Gateway with Basic auth for Cloud / Bearer for Server-DC, records `lastSyncStatus`/`lastSyncError`). Admin-only; token never returned, only a `hasGatewayToken` boolean (mirrors `app/api/admin/storage/route.ts`'s `hasCredentials` pattern). `GATEWAY_JIRA_API_TOKEN` documented in `.env.example`. |
| JIRA-05b | Gateway enhancement: per-connection `baseUrlOverride` | P1 | ✅ Done (2026-06-20) | Discovered while building JIRA-05: `callExternal()`/`getProviderConfig()` only supported a single global base URL per provider type (one env var), but `JiraConnection` allows multiple admin-configured connections. Added optional `baseUrlOverride`/`extraAllowedHosts` to `GatewayRequestOptions` and a 2nd `overrides` param to `getProviderConfig()` — additive, backward-compatible (existing single-arg callers and all `TC-GW-*` tests unaffected). New tests `TC-GW-22`/`TC-GW-22b`. *(Superseded note: this row originally said "credential values still always come from env, never overridden" — that changed in `JIRA-05c` below, per explicit user request.)* |
| JIRA-05c | Move Jira token from raw env var to encrypted App Config | P1 | ✅ Done (2026-06-20) | **User explicitly rejected the env-var-only design** ("no need for hard code... this should be in the config") — moved the token into the same encrypted `app-config.json` system already used for SMTP (`src/lib/app-config.ts`): new `AppJiraConfig`/`AppConfig.jira`, `SafeAppConfig.hasJiraToken`, `getJiraApiToken()` helper, `GATEWAY_JIRA_API_TOKEN` demoted to fallback/override (same precedence pattern as `SMTP_USER`/`SMTP_PASS`). New "Jira API Token" field in `AppConfigPanel.tsx`. Updated both Jira connection routes to call `getJiraApiToken()` instead of reading `process.env` directly. **Caught via real end-to-end testing, not unit tests:** saving the token to encrypted config alone didn't work at first — `getProviderConfig()`'s `enabled` gate independently re-checked `process.env` credential presence regardless of the route's resolved token, silently producing "Provider not configured" on every test-connection call. Fixed by adding `credentialsPresentOverride` to `GatewayRequestOptions`/`ProviderConfigOverrides` so a caller with non-env-sourced credentials can tell the gateway they're present. New tests `TC-GW-23`/`23b`; `jiraConnections.test.ts` updated to mock `getJiraApiToken()` instead of `process.env`. `product/JIRA_INTEGRATION_DESIGN.md` §2 updated to match. Verified live in a real browser: saved a token via App Config, created a connection, clicked Test — got a real outbound HTTP call (legitimate 401 from the fake test token, not a config-wiring error). Suite: 589/64 passing. |
| JIRA-06 | `src/services/jira/apiAdapter.ts` — normalize API response to canonical `JiraIssue[]` | P1 | ✅ Done (2026-06-21) | `normalizeJiraIssue()`/`normalizeJiraIssues()` — standard fields (Issue Type, Summary, Status, Project, Assignee, Reporter, Priority, Resolution, Labels, Fix Version/s, Created/Updated/Resolution/Due Date) read from their fixed Jira REST path; custom fields (Story Points, Sprint, Epic Link, Business Value, Risk Score) resolved via the connection's `fieldMapping` (canonical name → `customfield_NNNNN`) with shape-specific normalization (Sprint handles both the modern array-of-objects and legacy greenhopper-string formats; Epic Link handles both a plain key string and an object). Standard-field extraction always wins over a same-named mapping entry. Output verified to pass `validateIssueData()` unchanged. |
| JIRA-06b | `src/services/jira/fieldDiscovery.ts` + `GET /api/admin/jira-connections/[id]/fields` | P1 | ✅ Done (2026-06-21) | Discovered while building JIRA-06: the adapter's `fieldMapping` can't be populated without knowing the instance's actual `customfield_NNNNN` → name mapping (per design §4 step 1), so built the discovery half too. Calls `GET /rest/api/{2\|3}/field` through the Gateway. Extracted `buildJiraAuthHeader()`/`jiraMyselfPath()`/`jiraFieldPath()` into `src/services/jira/auth.ts`, removing duplicated auth-header logic across the test-connection, field-discovery, and App Config test-token routes. **Verified live against the user's real Jira Cloud instance:** returned all 117 real fields, correctly surfacing both "Story Points" (`customfield_10033`) and "Story point estimate" (`customfield_10016`) by name — not a mock. Field-mapping *UI* (picking which discovered field maps to which canonical name) is still deferred — this ships the data plumbing only. |
| JIRA-07 | Manual "Sync now" route | P1 | ✅ Done (2026-06-21) | `POST /api/admin/jira-connections/[id]/sync` — `src/services/jira/sync.ts` builds a safe, bounded JQL from the connection's `projectFilters` (never raw JQL text — see design §3), paginates through `callExternal()` (Cloud `nextPageToken` / Server-DC `startAt`, capped at 1000 issues per sync), normalizes via JIRA-06's `normalizeJiraIssues()`, validates via `validateIssueData()` (all-or-nothing — a validation failure never touches the live dashboard), computes metrics via the existing `calculateDashboardMetrics()`, then `writeLatestMetrics()` (same mechanism the file-upload route uses) + a new `ImportLog` row (`sourceType: "api"`, `jiraConnectionId` set) + updates `lastSyncAt`/`lastSyncStatus`/`lastSyncError` + non-blocking `pushToCloud()`. **Deviated from the original design note ("+ DashboardSnapshot"):** `DashboardSnapshot` is a deliberate user-named milestone capped at 20 per user — auto-creating one on every sync would silently eat that budget. `writeLatestMetrics()` (not `DashboardSnapshot`) is the actual mechanism that updates the live dashboard, matching the file-upload route exactly. **Caught via real testing against the user's actual Jira Cloud instance, not mocks:** (1) found and fixed a real bug — the JQL pagination query object was built but never actually passed to `callExternal()`, silently sending unfiltered/unpaginated requests; caught by `TC-JIRA-36`/`37` before ever touching a real API. (2) Found that config errors (e.g. no project keys) were being reported as HTTP 502 (implying an upstream Jira failure) when they never even reached Jira — added a `configError` flag so these correctly return 409. (3) **Full end-to-end sync verified live**: discovered real project keys via a direct (bypassing the app) read-only API probe, set a real project (`SAMPLEPROJ`, 7 issues) on the user's connection, ran an actual sync — got `{ totalIssues: 7, doneIssues: 1, healthScore: 48 }`, confirmed the `ImportLog` row and `data/latest-metrics.json` were both written correctly, then cleaned up the test data and reverted the connection's `projectFilters` to its original `[]`. |
| JIRA-08 | Fallback contract: `'jira-api'` `MetricsDataSource` | P1 | ✅ Done (2026-06-21) | `writeLatestMetrics(metrics, origin?)` (`src/services/metrics/latestMetricsStorage.ts`) now accepts an optional `{ source: 'file' \| 'jira-api', connectionName?, connectionId? }` and persists it alongside `savedAt`/`metrics` in `latest-metrics.json` — backward compatible, `origin` defaults to `null` for pre-existing files. The sync route tags writes `{ source: 'jira-api', connectionName: connection.name, connectionId: connection.id }`; both upload routes (`/api/upload`, `/api/upload/merge`) tag `{ source: 'file' }`. `GET /api/metrics/latest` now reads that origin and, when `'jira-api'`, returns `source: 'jira-api'` + `connectionName` (taking priority over cloud-transport detection — the snapshot's origin matters more to a viewer than how the file reached the server). `src/lib/storage.ts`'s `MetricsDataSource` union gained `'jira-api'`; `loadMetricsWithSource()` threads `connectionName` into `MetricsSourceInfo`. `DataSourceBadge.tsx` (`src/components/ui/DataSourceBadge.tsx`) — previously dead code, never actually mounted anywhere — gained a `'jira-api'` source/config entry, a local `formatRelativeTime()` helper (no existing shared one in the repo), and now renders "Jira (ConnectionName) — last synced Xm ago" (full) / "Jira · Xm ago" (compact). **Mounted it for the first time**, in `DashboardTopbar.tsx`'s right rail (`<DataSourceBadge compact />`, between "New Upload" and the notification bell) — the only place it's now visible across all `/dashboard/*` routes. The "never wipes last-good snapshot" guarantee already held structurally from JIRA-07 (`writeLatestMetrics()` only runs after all-or-nothing validation succeeds) — JIRA-08 just makes that state visible. **Caught via live testing:** `/dashboard/summary` actually `redirect()`s to the separate root-level `/summary` page (a different, older topbar shell, not `DashboardTopbar`) — verification had to use a real `/dashboard/*` route (`/dashboard/priority-attention`) to see the mounted badge. Verified end-to-end against the real Jira connection: synced `SAMPLEPROJ` (7 issues) → badge showed "Jira · 5m ago" with title `"Jira (Test) — last synced 7m ago"`; then forced a sync failure (cleared `projectFilters`, got 409) and confirmed `/api/metrics/latest`'s `savedAt`/`source`/`metrics` were byte-for-byte unchanged — the dashboard never lost the last-good Jira snapshot. Test data reverted afterward. |
| JIRA-09 | Tests | P1 | ✅ Done (2026-06-21) | `jiraConnections.test.ts` — 24 tests (`TC-JIRA-01–13`, `25–28`, `40–46`, `44b`) covering all four Jira admin routes (create/list, test-connection, field discovery, sync): auth/role guards, validation, create + audit, test success (Cloud Basic + Server/DC Bearer), gateway failure handling, token-not-configured guard, sync success/failure/config-error/validation-failure paths. New `jiraApiAdapter.test.ts` — 11 tests (`TC-JIRA-14–24`). New `jiraSync.test.ts` — 11 tests (`TC-JIRA-29–39`) covering JQL building (including unsafe-character filtering), Cloud/Server-DC pagination, mid-pagination failure, and the 1000-issue safety cap. New `latestMetricsStorage.test.ts` — 4 tests (`TC-JIRA-47–50`) covering origin-metadata round-trip, backward compatibility with pre-existing files with no `origin` field, and the reader-never-writes contract. `cloudRestoreHardening.test.ts` extended with `TC-CS-13/14/15` covering `/api/metrics/latest`'s `jira-api` source detection (and its priority over bucket/cache detection) plus `loadMetricsWithSource()` threading `connectionName` through. Plus `TC-GW-22`/`22b`/`23`/`23b`. Suite: 630/67 passing. |
| JIRA-10 | Update all related product docs | P1 | ✅ Done (2026-06-21) | `product/SRS.md` Addendum G (FR-337–FR-341, G.1–G.3) + new §G.4 (FR-342/FR-343) + revision history rows 4.9.3/4.9.4; `product/USE_CASES.md` UC-110 + new UC-111; `product/TEST_CASES.md` §9.57 updated to reference UC-110/UC-111/FRs, extended to `TC-JIRA-50`; `product/RELEASE_NOTES.md` v4.5.0–v4.8.0 entries; `product/JIRA_INTEGRATION_DESIGN.md` §8 updated in place with implementation corrections. Schema-only/API-only earlier slices (JIRA-01–03/06/06b) correctly had no UC/SCN/UJ per "no UC for vaporware" until a slice became admin- or dashboard-reachable (JIRA-04 for connections, JIRA-07/08 for sync+badge, covered by UC-111). |
| DRIFT-01 | Pre-existing migration drift: `SystemErrorLog` has no tracked migration | P2 | ✅ Done (2026-06-23) | Discovered 2026-06-20 while migrating for JIRA-03: the dev DB's `SystemErrorLog` table exists (created via `db push` at some point) but no migration file ever recorded its creation, so `prisma migrate diff` tried to re-`CREATE TABLE` it. **Fix:** added baseline migration `prisma/migrations/20260623000000_baseline_system_error_log/migration.sql` using `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` so it's a no-op against databases that already have the table but provisions it correctly on a fresh one. Marked applied against the existing dev DB via `prisma migrate resolve --applied`; verified `prisma migrate status` reports "Database schema is up to date!" with zero drift. **Verified on a genuinely fresh DB**: ran `prisma migrate deploy` against a brand-new throwaway SQLite file at `/tmp/dc_fresh_test.db` — all 7 migrations applied cleanly in order and `SystemErrorLog` (with all 3 indexes) was created, confirming the original risk is closed. No schema, application code, or test changes — this is a migrations-only fix. |
| JIRA-11 | Bug fix: `Parent Key` never survived a live Jira sync | P1 | ✅ Done (2026-06-22) | **User report:** "Explore Delivery Structure" couldn't show a multi-level ancestor chain (e.g. Epic → Initiative/"Project" → "Product") for API-synced data, even though the same data showed correctly when uploaded as CSV. Root-caused to two separate bugs, not one: (1) `src/services/jira/apiAdapter.ts`'s `STANDARD_FIELD_EXTRACTORS` never read Jira's standard `fields.parent.key` at all — a fixed-path field on every issue (Sub-task→Story, or Epic→Initiative under team-managed hierarchy), not a per-instance custom field, so it needed no `fieldMapping` entry, it just needed to be read. (2) Even after that fix, a live re-sync still showed `parent: ""` — `src/services/jira/sync.ts`'s `STANDARD_FIELD_IDS` (the explicit `fields=` query param sent to Jira's `/search/jql` endpoint) never included `'parent'`, so Jira's bulk search response omitted the field entirely even though it exists on the issue — confirmed via a direct raw `GET /rest/api/3/issue/AJ-28` probe showing `fields.parent.key: "AJ-27"` while our adapter's input never had it. Separately, `src/services/relations/relationExplorer.service.ts`'s `buildRelationGraph()` only ever showed **one level up** from the focus node — by deliberate prior design (see the now-removed comment "No siblings, no full ancestor chain") — even though an unused `getAncestorChain()` helper already existed in `hierarchy.service.ts` for exactly this. Wired it in: the graph now walks the full ancestor chain to the root, with depths counting down (`-1`, `-2`, ... for each level up) — dagre's existing auto-layout (already edge-based, not depth-based) renders it correctly with no further changes. **Verified live end-to-end** against the real "Agile Jordan" connection: re-synced after the fix, confirmed `AJ-28`'s `parent` field resolved to `AJ-27`, and the Explore page rendered the full chain — `AJ-26` ("Test product") → `AJ-27` ("test project") → `AJ-28` (focus Epic) → 19 child stories/tasks — using a temporary debug route to inspect the raw Jira API response (deleted before commit, never part of the product). 6 new tests: `TC-JIRA-51/52` (Parent Key extraction + omission), `TC-JIRA-53` (sync requests the `parent` field), `TC-E-09/10/11` (multi-level ancestor chain, depth, and edge presence). Suite: 636/67 passing. |
| JIRA-12 | Bug fix: phantom epic link + wrong orphan/branch flags on hierarchy roots; "Unknown" type for Product/Project | P1 | ✅ Done (2026-06-22) | **Follow-up to JIRA-11**, found via the user's own live screenshots of the fixed Explore page: focusing on the middle node (`AJ-27`, "Project") showed zero connecting edges, the root ancestor (`AJ-26`, "Product") wrongly tagged both "ORPHAN" and "MOST WORK", and both showed type "Unknown". Root-caused with a Jest reproduction (`reconstructHierarchy()` called directly on the real 3-issue shape) before touching any UI code: `hierarchy.service.ts`'s Step 2 "prefix-based inference" — designed to link a Story with no explicit Epic Link to an Epic sharing its project-key prefix — fired on `AJ-26` too, because EVERY issue in a project shares the same key prefix; it created a phantom `epic` link `AJ-26 → AJ-28` purely by coincidence, forming a 3-node cycle (`AJ-26→AJ-28→AJ-27→AJ-26`) that broke `getAncestorChain()` (which only de-dupes by *visited parent*, not by the original focus key, so it walked the cycle and re-included the focus node itself) and fed a bogus child into `computeLargestUnfinishedBranch()`. Fixed with a type-name-independent guard — `if (map.children.has(key)) continue;` — added to both Step 2 and Step 3: an issue that Step 1 already established as someone else's explicit parent can never also be a leaf needing phantom inference or orphan-flagging, regardless of its type name. (Note: a `LEAF_TYPES` allowlist was also added/edited directly in the file during this session to gate Step 2/3 by issue type name — the `map.children.has(key)` guard is intentionally independent of that list's exact contents, since hierarchy-level names like Initiative/Project/Product/Theme are admin-configurable per Jira instance.) Separately fixed the "Unknown" type label: added `'Initiative'`, `'Product'`, and `'Project'` to `IssueNodeType` (`src/types/relations.ts`) with their own `NODE_TYPE_CONFIG` entries (`src/components/explore/nodeStyles.ts`) and `TYPE_MAP` entries (`relationExplorer.service.ts`) — `product`/`project` get their own distinct type, anything else above Epic (initiative/theme/portfolio) falls back to the generic `'Initiative'` type. 5 new tests in `hierarchyService.test.ts` (`TC-HIER-01–05`) plus `TC-E-12/13` in `relationExplorer.test.ts`. **Verified live**: re-synced the real connection, confirmed `AJ-26`/`AJ-27` now show their correct types ("Product"/"Project") with zero orphan/branch badges and "Orphans: 0" in Key Metrics. **Separate issue discovered, NOT fixed (out of scope for this report):** the relation graph's connecting edges never render any visible line at all — reproduced even on the unrelated, already-correct `AJ-28`→19-children graph, in both dev and production builds, so it predates today's changes and isn't something this fix introduced. `graph.edges` data is correct (confirmed via direct test) and reaches `<ReactFlow edges={rfEdges}>`, but the rendered `.react-flow__edges` SVG group is always empty. Needs its own investigation — tracked as a new line item below. Suite: 643/68 passing. |
| JIRA-13 | Bug fix: relation graph never rendered connecting edges | P2 | ✅ Done (2026-06-23) | **Root cause found:** `WorkItemGraph.tsx`'s custom React Flow node type (`IssueNodeCard`) never rendered a single `<Handle>` element. React Flow computes every edge's SVG path from its source/target node's registered handle bounds (via `getBoundingClientRect`-based measurement) — with zero handles registered, there is nothing for an edge to anchor to, so `.react-flow__edges` always contained only the `<defs>` arrowhead marker and an empty `<g>`, even though `graph.edges` itself was correct (as already confirmed in `JIRA-12`'s investigation) and reached `setRfEdges()` unchanged. This was a markup omission, not a dagre/version/timing issue as originally suspected. **Fix:** added `<Handle type="target" position={Position.Top} isConnectable={false} .../>` and `<Handle type="source" position={Position.Bottom} .../>` to `IssueNodeCard`, matching the existing top-to-bottom (`rankdir: 'TB'`) dagre layout direction; handles are visually hidden (`opacity: 0`, 1×1px) and non-interactive (`isConnectable={false}`) since this graph is read-only/click-to-focus, not user-rewireable. No changes to edge data, dagre layout, or any other component. **Verified live**: re-ran the real `AJ-28` graph (Product → Project → Epic → 19 children, the same case `JIRA-12` left with correct data but invisible edges) via a Playwright browser session — `.react-flow__edge-path` count went from 0 to 20 with real, non-empty `d` path attributes, and the screenshot shows all parent/child connector lines rendering correctly. No Jest test added: this is a DOM/SVG layout-measurement bug (`getBoundingClientRect`-driven), not a data-logic one — jsdom (the existing Jest environment) cannot perform real layout, so a synthetic test would not have caught this in the first place and wouldn't meaningfully guard against a regression; live browser verification is the correct and sufficient check here, consistent with this component having no prior Jest coverage either. Lint: 16 pre-existing inline-style warnings on this file unchanged (confirmed via before/after diff — none introduced by this fix); typecheck clean; full suite 667/70 unaffected. |
| ISSUETYPE-01 | Feature: admin-configurable Issue Type Hierarchy (custom types, no longer restricted to built-ins) | P1 | ✅ Done (2026-06-22) | **User request, directly following JIRA-11/12:** "I need screen that contains all the types... option to add custom types, so user no more restricted with builtin types, and need to set the hierarchy like Product → Project → Epic → Story → Subtask." The previous fixes (`JIRA-11`/`JIRA-12`) had hardcoded the hierarchy as TypeScript literals/maps (`LEAF_TYPES`, `TYPE_MAP`, `IssueNodeType` union) — this replaces that with a real admin-configurable registry, the same pattern as the existing Orphan Rules settings (`src/types/orphanRules.ts` + `orphanRules.service.ts`). New `src/types/issueTypeHierarchy.ts` — `IssueTypeDefinition` (`id`, `label`, `matchNames[]`, `level`, `icon`, `color`/`bg`/`border`, `size`, `builtIn`) + `DEFAULT_ISSUE_TYPES` seeded with the full Product(0)→Project/Initiative(1)→Epic(2)→Story/Task/Bug/Spike/Technical Debt/Risk/Change Request(3)→Sub-task(4) chain. New `src/services/settings/issueTypeHierarchy.service.ts` (read/write/cache, `data/issue-type-hierarchy.json`) and `app/api/admin/issue-type-hierarchy/route.ts` (`GET` any logged-in user, `POST` admin-only; validates non-empty types, integer levels ≥0, no duplicate ids/match-names, and refuses to delete a built-in type). **`IssueNodeType` changed from a closed TypeScript union to `string`** (`src/types/relations.ts`) — a genuinely open set of admin-defined labels can never be a compile-time-closed union; `'Unknown'` remains the only guaranteed fallback. `hierarchy.service.ts`'s Step 2 (prefix inference) and Step 3 (orphan detection) were generalized from "must specifically be Epic" to "must be exactly one configured level up" — this is a real behavior improvement, not just a refactor: previously a Sub-task with no parent could get phantom-linked straight to an Epic, skipping its actual Story/Task parent level; now it correctly looks for a Story/Task-level candidate first. `relationExplorer.service.ts`'s `resolveType()`/`buildNode()`/`buildRelationGraph()` and `nodeStyles.ts`'s `NODE_TYPE_CONFIG` (now `buildNodeTypeConfig(issueTypes)`) all take the live config as a parameter instead of reading hardcoded constants; `WorkItemGraph.tsx`/`RelationDetailsTable.tsx`/`RelationCharts.tsx` accept an `issueTypes` prop (default `DEFAULT_ISSUE_TYPES`) threaded down from `app/explore/page.tsx`, which fetches `/api/admin/issue-type-hierarchy` once on mount. New admin screen `src/components/admin/IssueTypeHierarchySettings.tsx` — lists every type grouped by level with up/down level-reorder arrows, an icon picker, a color-preset picker, and an "Add custom type"/delete-for-non-built-in flow; wired into Admin Settings as a new "Issue Type Hierarchy" tab (`adminConsole.ts` `Tab`/`ADMIN_TABS`, `AdminNavSidebar.tsx` `SETTINGS_SUB_ITEMS`, `app/admin/settings/page.tsx` `VALID_TABS` — the same three-places-to-register pattern already documented from `JIRA-04`). 17 new tests in `issueTypeHierarchy.test.ts` (`TC-IT-01–17`: defaults, service read/write/fallback, route auth/validation, and the generalized hierarchy logic against a synthetic custom 2-level "Widget/Gadget" hierarchy never seen in any built-in default). **Verified live**: added a custom "Strategic Theme" type through the real admin screen, saved it, confirmed it persisted via a fresh page load, then confirmed the real "Agile Jordan" data (`AJ-26`/`AJ-27`/`AJ-28`) still resolved correctly through the now-dynamic config before cleaning up the test type. Suite: 660/69 passing. |
| JIRA-14 | Feature: "Sync Jira" button on the dashboard for any logged-in user | P1 | ✅ Done (2026-06-22) | **User request:** "how to pull new data from jira, I need a new button that allow to pull data from jira some where all users type can click to pull new data make it on dashboard page." Until now, manual sync was only reachable from Admin Settings → Jira Integration and admin-only. **Two product decisions confirmed with the user before building:** (1) when multiple connections exist, sync the one most recently synced (falling back to the most recently created if none has ever synced) — matches "refresh what's currently powering the dashboard," rather than prompting the user to pick or syncing every connection; (2) any logged-in user can trigger it, not just admins — the route only requires `session.isLoggedIn`, no role check; the Jira API token itself is still never exposed to the client. Extracted the all-or-nothing sync execution out of the existing per-connection admin route into a new shared `src/services/jira/connectionSyncRunner.ts` (`runJiraConnectionSync()` + `resolveActiveJiraConnection()`), so both entry points share one implementation rather than drifting apart. New `POST /api/jira/sync` (no `:id` param — auto-resolves the connection) is the dashboard-facing route; `app/api/admin/jira-connections/[id]/sync/route.ts` (admin, explicit connection) was refactored to call the same shared function, confirmed via its full existing 25-test suite passing unmodified. New "Sync Jira" button added to `DashboardTopbar.tsx`'s right rail (next to "New Upload"), with a spinning-icon loading state and an inline error banner (auto-dismisses after 6s) shown on failure; on success the page reloads so every dashboard component re-fetches the now-fresh data via its existing mount-time `loadMetricsWithSource()` call — no new pub/sub mechanism needed since none currently exists. 7 new tests in `jiraDashboardSync.test.ts` (`TC-JIRA-54–60`): connection-resolution precedence (most-recently-synced beats most-recently-created), no-role-check confirmation, 404 when no connection exists, and the response correctly naming which connection was used. **Verified live end-to-end as a real non-admin user**: created a temporary `scrum_master`-role test account, logged in, confirmed the button is visible and clickable, clicked it, and got a real successful sync of 27 issues from "Agile Jordan" — then deleted the temporary test account afterward. (The resulting real sync/`ImportLog` row was left in place, same as prior real-data verifications in this session — only the disposable test account was cleaned up.) **Caught via live testing, not code review:** hit the same pre-existing `.next-jira-dashboard` build-corruption issue from earlier in this session (a stale build can leave one route's `webpack-runtime.js` unresolvable) while testing the force-password-change flow for the temp account — resolved with a clean `rm -rf .next-jira-dashboard && next build`, unrelated to this feature's code. Suite: 667/70 passing. |


---

## 20. P3 — Future Full External Integrations

Do not implement until P2 design is documented and reviewed.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| FUT-JIRA-01 | Full Jira API read integration | P3 | 🚫 Blocked | Start only after Jira gates and design doc are complete. |
| FUT-JIRA-02 | Jira write-back / ticket creation from system suggestions | P3 | ❌ Not started | Concrete trigger now exists (2026-06-26): `suggestedBacklogItems` on `/retro`'s insight panels (RETRO-29) — currently Copy-only. When picked up: (a) requires a *write-scoped* Jira credential — today's Jira integration (`src/services/jira/`) is read-only sync (JIRA-06/07/08), so this needs new write-scope OAuth (FUT-JIRA-03) or a write-capable API token, not a reuse of the existing read connection; (b) needs a "Create in Jira" button per `SuggestedBacklogItem` that lets the user pick a target project/issue type before sending — never auto-create without a per-item confirmation step; (c) needs a safe approval workflow, audit event (mirroring `user_add_request_*` pattern), and explicit rollback/failure handling (e.g. partial-batch failure when multiple items are sent at once); (d) needs a clear no-duplicate-creation safeguard (e.g. don't let a user click "Create" twice on the same item). Do not implement until a P2 design doc covering all four points is written and reviewed — see BRD "Out of Scope," SRS §Out of Scope, and SRS FR-356b for the current explicit deferral. |
| FUT-JIRA-03 | Jira OAuth support | P3 | ❌ Not started | Requires security design. |
| FUT-CLOUD-01 | Full enterprise cloud integration | P3 | 🔍 Partly done / future refinement | Local/S3/Azure/GCP provider support exists per uploaded TODO; future may include multi-provider replication. |
| FUT-POSTGRES-01 | PostgreSQL production migration | P3 | 🚫 Blocked | Do not start until P2 migration assessment is approved. |
| FUT-CICD-01 | Full CI/CD deployment automation | P3 | 🚫 Blocked | Do not start until P2 GitHub Actions design is approved. |
| FUT-MULTI-01 | Advanced multi-node deployment | P3 | 🚫 Blocked | Requires load-balanced gateway and shared persistence design. |

---

## 20a. P1 — Multi-Tenant Organization Management (Future Roadmap — Phase 1 Partially Implemented)

**Design doc written 2026-06-27, updated repeatedly same day:** `product/MULTI_TENANT_ORG_DESIGN.md` — covers the `Organization` model, `organizationId` migration plan, the two-layer tenant-isolation enforcement (mandatory `scopedRepository` + future Postgres RLS), per-organization storage isolation via `scopedStorage()` (§3a, `ORG-44`–`46`), the public Organization Application & Owner Approval workflow (§4, `ORG-23`–`33`) including structured rejection feedback and resubmission (§4.4.1/§4.4.2, `ORG-34`/`35`), per-organization settings for theme/branding/issue-hierarchy/thresholds/retention/storage/SMTP (§7a, `ORG-36`–`43`), domain ownership verification, the enumeration-safe domain-first login flow, branding, suspension/offboarding, individual data privacy/sharing/self-service deletion (§11, `ORG-47`–`54`), cross-organization peer sharing of aggregated results only (§11.4, `ORG-55`–`59`), and a 10-phase rollout plan. Overlaps with `AIPLAN-03` (`organisationId` on canonical models) — this design is the authoritative schema owner; one migration must serve both, not two competing ones.

**Cross-org sharing decision confirmed with the user 2026-06-27:** two users in *different* organizations (e.g. two Scrum Masters who've never worked at the same company) may share **aggregated results only** (`DashboardSnapshot`, never `ImportLog`/raw data) with each other, individual-to-individual with no admin approval gate, but only after a mutual-consent `CrossOrgConnection`. This is the one deliberate, narrow exception to §1's "zero data overlap between organizations" promise — everything else in this design is unaffected. See design doc §11.4.

**Confirmed with the user 2026-06-27:** "never shared with others" for individual data does **not** remove today's `admin`/`manager`/`c_level` "see all data within my org" visibility — that stays, it's how team dashboards work. It means org-to-org isolation (already covered) plus protecting the plain `user` role's data from other plain users by default, with `ORG-51`–`53`'s explicit opt-in sharing layered on top. See design doc §3.3.

**Phase 1 (schema + isolation core) is partially implemented** on `feature/org-phase1-tenant-isolation` (pushed, unmerged) — see `ORG-04`/`05`/`05a`/`05b`/`07`/`08`/`09` above for exactly what's done vs. remaining. Phases 2–7 remain design-only.

**`ORG-01` superseded 2026-06-27, per explicit user request:** self-serve instant registration is replaced entirely by a gated application process — a public `/join` landing page (`ORG-23`) and multi-step application wizard (`ORG-24`) submit an `OrganizationRequest` (`ORG-25`) that only a single, structurally singular **Platform Owner** (`ORG-27` — the user themselves; no one has authority over this account, by design, not just by policy) can approve or reject (`ORG-26`/`28`/`29`). No `Organization` row is ever created without this explicit human approval step. See design doc §4.

**`ORG-10` decision confirmed with the user 2026-06-27:** "one user per role" is a hard, universal constraint — every organization is capped at exactly 6 users (one per `AppRole`: admin, scrum_master, product_owner, manager, c_level, user), with no plan tier or seat-limit override. `maxSeats` is therefore fixed/derived, not admin-editable; see design doc §2.3.

Still do not implement any `ORG-*` code until this design doc has been explicitly reviewed and approved — writing the design doc satisfies the *gate*, it is not itself the approval.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ORG-01 | Organization registration flow | P1 | ⛔ Superseded 2026-06-27 | Self-serve instant registration is replaced by the gated application/approval flow — see `ORG-23`–`33` and design doc §4. No `Organization` row is ever created without Owner approval. |
| ORG-02 | Per-organization seat limit | P1 | ❌ Not started | **Confirmed 2026-06-27 (see ORG-10): fixed at 6 (one per `AppRole`), not admin-editable** — `maxSeats` is derived from `ASSIGNABLE_ROLES.length`, not a configurable plan/contract value. |
| ORG-03 | Seat-limit enforcement on invite/add-member | P1 | ❌ Not started | Block new member creation once an org's seat limit is reached; show a clear blocked-state message (no silent failure). |
| ORG-04 | Tenant data isolation — `organizationId` on every canonical model, zero exceptions | P1 | ✅ Done (2026-06-27, `feature/org-phase1-tenant-isolation`, unmerged) | `Organization` model added; `organizationId` is `NOT NULL` on `User`/`ImportLog`/`DashboardSnapshot`/`UserAddRequest`/`Notification`/`JiraConnection` (3 migrations: add-nullable → `prisma/backfillDefaultOrganization.ts` → tighten-to-required, verified against the real dev DB with zero data loss). `AuditEvent.organizationId` stays permanently nullable by design, mirroring its existing nullable `userId`. `SystemErrorLog` stays global. Coordinated with `AIPLAN-03`. |
| ORG-05 | Cross-org access prevention enforced at the data-access layer, not just route handlers | P1 | 🔍 Partial (2026-06-27, `feature/org-phase1-tenant-isolation`) | `src/server/tenancy/scopedRepository.ts` built and unit-tested (12 tests, `TC-ORG-01–12`) — injects `organizationId` into every read/write, overwrites any caller-supplied value. **Not yet adopted everywhere**: ~31 existing route/service files still call `prisma.<model>.*` directly for reads/updates/deletes (only `.create()` sites were fixed). Each is named in `.eslintrc.json`'s override allowlist, which must shrink, never grow. |
| ORG-05a | Defense-in-depth — second enforcement layer independent of application code | P1 | ⏸️ Deferred | Layer 1 (`scopedRepository` + ESLint rule) exists. Layer 2 (Postgres RLS) blocked on `FUT-POSTGRES-01` (still SQLite). |
| ORG-05b | ESLint boundary rule — ban direct `prisma.<orgScopedModel>.*` outside the tenancy module | P1 | ✅ Done (2026-06-27) | `no-restricted-syntax` rule in `.eslintrc.json`, error-level. Exemptions: `scopedRepository.ts`, seed/backfill scripts, `system-error-logger.ts` (shared chokepoint requiring explicit `organizationId` from callers), test files, and the explicit ~31-file not-yet-migrated allowlist. Verified: a fresh violating file is correctly flagged; full repo lints clean otherwise. |
| ORG-06 | Organization admin scoping | P1 | ❌ Not started | Org admins manage only their own org's users/seats; platform-level admin role stays separate and is the only role that may ever query across organizations (and only for support/ops tooling, fully audited). |
| ORG-07 | Audit logging for org lifecycle and cross-org attempts | P1 | 🔍 Partial (2026-06-27) | Login now writes `AuditEvent.organizationId`. Found and fixed a real isolation gap: `user_add_request_submit`'s admin notification was broadcasting to every admin in the whole deployment, not just the requester's org. Org-lifecycle events (create/suspend/delete) don't exist yet — no lifecycle routes exist yet. |
| ORG-08 | Tests — seat-limit enforcement, tenant isolation, cross-org denial | P1 | 🔍 Partial (2026-06-27) | `scopedRepository`'s own isolation logic is fully tested (`TC-ORG-01–12`). Route-level adversarial tests require the ~31-file migration in `ORG-05` first — today every deployment still has exactly one org post-backfill, so a route-level cross-org test would trivially pass without proving anything yet. |
| ORG-08a | Tenant-isolation security review before release | P1 | ❌ Not started | Blocked on `ORG-05`'s full route migration. |
| ORG-09 | Update all related product docs | P1 | 🔍 Partial (2026-06-27) | TODO-List.md and `prisma/schema.prisma` inline comments updated; SRS revision-history row added. Full SRS Addendum, BRD, USE_CASES/SCENARIOS/USER_JOURNEYS, TEST_CASES, DEVELOPER_GUIDE still pending — to be done once `ORG-05`'s route migration and `ORG-06`–`08a` close. |
| ORG-10 | Single-occupancy roles — one user per role, per org | P1 | ❌ Not started | **Confirmed 2026-06-27 as a hard, universal constraint** (not plan-gated): each of the 6 `AppRole` values may be held by exactly one user within an organization at a time, always — caps every org at 6 users by construction. Assigning a role already held by another user must reassign-with-confirmation, not silently create a duplicate. See design doc §2.3. |
| ORG-11 | Email domain must match the organization's registered domain | P1 | ❌ Not started | Every user's email must share the exact domain registered to their org (e.g. org domain `ali.com` → only `*@ali.com` emails may join/be invited). Reject signup/invite at validation time if the domain doesn't match — fail closed, with a clear user-facing error (CLAUDE.md §32 external-data validation). |
| ORG-12 | Domain *ownership* verification, not just string matching | P1 | ❌ Not started | Email-domain matching alone does not prove the org controls that domain — anyone with an `@ali.com` address could otherwise register the `ali.com` org first. Require a verification step (DNS TXT record, or admin-confirmation email loop) before a domain is bound to an org, and lock the domain-to-org mapping afterward so a second org cannot later claim the same domain. |
| ORG-13 | Per-organization logo / branding | P1 | ❌ Not started | Org admin uploads a logo (validated file type/size/content per CLAUDE.md §38.4); displayed via the existing icon/branding token pattern wherever the app shows app identity (header, nav, exports, shared reports) — scoped strictly to that org's own users, never shown to or by another org. |
| ORG-14 | Login flow — organization domain, then username, then password | P1 | ❌ Not started | Step 1: enter org domain → resolve org. Step 2: username + password scoped to that org. Must not change or weaken existing auth/session security (CLAUDE.md §38.1) — this changes the *form flow*, not the authorization model. |
| ORG-14a | Login-flow enumeration protection | P1 | ❌ Not started | The domain-lookup step must not reveal whether a domain/org exists (e.g. identical response timing/message for "unknown domain" vs. "wrong password") and must be rate-limited per IP/domain to prevent org-existence or credential brute-forcing. |
| ORG-15 | Organization settings/profile page | P1 | ❌ Not started | Single place for org name, domain, logo, and seat usage (X of 6, per ORG-02/ORG-10's fixed cap) — admin-only, scoped to the admin's own org (per ORG-06). No plan/tier field — see ORG-02. |
| ORG-16 | Org suspension/deactivation (non-destructive) | P1 | ❌ Not started | Billing lapse or abuse must lock out access without deleting org data; reactivation restores access without data loss. Never silently delete on suspension. |
| ORG-17 | Org data export and deletion on offboarding | P1 | ❌ Not started | An org (or platform admin on its behalf) can export all of its own data and request full deletion — supports the "private, no overlap" guarantee by giving each org a real exit path, and supports privacy/retention requirements (CLAUDE.md §39). |
| ORG-18 | Org-level admin audit log | P1 | ❌ Not started | Visible-to-org-admin log of role/seat/branding/domain changes within their own org — separate from the platform-level security audit log in ORG-07. |
| ORG-19 | Account recovery compatible with domain-first login | P1 | ❌ Not started | Forgot-password flow must follow the same enumeration-safe pattern as ORG-14a — must not confirm/deny domain or account existence to an unauthenticated requester. |
| ORG-20 | Per-org rate limiting / abuse isolation | P1 | ❌ Not started | One organization's abusive traffic (login attempts, exports, API calls) must not degrade availability for other organizations — rate limits applied per-org, not globally shared. |
| ORG-21 | Seat-limit-reached experience | P1 | ❌ Not started | When ORG-03's limit is hit, surface a clear in-app message to the org admin (contact/upgrade path) instead of a bare error — no silent block. |
| ORG-22 | Tests — single-occupancy roles, domain enforcement, branding isolation, login enumeration | P1 | ❌ Not started | Cover: duplicate-role assignment rejected/reassign-confirmed; off-domain signup/invite rejected; unverified-domain claim rejected; one org's logo never rendered for another org's session; login/recovery flows leak no domain/account existence info. |
| ORG-23 | Public "Apply to Join" landing page | P1 | ❌ Not started | A genuine marketing-grade public route (`/join`, no auth) — value proposition, product highlights, clear single CTA — built with the same design-token/SCSS-module discipline as the rest of the app (CLAUDE.md §13–22), not a bare form. Replaces `ORG-01`'s self-serve flow. See design doc §4.2. |
| ORG-24 | Multi-step organization application wizard | P1 | ❌ Not started | Steps: company basics → primary contact → org domain (format only, not yet verified) → required "why you're joining" (server-side length-enforced, learning from the `FR-316` client-only-validation gap) → logo + supporting photo/document uploads → review screen → confirmation screen with a realistic response-time expectation. See design doc §4.2. |
| ORG-25 | `OrganizationRequest` model and public submission endpoint | P1 | ❌ Not started | New Prisma model (design doc §4.3); `POST /api/organization-requests` is public but rate-limited per-IP (same pattern as `app/api/user-add-requests/route.ts`) to prevent spam/DoS via the public form. |
| ORG-26 | Owner-only application review queue | P1 | ❌ Not started | Mirrors `UserAddRequestsPanel.tsx`'s shape (filterable queue, expandable cards, decision note) but guarded by the Platform Owner check (`ORG-27`), not `role === 'admin'` — a regular org admin must never reach this screen. Renders uploaded logo/photos inline. |
| ORG-27 | Platform Owner — structurally singular, not assignable through any UI | P1 | ❌ Not started | **Confirmed 2026-06-27:** the user is the sole Platform Owner; no one has authority over them. Bootstrapped outside the app (env var or one-time seed, never via an API field); no admin mutation route may suspend/demote/delete/reassign the Platform Owner — every such route must explicitly guard against the target being the Owner. See design doc §4.1. |
| ORG-28 | Approve-application flow | P1 | ❌ Not started | Creates `Organization` + first admin `User`, sets `createdOrganizationId`, audits, notifies applicant that domain verification (`ORG-12`) is the next required step. Re-checks `status === "pending"` first — an Owner reviewing two tabs can't double-approve. See design doc §4.4. |
| ORG-29 | Reject-application flow | P1 | ❌ Not started | Requires a decision note (mandatory, unlike the optional note on `UserAddRequest` rejection — rejecting a whole company deserves an explained reason); notifies applicant; no `Organization` created. Paired with `ORG-34`'s structured field feedback, not just the free-text note alone. |
| ORG-30 | Logo/photo upload validation for applications | P1 | ❌ Not started | Type/size/content validated per CLAUDE.md §38.4 — never trusted by extension or declared MIME type alone. Same standard applies to the post-approval `Organization.logoUrl` upload (`ORG-13`). |
| ORG-31 | Audit logging for application decisions | P1 | ❌ Not started | `organization_request_submit`/`organization_request_approve`/`organization_request_reject` audit events, mirroring the existing `user_add_request_*` pattern. |
| ORG-32 | Tests — application workflow | P1 | ❌ Not started | Cover: public submission rate-limited; non-Owner cannot reach the review queue or approve/reject endpoints; double-approve/double-reject rejected; reject without a note rejected; Owner account itself cannot be suspended/demoted/reassigned by any route; resubmission tests from `ORG-35`. |
| ORG-33 | Update all related product docs | P1 | ❌ Not started | SRS (new Addendum), USE_CASES/SCENARIOS/USER_JOURNEYS for the application/approval flow, TEST_CASES, DEVELOPER_GUIDE (Platform Owner bootstrap process), RELEASE_NOTES, TODO-List.md. |
| ORG-34 | Structured rejection feedback ("tell them what to fix") | P1 | ❌ Not started | Reject form pairs the mandatory free-text note with a selectable checklist (`company_info`/`contact_info`/`domain`/`use_case`/`logo`/`supporting_documents`/`other`) so the applicant gets specific, actionable feedback instead of parsing prose. The rejection message enumerates each selected field with a short explanation, then the note, then a direct reapply link. See design doc §4.4.1. |
| ORG-35 | Resubmission after rejection | P1 | ❌ Not started | `/join` accepts an optional (unguessable, link-carried) `previousRequestId`; pre-fills every field except the ones flagged in the prior rejection so the applicant isn't made to retype everything; always creates a fresh `"pending"` row (a resubmission never auto-overturns the prior rejection); same rate-limiting as any other submission. See design doc §4.4.2. |
| ORG-36 | `OrganizationSettings` model — one settings home per org | P1 | ❌ Not started | New 1:1-with-`Organization` Prisma model holding theme, branding, issue-type-hierarchy, health-thresholds, retention, storage, and SMTP/app-config as JSON columns — replaces today's single global `data/*.json` files and encrypted app-config blob, none of which are org-scoped. See design doc §7a.1. |
| ORG-37 | Org-keyed caches for all six settings categories | P1 | ❌ Not started | Every existing module-level settings cache (`_cached`/`_cache` in `app-config.ts`, `thresholds.service.ts`, `issueTypeHierarchy.service.ts`, `settings.service.ts`, `storageProvider.ts`) currently has no key at all — a real cross-tenant leak risk the moment two orgs share a Node process. Each becomes `Map<organizationId, ParsedConfig>`; there is no more "get the config," only "get this org's config." See design doc §7a.2. |
| ORG-38 | Migrate Issue Type Hierarchy to per-org storage | P1 | ❌ Not started | `data/issue-type-hierarchy.json` → `OrganizationSettings.issueTypeHierarchyJson`. Existing schema/validation/admin UI unchanged — only the storage backend moves. |
| ORG-39 | Migrate Health/Severity Thresholds to per-org storage | P1 | ❌ Not started | `data/health-thresholds.json` → `OrganizationSettings.healthThresholdsJson`. |
| ORG-40 | Migrate Data Retention Settings to per-org storage | P1 | ❌ Not started | `data/retention-settings.json` → `OrganizationSettings.retentionSettingsJson`. |
| ORG-41 | Migrate Cloud Storage Provider config to per-org storage | P1 | ❌ Not started | `data/storage-settings.json` → `OrganizationSettings.storageSettingsJson`; credentials stay encrypted the same way they are today. |
| ORG-42 | Migrate SMTP/Jira-token/app-URL config to per-org storage | P1 | ❌ Not started | The SMTP/app-config portion of `src/lib/app-config.ts` → `OrganizationSettings.smtpConfigJson`, encrypted the same way as today. (The Jira API token itself stays tied to its `JiraConnection`, which is already org-scoped per `ORG-04`.) |
| ORG-43 | Org default theme + isolation tests for all six settings categories | P1 | ❌ Not started | `OrganizationSettings.themeJson` becomes an org's default theme; a user's existing `localStorage` override still wins once set (CLAUDE.md §7.1) — this one category keeps a per-user layer on top of the new per-org default. Tests: org A saving any of the six settings categories must never affect org B's row or be visible via any cache; a brand-new org with no `OrganizationSettings` row falls back to bundled safe defaults, never another org's settings, never a crash. See design doc §7a.5 and §8. |
| ORG-44 | `scopedStorage()` helper — structural per-org storage-key isolation | P1 | ❌ Not started | New `src/server/tenancy/scopedStorage.ts`, mirroring `scopedRepository`: every object key is always resolved server-side as `orgs/{organizationId}/...` from `session.organizationId`, never accepted as or influenced by caller input; path-traversal validated. See design doc §3a.2. |
| ORG-45 | Migrate every existing storage call site onto `scopedStorage()` | P1 | ❌ Not started | Same incremental, shrink-only-allowlist pattern as `ORG-05`'s Prisma migration — applied to `src/lib/storage/`/`src/services/storage/` instead of Prisma. |
| ORG-46 | Tests — cross-org storage-key isolation | P1 | ❌ Not started | Org A's session/credentials must never read, list, or write any key under another org's prefix — attempted both via a directly constructed key and via path-traversal tricks (`..` segments, etc.). See design doc §3a.4. |
| ORG-47 | Self-service "Delete My Data" | P1 | ❌ Not started | A user deletes all data they personally own (own `ImportLog`/`DashboardSnapshot`/submitted `UserAddRequest`/addressed `Notification` rows) without affecting any other user's data or their own login. Typed-confirmation required; no grace-period undo (small, user-initiated blast radius). Account itself is not deleted — that's explicitly out of scope. See design doc §11.1. |
| ORG-48 | Audit event for self-service data deletion | P1 | ❌ Not started | Writes `user_self_delete_data` `AuditEvent` before the rows are gone, mirroring the org-deletion final-audit-write pattern (`ORG-17`). |
| ORG-49 | `UserStorageSettings` model — per-user storage override | P1 | ❌ Not started | New 1:1-with-`User` model; a user's own storage config (if `enabled`) takes precedence over their org's default (`OrganizationSettings.storageSettingsJson`) for that user's own uploads only. See design doc §11.2. |
| ORG-50 | Org admin switch to disable per-user storage override | P1 | ❌ Not started | `OrganizationSettings.allowUserStorageOverride` (default `true`) — lets an org admin mandate one storage location org-wide for compliance reasons. Without this, an org admin has no way to enforce "all our data stays in our bucket." |
| ORG-51 | `DataShareGrant` model — user-to-user sharing by explicit permission | P1 | ❌ Not started | A user grants another specific user **in the same organization only** view access to one specific resource (`importLog`/`dashboardSnapshot`) — no blanket "share everything" grant in v1, no cross-org sharing ever. Revocable; `revokedAt` set, never hard-deleted. See design doc §11.3. |
| ORG-52 | "Active shares" visibility for the data owner | P1 | ❌ Not started | The owner can see and revoke every grant they've made — sharing must never be a silent, forgotten state. |
| ORG-53 | Enforce `DataShareGrant` in the read path | P1 | ❌ Not started | `scopedRepository`'s read methods check `organizationId` and, for a resource the caller doesn't already own/role-see, an active matching grant — not a separate, easy-to-forget parallel check. Read-only, additive, non-transitive (a grantee cannot re-share). |
| ORG-54 | Tests — individual privacy, sharing, deletion | P1 | ❌ Not started | Deleting user A's data never touches user B's rows even via shared org-level entities; a revoked grant denies access on the very next request (no caching staleness); a same-org grant (`isCrossOrg: false`) is rejected server-side if the grantee is actually in a different org; `UserStorageSettings` is ignored when `allowUserStorageOverride` is `false`. See design doc §11.5. |
| ORG-55 | `CrossOrgConnection` model — mutual-consent gate before any cross-org sharing | P1 | ❌ Not started | A user invites another by email (no cross-org directory/search — that would itself leak org existence); `status: pending\|accepted\|rejected\|revoked`. No `DataShareGrant.isCrossOrg` can exist without an `accepted` connection between the same two users. See design doc §11.4. |
| ORG-56 | Enumeration-safe cross-org invite flow | P1 | ❌ Not started | Same discipline as the domain-first login (§6): inviting an email with no matching account produces the same response as inviting one that hasn't yet responded — never confirms or denies an account's existence. |
| ORG-57 | `DataShareGrant.isCrossOrg` restricted to `resourceType: "dashboardSnapshot"` only, unconditionally | P1 | ❌ Not started | **Confirmed with the user 2026-06-27: aggregated results only, never raw data, no admin override of this specific constraint.** A cross-org grant with `resourceType: "importLog"` is rejected server-side, full stop — this is the one rule in the whole cross-org feature that is not configurable by anyone, because it's what makes the exception safe to grant at all. |
| ORG-58 | Revoking a `CrossOrgConnection` immediately invalidates dependent grants | P1 | ❌ Not started | The read-path check must verify the connection is still `accepted` at read time, not just that the `DataShareGrant` itself lacks a `revokedAt` — a revoked connection can't leave orphaned working grants. |
| ORG-59 | Tests — cross-org peer sharing | P1 | ❌ Not started | Cross-org grant with `resourceType: "importLog"` rejected unconditionally; invite enumeration-safety; revoked connection invalidates grants on the very next read; neither side can force-accept or bypass the connection request alone. Ship behind its own feature flag (CLAUDE.md §37); review exactly which `DashboardSnapshot.metricsJson` fields are exposed before launch — a user-typed snapshot name could itself be identifying even though the metrics are aggregated. See design doc §11.4/§11.5. |

---

## 20b. P2 — Export to Sheet/PDF and Client Sharing (Future Roadmap — Not Started)

Do not implement until a P2 design doc defines exactly which visuals (which charts/graphs, in what form) belong in the sheet export vs. the PDF export, and how the no-login client share page is isolated from the authenticated app.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| EXPORT-04 | Define export visual catalog | P2 | ❌ Not started | Design-doc step: enumerate which charts/graphs/tables are included per export type (sheet vs. PDF) before any code — avoids ad hoc per-page exceptions. Builds on existing `FUT-EXCEL`-style export (Smart Excel export, Section 12 F4 cluster) rather than duplicating it. |
| EXPORT-05 | Export dashboard data + charts to Excel/Sheet | P2 | ❌ Not started | Native Excel charts or embedded chart images per EXPORT-04's catalog, alongside existing data sheets. |
| EXPORT-06 | Export dashboard data + charts to PDF | P2 | ❌ Not started | Print/offline-friendly PDF with the same visual catalog as EXPORT-04; accessible text equivalent per CLAUDE.md §34. |
| SHARE-01 | Generate a static, shareable client-facing HTML report | P2 | ❌ Not started | Snapshot of approved visuals/data at generation time — not a live view into the app. |
| SHARE-02 | Email delivery of the shared report to a client | P2 | ❌ Not started | Send the SHARE-01 report link or HTML via email; no app login required to view it. |
| SHARE-03 | Shared report is fully isolated from the authenticated app | P2 | ❌ Not started | Shared page must not expose navigation, other org data, or any path back into the authenticated app — separate route/surface, no session required, no app access of any kind. |
| SHARE-04 | Share-link expiration and revocation | P2 | ❌ Not started | Time-boxed and/or manually revocable links; expired/revoked links must fail closed. |
| SHARE-05 | Security review of the share surface | P2 | ❌ Not started | Confirm the shared HTML cannot leak other orgs' data, cannot be used to probe the authenticated API, and contains no secrets/session tokens. |
| SHARE-06 | Tests — export correctness and share-link access control | P2 | ❌ Not started | Export content matches source data; expired/revoked/forged share links are denied; shared page never reaches authenticated routes. |
| EXPORT-07 | Update all related product docs | P2 | ❌ Not started | SRS, USE_CASES/SCENARIOS/USER_JOURNEYS for export + share flows, TEST_CASES, DEVELOPER_GUIDE, RELEASE_NOTES, TODO-List.md. |

---

## 20c. P3/P4 — Companion Mobile App (Future Roadmap — Not Started)

A separate, deliberately *light* native/PWA mobile app — not a port of the full web app. Its job is to surface insights from data already computed by the web app, not to do new computation on-device. All heavy lifting (Jira import/parsing, metric calculation, forecasting, coaching insights, retro analysis) stays server-side on the web app; the mobile app is a read-mostly client. Do not start until `MOBILE-01`–`09` (mobile-first web redesign) and `ORG-01`–`22` (multi-tenant org/data isolation) are substantially done — a mobile app built before the web app is mobile-first or before tenant isolation is solid would just relocate both problems.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| MOBILEAPP-01 | Define the mobile app's scope as "insights only" | P3 | ❌ Not started | Design-doc step: explicitly enumerate what the mobile app shows (e.g. dashboard summary, coaching insights, forecast status, notifications) vs. what stays web-only (file upload, admin console, retro upload, Jira connection setup) — prevents scope creep into a full app port. |
| MOBILEAPP-02 | Cached/pre-computed data contract | P3 | ❌ Not started | Mobile app reads a pre-computed insights payload the web backend already produces (existing `DashboardMetrics`, coaching/forecast view models) — no new calculation logic duplicated on-device, per CLAUDE.md §29's single-source-of-truth rule. |
| MOBILEAPP-03 | Per-user data caching and freshness | P3 | ❌ Not started | Define cache TTL/staleness indicator so the user knows when they're viewing cached vs. fresh data; respect the tenant isolation guarantees from `ORG-04`/`ORG-05` — cached data must never leak across orgs or across a logged-out/different-user session on a shared device. |
| MOBILEAPP-04 | Platform choice | P3 | ❌ Not started | Design-doc step: PWA (reuses existing Next.js app, lowest cost) vs. React Native/native (better device integration, push notifications) — pick one with a stated reason, not both. |
| MOBILEAPP-05 | Offline/poor-connectivity behavior | P3 | ❌ Not started | Show last-cached insights with a clear "offline/stale" indicator rather than a blank error screen — this is the actual value proposition of a "light, cached-data" app. |
| MOBILEAPP-06 | Push notifications (optional, P4) | P4 | ❌ Not started | Only if platform choice (MOBILEAPP-04) supports it natively; ties into the existing in-app `Notification` model rather than a separate notification system. |
| MOBILEAPP-07 | Security review | P3 | ❌ Not started | Mobile app must authenticate the same way as the web app (no parallel/weaker auth path), must not cache credentials insecurely on-device, and must respect the same authorization/tenant boundaries as the web API it reads from. |
| MOBILEAPP-08 | Tests and docs | P3 | ❌ Not started | Update SRS/BRD with the mobile app's explicit scope boundary, DEVELOPER_GUIDE with the data-contract/caching approach, RELEASE_NOTES, TODO-List.md. |

---

## 21. P4 — Future Communication / Governance Layer

Plan only unless explicitly approved.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| P4-01 | Full Admin & System Notification Center | P4 | 📄 Planning only | In-app admin-to-user, system-to-admin, error/warning/threat notifications. |
| P4-02 | Maintenance Mode | P4 | 📄 Planning only | Admin-controlled maintenance screen, middleware/503 behavior, audit logs, user-facing message. |
| P4-03 | Browser push notifications | P4 | ❌ Planned | Not part of initial User Add-Member Request workflow. |
| P4-04 | Email notification channel | P4 | ❌ Planned | Separate from P0 email access notification if required. |
| P4-05 | Slack/Teams notification channels | P4 | ❌ Planned | Future integration only. |
| P4-06 | Admin error/warning/threat notification strategy | P4 | 📄 Planning only | Notify admin clearly about failures, threats, warnings, and system issues. |

---

## 22. Required Test Coverage

### P0 Reconciliation / Docs

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-P0-01 | Validate documentation status consistency if script exists | P0 | ❌ Not started | Optional automation, required manual check otherwise. |
| TEST-P0-02 | Validate test count reporting consistency | P0 | 🔍 Needs verification | Docs must all show same current test count. |
| TEST-P0-03 | Validate product docs impact matrix is produced | P0 | ❌ Not started | Required before push. |

### Backend Gateway Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-GW-01 | Safe configured endpoint allowed | P1 | ✅ Done | `TC-GW-05` (`gateway.test.ts`). |
| TEST-GW-02 | Unsafe protocol blocked | P1 | ✅ Done | `TC-GW-02` (`gateway.test.ts`). |
| TEST-GW-03 | Disallowed host blocked | P1 | ✅ Done | `TC-GW-01` (`gateway.test.ts`). |
| TEST-GW-04 | Private/internal IP blocked in production | P1 | ✅ Done | `TC-GW-03` (`gateway.test.ts`). |
| TEST-GW-05 | Timeout applied | P1 | ✅ Done | Covered via retry/abort flow in `TC-GW-08`, `TC-GW-20`. |
| TEST-GW-06 | Retry policy applied for retryable errors | P1 | ✅ Done | `TC-GW-06`, `TC-GW-19`, `TC-GW-20` (`gateway.test.ts`). |
| TEST-GW-07 | Non-retryable errors are not retried | P1 | ✅ Done | `TC-GW-06`, `TC-GW-21` (`gateway.test.ts`). |
| TEST-GW-08 | Secrets redacted in logs | P1 | ✅ Done | `TC-GW-10`, `TC-GW-12` (`gateway.test.ts`). |
| TEST-GW-09 | Audit event created | P1 | ✅ Done | `TC-GW-12` — JSONL record written with all observability fields (`gateway.test.ts`). |
| TEST-GW-10 | Consistent `GatewayResult` returned | P1 | ✅ Done | `TC-GW-18`, `TC-GW-19`, `TC-GW-20`, `TC-GW-21` (`gateway.test.ts`). |
| TEST-GW-11 | Provider registry supported | P1 | ✅ Done | `TC-GW-13`, `TC-GW-14`, `TC-GW-15`, `TC-GW-15b` (`gateway.test.ts`). |
| TEST-GW-12 | No secrets exposed to client | P1 | ✅ Done | `src/server/gateway/` is server-only (no client imports); verified by module location — `TC-GW-10`/`TC-GW-12` verify redaction at log boundary. |

### User Add-Member Request Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-REQ-01 | Anonymous user cannot submit request | P1 | ✅ Done | Auth guard. Automated as `TC-REQ-02` (`src/__tests__/userAddRequests.test.ts`). |
| TEST-REQ-02 | Logged-in user submits request | P1 | ✅ Done | Happy path. Automated as `TC-REQ-01`. |
| TEST-REQ-03 | Invalid email rejected | P1 | ✅ Done (2026-06-27) | Was a real gap: email-format validation existed only client-side in `RequestAddMemberModal.tsx`, so a direct API call could submit a malformed email. Added server-side enforcement (`EMAIL_FORMAT` regex in `app/api/user-add-requests/route.ts`) and automated as new `TC-REQ-19`. |
| TEST-REQ-04 | Missing reason rejected | P1 | ✅ Done | Validation. Automated as `TC-REQ-05` (covers all four required fields). |
| TEST-REQ-05 | Duplicate email prevented/warned | P1 | ✅ Done | No duplicate accounts. Automated as `TC-REQ-03` (existing account) and `TC-REQ-04` (pending request for same email). |
| TEST-REQ-06 | Admin sees pending request | P1 | ✅ Done | Queue/badge/card. Automated as `TC-REQ-08`. |
| TEST-REQ-07 | Admin accepts request | P1 | ✅ Done | Creates user and updates status. Automated as `TC-REQ-10`. |
| TEST-REQ-08 | Admin rejects request | P1 | ✅ Done | Does not create user. Automated as `TC-REQ-13`. |
| TEST-REQ-09 | Requester gets accepted notification | P1 | ✅ Done | In-app notification. Asserted inside `TC-REQ-10` (`notification.create` called with `user_add_request_accepted`). |
| TEST-REQ-10 | Requester gets rejected notification | P1 | ✅ Done | In-app notification. Asserted inside `TC-REQ-13` (`user_add_request_rejected`). |
| TEST-REQ-11 | High-privilege role warning | P1 | ✅ Done (2026-06-27) | Was a real gap: the ≥20-character justification rule for `admin`/`c_level` requests existed only client-side. Added shared `isHighPrivilegeRole()` (`src/lib/roles.ts`, now used by both the modal and the API) plus server-side enforcement, automated as new `TC-REQ-20` (rejected) and `TC-REQ-20b` (accepted). |
| TEST-REQ-12 | Two admins cannot double-accept same request | P1 | 🔍 Partial | `TC-REQ-12` proves the *second* accept attempt is rejected once `status` is no longer `pending` (state-based guard) — this is correct behavior, but there is no automated test simulating two concurrent in-flight requests racing against the same DB row (true concurrency test would need an integration test against a real Postgres/SQLite connection, not a mocked Prisma client). Remaining gap: a real concurrency/integration test once `FUT-POSTGRES-01` lands. |
| TEST-REQ-13 | Audit event created | P1 | ✅ Done | Submit/accept/reject. Automated as `TC-REQ-01` (submit, newly asserted 2026-06-27), `TC-REQ-10` (accept), `TC-REQ-13` (reject). |
| TEST-REQ-14 | Mobile layout works | P1 | ❌ Not started | Responsive UI — genuinely untested. Requires a visual/E2E (Playwright) pass on `RequestAddMemberModal.tsx`/`UserAddRequestsPanel.tsx` at mobile breakpoints; not coverable by Jest unit tests. |

### Role-Based Coaching Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-RBC-01 | Suggestions generated per role | P1 | ✅ Done (2026-06-23) | Scrum Master, PO, EM, DM, C-level, Team Lead, Admin. Covered by `TC-RBC-01a–h` in `src/__tests__/roleBasedCoaching.test.ts` (see RBC-18). |
| TEST-RBC-02 | Suggestions differ by role | P1 | ✅ Done (2026-06-23) | Role responsibility matters. Covered by `TC-RBC-01a–h` role-mapping table assertions. |
| TEST-RBC-03 | Suggestions include metric evidence | P1 | ✅ Done (2026-06-23) | No generic advice. Covered by `TC-RBC-02`. |
| TEST-RBC-04 | Weak points identified | P1 | ✅ Done (2026-06-23) | Evidence-based. Covered by `TC-RBC-03`. |
| TEST-RBC-05 | Ceremony advice included | P1 | ✅ Done (2026-06-23) | Daily/refinement/planning/review/retro. Covered by `TC-RBC-05` (verifies identical ceremony advice embedded per RBC-10–14). |
| TEST-RBC-06 | Prevention advice included | P1 | ✅ Done (2026-06-23) | What could have prevented situation. Covered by `TC-RBC-06`. |
| TEST-RBC-07 | Next-sprint suggestions included | P1 | ✅ Done (2026-06-23) | Actionable. Covered by `TC-RBC-07`. |
| TEST-RBC-08 | Low data quality reduces confidence | P1 | ✅ Done (2026-06-23) | Confidence logic. Covered by `TC-RBC-08` (×0.75/×0.5 downgrade per RBC-17). |
| TEST-RBC-09 | Missing metrics produce safe fallback | P1 | ✅ Done (2026-06-23) | No hallucinated certainty. Covered by `TC-RBC-09` (all-zero sample sizes → `band: 'N/A'`). |

### Retrospective Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-RETRO-01 | Retro file upload works | P2 | ✅ Done (2026-06-26) | CSV/XLSX automated (`TC-RETRO-08`/`08b`); Markdown/plain text automated (`TC-RETRO-12`/`13`). |
| TEST-RETRO-02 | Invalid retro file handled | P2 | ✅ Done (2026-06-26) | Missing Sprint Name column → 422 (`TC-RETRO-09`). |
| TEST-RETRO-03 | Retrospective template downloads successfully | P2 | ✅ Done (2026-06-26) | `.xlsx` is now the primary download; `.csv` remains a secondary link. ⬜ Manual click-test, no automated download-trigger test (browser API). |
| TEST-RETRO-04 | Template includes expected columns | P2 | ✅ Done (2026-06-26) | ⬜ Manual — verify `Retrospective_Template.xlsx`'s "Retrospective" sheet header row. |
| TEST-RETRO-05 | Template includes Instructions sheet | P2 | ✅ Done (2026-06-26) | ⬜ Manual — verify the "Instructions" sheet content. |
| TEST-RETRO-06 | Template includes example rows | P2 | ✅ Done (2026-06-26) | ⬜ Manual — verify the 4 example rows (carryover, late blocker, scope change). |
| TEST-RETRO-07 | Completed template upload works | P2 | ✅ Done (2026-06-26) | End-to-end grouping verified (`TC-RETRO-08`/`08b`). "Import" is really "preview" — see RETRO-08/15 scope note. |
| TEST-RETRO-08 | Upload preview works | P2 | ✅ Done (2026-06-26) | `upload-insights` view. ⬜ Manual UI verification (no E2E/Playwright test added — see RETRO-38 scope note). |
| TEST-RETRO-09 | Column mapping works when names differ | P2 | ✅ Done (2026-06-26, scoped to alias table) | Covered by `HEADER_ALIASES`, not an interactive mapping UI — see RETRO-09 status row. |
| TEST-RETRO-10 | In-app retrospective form opens | P2 | ✅ Done 2026-06-10 | Pre-existing — `TC-RETRO-01`/`02` (manual). |
| TEST-RETRO-11 | In-app retrospective form validates required fields | P2 | ✅ Done 2026-06-10 | Pre-existing — `TC-RETRO-02` (manual); also covered for uploads by `TC-RETRO-11` (automated). |
| TEST-RETRO-12 | Draft save works if persistence exists | P2 | ❌ Deferred (2026-06-26) | Persistence (RETRO-15/30) is deferred — nothing to test. |
| TEST-RETRO-13 | Themes extracted | P2 | ✅ Done (2026-06-26) | `TC-RETRO-14` (automated). |
| TEST-RETRO-14 | Action items extracted | P2 | ✅ Done (2026-06-26) | Covered by `TC-RETRO-08` (grouping) and pre-existing form tests. |
| TEST-RETRO-15 | Missing owner identified | P2 | ✅ Done (2026-06-26) | `TC-RETRO-15` (automated). |
| TEST-RETRO-16 | Missing due date identified | P2 | ✅ Done (2026-06-26) | Same test as TEST-RETRO-15 — `TC-RETRO-15` asserts both gaps. |
| TEST-RETRO-17 | Duplicate action items flagged | P2 | ✅ Done (2026-06-26) | `TC-RETRO-16` (automated). |
| TEST-RETRO-18 | Suggested TODO created | P2 | ✅ Done (2026-06-26) | `nextSprintSuggestions` — `TC-RETRO-17` (automated). |
| TEST-RETRO-19 | Next sprint suggestions generated | P2 | ✅ Done (2026-06-26) | Same engine/test as TEST-RETRO-18 — `TC-RETRO-17`; ceremony recommendations covered by the same function. |
| TEST-RETRO-20 | Retro insights linked to metrics when possible | P2 | ❌ Deferred (2026-06-26) | RETRO-14 (metric-linking) is explicitly deferred — nothing to test. |

### Forecasting Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-FCAST-01 | Forecast calculates on-track / at-risk / off-track | P2 | ✅ Done (2026-06-27) | `TC-FCAST-03/04/06` (`src/__tests__/forecastEngine.test.ts`). |
| TEST-FCAST-02 | Forecast handles insufficient data | P2 | ✅ Done (2026-06-27) | `TC-FCAST-02/13`. |
| TEST-FCAST-03 | Forecast uses current throughput | P2 | ✅ Done (2026-06-27) | `TC-FCAST-07`. Points-per-sprint throughput was not separately tested — `avgThroughput` is issue-count-based only, same as the pre-existing implementation. |
| TEST-FCAST-04 | Forecast compares required vs current throughput | P2 | ✅ Done (2026-06-27) | Covered at the UI level by the new "Throughput: Required vs. Current" chart (FCAST-14); no dedicated engine-level test since the comparison is presentation-only arithmetic (`remainingIssues / 6`) over already-tested `avgThroughput`/`remainingIssues` fields. |
| TEST-FCAST-05 | Forecast shows confidence | P2 | ✅ Done (2026-06-27) | `TC-FCAST-01/02/08`. |
| TEST-FCAST-06 | Forecast explains confidence | P2 | ✅ Done (2026-06-27) | `TC-FCAST-08` asserts `confidenceReason` content; `TC-FCAST-02` asserts the insufficient-data reason. |
| TEST-FCAST-07 | Forecast chart data is generated | P2 | ✅ Done (2026-06-27) | `TC-FCAST-11/12` (`scopeTrend`). `sprintPoints` (burn-up chart data) was not re-tested — unchanged by this pass, pre-existing manual-only coverage (`TC-FCAST-05`). |
| TEST-FCAST-08 | Adjustment suggestions are generated | P2 | ✅ Done (2026-06-27, scoped to scope/blockers/data-quality) | `TC-FCAST-10` (scope). Capacity/WIP/splitting/refinement rules were not added — `DashboardMetrics` has no forecast-relevant WIP-limit or refinement-stage signal today; see FCAST-20/21 status notes. |
| TEST-FCAST-09 | Data Quality Score affects forecast confidence | P2 | ✅ Done (2026-06-27) | `TC-FCAST-08`. |

---

## 23. Commit / Push Definition of Done

A commit or push is allowed only when all rows below are satisfied.

| ID | Task | Priority | Status |
|---|---|---:|---|
| DOD-01 | Code changes are complete | P0 | ✅ Permanent |
| DOD-02 | Related tests are added or updated | P0 | ✅ Permanent |
| DOD-03 | `npm run lint` passes | P0 | ✅ Permanent |
| DOD-04 | `npm test` passes | P0 | ✅ Permanent |
| DOD-05 | `npm run build` passes | P0 | ✅ Permanent |
| DOD-06 | `TODO-List.md` is updated | P0 | ✅ Permanent |
| DOD-07 | `product/RELEASE_NOTES.md` is updated | P0 | ✅ Permanent |
| DOD-08 | Every file inside `product/` is reviewed | P0 | ✅ Permanent |
| DOD-09 | Every affected product document is updated | P0 | ✅ Permanent |
| DOD-10 | Every unaffected product document is marked “Reviewed — No update required” | P0 | ❌ Not started |
| DOD-11 | Documentation impact matrix is complete | P0 | ❌ Not started |
| DOD-12 | No product document is behind code | P0 | ✅ Permanent |
| DOD-13 | Traceability matrix is updated for implemented features | P0 | ❌ Not started |
| DOD-14 | Required output after Claude pass is provided | P0 | ❌ Not started |

---

## 24. Final Execution Order

Follow this order exactly.

| Step | Task | Priority | Status |
|---:|---|---:|---|
| 1 | Check current branch | P0 | 🔍 Needs verification |
| 2 | Check uncommitted changes | P0 | 🔍 Needs verification |
| 3 | Create safe baseline commit if needed | P0 | 🔍 Needs verification |
| 4 | Complete P0 reconciliation pass | P0 | 🔍 Needs verification |
| 5 | Update SRS: P1.1/P1.2/P1.3 Done/Verified | P0 | 🔍 Needs verification |
| 6 | Update Use Cases intro/scope to current v4.2.x | P0 | 🔍 Needs verification |
| 7 | Reconcile Storage status across all docs | P0 | 🔍 Needs verification |
| 8 | Update TODO-List.md to current v4.2.2 reality | P0 | ✅ Done — this file |
| 9 | Normalize test count | P0 | 🔍 Needs verification |
| 10 | Review all changed code | P0 | 🔍 Needs verification |
| 11 | Review every file inside `product/` | P0 | ❌ Not started |
| 12 | Update affected product documents | P0 | 🔍 Needs verification |
| 13 | Mark unaffected product documents as reviewed | P0 | ❌ Not started |
| 14 | Produce product documentation impact matrix | P0 | ❌ Not started |
| 15 | Run lint, tests, and build | P0 | 🔍 Needs verification |
| 16 | Update Release Notes with verification result | P0 | 🔍 Needs verification |
| 17 | Update TODO with final status | P0 | ✅ Done — this file created |
| 18 | Decide if project can be marked Release Candidate | P0 | ⚠️ Conflict / Needs verification |
| 19 | Push only if no product file is behind code | P0 | 🔍 Needs verification | Updated 2026-06-08: re-framed from a hard "Blocked until matrix is done" to a per-push verification check (does this specific push leave any product file behind code?), consistent with the balanced/parallel P0↔P1-P4 sequencing policy — see Section 1. |
| 20 | Implement Backend Integration Gateway in balance with ongoing P0 work | P1 | ❌ Not started |
| 21 | Add/update tests for Backend Gateway | P1 | ❌ Not started |
| 22 | Review every file inside `product/` again | P0/P1 | ❌ Not started |
| 23 | Update all docs for Backend Gateway | P1 | ❌ Not started |
| 24 | Produce product documentation impact matrix again | P0/P1 | ❌ Not started |
| 25 | Run lint, tests, and build again | P1 | ❌ Not started |
| 26 | Implement User Add-Member Request Workflow | P1 | ❌ Not started |
| 27 | Add/update tests for request workflow | P1 | ❌ Not started |
| 28 | Review every file inside `product/` again | P0/P1 | ❌ Not started |
| 29 | Update all docs for request workflow | P1 | ❌ Not started |
| 30 | Produce product documentation impact matrix again | P0/P1 | ❌ Not started |
| 31 | Implement Role-Based Delivery Coaching Insights | P1 | ❌ Not started |
| 32 | Add/update tests for role-based coaching | P1 | ❌ Not started |
| 33 | Review every file inside `product/` again | P0/P1 | ❌ Not started |
| 34 | Update all docs for role-based coaching | P1 | ❌ Not started |
| 35 | Produce product documentation impact matrix again | P0/P1 | ❌ Not started |
| 36 | Implement Retrospective Upload, Template Download, In-App Form, and Improvement Backlog | P2 | ❌ Not started |
| 37 | Add/update tests for retrospective upload, template download, and in-app form | P2 | ❌ Not started |
| 38 | Review every file inside `product/` again | P0/P2 | ❌ Not started |
| 39 | Update all docs for retrospective features | P2 | ❌ Not started |
| 40 | Produce product documentation impact matrix again | P0/P2 | ❌ Not started |
| 41 | Implement Forecasting Progress and Delivery Adjustment Report | P2 | ❌ Not started |
| 42 | Add/update tests for forecasting | P2 | ❌ Not started |
| 43 | Review every file inside `product/` again | P0/P2 | ❌ Not started |
| 44 | Update all docs for forecasting | P2 | ❌ Not started |
| 45 | Produce product documentation impact matrix again | P0/P2 | ❌ Not started |
| 46 | Reconcile remaining TODO items and mark true status | P0 | 🔍 Ongoing |
| 47 | Stop and report final status, risks, and next recommended development item | P0 | ✅ Permanent |

---

## 25. Do Not Do

| ID | Rule | Priority | Status |
|---|---|---:|---|
| DND-01 | Do not start Jira API full integration yet | P0 | ✅ Permanent |
| DND-02 | Do not start Jira write-back yet | P0 | ✅ Permanent |
| DND-03 | Do not start browser push/email/Slack/Teams notifications yet | P0 | ✅ Permanent |
| DND-04 | Do not start Maintenance Mode yet | P0 | ✅ Permanent |
| DND-05 | Do not start PostgreSQL migration yet | P0 | ✅ Permanent |
| DND-06 | Do not start full CI/CD automation yet | P0 | ✅ Permanent |
| DND-07 | Do not expose secrets in logs | P0 | ✅ Permanent |
| DND-08 | Do not allow frontend to call external providers directly | P0 | ✅ Permanent |
| DND-09 | Do not allow non-admin users to create users directly | P0 | ✅ Permanent |
| DND-10 | Do not generate generic Agile advice without metric evidence | P0 | ✅ Permanent |
| DND-11 | Do not mix Jira upload and retrospective upload without clear labels | P0 | ✅ Permanent |
| DND-12 | Do not mark release candidate before lint/test/build pass | P0 | ✅ Permanent |
| DND-13 | Do not leave SRS, Use Cases, or Test Cases behind code | P0 | ✅ Permanent |
| DND-14 | Do not leave TODO as old v3/v4.0 if app is now v4.2.2 | P0 | ✅ Permanent |
| DND-15 | Do not push if any file in `product/` is behind code | P0 | ✅ Permanent |
| DND-16 | Do not push if product documentation impact matrix is incomplete | P0 | ✅ Permanent |
| DND-17 | Do not over-claim future features in patent docs | P0/P2 | ✅ Permanent |

---

## 26. Immediate Next Step

| ID | Task | Priority | Status | Reason |
|---|---|---:|---|---|
| NEXT-01 | Complete `TRACE-01` full traceability matrix | P0 | ✅ Done — clusters #1 (F3-14/15/16), #2 (F2-05/06/07/09/11/12/13), #3 (F4-05/06/08), #4 (F1-07/08), #5 (UX-02/03/05/11/13), #6 (FR↔UC ID-collision cleanup + Ownership Index), and UX-14 ALL fully closed 2026-06-08 incl. 38 automated tests (14 + TC-AC-01–03 + TC-FF-01–06 + TC-X-09a–13b + TC-T-11 + TC-CH-01–03 + TC-X-14) — TRACE-01 fully closed, no longer a blocker | TRACE-01 is closed — the path is now clear for new P1/P2 development. |
| NEXT-02 | Complete `TRACE-02` full app coverage validation | P0 | ✅ Done — all 22 `COVER-XX` rows closed 2026-06-08 via survey-first methodology (2 stale-framing false positives re-verified, 2 genuine gaps closed with new FR-312/UC-094/`mergeIssues.test.ts` and a 36-row API route inventory in SRS §8.1, 1 TC-ID collision cluster resolved with 7 new tests, 1 error-state gap closed with `snapshotLoadErrors.test.ts`, 5 roadmap items confirmed correctly-scoped per explicit user decision) — TRACE-02 fully closed, no longer a blocker | TRACE-02 is closed — see Section 8 for per-area notes and `RELEASE_NOTES.md` for the full write-up. |
| NEXT-03 | Produce actual product documentation impact matrix | P0 | ✅ Done 2026-06-09 | Filled GW-01–GW-25 matrix added to Section 6 (below cluster #6); TEST_CASES.md §9.49 gateway test section added; all 16 product files reviewed — 4 updated (SRS, USE_CASES, DEVELOPER_GUIDE, RELEASE_NOTES) + TEST_CASES; 11 confirmed no-update-required. |
| NEXT-04 | Verify storage docs and open storage gates | P0 | ✅ Done (2026-06-23) | All 11 `STORAGE-DEC-01–11` rows (Section 19, above) closed via direct code audit (not assumed): storage is genuinely implemented (4 real providers, typed interface, factory, 4 API routes), credential security confirmed (secrets never reach the browser), and the 3 real gaps found were fixed — `STORAGE-DEC-09` (visible source details: last-fetched + fallback reason added to `DataSourceBadge`), `STORAGE-DEC-10` (new "Latest Metrics & Cloud Sync" diagnostics section: snapshot availability/age + cloud backup freshness + last-fetched/pushed/pending-push), `STORAGE-DEC-11` (Cloud Storage admin panel now blocks on settings load instead of flashing the `'local'` default). 2 new tests (`TC-SD-09/10`); full suite 669/70 passing; lint/typecheck clean (pre-existing warnings unchanged). Note: this row's original text referenced a dangling `JIRA-GATE-07` with no corresponding gate defined anywhere in this file — confirmed it was a stale/mistaken reference (the real gates were `JIRA-GATE-03/04/05`, now `STORAGE-DEC-09/10/11`); no action needed since nothing maps to `-07`. |
| NEXT-05 | Re-run lint/test/build and update normalized test count | P0 | ✅ Verified 2026-06-07 | Test count is now 492 tests / 52 suites (was 469/48 — 23 new tests across 4 new files: `members.test.ts`, `middleware.test.ts`, `changePassword.test.ts`, `adminSettingsConsole.test.ts`, plus 2 added to `adminUsers.test.ts`). Lint clean (pre-existing warnings only); build compiles successfully. |
| NEXT-06 | Begin HARD-01 Backend Integration Gateway in balance with remaining P0 items | P1 | ✅ Done 2026-06-08 | Backend Integration Gateway foundation closed — `GW-01`–`GW-25` ✅ Done (see Section 14). `src/server/gateway/` module suite, 23 tests, FR-313, DEVELOPER_GUIDE architecture section, RELEASE_NOTES v4.3 entry. Test suite: 550/61. `NEXT-03` (doc impact matrix) closed 2026-06-09 — all P0 items in Section 26 are now ✅ Done. |

---

## 27. Release Status Recommendation

Current uploaded TODO says: `v4.2.2 — Release Candidate` and “P0 reconciliation pass complete.”

Recommended corrected status:

> `v4.3 — Release Candidate / P0 Gate Fully Closed (updated 2026-06-09)`  
> Lint/test/build are passing (550 tests / 61 suites). The full traceability matrix (`TRACE-01`), full app coverage validation (`TRACE-02`), and the filled product documentation impact matrix (`NEXT-03`) are all ✅ Done — all three P0 documentation gates are now closed. The Backend Integration Gateway Foundation (`GW-01–GW-25`) is shipped and fully documented. `NEXT-04` (storage gates) and the P1–P4 feature roadmap (USERREQ, RBC, RETRO, FCAST) remain open as forward work items, not blockers.

---

## 28. Implementation Plan v2.0 — Self-Hosted AI, Jira Integration, and Delivery Intelligence (Future Roadmap — Not Started)

**Status:** ❌ Not started — reference plan only, added 2026-06-23. Per `DND-01`/`DND-02` (Section 25), full Jira API integration and Jira write-back remain explicitly out of scope until those Do-Not-Do rules are lifted. This plan supersedes prior informal AI/Jira notes once any phase below is actually started — at that point, open dedicated `JIRA-AI-XX` rows in the relevant section and track status there instead of in this raw block.

> ⚠ **Truncation notice:** The source document pasted by the user was cut off mid-Phase-1 (ends at "`[ ] Fr`" inside the Phase 1 deliverables checklist, Section 23). Everything from the rest of Phase 1 onward (Phases 2–end, plus any sections after "Delivery Phases") is **missing** from this record. Re-paste the remainder when available so this section can be completed.

**Classification:** Confidential — Ali Abu Ras / Ali Delivery Intelligence
**Plan version:** 2.0 — Revamped with architectural concerns and mitigations
**Product:** Delivery Clarity · **Brand:** Ali Delivery Intelligence
**Slogan:** From messy boards to measurable delivery confidence.

### 28.1 Product positioning

Delivery Clarity is a private, self-hosted Jira delivery-intelligence platform. Official positioning: *"Delivery Clarity analyses Jira data through secure live Jira synchronisation or zero-credential file uploads, while keeping all calculations, intelligence, reporting, and AI processing under complete customer control."* Do not describe Delivery Clarity as export-only — both modes (Jira Export Mode, Connected Jira Mode) are first-class citizens.

### 28.2 Architectural concerns and mandatory mitigations (read before any implementation)

| # | Concern | Risk | Mandatory mitigation |
|---|---|---|---|
| CONCERN-01 | Phase sequencing underestimates Jira complexity | Phases 2–3 (9–17 days) likely run 2–3× over in practice; if AI (Phase 4) is gated on Jira sync, the AI roadmap stalls | Build AI evidence builder against a mock canonical dataset in Phase 1; run AI development in parallel with Jira sync, not after it; Phase 4 must be startable with export-only data; add a 5-day risk buffer to Phases 2–3 |
| CONCERN-02 | Qwen3-8B underpowered for production Arabic | Weak Arabic grammar under domain prompts damages customer trust; not fixable by prompt engineering alone | Default model `Qwen2.5-14B-Instruct` (Q4_K_M, ~9GB RAM); Arabic-optimised alternative `aya-23-8B`/`aya-expanse-8B`; make model selection an admin setting, not hardcoded; native Arabic speaker must review 20 AI outputs before Phase 5 sign-off |
| CONCERN-03 | Freshness labels (`live`/`recent`/`stale`/`unknown`) have no defined time boundaries | Inconsistent/misleading freshness disclosure across builds | Define `FRESHNESS_THRESHOLDS_MINUTES` (live=15, recent=240, stale=1440) as admin-configurable per connection via `freshnessThresholdMinutes` on `JiraConnectionScope`; every AI response derives freshness from config, never hardcoded logic |
| CONCERN-04 | No multi-tenant isolation in the data model | `JiraConnection`/`JiraSyncRun` lack `organisationId`; data/credentials could leak across teams sharing one instance | Add `organisationId` to every canonical model (`JiraConnection`, `CanonicalIssue`, etc.) before any data is written; default `DEFAULT_ORG` for single-tenant; row-level security filters by `organisationId` on all queries |
| CONCERN-05 | Snapshot-as-AI-source undefined | AI evidence contract allows `snapshotId` but sync strategy never defines how snapshots feed AI — stale/incomplete context, broken snapshot comparison | Add `SnapshotCanonicalRecord` to Prisma schema in Phase 1; when `snapshotId` provided, build evidence from the snapshot (not live metrics), set `dataFreshness: "unknown"` past stale threshold, answer must declare "Based on snapshot saved on {date}", never mix snapshot + live data in one evidence object |
| CONCERN-06 | No AI request queue or concurrency control | Single-instance Ollama serializes inference; concurrent users without a queue → timeouts/corruption/starvation | Implement `AiQueueConfig` (`maxConcurrent` default 1, `maxQueueDepth` default 10, `requestTimeoutMs` default 120000, `perUserDailyLimit` default 50, `perUserMinuteLimit` default 5) before Phase 5 go-live; surface queue position/wait time in AI Analyst UI; add queue config to Admin → AI Engine and metrics to Admin → Diagnostics |
| CONCERN-07 | Server performance unknown at planning time | Qwen3-8B on CPU may take 30–120s/response; underpowered hardware could make the AI roadmap infeasible | **Mandatory Phase 0 gate**: benchmark `qwen2.5:14b-instruct-q4_K_M` on the actual target server before any AI code is written; record TTFT, total response time, RAM, CPU, system responsiveness; if TTFT > 30s or RAM swaps, escalate to GPU/smaller model before Phase 4 |
| CONCERN-08 | Jira credential encryption key management underspecified | No rotation/algorithm/IV spec; credentials become unreadable after key rotation; key-in-`.env` is weak protection | Mandate AES-256-GCM, 32-byte key, 12-byte IV, stored as `base64(iv):base64(authTag):base64(ciphertext)`; document a 6-step key rotation procedure; add `encryptionKeyVersion` to `JiraConnection` for traceability; audit event per rotation |
| CONCERN-09 | Prompt injection surface larger than stated | Plan only mentioned issue fields; actual surface includes summaries, descriptions, comments, sprint/board/project/version/component names, custom fields, display names | Sanitise every field in `PROMPT_INJECTION_RISK_FIELDS` via `AiPrivacyRedactor.sanitiseJiraText()` (truncate 500 chars, strip instruction-like patterns, wrap in `[DATA_START]...[DATA_END]`, escape control sequences, strip raw HTML); add an explicit injection-fence line to every system prompt; add prompt-injection test cases (Section 24 of source plan) |
| CONCERN-10 | No rollback strategy for canonical data | A bad re-sync/normalisation pass can silently overwrite valid canonical records with no way back | Stage all incoming sync records in `CanonicalSyncStaging` first; validate against canonical schema; dry-run metrics calc; promote staged→canonical only on success; discard staging and preserve canonical on failure; retain last 3 promoted canonical snapshots per project; add `POST /api/jira/connections/:id/rollback` |
| CONCERN-11 | No data retention or GDPR policy | Synchronised Jira user/issue/comment data has no retention, deletion, or right-to-erasure mechanism — non-compliant from day one in GDPR regions | Add `DataRetentionConfig` (sync history 90d, audit log 365d, canonical data 730d, user PII 90d post-disconnect, auto-anonymise on disconnect = true); add `POST /api/admin/data-retention/purge` and `POST /api/admin/data-retention/anonymise-user/:accountId`; add a Data Retention admin section; document GDPR responsibilities in the Deployment Guide |
| CONCERN-12 | AI audit logs defined but not structured | No schema/retention/query interface defined — compliance and debugging both become impossible | Add `AiAuditLog` Prisma model (org/user/role/feature/sourceMode/connectionId/importId/promptHash/evidenceHash/modelId/tokensUsed/latencyMs/responseLanguage/responseStatus/rejectionReason); never log full prompts/responses, only hashes; add `GET /api/admin/ai-audit-logs` with filters; show alongside Jira audit events in Admin → Audit Logs |

### 28.3 Core non-negotiable principle

The AI model is the explanation layer, never the calculation engine. Required pipeline: Data Source (export or connected Jira) → Acquisition/Sync Layer → Canonical Data Model (organisation-scoped, versioned) → Deterministic Metrics/Rules Engine (authoritative) → Verified Structured Evidence Object (sanitised, freshness-stamped) → Self-Hosted AI Explanation Layer (Ollama + Qwen, private network only) → Written Answer (English/Arabic, evidence-cited, freshness-disclosed). Violating this pipeline order is a critical defect, not a design choice.

### 28.4 Data modes (both first-class)

- **Jira Export Mode** — CSV/XLSX/XLS, single- and multi-file merge, 55+ column-alias detection, import preview with data-quality scoring, missing-column impact assessment, import history with rollback, source-file metadata preserved on canonical records. Must remain fully functional even if Jira API integration is disabled/misconfigured/unavailable.
- **Connected Jira Mode** — Jira Cloud (primary) and Jira Data Center (where supported); multiple connections per organisation; project/board scope selection; manual/scheduled/incremental/full-resync; structured sync status states; sync history with per-run error detail; connection health monitoring; credential rotation without data loss; graceful disconnect with optional data preservation.
- **Unified analytics requirement** — all analytics, AI, reporting, snapshots, recommendations, and forecasting must produce identical results regardless of source. No component outside the Data Acquisition Layer may reference source-specific structures (Atlassian API types, CSV column names).

### 28.5 Target architecture (layered)

UI (Upload Export · Connect Jira · Dashboard · AI Analyst · Reports · Admin · Connections · Sync Status) → Next.js App/API Layer (Auth · RBAC · Validation · Jira/Upload/AI/Reporting/Admin/Audit APIs) → split into **Data Acquisition** (Export Parser, Jira Cloud/DC Connectors, Sync Scheduler, Pagination, Retry/Backoff, Webhook Receiver, Normalisation) and **AI Orchestration** (Evidence Builder, Prompt Registry, Privacy Redactor, Response Validator, Citation Mapper, AI Request Queue, Audit Logger, Intent Classifier) → Canonical Delivery Data Model (organisation-scoped; includes Staging Tables and Rollback Snapshots) → Metrics/Rules/Forecasting/Reporting → Local AI Provider Layer (`AiProvider` interface, Ollama Adapter → Qwen2.5-14B-Instruct default, AI Request Queue, Health Check/Streaming/Model Registry, future vLLM Adapter).

### 28.6 AI stack

| Property | Default |
|---|---|
| Model | `qwen2.5:14b-instruct-q4_K_M` via Ollama |
| Min/recommended RAM | 12GB / 16GB dedicated |
| Quantisation | Q4_K_M |

Admin-selectable alternatives: `qwen2.5:7b-instruct-q4_K_M` (6GB, low-resource), `aya-expanse:8b-q4_K_M` (7GB, Arabic-primary), `qwen2.5:32b-instruct-q4_K_M` (24GB, enterprise quality). Future scaling: keep `AiProvider` interface unchanged, add a vLLM adapter behind the same interface, separate inference host into its own Docker service, add a worker-scaling request queue, add model replicas only after measured performance testing. **Mandatory pre-Phase-4 benchmark** (CONCERN-07): TTFT must be < 15s (hard ceiling 30s), total response < 90s, peak RAM must leave 2GB free — do not proceed to Phase 4 if these fail; escalate infrastructure instead.

### 28.7 Jira integration service layer (planned modules)

`src/services/jira/` — provider interface + Cloud/DC providers, connection/auth/sync services, **new**: `jira-sync-staging.service.ts`, `jira-sync-rollback.service.ts`, `jira-credential-encryption.service.ts` (AES-256-GCM), `jira-data-retention.service.ts` (GDPR) — plus existing project/board/sprint/issue/changelog/version/user/comment/webhook/pagination/rate-limit/retry/field-mapping/normalisation/audit/writeback services. The business layer must depend only on the `JiraProvider` interface; no Atlassian SDK types may leak into canonical models or metrics.

### 28.8 Credential security (fully specified)

AES-256-GCM, random 12-byte IV per encryption, 32-byte key, storage format `base64(iv):base64(authTag):base64(ciphertext)`; key from `JIRA_CREDENTIAL_ENCRYPTION_KEY` env var (scrypt-derived if passphrase-based). Required env vars also include `JIRA_ALLOWED_HOSTS` (SSRF allowlist) plus timeout/retry/page-size/max-connections defaults. 6-step rotation procedure (generate → decrypt-with-old → re-encrypt-with-new → update env → verify all connections via test-connection → audit event per connection). Mandatory rules: never expose credentials to frontend post-submission, never log them, never send to the AI model, never use localStorage/sessionStorage, block non-allowlisted hosts including localhost/private ranges, enforce connect+read timeouts, restrict connection management to `admin` role only.

### 28.9 Data model additions (planned)

- `JiraConnection`: add `organisationId`, `encryptionKeyVersion`, `freshnessThresholdLiveMinutes`/`RecentMinutes`/`StaleMinutes`.
- `JiraSyncRun`: add `organisationId`, `issuesStaged`/`issuesPromoted`/`issuesRolledBack`.
- New `AiAuditLog` model (see CONCERN-12).
- New `CanonicalSyncStaging` model (see CONCERN-10).
- New `SnapshotCanonicalRecord` model (see CONCERN-05).
- `CanonicalIssue`: add mandatory `organisationId`; freshness computed at query time from connection thresholds, not stored.

### 28.10 Synchronisation state machine (planned)

`queued → connecting → fetching_metadata → fetching_issues → fetching_changelogs (optional) → staging → validating_staged → promoting → calculating → completed | completed_with_warnings`, with `failed`/`cancelled` exits. Staging-before-promote per CONCERN-10. Incremental sync uses a `SyncCursor` (`lastIssueSyncedAt`, `lastChangelogKey`, `lastVersionUpdated`, `completedPages`, `totalEstimatedPages`) persisted in `JiraSyncRun.cursorJson` so sync can resume after interruption.

### 28.11 AI feature set (planned)

AI-1 Explain Delivery Health · AI-2 Executive Summary · AI-3 Explain Top Risks · AI-4 Rewrite Recommendations for Role (Scrum Master/Product Owner/Engineering Manager/Delivery Manager/Executive/Customer-safe tones) · AI-5 Ask Delivery Clarity (free-form Q&A over structured evidence only, English or Arabic). All responses must cite evidence IDs, disclose source mode + freshness, and explicitly state limitations/missing data rather than speculate.

### 28.12 Response contract, rejection rules, and system prompt (planned)

`DeliveryAiResponse` must include `sourceDisclosure`, `observations[]` (with `evidenceIds`/`confidence`), `recommendedActions[]`, `limitations[]`, `missingData[]`, `language`, plus `queueWaitMs`/`modelId`/`latencyMs`. Reject/repair responses on: fabricated evidence references, metric values absent from evidence, references to entities outside the supplied dataset, false "live" claims when sync is stale, invented users/dates/issues/releases/causes, omitted missing-data disclosure, or detected prompt-injection patterns in output. Every prompt must open with the 12-rule system prompt block (evidence-only, injection-fence, no external access, no invention, fact/interpretation/action distinction, evidence-ID citation, source+freshness disclosure, no independent recalculation, no Jira actions, exact JSON schema, requested language, explicit "insufficient evidence" admission).

### 28.13 Planned API surface

Jira: `POST/GET/PATCH/DELETE /api/jira/connections[/:id]`, `/test`, `/projects`, `/boards`, `/scopes`, `/sync`, `/resync`, `/cancel`, `/rollback` (new), `/status`, `/sync-history`, `/api/jira/sync-runs/:id`, `POST /api/admin/credentials/rotate` (new).
AI: `/api/ai/health`, `/queue-status` (new), `/models` (new), `POST /benchmark` (new), `/explain-health`, `/summary`, `/risks/explain`, `/recommendations`, `/ask`, `/role-coaching`, `/report`, `GET /api/admin/ai-audit-logs` (new).
Data governance: `GET/PATCH /api/admin/data-retention/policy`, `POST /purge`, `POST /anonymise-user/:accountId` (all new).
Future write-back (do **not** implement without explicit approval — see `DND-02`): `/api/jira/writeback/drafts[/:id/validate|/execute]`.

### 28.14 UI changes (planned)

Landing page presents "Connect Jira" and "Upload Jira Export" as equal, non-hierarchical primary options. Dashboard header always shows a source/freshness badge (Live <15min, "Jira Sync: Xh ago" <4h/<24h amber, "Stale Data" >24h red, "Uploaded Export: date" blue, "Snapshot: date" grey) driven by the connection's configurable freshness thresholds. AI Analyst UI must show a permanent "🔒 Local & Private" badge, current source/freshness, queue position if waiting, English/Arabic selector, streaming answer with evidence citations, an expandable evidence drawer, Copy/Regenerate/Feedback actions, and a stale-data warning when applicable.

### 28.15 Admin settings structure (planned)

`Admin Settings → Jira Connections · Synchronisation (schedule/incremental/retry/freshness thresholds) · AI Engine (model registry, queue limits, language, privacy, benchmark, kill switch) · Storage · Data Retention (new) · Security · Audit Logs`.

### 28.16 Security requirements (planned, summary)

Jira: AES-256-GCM per-record IV, allowlist-only hosts (block private ranges/SSRF), connect+read timeouts, no raw Jira errors to frontend, rotation without data loss, audit events on every connection lifecycle action, least-privilege read-only scopes by default, `organisationId` row-level scoping everywhere. AI: Ollama on private Docker network only, no credentials in evidence payloads, `sanitiseJiraText()` on every untrusted field, response validation before return, prompt-injection detection, no write-back capability, admin kill switch without restart, full audit log including rejections. Data: GDPR retention policy, PII anonymisation on disconnect, organisation isolation, staging-before-promote, rollback to last known good state.

### 28.17 Testing strategy additions (planned)

Jira: SSRF/host-allowlist test, credential encryption round-trip, key rotation with existing encrypted data, large-project pagination, rate-limit backoff, staging pass/fail paths, rollback, cross-org isolation, incremental cursor resume, webhook dedup, comment/changelog failure isolation, credential redaction from logs. Canonical model: export-vs-API normalisation parity, `organisationId` presence, dedup on resync, deleted-issue handling, custom-field resilience, Scrum+Kanban parity. AI: per-mode evidence validity, snapshot freshness derivation, stale-data warning, Arabic native-speaker review gate, citation validity, queue correctness under concurrency, per-user rate limiting, prompt-injection rejection (summary/description/display-name vectors), metric-absence rejection, out-of-dataset-entity rejection, audit log completeness, AI-failure dashboard isolation, kill-switch behaviour. Performance: TTFT/total-time/RAM/CPU/responsiveness at 1/3/5 concurrent users, queue depth under burst.

### 28.18 Delivery phases (as received — incomplete, see truncation notice above)

- **Phase 0 — Repository audit and documentation (2–3 days).** Gates: full audit of existing Jira features vs this plan, gap report, architecture impact assessment, P0 doc gates confirmed, all affected docs identified, server benchmark date confirmed (CONCERN-07), single-org-vs-multi-org decision made (CONCERN-04), GDPR applicability confirmed for target markets (CONCERN-11). Do not proceed to Phase 1 until all gates are closed.
- **Phase 1 — Canonical source architecture (3–5 days).** Deliverables so far: `organisationId` added to all canonical models (CONCERN-04); `SnapshotCanonicalRecord` model created (CONCERN-05); *(remainder of Phase 1, and all phases after it, missing — see truncation notice)*.

| ID | Task | Priority | Status |
|---|---|---:|---|
| AIPLAN-01 | Run mandatory Phase 0 server benchmark (`qwen2.5:14b-instruct-q4_K_M`, TTFT/RAM/CPU) before any AI code | P0 (gate) | ❌ Not started |
| AIPLAN-02 | Decide single-org vs multi-org and confirm GDPR applicability (Phase 0 gates) | P0 (gate) | ❌ Not started |
| AIPLAN-03 | Phase 1: add `organisationId` to all canonical models | P1 | ❌ Not started |
| AIPLAN-04 | Phase 1: add `SnapshotCanonicalRecord` model | P1 | ❌ Not started |
| AIPLAN-05 | Obtain and append the missing remainder of the source plan (Phase 1 continuation through final section) | P0 | ❌ Not started — blocked on user re-pasting truncated content |

---

## 29. Soft Launch, Analytics & AI Intelligence (Master Plan v1.1 — 2026-06-30)

Source: `product/Delivery_Clarity_Soft_Launch_AI_Master_Plan_v1.1.docx`
Decision principle: P0-A must pass before P0-B work; P0-B must pass before P1 AI work.

### 29.1 P0-A — Existing product completion gate

| ID | Task | Priority | Status | Notes |
|---|---|---|---|---|
| P0A-01 | Repository and documentation audit | P0 | ✅ Done (2026-07-25) | Tracker was stale — `TODO-List.md` §12/§13 already contains a closed FR→UC→SCN→UJ→TC traceability matrix (`TRACE-01`, zero gap cells) and a full-app coverage survey (`TRACE-02`, all 22 `COVER-XX` areas closed), both dated 2026-06-08. Audit-report deliverable satisfied by citing this work in `product/DEVELOPER_GUIDE.md` §11d, plus 3 new genuine staleness findings recorded there (stale SQLite references in §13/§12, and this section's own inaccurate P0A status labels). |
| P0A-02 | Upload pipeline reliability | P0 | ✅ Done (2026-07-26) | Phase 2 closed the one real gap: `/api/upload` now reuses `mergeIssueArrays()` (`src/lib/mergeIssues.ts`) to dedup by Issue Key within a single file, same as the multi-file merge route — a repeated row now merges instead of double-counting, and the merge is surfaced to the user as a warning. `rowCount` persisted to `ImportLog` intentionally still reflects the raw pre-dedup row count (what was actually in the file), while metrics/`totalIssues` reflect the deduped set. Also fixed a real latent crash in `validateIssueData()` — `issues.length` was read unconditionally even when `Array.isArray(issues)` was false, so a non-array input would throw instead of failing validation cleanly; added an early return. New tests: `src/__tests__/jiraValidation.test.ts` (5 tests, direct coverage of empty/missing-field/non-array/valid input — previously only exercised via mocks or one incidental assertion), `src/__tests__/uploadEdgeCases.test.ts` (413 size-limit, empty-CSV 422, dedup-warning — 3 tests). The corrupt-signature case was already covered (`uploadUserId.test.ts` `SEC-2026-07-18a`), so not duplicated. |
| P0A-03 | Metric calculation correctness | P0 | ✅ Done (2026-07-25) | Tracker was stale — 151/151 tests passing across 10 suites (`metricFormulas.test.ts` alone has 22 tests explicitly covering zero-denominator/missing-field/malformed-field/empty-input categories per CLAUDE.md §45.1), plus a 917-line formula reference (`product/ALGORITHM_SPEC.md`) mirrored live in `/developer`'s Calculation Reference tab. No real gap found. |
| P0A-04 | Data isolation and workspace security | P0 | ✅ Done (2026-07-26) | Tracker was stale — real per-user/workspace scoping exists (`userId`+`workspaceId` on every relevant Prisma model and query), IDOR-hardened (404 not 403 on cross-account access attempts), and 26 existing negative-access tests already pass (`src/__tests__/crossAccountDataIsolation.test.ts` TC-ISO-01–08, `workspaceIsolation.test.ts` TC-DATAISO-01–18). Note: today's isolation boundary is per-user (one `Workspace` per `User`, MVP design) — true multi-org tenancy is the separate, unmerged `feature/org-phase1-tenant-isolation` branch tracked under §20a, not this item. Phase 2 audited all 7 unscoped-query admin routes (`admin/users`, `admin/diagnostics`, `admin/audit-events`, `admin/system-errors`, `admin/feedback`, `admin/jira-connections`, `admin/user-add-requests`) — confirmed every one is gated by an admin-role (or `isSuperAdmin`) check rather than a missed `userId`/`workspaceId` filter, so no real IDOR gap exists. Real gap found instead: 4 of those routes (`diagnostics`, `audit-events`, `system-errors`, `feedback`) had no negative-access test proving the guard actually rejects a non-admin caller. Closed via `src/__tests__/adminNegativeAccess.test.ts` (5 tests: one per route plus an unauthenticated-caller case). |
| P0A-05 | Authentication/session baseline | P0 | ✅ Done (2026-07-01) | Code audit + 3 gaps fixed: GAP-1 in-memory rate limiter → persistent PostgreSQL LoginAttempt table; GAP-2 rate limit added to change-password (10/user/15 min); GAP-3 weak SESSION_SECRET fallback removed. Both 429s return retryAfterSeconds + Retry-After header; login page shows live amber countdown + disabled button until zero. 738/738 tests passing. Manual checklist (live Render pass) still pending. |
| P0A-06 | Database production readiness | P0 | ✅ Done (2026-07-31) | Migrations/indexes were already solid. Closed the real gap: the in-app "Backup & Restore" feature (`src/services/settings/backup.service.ts`) and `product/DEPLOYMENT_GUIDE.md` §11's cron example both targeted a **SQLite file (`delivery_clarity.db`) that no longer exists** — silently backing up nothing of the real Postgres/Neon production data. **Design:** Neon's built-in point-in-time restore (PITR, already real today — `product/MANUAL_TESTS.md` §7.4) is now the documented, authoritative recovery path; a new supplementary, independent daily `pg_dump` (`.github/workflows/db-backup.yml`) uploads directly to a private S3 prefix using a new, narrowly-scoped IAM credential (never a plain GH Actions artifact — a PII-bearing dump downloadable by any repo collaborator was rejected as unsafe). GitHub Actions was chosen over a Render cron job because `render.yaml` is a single free-tier web service with no cron infra, while `ubuntu-latest` runners already ship `pg_dump` (same as `e2e.yml` already relies on). Restore stays a documented manual procedure (`product/DATABASE_BACKUP_RESTORE.md` §3) — no wrapper script; the real risk is restoring into the wrong target, which a confirmation flag doesn't solve, and `scripts/` is 100% Node while this repo's only comparable runbook (`DEVELOPER_GUIDE.md` §12 Rollback) is prose-only too. **New doc:** `product/DATABASE_BACKUP_RESTORE.md` (PITR steps, RPO/RTO statement, the `pg_dump`/S3 design, restore decision tree). **Also fixed while touching this area (CLAUDE.md §61):** `backup.service.ts` no longer lists the dead SQLite entry; `BackupRestoreSettings.tsx` UI copy no longer claims the download/restore touches "the database" — relabeled as configuration/diagnostics backup. More seriously, `app/api/admin/storage/auto-restore/route.ts`'s GET health check was **live and wrong on every admin Settings page load** (`DbHealthBadge`/`AutoRestoreSection` in `app/admin/settings/page.tsx`) — `dbExists` checked a SQLite path that can never exist in production, so it permanently showed "Local DB: not found — restore from cloud needed" and nudged admins toward an unneeded restore. Replaced with a real `prisma.user.count()` reachability check; `src/services/storage/autoRestore.ts`'s "skip if DB already populated" guard had the identical bug (always short-circuited false, so its documented skip-if-populated intent never fired) — same fix. Mechanical SQLite/`DATABASE_URL` corrections throughout `product/DEPLOYMENT_GUIDE.md` (§1, §3, §4, §5.2, §6 — including correcting §6.2's Vercel limitations table, most of which were wrong once Postgres is accounted for: login/imports/admin-user-management/trend-data all persist fine on Vercel now, the real remaining gap is local JSON config/cache files) and `product/DEVELOPER_GUIDE.md` (Tech Stack, Quick Start env-var table, repo-tree diagram, data-flow step 8, Cloud Storage & Backup section, §12 rollback-procedure gap note — all previously-current-state claims of SQLite usage, not the historical F1-F4 build-log entries, which were deliberately left as an accurate record of that point in time). New test: `TC-BK-09` in `src/__tests__/backup.test.ts` (regression guard — `getBackupStats()` must never list `delivery_clarity.db` again). **Explicitly deferred, named follow-ups, not silently dropped:** (1) full in-app Postgres-table export/import as a browser-downloadable feature — production data includes password hashes/PII, needs its own field-level-redaction and referential-integrity design, a separate High-Risk project; (2) a dedicated Render section in `DEPLOYMENT_GUIDE.md` — `render.yaml` is the real production config but has no walkthrough; (3) `TODO-List.md` §13's Feature-3 table (F3-02/F3-03) still says "SQLite database created" — flagged by `DEVELOPER_GUIDE.md` §11d for a future §13 pass, not touched here to keep this change scoped to the backup/restore gap itself. **Manual step still required from the user, cannot be verified from this sandbox:** the new GH Actions workflow needs `NEON_DIRECT_DATABASE_URL` (Neon's **unpooled** connection string — `pg_dump` doesn't work reliably through the app's pooled URL) and new S3 IAM credentials added as repo secrets before it can run successfully — full list and an example least-privilege IAM policy in `product/DATABASE_BACKUP_RESTORE.md` §2.3. |
| P0A-07 | Audit and operational logging | P0 | ✅ Done (2026-07-28) | Phase 3 closed both real gaps. **Correlation IDs**: `proxy.ts` now mints/reuses an `x-request-id` per `/api/*` request (`src/lib/requestId.ts`, `resolveRequestId`/`getRequestId` — reuses an inbound header from an upstream proxy/LB if present, else `crypto.randomUUID()`), forwarded to route handlers via the request headers and echoed on every response. Threaded as an additive nullable `correlationId` column (migration `20260728000001_add_correlation_id`) into both `AuditEvent` and `SystemErrorLog`, through `safeAuditEvent`/`logSystemError` (`src/lib/system-error-logger.ts`), and into **all 36 existing `safeAuditEvent` call sites across 24 files** — not the ~16 this row previously estimated; the real count only surfaced via a fresh grep during implementation. One deliberate exception: `admin/system-errors`'s retry handler preserves the *original* failed request's `correlationId` from the stored payload rather than the retry call's own, so a retried row still ties back to the request that first failed to write it. **Scope note — NOT covered by this pass**: 12 files write audit rows via raw `prisma.auditEvent.create(...).catch(() => {})`, bypassing `safeAuditEvent` entirely (`app/api/auth/login`, `logout`, `change-password`, `snapshots`, `profile`, `profile/image`, `admin/storage/auto-restore`, `admin/storage/download`, `admin/backup`, `admin/restore`, `admin/app-config`, `src/services/settings/dataRetention.service.ts`) — a deliberate, named exclusion, not an oversight; those rows keep a null `correlationId` until a future pass migrates them onto `safeAuditEvent`. **Audit gap**: this row's own "2 destructive routes have none" claim was half-stale — `admin/users/[id]/reset` already had an audit event since commit `abbfd78` (2026-07-07), just at the service layer (`userReset.service.ts`), not the route; only threaded `correlationId` through via a new optional third param on `resetUserData()`, no second event added. `admin/security` (GET, discloses whether `SESSION_SECRET`/`CONFIG_ENCRYPTION_KEY` are weak/default, DB path existence, etc.) genuinely had zero audit logging — closed with a new `admin_security_report_viewed` event. New tests: `src/__tests__/systemErrorLogger.test.ts` (correlationId pass-through on the happy path, the P2003 retry path, and the generic error path — no test file existed for this module before), `src/__tests__/adminSecurityRoute.test.ts` (audits on success, no event on 401/403), 5 new cases in `src/__tests__/middleware.test.ts` (`P0A-07: /api/* correlation ID` block). Full suite: 120/120 suites, 1118/1118 tests. Branch: `fix/p0a-07-correlation-ids-and-security-audit-log`. |
| P0A-08 | Release/version discipline | P0 | ✅ Done (2026-07-25) | Tracker was stale on the version-exposure half: `app/api/health/route.ts` already returns `version: packageJson.version` at runtime — verified by reading the file directly (earlier claims of "not exposed" came from grepping for the literal string `app_version`, which this implementation doesn't use). Closed today: rollback procedure documented (`product/DEVELOPER_GUIDE.md` §12 "Rollback procedure"); stale root `RELEASE_NOTES.md` stub (an orphaned early-PR-description leftover, unreferenced anywhere) replaced with a redirect to the real, actively-maintained `product/RELEASE_NOTES.md`. |
| P0A-09 | Performance baseline | P0 | ✅ Done (2026-07-31) | Phase 3 closed all three scoped pieces. Instrumented the previously-unmeasured legs: `parseTimeMs`/`mergeValidateTimeMs`/`metricsCalcTimeMs` now written to `ImportLog.metadataJson` (additive, no schema migration — `processingTimeMs` itself deliberately left unchanged since `admin/diagnostics`'s `avgProcessingMs` averages it across all history); export timing (`excelInsightExport.service.ts`) and two dashboard-render timing points (`app/dashboard/layout.tsx`, `priority-attention/page.tsx`) added as client-side `console.log` instrumentation, since both run entirely client-side (confirmed no `app/api/*` route imports the export services). Built `scripts/generate-synthetic-jira-export.js` (a 3k-7k-row synthetic dataset generator matching the real column contract, gitignored output, permanent round-trip smoke test at `src/__tests__/syntheticJiraGenerator.test.ts`). Two measurement passes: an initial sandboxed attempt where the live dev server wasn't reachable (2+ min health-check timeout) fell back to timing the pipeline functions directly at 3k/5k/7k rows (no HTTP/DB layer); a follow-up retry succeeded — dev server came up, registered+verified a real test account, and uploaded a real 5,000-row file through the actual `POST /api/upload` route, giving one authoritative live sample read from the resulting `ImportLog` row (`parseTimeMs` 248ms, `mergeValidateTimeMs` 2ms, `metricsCalcTimeMs` 107ms, `processingTimeMs` 612ms) — this also confirms the new instrumentation is correct end-to-end under real HTTP/DB conditions, not just in isolation. Export timing and dashboard-render timing (both need a live browser) remain uncaptured — a headless-Chromium automation attempt was made but the login form's client submit handler never fired reliably in this sandbox (fell back to a native GET every time despite extended hydration waits); the `console.log` instrumentation is in place and ready for whoever next has a working local browser session. Full detail, both methods' numbers, and honest coverage caveats in `product/PERFORMANCE.md` — explicitly labeled first-pass/non-production, not a final CLAUDE.md §40 budget. LCP/INP/CLS (Web Vitals) were out of scope per an explicit user decision (would need a new `web-vitals` dependency + reporting pipeline, materially bigger than this ~1-day pass) — not measured, listed only as aspirational targets. A harmless `perf-bench@deliveryclarity.app` test account + one `ImportLog` row exist in the dev DB as a result of the live-upload run. |
| P0A-10 | Core documentation completion | P0 | ✅ Done (2026-07-25) | Tracker was stale on the calculation-reference half — `product/ALGORITHM_SPEC.md` (917 lines) already covers this comprehensively and is mirrored live in `/developer`. Data-model half was genuinely incomplete (6 of 19 Prisma models documented) — closed today: `product/SRS.md` §3.5 now documents all 19 models. |

### 29.2 P0-B — Safe soft-launch essentials

| ID | Task | Priority | Status | Notes |
|---|---|---|---|---|
| P0B-01 | Signup and role profile | P0 | ✅ Done (2026-07-31) | Tracker was stale — free signup, email verification, and workspace/entitlement creation were already fully live (EP-011/EP-012, `app/api/auth/register/route.ts`), not a stub; `product/DEVELOPER_GUIDE.md` falsely claimed registration returns 403/is disabled in 4 places, directly contradicted by the live route and `product/MANUAL_TESTS.md` §14's documented production walkthrough — corrected. Real remaining gap, now closed: `src/lib/personas.ts`'s persona list restored from 5 back to the full 11 (Scrum Master, Agile Coach, Product Owner, Project Manager, Delivery Manager, Engineering Manager, Team Lead, Executive, Jira Administrator, Consultant, Other) — reversing a trim done 3 weeks ago, per explicit user instruction, to match master plan §4.1's "one primary role and zero or more secondary roles." Added `User.secondaryPersonas String[] @default([])` (additive migration `20260731000001_add_secondary_personas`, verified via `prisma migrate deploy` against a live Postgres instance), a new checkbox group on `/register` excluding whichever role is primary, and register-route validation (dedup, `PERSONAS`-membership check, primary exclusion; invalid/missing values silently dropped, not a 400, since the field is optional/checkbox-driven/analytics-only). Persona confirmed to have zero access-control blast radius (verified via grep — never read in any `app/api` authorization check; `role: 'user'` is hardcoded server-side regardless of submitted persona), so classified Medium risk per CLAUDE.md §53 despite the schema change. Expanding to 11 personas forced 6 new `personaFocus.config.ts` entries to be authored (a `Record<Persona, ...>` mapped type — `tsc --noEmit` fails without them, a structural completeness guard). New tests: `TC-REG-03`–`06` in `src/__tests__/register.test.ts`. Full detail in `product/SRS.md` FR-412. Depends on: P0A-05 (done). |
| P0B-02 | Trial entitlement | P0 | ✅ Done (2026-08-01) | Tracker was stale — the core state machine (`src/lib/entitlement.ts`, EP-015: eligible/processing/consumed/expired/suspended/restored, 30-day lazy expiry, atomic consume-on-success, failed-validation-never-consumes) was already live and correctly wired into `app/api/upload/route.ts`. Closed the real gaps against the master plan (§4.1): **(1) 24h replacement upload** — new `Entitlement.replacementUsedAt` column (additive migration `20260801000001_add_entitlement_replacement`, verified via `prisma migrate deploy` against a live Postgres instance), new `beginReplacementUpload`/`consumeReplacementUpload`/`revertReplacementUpload` functions that operate on `replacementUsedAt` as the lock field and deliberately never touch `status`/`consumedAt`/`expiresAt` — anchored to the original successful analysis, not a fresh 30-day grant. **(2) Real bypass, not just a missing feature**: `app/api/upload/merge/route.ts` never checked entitlement at all — a consumed/expired/suspended non-admin user could fully bypass the trial gate through the multi-file merge flow. Fixed with the same wiring as the single-file route; also closed two related gaps found in the same file: it never created an `ImportLog` row (needed as entitlement's FK target) and was missing the EP-011 email-verification gate the single-file route has. **(3) Expiry had almost no real effect** — `checkUploadEntitlement` was the only enforcement point anywhere in the app (no `middleware.ts` exists in this repo); a consumed/expired user's dashboard kept working indefinitely, only new uploads were blocked. Gated the one true chokepoint, `GET /api/metrics/latest` (all dashboard pages funnel through `loadMetricsWithSource()`), for non-admin `expired` users. **(4) Found and fixed during this pass, not in original scope**: `app/page.tsx`'s "Try a sample first" button ran through the exact same `/api/upload` path as a real upload — trying the sample consumed the real trial entitlement. Rewired to always use the network-free `processFileLocally()` pipeline, regardless of `dataStorageMode`, so the demo dataset is genuinely free and non-destructive (a prerequisite for (3)'s "preserve access to a demo dataset" design, not an adjacent fix). **(5) Found via direct code verification, not the original research**: `loadMetricsWithSource()` fell back to a stale `localStorage` copy even when the server returned an authoritative `available:false` block — since consuming a trial requires having loaded the dashboard at least once, this would have made (3)'s expiry check a no-op for nearly every real expired user. Fixed by special-casing the new `reason:'expired'` response to skip the local-fallback branch entirely, and by extracting `redirectWithLoadError`'s signal-storage half into a standalone `setLoadErrorSignal()` so the explanation reaches `/` regardless of which of the 17 dashboard pages' two different redirect patterns fires. **Deliberately not built**: mutating `Workspace.status` on expiry (traced its only two consumers — `getWorkspaceForUser()`'s active-only filter and `getMetricsScopeKeyForUser()`'s fallback-to-a-different-scope-key behavior — flipping it would silently redirect metrics reads/writes to a different storage key than real data was written under, worse than doing nothing); admin suspend/restore UI (`P0B-13`'s scope); gating `/api/snapshots`/`/api/trends`/`/api/imports/export` individually (small, explicitly-accepted residual — a determined expired user hitting those directly bypasses the one chokepoint this pass closed); local-storage-mode uploads touching entitlement (FR-377, deliberate privacy design, not a bypass). **Test infrastructure gap found, not worked around**: `loadMetricsWithSource()` and `handleSampleData()`'s fix are client-side/React logic; this repo has no jsdom or component-testing infrastructure anywhere (Node-only Jest, confirmed via `DEVELOPER_GUIDE.md`'s tech stack table and precedent in `SRS.md` FR-396) — verified via code review + manual QA instead of fabricating tests against nonexistent infra. New/extended tests: `entitlement.test.ts` (`TC-ENT-11`–`20`, 10 new cases plus one existing fixture fix), `uploadMergeEntitlement.test.ts` (new), `uploadUserId.test.ts` (2 new replacement-window cases), `metricsLatestEntitlement.test.ts` (new), `uploadMergeSignature.test.ts` (mocks updated for the route's new dependencies). **`/security-review` run before merge** (CLAUDE.md §53 High Risk): identified one MEDIUM candidate (entitlement-consuming transaction wrapped in a silent `.catch(() => null)` in the new merge-route wiring) — independently re-verified via a second pass and confirmed a false positive (2/10 confidence: no realistic user-controlled trigger, and the same silent-catch pattern already existed pre-PR in `app/api/upload/route.ts`, merely extended to the second route, not newly introduced). That same pass also surfaced a real but non-security correctness bug worth fixing anyway: none of the pre-file-processing early returns (no-file, unsupported type, oversize, rate-limited, malformed multipart body) in either upload route reverted the entitlement lock — for the ordinary path this silently self-heals via the existing 10-minute stuck-`processing` recovery, but the new `replacementUsedAt` lock has no equivalent recovery, so a user who mistakenly fails one of these checks during their one 24h replacement attempt would permanently lose it. Fixed by adding the same revert call already used at the signature/parse/validation sites to all 7 of these early-return points across both routes. Depends on: P0B-01 (done), P0A-02 (done). |
| P0B-03 | Consent and privacy controls | P0 | ✅ Done (2026-08-01) | Tracker was mostly stale: `/terms`/`/privacy` (7-language `legal-i18n`) and the required consent checkbox at registration (EP-014) were already fully built — not touched here (editing live legal-policy content across 7 languages is out of scope for an engineering ticket, and nothing new contradicts what's already promised). The real gap: consent was just two flat, overwrite-once `User` fields (`termsAcceptedAt`/`termsVersion`) with zero other read/write call sites — not an actual "record" despite the privacy policy already promising "Consent records: lifetime of account plus 6 years" (`en.ts` §6), no in-app way to see consent status, and no "analytics choices" concept at all (confirmed via repo-wide grep: no GA4/gtag/trackEvent/analytics system exists yet — P0B-05/06/07 are separate, unbuilt tracker items). Added: new append-only `Consent` table (`userId`, `purpose`, `granted`, `version`, `source`, `ipAddress`, `userAgent`, `createdAt` — additive migration `20260801000002_add_consent`, verified via `prisma migrate deploy` against the live Postgres instance) — one row per grant/withdrawal event, never updated in place; current status for a purpose is the latest row. New `src/lib/consent.ts` (`recordConsent`/`getConsentStatus`) — `getConsentStatus` falls back to the legacy `User.termsAcceptedAt`/`termsVersion` fields for `terms_and_privacy` when no `Consent` row exists yet (true for every account that registered before this shipped), so nothing breaks for existing users. `POST /api/auth/register` now writes a `terms_and_privacy` consent row inside the same transaction as user creation, alongside the unchanged legacy fields. New `GET`/`POST /api/consent` endpoints and a new Settings → **Privacy** tab (`PrivacyTab.tsx`, following `StorageTab.tsx`'s established pattern) let a user see their terms-acceptance record and self-service toggle **analytics** consent — the only purpose exposed as togglable; `terms_and_privacy` isn't, since withdrawing required consent while keeping the account isn't a state this ticket models (the privacy policy already frames that as account deletion, correctly deferred to `P0B-04`). The analytics toggle is explicit in its own UI copy that no analytics collection exists yet ("this preference will be honored once we do") — avoids implying live behavior that isn't there. **Deliberately not built**: account deletion/export jobs and any automated retention-purge job for any data category (`P0B-04`, a separate tracker item that explicitly depends on this one); forced re-consent on a `termsVersion` bump (not promised anywhere today, a reasonable explicitly-deferred follow-up); any GA4/cookie-consent-banner UI (`P1-06` is the ticket that wires GA4, and it explicitly depends on this one for exactly the consent record added here). **Test infrastructure gap, not worked around**: `PrivacyTab.tsx` is client-side/React UI; this repo has no jsdom/component-testing infrastructure anywhere (Node-only Jest, same confirmed gap as P0B-02) — verified via code review + manual QA instead. New/extended tests: `consent.test.ts` (new, domain logic — latest-row-wins, legacy-field fallback, `decided` flag), `consentApi.test.ts` (new, GET/POST auth and validation), `register.test.ts` (`TC-REG-07`, asserts the consent row is written inside the registration transaction). Depends on: P0B-01 (done). |
| P0B-04 | Data lifecycle | P0 | ✅ Done (2026-08-02) | No self-service deletion or export existed anywhere — `DELETE /api/admin/users` was admin-only and couldn't target the admin's own account, and `GET /api/imports/export` only exported ImportLog metadata as `.xlsx`, not a full account. **Deletion is a two-phase soft-then-hard delete, not immediate**: new `POST /api/account/delete` (password-verified, same rate-limit bar as change-password) immediately sets `isActive: false` + a new `User.deletionRequestedAt` (additive migration `20260802000001_add_deletion_requested_at`, applied and verified via `prisma migrate deploy` against a live Postgres instance) and destroys the session — reusing the existing EP-010 `GET /api/auth/me` session-ejection check verbatim, zero new gating logic needed. A new daily GitHub Actions cron (`.github/workflows/data-retention.yml` + `scripts/purge-expired-data.mjs`, following the `db-backup.yml`/`prisma/seed.mjs` standalone-script precedent — this repo has no ts-node/tsx wired for scripts, so the script does its own raw Prisma calls rather than importing `src/lib/accountLifecycle.ts`) hard-deletes any account past a 7-day grace period — comfortably inside the Privacy Policy's already-published "deleted within 30 days" SLA, while leaving a real recovery window. 12 of 14 `User`-FK'd Prisma models are already `onDelete: Cascade`, so the hard-delete itself needs no special-casing; `AuditEvent` (`SetNull`) and `Feedback`/`AppError` (no FK) are correct as-is. Admin reactivation (`PATCH /api/admin/users` with `isActive: true`) now also clears `deletionRequestedAt` in the same update — otherwise the grace window would be un-cancelable. **Export**: new `GET /api/account/export`, a single downloadable JSON (deliberately not CSV/zip — satisfies GDPR Article 20's "structured, machine-readable format" directly and avoids the CSV-formula-injection surface, CLAUDE.md §38.5, entirely) bundling profile fields (no `passwordHash`/tokens), full `Consent` history, entitlement status, workspace, `ImportLog` metadata, full `DashboardSnapshot` content, and the user's current live metrics (`readLatestMetrics` via the same scope-key resolution `app/api/upload/route.ts` uses). New `src/lib/accountLifecycle.ts` (`requestAccountDeletion`/`cancelAccountDeletion`/`exportAccountData`), used by the two new API routes and directly Jest-tested. **"Uploaded-original policy" — verified, not assumed, to have nothing to build**: traced both upload routes fully; raw file bytes are read into memory, parsed, and discarded — only computed `DashboardMetrics` is ever persisted (a filesystem JSON write, not a DB table). No purge job was built for data that provably doesn't exist server-side; documented as a deliberate finding, not an oversight. **Retention enforcement** now covers the two categories the Privacy Policy already promised a concrete window for but had zero enforcement of anywhere — `AuditEvent` (12 months) and `AppError` (90 days, keyed off `lastSeenAt` so actively-recurring errors are never purged) — plus scheduling the *existing* manual-only `applyRetentionPolicy()` (ImportLog/DashboardSnapshot) automatically; a safe no-op by default (`DEFAULT_SETTINGS.retentionDays === -1`). `Consent` (6-year horizon) and `LoginAttempt` (already correctly self-pruning inline on every login/register call) were deliberately left alone — no near-term gap, and CLAUDE.md §5.5 counsels against building unverifiable dead code for a multi-year horizon. **Found and fixed while touching this exact area, not original scope**: `app/api/admin/cleanup/route.ts` (the manual "Run cleanup now" admin button) was reading retention settings via the legacy filesystem-only `readSettings()`, while the actual Settings UI (`POST /api/admin/settings`) saves through the DB-backed `readSettingsForUser`/`writeSettingsForUser` — two disconnected settings stores, meaning an admin's just-saved retention-days change could silently not apply to a manual cleanup run. Fixed with a one-line swap to `readSettingsForUser`, the same source the new cron script also reads from. **Deliberately deferred, named, not silently skipped**: updating `src/lib/legal-i18n/en.ts`'s "contact us" deletion instruction to describe the new self-service flow — per P0B-03's established boundary, editing the substantive 7-language legal-policy text needs real translation review, out of scope for this engineering ticket, and the existing "contact us" text isn't contradicted by adding a self-service option (a superset, not a conflict). New/extended tests: `accountLifecycle.test.ts` (new), `accountDeleteApi.test.ts` (new), `accountExportApi.test.ts` (new), `adminUsers.test.ts` (2 new cases — reactivate clears `deletionRequestedAt`, disabling doesn't touch it). No test for `scripts/purge-expired-data.mjs` itself or `PrivacyTab.tsx`'s new UI — same disclosed, pre-existing gaps (no script-testing precedent for standalone Node scripts in this repo; no jsdom/component-testing infrastructure) as every prior P0-B ticket. Depends on: P0B-03 (done), P0A-06 (done). |
| P0B-05 | Event taxonomy and SDK | P0 | ✅ Done (2026-08-02) | Genuinely fresh subsystem — repo-wide grep confirmed zero prior art (no `anonymous_id`/`pseudonymous`/`session_id`/`event_id`/`schema_version` anywhere), unlike every other P0-B ticket this session. Built the full §4.2 taxonomy (8 domains, 30 named events — Identity, Upload, Value, Navigation, Feedback, Lifecycle, Quality, Payments) as a typed `const` catalog (`src/lib/analytics/eventTaxonomy.ts`, `AnalyticsEventName` union + `isAnalyticsEventName()` guard) and a client SDK (`src/lib/analytics/track.ts`) that assembles the full §6.2 envelope — `event_id` (`crypto.randomUUID()`), `schema_version: 1`, `occurred_at`, `user_id`/`anonymous_id`/`session_id`, `page`/`section`/`component`, `app_version`, `role`, `browser_family`/`browser_major`, `os_family`, `device_category`, `result_status`/`duration_ms`, `properties`. **Scope is deliberately taxonomy + envelope construction only, not delivery** — P0B-06 (IndexedDB batching queue) and P0B-07 (server ingestion) are separate, dependent tickets for exactly this reason; `trackEvent()`'s transport is an injectable function (`configureAnalyticsTransport()`) defaulting to a dev-only `console.debug` stub (true no-op in production) — nothing leaves the browser yet, swappable for the real transport in P0B-06 without touching any call site. **Consent-gated by design, not bolted on**: `src/lib/analytics/consentGate.ts` checks the already-shipped P0B-03 analytics-consent toggle (`GET/POST /api/consent`) before the transport ever fires — default is always no-op (not logged in, undecided, or declined), matching `getConsentStatus()`'s existing fail-closed default. This is also why pre-authentication identity events (`signup_started`, `login_completed` pre-session) aren't wired to real call sites in this ticket — there's no consent mechanism for anonymous visitors yet (that's `P1-06`'s GA4/cookie-banner track); the taxonomy still defines those names for later use. **One real integration point, not a repo-wide sweep**: wired exactly `feedback_opened`/`feedback_submitted` into `FeedbackButton.tsx` as the reference integration — instrumenting the other ~28 events now, while the transport goes nowhere, would touch 10+ files for zero observable benefit; broader instrumentation is named as deliberately deferred to P0B-06/07 or done incrementally as each feature area is next touched. **No new dependency** — this codebase has no `zod` anywhere despite CLAUDE.md's general preference (confirmed via grep; existing routes validate with plain `typeof`/membership checks), so taxonomy validation is a `Set` membership check, matching existing convention; no `ua-parser-js` either — browser/OS/device detection is a small regex extension of `FeedbackButton.tsx`'s pre-existing inline `getBrowserFamily()`, promoted (not duplicated) into the new shared `src/lib/analytics/clientContext.ts` and now imported by `FeedbackButton.tsx` itself (also gains `browser_major`, `os_family`, `device_category`). Pseudonymous `anonymous_id` (`localStorage`, long-lived) and `session_id` (`sessionStorage`, per-browser-session) are lazily created on first `trackEvent()` call, mirroring `currentUser.ts`'s established storage-cache pattern; the consent decision itself is likewise cached client-side (`consentGate.ts`) to avoid a network round-trip on every tracked event — `PrivacyTab.tsx`'s existing analytics toggle now updates that cache immediately on save, and `UserMenu.tsx`'s existing `logout()` clears it, so a toggle or logout takes effect without a reload. New tests: `analyticsTaxonomy.test.ts` (catalog completeness/no-dupes), `analyticsTrack.test.ts` (envelope shape, consent gating, ID stability, unknown-event drop), `analyticsConsentGate.test.ts` (cache/fetch-once/invalidate behavior) — 17 new cases, full suite 132/132 suites, 1200/1200 tests. No component test for the `FeedbackButton.tsx` wiring itself — same disclosed, pre-existing no-jsdom-infrastructure gap as every prior P0-B ticket. Depends on: P0A-08 (done). |
| P0B-06 | IndexedDB event queue | P0 | ✅ Done (2026-08-03) | Genuine fresh subsystem — repo-wide grep confirmed zero `indexedDB`/`sendBeacon`/`visibilitychange` usage anywhere before this. Built `src/lib/analytics/eventQueue.ts` (pure IndexedDB CRUD adapter — `dc-analytics-queue` DB, one `events` store keyed by `event_id`) and `src/lib/analytics/eventFlush.ts` (batching/retry/delivery orchestration), split per CLAUDE.md §5.1 single-responsibility so storage stays independently testable from network/timers. `trackEvent()`'s default transport (P0B-05's inert dev-log stub) is now swapped for "enqueue to IndexedDB" via the existing `configureAnalyticsTransport()` extension point, wired once from a new `AnalyticsQueueInit.tsx` (mirrors `GlobalErrorHandler.tsx`'s exact global-init pattern, mounted in `app/layout.tsx`). **Flush triggers**: 10s interval, a 30-event threshold (within the master plan's 20–50 range), `online` connectivity return, `visibilitychange`-hidden (via `sendBeacon`), and immediately on any quality-domain (`client_error`/`api_error`) event — the master plan's "critical error" trigger. **Real correctness point the master plan's own two rules don't reconcile**: `sendBeacon` has no response, so its flush path never deletes queued events — they're safely re-flushed and only then deleted on the next `fetch`-based flush, since deleting without an ack would violate the ticket's own "delete only server-acknowledged events" requirement. **Scope boundary, resolved with the user before implementation**: `P0B-07` ("server event ingestion — validation, rate limits, ack response, dedup, storage") is a separate dependent ticket, but this ticket's own "delete only server-acknowledged events" promise is unverifiable without a real endpoint — so this ticket also ships a minimal, real `POST /api/events` that implements the master plan's exact `{accepted, rejected}` contract with rate limiting (same `LoginAttempt`-table sliding-window pattern as the pre-existing `/api/events/error`) and per-event shape/taxonomy validation, but **persists nothing** — no new Prisma model, no migration; P0B-07 adds real validation depth, deduplication, and durable storage behind this same contract. **Retry/backoff implementation changed during testing, not as originally planned**: a self-scheduling `setTimeout`-based backoff was built first, but writing `analyticsEventFlush.test.ts` surfaced a real bug — the scheduled retry is a genuine timer that outlives a test's synchronous assertions and fires into a later, unrelated test with whatever mock is then active, corrupting results (and `fake-indexeddb`, added for this ticket, turned out to depend on real timers internally, ruling out Jest fake timers as a workaround). Redesigned backoff as a passive `Date.now()`-checked gate instead — no self-scheduling timer at all, since the existing periodic/online/threshold triggers already re-attempt regularly; simpler and removes the dangling-timer class of bug entirely, not just papers over it in tests. Also confirmed via research: `src/lib/errorReporter.ts`/`app/api/events/error/route.ts` is a separate, already-built, single-event pipeline tagged `P0B-08` (structured error monitoring) — unrelated to this ticket's general product-event queue, not touched, but its rate-limit pattern is reused here. New devDependency `fake-indexeddb` (^6.2.5, Apache-2.0, confirmed via `npm view` and `npm audit` — not implicated in any of the 16 pre-existing findings) — dev-only, zero production/bundle impact, closes what would otherwise be a real gap in testing this ticket's central mechanism (unlike prior disclosed UI-only gaps, IndexedDB persistence is this ticket's actual deliverable). New tests: `analyticsEventQueue.test.ts` (8 cases — CRUD, expiry pruning, max-size eviction), `analyticsEventFlush.test.ts` (6 cases — delete-only-on-ack, network/HTTP failure leaves events queued, beacon path never deletes, empty-queue no-op, 50-event batch cap), `eventsApi.test.ts` (7 cases — accept/reject contract, malformed/oversized batch handling, rate limiting). 21 new cases, full suite 135/135 suites, 1221/1221 tests. No test for `AnalyticsQueueInit.tsx`'s mount wiring or real browser `visibilitychange`/`online` firing — same disclosed, pre-existing no-jsdom-infrastructure gap as every prior P0-B ticket. Depends on: P0B-05 (done). |
| P0B-07 | Server event ingestion | P0 | ❌ Not started | Validation, rate limits, accepted/rejected event ID response, deduplication and storage. Depends on: P0B-06, P0A-06. |
| P0B-08 | Structured error monitoring | P0 | ❌ Not started | Fingerprints, severity, first/last occurrence, affected users, release version, page/component, route, HTTP status, correlation ID, sanitised stack. Connect error to fix version and release note. Never put Jira content, auth secrets, or PII in error logs. Depends on: P0A-07, P0A-08. |
| P0B-09 | Feedback control | P0 | ✅ Done (2026-08-02) | Tracker was badly stale — direct code research found this ~85% already built and tagged `P0B-09` in its own source comments: `src/components/feedback/FeedbackButton.tsx` (accessible, focus-trapped modal, mounted globally in `app/layout.tsx`, excludes only auth-flow pages), `POST /api/feedback` (rate-limited 10/IP/15min, validates category/impact/message, auto-captures `page`/`browserFamily`/`appVersion`/session identity — never Jira data, confirmed via the route's own header comment), `Feedback` Prisma model with full `impactLevel`/7-state `status` workflow, and a complete tour-integrated admin triage UI (`app/admin/feedback/`). Repo-wide grep confirmed the one genuine gap: **screenshot capture** — no `html2canvas`/`getDisplayMedia`/canvas-to-image utility existed anywhere. This ticket closes exactly that gap. Added `html2canvas` (^1.4.1, MIT, confirmed no new `npm audit` findings) as a new dependency — the browser has no built-in "screenshot the current page" API; `getDisplayMedia()` requires a disproportionately heavy OS permission-picker prompt for this use case. **Capture is opt-in and previewed, never automatic** — resolves the tension with "do NOT auto-attach Jira data" directly: the user must explicitly click "Add a screenshot" inside the already-open feedback modal and sees a thumbnail preview (with a Remove option) before submitting, categorically different from a silent automatic data-attachment. New `Feedback.screenshotData String?` column (additive migration `20260802000002_add_feedback_screenshot`, applied and verified via `prisma migrate deploy` against a live Postgres instance) — a plain blob column, not a new blob-storage service or `FeedbackAttachment` table, mirroring the existing `DashboardSnapshot.metricsJson` precedent; unwarranted speculative architecture for "one optional screenshot per feedback item," which is exactly what the tracker line asks for. Client captures at reduced scale (0.6x) and re-encodes as JPEG (quality 0.6) to keep payloads small; `POST /api/feedback` enforces a ~2MB hard max length server-side, rejecting (never silently truncating) anything malformed or oversized. **Real payload-size risk found and fixed before it shipped, not after**: `GET /api/admin/feedback`'s list endpoint (30 rows/page) would otherwise have shipped up to ~30 × several-hundred-KB base64 blobs per page load — fixed with an explicit `select` that strips `screenshotData` and replaces it with a cheap computed `hasScreenshot: boolean`; the actual image is fetched lazily, one at a time, only when an admin clicks, via a new `GET /api/admin/feedback/[id]/screenshot`. Admin UI gained a "📷 View" link (only when `hasScreenshot`) opening a lightbox rendered via `createPortal` (avoids invalid `<div>`-inside-`<tbody>` markup). New/extended tests: `feedbackNotification.test.ts` `TC-FB-11`–`14` (valid screenshot stored, submission without one still works unchanged, malformed/oversized rejected with 400), new `adminFeedback.test.ts` (list never leaks `screenshotData`/does include `hasScreenshot`; screenshot sub-route returns image for admin, 403 for non-admin, 404 when none exists — no positive-path test existed for the list route before this, only a 403 negative check). No component test for the capture UI itself — same disclosed no-jsdom-infrastructure gap as every prior P0-B ticket, and canvas rendering specifically isn't meaningfully testable under Node/Jest regardless. Depends on: P0B-01 (done), P0A-06 (done). |
| P0B-10 | Separate admin application | P0 | ❌ Not started | Admin frontend on port 3001/subdomain, separate auth/session/cookies, no public link, separate build. Every admin request requires server-side auth. Depends on: P0A-05. |
| P0B-11 | Owner Admin bootstrap | P0 | ❌ Not started | Secure deployment/CLI creation of initial owner — no public admin signup page. Depends on: P0B-10. |
| P0B-12 | Admin user management | P0 | ❌ Not started | Invite (one-time expiring link), mandatory MFA, explicit permissions (not role-based), session revocation, audit log. Admin cannot create Owner Admin or grant self additional access. Depends on: P0B-11. |
| P0B-13 | Minimum admin operations | P0 | ❌ Not started | View users, entitlements, uploads, errors, feedback, releases and audit logs from the admin app. Depends on: P0B-10 to P0B-12. |
| P0B-14 | Launch security review | P0 | ❌ Not started | Threat model, dependency scan (npm audit), secrets review, admin tests and abuse controls. Depends on: all P0-B. |
| P0B-15 | Soft-launch readiness test | P0 | ❌ Not started | End-to-end test from signup to expiry, feedback, error and owner review. Depends on: all P0-A/P0-B. |

### 29.3 P1 — Product learning and AI intelligence

| ID | Task | Priority | Status | Notes |
|---|---|---|---|---|
| P1-01 | Admin overview metrics | P1 | ❌ Not started | Activation, successful analysis, Time to First Value, return rate (7-day), feedback volume and error-free sessions. Depends on: P0B-07, P0B-13. |
| P1-02 | Funnels and journeys | P1 | ❌ Not started | Signup-to-value funnel, path analysis, abandonment and filters by role/device/release/source. Depends on: P1-01. |
| P1-03 | Feature usage and weak-area views | P1 | ❌ Not started | Most/least visited pages, sections, reports, filters and role differences. Depends on: P0B-07. |
| P1-04 | Release and communication centre | P1 | ❌ Not started | Release notes, fix links, audience selection, delivery status and preference-aware updates. Signed unsubscribe tokens. Do NOT use "Do not send me an email" as primary preference control. Depends on: P0B-08, P0B-13. |
| P1-05 | Email preferences | P1 | ❌ Not started | Manage preferences, unsubscribe tokens, category history and suppression. Depends on: P1-04. |
| P1-06 | GA4 integration | P1 | ❌ Not started | Consent-aware public acquisition and aggregate conversion events ONLY. Never send: email, phone, username, Jira data, feedback text, raw errors, IP, machine identifiers or internal admin activity to GA4. Depends on: P0B-03, P0B-05. |
| P1-07 | Heatmaps/dead-click MVP | P1 | ❌ Not started | Privacy-safe interaction heatmaps or vetted third-party tool; mask sensitive dashboard areas. Depends on: P0B-05. |
| P1-08 | AI service foundation | P1 | ❌ Not started | Internal port 4100, provider adapter (Ollama + Qwen3.5:4b initial), prompt/model versioning in `ai_prompt_versions` table, JSON schema validation of all output. Ollama on private network — never exposed to internet. Depends on: P0A-06, P0B-10. |
| P1-09 | AI weekly product report | P1 | ❌ Not started | Generate evidence-based 7/30-day report from validated SQL aggregates. Output: type, title, finding, evidence_ids, confidence, classification, recommended_action, success_metric. Depends on: P1-01 to P1-03, P1-08. |
| P1-10 | Feedback embeddings/clusters | P1 | ❌ Not started | Generate embeddings via Ollama embedding model, store in pgvector, group duplicates/similar requests. Depends on: P0B-09, P1-08. |
| P1-11 | AI error correlations | P1 | ❌ Not started | Explain calculated release/browser/page/journey error concentrations. Uses validated counts/rates only — no invented causes. Depends on: P0B-08, P1-08. |
| P1-12 | AI recommendation review | P1 | ❌ Not started | Owner Admin UI: Approve / Reject / Request more evidence / Convert to backlog. No automatic production changes. Depends on: P1-09. |
| P1-13 | Impact measurement | P1 | ❌ Not started | Before/after metric attached to implemented suggestions and release. Depends on: P1-12, P1-04. |
| P1-14 | Admin export/reporting | P1 | ❌ Not started | Export filtered metrics, findings and feedback without exposing restricted personal data. Depends on: P1-01 to P1-03. |
| P1-15 | Billing domain and provider adapter | P1 | ❌ Not started | Plans, prices, subscriptions, orders, entitlements, webhook inbox and provider-neutral BillingProvider interface. Keep provider secrets server-side. Depends on: P0A-06, P0B-01 to P0B-04. |
| P1-16 | Lemon Squeezy integration | P1 | ❌ Not started | Hosted checkout for one-time/subscription plans, signed webhooks, renewals, cancellation, refunds. Verify Jordan account approval and current commercial terms before production. Depends on: P1-15. |
| P1-17 | PayPal Checkout integration | P1 | ❌ Not started | Current PayPal JS SDK + Orders REST API, server-side capture (never browser redirect alone), signed webhook verification, refund and cancellation handling. Depends on: P1-15. |
| P1-18 | Payments admin and reconciliation | P1 | ❌ Not started | Owner views for checkout conversion, subscriptions, failures, refunds, disputes, provider fees and entitlement mismatches. Depends on: P1-16, P1-17, P0B-13. |
| P1-19 | Payment analytics and AI evidence | P1 | ❌ Not started | Sanitised payment funnel metrics for product analysis. NO card credentials or raw provider payloads in AI evidence. Depends on: P1-18, P1-08. |

### 29.4 P2 — Later optimisation (deferred)

| ID | Task | Priority | Status | Notes |
|---|---|---|---|---|
| P2-01 | Sampled session replay | P2 | ⏸ Deferred | Only after privacy masking is verified and sensitive dashboards are excluded. |
| P2-02 | Anomaly detection | P2 | ⏸ Deferred | Statistical detection of unusual changes in conversion, errors and feature use. Requires sufficient baseline data. |
| P2-03 | Experiment framework | P2 | ⏸ Deferred | Controlled onboarding/UX experiments with primary and guardrail metrics. |
| P2-04 | Role-adaptive recommendations | P2 | ⏸ Deferred | Role-specific next actions and dashboard guidance. |
| P2-05 | Advanced AI model routing | P2 | ⏸ Deferred | Use larger Qwen3.5:9b only for complex reports; keep 4b for classification. |
| P2-06 | SSO/hardware keys/VPN | P2 | ⏸ Deferred | Enterprise admin-access options when operational need appears. |
| P2-07 | Predictive engagement risk | P2 | ⏸ Deferred | Only after sufficient consented representative longitudinal data exists. |
| P2-08 | Automated backlog drafting | P2 | ⏸ Deferred | AI drafts tickets with evidence, but owner approves before creation. |

### 29.5 Soft-launch risk register (from Master Plan v1.1)

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Incorrect Jira calculations produce misleading conclusions | Medium | Critical | Regression datasets, calculation reference, unit/integration tests, release blocking on material variance. Roll back affected release and label impacted reports. Owner: Product / P0-A |
| R-02 | Uploaded Jira files expose personal or confidential data | Medium | Critical | Minimise fields, encrypt, isolate tenants, delete originals by policy, redact logs/AI prompts, test access controls. Activate incident response and affected-data deletion. Owner: Security / P0 |
| R-03 | User accesses another user's workspace by guessing IDs | Low | Critical | Server-side tenant scoping, object-level authorisation, negative tests, immutable audit logs. Revoke sessions and investigate all related access. Owner: Engineering / P0-A |
| R-04 | Free entitlement abused through repeated accounts/automated uploads | High | Medium | Verified accounts, rate limits, risk signals, file hashes, manual review. Never hard-block by shared IP. Throttle or suspend suspicious patterns. Owner: Product/Security / P0-B |
| R-05 | IP/device anti-abuse rules falsely block legitimate users | Medium | High | Account-first entitlement and soft scoring; clear appeal/support path. Restore entitlement after owner review. Owner: Product / P0-B |
| R-06 | Analytics collection becomes excessive or non-compliant | Medium | High | Purpose-limited event taxonomy, consent, minimisation, retention and deletion controls. Disable non-essential collection until remediated. Owner: Privacy / P0-B |
| R-07 | Event loss, duplication or ordering errors distort funnels | Medium | High | UUIDs, IndexedDB queue, acknowledgements, schema validation, idempotency and reconciliation jobs. Rebuild aggregates from raw accepted events. Owner: Engineering / P0-B |
| R-08 | Admin application or account is compromised | Low | Critical | Separate app/session, MFA, least privilege, short sessions, re-authentication, rate limits, audit alerts. Revoke sessions/keys and rotate secrets immediately. Owner: Owner/Security / P0-B |
| R-09 | Error logs, GA4 or AI prompts leak Jira content or PII | Medium | Critical | Allowlisted schemas, sanitisation tests, masking and provider separation. Stop affected pipeline and purge prohibited records. Owner: Engineering/Privacy / P0–P1 |
| R-10 | AI invents causes, features or priorities not in evidence | High | High | Validated aggregates, evidence IDs, strict JSON schema, confidence, mandatory owner review. Reject recommendation and improve prompt/test set. Owner: Product AI / P1 |
| R-11 | Local AI model too slow or consumes excessive server resources | Medium | Medium | Small model, scheduled workers, queue limits, caching and provider adapter. Defer reports or move approved workloads to stronger infrastructure. Owner: Engineering / P1 |
| R-12 | Low soft-launch traffic produces unreliable AI comparisons | High | Medium | Show sample size, confidence and insufficient-evidence states. Delay automated conclusions until thresholds are met. Owner: Product / P1 |
| R-13 | Users do not trust uploading Jira exports | Medium | High | Transparent privacy/retention notice, demo data, calculation explanations, concise onboarding, Time-to-First-Value optimisation. Offer deletion and support. Owner: Product/UX / P0–P1 |
| R-14 | Lemon Squeezy/PayPal approval, country capability or fees differ from assumptions | Medium | High | Verify legal entity, supported business, payouts, currencies and commercial terms before production. Keep provider adapter and fallback manual invoicing. Owner: Owner/Finance / P1 |
| R-15 | Forged, duplicate or out-of-order payment webhooks create incorrect entitlements | Medium | Critical | Signature verification, provider event uniqueness, idempotent state machine, server capture and reconciliation. Freeze affected entitlement changes and replay verified events. Owner: Engineering / P1 |
| R-16 | Refund, dispute or cancellation not reflected in product access | Medium | High | Explicit entitlement policy, webhook handling, daily reconciliation and owner exception queue. Correct access and contact affected user. Owner: Product/Finance / P1 |
| R-17 | Payment credentials or card data accidentally logged or stored | Low | Critical | Hosted checkout, secrets vault, strict log redaction, no card fields and security tests. Rotate credentials, purge logs and follow incident response. Owner: Security / P1 |
| R-18 | Single-owner dependency delays support, release response or security action | High | High | Runbooks, backup administrator, alerts, documented recovery and least-privilege delegation. Activate approved backup admin. Owner: Owner / All |
| R-19 | Third-party analytics/payment/AI dependency changes price, terms or availability | Medium | High | Adapters, data export, documented replacement path and minimal vendor-specific coupling. Switch provider or disable non-core feature. Owner: Architecture / P1–P2 |
| R-20 | Hosting, storage, email, AI or payment costs exceed early revenue | Medium | High | Usage budgets, quotas, lifecycle deletion, scheduled AI and unit-economics dashboard. Reduce free limits or pause costly optional workloads. Owner: Owner/Product / P1 |

---

*Delivery Clarity — Ali Delivery Intelligence — Master TODO aligned with the full Claude prompt and corrected with missing prompt details.*
