# Delivery Clarity — Clarity & Misleading Data (Checkpoint 2 + Checkpoint 3, complete)

**Status: COMPLETE** for this file's scope (content-clarity terminology audit + misleading-calculation audit). Section A–E were produced in Checkpoint 2 (content clarity). Section F was added in Checkpoint 3 (misleading-calculation tracing) and resolves the six items previously listed under "Pending for Checkpoint 3" below. Full findings for each Section F item live in `08-metric-dictionary.md` (the authoritative Checkpoint 3 record); this section cross-references those finding IDs rather than repeating full evidence. No Keep/Merge/Remove/rename recommendation is made anywhere in this file — that judgment is reserved for Checkpoint 4/6.

**Evidence basis:** All findings below are direct code-inspection results (grep + read) produced by a dedicated research pass. No rendered verification was performed (blocked app-wide, see `00-audit-control.md` §4). Every row cites `file:line`.

---

## A. Same word, genuinely different calculations

The single most consequential clarity risk found in Checkpoint 2: several words are used as labels for **multiple, mutually distinct calculations**, with no on-page disambiguation.

### "Confidence" — 4 unrelated meanings, same word

| Where | What it actually measures | Evidence |
|---|---|---|
| Metric Confidence Score | Per-KPI data-completeness reliability | `src/services/metrics/metricConfidence.service.ts`, surfaced in `app/developer/page.tsx:1142` |
| Release Confidence Score | Release-readiness weighted 0–100 score | `src/lib/releaseConfidence.ts`, surfaced in `app/developer/page.tsx:1285`, `app/glossary/page.tsx:163` |
| Delivery Confidence (`overallDeliveryConfidence`) | Sprint-throughput reliability percentage | `app/forecast/page.tsx:673`, `app/sprint-kanban/page.tsx:401,423`, `src/components/dashboard/SprintThroughputPanel.tsx:178` |
| Forecast Confidence | Epic-level High/Med/Low band derived from sprints-remaining | `app/roadmap/page.tsx:245,285`, `app/glossary/page.tsx:200` |

**Finding:**
```text
Finding: The word "Confidence" labels 4 structurally unrelated calculations across the app with no page cross-linking or disambiguating which one is meant.
Evidence: file:line citations above (4 independent services/formulas).
Why it matters: A user who learns "Confidence" means one thing on /forecast will misapply that mental model on /customer, /roadmap, or /dashboard/data-quality — the numbers are not comparable and the UI gives no signal that they shouldn't be.
Affected users: All roles that view more than one of these pages (nearly everyone, since /forecast, /roadmap, and /customer are all in main navigation).
Recommendation: Not made at this checkpoint (Checkpoint 4 territory) — flagged as a strong rename/disambiguation candidate, e.g. "Data Confidence," "Release Confidence," "Delivery Confidence," "Forecast Confidence" as fully distinct on-page labels (three of the four already have a qualifying word in code; the gap is that plain "Confidence" is what several pages actually render).
Severity: P1 (clarity/trust — no false data, but high misinterpretation risk)
Confidence: High confidence (code-confirmed, 4 independent sources)
```

**Resolved (2026-07-18):** Implemented as a rename-only fix per an approved terminology-rename table (Checkpoint 4/6 product decision — not the exact candidate names sketched above; the approved table uses more specific wording per location). All four "Confidence" meanings are now visually distinct: the per-KPI badge (`MetricConfidenceBadge.tsx`, wired via `DCKpiCard.tsx`) now reads "KPI Reliability" instead of bare "Confidence"; `/sprint-kanban` and `/customer`'s bare "Confidence" labels for `overallDeliveryConfidence` now read "Delivery Confidence," matching what `/forecast` already used; `/roadmap`'s per-epic column header now reads "Epic Timeline Confidence" (the High/Medium/Low badge value itself is unchanged); and `/forecast`'s project-wide blended reliability chip now reads "High/Medium/Low Forecast Reliability" instead of "…confidence." Release Confidence Score was already distinctly named and needed no change. `/data-quality` and `/dashboard/data-quality`'s mislabeled "Data confidence" (which was actually the Data Quality Score) was also corrected to "Data Quality Score" as part of the same pass. No calculation changed — only display labels, aria-labels, column headers, and the `/glossary`, `/help`, and `/developer` doc text describing them. See `TODO-List.md` for the full rename table and branch name.

### "At Risk" — 6 incompatible threshold definitions for the same label

| Context | Threshold that makes something "At Risk" | Evidence |
|---|---|---|
| General Health band | Health score ≥ 40 (and < 60) | `app/glossary/page.tsx:63` |
| Team Health band | Score ≥ 40 (and < 60) | `app/glossary/page.tsx:166` |
| Portfolio band | Score ≥ 35 (different cutoff from the two above) | `app/glossary/page.tsx:168` |
| Sprint Goal status | Completion < 60% **while the sprint is still active** — not a score band at all | `app/glossary/page.tsx:96` |
| Forecast status | 7–12 sprints remaining (a count, not a score) | `app/glossary/page.tsx:204` |
| Ops health (admin diagnostics) | Ops score < 60 | `app/admin/diagnostics/page.tsx:137` |

