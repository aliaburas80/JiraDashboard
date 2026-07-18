# Delivery Clarity — Prioritized Backlog & Implementation Plan (Checkpoint 6)

**Status: COMPLETE.** This is the consolidation document required by Checkpoint 6 — every item below is a pointer into Checkpoints 1–5's evidence, not a re-derivation. Finding IDs (`CP3-NNN`, `DUP-NN`, `R-NN`, `MPE-NN`, `SEC/PRIV/PERF/TECH`) cross-reference `08-metric-dictionary.md`, `02/04/05-*.md`, and `10-technical-cleanup.md` respectively. No code was changed to produce this document, and nothing here is an authorization to act — it is a decision-ready backlog for product/engineering leadership.

**Total findings across the audit: ~65**, spanning correctness, clarity, duplication, missing functionality, role-access, IA, security, privacy, performance, and technical debt. **Zero P0 security findings. Three P0 correctness findings, all in Checkpoint 3's calculation layer.** No finding anywhere in the audit was rated P0 for data exposure/security — the most severe *category* of risk found is silently-wrong metrics presented as trustworthy, not a breach.

---

## How this backlog is organized

Five phases, ordered by a mix of severity and **dependency/risk-adjusted sequencing** — not simply "all P0s, then all P1s." Some P1s (the caching fix) are cheaper and safer than some P2s (a page merge), so phase order reflects effort/risk/leverage as well as severity, consistent with CLAUDE.md §62's priority rules ("Delivery decisions must consider urgency, risk, dependency, value, and available capacity").

---

## Phase 1 — Correctness fixes (ship first, independent of everything else)

