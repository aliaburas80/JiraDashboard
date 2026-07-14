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
| PERF (10-technical-cleanup.md Part 3) | No caching for `loadMetricsWithSource()`; `app/dashboard/layout.tsx` fetches metrics but never shares them with its 9 child pages | One file (`app/dashboard/layout.tsx` + a small context/module cache), no API change, no behavior change, fixes ~20 redundant network round-trips app-wide. The fix pattern already exists in-house (`fetchCurrentUser()`'s cache) — this is copying a proven pattern, not inventing one. |
| R-11 (`04-remove-merge-keep.md`) | Stale `app/profile/page 2.tsx` | Single `git rm`, zero blast radius (file is unroutable by construction) — the only unconditional "just delete it" recommendation in the whole audit |
| 09-ux §6.6 | No skip-link anywhere in the app | One shared component added to `AppShell`, benefits every authenticated route immediately, standard WCAG pattern with no design ambiguity |
| R-01 (`04-remove-merge-keep.md`) | `/readiness` true duplicate of `/release-readiness` | Redirect + 3 small reference updates (landing page link, middleware array, roles.ts array) — resolves the single clearest "hard to discover" finding in the audit |
| SEC (login enumeration) | Login leaks account existence via differentiated 404 vs. sibling endpoints' generic responses | Match the existing, already-correct pattern used by forgot-password/register/resend-verification — copy an in-house pattern, not new design |

**Estimated scope:** 5 small, independent PRs. None touches a calculation, a schema, or a page's core content — all are additive or corrective within existing patterns.

---

## Phase 3 — Trust, privacy, and clarity fixes (P1s with compliance or user-trust exposure)

These need more care than Phase 2 (copy review, legal input, or careful threshold changes) but no large redesign.

| ID | Finding | Note |
|---|---|---|
| ~~PRIV (retention)~~ | ~~`/privacy`'s stated retention windows aren't enforced by any scheduled process~~ **Decided 2026-07-14: corrected the copy** | Added a disclosure paragraph to all 7 languages rather than building a scheduler — see `docs/fix-privacy-retention-window-claims` |
| ~~PRIV (sub-processors)~~ | ~~`/privacy` omits Azure/GCP as disclosed sub-processors despite the code fully supporting both~~ **Decided 2026-07-14: no change needed** | Owner confirmed S3-only in practice today; no live disclosure gap. `/privacy` must be updated if Azure/GCP is ever enabled — see `10-technical-cleanup.md`'s resolution note |
| 09-ux §2 (silent redirect) | 20+ routes can't distinguish a fetch error from "no data uploaded," `app/column-mapping/page.tsx` fully swallows the error | The dominant Checkpoint 2 finding — a shared error-state pattern/hook applied once, consumed by many pages, is the natural fix shape |
| ~~CP3-014 / CP3-015~~ | ~~Three non-synced "orphan" definitions; two admin threshold fields silently do nothing~~ **Decided 2026-07-14: unify + remove** | `dataQuality.service.ts` now uses the canonical `isOrphanByRules()`; `hierarchy.service.ts`'s structural definition kept (documented why); dead threshold fields removed from type, admin UI, and display tile — see `08-metric-dictionary.md`'s resolution notes |
| 03-clarity §A | "Confidence" (5 meanings), "At Risk" (6 meanings), "Health Score" (2 meanings), "Readiness" (2 meanings) — all undisambiguated on-page | Rename/relabel campaign — low technical risk, needs product/content sign-off on the actual replacement labels |
| CP3-018 | Score-band thresholds hardcoded/duplicated across 12 files, admin Thresholds screen doesn't actually govern most of them | Either extend `thresholds.service.ts` to be genuinely the source of truth, or relabel the admin screen to reflect its narrower real scope |
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

**Feature-parity gaps** (`05-missing-product-elements.md`): export capability on `/work-explorer`/`/teams`/`/portfolio`/`/delivery-mix`/`/charts`/`/customer`/`/roadmap` (MPE-01); pagination on `/admin/logs`/`/admin/users`/`/members`/`/backend`/`/snapshots` (MPE-02); search on `/snapshots`/`/admin/logs`/`/admin/audit`/`/backend` (MPE-03); `/admin/system-errors` "Dismiss" confirm step (MPE-04); `/verify-email` contact link (MPE-06).

**IA/naming** (`07-information-architecture.md`): `/data-quality` vs `/dashboard/data-quality` naming collision (the one genuinely unresolved pair); "Full Report" nav description mismatch; Reference group's mixed-audience grouping; `/trends` nav-level ambiguity (resolves after click, lower urgency than Data Quality).

**Calculation refinement** (`08-metric-dictionary.md`): cycle-time issue-type blending (CP3-006); unnormalized `/teams` comparison (CP3-007); undocumented coaching-grid thresholds (CP3-011); hardcoded 71% retro fallback shown as real (CP3-012); two colliding quality-score band scales (CP3-019); `releaseConfidenceBand()` dead + `/trends` inline duplicate (CP3-020); ceremony-advice sample-size caveat (CP3-013, currently moot — dormant code).

**Technical debt** (`10-technical-cleanup.md` Part 4): `/api/dashboard` unused stub; 3 hand-maintained API-surface descriptions; inconsistent confirm-dialog usage in `/admin/settings`; avatar-size literals not tokenized; `Card.tsx`'s latent non-keyboard-accessible `onClick` prop; ~~user-uploaded images not using `next/image`~~ **will not fix as originally scoped — downgraded 2026-07-13, see the correction note under this finding in `10-technical-cleanup.md` Part 3: `next/image` against the authenticated `/api/profile/image` endpoint is unsafe, not just unimplemented**; `/charts` unmemoized derivations (done, `perf/charts-page-memoize-derivations`); `orphanRelation.service.ts`'s `detectOrphans()` (bundle with R-14).

**Security hardening (non-urgent)** (`10-technical-cleanup.md` Part 1): no shared `/api/*` middleware backstop (architectural, add as defense-in-depth); `backend-view`'s unauthenticated fallback; upload validation is extension-only (parser already catches malformed content); profile-image content-type trust.

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
