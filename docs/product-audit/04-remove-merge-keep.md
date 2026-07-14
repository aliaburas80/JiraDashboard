# Delivery Clarity — Remove / Merge / Keep Recommendations (Checkpoint 4)

**Status: COMPLETE** for the candidates classified in `02-duplicate-content-map.md`, cross-referenced with the orphan/dead-code evidence from `00-audit-control.md` and `01-app-inventory.md`. This is the only document in the audit where Keep/Merge/Remove/Move/Rename recommendations are made, per the audit's own execution-control rules.

**Ground rules applied to every recommendation below**, per the audit's removal/merge safety requirements:
- No recommendation states a page is "unused" without code-level evidence of zero callers/zero routes — this environment has no usage analytics, so every recommendation is qualified as **code-evidenced**, not **usage-confirmed**. Where a route has a real incoming link (public or in-app), that is stated explicitly and factored into the recommendation.
- No recommendation is "Remove" on the basis of visual similarity or low prominence alone.
- Every recommendation states what must be checked/updated if acted on (redirects, nav entries, permission arrays, shared components, tests) — this is guidance for a future implementation task, not an instruction this audit is performing itself. **No code was changed to produce this document.**
- "Recommend" language below is advisory output for product/engineering decision-makers, not an authorization to act.

---

## R-01 — `/readiness`: Merge into `/release-readiness`, do not delete outright

**Recommendation: Merge/Redirect** (retire `/readiness` as a standalone page; 301/redirect it to `/release-readiness`).

**Reasoning:** `02-duplicate-content-map.md` DUP-01 confirms `/readiness` has zero unique content — every element it renders is reproduced inside `/release-readiness`, which also computes 7 additional quality gates `/readiness` lacks entirely. This is the strongest true-duplicate finding in the whole audit.

**Why not a hard delete:** `/readiness` has one confirmed live incoming link — `app/landing/components/FeatureUniverse.tsx:18`, a public-facing feature tile on the in-app "About" page — so simply deleting the route would 404 that link. A redirect preserves it. It is also independently listed in `middleware.ts`'s `PROTECTED` array/matcher and in `src/lib/roles.ts`'s `DELIVERY_ROUTES` allowlist (present for `admin`, `scrum_master`, `product_owner`, `manager`, `user` — absent only for `c_level`, an inconsistency in its own right, see `06-role-based-review.md`).