These are silent, wrong-output bugs — the exact failure mode CLAUDE.md §1 calls out first ("Correctness" is priority #1 of 10). Each is a self-contained code fix with a clear, testable expected behavior; none requires a product/design decision first.

| ID | Finding | Fix shape | Risk if unfixed |
|---|---|---|---|
| CP3-001 | Release Readiness per-version engine never activates — type mismatch between `FlowItem[]` and raw-column reads | Pass raw items (or add a normalized-field adapter) to `calculateReleaseReadiness()`; add an integration test using real `FlowItem[]` shape, not raw-column fixtures | Release managers make ship/no-ship calls on a feature that has never actually evaluated real data |
| CP3-008 | `/roadmap` forecast always shows "insufficient data" — `completedCount` vs. real `completedIssues` field mismatch | One-line field-name fix in `app/roadmap/page.tsx:407-408`, matching the already-correct pattern in `forecastEngine.service.ts:37-38`; add the missing integration test | Every epic roadmap view is silently wrong for any team with legacy-shaped sprint data (the common case) |
| CP3-002 | Health Score / Kanban Flow Health / Data Quality score can render "green" from 1 issue or zero sample | Wire the already-built `metricConfidence.service.ts` signal into the primary display components (`DCKpiCard`, `MiniKpiCard`) that currently lack it — CP3-004 and CP3-017 are the same root cause, fold into one fix | False-confidence dashboards for any new or small dataset — the exact risk this whole audit was scoped to catch |

**Estimated scope:** 3 focused PRs, each independently testable, no schema/migration risk, no UI redesign.

---

## Phase 2 — High-leverage, low-risk fixes (best value-per-effort in the whole audit)

Selected because each is cheap, safe, and disproportionately valuable — the audit's own "value vs. maintenance cost" framing (CLAUDE.md §4.7 applied to fixes, not just dependencies).

| ID | Finding | Why it's high-leverage |
|---|---|---|
| ~~PERF~~ (`10-technical-cleanup.md` Part 3) | ~~No caching for `loadMetricsWithSource()`; `app/dashboard/layout.tsx` fetches metrics but never shares them with its 9 child pages~~ **Confirmed done** | `DashboardMetricsContext` + `DashboardMetricsProvider` exist; `app/dashboard/layout.tsx` fetches once and every child page reads via `useDashboardMetrics()`. Predates this session's visibility — confirmed directly against the current codebase while verifying the related 09-ux §4 fix below, not separately dated |
| ~~R-11~~ (`04-remove-merge-keep.md`) | ~~Stale `app/profile/page 2.tsx`~~ **Confirmed done** | File no longer exists — only `app/profile/page.tsx` remains |
| ~~09-ux §6.6~~ | ~~No skip-link anywhere in the app~~ **Confirmed done** | `AppShell.tsx` renders `<a href="#main-content" className={styles.skipLink}>Skip to main content</a>` |
| ~~R-01~~ (`04-remove-merge-keep.md`) | ~~`/readiness` true duplicate of `/release-readiness`~~ **Done 2026-07-13** | `app/readiness/page.tsx` is now a server `redirect('/release-readiness')` with an in-code note dated 2026-07-13 |
| ~~SEC~~ (login enumeration) | ~~Login leaks account existence via differentiated 404 vs. sibling endpoints' generic responses~~ **Confirmed done** | `app/api/auth/login/route.ts` returns the same generic response regardless of account existence, matching forgot-password/register/resend-verification |

**Estimated scope:** 5 small, independent PRs. None touches a calculation, a schema, or a page's core content — all are additive or corrective within existing patterns. All 5 confirmed complete; this phase's plan is fully executed.

---

## Phase 3 — Trust, privacy, and clarity fixes (P1s with compliance or user-trust exposure)

These need more care than Phase 2 (copy review, legal input, or careful threshold changes) but no large redesign.

| ID | Finding | Note |
|---|---|---|
| ~~PRIV (retention)~~ | ~~`/privacy`'s stated retention windows aren't enforced by any scheduled process~~ **Decided 2026-07-14: corrected the copy** | Added a disclosure paragraph to all 7 languages rather than building a scheduler — see `docs/fix-privacy-retention-window-claims` |
| ~~PRIV (sub-processors)~~ | ~~`/privacy` omits Azure/GCP as disclosed sub-processors despite the code fully supporting both~~ **Decided 2026-07-14: no change needed** | Owner confirmed S3-only in practice today; no live disclosure gap. `/privacy` must be updated if Azure/GCP is ever enabled — see `10-technical-cleanup.md`'s resolution note |
| ~~09-ux §2 (silent redirect)~~ | ~~20+ routes can't distinguish a fetch error from "no data uploaded," `app/column-mapping/page.tsx` fully swallows the error~~ **Done — closed in two waves (2026-07-13 + 2026-07-15)** | Shared `loadErrorSignal.ts` fix applied across the whole app; `/teams`, `/portfolio`, `/roadmap` were the three routes wave 1 missed, fixed 2026-07-15 (`/roadmap` was actively mislabeling a fetch error as "no data uploaded") — see `09-ux-and-accessibility.md`'s resolution note |
| ~~CP3-014 / CP3-015~~ | ~~Three non-synced "orphan" definitions; two admin threshold fields silently do nothing~~ **Decided 2026-07-14: unify + remove** | `dataQuality.service.ts` now uses the canonical `isOrphanByRules()`; `hierarchy.service.ts`'s structural definition kept (documented why); dead threshold fields removed from type, admin UI, and display tile — see `08-metric-dictionary.md`'s resolution notes |
| ~~03-clarity §A~~ | ~~"Confidence" (5 meanings), "At Risk" (6 meanings), "Health Score" (2 meanings), "Readiness" (2 meanings) — all undisambiguated on-page~~ **Done 2026-07-18** | Owner-approved rename table implemented: "Confidence" → context-specific labels (KPI Reliability, Delivery Confidence, Epic Timeline Confidence, Forecast Reliability); "At Risk" → Team/Portfolio/Timeline/Ops At Risk + "Behind Pace" + "Epics Needing Attention" (sidebar's primary/shared usage kept bare "At Risk"); `/teams` "Health Score" → "Team Health Score"; `/help`'s "Readiness" FAQ split into Epic/Release Readiness sections. Display labels and type literals only — no calculation or threshold changed. See `docs/product-audit/03-clarity-and-misleading-data.md`'s resolution notes and `feature/audit-03-clarity-terminology-rename`. |
| ~~CP3-018~~ | ~~Score-band thresholds hardcoded/duplicated across 12 files, admin Thresholds screen doesn't actually govern most of them~~ **Decided 2026-07-14: extend thresholds.service.ts (partial)** | Health Score band (7+ of the 12 sites, the dominant duplication) now unified + admin-configurable. Portfolio "At Risk," sprint-goal, capacity overload, and confidence bands are separate metrics/findings, still hardcoded — see `08-metric-dictionary.md`'s resolution note for the exact scope boundary |
| ~~MPE-05~~ | ~~`exportImportLogsWorkbook` documented in `/developer` as live but never wired to a button~~ **Decided 2026-07-14: wired it up** | Added `exportImportLogRecordsWorkbook()` + `GET /api/imports/export` + an "Export logs" button on `/backend` — see `05-missing-product-elements.md`'s resolution note |

---

## Phase 4 — Decisions requiring product/stakeholder input before any engineering work

The audit's own rules prohibit recommending removal without this input — these are explicitly **not** engineering-only calls.

| ID | Decision needed | What's blocking a unilateral engineering call |
|---|---|---|
| ~~R-10~~ | ~~Keep or remove `frontend/`, `backend/`, `promotion/` (non-Next.js trees)~~ **Done 2026-07-14: removed all three** | Owner decision made directly; re-verified zero references before deleting — see `remove/orphan-non-nextjs-trees-r10` |
| ~~R-13 / TECH (coaching helpers)~~ | ~~Reactivate or remove the dormant Role-Based Coaching bundle (~1,300 lines + 2 more transitively-dead helper files found in Checkpoint 5)~~ **Done 2026-07-14: removed, not on roadmap** | Final pre-deletion trace found 2 more transitively-dead files (`coachingEvidenceLink.ts`, `coachingBadge.ts`) beyond this finding's own list; bundled R-14 (`orphanRelation.service.ts`) into the same disposition per that finding's instruction — see `remove/dormant-coaching-bundle-r13-r14` |
| ~~R-12~~ | ~~Remove `DashboardViewSelector`/`allowedDashboardViewsForRole` family~~ **Done 2026-07-14** | Final pre-deletion grep pass found the dead surface was wider than scoped here (the whole `dashboardView` feature, not just the selector) — see `remove/dead-dashboard-view-selector-r12` |
| ~~PRIV (self-service deletion)~~ | ~~Build self-service account/data deletion, or correct `/terms`' copy that implies it already exists~~ **Decided 2026-07-14: corrected the copy** | See `docs/fix-terms-self-service-deletion-claim` — `en.ts`/`ar.ts` updated, other 5 languages never had the claim |
| ~~06-role-based-review §C~~ | ~~Enforce `/dashboard/*` sidebar role-gating server-side, or treat it as pure UI curation with no security intent~~ **Decided 2026-07-14: pure UI curation** | Documented directly in `DashboardNavSidebar.tsx` — see `docs/product-audit/06-role-based-review.md` §C's resolution note |
| ~~R-06~~ | ~~Trim `/charts`' "Issue Types" widget in favor of linking to `/delivery-mix`~~ **Done 2026-07-14** | Verified `chartCustomizer.ts` already handles a removed/changed widget id gracefully (drops stale saved prefs on load) — see `fix/charts-issue-types-widget-link-out-r06` |

---

## Phase 5 — Remaining P2/P3 polish (batch opportunistically, no urgency)

Grouped by theme so they can be picked up together when someone is already working in the area.

**Verified against live code 2026-07-17** (`Explore` agent pass, this session): 8 items below were already
fixed on 2026-07-13/2026-07-14 — before this backlog document's Phase 5 section had ever been updated to
reflect any of them — and are struck through with their commit. Every remaining item was individually
re-confirmed still genuinely open against current code (not just re-stated from the original audit), so this
list is now accurate as of 2026-07-17, not just as of the original audit date.

**Feature-parity gaps** (`05-missing-product-elements.md`): ~~export capability on `/work-explorer`/`/teams`/`/portfolio`/`/delivery-mix`/`/charts`/`/customer`/`/roadmap` (MPE-01)~~ **done 2026-07-18 — CSV export added to all 7 pages (`/charts` also gained a full-report `.xlsx` option alongside CSV, reusing the existing `exportToExcel`); every new export function routes through `buildSafeCsv`/`buildSectionedCsv`, both built on the existing OWASP formula-injection guard (CLAUDE.md §38.5) — verified with new formula-injection test coverage per page**; ~~pagination on `/admin/logs`/`/admin/users`/`/members`/`/backend`/`/snapshots`/`/admin/system-errors` (MPE-02)~~ **done 2026-07-17/2026-07-18 — client-side pagination added to all 6 via a new shared `paginate()` helper (`src/lib/pagination.ts`); `/admin/system-errors` (the 6th page named in the finding's evidence but not in this backlog line) was out of scope on 2026-07-17 and closed as a follow-up on 2026-07-18**; ~~search on `/snapshots`/`/admin/logs`/`/admin/audit`/`/backend` (MPE-03)~~ **done 2026-07-17 — free-text search added to all 4; `/admin/audit`'s runs server-side (`?q=` on `/api/admin/audit-events`) since that log already paginates server-side and a client-only filter would miss matches outside the current page**; ~~`/admin/system-errors` "Dismiss" confirm step (MPE-04)~~ **done 2026-07-17 — now gated behind `ConfirmDeleteDialog`, matching `/snapshots`/`/backend`**; ~~`/verify-email` contact link (MPE-06)~~ **done 2026-07-17 — `mailto:` link added, reusing the app's existing support address**.

**IA/naming** (`07-information-architecture.md`): ~~`/data-quality` vs `/dashboard/data-quality` naming collision~~ **done 2026-07-18 — dashboard sub-page retitled "Data Quality & Composition" (title, sidebar entry, tour step), standalone page left as plain "Data Quality," mirroring the existing `/flow-health` disambiguation pattern**; ~~"Full Report" nav description mismatch~~ **done, commit `c5c2506` (2026-07-14)**; ~~Reference group's mixed-audience grouping~~ **done 2026-07-18 — split into `directory` (Members), `developer-tools` (Developer), and a trimmed `reference` (About/Glossary/Help)**; ~~`/trends` nav-level ambiguity~~ **done 2026-07-18 — top-nav "Trends" desc reworded to "Cross-upload history, not current data," contrasting the dashboard sidebar's current-dataset framing**.

**Calculation refinement** (`08-metric-dictionary.md`): ~~cycle-time issue-type blending (CP3-006)~~ **done 2026-07-18 — Kanban flow gained a per-issue-type `cycleTimeByType` breakdown alongside the existing Scrum-side `buildTypeMetrics`; blended headline figures (flow-health, sprint-kanban, Health Score) deliberately unchanged, this is additive detail not a formula change**; ~~unnormalized `/teams` comparison (CP3-007)~~ **done 2026-07-18 — added an on-page caveat explaining the ranking isn't normalized for estimation habits; the underlying metric wasn't changed, since normalizing it would be a business-formula change outside this finding's scope**; ~~undocumented coaching-grid thresholds (CP3-011)~~ **done 2026-07-18 — the 20%/35%/60% thresholds are now stated in each rule's own description on `/dashboard/coaching`, plus Glossary and Help FAQ entries**; ~~hardcoded 71% retro fallback shown as real (CP3-012)~~ **done 2026-07-18 — "Retro actions completed" now renders a visible "(estimated)" qualifier with an explanatory tooltip**; ~~two colliding quality-score band scales (CP3-019)~~ **done 2026-07-18 — the upload column-mapping score's labels renamed to "Strong/Good/Partial/Weak Match" so they no longer share vocabulary with the Data Quality score's Excellent/Good/Fair/Weak bands; neither score's cutoffs changed**; ~~`releaseConfidenceBand()` dead + `/trends` inline duplicate (CP3-020)~~ **done 2026-07-17 — `/trends` now calls the shared function, dead code eliminated, output unchanged**; ~~ceremony-advice sample-size caveat (CP3-013, currently moot — dormant code)~~ **resolved by removal, not just moot — `ceremonyAdvice.service.ts` no longer exists at all, deleted with the rest of the dormant coaching bundle, commit `80b3c2a` (2026-07-14)**.

**Technical debt** (`10-technical-cleanup.md` Part 4): `/api/dashboard` unused stub (still open — owner decided 2026-07-13 not to remove it, since it could be an external health-check target; only its `product/README.md` description was corrected, the underlying misleading-stub finding stands); 3 hand-maintained API-surface descriptions (still open — no shared source of truth built, confirmed 2026-07-13 this remains a separate, larger structural fix); ~~inconsistent confirm-dialog usage in `/admin/settings`~~ **done, commit `1089f26` (2026-07-13) — `window.confirm()` eliminated app-wide, `ConfirmDeleteDialog` used consistently**; ~~avatar-size literals not tokenized~~ **done, commit `3b4c75b` (2026-07-13) — `--icon-size-md`/`--icon-size-lg` tokens added**; ~~`Card.tsx`'s latent non-keyboard-accessible `onClick` prop~~ **done, commit `ae1360a` (2026-07-13)**; ~~user-uploaded images not using `next/image`~~ **will not fix as originally scoped — downgraded 2026-07-13, see the correction note under this finding in `10-technical-cleanup.md` Part 3: `next/image` against the authenticated `/api/profile/image` endpoint is unsafe, not just unimplemented**; `/charts` unmemoized derivations (done, `perf/charts-page-memoize-derivations`); ~~`orphanRelation.service.ts`'s `detectOrphans()` (bundle with R-14)~~ **done — file deleted entirely, commit `80b3c2a` (2026-07-14)**; ~~6 orphaned/unmounted `src/components/dashboard/**` components still open and re-confirmed (`DashboardSectionSwitcher.tsx`, `DraggableMetricTable.tsx`, `LayoutBuilderPanel.tsx`, `SaveSnapshotButton.tsx`, `SprintComparePanel.tsx`, `WhatChangedPanel.tsx`, ~1,118 lines, zero import references anywhere) — same disposition question as `ORPHAN-02`, needs an explicit keep-or-remove decision given the substantive feature surface (drag-and-drop, layout builder, snapshot save, sprint compare), not a unilateral engineering call.~~ **done, 2026-07-18 — all 6 files deleted, plus the two shared library files that became fully orphaned as a result (`src/lib/dashboardSections.ts`, `src/lib/layoutBuilder.ts`) and their 2 dedicated test files; re-verified zero references before deleting; see the `10-technical-cleanup.md` "Resolved (2026-07-18)" note and `TODO-List.md` `ORPHAN-02` for full detail. Branch `chore/orphan-02-remove-dead-dashboard-components`.**

**Security hardening (non-urgent)** (`10-technical-cleanup.md` Part 1): ~~no shared `/api/*` middleware backstop~~ **done 2026-07-18 — `middleware.ts` now gates all non-public `/api/*` routes on session presence via an explicit `PUBLIC_API` allow-list, authentication-only (never role/authorization), full blast-radius re-check performed**; ~~`backend-view`'s unauthenticated fallback~~ **done 2026-07-18 — stopped falling back to the same globally-unscoped flat file the `/api/imports` P0 fix had already removed; now returns the static endpoint index only, no real import data**; ~~upload validation is extension-only~~ **done 2026-07-18 — added `src/lib/fileSignature.ts` content-signature gate to `upload/route.ts`, `retro/parse/route.ts`, and (as a same-day follow-up) `upload/merge/route.ts` (strict for `.xlsx`, lenient text-sanity for `.xls`/`.csv`/`.md`/`.txt` to avoid rejecting real Jira "fake .xls" exports)**; ~~profile-image content-type trust~~ **done 2026-07-18 — `profile/image/route.ts` now verifies real magic bytes and uses the server-detected type for S3 storage, not the client-declared `File.type`**. See `fix/security-hardening-nonurgent-audit-p1` and the four "Resolved (2026-07-18)" notes in `10-technical-cleanup.md` Part 1.

---

## What this backlog deliberately does NOT include

Per the audit's own rules, the following are **not** included as action items because they were checked and found clean, or because a Keep/no-action verdict was already reached with evidence in Checkpoint 4:
- `/flow-health` vs `/dashboard/flow-health` (already adequately disambiguated — `04-remove-merge-keep.md` R-03)
- `/trends` vs `/dashboard/trends`, `/summary` vs its detail pages, `/promo` vs `/landing`, `/privacy` vs `/terms` (all confirmed legitimate, non-duplicate — `02-duplicate-content-map.md`)
- Scrum/Kanban metric mixing (checked, confirmed not occurring — `08-metric-dictionary.md` §E)
- CSV-injection protection, admin route authorization, password/token handling, focus-visible implementation, reduced-motion coverage (all checked and confirmed sound)

---

## Sequencing rationale (why this order, not strict severity order)

1. **Phase 1 before Phase 2** despite Phase 2 having a P1 (the caching fix) with lower engineering risk than some Phase 1 items: correctness always outranks performance per CLAUDE.md §1's own stated priority order, and these three bugs mean actual product decisions (ship/no-ship, roadmap ETAs) are currently being made on broken data.
2. **Phase 2 before Phase 3**: Phase 2 items are all execution-ready today (no open question blocks them); Phase 3 items need a decision (which legal language, which label) before the code change can be written, so starting Phase 2 immediately captures value while Phase 3's decisions are being made in parallel.
3. **Phase 4 is explicitly not blocking** Phases 1-3 or 5 — these are independent decision tracks that can run in parallel with engineering work, per CLAUDE.md §62 ("P0 does not permanently block all P1-P4 work").
4. **Phase 5 has no forced order** — it's a menu, not a queue, intended for opportunistic pickup alongside other work in the same file/area (e.g., fix `/charts`' memoization while already touching that file for the widget-trim decision in Phase 4).
