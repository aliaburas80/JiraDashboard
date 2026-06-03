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
