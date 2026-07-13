# Delivery Clarity — Duplicate Content Map (Checkpoint 4)

**Status: COMPLETE** for the candidates identified across Checkpoints 1–3. This file classifies each candidate pair/group; it does **not** make removal/merge decisions — those, with full safety-check reasoning, are in `04-remove-merge-keep.md`. IDs here (`DUP-NN`) are cross-referenced from that file.

**Evidence basis:** Direct code inspection (grep + read) of both/all pages in every pair, their imports, and their consuming/linking files. No rendered/visual diff was performed (blocked app-wide, see `00-audit-control.md` §4) — "content diff" below means comparing source code sections, not comparing screenshots.

## Classification categories used

| Category | Meaning |
|---|---|
| **True Duplicate** | Same purpose, same calculation, one page's content is a strict subset of the other's with no unique value |
| **Functional Duplicate** | Same underlying data source, materially different visualization/workflow — neither is a strict subset |
| **Overlapping-Distinct** | Partial data/topic overlap, genuinely different primary purpose |
| **Legitimate Summary-Detail Split** | One page is an intentionally condensed teaser of one or more detail pages |
| **Coincidental / Intentional-Parallel** | Similar name or structure by design, not a redundancy risk |

---

## Summary table

| ID | Candidate | Classification | Severity of the risk (not a removal verdict) |
|---|---|---|---|
| DUP-01 | `/readiness` vs `/release-readiness` | **True Duplicate** | P1 — undiscoverable, actively-wired duplicate route |
| DUP-02 | `/data-quality` vs `/dashboard/data-quality` | Overlapping-Distinct | P2 — shared name, shared raw data, independently reimplemented |
| DUP-03 | `/flow-health` vs `/dashboard/flow-health` | Functional Duplicate | P3 — same data, different workflow; display names already disambiguated ("Flow Health" vs "Flow Health Table"), only the URL path segment collides |
| DUP-04 | `/trends` vs `/dashboard/trends` | Overlapping-Distinct (name collision only) | P2 — naming/discoverability risk, not a data duplicate |
| DUP-05 | `/promo` vs `/landing` | Intentional-Parallel | P3 — maintenance-coupling risk, not redundancy |
| DUP-06 | `/charts` "Issue Types" vs `/delivery-mix` | Functional Duplicate | P2 — `/delivery-mix` is a richer superset |
| DUP-07 | `/dashboard/data-quality`'s "Delivery Composition" donut vs `/charts`' own "Delivery Composition" widget | **True Duplicate** | P2 — identical 5-bucket status logic, duplicated onto an unrelated page |
| DUP-08 | `/summary` vs `/dashboard/key-metrics` + `/dashboard/priority-attention` | Legitimate Summary-Detail Split | P3 — working as intended; one code-reuse opportunity noted |
| DUP-09 | `/privacy` vs `/terms` | Intentional-Parallel (structural, not content) | P3 — technical/component duplication, Checkpoint 5 territory |

---

## DUP-01 — `/readiness` vs `/release-readiness` — True Duplicate

Both call `calculateReleaseReadiness()` from the same service (`app/readiness/page.tsx:9`, `app/release-readiness/page.tsx:12`) against the same `ReleaseReadinessSummary` type. `/readiness` (102 lines) renders summary chips + a per-release verdict list — every piece of which is reproduced inside `/release-readiness` (516 lines), which additionally computes 7 global quality-gate checks and a selectable per-release detail drawer. **Nothing on `/readiness` is exclusive to it.**

Safety-relevant facts (full detail in `04-remove-merge-keep.md` DUP-01): `/readiness` is absent from both nav registries but is still linked from `app/landing/components/FeatureUniverse.tsx:18` (a public feature tile) and is independently listed in `middleware.ts` `PROTECTED`/matcher and `src/lib/roles.ts` `DELIVERY_ROUTES` (present for 5 of 6 roles — `c_level` is excluded, see `06-role-based-review.md`).

## DUP-02 — `/data-quality` vs `/dashboard/data-quality` — Overlapping-Distinct

Both read `metrics.dataQuality`/`metrics.fieldImpacts`, but `/data-quality` uses the typed `DataQualityResult`/`FieldImpactReport` contract and adds a Field Impact accordion + Recommended Actions list; `/dashboard/data-quality` is `// @ts-nocheck`, reads the same fields via untyped `any` access, and instead adds a severity filter toolbar, CSV export, and an unrelated "Delivery Composition" donut (see DUP-07). Neither page is a subset of the other — they share a data source and general topic but diverge in both content and code quality (one is type-safe, one bypasses TypeScript entirely).

## DUP-03 — `/flow-health` vs `/dashboard/flow-health` — Functional Duplicate

Both operate on `metrics.flow`/`flow.items`. `/flow-health` = an aggregate "Bottleneck Map" (status-grouped WIP) + Aging Distribution + Blockers/Critical cards — a triage overview. `/dashboard/flow-health` = a dense, 9-filter, sortable, paginated, CSV-exportable row-level table — an issue-by-issue drill-down. Same data, same general subject, genuinely different workflows; neither subsumes the other.

## DUP-04 — `/trends` vs `/dashboard/trends` — Overlapping-Distinct (naming collision only)

