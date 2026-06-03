# Delivery Clarity — Technical Method

**Document type:** Technical Method Description
**Author:** Ali Abu Ras
**Date:** 2026-06-03
**Version:** 4.0

---

## System Overview

Delivery Clarity transforms static Jira project exports into delivery intelligence through eight sequential technical methods. Each method solves a distinct problem. The methods are composable and can operate independently.

---

## Method 1: Zero-Credential Export Ingestion

**Problem:** Live API tools require credential storage, network access, and Jira admin permissions.

**How it works:**
1. User uploads a CSV or XLSX file via a browser drag-and-drop or file picker
2. The file is parsed server-side using SheetJS
3. All computation occurs in the server process — no outbound network calls
4. Results are stored in the client's localStorage or (with F3 enabled) SQLite
5. Credentials are never requested, stored, or transmitted

**Implementation:** `src/services/jira/parser.ts` — `parseJiraFile()`

---

## Method 2: Field Normalisation

**Problem:** Jira CSV exports use inconsistent field names across versions, regions, and custom project configurations. The same field may appear as "Epic Link", "Epic Name", "Custom field (Epic Link)", or "EpicLink".

**How it works:**
1. Extract all column headers from the uploaded file
2. Apply the FIELD_ALIASES map (40+ mappings) to normalise each header to a canonical field name
3. For each canonical field, apply a type-safe parser: `parseDate()` (6 format variants), `safeInt()`, `parseLabels()`, `parseBoolean()`
4. Issues with no recognised essential fields (Issue Key, Issue Type, Summary, Status) are rejected with a specific error

**Key design:** The alias resolver handles: lowercase variants, space/underscore/hyphen variants, Jira version-specific names, and locale variants. Parser functions are null-safe and never throw.

**Implementation:** `src/services/jira/parser.ts` — `FIELD_ALIASES`, `parseDate()`, `safeInt()`

---

## Method 3: Incomplete Hierarchy Reconstruction

**Problem:** Jira exports frequently have incomplete parent-child relationships. Sub-tasks may lack Parent Key. Stories may lack Epic Link. The hierarchy graph has gaps.

**Algorithm:**

```
INPUT: issues[] — flat array of normalised JiraIssue records

STEP 1 — Build explicit link index:
  For each issue:
    IF issue.ParentKey is set AND exists in keySet:
      Add edge: parentKey → issue.key (type=PARENT_KEY, confidence=1.0)
    ELSE IF issue.EpicLink is set AND exists in keySet:
      Add edge: epicLink → issue.key (type=EPIC_LINK, confidence=1.0)

STEP 2 — Apply key-prefix inference:
  For each issue WHERE no parent was resolved in Step 1:
    Extract key prefix (e.g. "PROJ" from "PROJ-123")
    Search for Epic issues with the same prefix
    IF found: Add inferred edge (type=INFERRED_PREFIX, confidence=0.8)

STEP 3 — Mark orphans:
  For each issue WHERE no link resolved above threshold (0.5):
    Mark as orphan with appropriate classification

OUTPUT: HierarchyMap {
  children: Map<parentKey, childKey[]>
  parent: Map<childKey, parentKey>
  epic: Map<childKey, epicKey>
  links: HierarchyLink[]
  orphanKeys: Set<string>
}
```

**Implementation:** `src/services/relations/hierarchy.service.ts`

---

## Method 4: Orphan Risk Detection and Classification

**Problem:** Issues with no hierarchy link are silently excluded from epic-level reporting, creating invisible gaps in delivery tracking.

**Algorithm:**

```
INPUT: issues[], orphanKeys (from Method 3)

For each orphan issue:
  Determine classification:
    IF issue has EpicLink/ParentKey that doesn't exist in keySet:
      → DANGLING_LINK
    ELSE IF type is Sub-task or Bug:
      → MISSING_PARENT
    ELSE IF type is Story, Task, Feature, Improvement:
      → MISSING_EPIC
    ELSE:
      → FULLY_ORPHANED

  Generate:
    deliveryImpact: specific statement about what reporting this breaks
    suggestedFix: specific action to resolve the orphan

OUTPUT: OrphanReport[] — each with classification, impact, fix
```

**Key insight:** The classification determines the severity and routing of the fix. DANGLING_LINK is a data export problem; MISSING_EPIC is a Jira data governance problem; FULLY_ORPHANED may indicate a process gap.

**Implementation:** `src/services/relations/orphanRelation.service.ts`

---

## Method 5: Multi-Signal Delivery Health Scoring

**Problem:** A single metric (e.g. completion rate) is insufficient to represent true delivery health. A project at 80% completion with 5 blocked critical items is not in good health.

**Algorithm:**

