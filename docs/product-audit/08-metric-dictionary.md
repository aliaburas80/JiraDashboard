# Delivery Clarity — Metric Dictionary & Calculation Audit (Checkpoint 3)

**Status: COMPLETE for Checkpoint 3's scope** (trace every visible metric to its source calculation; check null/zero-denominator/small-sample handling; check for cross-team story-point mixing, issue-type blending, and Scrum/Kanban mixing). This file is the authoritative record of Checkpoint 3 findings; `03-clarity-and-misleading-data.md` §F cross-references the finding IDs below rather than repeating them.

**Evidence basis:** Direct code inspection (grep + read) of every file in `src/services/metrics/`, `src/services/forecast/`, `src/services/coaching/`, `src/services/export/recommendationEngine.ts`, `src/services/retro/`, `src/services/dataQuality/`, `src/services/relations/`, `src/services/settings/thresholds.service.ts` + `orphanRules.service.ts`, and `src/lib/releaseConfidence.ts` — the full calculation layer. No rendered verification performed (blocked app-wide, see `00-audit-control.md` §4). Every finding cites `file:line`. No production code was changed to produce this document.

**No recommendation to remove/merge/rewrite any calculation is made in this file** — per audit boundaries, that judgment belongs to Checkpoint 4/6. This file states what the code does, what a user could reasonably conclude from what's on screen, and where those two things diverge.

---

## How to read this file

Each finding has a stable ID (`CP3-NNN`) used for cross-referencing from other audit documents. Severity uses the audit's P0–P3 model:
- **P0** — silently wrong numbers presented as trustworthy (a user could make a real decision on a broken or fabricated result)
- **P1** — trust/clarity risk (numbers are technically correct but structurally misleading or incomparable)
- **P2** — moderate (narrower blast radius, or affects a smaller audience/feature)
- **P3** — cosmetic/low-impact (often dead code or a documentation gap with no live consequence today)

---

## A. Metrics that can be actively wrong (P0)

### CP3-001 — Release Readiness per-version engine never activates on real uploads
```text
Finding: calculateReleaseReadiness() (src/services/metrics/releaseReadiness.service.ts) reads raw Jira export column names ('Fix Version/s', 'Status', 'Issue Type', 'Blocked Flag'), but both callers pass it metrics.flow.items — a normalized FlowItem[] (src/types/metrics.ts:8-33) that only has lowercase/camelCase keys and no 'Fix Version/s' key at all.
Evidence: app/release-readiness/page.tsx:193, app/readiness/page.tsx:26 (both call calculateReleaseReadiness(metrics.flow.items as any)); releaseReadiness.service.ts:29-31 (getVersion() reads i['Fix Version/s']), :19 (isDone() reads i['Status']), :23-25 (isBug() reads i['Issue Type']), :20-22 (isBlocked() reads i['Blocked Flag']); :156 (if (!v) return; — silently drops every item since getVersion() always returns ''); :163-166 (versionMap.size === 0 short-circuits to { releases: [], hasVersionData: false }).
Why it matters: The product's headline release-signoff tool — "7 quality gates per release version" — is dead on every real upload. Users with a perfectly good Fix Version/s column are told "Fix Version / Release column is absent" and shown a generic fallback checklist instead of an evaluated verdict.
Affected users: Release managers/PMs using /release-readiness or /readiness to decide whether to ship.
Severity: P0
Confidence: High confidence (traced the exact type mismatch end to end, both callers checked)
Validation method: Feed a real export with a populated Fix Version/s column through the app and confirm whether release-level cards populate; or add a unit test that calls calculateReleaseReadiness with actual FlowItem[] shape (existing tests likely pass raw-column fixtures, masking this).
```

### CP3-002 — Health Score and cycle-time can render "green" from a single issue or zero completed sample
```text
Finding: calculateHealthScore (src/services/metrics/metrics.service.ts:1074-1102) has no minimum-sample gate; with totalIssues=1 and no flags raised, it scores 100 (top band). Cycle-time scoring treats a zero-sample average as a perfect score, not a "no data" state.
Evidence: metrics.service.ts:1081 (Math.max(totalIssues,1) prevents divide-by-zero but does not prevent a 1-item "perfect" score); safeAverage([]) returns 0 (metrics.service.ts:292-295); metrics.service.ts:1088 (avgCycle===0 ? 100 : ... — "no data" scores as "perfect"); app/flow-health/page.tsx:112-113 sets tone 'success' whenever averageCycleTimeDays/averageLeadTimeDays ≤ threshold, including a zero-sample default; app/customer/page.tsx:129 (getHealthBand(metrics.healthScore)) has no sample-size gate.
Why it matters: A dashboard can show "On Track"/green flow health for a project with almost no completed work — the exact false-confidence failure mode this checkpoint is designed to catch.
Affected users: /flow-health, /customer (executive report) — executives and stakeholders trusting a "healthy" signal.
Severity: P0
Confidence: High confidence
Validation method: Upload a dataset with 1-2 completed issues and confirm Health Score renders a top-band/green result.
```

