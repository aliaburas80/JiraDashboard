# Delivery Clarity — Algorithm Specification

**Author:** Ali Abu Ras | **Date:** 2026-06-03 | **Version:** 4.0

---

## 1. Field Normalisation Algorithm

```
FUNCTION normaliseFields(rawRow: Record<string, unknown>): JiraIssue
  aliased = {}
  FOR key IN rawRow.keys():
    canonical = FIELD_ALIASES[key.toLowerCase().trim()] ?? key
    aliased[canonical] = rawRow[key]
  RETURN aliased

FIELD_ALIASES includes 40+ mappings, e.g.:
  'issue key'          → 'Issue Key'
  'custom field (team)'→ 'Team'
  'status category'    → 'High Level Status'
  'epic link'          → 'Epic Link'
```

---

## 2. Date Parsing Algorithm

```
FUNCTION parseDate(value: unknown): Date | null
  IF value is null/empty: RETURN null
  IF value is Date object: RETURN value (if valid)

  text = String(value).trim()

  // Excel serial number (e.g. 45678)
  IF isNumeric(text) AND 20000 < text < 80000:
    RETURN epochDate + (text × 86400000)

  // Jira format: 15/Jan/2024
  IF matches /^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})/:
    RETURN new Date(year, MONTH_MAP[month], day)

  // ISO: 2024-01-15
  IF matches /^(\d{4})-(\d{1,2})-(\d{1,2})/:
    RETURN new Date(year, month-1, day)

  // Numeric: 15/01/2024 or 01/15/2024
  IF matches /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/:
    // Heuristic: if second part > 12, it must be day
    RETURN new Date(...)

  RETURN Date.parse(text) if valid, else null
```

---

## 3. Hierarchy Reconstruction Algorithm

```
FUNCTION reconstructHierarchy(issues: JiraIssue[]): HierarchyMap
  keySet = new Set(issues.map(i => i.key))
  epicKeys = new Set(issues.filter(i => i.type === 'Epic').map(i => i.key))
  map = { children: Map, parent: Map, epic: Map, links: [], orphanKeys: Set }

  // Step 1: Explicit links
  FOR issue IN issues:
    IF issue.ParentKey EXISTS IN keySet AND ParentKey ≠ issue.key:
      map.parent.set(issue.key, issue.ParentKey)
      map.children[issue.ParentKey].push(issue.key)
      map.links.push({ type: 'parent-key', confidence: 1.0 })

    ELSE IF issue.EpicLink EXISTS IN keySet AND EpicLink ≠ issue.key:
      IF NOT map.parent.has(issue.key):
        map.epic.set(issue.key, issue.EpicLink)
        map.children[issue.EpicLink].push(issue.key)
        map.links.push({ type: 'epic-link', confidence: 1.0 })

  // Step 2: Key-prefix inference
  FOR issue IN issues WHERE NOT resolved yet:
    prefix = issue.key.split('-')[0]
    matchingEpic = epicKeys.find(e => e.split('-')[0] === prefix)
    IF matchingEpic EXISTS:
      map.epic.set(issue.key, matchingEpic)
      map.links.push({ type: 'inferred-prefix', confidence: 0.8 })

  // Step 3: Identify orphans
  FOR issue IN issues:
    IF NOT map.parent.has(issue.key) AND NOT map.epic.has(issue.key):
      IF issue.type ≠ 'Epic':  // Epics are roots, not orphans
        map.orphanKeys.add(issue.key)

  RETURN map
```

---

## 4. Health Score Algorithm

```
FUNCTION calculateHealthScore(metrics: DashboardMetrics): number
  total = max(metrics.totalIssues, 1)

  completionRate  = metrics.doneIssues / total                         // 0.0–1.0
  criticalRatio   = metrics.flow.critical / total                      // 0.0–1.0
  warningRatio    = metrics.flow.warning / total                       // 0.0–1.0
  blockedRatio    = metrics.blockedIssues / total                      // 0.0–1.0
  orphanRatio     = orphanCount / total                                // 0.0–1.0

  // Signal 1: Completion (25 pts)
  s1 = completionRate × 25

  // Signal 2: Flow health (20 pts)
  s2 = max(0, 1 - (criticalRatio + warningRatio × 0.5)) × 20

  // Signal 3: Velocity trend (15 pts)
  s3 = SWITCH(sprintTrend.direction):
    'Improving' → 15
    'Stable'    → 10
    'Declining' → 5
    else        → 10  // no sprint data

  // Signal 4: Cycle time score (15 pts)
  avgCycle = metrics.flow.averageCycleTimeDays
  s4 = SWITCH:
    avgCycle ≤ 5  → 15
    avgCycle ≤ 10 → 11
    avgCycle ≤ 14 → 8
    else          → 4

  // Signal 5: Blocked ratio (15 pts)
  s5 = max(0, 1 - blockedRatio × 3) × 15

  // Signal 6: Orphan ratio (10 pts)
  s6 = max(0, 1 - orphanRatio × 2) × 10

  score = s1 + s2 + s3 + s4 + s5 + s6
  RETURN clamp(round(score), 0, 100)
```

---

## 5. Sprint Throughput Algorithm