**Dependencies to update if this is carried out** (not performed by this audit):
- `app/landing/components/FeatureUniverse.tsx:18` — repoint the `href` to `/release-readiness`.
- `middleware.ts` `PROTECTED` array and `config.matcher` — remove or repoint `/readiness`.
- `src/lib/roles.ts` `DELIVERY_ROUTES` — remove `/readiness` (and note the pre-existing `c_level` asymmetry becomes moot once removed).
- `app/developer/page.tsx:1252` references `/readiness` in prose documentation — update.
- Confirm no saved/shared external links to `/readiness` exist outside the codebase (outside this audit's visibility — flag for the product owner to check analytics/support history before finalizing).

**Confidence:** High (code-evidenced: zero unique content, confirmed by direct section-by-section comparison).

---

## R-02 — `/data-quality` vs `/dashboard/data-quality`: Keep both, but resolve the topical mismatch and reconcile the shared data path

**Recommendation: Keep both as distinct pages — do not merge or remove.**

**Reasoning:** DUP-02 classifies these as Overlapping-Distinct, not a true duplicate — `/data-quality`'s Field Impact accordion + Recommended Actions and `/dashboard/data-quality`'s filter/export toolbar are each genuinely useful and not reproduced on the other page. Removing either would lose real functionality.

**What should change instead (Move, not Remove):** `/dashboard/data-quality`'s "Delivery Composition" donut (DUP-07) is a duplicate of `/charts`' own composition widget and is not a data-quality concept — **recommend moving/removing the donut from this page specifically**, not the page itself. This is a smaller, safer, page-section-level recommendation rather than a whole-route decision.

**Also flag for Checkpoint 5 (not resolved here):** `/dashboard/data-quality` bypasses TypeScript (`// @ts-nocheck`) and reads `metrics.dataQuality` via untyped `any` access while `/data-quality` uses the typed contract — a code-quality/consistency issue, not a content-duplication one.

**Dependencies if the donut is moved/removed:** `personaFocus.config.ts:36,58,68` and `src/lib/coachingEvidenceLink.ts:16` deep-link into `/dashboard/data-quality` generally (not the donut specifically) — no change needed there. Check `src/__tests__/coachingEvidenceLink.test.ts:11` still passes if the page's rendered sections change.

**Confidence:** High for "keep both"; Medium for the donut-removal sub-recommendation (not independently verified against every consumer of that specific section).

---

## R-03 — `/flow-health` vs `/dashboard/flow-health`: Keep both — already adequately disambiguated

**Recommendation: Keep both — this is a Functional Duplicate (aggregate triage view vs. row-level drill-down table), not a redundant pair.**

**Reasoning:** DUP-03 confirms genuinely different workflows over the same data — an overview and a detail table are both legitimate views a delivery team would want, similar in kind to `/summary` vs. its detail pages (R-08 below), except here neither page is a strict subset of the other (each has content the other lacks: `/flow-health`'s Aging Distribution/Bottleneck Map has no equivalent on the dashboard table; `/dashboard/flow-health`'s 9-filter/export table has no equivalent on the standalone page).

**What should change instead:** Verified during this checkpoint's IA pass (see `07-information-architecture.md`) that the two pages are already better-disambiguated than Checkpoint 1 assumed: `/dashboard/flow-health`'s own sidebar label AND its page-level `title` both correctly say "Flow Health Table" (`DashboardNavSidebar.tsx:214`, `app/dashboard/flow-health/page.tsx:161`), distinct from `/flow-health`'s plain "Flow Health" `<h1>`. The remaining collision is narrower than first thought: only the URL *path segment* (`flow-health` appearing under both `/flow-health` and `/dashboard/flow-health`) is shared — the user-visible names are not. No action needed beyond what already exists; downgraded from the original Checkpoint 1 concern.

**Confidence:** High.

---

## R-04 — `/trends` vs `/dashboard/trends`: Keep both — confirmed non-duplicate, rename to resolve the collision

**Recommendation: Keep both. Recommend renaming one or both nav labels to remove the "Trends"/"Trends" collision** — this is a naming/IA fix, not a content decision. See `07-information-architecture.md` for the specific renaming candidates.

**Reasoning:** DUP-04 confirms genuinely different data sources (cross-upload history vs. single-dataset sprint/quarter view) both independently re-confirmed in Checkpoints 1 and 4. No content-removal action is justified.

**Confidence:** High.

---

## R-05 — `/promo` vs `/landing`: Keep both — intentional, not redundant

**Recommendation: Keep both as-is.** No merge/removal action. Optional (not urgent) recommendation: since `/landing`'s section order is explicitly coupled to `/promo`'s by a code comment, consider extracting the shared narrative-arc *structure* (not content) into a documented pattern so future copy edits to one are deliberately checked against the other — a process/documentation recommendation, not a code-removal one.

**Reasoning:** DUP-05 — different audiences (public/unauthenticated vs. in-app/authenticated), different components, real distinct incoming links from `/login` and the shared `AppShell` footer respectively. Removing either would eliminate the only public-shareable marketing page (`/promo`) or the only in-app reference to the same narrative for logged-in users (`/landing`) exploring `FeatureUniverse`'s live deep-links.

**Confidence:** High.

---

## R-06 — `/charts` "Issue Types" widget vs `/delivery-mix`: Keep `/delivery-mix`, consider trimming `/charts`' redundant widget

**Recommendation: Investigate for widget-level trim, not page removal.** `/delivery-mix` is a strict content superset of `/charts`' "Issue Types" widget specifically (not the whole `/charts` page, which has 7+ other widgets covering flow/team/quarters/kanban/labels/epics/relations that have no equivalent on `/delivery-mix`). Recommend `/charts`' "Issue Types" widget link out to `/delivery-mix` for the fuller breakdown, or be trimmed to a simpler summary tile, rather than duplicating `/delivery-mix`'s full categorization inline. This is a single-widget decision within a otherwise-necessary page, not a route-removal decision.

**Confidence:** Medium (the widget-level recommendation is a reasonable inference from the content diff, but customization/visibility settings on `/charts` — noted in `01-app-inventory.md` as "per-widget visibility/span customizer" — were not individually checked to confirm removing this specific widget wouldn't affect a saved user configuration; flag for verification before acting).

**Resolved (2026-07-14):** Verification done first, as flagged above — `src/lib/chartCustomizer.ts`'s `getChartPrefs()` already filters saved preferences against the current widget registry on every load and silently drops unknown ids, so no saved configuration could break. Went with the "trim to a simpler summary tile" + link-out combination: replaced the full type-by-type donut with the top 3 types by volume plus a link to `/delivery-mix`. See `fix/charts-issue-types-widget-link-out-r06`.

---

## R-07 — `/dashboard/data-quality`'s composition donut: Remove from this page (superseded by R-02's donut-specific note)

Combined into R-02 above — see there. Not a separate action item.

---

## R-08 — `/summary` vs `/dashboard/key-metrics` + `/dashboard/priority-attention`: Keep all three — working as intended

**Recommendation: Keep all three pages exactly as they are; no removal or merge action.** This is a confirmed Legitimate Summary-Detail Split (DUP-08), not a duplication risk. `/summary` also carries real structural weight beyond being a "thin" page: it is the hard-coded `fallbackRouteForRole` target for `c_level` (`src/lib/roles.ts:127`) and has five confirmed real incoming links from unrelated pages (`/developer`, `/charts`, `/customer`, `OnboardingChecklist.tsx`, `FeatureUniverse.tsx`) — removing or substantially thinning it would break more of the app than either detail page would.

**Secondary recommendation (code-quality, not content):** `/summary`'s `smartActions` logic and `/dashboard/priority-attention`'s `actions` logic are near-line-for-line independently reimplemented (same 5 of 6 generation rules, same thresholds/copy). Recommend extracting a single shared `generateSmartActions()` function consumed by both call sites, so the two pages' Smart Actions logic can't silently drift apart in the future the way the "orphan definition" calculations already have (Checkpoint 3, `CP3-014`). This is a Checkpoint 5-adjacent technical-duplication note, included here because it was discovered during this checkpoint's content comparison.

**Confidence:** High.

---

## R-09 — `/privacy` vs `/terms`: Keep both (different legal content), consider a shared rendering component

**Recommendation: Keep both pages — they are legitimately different legal documents, not a content duplicate.** The `RenderBlock`/date/version-constant structural duplication noted in DUP-09 is an implementation-level (component-reuse) opportunity, appropriately deferred to Checkpoint 5's technical-duplication review rather than acted on here, since it carries legal-content risk (any refactor must preserve exact per-language legal text, which is outside this audit's scope to verify).

**Confidence:** High for "keep both"; not assessed further (out of this checkpoint's scope).

---

## Orphan / dead-code items carried forward from Checkpoints 1 and 3 (not new to this checkpoint — included here because Remove/Keep is this checkpoint's designated decision point)

These were surfaced as evidence in earlier checkpoints but explicitly not acted on until now, per the audit's own sequencing.

### R-10 — Three non-Next.js git-tracked trees: `frontend/`, `backend/`, `promotion/`

**Recommendation: Investigate before removing — do not delete based on this audit alone.** All three are confirmed unreferenced by the live app (`git ls-files`, repo-wide grep, and `render.yaml`/`docker-compose.yml` all confirm zero connection — see `00-audit-control.md` §1). However, per the audit's own safety rule, "unused in the live app" is not the same as "safe to delete" — `backend/` in particular is a fully separate Express API server that may still be referenced by external documentation, a separate deployment the audit has no visibility into, or historical/compliance reasons for retention. **Recommend an explicit owner decision** (keep with documented reason + exclude from root ESLint per `CLAUDE.md` §60.6's own existing framing, or remove) rather than either auto-deleting or leaving indefinitely undecided. This matches the exact ask already tracked as `ORPHAN-01` (`frontend/`) in `TODO-List.md`; `backend/` and `promotion/` should receive equivalent tracked entries (`backend/` was newly discovered this audit and has no existing ORPHAN entry at all).

**Resolved (2026-07-14):** Owner decision made directly — remove all three. Re-verified zero references immediately before deleting (deployment config, CI config, and app code). Removed both the git-tracked files and each tree's gitignored untracked bulk (`node_modules/`, `build/`, and one stale local test-data file in `backend/data/`, checked before removal to confirm it wasn't live data) so nothing orphaned was left on disk. Removing `frontend/` also resolved the 59-warning lint-scope mismatch `CLAUDE.md` §60.6 had tracked. See `remove/orphan-non-nextjs-trees-r10`.