### CP3-008 — `/roadmap`'s forecast is always broken due to a field-name mismatch, independent of `/forecast`'s working engine
```text
Finding: app/roadmap/page.tsx implements its own forecast logic (not forecastEngine.service.ts) and filters/reduces on a field name (completedCount) that does not exist on SprintEntry — the real field is completedIssues.
Evidence: app/roadmap/page.tsx:407-408 (filters/reduces metrics.sprint.sprints on s.completedCount); src/types/metrics.ts:53-61 (SprintEntry only has completedIssues); src/services/metrics/metrics.service.ts:672,735 (only ever assigns completedIssues); contrast with the correct shape-aware pattern already used in forecastEngine.service.ts:37-38 (useRich ? s.completedCount : s.completedIssues ?? s.completedCount).
Why it matters: avgThroughput is always 0 on /roadmap regardless of real sprint history, so every incomplete epic falls into the "insufficient data"/low-confidence branch (app/roadmap/page.tsx:51-52) — contradicting app/help/page.tsx's own documented behavior, since sprint history genuinely is available. The existing unit test (src/__tests__/roadmapForecast.test.ts) only tests forecastEpic() in isolation with avgThroughput passed directly, so this integration bug is untested.
Affected users: /roadmap — every user with legacy-shaped (non-"rich") sprint data, which per forecastEngine's own comment is the common case.
Severity: P0
Confidence: High confidence
Validation method: Upload real sprint history and confirm /roadmap epic forecasts show non-zero avgThroughput / non-"insufficient data" status where /forecast's engine, given the same data, shows a real number.
```

---

## B. Metrics that are technically correct but structurally misleading (P1)

### CP3-003 — Sprint Throughput and Kanban Flow silently pool multiple teams under one arbitrary team label
```text
Finding: calculateSprintThroughput groups only by sprint name (not team+sprint); calculateKanbanFlow groups only by completion month. Both attribute the whole bucket's team label to just the first item in the group, while summing/averaging story points, velocity, and cycle/lead time across every team present in that bucket.
Evidence: src/services/metrics/throughput.service.ts:251 (groupBy(sprintIssues, getSprintName)), :298 (team = getTeam(items[0])), :260-333 (committed/completed/velocity/goalOutcome/deliveryConfidence summed across the whole group); src/services/metrics/kanbanFlow.service.ts:163-171 (periodKey(doneDate) — month only), :225 (team = getTeam(doneItems[0] ?? kanbanIssues[0])).
Why it matters: Two teams sharing a sprint name (common on shared boards) or completing work in the same month get their differently-calibrated story-point scales summed and averaged as one team's velocity, displayed under a single (arbitrary) team label — a textbook cross-team story-point comparison anti-pattern.
Affected users: /sprint-kanban (Sprint Throughput and Kanban Flow panels), src/components/dashboard/KanbanThroughputPanel.tsx.
Severity: P1
Confidence: High confidence
Validation method: Upload data with 2+ teams sharing a sprint name or completion month and confirm the throughput/velocity numbers are a blend, not per-team.
```

### CP3-004 — Metric-confidence signal exists but is not wired into any primary decision-making page
```text
Finding: calculateMetricConfidence() (metricConfidence.service.ts) correctly flags low-sample/missing-field situations, but the only component that renders it (MetricConfidenceBadge, via KpiCard's optional confidence prop) is used exclusively on /developer, /data-quality, and /admin/diagnostics. The KPI components actually shown on user-facing pages (DCKpiCard on /flow-health, MiniKpiCard on /dashboard/key-metrics and /summary) accept no confidence prop at all.
Evidence: src/components/ui/MetricConfidenceBadge.tsx used only by src/components/ui/KpiCard.tsx:27-29 (confidence && ...); grep confirms KpiCard is used only in app/developer/page.tsx, app/data-quality/page.tsx, app/admin/diagnostics/page.tsx.
Why it matters: A real, working reliability signal never reaches the pages where a raw metric is displayed as green/healthy — CP3-002's "1-issue = green" failure mode is realized in practice because the guard that could prevent it isn't connected.
Affected users: /flow-health, /dashboard/key-metrics, /summary, /sprint-kanban, /customer, /release-readiness, /teams — every non-developer-facing page.
Severity: P1
Confidence: High confidence
Validation method: Confirm no confidence badge/indicator renders anywhere on the listed pages regardless of underlying sample size.
```

