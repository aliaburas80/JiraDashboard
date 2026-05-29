// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { useEffect, useState } from 'react';

// ─── shared step builder ────────────────────────────────────────────────────
function steps(color, bg, arr) {
  return arr.map((s) => ({ ...s, color, bg }));
}

// ─── all section journeys ────────────────────────────────────────────────────
const SECTION_STEPS = {
  welcome: steps('#2563eb', 'linear-gradient(135deg,rgba(37,99,235,.14),rgba(20,184,166,.09))', [
    { icon: '🚀', eyebrow: 'Welcome', title: 'Meet Delivery Clarity', body: 'Your Jira Delivery Intelligence board. Turn any Jira export into sprint health, flow efficiency, risk signals, capacity, and epic readiness — in seconds. No Jira login required.', tip: null },
    { icon: '📥', eyebrow: 'Step 1', title: 'Export from Jira', body: 'In Jira, open your board or backlog and go to Export → Excel or CSV. For the richest analysis include Sprint, Story Points, Assignee, Created Date, and Resolution Date.', tip: 'Export the full backlog — not just one sprint — for quarter trends and epic analysis.' },
    { icon: '⬆️', eyebrow: 'Step 2', title: 'Upload your file', body: 'Drop your CSV or Excel file on the upload screen. The full dashboard appears within seconds — no Jira login, no configuration, no manual setup.', tip: 'Supports .csv, .xls, and .xlsx files exported directly from Jira.' },
    { icon: '📊', eyebrow: 'Step 3', title: 'Read top to bottom', body: 'The dashboard tells a story. Start at the Summary bar, move through KPI cards and highlight strips, then explore charts, tables, and the flow health panel at the bottom.', tip: 'Click any ? button next to a section heading to jump to exactly that topic in this guide.' },
    { icon: '🎯', eyebrow: 'Step 4', title: 'Filter and focus', body: 'The sticky quick-filter bar follows you as you scroll. Tap High Risk, Blocked, Needs Review, or Sprint Today to jump straight to the matching work items in the flow table.', tip: 'A blue badge in the filter bar shows how many filters are currently active.' },
    { icon: '🔍', eyebrow: 'Step 5', title: 'Drill into the flow table', body: 'Open Story / Task Flow Health at the bottom. Filter by key, status, sprint, assignee, health, labels, or reason. Every matched item shows exactly why it is healthy or at risk.', tip: 'The table shows 100 rows at a time — tap "Show more" for large exports.' },
    { icon: '✅', eyebrow: "You're ready!", title: 'Act on your results', body: 'Review high-risk items to inspect the worst blockers, export a risk CSV for stakeholders, and save your layout view to remember filters for next time.', tip: 'Use the ? buttons throughout the dashboard for section-specific explanations at any time.' },
  ]),

  summary: steps('#2563eb', 'linear-gradient(135deg,rgba(37,99,235,.13),rgba(20,184,166,.08))', [
    { icon: '📋', eyebrow: 'Summary bar', title: 'Your delivery at a glance', body: 'The Summary bar is the first thing to read on every dashboard visit. It answers three questions in one row: is the project healthy, how far off target are we, and what changed since last time?', tip: 'If the health status shows Urgent Attention, go to the Attention cards immediately — do not start with the KPIs.' },
    { icon: '🚦', eyebrow: 'Health status', title: 'Healthy · At Risk · Urgent', body: 'Healthy means zero warning or critical items. At Risk means 1–3 items need attention. Urgent Attention means four or more items carry warning or critical health signals and require escalation or re-planning.', tip: 'Health is derived from flow signals — not just priority. A high-priority item that is actively moving may still be healthy.' },
    { icon: '🎯', eyebrow: 'Target vs Actual', title: 'Planned versus delivered', body: 'Target completion is the expected percentage for this delivery period. Actual is calculated from Done, Closed, or Resolved issues. A gap between the two is the most important number to explain in a stakeholder report.', tip: 'If actual is below target but the sprint is healthy, the problem is scope — not team performance.' },
    { icon: '📈', eyebrow: 'Delta cards', title: 'Completion, risk, and cycle time', body: 'The three delta cards show point-in-time signals: how many items are complete, how many carry risk, and how long cycle time is running. They reflect the current state of the uploaded export — they do not show change over time.', tip: 'Upload a fresh Jira export to get the latest deltas. The dashboard never auto-refreshes.' },
    { icon: '🛠️', eyebrow: 'Action buttons', title: 'Review, export, and save', body: 'Review high-risk items opens a detail panel showing blockers with copy-to-clipboard. Export risk report downloads a CSV of all warning and critical items. Save layout view persists your active filter settings to the browser for next visit.', tip: 'Export the risk report before a sprint review meeting — it gives you a one-page evidence list for stakeholder questions.' },
  ]),

  quickFilters: steps('#dc2626', 'linear-gradient(135deg,rgba(220,38,38,.12),rgba(245,158,11,.07))', [
    { icon: '⚡', eyebrow: 'What they do', title: 'One-tap focus jumps', body: 'The sticky filter bar translates a concern into a single tap: apply a filter, scroll automatically to the flow table, and see only the matching items. Everything else on the page stays unchanged — you are scoping the table, not hiding panels.', tip: 'The blue badge next to the Clear button shows how many filters are currently active.' },
    { icon: '🔴', eyebrow: 'High Risk', title: 'Surface the worst items first', body: 'High Risk sets the health filter to Critical. Items get this classification when they are blocked, overdue, in progress for more than 14 days, or have a cycle time exceeding two weeks. These are your top escalation candidates.', tip: 'After clicking High Risk, open the Story/Task Flow Health panel to see each item\'s specific reason.' },
    { icon: '🚫', eyebrow: 'Blocked', title: 'Explicit blockers only', body: 'The Blocked filter searches the reason text for the word "block". Items qualify when their health reason includes blocker language from age, priority, or explicit Blocked Flag fields. It does not catch implied blockers — only those expressed in the data.', tip: 'If your team uses a Blocker Reason field in Jira, those items will also appear here.' },
    { icon: '🔄', eyebrow: 'Needs Review', title: 'Work stuck in review states', body: 'Needs Review sets the status filter to "in progress," which also captures review-adjacent statuses depending on your Jira workflow. Use it to see work waiting on code review, QA sign-off, or product approval.', tip: 'Combine with the Open Age filter in the flow panel to find review items that have been waiting too long.' },
    { icon: '🧹', eyebrow: 'Clear & reset', title: 'Return to the full view', body: 'The Clear button resets every filter at once and removes the active-filter badge. The Reset button inside the Flow Health panel clears just the table filters while leaving the quick-filter state. Both are fully reversible.', tip: 'Save your filter state with the Save layout button in the Summary bar before clearing, if you want to return to the same view later.' },
  ]),

  attention: steps('#f59e0b', 'linear-gradient(135deg,rgba(245,158,11,.13),rgba(249,115,22,.08))', [
    { icon: '⚠️', eyebrow: 'Three spotlight cards', title: 'Blockers, overdue, and orphans', body: 'The three highlight cards surface the most actionable problems from your export: items whose reasons include blocking, items open for too long, and items with no epic or parent assignment. Each card shows up to five items with their keys and descriptions.', tip: 'Click any card\'s Help (?) button to jump directly to the Attention section of this guide.' },
    { icon: '🚧', eyebrow: 'Top Blockers', title: 'Explicitly blocked items', body: 'An item appears as a blocker when its flow health reason contains block-related language — from Blocked Flag, priority signals, or dependency callouts in the export. The card shows the issue key and the blocking reason so you can act immediately without searching through the full table.', tip: 'Zero blockers is a good sign, but check High Risk items too — some blockers appear there without the specific "block" keyword.' },
    { icon: '⏰', eyebrow: 'Top Overdue', title: 'Open work ageing past 10 days', body: 'Overdue items are unfinished issues with an open age of more than 10 days, sorted with the most neglected first. These are strong candidates for backlog grooming, re-assignment, or de-scoping conversations before the next sprint.', tip: 'If overdue count is high, check whether the export includes items from multiple sprints — old backlog items can inflate this number.' },
    { icon: '👻', eyebrow: 'Top Orphans', title: 'Items with no epic or parent', body: 'An orphan is any issue where both Epic Link and Parent Key are empty. Orphaned work is hard to scope, hard to track in planning, and easy to miss in release readiness reviews. The orphan count also feeds into the delivery composition ring.', tip: 'Fixing orphans in Jira directly improves all capacity, epic, and readiness metrics across the board.' },
  ]),

  kpis: steps('#16a34a', 'linear-gradient(135deg,rgba(22,163,74,.13),rgba(20,184,166,.08))', [
    { icon: '✅', eyebrow: 'Completion %', title: 'How much is done', body: 'Completion is done-issues divided by total issues in the export. Done statuses are Done, Closed, and Resolved. It is the primary delivery signal — if it is below the target in the summary bar, the project needs an explanation.', tip: 'The green/amber/red threshold track under the KPI value shows where your completion falls relative to healthy, warning, and critical bands.' },
    { icon: '🔔', eyebrow: 'Health Alerts', title: 'Items that need attention', body: 'Health Alerts is the sum of warning and critical items from the Flow Health analysis. It answers: how many items right now have signals that indicate a delivery risk? The detail line breaks this into critical and warning separately.', tip: 'Click this card to scroll directly to the Story/Task Flow Health panel where you can see each alert in detail.' },
    { icon: '⚙️', eyebrow: 'Active Work', title: 'Work in motion right now', body: 'Active Work counts issues in In Progress, Code Review, QA, Testing, or UAT — your WIP number. High WIP relative to team size can explain slow cycle times because too many items in flight dilutes focus and increases handoff delays.', tip: 'If Active Work is higher than your team size, consider limiting WIP in the next sprint planning session.' },
    { icon: '📏', eyebrow: 'Lead Time', title: 'From creation to completion', body: 'Lead time measures elapsed calendar days from Created Date to Done or Resolution Date. It includes queue time — the time an item sat waiting before anyone started it. Long lead time means either slow start or slow delivery; the flow table helps identify which.', tip: 'Lead time is only calculated for completed items. A low sample size means the average is less reliable.' },
    { icon: '🏃', eyebrow: 'Cycle Time', title: 'From start to completion', body: 'Cycle time measures from In Progress Date (or Sprint Start) to Done — excluding queue time. It represents the pure active delivery window and is the metric most directly controlled by the team. A large gap between Lead and Cycle means items waited a long time before being picked up.', tip: 'The threshold track shows good (≤2d), warning (≤5d), and critical (≤14d) bands. Hover the card to see the full legend.' },
    { icon: '💎', eyebrow: 'Story Points', title: 'Scope completion by effort', body: 'Story Points shows total committed points versus completed points. It is more accurate than issue count when items vary significantly in size. If point completion rate is lower than issue completion rate, your larger items are the ones still open.', tip: 'If story points are missing from the export, the dashboard falls back to issue-count analysis. The confidence badges in the summary bar flag this.' },
  ]),

  visuals: steps('#0891b2', 'linear-gradient(135deg,rgba(8,145,178,.13),rgba(37,99,235,.08))', [
    { icon: '🍩', eyebrow: 'Health Mix', title: 'The three-colour risk ring', body: 'The Health Mix donut divides all issues into good (green), warning (amber), and critical (red) segments. A large green segment with thin amber and red bands means low delivery risk. A growing red segment is the clearest visual sign that escalation is needed.', tip: 'The total in the center is the issue count used for the ring. If it differs from the total KPI, some items may have incomplete health data.' },
    { icon: '📅', eyebrow: 'Quarter Progress', title: 'Throughput over time', body: 'Issues are grouped by quarter using completion date first, then created date as fallback. The bar chart shows total issues (light) against completed issues (dark) per quarter. Use it to compare delivery velocity and spot quarters with unusually high or low throughput.', tip: 'If most items land in "No date," the export is missing date fields. Add Created Date and Resolution Date when re-exporting.' },
    { icon: '🗂️', eyebrow: 'Work State', title: 'To Do, In Progress, Done', body: 'Work State groups all statuses into four buckets: To Do (backlog/selected), In Progress (all active statuses), Done (resolved), and Other (anything that does not match). Use it for an instant summary of where work concentration sits across the entire export.', tip: 'A high "Other" count means your Jira workflow uses non-standard status names. The flow table lets you see the exact status names.' },
    { icon: '🎨', eyebrow: 'Color guide', title: 'How to read chart colours', body: 'Green means complete or healthy. Amber is a watch signal — not yet a problem but worth monitoring. Red is a risk signal that requires explanation. Blue and teal represent active delivery movement and flow. The same colour semantics apply across all charts and badges.', tip: 'Dark mode inverts backgrounds but preserves the semantic colour meanings. The colour-to-meaning mapping never changes between themes.' },
  ]),

  ratios: steps('#7c3aed', 'linear-gradient(135deg,rgba(124,58,237,.13),rgba(37,99,235,.08))', [
    { icon: '💠', eyebrow: 'The composition ring', title: 'Every issue in one circle', body: 'The Delivery Composition ring classifies every single issue in your export into exactly one segment — Done, In Progress, At Risk, Critical, or Backlog. Unlike the Health Mix donut, this ring accounts for the full lifecycle of each item, not just its health label.', tip: 'The completion percentage in the center matches the Completion KPI card — both draw from the same Done issue count.' },
    { icon: '🔢', eyebrow: 'Segment priority', title: 'No double-counting', body: 'Classification follows a strict priority order: Done first, then Critical (not done, health=critical), then At Risk (not done, health=warning), then In Progress (active status, no health concern), then Backlog for everything remaining. A critical item that is also in progress counts as Critical only.', tip: 'If you resolve critical items, the ring shifts from red to blue (in-progress) or green (done) — making progress visually obvious.' },
    { icon: '📋', eyebrow: 'Legend and totals', title: 'Reading the right panel', body: 'The legend shows count and percentage for each segment. Below the divider, secondary stats show total issue count, orphan count if any exist, and story point progress if points are present. These give you a compact delivery scorecard in one panel.', tip: 'Percentages are of total issues — so a 40% done segment means 40% of ALL imported items are complete, not 40% of active items.' },
    { icon: '🔎', eyebrow: 'Healthy patterns', title: 'Good vs at-risk at a glance', body: 'A healthy project shows a large green done segment, a moderate blue in-progress segment, and thin amber and red bands. A project needing attention shows a large gray backlog (work not started yet), or significant red and amber that together exceed the green segment.', tip: 'Upload the same project\'s export at the start and end of a sprint to compare rings — the green segment growth is your sprint\'s delivery evidence.' },
  ]),

  delivery: steps('#0891b2', 'linear-gradient(135deg,rgba(8,145,178,.13),rgba(20,184,166,.09))', [
    { icon: '🌊', eyebrow: 'Flow Efficiency', title: 'Speed and volume together', body: 'The Flow Efficiency panel shows average lead time, cycle time, completed sample size, and critical item count together. Lead time and cycle time alone are incomplete — you also need to know how many items the average is based on (sample size) and how many are actively concerning (critical count).', tip: 'A large gap between lead time and cycle time means items are waiting a long time before anyone starts them. Fix the queue, not the team.' },
    { icon: '🏆', eyebrow: 'Story Points', title: 'Points versus issue count', body: 'The Story Point Delivery panel shows completed and remaining points, a point completion rate, and a progress bar. When story points are available, this is a more accurate delivery measure because it accounts for effort size. A high issue completion rate paired with a low point completion rate means the large items are still open.', tip: 'If "remaining points" is surprisingly high, check for large Story or Epic items with no sub-tasks — they carry all their points as a single item.' },
    { icon: '📊', eyebrow: 'Sample size', title: 'When to trust the averages', body: 'Lead and cycle time averages are only calculated for items that have the required date fields. If the sample size is 5 out of 200, the average is based on only 5 items — which may not represent real team performance. Always check the sample size before drawing conclusions from timing metrics.', tip: 'To improve sample size, ensure your Jira export includes Created Date and Resolution Date for all completed items.' },
    { icon: '🚨', eyebrow: 'Critical signals', title: 'What triggers critical classification', body: 'An item becomes Critical when any of these are true: active status for over 14 days, cycle time exceeds 14 days after completing, Blocked Flag is true, Due Date has passed without resolution, or it carries High/Highest/Critical priority and is still open. Multiple signals stack — an item can be critical for several reasons at once.', tip: 'The reason text in the Flow Health table explains the exact signal for each classification. Use it to determine whether the root cause is age, blocking, schedule, or priority.' },
  ]),

  quarters: steps('#f97316', 'linear-gradient(135deg,rgba(249,115,22,.13),rgba(245,158,11,.08))', [
    { icon: '📅', eyebrow: 'Quarter grouping', title: 'How items are assigned', body: 'Each issue is assigned to the quarter of its Done or Resolution Date if available, then its Created Date, then Updated Date as a fallback. This means the quarter reflects when work was completed, not when it was planned. Items with no dates appear under "No date."', tip: 'If a large proportion appears under "No date," your export is missing date columns. Re-export with Created and Resolution Date included.' },
    { icon: '📊', eyebrow: 'Completion rate', title: 'Comparing delivery across quarters', body: 'Completion rate per quarter is done issues divided by total issues assigned to that quarter. A quarter with 90%+ completion is healthy. A recent quarter with low completion may indicate items started but not finished — candidates for the current sprint\'s carry-over review.', tip: 'Compare the most recent quarter against the previous two for a trend. Steady improvement indicates the team is finding rhythm.' },
    { icon: '⏱️', eyebrow: 'Lead and cycle', title: 'Tracking speed over time', body: 'Each quarter row shows its own average lead and cycle time calculated from items completed in that quarter. If cycle time is increasing quarter over quarter, it signals growing complexity or debt. If lead time is increasing while cycle time stays flat, items are sitting in the backlog longer before being picked up.', tip: 'Quarters with a sample under 5 are less statistically meaningful. Check the sample column before drawing trend conclusions.' },
    { icon: '🔍', eyebrow: 'Top Status', title: 'Where work is concentrated', body: 'The Top Status column shows the most common Jira workflow statuses for items in each quarter. In a completed quarter, you want Done/Closed/Resolved dominating. In a current quarter, In Progress is expected. "QA" or "Code Review" dominating for an old quarter signals items that stalled mid-workflow.', tip: 'Use the Quarter Statistics table alongside the Kanban Status Health table to see which statuses have the most unresolved items.' },
  ]),

  kanban: steps('#0f766e', 'linear-gradient(135deg,rgba(15,118,110,.13),rgba(8,145,178,.08))', [
    { icon: '🗃️', eyebrow: 'Status distribution', title: 'Volume per workflow state', body: 'The Kanban Distribution bar chart shows how many issues sit in each Jira workflow status right now. Large bars in backlog or todo statuses are expected at sprint start. Large bars in QA, Testing, or UAT mid-sprint signal a bottleneck where work is moving faster than it can be validated.', tip: 'The top 8 statuses appear in the chart. Use the Kanban Status Health table below for the full list with health and timing data.' },
    { icon: '🏥', eyebrow: 'Status health table', title: 'Every status with health context', body: 'The Kanban Status Health table adds lead time, cycle time, critical count, warning count, good count, and story points to every Jira status. This lets you answer: not just "how many items are in QA" but "are the QA items healthy, and how long have they been there on average?"', tip: 'Sort by Critical count to see which workflow statuses have the most at-risk items. These are your delivery bottlenecks.' },
    { icon: '🎯', eyebrow: 'Health counts', title: 'How status-level health works', body: 'The good, warning, and critical counts per status come from the individual health calculation of each item inside that status. An item in "In Progress" for 15 days will count as Critical under In Progress, raising the critical count for that status. This distinguishes a healthy In Progress column from a stale one.', tip: 'If a "Done" status shows critical items, those are completed items whose cycle time was very long — the work finished, but it was slow.' },
    { icon: '🔍', eyebrow: 'Finding bottlenecks', title: 'The pattern to look for', body: 'A Kanban bottleneck shows as a status with high count AND high warning or critical numbers. Compare item count to average lead time — a status with 20 items and a 10-day lead time is healthier than one with 8 items and a 14-day lead time. Low count plus high timing is the real bottleneck signal.', tip: 'High-point items stuck in one status block more value than low-point items, even if the raw count looks similar.' },
  ]),

  sprint: steps('#7c3aed', 'linear-gradient(135deg,rgba(124,58,237,.13),rgba(37,99,235,.08))', [
    { icon: '🏃', eyebrow: 'Sprint Comparison', title: 'Sprint velocity at a glance', body: 'The Sprint Comparison bar chart shows issue count per sprint. It reveals which sprints carried the most scope. A sprint with dramatically more issues than others was either over-committed or included backlog items without sprint assignment that were later added mid-sprint.', tip: 'This chart only appears when the Jira export includes a Sprint field. If it is empty, the export uses a workflow without Jira sprints.' },
    { icon: '📋', eyebrow: 'Sprint Status table', title: 'Deep metrics per sprint', body: 'The Sprint Status table shows issues, done count, done points, completed points, average lead time, cycle time, critical items, warning items, and completion rate per sprint. It is the most complete sprint health view in the dashboard — use it to compare sprint health side by side.', tip: 'If committed and completed points are both zero, the sprint used issue-count planning rather than story-point planning.' },
    { icon: '❓', eyebrow: 'Missing data', title: 'When sprint fields are absent', body: 'If the Jira export does not include a Sprint field, or no issues have sprint values, the Sprint section will be empty. The dashboard does not guess sprint assignment — it only uses what is in the export. In this case, rely on the Quarter Statistics table for time-based delivery analysis.', tip: 'In next-gen Jira projects, sprint data may be in a different field name. Check the export column headers if sprints are missing.' },
    { icon: '🎯', eyebrow: 'Sprint health signals', title: 'What to look for', body: 'A healthy sprint shows completion above 80%, critical count below 2, and cycle time close to the team\'s normal baseline. Warning signs: completion below 60% (scope wasn\'t cleared), critical count above 4 (multiple items had problems), or cycle time significantly above average (a few items dragged the sprint).', tip: 'Compare the most recent sprint against the three-sprint rolling average for a fair baseline — don\'t compare against the best sprint ever.' },
  ]),

  ownership: steps('#0f766e', 'linear-gradient(135deg,rgba(15,118,110,.13),rgba(8,145,178,.08))', [
    { icon: '👥', eyebrow: 'Capacity by assignee', title: 'Who carries how much', body: 'The Capacity by Assignee panel shows issue load, active items, story points, and load share percentage per assignee. An assignee with 40%+ load share while others are in single digits is a concentration risk for delivery and a key-person dependency risk for the team.', tip: 'Compare active issues alongside total issues — someone with many total but few active items may be holding backlog rather than actively delivering.' },
    { icon: '🗺️', eyebrow: 'Epic performance', title: 'Health grouped by epic', body: 'The Epic/Parent Performance table groups all issues by their Epic Link or Parent Key and shows completion rate, lead time, cycle time, critical items, and warning items per epic. It is the best view for asking: which work stream is healthy and which is struggling?', tip: 'Epics with high critical counts alongside low completion rates are your riskiest work streams for release readiness conversations.' },
    { icon: '👻', eyebrow: 'Orphan items', title: 'Work with no home', body: 'An orphan is any issue where both Epic Link and Parent Key are empty. Orphans are highlighted in orange in the Flow Health table. They cannot be tracked against a goal, they do not contribute to any epic\'s completion rate, and they are invisible in roadmap views.', tip: 'Fix orphans by linking to the appropriate epic in Jira. This directly improves all capacity and epic metrics across the dashboard.' },
    { icon: '⚖️', eyebrow: 'Balancing load', title: 'Using capacity data for action', body: 'If one assignee has a disproportionate load, consider re-assigning unstarted items before the next sprint. If an assignee has many active items (high WIP), they may be context-switching too much. Ideal WIP per person is 1–3 active items. The capacity table lets you make these decisions with data.', tip: 'Story points matter more than issue count when comparing load. 5 large stories (25 points) is more load than 8 small tasks (8 points).' },
  ]),

  readiness: steps('#dc2626', 'linear-gradient(135deg,rgba(220,38,38,.12),rgba(245,158,11,.08))', [
    { icon: '🚀', eyebrow: 'Epic health check', title: 'Which epics are most at risk', body: 'The Top at-risk epics panel shows epics with critical health or completion below 60%, sorted by risk level. Critical epics appear first, then warning epics, then low-completion ones. This is your release readiness checklist — each item represents a work stream that needs explanation before claiming the project is ready to ship.', tip: 'Click View items on any epic to see all issues belonging to it in a modal, with their individual health and status.' },
    { icon: '🔗', eyebrow: 'Dependency callouts', title: 'Cross-epic blockers', body: 'Dependency callouts list issues that reference another epic or have an external blocker field set in the Jira export. These are the items most likely to slip due to factors outside the team\'s control — they need owner attention, not just developer time.', tip: 'If no dependencies appear but your team tracks them in Jira, check whether the export includes the Dependencies or Linked Issues columns.' },
    { icon: '🔎', eyebrow: 'View items', title: 'Inspect evidence directly', body: 'The View items button on each at-risk epic opens a modal listing all issues in that epic with their key, summary, and status. From this panel you can copy any issue key directly to the clipboard — useful when preparing a stakeholder update where you need to reference specific items by key.', tip: 'The modal also shows the Jira URL for each issue if that field is present in the export — giving you a one-click path to the source.' },
    { icon: '✅', eyebrow: 'Release signals', title: 'What a ready project looks like', body: 'A project is release-ready when: completion is above target, at-risk epics are zero or have clear mitigation plans, dependency callouts are acknowledged and unblocked, critical item count is below the acceptable threshold, and no items have overdue due dates. The Readiness section surfaces the gaps.', tip: 'Use Export risk report in the Summary bar to generate a CSV of all critical and warning items. Share it in the sprint review as your risk register.' },
  ]),

  justification: steps('#f59e0b', 'linear-gradient(135deg,rgba(245,158,11,.13),rgba(249,115,22,.08))', [
    { icon: '📝', eyebrow: 'What it is', title: 'Plain-language delivery summary', body: 'The Justification panel converts dashboard numbers into readable sentences — the kind of language you can use in a status report, email, or meeting. It synthesises completion, flow, risk, sprint, capacity, story points, and epic signals into direct statements that explain the delivery state.', tip: 'This panel is generated from the same data as all other panels. It is a translation, not an opinion — no extra interpretation is added.' },
    { icon: '🔬', eyebrow: 'How insights are built', title: 'Signals that power each sentence', body: 'Each insight is triggered by a specific threshold: lead time generates a sentence when sample size is non-zero; sprint data generates a sprint count sentence when sprint groups are found; critical and warning counts generate an attention sentence when either is above zero; story points generate a completion sentence when total points are non-zero. Missing data generates an explanatory sentence instead.', tip: 'If an insight seems wrong, check the underlying panel — the insight is always derived from the same data shown in the charts.' },
    { icon: '📤', eyebrow: 'How to use it', title: 'From dashboard to stakeholder', body: 'Copy the two or three most relevant insights into your status update. Always cross-check the claims against the detailed tables before sharing — the insights are correct for the data in the export, but the export itself may be incomplete if fields are missing. The confidence badges in the Summary bar tell you which fields are absent.', tip: 'Combine a justification insight with a specific issue key from the Flow Health table to make the strongest possible case. "Average cycle time is 12 days, primarily driven by AJ-234 which has been in QA for 18 days" is far more actionable than a raw number.' },
  ]),

  flow: steps('#2563eb', 'linear-gradient(135deg,rgba(37,99,235,.13),rgba(20,184,166,.08))', [
    { icon: '🗄️', eyebrow: 'The flow table', title: 'Every issue, every signal', body: 'The Story/Task Flow Health panel is the most detailed view in the dashboard. It lists every story and task with its status, sprint, epic/parent, assignee, labels, lead time, cycle time, open age, health classification, and the specific reason for that classification. It is the evidence layer — everything above it is a summary of this table.', tip: 'The table renders 100 rows at a time. Use "Show more" at the bottom for large exports. The filtered summary tells you how many items match and how many are loaded.' },
    { icon: '🔍', eyebrow: 'Eleven filters', title: 'Narrow to exactly what you need', body: 'Filter by issue key, summary text, status, sprint, assignee, maximum lead time, maximum cycle time, maximum open age, health classification, reason text, and label text. All filters are combinable — produce very specific views like "all critical items for assignee X in sprint Y with a label of mobile."', tip: 'The active filter count badge in the sticky filter bar at the top of the page updates in real time as you apply filters.' },
    { icon: '⏱️', eyebrow: 'Three time metrics', title: 'Lead, cycle, and open age', body: 'Lead time is total elapsed time from Created Date to Done — it includes waiting. Cycle time is active time from In Progress Date to Done — it excludes waiting. Open age is how long an unfinished item has been open since Created Date. Together they show: was this item slow to start, slow to complete, or simply old and waiting?', tip: 'High open age with low lead time means the item was created long ago but no one has started it yet. That is a backlog health problem, not a team speed problem.' },
    { icon: '🏥', eyebrow: 'Health and reason', title: 'Why each item is classified this way', body: 'The Health column shows good, warning, or critical. The Reason column shows the exact signal: "Blocked flag is set," "Active work has been in progress over 14 days," "Due date has passed," "High-priority item is still open," or "Completed within expected cycle time." Multiple signals appear as a combined sentence.', tip: 'Items marked good are not necessarily fine — they pass the automated checks but may still have high open age. Always review items with long open age even if classified as good.' },
  ]),

  labels: steps('#7c3aed', 'linear-gradient(135deg,rgba(124,58,237,.13),rgba(8,145,178,.08))', [
    { icon: '🏷️', eyebrow: 'What Classification shows', title: 'Four dimensions of issue identity', body: 'The Classification section reveals how your issues are organised across four dimensions: labels (team-applied tags), issue types (Story, Bug, Task, Epic, Sub-task), parent keys (direct parent issue references), and projects (for multi-project exports). Each dimension answers a different question about scope, purpose, and ownership.', tip: 'Labels are the most flexible dimension — teams use them for board names, feature flags, team ownership, or work categories like "tech-debt" or "mobile."' },
    { icon: '🔖', eyebrow: 'Label Distribution', title: 'What your labels reveal', body: 'The Label Distribution bar chart shows the top 8 labels by issue count. Labels with very high counts often represent a cross-cutting concern — a team, a product area, a release tag, or a type of work. The coverage pills show how many unique labels exist and how many issues carry no label at all.', tip: 'A high unlabeled count means the team is not consistently tagging work. Adding labels in Jira significantly improves this dashboard\'s classification accuracy.' },
    { icon: '📋', eyebrow: 'Label Health table', title: 'Completion and risk per label', body: 'The Label Health & Completion table shows every label with its issue count, done count, completion rate (with a progress bar), critical count, warning count, story points, average lead time, and average cycle time. Compare delivery health across different work categories — for example, "mobile" items may have a lower completion rate than "backend," signalling a team-specific bottleneck.', tip: 'A label with high critical count and low completion rate is a category of work that needs targeted attention, not just individual items.' },
    { icon: '📁', eyebrow: 'Types and Projects', title: 'Issue types and multi-project context', body: 'The Issue Type Breakdown shows your distribution across Jira issue types. Many Bugs versus Stories may indicate stabilisation or support mode. The Project Breakdown only appears when the export contains multiple Jira projects, giving you a cross-project delivery view in one place.', tip: 'If both Parent Key and Epic Link columns are in your export, the Epics panel uses Epic Link as priority and falls back to Parent Key. The Parent section shows Parent Key exclusively.' },
    { icon: '🔗', eyebrow: 'Parent Key', title: 'Direct parent hierarchy', body: 'The Parent Key Breakdown shows how many issues directly reference each parent. This is distinct from Epics which use the Epic Link field. In next-gen Jira projects, epics are tracked via Parent Key rather than Epic Link — making this panel the primary epic view for those projects.', tip: 'Cross-reference the Parent Breakdown with the Epics panel to see whether both fields are populated consistently in your export.' },
  ]),

  relations: steps('#dc2626', 'linear-gradient(135deg,rgba(220,38,38,.12),rgba(245,158,11,.08))', [
    { icon: '🔗', eyebrow: 'What links are', title: 'Jira issue relationships', body: 'The Relations section maps all linked issue relationships from your Jira export. Common link types include Blocks/is blocked by (dependency), Relates to (general connection), Duplicates/is duplicated by, and Clones. These reveal which items are dependencies, which are blockers, and which teams are most connected.', tip: 'Relations only appear when your Jira export includes columns like "Inward issue link (Blocks)." Re-export from Jira with the Linked Issues columns selected to see this section.' },
    { icon: '📊', eyebrow: 'Link types', title: 'What kinds of relationships exist', body: 'The Link Type Distribution chart shows how many links of each type exist across all issues. Many Blocks/blocked-by links mean significant dependency risk — those chains can stall delivery when one item delays. Projects dominated by Relates to links are more loosely coupled and typically lower risk.', tip: 'The chart counts individual link instances. An issue that blocks three other issues contributes three "Blocks" links to the chart.' },
    { icon: '🌐', eyebrow: 'Most connected', title: 'Hubs of your dependency network', body: 'Items that appear in many link relationships are dependency hubs. If a hub item is also marked critical or at-risk in the Flow Health table, it represents a concentrated delivery risk — many other items may be waiting on it. The Most Connected Items table shows link count per item alongside its summary.', tip: 'Cross-reference the most connected items with the Top Blockers card at the top of the dashboard. Overlap between the two lists indicates your highest-priority escalation items.' },
    { icon: '🚧', eyebrow: 'Blocked items', title: 'Items explicitly blocked by others', body: 'The Blocked Items table shows which issues are explicitly blocked by other issues through inward "Blocks" link relationships. Each row shows the blocked item\'s key, its summary, the key of the blocking issue, and how many blockers it has. This is link-data based blocking, distinct from the health-signal based detection used elsewhere.', tip: 'If an item appears in both the Blocked Items table and the Top Blockers highlight card, it is flagged by two different detection methods — treat it as your highest escalation priority.' },
  ]),
};

