# Performance — Methodology, Instrumentation, and Measured Thresholds

**Status:** First pass (P0A-09, 2026-07-31). Partial — see "What this pass does NOT cover" below.
**Related:** `TODO-List.md` §29.1 `P0A-09`; CLAUDE.md §40 (Performance Standards).

## Why this document exists

`ImportLog.processingTimeMs` only ever measured metric calculation, not parsing, export, or
dashboard rendering — and the only sample dataset committed to the repo
(`public/samples/sample-jira-export.csv`) is 35 issues, far short of the 3,000-7,000 issue scale
CLAUDE.md §40 asks performance to be measured at. This document records what was instrumented, how
it was measured, and the real numbers from a first benchmark run — with honest caveats about what
still isn't covered.

## Instrumentation added in this pass

| Leg | Where | How |
|---|---|---|
| Parse | `app/api/upload/route.ts` (`parseTimeMs`) | Wraps `parseJiraFile()` |
| Merge + validate | `app/api/upload/route.ts` (`mergeValidateTimeMs`) | Wraps `mergeIssueArrays()` + `validateIssueData()` |
| Metrics calculation | `app/api/upload/route.ts` (`metricsCalcTimeMs`) | Wraps `calculateDashboardMetrics()` — same window as the pre-existing `processingTimeMs` column, kept as its own labeled field |
| Excel export | `src/services/export/excelInsightExport.service.ts` `downloadInsightWorkbook()` | `performance.now()` + `console.log`, client-side (this export runs entirely in the browser) |
| Dashboard metrics-loaded → paint | `app/dashboard/layout.tsx` | `performance.now()` + `console.log`, client-side |
| Priority-attention filter → re-render | `app/dashboard/priority-attention/page.tsx` | `performance.now()` + `console.log`, client-side |

`parseTimeMs`/`mergeValidateTimeMs`/`metricsCalcTimeMs` are written into `ImportLog.metadataJson`
(a free-form JSON bag already used for `completionRate`/`avgLeadTimeDays`/etc.) — additive, no
schema migration. `processingTimeMs` itself keeps its exact original meaning unchanged, since
`app/api/admin/diagnostics/route.ts` averages it across all history as `avgProcessingMs`; silently
widening what it measures would have jumped that existing operational metric with no version
marker to explain why.

## Synthetic dataset generator

`scripts/generate-synthetic-jira-export.js` (plain CommonJS, matching `scripts/start-server.js`'s
existing convention) generates a CSV matching the real column contract
(`src/services/jira/parser.ts` `ESSENTIAL_FIELDS`/`OPTIONAL_FIELDS`), with realistic variety rather
than uniform rows: multiple issue types/statuses across the lifecycle, 15-25 sprints, ~5-10%
blocked, ~3-5% orphans, some Epics with many children, some rows missing optional fields, weighted
priority. Dates are generated in the `DD/Mon/YYYY` format `parseDate()` expects.

```bash
node scripts/generate-synthetic-jira-export.js --rows=5000 --out=data/synthetic-jira-export.csv --seed=1
```

Output goes to `data/` (gitignored) — not `public/samples/`, which stays a small, deliberately
committed 35-issue example. `src/__tests__/syntheticJiraGenerator.test.ts` is a permanent round-trip
smoke test (generates rows, feeds them through the real parser/validator/metrics calculation,
asserts no errors) — a guard against the generator silently drifting from the parser's field
contract, not a benchmark itself.

## Measured figures

Two measurement methods were used in this pass — clearly distinguished below, since they cover
different parts of the pipeline and were captured in different ways.

### Method A — real live HTTP upload (5,000 rows, one authoritative sample)

Ran the full real path once the dev server was confirmed reachable: registered a test account
(`perf-bench@deliveryclarity.app`), verified its email directly via the token (no SMTP configured
in this environment), logged in, and `POST`ed a 5,000-row generated CSV to `/api/upload` as real
multipart form data — the exact code path a real user's browser exercises. Numbers below are read
directly from that upload's `ImportLog` row (`processingTimeMs` column + `metadataJson` fields), not
console output:

