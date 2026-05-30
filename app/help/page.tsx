// @ts-nocheck
// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Item {
  q: string;
  a: string | React.ReactNode;
}

interface Section {
  id: string;
  icon: string;
  title: string;
  items: Item[];
}

// ─── Section data ─────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  // 1. Welcome
  {
    id: 'welcome',
    icon: '🚀',
    title: 'Welcome — Getting Started',
    items: [
      {
        q: 'Meet Delivery Clarity',
        a: 'Delivery Clarity is your Jira Delivery Intelligence board. Drop in any Jira export and immediately see sprint health, flow efficiency, risk signals, capacity, and epic readiness — all in one place, with no Jira login required.',
      },
      {
        q: 'Step 1 — Export from Jira',
        a: 'In Jira, open your board or backlog and choose Export → Excel or CSV. For the richest analysis, include at minimum these columns: Summary, Issue Key, Issue Type, Status, Priority, Assignee, Sprint, Story Points, Created, Updated, Resolved / Resolution Date, Labels, Epic Link / Epic Name, and Linked Issues. Export the full backlog — not just the active sprint — to enable quarter trends and epic analysis.',
      },
      {
        q: 'Step 2 — Upload your file',
        a: 'Drag your CSV or Excel file onto the upload screen, or click the drop zone to browse. The full dashboard appears within seconds. Supported formats: .csv, .xls, .xlsx up to 20 MB. No Jira login, no configuration, no manual setup required.',
      },
      {
        q: 'Step 3 — Read the dashboard top to bottom',
        a: 'The dashboard tells a linear story. Start at the Summary bar to see overall health. Move through the KPI cards and highlight strips. Explore the delivery composition chart, then the per-section pages (Charts, Quarters, Kanban, Sprint, Ownership, Readiness). Finish at the Flow Table for individual item detail.',
      },
      {
        q: 'Step 4 — Use the sticky quick-filter bar',
        a: 'The quick-filter bar follows you as you scroll. Tap All, High Risk, Blocked, Needs Review, or Sprint Today to instantly narrow the flow table to matching work items. A blue badge in the filter bar shows how many filters are currently active.',
      },
      {
        q: 'Step 5 — Drill into the Flow Table',
        a: 'Open Story / Task Flow Health at the bottom of the dashboard. Apply any combination of the 11 available filters — key, status, sprint, assignee, health, labels, type, priority, epic, reason, or date range. Every matched item shows exactly why it is healthy or at risk, along with lead time, cycle time, and wait time.',
      },
      {
        q: 'Step 6 — Act on your results',
        a: 'Review high-risk items to identify the worst blockers, export a risk CSV for stakeholder reports, and save your layout view to remember filters for the next session. Use the ? buttons throughout the dashboard for section-specific explanations at any time.',
      },
    ],
  },

  // 2. Summary Page
  {
    id: 'summary',
    icon: '📋',
    title: 'Summary Page',
    items: [
      {
        q: 'Health banner',
        a: 'The banner at the top of the Summary page answers three questions in one row: is the project healthy, how far off target are we, and what changed since last time? Three states are possible — Healthy (zero warning or critical items), At Risk (1–3 items need attention), and Urgent Attention (4+ items carry warning or critical health signals and require escalation or re-planning).',
      },
      {
        q: 'KPI cards',
        a: 'Six cards sit directly below the health banner: Completion Rate, Open Alerts, Active Items, Avg Lead Time, Avg Cycle Time, and Story Points. Each card shows the current value, a trend arrow versus the previous period, and a colour signal (green = healthy, amber = watch, red = act).',
      },
      {
        q: 'Attention items',
        a: 'Attention items are issues that the engine has flagged as blockers, overdue, stale, or orphaned. Each item shows its key, title, assignee, days-active count, and the primary reason for the flag. Click any row to open the full detail panel.',
      },
      {
        q: 'Insights strip',
        a: 'Below the attention list is a plain-language insights strip. The engine writes one sentence per signal — for example "3 items have been in progress for more than 14 days" or "Sprint completion is 12 points below target." These mirror the Justification section on the main dashboard.',
      },
      {
        q: 'CTA buttons',
        a: 'Two call-to-action buttons sit at the bottom of the summary: View Full Dashboard (navigates to /dashboard) and Export Risk CSV (downloads a filtered CSV containing only the flagged items). A third button, Share Summary, copies a shareable URL to the clipboard.',
      },
    ],
  },

  // 3. Quick Filters
  {
    id: 'filters',
    icon: '🎯',
    title: 'Quick Filters',
    items: [
      {
        q: 'All',
        a: 'Resets all active quick filters and shows the complete set of issues in the flow table. Any column filters or search terms you have applied independently are preserved.',
      },
      {
        q: 'High Risk',
        a: 'Shows items whose health classification is Critical. These are issues that are active for more than 14 days, have exceeded their cycle time threshold, carry a Blocked flag, have a passed due date, or are labelled High/Highest/Critical priority and remain open.',
      },
      {
        q: 'Blocked',
        a: 'Shows items where the Blocked field is true, the status name contains "blocked", or a linked issue of type "is blocked by" is present. These items need an explicit unblocking action before they can move forward.',
      },
      {
        q: 'Needs Review',
        a: 'Shows items whose status contains "review", "qa", "testing", or "validation". These are items that have finished development but are waiting for sign-off. A long queue here often signals a bottleneck in the review stage.',
      },
      {
        q: 'Sprint Today',
        a: 'Shows items assigned to the sprint that is active on today\'s date. If your Jira export includes multiple sprints, this filter isolates only the current sprint\'s items so you can focus on today\'s delivery commitments.',
      },
    ],
  },

  // 4. Attention Cards
  {
    id: 'attention',
    icon: '⚠️',
    title: 'Attention Cards',
    items: [
      {
        q: 'Blockers',
        a: 'A blocker is any item where the Blocked field is true, the status name includes "blocked", or a "is blocked by" link points to an open issue. Attention cards for blockers show the blocking issue key, how long the item has been blocked, and the assignee responsible for resolving it.',
      },
      {
        q: 'Overdue items',
        a: 'An item is overdue when its Due Date field is set and the date has passed while the issue remains open (not Done, Closed, or Resolved). The attention card shows the number of calendar days past due and the original due date.',
      },
      {
        q: 'Orphan items',
        a: 'An orphan is an issue that has no sprint assignment and no epic link. Orphans are invisible to sprint planning and epic tracking, meaning they risk being forgotten indefinitely. The attention card lists each orphan with its creation date and assignee (if any) so you can triage and assign them quickly.',
      },
    ],
  },

  // 5. KPI Cards
  {
    id: 'kpi',
    icon: '📊',
    title: 'KPI Cards',
    items: [
      {
        q: 'Completion Rate',
        a: 'Percentage of all issues in the export that have a status of Done, Closed, or Resolved. Calculated as: (done issues / total issues) × 100. This is the primary delivery health indicator and is weighted at 28% of the overall Delivery Health Score.',
      },
      {
        q: 'Open Alerts',
        a: 'Count of issues classified as Warning or Critical health. Warning items have been active 7–14 days or waited more than 30 days without being started. Critical items exceed 14 days active, are blocked, are overdue, or carry the highest priority and are still open.',
      },
      {
        q: 'Active Items',
        a: 'Count of issues currently In Progress, In Development, In Review, or in any status that indicates active work. This helps gauge team load and whether WIP (work-in-progress) limits are being respected.',
      },
      {
        q: 'Avg Lead Time',
        a: 'Average number of calendar days from an issue\'s Created date to its Resolution date, measured only across completed issues. Lead Time includes backlog wait time. A high lead time relative to cycle time means items sit in the backlog before anyone starts them.',
      },
      {
        q: 'Avg Cycle Time',
        a: 'Average number of calendar days from when an issue first moved to In Progress to when it reached Done. Cycle Time is the pure delivery measurement. If cycle time is rising sprint-over-sprint, it typically signals growing complexity or a bottleneck in the workflow.',
      },
      {
        q: 'Story Points',
        a: 'Total story points completed in the current period versus the total planned. If story point data is missing from the export, this card falls back to issue count. A large gap between planned and delivered points is the most important number to explain in a stakeholder report.',
      },
    ],
  },

  // 6. Charts Page
  {
    id: 'charts',
    icon: '📈',
    title: 'Charts Page',
    items: [
      {
        q: 'Donut charts',
        a: 'Two donut charts appear at the top of the Charts page. The left donut shows the distribution of issues by Status (Done, In Progress, To Do, Blocked, etc.). The right donut shows the distribution by Health classification (Healthy, Warning, Critical). Hover over any segment to see the exact count and percentage.',
      },
      {
        q: 'Bar charts',
        a: 'Stacked bar charts show sprint-over-sprint progress, breaking each sprint into Done, In Progress, and Not Started segments. A separate bar chart shows story points planned versus delivered per sprint. These are the fastest way to spot a sprint that fell significantly short of its commitment.',
      },
      {
        q: 'Gantt / timeline chart',
        a: 'The timeline chart plots each epic as a horizontal bar spanning its earliest created date to its latest resolved (or estimated completion) date. Epics with no resolved date extend to today. Use this to spot overlapping epics, identify long-running efforts, and understand delivery sequencing.',
      },
    ],
  },

  // 7. Delivery Composition
  {
    id: 'composition',
    icon: '🧩',
    title: 'Delivery Composition',
    items: [
      {
        q: 'What the Delivery Composition panel shows',
        a: 'The Delivery Composition panel is a stacked horizontal bar showing what proportion of the current delivery period is in each state. It gives you an instant visual sense of how healthy the overall pipeline is — whether most work is done, in progress, or not yet started.',
      },
      {
        q: 'Segment colours',
        a: 'Done / Closed / Resolved: green. In Progress / In Development / In Review: blue. Blocked: red. To Do / Backlog / Open: grey. The exact colours follow the status category from Jira — the engine groups any status not matching "done" or "in progress" into the backlog segment.',
      },
      {
        q: 'Priority ordering',
        a: 'Within each state segment the items are ordered by priority. Done items appear first (left-most, green). Within the active segments, Critical items appear before High, then Medium, then Low, then No Priority. This ordering ensures the most impactful work is always visible first when the bar is narrow.',
      },
    ],
  },

  // 8. Delivery Controls
  {
    id: 'controls',
    icon: '🎛️',
    title: 'Delivery Controls',
    items: [
      {
        q: 'Flow Efficiency',
        a: 'Flow Efficiency = (active work time / total elapsed time) × 100. A score above 40% is generally considered healthy for software teams. Anything below 25% indicates items spend most of their life waiting — in queues, in review, or blocked — rather than being actively worked on.',
      },
      {
        q: 'Story Points panel',
        a: 'The Story Points panel breaks down points into: Completed, In Progress, and Remaining. It also shows the sprint\'s velocity (points completed per sprint) and a burn-down projection. If the remaining points exceed the projected capacity before the sprint ends, the panel highlights this as a risk.',
      },
      {
        q: 'Critical signals',
        a: 'Critical signals are binary indicators that appear in the delivery controls section: Blocked items present (yes/no), Overdue items present (yes/no), No-sprint orphans present (yes/no), and No-assignee items present (yes/no). Any active signal is highlighted in red and links directly to the matching filtered view in the flow table.',
      },
    ],
  },

  // 9. Quarters
  {
    id: 'quarters',
    icon: '📅',
    title: 'Quarters',
    items: [
      {
        q: 'Grouping logic',
        a: 'The Quarters page groups all issues by the quarter in which they were resolved (or created, if unresolved). Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec. Issues without a date fall into an "Undated" bucket. The grouping uses the fiscal year of the export data, not the calendar year of the upload.',
      },
      {
        q: 'Completion rate per quarter',
        a: 'For each quarter, the page shows the total issues, the number completed, and the completion rate as a percentage. A declining rate quarter-over-quarter is a leading indicator of accumulating technical debt or backlog growth outpacing delivery.',
      },
      {
        q: 'Timing signals',
        a: 'The Quarters page also highlights quarters where the average cycle time was above 14 days (shown in amber) or above 21 days (shown in red). This helps identify periods when the team was under particular stress or process friction was high.',
      },
    ],
  },

  // 10. Kanban
  {
    id: 'kanban',
    icon: '🗂️',
    title: 'Kanban',
    items: [
      {
        q: 'Status distribution',
        a: 'The Kanban page maps every issue to its Jira status and groups them into standard Kanban columns: Backlog, To Do, In Progress, Review, Done, and Blocked. Each column shows the item count, total story points, and percentage of overall work. Items are sorted within each column by priority.',
      },
      {
        q: 'Health table',
        a: 'Below the column cards is a health table listing each issue with its status, health classification, days in current status, assignee, and priority. You can sort by any column. Red rows are Critical-health items; amber rows are Warning-health items.',
      },
      {
        q: 'Bottleneck detection',
        a: 'The engine flags a bottleneck when one column holds more than 30% of all in-flight (not Done) items. The bottleneck column is highlighted with an orange border and a warning label. Common bottlenecks surface in the Review column when QA capacity is insufficient, or in Blocked when upstream dependencies are unresolved.',
      },
    ],
  },

  // 11. Sprint
  {
    id: 'sprint',
    icon: '⚡',
    title: 'Sprint',
    items: [
      {
        q: 'Sprint comparison',
        a: 'The Sprint page shows all sprints present in the export side by side, sorted from oldest to newest. For each sprint you see: planned points, completed points, completion percentage, number of issues, number of blockers, and average cycle time. Tap any sprint header to expand the full issue list for that sprint.',
      },
      {
        q: 'Sprint status',
        a: 'Each sprint is tagged as Active, Closed, or Future based on the sprint state field in the Jira export. If your export does not include sprint state metadata, the engine infers status: a sprint whose start and end dates bracket today is Active; one whose end date is in the past is Closed; one whose start date is in the future is Future.',
      },
      {
        q: 'Missing sprint data',
        a: 'If the Sprint column is absent or empty for many items, the Sprint page will display a warning banner. Items without a sprint assignment are counted in the "Unassigned Sprint" row. To fix this in Jira, ensure you export from the Backlog view (not the Board view) and include the Sprint field in your column selection.',
      },
    ],
  },

  // 12. Ownership
  {
    id: 'ownership',
    icon: '👤',
    title: 'Ownership',
    items: [
      {
        q: 'Capacity view',
        a: 'The Ownership page lists every assignee in the export along with their current WIP (work-in-progress count), total assigned items, completed items, completion rate, average cycle time, and assigned story points. This gives team leads an instant capacity snapshot without needing a separate report.',
      },
      {
        q: 'Epic performance per owner',
        a: 'For each assignee, the page breaks down their items by epic. This makes it easy to see whether one person is carrying a disproportionate share of a high-risk epic, or whether a critical epic has no clear owner.',
      },
      {
        q: 'Orphan items',
        a: 'The Ownership page also shows a dedicated Unassigned Items section listing every issue where the Assignee field is blank. Unassigned items with Critical or Warning health are highlighted in red. These items are at highest risk of being forgotten because no individual is accountable for them.',
      },
    ],
  },

  // 13. Readiness
  {
    id: 'readiness',
    icon: '🏁',
    title: 'Readiness',
    items: [
      {
        q: 'At-risk epics',
        a: 'The Readiness page scores each epic on a 0–100 readiness scale based on: percentage of child issues completed (40%), absence of critical-health child issues (30%), absence of open blockers (20%), and presence of a due date (10%). Epics scoring below 50 are flagged as At Risk.',
      },
      {
        q: 'Dependencies',
        a: 'The Dependencies panel shows all "is blocked by", "depends on", and "relates to" link types across all issues. Issues with unresolved inbound dependencies are listed with the count of open blockers. This is the fastest way to identify a release that is being held up by another team or another epic.',
      },
      {
        q: 'Release signals',
        a: 'Release signals are Boolean indicators at the top of the Readiness page: All critical items resolved (yes/no), No open blockers (yes/no), All epics above 80% complete (yes/no), and No items past due date (yes/no). A green tick on all four signals indicates the release is ready to proceed.',
      },
    ],
  },

  // 14. Justification
  {
    id: 'justification',
    icon: '💬',
    title: 'Justification',
    items: [
      {
        q: 'What is Justification?',
        a: 'Justification is the plain-language insights panel. Instead of showing raw numbers, it narrates the most important signals from the current data as short sentences. Example outputs: "5 items have been in progress for more than 14 days — consider breaking them down or reassigning." or "Sprint velocity has dropped 30% from the previous sprint."',
      },
      {
        q: 'How insights are generated',
        a: 'Insights are generated server-side by comparing computed metric values against threshold rules. They are not AI-generated — they are deterministic logic that fires when a metric crosses a threshold. Each insight links to the relevant section of the dashboard so you can drill in immediately.',
      },
      {
        q: 'Using insights in stakeholder reports',
        a: 'The Justification panel is designed to be copy-paste ready for status reports. Each sentence is written in plain language without Jira jargon. You can copy the full panel text, paste it into an email or Confluence page, and it will read naturally to a non-technical stakeholder.',
      },
    ],
  },

  // 15. Flow Table
  {
    id: 'flow',
    icon: '🔍',
    title: 'Flow Table — Story & Task Flow Health',
    items: [
      {
        q: 'The 11 filters',
        a: 'The Flow Table supports 11 independent filters: (1) Issue Key search, (2) Status multi-select, (3) Sprint multi-select, (4) Assignee multi-select, (5) Health classification (Healthy / Warning / Critical), (6) Labels multi-select, (7) Issue Type multi-select, (8) Priority multi-select, (9) Epic multi-select, (10) Reason keyword search (searches the health reason field), (11) Date range (filters by created or resolved date). All filters are ANDed together.',
      },
      {
        q: 'Time metrics',
        a: 'For each issue the table shows three time columns: Lead Time (days from Created to Done), Cycle Time (days from first In Progress to Done), and Wait Time (Lead Time minus Cycle Time — the time spent waiting before work started). For in-progress items, these are calculated using today as the end date.',
      },
      {
        q: 'Health and reason columns',
        a: 'The Health column shows Healthy (green), Warning (amber), or Critical (red). The Reason column shows the plain-language explanation for the classification: e.g. "Active > 14 days", "Blocked flag set", "Due date passed 3 days ago", or "High priority and open > 7 days". Multiple reasons are comma-separated.',
      },
    ],
  },

  // 16. Labels & Classification
  {
    id: 'labels',
    icon: '🏷️',
    title: 'Labels & Classification',
    items: [
      {
        q: 'Label distribution',
        a: 'The Labels section shows a frequency chart of all labels present in the export. Labels are normalised to lowercase before counting so "bug" and "Bug" are treated as the same label. The top 20 labels are shown by default; tap "Show all" to see the full list.',
      },
      {
        q: 'Label health',
        a: 'For each label, the engine computes the health breakdown of all issues carrying that label: percentage Healthy, Warning, and Critical. Labels where more than 30% of issues are Critical are highlighted in red. This helps identify label-based workstreams (e.g. a "migration" label) that are in distress.',
      },
      {
        q: 'Types and projects',
        a: 'The Classification panel groups issues by Issue Type (Story, Task, Bug, Sub-task, Epic, Spike, etc.) and by Jira Project Key (the prefix before the hyphen in each issue key). For multi-project exports this makes it easy to see which project is contributing the most risk.',
      },
    ],
  },

  // 17. Relations
  {
    id: 'relations',
    icon: '🔗',
    title: 'Relations',
    items: [
      {
        q: 'Link types',
        a: 'Delivery Clarity recognises five Jira link types: "is blocked by" / "blocks", "depends on" / "is depended on by", "relates to", "duplicates" / "is duplicated by", and "is cloned by" / "clones". Each type is shown in the Relations panel with a count of open links of that type.',
      },
      {
        q: 'Most connected items',
        a: 'The Most Connected list ranks issues by total inbound + outbound link count. Highly connected items are often architectural or integration issues. If a highly connected item is also Critical health, it represents a systemic risk — one unresolved issue that is blocking many others.',
      },
      {
        q: 'Blocked items via relations',
        a: 'The Relations panel\'s Blocked via Link section lists every issue that has at least one open "is blocked by" link pointing to another open issue. For each blocked item it shows: the blocking issue key, blocking issue status, and the assignee of the blocking issue — so you know exactly who to contact.',
      },
    ],
  },

  // 18. Jira Export Guide
  {
    id: 'export-guide',
    icon: '📤',
    title: 'Jira Export Guide',
    items: [
      {
        q: 'Step-by-step export instructions',
        a: (
          <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 leading-relaxed">
            <li>In Jira, navigate to your project and open the <strong>Backlog</strong> view (not the Board view).</li>
            <li>Click the three-dot menu (<strong>…</strong>) in the top-right corner of the backlog.</li>
            <li>Choose <strong>Export</strong> → <strong>Export Excel XML</strong> (for .xls) or <strong>Export to CSV (all fields)</strong>.</li>
            <li>If prompted to select columns, ensure the recommended columns below are included.</li>
            <li>Save the file to your computer. The file will be named something like <em>Jira.csv</em> or <em>Jira.xls</em>.</li>
            <li>Return to Delivery Clarity and drop the file on the upload screen.</li>
          </ol>
        ),
      },
      {
        q: 'Recommended columns to include',
        a: (
          <ul className="list-disc list-inside space-y-0.5 text-sm text-slate-600 leading-relaxed columns-2">
            <li>Summary</li>
            <li>Issue Key</li>
            <li>Issue Type</li>
            <li>Status</li>
            <li>Priority</li>
            <li>Assignee</li>
            <li>Sprint</li>
            <li>Story Points</li>
            <li>Created</li>
            <li>Updated</li>
            <li>Resolved</li>
            <li>Due Date</li>
            <li>Labels</li>
            <li>Epic Link</li>
            <li>Epic Name</li>
            <li>Linked Issues</li>
            <li>Description (optional)</li>
            <li>Components (optional)</li>
          </ul>
        ),
      },
      {
        q: 'Tips for best results',
        a: 'Export the full backlog rather than a single sprint — this enables quarter trends and epic readiness analysis. If your export is very large (thousands of issues), consider filtering to a date range of 6–12 months to stay within the 20 MB limit. For multi-project reports, export each project separately and upload the one most relevant to the current delivery review.',
      },
    ],
  },

  // 19. Field Aliases
  {
    id: 'aliases',
    icon: '🔤',
    title: 'Field Aliases',
    items: [
      {
        q: 'What are field aliases?',
        a: 'Jira exports use different column names depending on the Jira version, the export method, and any custom field configuration. Delivery Clarity maps a broad set of known aliases to the canonical field names it uses internally. This means you do not need to rename columns before uploading.',
      },
      {
        q: 'Supported alias mappings',
        a: (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-700">Canonical field</th>
                  <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-700">Accepted aliases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Key', 'Issue Key, Issue Id, Key, ID'],
                  ['Summary', 'Summary, Title, Subject'],
                  ['Issue Type', 'Issue Type, Type, IssueType, issuetype'],
                  ['Status', 'Status, State, Issue Status'],
                  ['Priority', 'Priority, Severity'],
                  ['Assignee', 'Assignee, Assigned To, Owner, Developer'],
                  ['Sprint', 'Sprint, Sprint Name, Sprint(s)'],
                  ['Story Points', 'Story Points, Story point estimate, Points, SP, Estimate, Original Estimate'],
                  ['Created', 'Created, Created Date, Create Date, Date Created'],
                  ['Updated', 'Updated, Last Updated, Updated Date, Modified'],
                  ['Resolved', 'Resolved, Resolution Date, Resolved Date, Completion Date, Done Date'],
                  ['Due Date', 'Due Date, Due, Target Date, Deadline'],
                  ['Labels', 'Labels, Label, Tags, Tag'],
                  ['Epic Link', 'Epic Link, Epic, Epic Name, Epic/Theme, Parent Epic'],
                  ['Linked Issues', 'Linked Issues, Links, Issue Links, Outward issue link'],
                  ['Blocked', 'Blocked, Is Blocked, Flagged, Impediment'],
                ].map(([canonical, aliases]) => (
                  <tr key={canonical} className="hover:bg-slate-50">
                    <td className="px-3 py-2 border border-slate-200 font-medium text-slate-800 whitespace-nowrap">{canonical}</td>
                    <td className="px-3 py-2 border border-slate-200 text-slate-600">{aliases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      },
    ],
  },

  // 20. API Routes
  {
    id: 'api',
    icon: '⚙️',
    title: 'API Routes',
    items: [
      {
        q: 'Available API endpoints',
        a: (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-700">Method</th>
                  <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-700">Route</th>
                  <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-700">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['POST', '/api/upload', 'Upload a Jira CSV or Excel file and trigger import processing. Returns computed metrics, parse warnings, and an import log entry. Accepts multipart/form-data with a field named "file". Rate limited to 20 requests per 15 minutes per IP. Max file size 20 MB.'],
                  ['GET', '/api/imports', 'Return the full import log — a JSON array of all past upload attempts including status, file name, row count, timestamp, and any validation errors.'],
                  ['GET', '/api/metrics', 'Return computed KPI metrics derived from the most recent successful import. Returns 404 if no successful import exists.'],
                  ['GET', '/api/dashboard', 'Return dashboard status and service metadata (version, service name, status: ok).'],
                  ['GET', '/api/health', 'Health check endpoint — confirms the API service is running. Returns { status: "ok", service: "delivery-clarity-api", version: "2.0.0" }.'],
                  ['GET', '/api/backend-view', 'JSON overview of import statistics (total, successful, failed), the 10 most recent import logs, and a list of all API endpoints.'],
                  ['GET', '/api/developer-view', 'Developer wiki — architecture notes, service descriptions, and data-flow documentation for contributors.'],
                ].map(([method, route, desc]) => (
                  <tr key={route} className="hover:bg-slate-50">
                    <td className="px-3 py-2 border border-slate-200 font-bold">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-white text-xs font-bold ${method === 'POST' ? 'bg-green-600' : 'bg-blue-600'}`}>{method}</span>
                    </td>
                    <td className="px-3 py-2 border border-slate-200 font-mono text-slate-800 whitespace-nowrap">{route}</td>
                    <td className="px-3 py-2 border border-slate-200 text-slate-600 leading-relaxed">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      },
      {
        q: 'Authentication',
        a: 'All API routes are unauthenticated in the current version. They are intended for same-origin use by the Next.js frontend. If you are deploying Delivery Clarity in a shared or production environment, add authentication middleware (e.g. NextAuth.js or a Vercel Edge Function with a secret header check) before exposing the API publicly.',
      },
    ],
  },

  // 21. Troubleshooting
  {
    id: 'troubleshooting',
    icon: '🛠️',
    title: 'Troubleshooting',
    items: [
      {
        q: '"No file uploaded" or upload button does nothing',
        a: 'Check that your browser allows file access (some corporate security tools block file dialogs). Ensure the file is a .csv, .xls, or .xlsx — PDF and Word exports are not supported. Check that the file is under 20 MB. If you are on a slow connection, wait for the progress indicator to complete before navigating away.',
      },
      {
        q: '"Unsupported file type" error',
        a: 'Delivery Clarity only accepts .csv, .xls, and .xlsx files exported directly from Jira. Do not upload Jira XML exports, JSON exports, PDF reports, or Word documents. If your Jira instance exports as .xlsm (macro-enabled Excel), save a copy as .xlsx before uploading.',
      },
      {
        q: '"Validation failed" error with details',
        a: 'This means the file was parsed successfully but failed data validation — for example, zero issues were found, or every row had an empty Status column. Check the error details shown on screen. Common fixes: (1) Ensure you exported from the Backlog view, not the Roadmap or Timeline view. (2) Ensure you exported "all fields" not just a subset. (3) Verify the file is not empty or password-protected.',
      },
      {
        q: 'Dashboard shows no sprint data',
        a: 'The Sprint column is missing or all values are empty. In Jira, this happens when you export from the Board view (which does not include sprint metadata). Fix: re-export from the Backlog view and include the Sprint field. Alternatively, if your team does not use Jira Sprints, ignore the Sprint sections — the rest of the dashboard will work with the columns available.',
      },
      {
        q: 'Story points are all zero or missing',
        a: 'Story Points is a custom field in Jira and its column name varies by instance. Common names include "Story Points", "Story point estimate", "SP", "Points", and "Estimate". If none of these are present in your export, Delivery Clarity falls back to issue count for all point-based metrics. To fix, add the custom story points field to your Jira export column configuration.',
      },
      {
        q: 'All items show as Healthy when I expect warnings',
        a: 'Health classification requires date fields. If Created, Updated, or Resolved dates are missing from the export, the engine cannot calculate active duration or cycle time and defaults to Healthy. Check that your export includes the Created and Updated columns. Also verify that the dates are in a standard format (ISO 8601 or common locale formats — MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD).',
      },
      {
        q: 'The page loads but shows "No successful import found"',
        a: 'You are visiting the dashboard directly without having uploaded a file first. Navigate to the Upload page (/), drop your Jira export, and wait for the success message before returning to the dashboard. The dashboard reads from the last successful import stored in the server session.',
      },
      {
        q: 'Rate limit error (429 Too Many Requests)',
        a: 'The upload endpoint allows 20 uploads per 15 minutes per IP address. If you hit this limit, wait 15 minutes before trying again. This limit prevents accidental runaway upload loops. If you are a developer testing the app locally and need to lift the limit, see the RATE_MAX and RATE_WINDOW_MS constants in /app/api/upload/route.ts.',
      },
    ],
  },
];

// ─── Accordion item ───────────────────────────────────────────────────────────

function AccordionItem({ item, isOpen, onToggle }: { item: Item; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-t border-slate-100 first:border-0">
      <button
        className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors group"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-slate-800 text-sm leading-snug">{item.q}</span>
        <span
          className="text-slate-400 text-xs shrink-0 transition-transform duration-200 group-hover:text-slate-600"
          style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div className="px-5 pb-4 pt-1">
          {typeof item.a === 'string' ? (
            <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
          ) : (
            <div className="text-sm text-slate-600 leading-relaxed">{item.a}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section accordion ────────────────────────────────────────────────────────

function SectionAccordion({ section }: { section: Section }) {
  const [openSection, setOpenSection] = useState(false);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  function toggleSection() {
    setOpenSection((v) => !v);
  }

  function toggleItem(i: number) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        onClick={toggleSection}
        aria-expanded={openSection}
      >
        <span className="text-xl shrink-0" aria-hidden>{section.icon}</span>
        <span className="font-bold text-slate-900 flex-1">{section.title}</span>
        <span
          className="text-slate-400 text-sm shrink-0 transition-transform duration-200"
          style={{ display: 'inline-block', transform: openSection ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {openSection && (
        <div className="border-t border-slate-100">
          {section.items.map((item, i) => (
            <AccordionItem
              key={i}
              item={item}
              isOpen={openItems.has(i)}
              onToggle={() => toggleItem(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [search, setSearch] = useState('');

  const filteredSections = search.trim()
    ? SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter(
          (item) =>
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            (typeof item.a === 'string' && item.a.toLowerCase().includes(search.toLowerCase())),
        ),
      })).filter((s) => s.items.length > 0)
    : SECTIONS;

  return (
    <AppShell showNav>
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Help &amp; Documentation
          </h1>
          <p className="text-slate-500 text-sm">
            Everything you need to get value from Delivery Clarity. Click any section to expand it.
          </p>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="search"
            placeholder="Search help topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Quick-jump chips */}
        {!search && (
          <div className="flex flex-wrap gap-2 mb-6">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  const el = document.getElementById(`section-${s.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors"
              >
                <span aria-hidden>{s.icon}</span>
                {s.title.split(' — ')[0].replace(/^[^ ]+ /, '')}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {filteredSections.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-slate-600">No results for &ldquo;{search}&rdquo;</p>
            <p className="text-sm mt-1">Try a different keyword or clear the search box.</p>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3">
          {filteredSections.map((section) =>
            search.trim() ? (
              // When searching: render sections always expanded
              <div
                key={section.id}
                id={`section-${section.id}`}
                className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-xl" aria-hidden>{section.icon}</span>
                  <span className="font-bold text-slate-800">{section.title}</span>
                </div>
                <div>
                  {section.items.map((item, i) => (
                    <SearchResultItem key={i} item={item} query={search} />
                  ))}
                </div>
              </div>
            ) : (
              <div key={section.id} id={`section-${section.id}`}>
                <SectionAccordion section={section} />
              </div>
            )
          )}
        </div>

        {/* Footer credit */}
        <p className="text-center text-xs text-slate-400 mt-10 pb-4">
          Delivery Clarity v2 &nbsp;&middot;&nbsp; © 2025 Ali Abu Ras &nbsp;&middot;&nbsp; aburasali80@gmail.com
        </p>
      </div>
    </AppShell>
  );
}

// ─── Search result item (always expanded, highlights match) ──────────────────

function SearchResultItem({ item, query }: { item: Item; query: string }) {
  function highlight(text: string) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div className="border-t border-slate-100 first:border-0 px-5 py-4">
      <p className="font-semibold text-slate-800 text-sm mb-1">{highlight(item.q)}</p>
      {typeof item.a === 'string' ? (
        <p className="text-sm text-slate-600 leading-relaxed">{highlight(item.a)}</p>
      ) : (
        <div className="text-sm text-slate-600 leading-relaxed">{item.a}</div>
      )}
    </div>
  );
}