// ─── unified journey component ───────────────────────────────────────────────
function Journey({ steps: stepList, finishLabel = 'Done ✓', onFinish }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState('forward');
  const total = stepList.length;
  const current = stepList[step];
  const isLast = step === total - 1;

  const goTo = (next) => {
    setDir(next > step ? 'forward' : 'back');
    setStep(next);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' && step < total - 1) { setDir('forward'); setStep((s) => s + 1); }
      if (e.key === 'ArrowLeft' && step > 0) { setDir('back'); setStep((s) => s - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, total]);

  return (
    <div className="journey-wrap">
      <div className="journey-progress-bar" role="progressbar" aria-valuenow={step + 1} aria-valuemax={total} aria-label="Section progress">
        <div className="journey-progress-fill" style={{ width: `${((step + 1) / total) * 100}%`, background: `linear-gradient(90deg, ${current.color}, #14b8a6)` }} />
      </div>

      <div className={`journey-step${dir === 'back' ? ' back' : ''}`} key={step}>
        <div className="journey-icon-wrap">
          <div className="journey-icon" style={{ background: current.bg }}>
            <span role="img" aria-hidden="true">{current.icon}</span>
          </div>
          <span className="journey-step-counter">{step + 1} / {total}</span>
        </div>
        <div className="journey-body">
          <span className="journey-eyebrow" style={{ background: `${current.color}1a`, color: current.color }}>
            {current.eyebrow}
          </span>
          <h3 className="journey-title">{current.title}</h3>
          <p className="journey-text">{current.body}</p>
          {current.tip && (
            <div className="journey-tip">
              <span aria-hidden="true">💡</span>
              <span>{current.tip}</span>
            </div>
          )}
        </div>
      </div>

      <div className="journey-dots" role="tablist" aria-label="Journey steps">
        {stepList.map((s, i) => (
          <button
            key={i} type="button" role="tab"
            className={`journey-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
            style={i === step ? { background: current.color, width: '28px' } : i < step ? { background: '#14b8a6' } : {}}
            onClick={() => goTo(i)}
            aria-label={`${s.eyebrow}: ${s.title}`}
            aria-selected={i === step}
          />
        ))}
      </div>

      <div className="journey-nav">
        <button type="button" className="journey-btn-back" onClick={() => goTo(step - 1)} disabled={step === 0}>← Back</button>
        {isLast ? (
          <button
            type="button"
            className="journey-btn-start"
            style={{ background: `linear-gradient(135deg, ${current.color}, #14b8a6)` }}
            onClick={onFinish}
          >
            {finishLabel}
          </button>
        ) : (
          <button
            type="button"
            className="journey-btn-next"
            style={{ background: `linear-gradient(135deg, ${current.color}, #0891b2)` }}
            onClick={() => goTo(step + 1)}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── main help guide ─────────────────────────────────────────────────────────
export default function HelpGuide({ open, activeSection: requestedSection = 'welcome', onClose }) {
  const [activeSection, setActiveSection] = useState(requestedSection);

  useEffect(() => {
    if (open && SECTION_STEPS[requestedSection]) {
      setActiveSection(requestedSection);
    }
  }, [open, requestedSection]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open) return null;

  const TAB_LABELS = {
    welcome: 'Welcome', summary: 'Summary', quickFilters: 'Filters',
    attention: 'Attention', kpis: 'KPIs', visuals: 'Visuals',
    ratios: 'Ratios', delivery: 'Delivery', quarters: 'Quarters',
    kanban: 'Kanban', sprint: 'Sprint', ownership: 'Ownership',
    readiness: 'Readiness', justification: 'Justify', flow: 'Flow Table',
    labels: 'Labels', relations: 'Relations',
  };

  const currentSteps = SECTION_STEPS[activeSection] || SECTION_STEPS.welcome;
  const isWelcome = activeSection === 'welcome';

  return (
    <div className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className="help-backdrop" onClick={onClose} />
      <section className="help-panel">
        <header className="help-header">
          <div>
            <span className="help-eyebrow">Delivery Clarity — Guide</span>
            <h2 id="help-title">How to use Delivery Clarity</h2>
            <p>Every section is an interactive journey — use the arrow keys or tap Next to step through, and click any tab to jump to a topic.</p>
          </div>
          <button className="help-close" type="button" onClick={onClose} aria-label="Close help">Close</button>
        </header>

        <nav className="help-tabs" aria-label="Help sections">
          {Object.entries(TAB_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={activeSection === key ? 'active' : ''}
              onClick={() => setActiveSection(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <Journey
          steps={currentSteps}
          finishLabel={isWelcome ? 'Start exploring →' : 'Done ✓'}
          onFinish={isWelcome ? onClose : () => setActiveSection('welcome')}
        />

        <p className="help-copyright">
          © {new Date().getFullYear()} Ali Abu Ras · aburasali80@gmail.com · All rights reserved.
        </p>
      </section>
    </div>
  );
}