```
INPUTS: completionRate, criticalCount, warningCount, totalCount,
        blockedCount, avgCycleTimeDays, recentSprintTrend, orphanCount

signal_1: completion_signal   = completionRate / 100              → weight 0.25
signal_2: flow_signal         = 1 - (criticalRatio + warningRatio×0.5) → weight 0.20
signal_3: trend_signal        = {improving:1.0, stable:0.67, declining:0.33} → weight 0.15
signal_4: cycle_time_signal   = {≤5d:1.0, ≤10d:0.75, ≤14d:0.50, >14d:0.25} → weight 0.15
signal_5: blocked_signal      = 1 - (blockedCount / totalCount)    → weight 0.15
signal_6: orphan_signal       = 1 - (orphanCount / totalCount)     → weight 0.10

health_score = CLAMP(
  (s1×25 + s2×20 + s3×15 + s4×15 + s5×15 + s6×10),
  min=0, max=100
)

band = SWITCH(score):
  ≥90 → Excellent (green)
  ≥75 → Good (teal)
  ≥60 → Moderate (amber)
  ≥40 → At Risk (orange)
  <40  → Critical (red)
```

**Each signal is independently interpretable.** The dashboard can show "flow health is dragging the score from 82 to 74" by comparing the weighted contribution of each signal.

**Implementation:** `src/services/metrics/metrics.service.ts` — `calculateHealthScore()`

---

## Method 6: Throughput and Sprint Analytics

**Problem:** Sprint data in Jira exports is implicit — sprint dates are stored per issue rather than as sprint-level records, making throughput calculation non-trivial.

**Algorithm:**

```
INPUT: issues[] with Sprint, Sprint Start, Sprint End, Done Date, Story Points

GROUP issues by sprint name

For each sprint group:
  RESOLVE sprint dates:
    1. Read Sprint Start / Sprint End fields from any issue in the group
    2. FALLBACK: derive start=min(createdDate), end=max(doneDate)

  COMPUTE midpoint = start + FLOOR((end - start) / 2)

  committed_count  = issues.length
  committed_points = SUM(storyPoints)
  completed        = issues WHERE doneDate <= end AND status ∈ DONE_STATUSES
  mid_done         = completed WHERE doneDate <= midpoint

  mid_pct        = mid_done.count / committed_count × 100
  completion_pct = completed.count / committed_count × 100

  pattern = CLASSIFY(mid_pct, addedScope, blockedCount):
    blocked_count ≥ 2   → Blocked Sprint
    addedScope > 20%    → Scope Instability
    mid_pct ≥ 50        → Healthy Early Progress
    mid_pct ≥ 30        → Late Delivery Risk
    else                → End-Loaded Sprint

SORT sprints by sprintEnd DESC (most recent first)

COMPUTE averages, trend:
  trend = AVG(last3.throughput) - AVG(prev3.throughput)
```

**Implementation:** `src/services/metrics/throughput.service.ts`

---

## Method 7: Explainable Recommendation Generation

**Problem:** ML-based recommendation systems produce outputs without traceable evidence. Users cannot verify why a recommendation was made.

**Algorithm:**

```
INPUTS: DashboardMetrics (all computed signals)

For each RULE in RULE_SET:
  EVALUATE threshold condition against metrics
  IF condition is true:
    EMIT Recommendation {
      priority:        derived from severity of threshold breach
      area:            derived from which metric domain is affected
      text:            templated string with specific values substituted
      evidence:        "N items with X condition were found in this export"
      impact:          "This causes Y to be affected"
      suggestedOwner:  role most appropriate to act
      suggestedAction: specific, actionable next step
    }

SORT recommendations: Critical → High → Medium → Low
```

**Rule examples:**
- `blockedIssues ≥ 3` → Critical / Delivery → "Escalate N blocked items immediately"
- `avgLeadTimeDays > 21` → High / Flow → "Lead time is N days — review process bottlenecks"
- `orphanRatio > 15%` → High / Data → "N orphan items compromise epic-level reporting"
- `midSprintPct < 20% across 2+ sprints` → Medium / Process → "End-loaded sprints detected"

**Implementation:** `src/services/export/recommendationEngine.ts`

---

## Method 8: Statistical Excel Export

**Problem:** Existing Excel exports copy UI data tables. They are not independently useful without the application.

**How it works:**

1. The 17-sheet workbook is built from computed metrics, not raw issue rows
2. Derived statistics are computed specifically for the Excel context:
   - Lead time / cycle time percentiles (P50, P75, P85, P95)
   - Sprint velocity trend deltas
   - Release readiness (Go/Conditional Go/No-Go) per fix version
   - Story point burn-down forecast: remainingPoints / avgSprintPoints = estimated sprints remaining
3. Each sheet has a specific audience (Executive Summary → C-level; Sprint Throughput → Scrum Master)
4. Metric Dictionary sheet documents every formula, so the workbook is self-explanatory

**Implementation:** `src/services/export/excelInsightExport.service.ts`

---

---

## Method 9: Data Quality Scoring

**Problem:** Users don't know how reliable their Jira data is before viewing dashboard metrics. A team that never fills in Story Points or Sprint fields gets the same visual presentation as a team with complete data — creating false confidence.

