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

**How it works (implemented — P1.2):**
1. On mount, `app/page.tsx` calls `hasLocalData()` from `src/lib/clearLocalData.ts`. This checks all 11 fixed `DC_FIXED_KEYS` plus any dynamic `dc_col_order_*` keys in `localStorage`.
2. If stored data is found, an amber banner appears: "Stored Delivery Clarity data was found in this browser."
3. User clicks "Clear Local Data" → `ConfirmDeleteDialog` opens with title "Clear Local Data?" and warning: "This will remove local data and may end your current session."
4. On confirm, `clearLocalData()` removes each key individually (never uses `localStorage.clear()`) — only `dc_*` keys are touched.
5. `sessionStorage` `dc_*` keys are also cleared.
6. The action does NOT call any API endpoint — server-side import logs and database records are unaffected.
7. The same `ClearLocalDataPanel` component is available in Admin Settings → Browser Data tab.

**Key invariant:** `clearLocalData()` uses an explicit allowlist (`DC_FIXED_KEYS`) plus a prefix scan (`dc_col_order_`). Any key not matching is guaranteed to be preserved.

**Implementation:** `src/lib/clearLocalData.ts` — `hasLocalData()`, `clearLocalData()`, `DC_FIXED_KEYS`; `src/components/admin/ClearLocalDataPanel.tsx`; `app/page.tsx` (detection banner + modal)

---

## Method 13: Dashboard Section Visibility

**Problem:** The dashboard shows all sections simultaneously, creating visual overwhelm for users who only need one area of information at a time (e.g., a Scrum Master looking only at sprint health).

**How it works (implemented — P1.3):**
1. `DashboardSectionSwitcher` renders as a sticky tab bar (`sticky top-14 z-30`) with a gradient lightning-bolt brand mark, 14 named section tabs, and Full / Overview mode buttons.
2. Dashboard state holds `sectionMode: 'full' | 'overview' | string`. Three helper functions derive visibility:
   - `isModeVisible(key)` — returns `true` if `key` should be shown for the current mode
   - `sectionHeaderVisible(key)` — `!isHidden(key) && isModeVisible(key)` — controls `CollapsibleTrigger` rendering
   - `sectionVisible(key)` — `!isHidden(key) && isModeVisible(key)` (in non-full modes, sections auto-expand)
3. `OVERVIEW_KEYS = { overview, attention, recommendations }` — these three sections show in Overview mode.
4. Section tab clicks call `focusSection(key)`: sets `sectionMode`, ensures section is in `expandedSections`, then calls `window.scrollTo` with offset = `header.offsetHeight + stickyBar.offsetHeight + 12px` measured dynamically.
5. All 14 `<section>` elements carry `className="dashboard-section animate-slide-up"`. The `animate-slide-up` keyframe is `{ from: opacity:0; transform:translateY(16px) }`. `@media (prefers-reduced-motion: reduce)` disables the animation.
6. `SectionNav` (right-side dot sidebar) uses `IntersectionObserver` with `rootMargin: "-20% 0px -70% 0px"` to track which section is most visible and highlights the corresponding dot.
7. Role-based view `isHidden(key)` always takes priority over `sectionMode` — a section hidden by the Executive view cannot be revealed by the switcher.
8. The entire sticky bar (switcher + filter row) has `print:hidden`; `SectionNav` is wrapped in `print:hidden`.

**Implementation:** `src/lib/dashboardSections.ts`; `src/components/dashboard/DashboardSectionSwitcher.tsx`; `src/components/ui/SectionNav.tsx`; `app/dashboard/page.tsx` — `sectionMode` state, `focusSection()`, `sectionHeaderVisible()`, `sectionVisible()`

---

## Method 14: Pill Button Design System

**Problem:** Pre-v4.1, buttons across the app used inconsistent shape (mix of `rounded-full`, `rounded-lg`, `rounded-xl`), inconsistent colour semantics, and no shared baseline — each page styled buttons independently.

**How it works (implemented — v4.1):**
1. Nine utility classes are defined in `app/globals.scss` under `@layer components`, all using `border-radius: 9999px` (fully rounded pill):
   - `btn-primary` (blue `#2563eb` filled), `btn-secondary` (white outlined), `btn-ghost` (transparent)
   - `btn-danger` (red filled), `btn-outline-danger` (red outlined → fills on hover)
   - `btn-green` (emerald filled), `btn-dark` (slate-900 filled), `btn-warning` (amber outlined)
   - `btn-sm` / `btn-xs` size modifiers
2. Every `<button>` and `<a>` acting as a button in the app uses one of these classes. No custom padding/colour/radius outside these classes.
3. For colour overrides within a variant (e.g. teal Customer View), inline `style={{ background: "#hex" }}` is used — the pill shape and font weight are still inherited from the base class.

**Implementation:** `app/globals.scss` — 9 classes; applied across all pages and components

---

*© 2026 Ali Abu Ras — aburasali80@gmail.com — Delivery Clarity v4.1*