```text
Finding: "At Risk" is defined 6 different, mutually incompatible ways across the app, and none of the 6 thresholds are shown inline on the page that uses the label — only in /help, /glossary, or /developer.
Evidence: 6 file:line citations above, all from /glossary itself (i.e. the app's own reference documentation confirms the inconsistency).
Why it matters: A Product Owner who internalizes "At Risk = below 40" from /dashboard will misjudge a Sprint Goal "At Risk" flag (a completion-percentage rule) or a Forecast "At Risk" flag (a sprint-count rule) using the wrong mental model.
Affected users: Scrum Masters and Product Owners most (they see Sprint Goal and Forecast framing most often); Executives least (mostly see aggregate Health/Portfolio bands).
Recommendation: Not made at this checkpoint — candidate for either (a) genuinely different labels per context, or (b) a single, consistently-applied "At Risk" rule with context-specific labels for the others (e.g. "Behind Pace" for the sprint-goal case). Needs product-level judgment in Checkpoint 4/6, not a mechanical fix.
Severity: P1
Confidence: High confidence (all 6 sources are the app's own glossary content, not inferred)
```

**Resolved (2026-07-18):** Implemented option (a) from the recommendation above — genuinely different labels per context — per an approved terminology-rename table. The sidebar's General Health band (the canonical, most-visible "At Risk" usage, shown on every `/dashboard/*` page) had its own separate spelling bug — hyphenated "At-Risk" instead of `/glossary`'s "At Risk" — which was corrected, but the bare term itself was kept since this is the one genuinely primary/shared usage. The other 5 meanings were given distinct labels: Team Health band → "Team At Risk"; Portfolio band → "Portfolio At Risk"; Sprint Goal status → "Behind Pace" (exactly the example the recommendation above suggested); Forecast status → "Timeline At Risk"; Ops health (admin diagnostics) → "Ops At Risk." Two more bare "At Risk" KPI-tile occurrences found during implementation (`/roadmap` and `/dashboard/epic-readiness`'s count of epics with a warning-health child issue — not a score band, and not one of the 6 rows in the table above, since it's a different signal than the epic-readiness score) were also disambiguated, to "Epics Needing Attention." `/glossary` and `/help` band definitions were updated to match. No threshold changed — only the label attached to each threshold.

### "Health Score" — same label, different formula, no on-page distinction

`app/teams/page.tsx:228` renders a "Health Score" heading using a **per-assignee Team Health formula**, distinct from the overall-project Health Score shown via `DashboardNavSidebar.tsx:174`/`app/charts/page.tsx:368`. The divergence is documented in `app/help/page.tsx:293-294` — but not on the page itself.

```text
Finding: Two differently-computed metrics share the identical visible label "Health Score."
Evidence: app/teams/page.tsx:228 vs. app/charts/page.tsx:368 / DashboardNavSidebar.tsx:174; divergence acknowledged in app/help/page.tsx:293-294.
Why it matters: Comparing "my team's Health Score" to "the project's Health Score" as if they're the same number is a natural but incorrect inference the UI does nothing to prevent.
Affected users: Engineering/Delivery Managers, Scrum Masters (primary /teams audience).
Recommendation: Not made at this checkpoint — rename candidate (e.g. "Team Health Score" on /teams specifically).
Severity: P2
Confidence: High confidence
```

**Resolved (2026-07-18):** Implemented exactly the rename candidate suggested above — `/teams`' chart section header now reads "Team Health Score" instead of bare "Health Score," matching how `/glossary`, `/developer`, and the landing page's `DashboardPreview` component already qualified it. This was a missing-qualifier fix, not new vocabulary — no formula changed.

### "Risk" as a bare table column header, two different classifications

`app/dashboard/epic-readiness/page.tsx:166` and `src/components/dashboard/SprintThroughputPanel.tsx:186` both use the bare header `'Risk'` for structurally different per-row classifications (epic risk band vs. per-sprint risk chip, per `SprintThroughputPanel.tsx:12`).

```text
Finding: Bare column header "Risk" used for two different classification schemes.
Evidence: app/dashboard/epic-readiness/page.tsx:166; src/components/dashboard/SprintThroughputPanel.tsx:186,12.
Why it matters: Lower severity than the above — within a single table the meaning is locally clear from context, but a user skimming both tables in one session could conflate the two schemes.
Affected users: Anyone viewing both Epic Readiness and a Sprint Throughput panel in the same session.
Recommendation: Not made at this checkpoint.
Severity: P3
Confidence: High confidence
```