**Partially resolved (2026-07-13, extended 2026-07-18):** `DCKpiCard` (2026-07-13) and `MiniKpiCard`
(2026-07-18) both now accept an optional `confidence` prop rendering `MetricConfidenceBadge`. Wired into
`/flow-health`'s Lead/Cycle Time cards, `/summary`'s Avg Cycle Time card, and `/dashboard/key-metrics`'s
Lead Time/Cycle Time cards — every KPI card on those three pages that has a real, computed
`MetricConfidence` value (`metrics.confidence.leadTime`/`.cycleTime`) now shows it. **Still not wired**:
`/sprint-kanban`, `/customer`, `/release-readiness`, `/teams` (no `DCKpiCard`/`MiniKpiCard` usage was
touched on those pages), and the remaining non-lead/cycle-time KPIs on `/summary` and
`/dashboard/key-metrics` (Completion, Critical Issues, Health Alerts, Active Work, Story Points, Est.
Completion) — `calculateMetricConfidence()` has no computed signal for those specific metrics today, so
badging them would mean fabricating a confidence value rather than surfacing a real one. Closing this
finding fully would require either computing confidence for those additional metrics (a calculation
change, out of scope for this wiring-only pass) or accepting a page that mixes badged and unbadged KPIs
by design. Tracked in `11-prioritized-backlog.md` Phase 5.

### CP3-005 — Kanban "Flow Health" KPI defaults to "Healthy" with zero completed-item sample
```text
Finding: overallHealth in calculateKanbanFlow defaults to 'Healthy' unless a period is explicitly 'Degraded'/'At Risk'; with zero completed non-sprint issues, both checks are vacuously false and it falls through to 'Healthy'. This is rendered directly as a colored KPI tile with no sample-size guard, unlike the adjacent Cycle Time/Lead Time tiles in the same strip which do fall back to "—" at zero.
Evidence: src/services/metrics/kanbanFlow.service.ts:264-267 (fallthrough to 'Healthy'), :152-160 (hasKanbanData true as soon as one non-sprint issue exists, done or not); app/sprint-kanban/page.tsx:413 (flowHealth = tpKanban?.overallFlowHealth ?? 'Healthy'), :428-429 (neighboring tiles correctly show "—" at zero), :431 (Flow Health tile has no equivalent guard).
Why it matters: A brand-new or freshly-filtered Kanban board with active-but-not-yet-completed work shows a green "Healthy" flow status with zero actual throughput evidence.
Affected users: /sprint-kanban (Kanban-only KPI strip).
Severity: P1
Confidence: High confidence
Validation method: Upload/filter to a Kanban dataset with zero completed items and confirm the Flow Health tile still shows green "Healthy."
```

### CP3-009 — `/roadmap`'s confidence badge shares vocabulary with `/forecast` but uses a materially weaker method, with no visible caveat
```text
Finding: app/roadmap/page.tsx:55 derives confidence purely from sprints-remaining-to-completion (sprints < 2 ? 'high' : sprints < 5 ? 'medium' : 'low'), while forecastEngine.service.ts:99-114 blends sprint count, trend, blocked count, per-metric confidence, and Data Quality band. /roadmap has no equivalent of /forecast's model-assumption caveat (app/forecast/page.tsx:1107).
Why it matters: An epic forecast built from one noisy sprint can show "high confidence" simply because it's nearly done, while a well-supported 10-sprint forecast with more remaining work shows "low" — the opposite of what a user would expect "confidence" to mean, and consistent with the "Confidence" term-overload finding from Checkpoint 2 (see 03-clarity-and-misleading-data.md §A).
Affected users: /roadmap, all users; this is a 5th distinct meaning of "Confidence" beyond the 4 already catalogued in Checkpoint 2.
Severity: P1
Confidence: High confidence
Validation method: Compare confidence badges for the same underlying epic/sprint data rendered via /forecast vs /roadmap.
```