Re-confirmed in Checkpoint 4: `/trends` fetches `/api/trends` → cross-upload historical `TrendPoint[]` data (longitudinal, multiple uploads over time). `/dashboard/trends` derives a `sprint`/`quarter` toggle view from the single currently-loaded `DashboardMetrics` object. These are genuinely different data sources — this is purely an IA/naming problem (two different "Trends," same word), not a content duplication. Notable complication: `/dashboard/trends` is itself the merge target for two retired stub routes (`quarter-statistics`, `sprint-status`), so its identity is already overloaded independent of the naming collision with the top-level `/trends`.

## DUP-05 — `/promo` vs `/landing` — Intentional-Parallel

`/landing`'s own code comment (`app/landing/page.tsx:7-12`) states its section order "mirrors /promo's proven narrative arc." Confirmed structurally parallel (hook → concept → steps → value → proof → trust → CTA on both) but implemented with entirely separate components and copy, and serving different audiences: `/promo` is explicitly unauthenticated/public (excluded from `middleware.ts`'s matcher by design, per its own top-of-file comment) for external sharing; `/landing` is authenticated, uses the real `AppShell`, and links into live app routes (`/readiness`, `/charts`, `/summary`). Both are linked from the shared `AppShell` footer and from `/login` respectively — this is not a redundant-route risk, but the two pages' copy is coupled by design and will drift out of sync if only one is edited.

## DUP-06 — `/charts` "Issue Types" widget vs `/delivery-mix` — Functional Duplicate

`/charts`' "Issue Types" widget (`app/charts/page.tsx:672-693`) is raw, unweighted Jira Issue Type field counts. `/delivery-mix` (`app/delivery-mix/page.tsx:117-134`) re-categorizes the same underlying issues into semantic buckets (feature/bug/test/task/epic/spike/other) and adds per-category completion %, health, and cycle-time analysis — a materially richer superset of the same underlying breakdown, not an identical duplicate, but functionally covers (and exceeds) what the `/charts` widget shows.

## DUP-07 — `/dashboard/data-quality`'s composition donut vs `/charts`' own composition widget — True Duplicate

This is a distinct finding from DUP-06 (a different `/charts` widget). `/dashboard/data-quality`'s "Delivery Composition" donut (`app/dashboard/data-quality/page.tsx:81-95`) and `/charts`' separate "Delivery Composition" widget (`app/charts/page.tsx:628-648`) use the **identical** 5-bucket logic (`done/active/warning/critical/other`, same field source `flow.items[].status`/`.health`, same colors). This is the same widget, structurally, rendered on two pages — and it isn't even a data-quality concept (status composition, not field completeness), so its presence on `/dashboard/data-quality` specifically is a topical mismatch as well as a duplicate.

## DUP-08 — `/summary` vs `/dashboard/key-metrics` + `/dashboard/priority-attention` — Legitimate Summary-Detail Split

Confirmed by direct comparison: `/summary`'s 4 KPI cards are a strict subset of `/dashboard/key-metrics`' 6 (which adds Story Points Breakdown, Flow Metrics detail, a period filter, and CSV export). `/summary`'s "Smart Actions preview" (top 3) is a strict subset of `/dashboard/priority-attention`'s full list (same 5 generation rules, `priority-attention` adds a 6th — blocked-items — plus full tables and CSV export). This is the working-as-intended "teaser → detail" pattern, not a duplication risk. One genuine finding: `/summary`'s `smartActions` logic (`app/summary/page.tsx:52-73`) and `/dashboard/priority-attention`'s `actions` logic (`app/dashboard/priority-attention/page.tsx:62-103`) are independently reimplemented rather than sharing a function — a code-reuse opportunity (Checkpoint 5/9 territory), not a content problem.

## DUP-09 — `/privacy` vs `/terms` — Intentional-Parallel (technical duplication, not content)

Carried forward from Checkpoint 1: near-identical component structure (`RenderBlock`, `EFFECTIVE_DATE`/`VERSION` constants duplicated independently in each file) across both legal pages. This is expected — the two documents are legitimately different legal content — but the *implementation* duplicates rendering logic that could be a shared component. Flagged here for completeness; belongs to Checkpoint 5's technical-duplication scope, not a content-removal candidate.

---

## Candidates investigated and found NOT to be duplicates (stated plainly, not omitted)

- **Scrum/Kanban metric views** (`/sprint-kanban`'s two modes vs. `/flow-health`): reviewed during Checkpoint 3's calculation trace — confirmed operating on strictly disjoint issue sets by construction (sprint-tagged vs. not). Not a duplicate.
- **`/dashboard/epic-readiness` vs `/roadmap`**: confirmed in Checkpoint 1 as non-duplicate — different computation (per-epic risk/completion lens vs. epic-timeline forecast), different source files. Re-confirmed, not re-litigated here.
- **`/explore` vs `/work-explorer`**: different primary purpose (relationship/hierarchy graph search vs. flat filterable issue table) despite both operating over `metrics.flow.items` — not classified as a duplicate pair; noted instead as a feature-parity gap (`/work-explorer` lacks the export capability `/explore` has) in `05-missing-product-elements.md`.