### "Readiness" — spans two conceptually different scoring systems

Epic Readiness (`app/help/page.tsx:133-135`: 0–100 score, "below 50 flagged At Risk") vs. Release Readiness / `/readiness` (Go/Conditional Go/No-Go gate — a categorical verdict, not a 0–100 score) — same word, different shape of output entirely (continuous score vs. discrete verdict).

```text
Finding: "Readiness" names both a continuous 0-100 score (epics) and a discrete pass/fail verdict (releases) with no page distinguishing the two output types by name.
Evidence: app/help/page.tsx:133-135 (epic); app/release-readiness/page.tsx + app/readiness/page.tsx (release, per Checkpoint 1 inventory).
Why it matters: A user asking "what does Readiness mean here" gets a different *kind* of answer (a number vs. a verdict) depending on which of 3 routes they're on.
Affected users: Product Owners primarily (Epic Readiness is their page); anyone checking release gates.
Recommendation: Not made at this checkpoint.
Severity: P2
Confidence: High confidence
```

**Resolved (2026-07-18):** Implemented at the `/help` page — the single "Readiness" FAQ section, which mixed the Epic Readiness continuous score and the Release Readiness discrete verdict under one bare heading, was split into two sections, "Epic Readiness" and "Release Readiness," each keeping its original FAQ content unchanged (only the section titling/grouping changed). This closes the terminology-collision gap on `/help`; the underlying route names (`/roadmap`, `/dashboard/epic-readiness`, `/release-readiness`, `/readiness`) were out of scope for this rename pass and were not touched.

---

## B. Judgment-sounding labels shown without their threshold

"Critical" and "Overloaded" are rendered throughout the app as bare colored chips/counts (e.g. `app/dashboard/priority-attention/page.tsx:152`, `app/portfolio/page.tsx:401`) — the numeric threshold that triggers them exists only in code (e.g. `loadShare > 35` in `app/dashboard/priority-attention/page.tsx:78-79` and `app/summary/page.tsx:63-64`) or in `/help`/`/glossary`, never as inline page copy stating "why."

```text
Finding: Status labels that imply a judgment ("Critical," "Overloaded") are shown without their triggering threshold on the same page.
Evidence: app/dashboard/priority-attention/page.tsx:78-79,152; app/summary/page.tsx:63-64; general pattern across app/portfolio/page.tsx:401 and others.
Why it matters: A generated Smart Action might tell a manager "X carries 42% — consider redistributing" without ever surfacing that 35% is the line that triggered it — the user can't independently verify or challenge the flag.
Affected users: Engineering/Delivery Managers (capacity), all roles (Critical flags generally).
Recommendation: Not made at this checkpoint — likely low-effort fix (surface the threshold value already computed in code as UI copy) once prioritized.
Severity: P2
Confidence: High confidence
```

---

## C. Headline numbers shown without a stated time period

Checked 8 pages with prominent headline percentages/scores (`/summary`, `/dashboard/key-metrics`, `/dashboard/ownership`, `/customer`, `/forecast`, `/roadmap`, `/teams`, `/portfolio`). **None of the 8 states an explicit time window** (e.g. "last 30 days," "as of [upload date]") for its headline numbers — all implicitly reflect the single most recent upload.

Two pages set a clear positive example worth generalizing from:
- `/forecast` (`app/forecast/page.tsx:1107`): "Model: linear velocity extrapolation · 2-week sprints assumed · Confidence reflects data completeness and velocity stability" — states its model assumptions inline.
- `/portfolio` (`app/portfolio/page.tsx:289,291`): renders both the band name and `BAND_MEANINGS[band]` inline — explains itself without a trip to `/glossary`.

```text
Finding: Headline metrics on 8 checked pages (and by extension, likely most pages showing similar KPIs) do not state what time period the number covers.
Evidence: grepped for "last N days"/"as of" patterns across app/summary/page.tsx, app/dashboard/key-metrics/page.tsx, app/dashboard/ownership/page.tsx, app/customer/page.tsx, app/roadmap/page.tsx, app/teams/page.tsx — zero matches in any.
Why it matters: A user cannot tell from the page alone whether "68% complete" reflects today's data or a stale upload from weeks ago (the app does support multiple uploads over time, per /trends).
Affected users: All roles — this affects trust in every headline number in the app.
Recommendation: Not made at this checkpoint — /forecast and /portfolio (above) are good in-app precedent for how to do this without a redesign.
Severity: P1 (trust/clarity — directly affects whether a user can trust a number without cross-checking)
Confidence: High confidence (explicit grep search, zero matches)
```

---

## D. Generic button labels — checked, not a problem

