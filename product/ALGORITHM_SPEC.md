# Delivery Clarity — Algorithm Specification

**Author:** Ali Abu Ras | **Date:** 2026-05-31

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
