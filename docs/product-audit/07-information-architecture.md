# Delivery Clarity — Information Architecture Review (Checkpoint 4)

**Status: COMPLETE.** Reviews the two navigation registries (`DC_NAV_GROUPS` in `src/components/dc-shell/navigation.ts`, and `DashboardNavSidebar`'s `ROUTE_ACCESS` in `src/components/dashboard/DashboardNavSidebar.tsx`) for structure, naming clarity, grouping logic, and findability — cross-referencing the duplicate/role findings from `02-duplicate-content-map.md` and `06-role-based-review.md` where they intersect with IA. Authored directly by the lead auditor, who maintained both registries across the preceding work session.

**Evidence basis:** Direct code inspection of both registries and the page-level headings/titles of every route they reference, verified this checkpoint (not assumed from earlier checkpoints).

---

## A. Structure overview

`DC_NAV_GROUPS` has 6 groups, 34 items total: Analytics (6), Delivery (6), Planning (3), Data (5), Administration (9, itself subdivided into "Activity"/"Observability"/"Configure" sections via an internal `section` field), Reference (5). `DashboardNavSidebar`'s `ROUTE_ACCESS` is a separate, flat 9-item registry for `/dashboard/*` sub-pages only, with no sub-grouping.

This two-registry structure is itself a real IA decision worth naming explicitly: the app has **two independent, differently-shaped navigation systems** (top nav groups vs. a dashboard sidebar) that a user must mentally reconcile — e.g. "Full Report" in the top nav (Analytics group) *is* the entry point into the second navigation system entirely. This is a reasonable pattern for an app with a dense sub-dashboard (comparable to e.g. a settings-within-settings pattern), not inherently a flaw, but it's the structural reason several of this checkpoint's naming/collision findings exist in the first place — two registries independently naming things means two chances to name them differently.

---

## B. Naming collisions — verified against actual rendered page headings, not just route paths

This checkpoint re-verified each of the three route-name collisions flagged in Checkpoint 1 by reading the actual `<h1>`/page-title text each route renders, not just comparing URL slugs. Results are more nuanced than Checkpoint 1's initial framing:

| Pair | Top-nav label | Sidebar label | Rendered page title | Verdict |
|---|---|---|---|---|
| `/flow-health` vs `/dashboard/flow-health` | "Flow Health" | "Flow Health Table" | "Flow Health" vs. "Flow Health Table" | **Already disambiguated at every user-visible layer.** Only the URL path segment (`flow-health`) is shared — see `04-remove-merge-keep.md` R-03 (downgraded from Checkpoint 1's original concern). |
| `/trends` vs `/dashboard/trends` | "Trends" (both registries — top nav AND sidebar use the identical word) | "Trends" | "Upload-to-Upload Trends" (`/trends`) vs. "Trends" (`/dashboard/trends`) | **Collision exists specifically in navigation, resolves after the click.** Both nav entries say plain "Trends" with no distinguishing sub-label visible before navigating; a user cannot tell them apart from the nav alone, even though the destination pages, once reached, are clearly different (one explicitly says "Upload-to-Upload" in its own heading). |
| `/data-quality` vs `/dashboard/data-quality` | "Data Quality" | "Data Quality" | "Data Quality" (identical, both pages) | **Unresolved collision at every layer** — nav labels and rendered page titles are word-for-word identical. This is the one genuine, still-open naming problem of the three. |

### Finding: `/data-quality` naming collision is real and unresolved
```text
Finding: Both /data-quality and /dashboard/data-quality use the identical nav label and identical rendered page <h1>/title "Data Quality," with no distinguishing sub-text visible in either navigation registry.
Evidence: navigation.ts:74 (title: 'Data Quality', desc: 'Field confidence scores'); DashboardNavSidebar.tsx:205 (title="Data Quality"); app/data-quality/page.tsx:152 (<h1>Data Quality</h1>); app/dashboard/data-quality/page.tsx:163 (title="Data Quality").
Why it matters: unlike the /flow-health pair (resolved) and the /trends pair (resolves after navigation), a user choosing between "Data Quality" in the top nav and "Data Quality" in the dashboard sidebar has zero information to distinguish them before clicking either — and per 02-duplicate-content-map.md DUP-02, the two pages genuinely do show overlapping-but-different content, so guessing wrong costs real time.
Affected users: all roles — this is the most severe of the three naming collisions precisely because it's the only one still fully unresolved.
Severity: P2
Confidence: High confidence (verified against actual rendered <h1> text this checkpoint, not inferred)
Recommendation: rename one of the two — e.g. keep "Data Quality" for the standalone page (which is the more complete, typed-contract version per DUP-02) and rename the dashboard sub-page to something distinguishing its filter/export/composition focus, such as "Quality & Composition" or "Data Quality (Filtered View)." Not acted on in this audit — a naming decision for Checkpoint 6/product review.
```

### Finding: `/trends` nav-level collision, resolved only after navigation
```text
Finding: Both nav registries label their respective Trends entries with the plain word "Trends" and no distinguishing description visible at a glance in the sidebar (the top-nav item does have a desc: 'Upload-over-upload change' subtitle per navigation.ts:40, but the sidebar item has no equivalent subtitle beyond a data-driven chip).
Evidence: navigation.ts:40; DashboardNavSidebar.tsx:208 (title="Trends", meta="Sprints · quarters" — the sidebar DOES have a distinguishing meta line, just easy to miss next to the top-nav's identically-worded label); app/trends/page.tsx:85 vs. app/dashboard/trends/page.tsx:94.
Why it matters: less severe than the Data Quality collision because the sidebar's meta text ("Sprints · quarters") does hint at the difference, and the destination pages are clearly distinct once reached — but a first-time user scanning both navigation surfaces for "Trends" still can't tell which one shows historical uploads vs. the current dataset without reading the smaller meta text or clicking through.
Affected users: all roles, primarily first-time or infrequent users who haven't already learned which "Trends" is which.
Severity: P3
Confidence: High confidence
Recommendation: no page change needed (content is fine) — consider adding a short subtitle to the top-nav "Trends" item analogous to the sidebar's "Sprints · quarters" meta, e.g. distinguishing "cross-upload history" from "current dataset." Not acted on in this audit.
```

---

## C. Route findability gap: `/readiness`

Already the subject of `04-remove-merge-keep.md` R-01 (recommended merge/redirect) and `06-role-based-review.md` §B/C (role-access detail) — recorded here specifically as an IA finding: `/readiness` is the **only one of 64 routes with zero representation in either navigation registry** while still being fully protected/reachable for 5 of 6 roles (`01-app-inventory.md` §Summary counts). This is the single clearest "hard-to-discover functionality" finding in the whole audit — the exact failure mode Phase 3/Objective list of this audit was designed to catch. No other orphan-from-nav route was found among the 64.

---

## D. Grouping logic review

- **Analytics group's "Full Report" item** (`/dashboard`, `navigation.ts:38`) is itself a redirect stub to `/dashboard/priority-attention`, and its `desc` reads "All metrics & filters" — already flagged in `01-app-inventory.md` as a description that doesn't match the actual destination (a single filtered view, not a comprehensive report). Re-confirmed this checkpoint, not a new finding, but it is squarely an IA-labeling problem: the *group placement* (Analytics) and *item description* both promise something the redirect target doesn't deliver.
- **The Data group's admin-only relevance**: `/work-explorer`, `/data-quality`, `/snapshots`, `/column-mapping`, `/backend` are grouped together as "Data" — a coherent grouping by subject matter. Per `06-role-based-review.md`, this entire group disappears for `c_level` (empty-group auto-removal). This is intentional and not a bug, but worth flagging as a pattern: no other group is at risk of fully disappearing for any role (Analytics/Planning are universal; Delivery/Administration/Reference always retain at least one visible item per role), which makes Data's all-or-nothing visibility a structural outlier worth a deliberate product check-in (is losing the entire group the right granularity for `c_level`, versus losing just the items least relevant to that persona?).
- **Administration group's internal `section` subdivision** ("Activity"/"Observability"/"Configure") is a good example of grouping that scales well — 9 items would be a flat wall of links without it. No equivalent internal structure exists in the Delivery group (6 items) or Data group (5 items), which are comparably sized but flat. Not a defect, just an inconsistency in how much internal structure similarly-sized groups get.
- **Reference group mixes audiences**: `/members` (org directory), `/landing` (marketing), `/glossary` and `/help` (self-serve documentation), and `/developer` (technical/API docs, admin-only) are all grouped as "Reference" despite serving distinct purposes (one is a people-directory, one is marketing, two are documentation, one is developer tooling). This is a coincidental-grouping pattern (things that don't fit elsewhere collected under one label) rather than a designed information architecture — low severity since each item is still individually findable, but worth naming as the least conceptually coherent of the 6 groups.

---

## E. Positive findings (stated plainly)

- The `section`-subdivided Administration group is a strong pattern that scales — no findability complaint about any of its 9 items.
- Every route except `/readiness` has at least one navigation entry point — 63 of 64 routes are discoverable through normal navigation, a good baseline.
- Icon usage is consistent and semantic (`navigation.ts`'s `icon` field references a shared icon registry per route purpose, e.g. `shield` for Data Quality, `layers` for Epic Readiness) — no arbitrary or duplicated icon misuse found during this review.
- Redirect stubs (9 of them, per `01-app-inventory.md`) are consistently used as the mechanism for retiring merged pages rather than leaving dead links — a sound, repeatable IA pattern for this app's ongoing consolidation work.

---

## Summary

| Finding | Severity |
|---|---|
| `/data-quality` naming collision, unresolved at every layer | P2 |
| `/readiness` has zero nav representation despite being reachable (feeds R-01) | P1 (via `04-remove-merge-keep.md`) |
| `/trends` naming collision, resolves only after navigation | P3 |
| "Full Report" nav item description doesn't match its redirect destination | P3 (restated from Checkpoint 1) |
| Data group is the only group at risk of fully disappearing for a role | Informational — no severity assigned, flagged for product review |
| Reference group mixes unrelated audiences (directory/marketing/docs/dev-tools) | P3 |

No Keep/Merge/Remove recommendation is made in this file beyond what `04-remove-merge-keep.md` already covers — naming/grouping recommendations here are advisory input for Checkpoint 6's prioritized backlog, not final decisions.