```
FUNCTION calculateSprintThroughput(issues: JiraIssue[]): SprintThroughputSummary

  sprintGroups = GROUP_BY(issues, getSprintName)
  sprints = []

  FOR [name, items] IN sprintGroups WHERE name ≠ 'No sprint':

    // Resolve dates
    { start, end } = resolveSprintDates(items)
    mid = start AND end ? midpoint(start, end) : null

    // Compute counts
    committed  = items.length
    completed  = items.filter(i => isDone(i) AND doneDate <= end)
    midDone    = mid ? completed.filter(i => doneDate <= mid) : []
    added      = items.filter(i => isAddedAfterSprintStart(i))
    blocked    = items.filter(i => isBlocked(i))

    // Classify delivery pattern
    midPct = midDone.length / committed × 100
    IF blocked.length ≥ 2:              pattern = 'Blocked Sprint'
    ELSE IF added.length/committed > 0.2: pattern = 'Scope Instability'
    ELSE IF midPct ≥ 50:                pattern = 'Healthy Early Progress'
    ELSE IF midPct ≥ 30:                pattern = 'Late Delivery Risk'
    ELSE:                               pattern = 'End-Loaded Sprint'

    // Goal outcome
    completionPct = completed.length / committed × 100
    goalOutcome = SWITCH:
      sprintEnd > today AND completionPct < 60 → 'At Risk'
      completionPct ≥ 90 → 'Met'
      completionPct ≥ 60 → 'Partially Met'
      else               → 'Missed'

    sprints.push(SprintThroughput{...})

  // Compute cross-sprint stats
  throughputs = sprints.map(s => s.throughputByCount)
  trend       = avg(throughputs[0:3]) - avg(throughputs[3:6])
  direction   = abs(trend)/avg(all) < 5% ? 'Stable' : trend > 0 ? 'Improving' : 'Declining'

  RETURN SprintThroughputSummary{
    sprints, averageThroughputCount: avg(throughputs),
    trendDirection: direction, deliveryTrendValue: trend, ...
  }
```

---

## 6. Flow Efficiency Algorithm (Kanban)

```
FUNCTION flowEfficiency(cycleTimeDays, leadTimeDays): number
  IF leadTimeDays <= 0: RETURN 0
  RETURN CLAMP(round(cycleTimeDays / leadTimeDays × 100), 0, 100)

// Flow efficiency interpretation:
//   ≥ 60% → efficient (active time dominates)
//   40–60% → acceptable
//   20–40% → bottlenecked (significant queue time)
//   < 20%  → severely bottlenecked
```

---

## 7. Recommendation Rule Engine

```
FUNCTION generateRecommendations(metrics): Recommendation[]
  recs = []

  // Rule R-01: Blocked items (Critical)
  IF metrics.blockedIssues ≥ 3:
    recs.push({ priority: 'Critical', evidence: '${N} items have Blocked Flag = true', ... })

  // Rule R-02: Critical flow ratio (Critical)
  IF criticalRatio ≥ 20%:
    recs.push({ priority: 'Critical', ... })

  // Rule R-03: Lead time (High)
  IF avgLeadTime > 21d:
    recs.push({ priority: 'High', ... })

  // Rule R-04: Orphan ratio (High)
  IF orphanRatio ≥ 15%:
    recs.push({ priority: 'High', ... })

  // Rule R-05: Bug ratio (High)
  IF openDefects/total ≥ 15%:
    recs.push({ priority: 'High', ... })

  // Rule R-06: Sprint completion average (High/Medium)
  IF sprint.avgCompletion < 60%: priority = 'High'
  ELSE IF sprint.avgCompletion < 80%: priority = 'Medium'

  // Rule R-07: End-loaded sprints (Medium)
  IF sprint.endLoadedCount ≥ 2:
    recs.push({ priority: 'Medium', ... })

  // Rule R-08: Kanban flow efficiency (Medium)
  IF kanban.avgFlowEfficiency < 40% AND kanban.hasData:
    recs.push({ priority: 'Medium', ... })

  // Rule R-09: Missing story points (Low)
  IF sp.total === 0:
    recs.push({ priority: 'Low', ... })

  // Rule R-10: Missing assignees (Low)
  IF unassignedRatio ≥ 20%:
    recs.push({ priority: 'Low', ... })

  SORT by priority: Critical → High → Medium → Low
  RETURN recs
```

---

## 8. Percentile Computation (for Excel Lead/Cycle Time sheet)

```
FUNCTION percentile(values: number[], p: number): number
  IF values.length === 0: RETURN 0
  sorted = values.sort(ascending)
  idx = CEIL((p / 100) × sorted.length) - 1
  RETURN sorted[MAX(0, idx)]

// Applied at: P50, P75, P85, P95
// P85 is recommended as delivery SLA:
//   "85% of items complete within X days"
```

---

*© 2025 Ali Abu Ras — aburasali80@gmail.com — Delivery Clarity*

---

## Risk-Path Computation Algorithm (9.18)

```
INPUT: nodes[] — all RelationNodes in current graph
       edges[] — all RelationEdges in current graph

STEP 1 — Build parent lookup:
  For each edge of type parent-child or epic-link:
    parentOf[edge.targetId] = edge.sourceId

STEP 2 — Identify risky source nodes:
  riskyNodes = nodes.filter(n =>
    (n.isBlocked OR n.health === 'critical') AND NOT n.isDone
  )
  NOTE: done=critical is historical data, not active risk.

STEP 3 — Walk ancestors and collect risk path:
  riskNodeIds = new Set()
  riskEdgeIds = new Set()
  For each riskyNode:
    current = riskyNode.id
    riskNodeIds.add(current)
    WHILE parentOf[current] exists:
      parent = parentOf[current]
      riskNodeIds.add(parent)
      eid = edge connecting parent ↔ current
      IF eid: riskEdgeIds.add(eid)
      current = parent

OUTPUT:
  nodes with isOnRiskPath = riskNodeIds.has(node.id)
  edges with isOnRiskPath = riskEdgeIds.has(edge.id)
```