**How it works:**
1. After `parseJiraFile()` and before `calculateDashboardMetrics()`, the upload API calls `calculateDataQuality(issues)`.
2. 10 fields are checked: Created Date, Done Date, Story Points, Sprint, Assignee, Epic Link / Parent Key, In Progress Date, Due Date, Priority, Labels.
3. For each field, the fill rate (% of issues with a non-empty value) is computed.
4. A weighted score is calculated based on field criticality. Essential timing fields (Created Date, Done Date) carry higher weight than cosmetic fields (Labels).
5. The score is normalised to 0–100 and assigned a band: Excellent (≥90), Good (≥75), Fair (≥50), Poor (≥25), Critical (<25).
6. A plain-English summary is generated explaining the band and top improvement actions.

**Key design:** The score is computed once per upload and stored as part of the metrics response. It is displayed on the column-mapping preview page and in the dashboard Data Quality card.

**Implementation:** `src/services/dataQuality/dataQuality.service.ts` — `calculateDataQuality()`

---

## Method 10: Metric Confidence Scoring

**Problem:** A metric like "Average Cycle Time = 8.2 days" looks precise but may be calculated from only 3 resolved issues in a 200-issue dataset, making it statistically unreliable.

**How it works:**
1. After computing all dashboard metrics, `calculateMetricConfidence(issues)` is called.
2. For each major KPI (Sprint Throughput, Kanban Flow, Cycle Time, Lead Time, Velocity, Orphan Ratio, etc.), confidence is assessed by checking: which required fields are present, what percentage of issues provide data for the metric, and whether the sample size is statistically meaningful.
3. Confidence levels are: High (all required fields, sufficient sample), Medium (some fields missing, metric is estimable), Low (significant data gaps, interpret with caution), Unreliable (critical fields absent, metric cannot be trusted), N/A (metric not applicable to this dataset).
4. For each KPI card on the dashboard, a confidence badge is rendered. Hovering shows the reason and which fields are missing.

**Implementation:** `src/services/metrics/metricConfidence.service.ts` — `calculateMetricConfidence()`

---

## Method 11: Missing-Column Impact Explanation

**Problem:** When optional Jira fields are absent, metrics degrade silently. Users don't know which sections of the dashboard are affected or what they'd gain by improving their export.

**How it works:**
1. `calculateFieldImpacts(issues)` runs after the upload, checking which of the 53 optional fields are absent.
2. For each missing field, a pre-defined impact descriptor is returned: which metrics are degraded, which dashboard sections are affected, what the user would see now vs. what they'd gain.
3. This data is displayed on the column-mapping preview and in the Data Quality section.

**Implementation:** `src/services/dataQuality/missingFieldImpact.service.ts` — `calculateFieldImpacts()`

---

## Method 12: Browser Local-Data Reset

**Problem:** Computed metrics are stored in `localStorage` under `dc_` prefixed keys. When users return to the app, stale data from a previous upload persists. Users need a safe, guided way to clear this data without accidentally clearing unrelated browser data or deleting server records.

**How it works (planned — P1.2):**
1. On the Upload/Landing page, the app calls `hasMetrics()` (checks for `dc_metrics` key) on mount.
2. If stored data is detected, a "Stored data found" notice is shown with a "Clear stored data" button.
3. The clear action shows a confirmation modal warning that the action may end the current session.
4. On confirm, a `clearDeliveryData()` function removes all keys matching the `dc_` prefix from both `localStorage` and `sessionStorage`. If session cookies are cleared, the user is redirected to `/login`.
5. The action does NOT delete server-side import logs or database records.
6. The same action is available in Admin settings for administrators.

**Implementation:** Planned — `src/lib/storage.ts` — `clearDeliveryData()`; `app/page.tsx` (detection + button); `app/admin/settings/page.tsx` (admin panel)

---

## Method 13: Dashboard Section Visibility

**Problem:** The dashboard shows all sections simultaneously, creating visual overwhelm for users who only need one area of information at a time (e.g., a Scrum Master looking only at sprint health).

**How it works (planned — P1.3):**
1. A `DashboardSectionSwitcher` component is placed at the top of the dashboard, immediately after the main Overview section.
2. It maintains state: `viewMode` (overview | single-section | full) and `activeSection` (one of the section keys).
3. In overview mode (default): the full top summary is visible; heavy detail sections are hidden.
4. In single-section mode: only the selected section is visible; all others are hidden.
5. In full mode: all sections are visible (existing behaviour).
6. Section visibility changes are animated using CSS transitions (opacity 0→1, transform translateY 8px→0, 180ms ease).
7. When `prefers-reduced-motion: reduce` is detected, transitions are disabled (instant show/hide).
8. Clicking a section button triggers `scrollIntoView({ behavior: 'smooth', block: 'start' })` — instant scroll if reduced motion is active.

**Implementation:** Planned — `src/components/dashboard/DashboardSectionSwitcher.tsx`; `app/dashboard/page.tsx`

---

*© 2026 Ali Abu Ras — aburasali80@gmail.com — Delivery Clarity v4.0*