Searched button/action labels across 15 pages spanning dashboard, analytics, and admin areas. **No occurrences found** of a bare "Submit"/"Save"/"OK"/"Confirm"/"Go"/"View" label with no surrounding context. Icon-only controls consistently carry `aria-label` (e.g. `app/members/page.tsx:207`, `app/work-explorer/page.tsx:424`). Buttons are self-descriptive (e.g. "Go to Dashboard," "Upload data," "Export"). **This is a clean result, stated plainly rather than omitted**, per the audit's evidence rules.

---

## E. Capitalization/pluralization — checked, not a problem

"Story Points" and "Sprint(s)" are used consistently as Title Case wherever they appear as a UI label; lowercase occurrences are inside ordinary prose sentences (grammatically correct, not an inconsistency). **No significant finding.**

---

## F. Misleading-calculation audit (Checkpoint 3, Phase 2D)

Each Phase 2D item below was traced to source in Checkpoint 3. Full evidence and Finding-block detail for every ID cited here is in `08-metric-dictionary.md`; this section states the resolution and points to the ID, per this file's role as the clarity-focused index rather than the full calculation record.

**Averages/percentages shown without sample size or without flagging extreme-value skew — CONFIRMED, widespread.**
Health Score, cycle/lead-time headline tiles, Kanban Flow Health, and the Data Quality score all lack any sample-size gate or display — see `08-metric-dictionary.md` CP3-002 (Health Score/cycle-time can render "green" from 1 issue), CP3-005 (Kanban Flow Health defaults "Healthy" at zero sample), CP3-017 (Data Quality score has no sample-size awareness — a 5-issue dataset scores identically to a 3,000-issue one), CP3-021 (Release Confidence trend points carry no sample-size indicator). A real reliability signal exists (`metricConfidence.service.ts`) but isn't connected to any of these displays — CP3-004.

**Whether "green" statuses can occur on incomplete/low-confidence data — CONFIRMED.**
Directly substantiates the pattern above. See CP3-002 and CP3-005. The root cause in both cases is the same: a zero/near-zero sample is treated as "nothing wrong" rather than "insufficient data to judge."

**Whether story points or velocity are ever compared across teams without normalization — CONFIRMED, two distinct instances.**
Sprint Throughput and Kanban Flow group by sprint name / completion month only (not by team), pooling multiple teams' story points and velocity under one arbitrary team label — CP3-003. Separately, `/teams`' "Team Health Comparison" actually ranks individual assignees against each other with no estimation-scale normalization, despite the page's team-level framing — CP3-007.

**Cycle time without issue-type segmentation — CONFIRMED.**
The headline cycle/lead-time tiles on `/flow-health` and `/sprint-kanban` blend all issue types (Epics, Stories, Bugs, Sub-tasks) into one average, even though a correct per-type breakdown already exists in the codebase and simply isn't consulted by these tiles — CP3-006.

**Whether Scrum and Kanban metrics are ever mixed in one view without explanation — CHECKED, NOT SUBSTANTIATED (clean result).**
`calculateSprintThroughput` and `calculateKanbanFlow` operate on strictly disjoint issue sets (sprint-tagged vs. not), and `/sprint-kanban` renders them as clearly separated sections. No mixing was found. Stated plainly per the audit's evidence rules rather than omitted — see `08-metric-dictionary.md` §E.

**Full metric-by-metric reliability classification — COMPLETE.**
`08-metric-dictionary.md` is that classification: 22 findings (3 P0, 6 P1, 8 P2, 5 P3) across the core metrics engine, forecast/coaching/retro, and data-quality/relations/thresholds layers, plus a documented list of clean/well-guarded calculations (§E of that file). Two additional, previously-unknown P0s were found beyond this file's original Phase 2D scope: the Release Readiness per-version engine never activates on real data due to a type mismatch (CP3-001), and `/roadmap`'s forecast is permanently broken by an unrelated field-name mismatch, independent of `/forecast`'s correctly-functioning engine (CP3-008).

### New terminology finding from Checkpoint 3

Checkpoint 2 (§A above) catalogued 4 distinct meanings of "Confidence." Checkpoint 3's calculation trace surfaced a 5th: `/roadmap`'s epic-forecast confidence badge uses the same "high/medium/low" vocabulary as `/forecast` but a materially different and weaker method (distance-to-completion only, vs. `/forecast`'s blend of sprint count, trend, blocked count, and data quality), with no on-page caveat — CP3-009. This strengthens rather than changes Checkpoint 2's rename/disambiguation recommendation; still not resolved at this checkpoint (Checkpoint 4/6 territory).

**Partially resolved (2026-07-18):** The label-collision half of this finding is resolved — `/roadmap`'s badge no longer shares the bare word "Confidence" with `/forecast` (see the §A "Confidence" resolution note above; the roadmap column header now reads "Epic Timeline Confidence"). The underlying methodological gap CP3-009 actually describes — that the weaker distance-to-completion method exists at all, independent of what it's labeled — is unchanged and remains open.