### CP3-014 — Three independent, non-synchronized "orphan" definitions produce contradictory counts on identical data
```text
Finding: dataQuality.service.ts:184-187 uses a hardcoded rule (non-epic, missing Epic Link AND Parent Key) that never calls the admin-configurable isOrphanByRules(); metrics.service.ts:539 does call isOrphanByRules(issue, readOrphanRules()) and feeds 5+ dashboard pages; hierarchy.service.ts:172-177 uses a third, structural OR-based definition feeding /explore.
Evidence: as cited above, plus src/services/settings/orphanRules.service.ts (the admin-configurable source).
Why it matters: An admin changing Orphan Rules changes the orphan count on /dashboard/priority-attention, /dashboard/flow-health, /summary, /customer, /release-readiness — but has zero effect on the Data Quality card's orphan count/penalty, and only partial effect on /explore. Same word, same dataset, different numbers depending on which page is open.
Affected users: app/data-quality, app/dashboard/data-quality, app/dashboard/priority-attention, app/dashboard/flow-health, app/summary, app/customer, app/release-readiness, app/explore — all users; admins who configure custom orphan rules expecting a consistent effect are most affected.
Severity: P1
Confidence: High confidence
Validation method: Configure a non-default Orphan Rule in admin settings, re-upload the same dataset, and compare the orphan count shown on /data-quality vs /dashboard/priority-attention vs /explore.
```