**Visual treatment:**
- Risk-path nodes: red border (#dc2626), red-tinted bg (#fff5f5), red glow, ⚠ RISK PATH badge
- Risk-path edges: red stroke, thicker (≥2.5px), animated (flowing particles)
- Done nodes excluded regardless of health status

**Implementation:** `src/services/relations/relationExplorer.service.ts — computeRiskPaths()`

---

## Data Quality Score Algorithm (9.1 — v4.0)

```
INPUT: issues[] — full parsed JiraIssue array

FIELD_CHECKS = [
  { field: 'Created Date',       weight: 12, critical: true  },
  { field: 'Done Date',          weight: 12, critical: true  },
  { field: 'Story Points',       weight: 10, critical: false },
  { field: 'Sprint',             weight: 10, critical: false },
  { field: 'Assignee',           weight: 10, critical: false },
  { field: 'Epic Link/Parent',   weight: 10, critical: false },
  { field: 'In Progress Date',   weight: 10, critical: false },
  { field: 'Due Date',           weight: 9,  critical: false },
  { field: 'Priority',           weight: 9,  critical: false },
  { field: 'Labels',             weight: 8,  critical: false },
]

FOR each check IN FIELD_CHECKS:
  presentCount = issues.filter(i => i[check.field] is non-empty).length
  fillRate = presentCount / issues.length
  check.score = fillRate × check.weight

rawScore = SUM(check.score for check in FIELD_CHECKS)
maxScore = SUM(check.weight for check in FIELD_CHECKS)  // = 100
normalised = Math.round((rawScore / maxScore) × 100)

band =
  IF normalised >= 90: 'Excellent'
  IF normalised >= 75: 'Good'
  IF normalised >= 50: 'Fair'
  IF normalised >= 25: 'Poor'
  ELSE:               'Critical'

OUTPUT: { score: normalised, band, fieldBreakdown[], summary }
```

**Implementation:** `src/services/dataQuality/dataQuality.service.ts — calculateDataQuality()`

---

## Metric Confidence Algorithm (9.2 — v4.0)

```
INPUT: issues[] — full parsed JiraIssue array

FOR each KPI in [SprintThroughput, KanbanFlow, CycleTime, LeadTime, ...]:
  requiredFields = CONFIDENCE_RULES[KPI].requiredFields
  presentFields  = requiredFields.filter(f => issues.some(i => i[f]))
  coverage       = issues.filter(i => isRelevantFor(KPI, i)).length / issues.length
  sampleSize     = issues.filter(i => hasDataFor(KPI, i)).length

  IF presentFields.length === requiredFields.length AND sampleSize >= MIN_SAMPLE[KPI]:
    confidence = 'High'
  ELSE IF presentFields.length >= requiredFields.length × 0.7:
    confidence = 'Medium'
  ELSE IF sampleSize > 0:
    confidence = 'Low'
  ELSE IF presentFields.length === 0:
    confidence = 'Unreliable'
  ELSE:
    confidence = 'N/A'

  missingFields = requiredFields.filter(f => NOT presentField(f))
  reason = generateReason(confidence, missingFields)

OUTPUT: Map<KPI, { confidence, reason, missingFields[] }>
```

**Implementation:** `src/services/metrics/metricConfidence.service.ts — calculateMetricConfidence()`

---

## parseDate Memoisation Algorithm (9.27 — v4.0)

```
// Module-level cache — reset per calculateDashboardMetrics call
_parseDateCache: Map<string, Date | null> | null = null

FUNCTION parseDate(value: unknown): Date | null
  IF value is null/undefined/empty: RETURN null
  IF value instanceof Date AND valid: RETURN value

  text = String(value).trim()
  IF text is empty: RETURN null

  // Cache lookup — O(1)
  IF _parseDateCache:
    hit = _parseDateCache.get(text)
    IF hit !== undefined: RETURN hit  // cache hit

  result = null

  // Try numeric (Excel serial):
  IF isFiniteNumber(text) AND 20000 < text < 80000:
    result = excelEpoch + (text × 86400000)
  // Try Jira format (15/Jan/2024):
  ELSE IF matches /^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})/:
    result = buildDate(...)
  // Try numeric date (15/01/2024 or 01-15-2024):
  ELSE IF matches /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/:
    result = buildDate(...)
  // Try ISO (2024-01-15):
  ELSE IF matches /^(\d{4})-(\d{1,2})-(\d{1,2})/:
    result = buildDate(...)
  ELSE:
    result = new Date(text) — null if invalid

  // Cache set — O(1)
  IF _parseDateCache: _parseDateCache.set(text, result)
  RETURN result

// Called from calculateDashboardMetrics:
  _parseDateCache = new Map()          // reset
  ... compute all metrics ...
  _parseDateCache = null               // free
```

**Benefit:** Jira exports repeat the same date strings heavily (same sprint dates, same creation dates for bulk imports). Memoisation reduces ~40,000 regex operations for a 5,000-issue export to ~1,000 unique parses.

**Implementation:** `src/services/metrics/metrics.service.ts` — `parseDate()`, `_parseDateCache`, `calculateDashboardMetrics()`

---

## flowItemByKey Map Algorithm (9.27 — v4.0)

```
// PROBLEM: 7 builder functions each call:
//   flowItems.filter(fi => issueKeySet.has(fi.key))  — O(n) per group
// For 5,000 issues with 50 epics = 250,000 iterations.

// SOLUTION: Build Map once, O(1) lookup per item

// In calculateDashboardMetrics():
flowItemByKey = new Map(flowItems.map(fi => [fi.key, fi]))
// Cost: O(n) once

// In each builder function (buildEpicMetrics, buildSprintMetrics, etc.):
// BEFORE:
  issueKeys = new Set(items.map(i => i['Issue Key']))
  matchingFlowItems = flowItems.filter(fi => issueKeys.has(fi.key))  // O(n)
// AFTER:
  matchingFlowItems = items
    .map(i => flowItemByKey.get(i['Issue Key']))
    .filter(fi => fi !== undefined)  // O(group_size)

// Total cost: O(n) once for Map creation + O(group_size) per group
// vs. O(n × num_groups) before
```

**Affected functions:** `buildSprintMetrics`, `buildEpicMetrics`, `buildQuarterMetrics`, `buildLabelMetrics`, `buildTypeMetrics`, `buildProjectMetrics`, `buildParentMetrics`

**Implementation:** `src/services/metrics/metrics.service.ts`

---

## Snapshot Comparison Algorithm (9.12 — v4.0)

```
INPUT: snapshotA — saved DashboardMetrics object (older)
       snapshotB — saved DashboardMetrics object (newer)

COMPARISON_METRICS = [
  { key: 'healthScore',       label: 'Health Score',      higherIsBetter: true  },
  { key: 'completionRate',    label: 'Completion Rate',   higherIsBetter: true  },
  { key: 'totalIssues',       label: 'Total Issues',      higherIsBetter: null  },
  { key: 'doneIssues',        label: 'Done',              higherIsBetter: true  },
  { key: 'activeIssues',      label: 'Active',            higherIsBetter: null  },
  { key: 'blockedIssues',     label: 'Blocked',           higherIsBetter: false },
  { key: 'flow.critical',     label: 'Critical',          higherIsBetter: false },
  { key: 'flow.averageCycle', label: 'Avg Cycle Time',    higherIsBetter: false },
  { key: 'flow.averageLead',  label: 'Avg Lead Time',     higherIsBetter: false },
  { key: 'storyPoints.total', label: 'Story Points Done', higherIsBetter: true  },
  { key: 'orphanRatio',       label: 'Orphan Ratio',      higherIsBetter: false },
  { key: 'blockedRatio',      label: 'Blocked Ratio',     higherIsBetter: false },
]

FOR each metric IN COMPARISON_METRICS:
  valA = get(snapshotA, metric.key)
  valB = get(snapshotB, metric.key)
  delta = valB - valA
  direction = delta > 0 ? '↑' : delta < 0 ? '↓' : '→'
  positive = (metric.higherIsBetter === true AND delta > 0)
          OR (metric.higherIsBetter === false AND delta < 0)

OUTPUT: ComparisonRow[] with { label, valueA, valueB, delta, direction, positive }
        + insights[] — plain-English narrative of most significant changes
        + sameDataFlag — true if snapshotA.uploadedAt === snapshotB.uploadedAt
```

**Implementation:** `src/services/imports/importLogs.service.ts`, `app/snapshots/compare/page.tsx`

---

## Release Confidence Score Algorithm (9.30 — v4.1)

**Problem:** A single health score cannot distinguish between "slow team" and "blocked-before-release" scenarios. A release-gate-specific signal is needed to trend over uploads.

**Formula:**
```
score = clamp(0, 100,
  (completionRate / 100) × 55 +
  (1 − min(blockedIssues / max(totalIssues, 1), 1)) × 25 +
  (1 − min(criticalCount / max(totalIssues, 1), 1)) × 12 +
  max(0, 8 − openDefects × 2)
)
```

**Weights:** Completion (55 pts) · no-blockers (25 pts) · no-critical (12 pts) · no-defects (8 pts)

**Band thresholds:** High ≥ 80 · Medium ≥ 60 · Low ≥ 40 · Critical < 40

**Storage:** Score is computed at upload time and persisted in `ImportLog.metadataJson` as `releaseConfidenceScore`. Returned by `GET /api/trends`.

**Implementation:** `src/lib/releaseConfidence.ts — computeReleaseConfidence()`, `app/api/upload/route.ts`

---

## Team Health Score Algorithm (9.31 — v4.1)

**Problem:** `metrics.capacity[]` gives workload counts but no comparable health signal. Managers need a single score per assignee that factors in completion, critical items, and blocked items.

**Formula (per assignee):**
```
healthScore = clamp(0, 100,
  (doneIssues / max(totalIssues, 1)) × 50 +
  (1 − min(criticalCount / max(totalIssues, 1), 1)) × 30 +
  (1 − min(blockedCount  / max(totalIssues, 1), 1)) × 20
)
```
Where `criticalCount` and `blockedCount` count only open (non-done) items.

**Band thresholds:** Healthy ≥ 70 · At Risk ≥ 40 · Critical < 40

**Sort:** Results sorted by `healthScore` descending.

**Implementation:** `src/lib/teamHealth.ts — computeTeamHealth()`, `app/teams/page.tsx`

---

## Portfolio Score Algorithm (9.32 — v4.1)

**Problem:** Individual metrics (health score, sprint completion, epic progress) each tell part of the story. A unified portfolio score is needed for programme-level reporting.

**Formula:**
```
portfolioScore = clamp(0, 100,
  weightedAvg(epics, e.progress)    × 0.40 +
  weightedAvg(projects, p.completionRate) × 0.30 +
  sprint.averageCompletionPct       × 0.20 +
  (dataQuality.score / 100)         × 10
)
```
Where `weightedAvg` weights each entry by its `issues` count. Falls back to `metrics.completionRate` when epics or projects are absent.

**Band thresholds:** Excellent ≥ 85 · Good ≥ 70 · Moderate ≥ 55 · At Risk ≥ 35 · Critical < 35

**Implementation:** `src/lib/portfolioHealth.ts — computePortfolioSummary()`, `app/portfolio/page.tsx`

---

## Executive PDF Layout Algorithm (9.33 — v4.1)

**Problem:** The full HTML export is multi-page and data-dense. Executives and steering committees need a single-page snapshot — formatted, printable, ready in seconds.

**Layout rules:**
1. A4 landscape (`@page { size: A4 landscape; margin: 10mm; }`), 3-column grid
2. Column 1: health score header + 6 KPI cards (2×3 grid) + insights bullets
3. Column 2: top 5 epics with progress bars (colour-coded by health) + top 4 assignees with capacity bars
4. Column 3: top 3 recommendations with priority dots + evidence text
5. All user data escaped via `esc()` before injection into HTML template literals
6. `print-color-adjust: exact` preserves background colours in print output
7. `.no-print` class hides the browser hint text from printed output

**Implementation:** `src/lib/executivePdf.ts — buildExecutivePdfHtml()`, `src/lib/exportUtils.ts — exportExecutivePdf()`, `app/summary/page.tsx`

---

## Current Code Alignment — 2026-06-06

Metric algorithms still compute from normalised Jira export rows, but the latest computed `DashboardMetrics` payload is now persisted server-side to `data/latest-metrics.json` after upload/merge. Analytics pages load through `loadMetricsWithSource()`, which attempts bucket-backed `/api/metrics/latest` first and then browser `localStorage` fallback. Algorithm output shape remains unchanged.

---

## v4.6 — Delivery Forecast and Roadmap Algorithms (2026-06-10)

### Epic Delivery Forecast (`forecastEpic`)

**Input:** `EpicSummary` (from `computePortfolioSummary()`), `avgThroughputPerSprint: number`

**Steps:**
1. If `epic.progress >= 100` → return `forecastLabel: 'Complete'`, `confidence: 'high'`, `weeksRemaining: 0`
2. If `avgThroughputPerSprint <= 0` or `remaining <= 0` → return `forecastLabel: 'Insufficient data'`, `confidence: 'low'`, `sprintsRemaining: null`
3. `remaining = epic.issues - epic.completedIssues`
4. `sprintsRemaining = remaining / avgThroughputPerSprint` (float)
5. `weeksRemaining = ceil(sprintsRemaining × 2)` — assumes 2-week sprint cadence
6. `confidence`: `'high'` if `sprintsRemaining < 2`, `'medium'` if `< 5`, `'low'` if `>= 5`
7. `forecastLabel`: `'Within 2 weeks'` if `weeksRemaining <= 2`; `'~N weeks'` if `<= 6`; `'~N months'` if `> 6` (N = `round(weeksRemaining / 4)`)

**Output:** `EpicForecast` extends `EpicSummary` with `remainingIssues`, `sprintsRemaining`, `weeksRemaining`, `forecastLabel`, `confidence`

**Implementation:** `app/roadmap/page.tsx` → `forecastEpic()`

---

### Portfolio Average Throughput

**Input:** `metrics.sprint.sprints: SprintData[]`

**Steps:**
1. Filter to sprints where `typeof s.completedCount === 'number' && s.completedCount > 0`
2. `avgThroughput = sum(completedCount) / count(validSprints)`
3. If `validSprints.length === 0` → `avgThroughput = 0`

**Output:** `number` — average items completed per sprint

---

### Delivery Forecast Status (`computeForecast`)

**Input:** `DashboardMetrics`

**Steps:**
1. Compute `avgThroughput` (see above)
2. `total = metrics.summary?.totalIssues ?? 0`
3. `done = metrics.summary?.completedIssues ?? 0`
4. `remaining = max(0, total - done)`
5. `sprintsRemaining = avgThroughput > 0 ? remaining / avgThroughput : null`
6. **Status determination:**
   - `done >= total` → `complete`
   - `avgThroughput === 0` → `insufficient_data`
   - `sprintsRemaining <= 6` → `on_track`
   - `sprintsRemaining <= 12` → `at_risk`
   - else → `off_track`
7. **Confidence:** `'high'` if `sprintsRemaining < 3`; `'medium'` if `< 6`; `'low'` if `>= 6`; `'none'` if null
8. **Adjustments:** generated conditionally — scope reduction advice if `off_track`; blocker escalation if `blockedCount > 0`; capacity increase advice if `at_risk`; throughput note if confidence is low

**Output:** `ForecastResult` with `status`, `avgThroughput`, `sprintsRemaining`, `weeksRemaining`, `confidence`, `adjustments`, `sprintPoints`, `blockedCount`, `criticalCount`

**Implementation:** `app/forecast/page.tsx` → `computeForecast()` (relocated 2026-06-27 to `src/services/forecast/forecastEngine.service.ts` — see "v4.6.1" below; behavior unchanged by the move).

---

## v4.6.1 — Forecast Confidence, Weakest-Factor Diagnosis, and Adjustment Rules (2026-06-27)

**Why:** `computeForecast()` had zero test coverage and its confidence score never considered Data Quality or per-metric confidence — only sprint count, velocity trend, and blocked count. There was also no answer to "why aren't we on track?" beyond a flat adjustments list. This addendum closes both gaps (FCAST-23, FCAST-19/20/21) and adds the two genuinely-missing chart types (FCAST-14, and a consolidated FCAST-15/16/17).

### Forecast Confidence Score

**Input:** structural signals (`validSprints.length`, `velocityTrend`, `blockedCount`), `metrics.confidence.sprintThroughput`, `metrics.confidence.velocity`, `metrics.dataQuality`

**Steps:**
1. `structuralScore` = 90 if `validSprints.length >= 4 && velocityTrend !== 'declining' && blockedCount === 0`; 65 if `validSprints.length >= 2 && blockedCount < 3`; else 35
2. `metricScore` = average of `metrics.confidence.sprintThroughput.confidence` and `metrics.confidence.velocity.confidence` (falls back to `structuralScore` if neither is present)
3. `dqMultiplier` = ×0.5 if `dataQuality.band === 'Critical'`, ×0.75 if `'Weak'`, ×1 otherwise — **the same documented multipliers as the Coaching Confidence Score** (this section), reused rather than reinvented, so a "Weak" data quality band means the same thing across the whole app
4. `blendedScore = ((structuralScore + metricScore) / 2) × dqMultiplier`
5. `confidence` = `'high'` if `blendedScore >= 70`, `'medium'` if `>= 40`, else `'low'`
6. `confidenceReason` cites the real sprint count, velocity trend, and Data Quality band/score — when `dqMultiplier < 1`, it explicitly says confidence was reduced and why

**Output:** `confidence: 'high' | 'medium' | 'low'`, `confidenceReason: string`

**Implementation:** `src/services/forecast/forecastEngine.service.ts — computeForecast()`

### Weakest-Factor Diagnosis (FCAST-20)

**Input:** `blockedCount`, `criticalCount`, `scopeTrend` (total added scope), `dqMultiplier`, `velocityTrend`

**Steps (checked in this priority order — first match wins):**
1. `blockedCount > 3` → `{ kind: 'blockers', detail: '<N> issues are blocked...' }`
2. `criticalCount > 2` → `{ kind: 'blockers', detail: '<N> critical/highest-priority issues remain unresolved.' }`
3. total recently-added scope `> avgThroughput × 2` → `{ kind: 'scope', detail: '<N> items were added mid-sprint...' }`
4. a Data Quality downgrade was applied (`dqMultiplier < 1`) → `{ kind: 'data_quality', detail: 'Data Quality is <band> (<score>/100)...' }`
5. `velocityTrend === 'declining'` → `{ kind: 'throughput', detail: 'Throughput has declined...' }`
6. else → `{ kind: 'none', detail: 'No single dominant risk factor...' }`

**Output:** `WeakestFactor — { kind, detail }`. Rendered as a "Forecast Diagnosis" card on `/forecast`, directly under the status banner — `data-kind` drives the card's color tone (red for blockers/throughput, amber for scope/data_quality, green for none).

**Implementation:** `src/services/forecast/forecastEngine.service.ts — computeForecast()`

### Throughput Required vs. Current (FCAST-14)

**Input:** `remainingIssues`, `avgThroughput`

**Steps:** `requiredForOnTrack = remainingIssues / 6` (the same 6-sprint threshold that defines `on_track` status). Rendered as two horizontal bars (current vs. required) with a gap percentage: `gapPct = round(((required - current) / current) × 100)` when positive.

**Implementation:** `app/forecast/page.tsx` — inline in the page render (presentation-only; no new domain calculation beyond the existing on-track threshold).

### Risk & Scope Trend (FCAST-15/16/17, consolidated)

**Input:** `SprintThroughputSummary.sprints[].addedScopeCount`, `.removedScopeCount`, `.blockedCount` (only present on the rich per-sprint shape, not the legacy 8-sprint-capped shape)

**Steps:** for each of the last 12 rich sprints, emit `{ sprint, added, removed, blocked }`. Empty array when only legacy sprint data is available — the UI hides the chart in that case rather than rendering a misleadingly-empty one.

**Output:** `ForecastResult.scopeTrend: { sprint, added, removed, blocked }[]`. Rendered as a grouped-bar chart (amber = scope added, red = blocked) — the three originally-separate "risk trend," "scope change trend," and "blocker impact" requests are deliberately shown as one chart, since all three are risk-signal-over-time views of the same per-sprint data; showing them as three separate cards would have tripled chart density on an already long page without adding distinct information.

**Implementation:** `src/services/forecast/forecastEngine.service.ts — computeForecast()` (data) + `app/forecast/page.tsx — RiskScopeTrendChart()` (rendering)

### Adjustment Rules (FCAST-21, extended)

Two new rules added to the pre-existing set (blockers/critical/throughput-trend/descope), each gated by a real signal: heavy mid-sprint scope growth (`addedScope > avgThroughput × 2`) recommends tightening sprint-start scope discipline; an active Data Quality downgrade recommends improving data quality, naming the current band. No rule fires without its triggering condition being true.

**Implementation:** `src/services/forecast/forecastEngine.service.ts — computeForecast()`

---

### Retro Insights Engine (`generateInsights`) — superseded 2026-06-26

*(Original flat-string engine, kept here for history. Replaced by "Retrospective Insights Engine" under v4.7 below — see that section for the current algorithm.)*

**Input:** `RetroForm`

**Rules (evaluated independently; all matching rules produce a suggestion):**
| Condition | Suggestion |
|---|---|
| `goalMet === 'no'` | Review capacity planning and scope commitment |
| `goalMet === 'partial'` | Identify slippage stories; prioritise them first next sprint |
| `blockers.filter(b => b.text.trim()).length > 0` | Escalate unresolved blockers to next planning session |
| `actions with priority === 'high' and text` | N high-priority action items need immediate follow-up |
| `actions with text and no owner` | Assign owners to ensure accountability |
| `actions with text and no dueDate` | Set deadlines to track completion |
| `actions.filter(a => a.text.trim()).length === 0` | Consider whether improvement opportunities were missed |
| `wentWell.filter(w => w.text.trim()).length > 0` | Reinforce what went well in the next sprint |

**Output:** `string[]` — zero or more actionable suggestion strings

---

## v4.10.0 — Role-Based Coaching Confidence & Severity Algorithms (2026-06-23)

### Role-Based Coaching Confidence Score

**Input:** `DashboardMetrics`, `relevantKeys: (keyof MetricConfidenceMap)[]` (a category-specific subset, e.g. Scrum Master uses `['kanbanFlow', 'cycleTime', 'midSprint']`)

```
INPUT: metrics, relevantKeys

entries    = relevantKeys.map(key => metrics.confidence[key])
withSample = entries.filter(e => e.sampleSize > 0)

IF relevantKeys.length === 0 OR withSample.length === 0:
  RETURN { score: 0, band: 'N/A', reason: <safe fallback, no fabricated number> }

rawAverage = mean(entries.map(e => e.confidence))

multiplier = dataQuality.band === 'Critical' ? 0.5
           : dataQuality.band === 'Weak'     ? 0.75
           : 1

score      = round(rawAverage × multiplier)
sampleSize = sum(withSample.map(e => e.sampleSize))
band       = score >= 80 ? 'High' : score >= 60 ? 'Medium' : score >= 40 ? 'Low' : 'Unreliable'
            (sampleSize === 0 → 'N/A', overriding the above)

worst  = entries with the lowest individual confidence
reason = multiplier < 1
       ? "Confidence reduced — Data Quality is {band} ({score}) and {worst.metricLabel} confidence is {worst.band} ({worst.confidence}%)."
       : "Based on {worst.metricLabel} ({worst.band}, {worst.confidence}%) and related metrics, all backed by {sampleSize} sampled item(s)."

OUTPUT: { score, band, reason }
```

**Downgrade multipliers (×0.75 Weak / ×0.5 Critical):** a deliberate business decision — confidence in a coaching recommendation must fall faster than the underlying Data Quality score itself, since a recommendation built on critically incomplete data should never read as comparably trustworthy to one built on excellent data. Re-evaluate these constants if user feedback indicates coaching confidence is being over- or under-trusted in practice.

**Implementation:** `src/services/coaching/coachingConfidence.service.ts — aggregateCategoryConfidence()`

---

### Role-Based Coaching Severity

**Input:** `weakPointCount: number`, `confidenceScore: number`, `criticalSignalPresent: boolean` (category-defined, e.g. simultaneous blockers + aging WIP for Scrum Master; `dataQuality.band === 'Critical'` for Admin)

```
IF criticalSignalPresent:        RETURN 'critical'
IF weakPointCount >= 3:          RETURN 'high'
IF weakPointCount >= 1
   OR confidenceScore < 60:      RETURN 'medium'
ELSE:                            RETURN 'low'
```

**Output:** reuses the existing `CheckSeverity` union (`'critical' | 'high' | 'medium' | 'low'`) from the Data Quality algorithm — no new severity scale was introduced. Maps to the shared `Badge` component via `severityToBadgeVariant()` (`critical→danger, high→warning, medium→info, low→success`); business logic never returns a raw color.

**Implementation:** `src/lib/coachingBadge.ts — deriveSeverity()`, `severityToBadgeVariant()`

---

### Ceremony Advice Rule Engine

**Input:** `DashboardMetrics`

Five independent rule groups (daily standup, refinement, sprint planning, sprint review, retrospective), each a small set of trigger functions returning `string | null`. Unlike the Retro Insights Engine (above), every returned string embeds the real triggering number (e.g. "5 item(s) are explicitly blocked") rather than a static suggestion — a rule that does not fire contributes nothing, by design, so the system never emits placeholder advice.

**Output:** `CeremonyAdvice` — `{ dailyStandup, refinement, sprintPlanning, sprintReview, retrospective }`, each `string[]`. Computed once per page load and embedded identically into every coaching category visible to the requesting role (these are team-wide cadence rules, not role-specific).

**Implementation:** `src/services/coaching/ceremonyAdvice.service.ts — buildCeremonyAdvice()`

---

## v4.10.1 — Coaching Severity Trend Comparison (2026-06-26)

**Input:** `current: CheckSeverity`, `previous: CheckSeverity`

```
SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 }   // lower rank = more urgent

delta = SEVERITY_RANK[current] - SEVERITY_RANK[previous]

IF delta > 0:  RETURN 'improved'   // current is less urgent than before
IF delta < 0:  RETURN 'worsened'   // current is more urgent than before
ELSE:          RETURN 'same'
```

**`previous` source:** the requesting category's severity when `generateAllCoachingInsights()` is re-run against the metrics of the user's second-most-recent saved `DashboardSnapshot` (existing Snapshots feature; no new persistence). When fewer than 2 snapshots exist, this algorithm is never invoked for that page load — the UI omits the trend badge entirely rather than defaulting to `'same'`.

**Output:** `SeverityTrend = 'improved' | 'worsened' | 'same'` — rendered as a small badge next to the hero banner's mood label; never a raw color (`'improved'`→success token, `'worsened'`→danger token, `'same'`→muted token).

**Implementation:** `src/services/coaching/coachingTrend.service.ts — computeSeverityTrend()`

---

## v4.7 — Retrospective Insights Engine, Theme Detection, and CSV Parsing Fix (2026-06-26)

### Retrospective Insights Engine (`generateRetrospectiveInsight`)

**Input:** `RetroRecord` (one sprint — from the in-app form or one group of rows from an uploaded file), `source: 'form' | 'upload'`, `repeatedBlockers?: string[]`

**Steps:**
1. Concatenate `didntGoWell + blockers` text into `concerns` — **`wentWell` is deliberately excluded** (fixed 2026-06-26; including positive feedback here previously caused praise like "Automated tests caught regressions" to be flagged as a "qa-release" theme to "address," which is actively misleading)
2. **Theme detection:** for each of 7 categories (process, communication, requirements, qa-release, dependency, technical, planning), keyword-match `concerns`; keep categories with ≥1 match; sort descending by match count (ties keep the categories' fixed declaration order)
3. **Ownership gaps:** count action items with non-empty text but empty `owner` → one line; count with empty `dueDate` → one line
4. **Duplicate action items:** group action item text by `trim().toLowerCase()`; any key with count > 1 is a duplicate
5. **Next-sprint suggestions** (each line gated by a real signal, never generic):
   - `goalMet === 'no' | 'partial'` → re-plan-scope advice
   - `blockers` count > 0 → "Address the N recorded blocker(s)..." citing the count
   - a top theme exists → cites the theme's display label (`THEME_LABEL`, not the raw category slug), the match count, and the first matching example sentence as evidence
6. **Ceremony recommendations:** standup advice if any blocker exists; planning advice if any ownership gap exists; retro advice if any "what did not go well" entry exists
7. **Confidence:** count non-empty values in `[sprintGoal, goalMet, ...wentWell, ...didntGoWell, ...blockers]` → `'high'` if ≥4, `'medium'` if ≥2, else `'low'` (confidence intentionally still considers `wentWell` — more filled-in fields means more reliable input overall, regardless of sentiment)

**Output:** `RetrospectiveInsight` — `{ id, sprintName, team, source, themes, positives, painPoints, blockers, actionItems, nextSprintSuggestions, ceremonyRecommendations, risksIfIgnored, ownershipGaps, repeatedBlockers, duplicateActionItems, confidence }`

**Implementation:** `src/services/retro/retroInsights.service.ts — generateRetrospectiveInsight()`

### Repeated Blockers Across Sprints (`detectRepeatedBlockers`)

**Input:** `RetroRecord[]` — only meaningful with 2+ records (i.e. a multi-sprint uploaded file)

**Steps:** for each record, build a de-duplicated, lowercased, trimmed set of its blocker text; count how many *records* (not rows) contain each unique blocker text; any blocker appearing in more than one record is "repeated." The resulting list is embedded identically into every record's insight via `generateInsightsForRecords()` — the same "compute once, embed everywhere" pattern as the Coaching Ceremony Advice engine.

**Implementation:** `src/services/retro/retroInsights.service.ts — detectRepeatedBlockers()`, `generateInsightsForRecords()`

### Suggested Backlog Items (`buildSuggestedBacklogItems`) — added 2026-06-26

**Why:** user testing reported the retro report as "not useful" — `nextSprintSuggestions` and `ceremonyRecommendations` are free-text process advice, not anything a Scrum Master could paste straight into a backlog. This algorithm produces concrete `story`/`task`/`spike` suggestions instead.

**Input:** `RetroRecord`, `themes: ThemeMatch[]`, `repeatedBlockers: string[]`

**Steps (every item traceable to a real signal — never a generic placeholder):**
1. For each non-empty blocker: if its lowercased/trimmed text is in `repeatedBlockers` → emit a `'spike'` titled `Investigate root cause: "<text>"` (priority `high`), `description`: "Spike: Time-box an investigation into the root cause of \"<text>\".\nGoal: identify why previous attempts haven't held, and propose a permanent fix or process change." — **not** a duplicate resolve task, because once a blocker has recurred, a one-off resolve task already failed to stick; otherwise → emit a `'task'` titled `Resolve blocker: "<text>"` (priority `high`), `description`: "Task: Investigate and resolve \"<text>\" before it carries into next sprint.\nAcceptance criteria: the blocker is confirmed cleared and verified with the team."
2. If a top theme exists (`themes[0]`): emit a `'story'` titled `Improve: <THEME_LABEL>`, `description`: "As a team, we want to address recurring `<theme, lowercase>` issues, so that they stop causing friction sprint after sprint.\nAcceptance criteria: a concrete process or workflow change is agreed and tried for at least one full sprint.", `evidence` citing the match count and the actual triggering example sentence, priority `high` if count ≥ 2 else `medium`
3. If `goalMet === 'no'`: emit a `'spike'` titled `Investigate why the sprint goal was not met`, `description`: "Spike: Review what caused the sprint goal to be missed — scope, capacity, estimation, or blockers.\nGoal: document findings and translate them into next sprint's planning.", `evidence` including the sprint goal text when present, priority `medium`
4. A retrospective with none of the above signals produces an empty array — not fabricated content

**Output:** `SuggestedBacklogItem[]` — `{ type, title, description, evidence, priority }`. `description` is a standard story/task/spike write-up meant to be pasted directly into a backlog tool; `evidence` is the real retro signal that triggered the suggestion, kept separate so the description itself never reads as retro commentary (fixed 2026-06-26 — the original single `rationale` field mixed both, e.g. "1 mention this sprint, e.g. ... — worth a dedicated story rather than letting it recur silently," which read as commentary, not a backlog item). Rendered in the UI as `description` (card body) + `evidence` (smaller italic line); a Copy button copies `title` + `description` + `evidence` together; no Jira ticket is created (write-back remains a P3 roadmap item).

**Implementation:** `src/services/retro/retroInsights.service.ts — buildSuggestedBacklogItems()`

### Theme Detection Bug Fix — Positive Feedback Pollution (2026-06-26)

**Bug:** theme keyword-matching originally ran over `wentWell + didntGoWell + blockers` combined. Positive feedback like "Automated tests caught regressions" matched the `qa-release` regex and was flagged as a problem theme, then cited in `nextSprintSuggestions` as something to "discuss" — actively misleading, and the proximate cause of the "retro report not useful" feedback.

**Fix:** theme detection now runs over `didntGoWell + blockers` only (`concerns`, not `wentWell`). `wentWell` is still used for `confidence` (more filled-in fields means more reliable input, regardless of sentiment) and for the `positives` field shown separately in the UI — just never for theme/problem detection. A few overly narrow keyword regexes were also broadened (e.g. `process` now catches "sprint planning"/"refinement session" complaints) to reduce false negatives on common real-world phrasing.

**Implementation:** `src/services/retro/retroInsights.service.ts — detectThemes()`, `THEME_KEYWORDS`

### CSV Date-Mangling Fix

**Problem discovered during implementation:** `XLSX.read()` (the `xlsx` npm package), when given CSV text containing an ISO-date-like string (e.g. `"2026-06-08"`), auto-detects it as a date cell and silently reformats it to a locale date string (e.g. `"6/8/26"`) on read — corrupting any date column in an uploaded retro file without any warning.

**Fix:** `parseRetroFile()` uses a dedicated minimal RFC4180 CSV parser (`parseCsvText()`) for `.csv` files instead of `XLSX.read()`, preserving cell text exactly as typed. `XLSX.read()` is still used for genuine binary `.xlsx`/`.xls` files, where its cell-type handling is accurate because the type is actually stored in the binary format.

**Implementation:** `src/services/retro/retroFileParser.service.ts — parseCsvText()`, `parseRetroFile()`