**Confidence:** High on "unreferenced by the live app" (code-confirmed); intentionally not making a keep-or-delete final call, since that requires stakeholder/business context this audit cannot access.

### R-11 — `app/profile/page 2.tsx` — stale duplicate file

**Recommendation: Remove.** This is the one item in this checkpoint with the highest confidence for outright removal: it is inert for Next.js routing (wrong filename, cannot ever be served), git-tracked since early project history, and superseded entirely by the real `app/profile/page.tsx`. No incoming link or import can reference a file that Next.js's router cannot address by design. Low blast radius, high confidence.

**Confidence:** Very high.

### R-12 — `DashboardViewSelector.tsx` + `defaultDashboardViewForRole()`/`allowedDashboardViewsForRole()`/`isDashboardViewLockedForRole()` family (`ORPHAN-02`)

**Recommendation: Remove**, contingent on confirming (not yet done in this audit) that no external documentation or in-progress feature branch depends on this family. `DashboardViewSelector.tsx` has exactly one caller (itself) and is not mounted anywhere in `app/` (confirmed via repo-wide grep, `01-app-inventory.md` finding #3). This is dead code from the pre-`/dashboard/*`-restructuring paradigm, already flagged and unresolved since before this audit began.

**Confidence:** High (code-evidenced zero-mount status); recommend a final grep-and-confirm pass immediately before deletion since this audit's search, while thorough, is not a substitute for a dedicated pre-deletion check.

### R-13 — The dormant Role-Based Coaching bundle (`CP3-010`: 7 generators + orchestrator + `adminSignals.service.ts` + the admin-signals API route)

**Recommendation: Investigate, do not remove yet.** Unlike R-11/R-12, this is a large (~1,300 line), fully-tested, recently-relevant subsystem (it's the direct predecessor of the now-live `/dashboard/coaching` Team Role View, replaced same-day per `01-app-inventory.md`). Recommend a product decision (not an engineering one) on whether this is planned for reactivation (e.g. a future per-role personalized coaching view) before removal — deleting fully-tested code that was working days before this audit began, without confirming it isn't on a near-term roadmap, would violate the audit's "do not remove based on low prominence alone" principle in spirit even though this isn't a page-removal case specifically.

**Confidence:** High on "currently unreachable" (code-evidenced); explicitly not recommending deletion without a product-side check.

**Resolved (2026-07-14):** Product decision made — not on the roadmap for reactivation; removed. Before deleting, re-traced the live/dead boundary independently (confirmed exactly what `/dashboard/coaching` actually imports) and found 2 more transitively-dead files not named in this finding's own file list — `coachingEvidenceLink.ts` and `coachingBadge.ts` — bringing the total to 16 non-test files + 3 test files. Cross-checked against `product/SRS.md`'s independently-maintained "Orphaned subsystem" note and `TODO-List.md`'s `ORPHAN-03` entry, both of which already listed the identical file set. See `remove/dormant-coaching-bundle-r13-r14`.

### R-14 — `orphanRelation.service.ts`'s `detectOrphans()` (`CP3-016`)

**Recommendation: Investigate/Remove.** Smaller and lower-risk than R-13 — this is a single dead function (not a whole subsystem), already confirmed to also contain a latent bug (hardcoded type-name sets that ignore the admin-configurable issue-type hierarchy) that would need fixing before any reactivation. Recommend removal unless a specific near-term plan to wire it up exists, in which case the hierarchy-config bug should be fixed first.

**Resolved (2026-07-14):** Removed, bundled into the same disposition as R-13 above per this finding's own instruction. The entire file was dead, not just `detectOrphans()` — its only in-repo reference was an unused import in the live `relationExplorer.service.ts`, removed alongside it.

**Confidence:** High.

---

## Summary of recommendation types issued this checkpoint

| Type | Count | Items |
|---|---|---|
| Merge/Redirect | 1 | R-01 |
| Keep (content), section-level trim/move | 3 | R-02 (donut), R-03 (naming only), R-06 (widget) |
| Keep as-is, no action | 4 | R-04, R-05, R-08, R-09 |
| Remove (high confidence) | 1 | R-11 |
| Remove (contingent on a final pre-deletion check) | 1 | R-12 |
| Investigate (requires stakeholder/product input, not an engineering-only call) | 3 | R-10, R-13, R-14 |

**No page was recommended for removal solely on the basis of duplication risk without a corresponding safety-check trail.** The only outright-removal recommendation with no caveat (R-11) is a file Next.js cannot route to at all, which is the specific case the audit's "confirm before removing" rule is least restrictive about (zero user-facing blast radius by construction).