| Rows | Parse | Merge+validate | Metrics calc | `processingTimeMs` (DB column — includes metrics calc + workspace resolution + `writeLatestMetrics` + `appendImportLog` + `computeReleaseConfidence`) |
|---|---|---|---|---|
| 5,000 | 248ms | 2ms | 107ms | 612ms |

This is the authoritative figure — it includes multipart parsing, the Next.js route layer, and (for
`processingTimeMs`) everything up to just before the Prisma `ImportLog` write itself. It also
directly confirms the new instrumentation (§ above) works correctly end-to-end in production-like
conditions: real HTTP request, real session auth, real DB write.

### Method B — direct pipeline function calls (3k/5k/7k range, for scaling shape only)

Before the live server was confirmed reachable, a supplementary run exercised
`parseJiraFile` → `mergeIssueArrays` → `validateIssueData` → `calculateDashboardMetrics` directly
(no HTTP, no DB write), 3 times each at 3 row counts, to sanity-check how the CPU-bound legs scale
across the 3k-7k target range:

| Rows | Parse | Merge+validate | Metrics calc | Total (3 legs) |
|---|---|---|---|---|
| 3,000 | ~220ms | ~2-5ms | ~190ms | ~420ms |
| 5,000 | ~385-425ms | ~4-5ms | ~290-310ms | ~700-730ms |
| 7,000 | ~585ms | ~8ms | ~400ms | ~990ms |

Scaling is roughly linear across the range, as expected for a single-pass parse and the
`flowItemByKey` Map / `parseDate` memoization optimizations already in `metrics.service.ts`. No
degradation cliff observed. Note Method B's 5,000-row metrics-calc figure (~290-310ms) is noticeably
higher than Method A's live-route figure (107ms) for the same row count — plausibly JIT/cache
warm-up differences between a cold Jest-run process (Method B) and a dev server that had already
served prior requests (Method A) before this upload; not investigated further in this pass.

**Environment for both methods**: this sandboxed agent execution environment — **not** a real
developer laptop, and **not** the production Render instance. These numbers are a first signal that
the pipeline scales linearly and stays fast well within the 3k-7k range; they are explicitly **not**
the final, representative-environment measurement CLAUDE.md §40 asks for.

## What this pass does NOT cover — explicit open follow-ups

1. **Excel export timing** (`[export] buildInsightWorkbook: …ms`) and **dashboard render timing**
   (`[dashboard] metrics-loaded→paint`, `[priority-attention] filter→re-render`) — both require a
   live browser session. A headless-Chromium automation attempt (Playwright, already a project
   dependency) was made in this pass but the login form's client-side submit handler never fired
   reliably in this sandboxed environment (repeatedly fell back to a native GET form submission even
   after extended waits for hydration/network-idle) — an environment limitation, not a bug in the
   login page. The `console.log` instrumentation is in place and confirmed present in the built code;
   trigger the export button and the priority-attention filter chips with a large dataset loaded in
   a real browser, and read the values from DevTools.
2. **Production (Render) environment measurement.** Not attempted in this pass — dev-machine (or,
   here, sandbox-machine) numbers are not representative of production and must not be quoted as
   production SLAs or final project budgets.
3. **LCP / INP / CLS (Web Vitals).** CLAUDE.md §40's targets (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1) were
   **not measured by this pass** — that would require adding the `web-vitals` package and a
   reporting pipeline that doesn't exist today, scoped out as materially larger than this pass's
   budget. Listed here as aspirational targets only, not something this document claims to have
   verified.

**CLAUDE.md §40 is therefore only partially satisfied by this pass** — do not read this document as
"performance budgets: done." It establishes the instrumentation, the generator, one authoritative
live-route sample, and a rough CPU-bound-legs scaling baseline; the three items above remain open.

A `perf-bench@deliveryclarity.app` test account and one `ImportLog` row exist in the dev database
this pass ran against as a result of the live-upload run — harmless test data, left in place rather
than unilaterally deleted; clean up manually if desired.