**Resolved (2026-07-14):** `dataQuality.service.ts`'s orphan penalty now calls `isOrphanByRules()` — the same
admin-configurable definition `metrics.service.ts` uses — instead of its own hardcoded field check. An
admin's Orphan Rules configuration now affects `/data-quality`'s orphan count/penalty exactly as it already
did for the 5+ dashboards. `hierarchy.service.ts`'s `/explore` definition was deliberately **not** collapsed
into the same call: it answers a structural-connectivity question ("does this issue's parent/epic link
resolve to a node actually present in this tree?"), not `isOrphanByRules()`'s data-completeness question
("does a parent-link field have a value?"). A dangling Epic Link pointing to an epic excluded from the
current upload has a field value — `isOrphanByRules()` would say "not an orphan" — but the tree still can't
connect it to anything, so it must render as unlinked. The precomputed `FlowItem.isOrphan` (rules-based)
flag is honored first; the structural check is the deliberate fallback, now documented as such in-code
(`hierarchy.service.ts`'s Step 3 comment) rather than looking like unreconciled duplicate logic. Net result:
two of the three original definitions are now one canonical definition; the third remains distinct for a
documented, still-valid structural reason.

### CP3-015 — Admin-facing "risk threshold" fields in Orphan Rules settings are stored but never read by any calculation
```text
Finding: OrphanRulesSettings.tsx presents "Min orphan count to show as a risk signal" and "Orphan ratio above which health score is reduced" as functioning controls (riskThresholdCount, riskThresholdPct in src/types/orphanRules.ts:14-17), but neither field is consumed anywhere in calculateHealthScore (metrics.service.ts:1082-1099, fixed continuous-ratio weighting) or dataQuality.service.ts's orphan penalty (lines 183-187, fixed orphanRatio*10).
Evidence: src/components/admin/OrphanRulesSettings.tsx:123-141 (UI copy); src/types/orphanRules.ts:14-17; grep confirms these two fields are read/written only by the settings UI and admin display, never by a scoring calculation.
Why it matters: An admin who sets "risk threshold % = 25" believing ratios under 25% won't affect the health score is wrong — the score is reduced continuously for any orphan ratio above 0. This is a documented control that silently does nothing.
Affected users: app/admin/settings (Orphan tab) admins; indirectly all users viewing Health Score.
Severity: P1
Confidence: High confidence
Validation method: Set riskThresholdPct to a high value (e.g. 80%), re-score a dataset with a 10% orphan ratio, and confirm the health-score orphan penalty is unchanged from the default-threshold case.
```

**Resolved (2026-07-14):** Removed `riskThresholdCount`/`riskThresholdPct` entirely — from `OrphanRules`
(`src/types/orphanRules.ts`), the "Risk thresholds" input grid in `OrphanRulesSettings.tsx`, and the
display-only `adminConsole.ts` tile that rendered `riskThresholdPct`. No calculation ever read either field
(confirmed by grep before removal); leaving a control in the admin UI that silently does nothing was the
actual defect, so removing the false promise was preferred over inventing a threshold behavior no one had
asked for.

---

## C. Metrics that are correct but incomparable across contexts, or narrower than they appear (P2)

### CP3-006 — Cycle time and lead time blend all issue types into one headline number
```text
Finding: getHealthFromIssue (metrics.service.ts:470-556) computes leadTimeDays/cycleTimeDays with no issue-type branch; summarizeFlowItems (:578-605) — which feeds the /flow-health and /sprint-kanban headline tiles — averages across all types in the list, as does kanbanFlow.service.ts:191-200. A correct per-type breakdown exists (buildTypeMetrics, metrics.service.ts:842-860) but is not consulted by the headline tiles or by calculateHealthScore's cycleScore.
Why it matters: An Epic-heavy backlog (naturally weeks-long cycle time) blended with quick Sub-tasks averages to a number that reflects neither workflow accurately.
Affected users: /flow-health, /sprint-kanban headline tiles; Health Score's cycle component.
Severity: P2
Confidence: High confidence
Validation method: Compare the headline average against buildTypeMetrics' per-type breakdown on a dataset with a wide type mix.
```

### CP3-007 — Per-assignee comparison is labeled "Team Health Comparison" without normalization
```text
Finding: buildCapacityMetrics (metrics.service.ts:693-713) groups by individual Assignee, not team, computing storyPoints/doneStoryPoints/loadShare per person; app/teams/page.tsx renders this as "Team Health Comparison," ranking individuals with no per-person estimation-scale normalization.
Why it matters: Individuals who estimate more conservatively, or work larger/harder tickets, look systematically worse in a side-by-side ranking framed as team health rather than individual workload.
Affected users: /teams.
Severity: P2
Confidence: Medium confidence (the raw comparison is confirmed unnormalized; exactly how loadShare feeds src/lib/teamHealth.ts's score was not traced in this checkpoint — that file is outside the audited service-layer scope)
Validation method: Trace src/lib/teamHealth.ts's consumption of loadShare in a future checkpoint pass, or upload data with two people of identical output but different estimation habits and compare their ranking.
```

### CP3-010 — The entire Role-Based Coaching bundle (7 generators + orchestrator + admin-signals) has no live UI consumer
```text
Finding: generateAllCoachingInsights, all 7 generate*Insight functions, and getAdminCoachingSignals() (via app/api/coaching/admin-signals/route.ts) have no client-side caller anywhere in app/ — only roleGridView.mapper.ts (feeding the live /dashboard/coaching page) is actually wired in.
Evidence: grep across app/ for each function name and for "admin-signals" returns matches only in service/type/test files.
Why it matters: ~1,300 lines of tested-but-unreachable logic, including a Prisma-backed admin endpoint, sit dormant — a future engineer could wire this up without re-running this checkpoint's checks; not a live-data risk today.
Affected users: none currently; future risk to whoever activates the bundle.
Severity: P2
Confidence: High confidence
Validation method: Confirm via grep (already done) that no fetch/import reaches these functions from app/.
```

### CP3-011 — Live coaching-grid thresholds (20%/35%/60%) are not shown to the user anywhere in-app
```text
Finding: roleGridView.mapper.ts:34,38,41 define CARRYOVER_AT_RISK_THRESHOLD_PCT=20, CAPACITY_OVERLOAD_LOAD_SHARE_PCT=35, LOW_DELIVERY_CONFIDENCE_PCT=60 — the code comment for the 20% value explicitly notes it's a placeholder "pending a real team-configured threshold." None of these three numbers appear on /dashboard/coaching, /help, or /glossary tied to this grid's rules (glossary documents a different 35%/20% pair for an unrelated portfolio chart, and a 60% threshold for sprint goal outcome — not this grid).
Why it matters: The grid shows binary status badges for rules like "Carry-over must remain below the agreed threshold" with no visible number — a user can't tell if the badge reflects their team's actual policy or an unvalidated code constant.
Affected users: /dashboard/coaching, all roles.
Severity: P2
Confidence: High confidence
Validation method: Search /dashboard/coaching's rendered copy and /glossary for the literal values 20, 35, 60 tied to carryover/capacity/confidence rules.
```

### CP3-012 — "Retro actions completed" on the live Scrum Master column is a hardcoded constant shown identically to real metrics
```text
Finding: RETRO_ACTIONS_COMPLETED_FALLBACK_PCT = 71 (roleGridView.mapper.ts:45) is used in metricsList (:90) alongside genuinely computed metrics like Blocked items and Carry-over, with no "(estimated)"/"(not tracked)" tag in the rendered value.
Why it matters: A viewer cannot distinguish "71%" (a fixed placeholder, because ownership/completion tracking doesn't exist yet, per the code comment) from real data — false precision on a number that never changes regardless of upload.
Affected users: /dashboard/coaching, Scrum Master column.
Severity: P2
Confidence: High confidence
Validation method: Upload two different datasets and confirm this value stays 71% in both.
```

### CP3-017 — Data Quality score has no sample-size awareness
```text
Finding: The score (dataQuality.service.ts:144-207) and its type (src/types/dataQuality.ts:32-45) use pure percentage-based deduction with no confidence/sample-size field — 1-of-5 missing scores identically to 600-of-3000 missing (both 20%).
Why it matters: A brand-new 5-issue project can score 100/"Excellent" with the same "Metrics are highly reliable" framing as a mature 3,000-issue dataset, despite being statistically far less representative.
Affected users: /data-quality, /dashboard/data-quality — especially early-stage/small-team tenants.
Severity: P2
Confidence: High confidence
Validation method: Upload a 5-issue fully-populated dataset and confirm it scores identically to a large fully-populated dataset.
```

### CP3-018 — `thresholds.service.ts` is not the source of truth for the score bands it appears to govern
```text
Finding: HealthThresholds (src/types/thresholds.ts:3-25) only covers 5 per-item flow flags (cycle/lead/active/open age, blocked ratio) and is correctly consumed for those. It does NOT cover the Health Score bands, Portfolio "At Risk," capacity overload, sprint-goal, or delivery-confidence thresholds Checkpoint 2 found — those are independently hardcoded in at least 10 files: src/services/export/excelInsightExport.service.ts:115, src/components/dashboard/DashboardNavSidebar.tsx:37-40, DashboardSidebarNav.tsx:23-30, src/lib/utils.ts:13, app/developer/page.tsx:615, app/admin/logs/page.tsx:11, app/backend/page.tsx:79, src/lib/releaseConfidence.ts:36, src/services/metrics/metricConfidence.service.ts:28, src/services/coaching/coachingConfidence.service.ts:20, src/services/export/recommendationEngine.ts:265, src/services/metrics/throughput.service.ts:163.
Why it matters: The admin Thresholds settings screen implies app-wide configurability of risk classification. In reality it tunes only 5 narrow per-item flags; every headline score-band threshold is a compiled-in constant duplicated across 12 files and cannot be changed by an admin — a false sense of configurability, and a maintenance risk (12 places to update if a threshold ever needs to change).
Affected users: app/admin/settings (Thresholds tab) admins; all dashboard/export consumers of Health Score bands.
Severity: P2
Confidence: High confidence
Validation method: Change a threshold in app/admin/settings and confirm which of the 12 files' displayed bands do (thresholds.service.ts-derived) and don't (hardcoded) change.
```

**Resolved for the Health Score band specifically (2026-07-14):** the audit's headline complaint — 7+
independent hardcoded copies of the 90/75/60/40 Health Score band cutoffs — is fixed. `HealthThresholds`
(`src/types/thresholds.ts`) gained four new fields (`healthScoreExcellentPct/GoodPct/FairPct/WeakPct`,
defaults 90/75/60/40), configurable in Admin Settings → "Health Score Bands" (new group in
`HealthThresholdSettings.tsx`), with server-side validation enforcing strictly-descending order
(`app/api/admin/thresholds/route.ts`). `getHealthBand()` (`src/lib/utils.ts`) now takes these thresholds
as an optional parameter (defaulting to `DEFAULT_THRESHOLDS`, so every existing single-argument call site
kept working). Migrated every duplicate reimplementation onto this one function:
`excelInsightExport.service.ts` (fixed two separate redundant reimplementations in the same file — one had
already computed the correct band via `getHealthBand()` four lines above and then re-derived it inline
anyway; a third, near-identical local `bandLabel` map a few lines further down was also consolidated),
`recommendationEngine.ts`, and `DashboardNavSidebar.tsx`. `app/admin/logs/page.tsx` and `app/backend/page.tsx`
had their own divergent `>80/60/40` copy (not `>=90/75/60/40`) — genuinely inconsistent with everywhere
else in the app; migrating them to the canonical function is a real (minor, admin-only) visible fix: scores
75-80 now correctly render the "good" green chip instead of an "at-risk" amber one.
`DashboardSidebarNav.tsx` was intentionally left untouched — confirmed unmounted, dead code (not wired into
any route), so editing it would add no live-behavior value; flagged for the same orphan-code disposition
question as `ORPHAN-02` rather than silently fixed or silently left inconsistent-looking.

**Not resolved — scope boundary found during implementation:** every current caller of `getHealthBand()`
is a client component, and `calculateHealthScore()` itself never classifies a band server-side — it only
returns a raw 0-100 number. So while the schema and canonical function now genuinely support admin
configuration, an admin who changes these 4 new fields away from their defaults will **not** yet see that
reflected in any of the migrated UI, because none of them fetch `GET /api/admin/thresholds` before calling
`getHealthBand()` — they all use the default cutoffs. Wiring live thresholds into these specific client
call sites (likely via a shared fetch/hook, since 6+ components would need it — a genuine Rule-of-Three
case, unlike inventing one for a single caller) is a distinct, larger follow-up, not done here. **Also not
resolved, and out of scope for this pass:** Portfolio "At Risk" (`portfolioHealth.ts`), sprint-goal outcome
(`throughput.service.ts`), capacity overload (`roleGridView.mapper.ts`), and the confidence-band family
(`metricConfidence.service.ts`, and the now-confirmed-dead `releaseConfidence.ts` — see CP3-020) are
distinct metrics with their own audit findings and were not part of this decision; they remain
independently hardcoded.

### CP3-021 — `computeReleaseConfidence` shares CP3-002's sample-blindness pattern and is stored as an unlabeled historical trend point
```text
Finding: computeReleaseConfidence (src/lib/releaseConfidence.ts:21-30) uses the same Math.max(totalIssues,1) guard pattern as Health Score — with totalIssues=1 and clean signals, it scores 100/"High." Unlike Health Score, this value is computed once per upload (app/api/upload/route.ts:244) and persisted as a point on the /trends historical chart (app/trends/page.tsx:119-120,209,246-247), with no sample-size or confidence indicator shown alongside it.
Evidence: file:line citations above; src/types/trends.ts:19 (releaseConfidenceScore?: number | null — no accompanying sample-size field).
Why it matters: A low-volume early upload can appear as a "High" release-confidence data point on a trend line next to later, larger, genuinely reliable uploads — visually implying comparable reliability across the whole trend.
Affected users: /trends — anyone reading the Release Confidence trend line/table.
Severity: P2
Confidence: High confidence
Validation method: Compare a small early upload's plotted value against a later large upload's on the same /trends chart.
```

---

## D. Low-impact / dead-code findings (P3)

### CP3-013 — Ceremony sprint-planning advice lacks a minimum-sample caveat
```text
Finding: sprintPlanningAdvice (ceremonyAdvice.service.ts:80-82) fires whenever avgThroughputCount > 0 with no check on sprints.length, unlike forecastEngine.service.ts which explicitly downgrades confidence and states the sprint count when validSprints.length < 4 (line 100-101).
Why it matters: A single fluke sprint can be presented as "the team's average throughput" planning baseline with full-confidence wording.
Affected users: Currently unreachable (part of the dormant bundle, CP3-010) — carries over if that bundle is ever wired up.
Severity: P3
Confidence: Medium confidence
Validation method: N/A while dormant; re-check if CP3-010's bundle is activated.
```

### CP3-016 — `orphanRelation.service.ts`'s `detectOrphans()` is fully dead code
```text
Finding: detectOrphans() is imported at relationExplorer.service.ts:11 but never invoked in that file; no page or API route calls it outside tests.
Why it matters: A fully-built 4-category orphan classifier (with per-item delivery-impact text and suggested fixes) is invisible to every user; it also ignores the admin-configurable issue-type hierarchy (uses its own hardcoded STORY_LEVEL/CHILD_LEVEL sets, lines 28-29), which would misclassify custom issue types if it were ever reconnected.
Affected users: none currently; future risk if reconnected without revisiting this gap.
Severity: P3
Confidence: High confidence
Validation method: grep confirms zero non-test call sites.
```

### CP3-019 — Two "quality score" band scales reuse identical labels with different cutoffs
```text
Finding: ColumnMappingPreview.tsx:17-18 (Excellent ≥80, Good ≥60, Fair ≥40, Weak <40, shown at upload) vs dataQuality.service.ts:28-34 (Excellent ≥90, Good ≥75, Fair ≥60, Weak ≥40, Critical <40, shown on /data-quality) — different metrics, colliding label vocabulary.
Why it matters: A user could see "Good" at 65 during upload and "Fair" at the same 65 moments later on /data-quality — the label collision (not the underlying metrics, which are legitimately different) creates confusion.
Affected users: Upload flow → /data-quality, all users.
Severity: P3
Confidence: Medium confidence
Validation method: Upload a dataset scoring ~65 on both scales and observe both labels in the same session.
```

### CP3-020 — `releaseConfidenceBand()` is dead code while `/trends` independently reimplements the same band boundaries inline
```text
Finding: releaseConfidenceBand() (src/lib/releaseConfidence.ts:33-37) is never called anywhere; app/trends/page.tsx:246 hardcodes the identical 80/60/40 boundaries inline as a color ternary instead of calling the exported function.
Why it matters: Not a data-correctness issue (the numbers happen to match today), but a duplicated-logic risk consistent with CP3-018 — a future change to the band definition in one place won't propagate to the other.
Affected users: None today (values currently agree); latent maintenance risk.
Severity: P3
Confidence: High confidence
Validation method: grep confirms releaseConfidenceBand has zero call sites outside its own file.
```

**Resolved (2026-07-17):** `app/trends/page.tsx` now calls `releaseConfidenceBand()` and maps its band
result (High/Medium/Low/Critical) to a color via a small local `RELEASE_CONFIDENCE_COLOR` lookup, replacing
the inline `>= 80 ... >= 60 ...` ternary. `releaseConfidenceBand()` now has a real caller. Visual output is
byte-identical to before (High→green, Medium→amber, Low and Critical both→red, same as the original 3-color
ternary) — this closes the duplication risk without changing anything a user sees. Existing test coverage
(`src/__tests__/releaseConfidenceTrend.test.ts`) already asserted the exact 80/60/40 cutoffs this reuses.

---

## E. Clean / well-guarded calculations (checked, no defect found)

Stated plainly per the audit's evidence rules — these were checked, not skipped:

- **Zero-denominator guards** are consistently applied throughout `metrics.service.ts` and `throughput.service.ts` via a `condition ? Math.round(a/b*100) : 0` pattern (completionRate, pointCompletionRate, loadShare, progress across sprints/epics/quarters/labels/types/projects/parents). No raw `NaN`/`Infinity` found anywhere in the audited files.
- `calculatePrediction` (metrics.service.ts:1104-1137) correctly returns `{ complete: false, daysRemaining: null }` rather than a fabricated ETA when data is insufficient.
- `calcTrend` (throughput.service.ts:216-226) correctly returns a neutral result rather than dividing when fewer than 2 sprints exist.
- `bottleneck()` and `flowEfficiency()` (kanbanFlow.service.ts:121-128, 114-117) both guard their divisions explicitly.
- **Scrum/Kanban segregation is done correctly**: `calculateSprintThroughput` only processes issues with a Sprint field (throughput.service.ts:243-245); `calculateKanbanFlow` only processes issues without one (kanbanFlow.service.ts:152-154). The two datasets never overlap, and `/sprint-kanban` renders them as clearly separated sections rather than blending them into one score. This checkpoint's "mixed Scrum/Kanban metrics" concern is **not substantiated** — checked and clean.
- `forecastEngine.service.ts` (the real `/forecast` engine, as opposed to `/roadmap`'s broken duplicate at CP3-008) has excellent zero-sample handling: explicit `insufficient_data` status with plain-language reasoning, and its confidence score is honestly blended from sprint count, trend, blocked count, and Data Quality band — this is the strongest-designed calculation found in the whole audit and is a good reference example for fixing the weaker ones above.
- `metricConfidence.service.ts`'s own math is sound (only its lack of downstream wiring is a problem — see CP3-004).
- `recommendationEngine.ts` guards every ratio and correctly requires `sprint.totalSprints >= 2` before drawing a completion-trend conclusion — a small-sample guard this file gets right where `ceremonyAdvice.service.ts` (CP3-013) does not.
- `retroInsights.service.ts` theme detection explicitly excludes positive (`wentWell`) text from negative-theme scanning (a deliberate, correct choice, line 162-166), and all detectors return empty arrays rather than crashing or fabricating results on sparse input.
- Coaching's dormant generator bundle (CP3-010) is, apart from being unreachable, internally well-guarded: every generator only asserts a signal when a real count is `>0`, and the capacity-overload check is correctly guarded by a minimum-sample condition (`metrics.capacity.length > 2`) in both `engineeringManager.generator.ts:39` and `scrumMaster.generator.ts:77`, matching the same pattern already used in the live `roleGridView.mapper.ts`.
- `issueTypeHierarchy.service.ts` → `hierarchy.service.ts` → `relationExplorer.service.ts` wiring (`/explore`) correctly propagates admin-configured custom issue types end-to-end, with a reasonable fallback to defaults if the config fetch fails.

---

## F. Finding-count summary

| Severity | Count | IDs |
|---|---|---|
| P0 | 3 | CP3-001, CP3-002, CP3-008 |
| P1 | 5 | CP3-003, CP3-004, CP3-005, CP3-009, CP3-014, CP3-015 *(6 — see note)* |
| P2 | 8 | CP3-006, CP3-007, CP3-010, CP3-011, CP3-012, CP3-017, CP3-018, CP3-021 |
| P3 | 5 | CP3-013, CP3-016, CP3-019, CP3-020 |

*Note: P1 row lists 6 IDs against a count of 5 — corrected count is **6** (CP3-003, CP3-004, CP3-005, CP3-009, CP3-014, CP3-015). Total findings this checkpoint: **22** (3 P0 + 6 P1 + 8 P2 + 5 P3).*

No Keep/Merge/Remove/Rewrite recommendation is made for any finding in this file — that judgment is reserved for Checkpoint 4 (duplication/necessity) and Checkpoint 6 (prioritized backlog), per the audit's execution-control rules.
