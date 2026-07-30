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

**⚠️ Captured directly against the pipeline functions (`parseJiraFile` → `mergeIssueArrays` →
`validateIssueData` → `calculateDashboardMetrics`), not through a live HTTP upload.** The dev server
could not be reliably reached in the sandboxed agent environment this pass was run in (a plain
`GET /api/health` timed out after 2+ minutes with no response) — so these numbers exclude HTTP/
multipart parsing, the Next.js route layer, and the Prisma `ImportLog` transaction/write. They cover
exactly the three CPU-bound legs newly instrumented above (parse / merge+validate / metrics calc),
run three times each for a range rather than trusting a single sample:

| Rows | Parse | Merge+validate | Metrics calc | Total (3 legs) |
|---|---|---|---|---|
| 3,000 | ~220ms | ~2-5ms | ~190ms | ~420ms |
| 5,000 | ~385-425ms | ~4-5ms | ~290-310ms | ~700-730ms |
| 7,000 | ~585ms | ~8ms | ~400ms | ~990ms |

Scaling is roughly linear across the 3k-7k range, as expected for a single-pass parse and the
`flowItemByKey` Map / `parseDate` memoization optimizations already in `metrics.service.ts`. No
degradation cliff observed in this range.

**Environment**: this sandboxed execution environment — **not** a real developer laptop, and
**not** the production Render instance. These numbers are a first, rough signal that the pipeline
scales linearly rather than blowing up at 5-7k rows; they are explicitly **not** the final,
representative-environment measurement CLAUDE.md §40 asks for.

## What this pass does NOT cover — explicit open follow-ups

1. **Full HTTP round-trip + DB write time.** The live-server run (upload via the real
   `POST /api/upload` route, reading the resulting `ImportLog.processingTimeMs` /
   `parseTimeMs`/`mergeValidateTimeMs`/`metricsCalcTimeMs` from the database) could not be executed
   in this pass — the instrumentation is in place and ready; someone with a working local dev
   environment should run `npm run dev`, upload a generated CSV through the real UI, and record the
   `metadataJson` values from that `ImportLog` row.
2. **Excel export timing** (`[export] buildInsightWorkbook: …ms`) and **dashboard render timing**
   (`[dashboard] metrics-loaded→paint`, `[priority-attention] filter→re-render`) — both require a
   live browser session. The `console.log` instrumentation is in place; trigger the export button
   and the priority-attention filter chips with a large dataset loaded, and read the values from the
   browser DevTools console.
3. **Production (Render) environment measurement.** Not attempted in this pass — dev-machine (or,
   here, sandbox-machine) numbers are not representative of production and must not be quoted as
   production SLAs or final project budgets.
4. **LCP / INP / CLS (Web Vitals).** CLAUDE.md §40's targets (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1) were
   **not measured by this pass** — that would require adding the `web-vitals` package and a
   reporting pipeline that doesn't exist today, scoped out as materially larger than this pass's
   budget. Listed here as aspirational targets only, not something this document claims to have
   verified.

**CLAUDE.md §40 is therefore only partially satisfied by this pass** — do not read this document as
"performance budgets: done." It establishes the instrumentation, the generator, and a rough
CPU-bound-legs baseline; the four items above remain open.
