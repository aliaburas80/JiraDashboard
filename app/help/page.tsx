// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';

import React, { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';

interface Item { q: string; a: string | React.ReactNode; }
interface Section { id: string; icon: string; title: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    id: 'welcome', icon: 'release', title: 'Welcome — Getting Started',
    items: [
      { q: 'Meet Delivery Clarity', a: 'Delivery Clarity is your Jira Delivery Intelligence board. Drop in any Jira export and immediately see sprint health, flow efficiency, risk signals, capacity, and epic readiness — all in one place, with no Jira login required.' },
      { q: 'Step 1 — Export from Jira', a: 'In Jira, open your board or backlog and choose Export → Excel or CSV. For the richest analysis, include at minimum these columns: Summary, Issue Key, Issue Type, Status, Priority, Assignee, Sprint, Story Points, Created, Updated, Resolved / Resolution Date, Labels, Epic Link / Epic Name, and Linked Issues. Export the full backlog — not just the active sprint — to enable quarter trends and epic analysis.' },
      { q: 'Step 2 — Upload your file', a: 'Drag your CSV or Excel file onto the upload screen, or click the drop zone to browse. The full dashboard appears within seconds. Supported formats: .csv, .xls, .xlsx up to 20 MB. No Jira login, no configuration, no manual setup required.' },
      { q: 'Step 3 — Read the dashboard top to bottom', a: 'The dashboard opens on the Delivery Summary section (default). Use the left sidebar to navigate between 15 sections — Overview group (Delivery Summary, Priority Attention, Key Metrics, Smart Actions, Data Quality), Delivery group (Visual Analytics, Delivery Composition, Delivery Controls, Quarter Statistics, Kanban Health, Sprint Status), and Deep Dive group (Ownership & Capacity, Labels & Types, Epic Readiness, Flow Health Table). The 52px topbar shows the product health pill and a New Upload button.' },
      { q: 'Step 4 — Use the sticky quick-filter bar', a: 'The quick-filter bar follows you as you scroll. Tap All, High Risk, Blocked, Needs Review, or Sprint Today to instantly narrow the flow table to matching work items. A blue badge in the filter bar shows how many filters are currently active.' },
      { q: 'Step 5 — Drill into the Flow Table', a: 'Open Story / Task Flow Health at the bottom of the dashboard. Apply any combination of the 11 available filters — key, status, sprint, assignee, health, labels, type, priority, epic, reason, or date range. Every matched item shows exactly why it is healthy or at risk, along with lead time, cycle time, and wait time.' },
      { q: 'Step 6 — Act on your results', a: 'Review high-risk items to identify the worst blockers, export a risk CSV for stakeholder reports, and save your layout view to remember filters for the next session. Use the ? buttons throughout the dashboard for section-specific explanations at any time.' },
    ],
  },
  {
    id: 'summary', icon: 'clipboard', title: 'Summary Page',
    items: [
      { q: 'Health banner', a: 'The banner at the top of the Summary page answers three questions in one row: is the project healthy, how far off target are we, and what changed since last time? Three states are possible — Healthy (zero warning or critical items), At Risk (1–3 items need attention), and Urgent Attention (4+ items carry warning or critical health signals and require escalation or re-planning).' },
      { q: 'KPI cards', a: 'Six cards sit directly below the health banner: Completion Rate, Open Alerts, Active Items, Avg Lead Time, Avg Cycle Time, and Story Points. Each card shows the current value, a trend arrow versus the previous period, and a colour signal (green = healthy, amber = watch, red = act).' },
      { q: 'Attention items', a: 'Attention items are issues that the engine has flagged as blockers, overdue, stale, or orphaned. Each item shows its key, title, assignee, days-active count, and the primary reason for the flag. Click any row to open the full detail panel.' },
      { q: 'Insights strip', a: 'Below the attention list is a plain-language insights strip. The engine writes one sentence per signal — for example "3 items have been in progress for more than 14 days" or "Sprint completion is 12 points below target." These mirror the Justification section on the main dashboard.' },
      { q: 'CTA buttons', a: 'Two call-to-action buttons sit at the bottom of the summary: View Full Dashboard (navigates to /dashboard) and Export Risk CSV (downloads a filtered CSV containing only the flagged items). A third button, Share Summary, copies a shareable URL to the clipboard.' },
    ],
  },
  {
    id: 'filters', icon: 'target', title: 'Quick Filters',
    items: [
      { q: 'All', a: 'Resets all active quick filters and shows the complete set of issues in the flow table. Any column filters or search terms you have applied independently are preserved.' },
      { q: 'High Risk', a: 'Shows items whose health classification is Critical. These are issues that are active for more than 14 days, have exceeded their cycle time threshold, carry a Blocked flag, have a passed due date, or are labelled High/Highest/Critical priority and remain open.' },
      { q: 'Blocked', a: 'Shows items where the Blocked field is true, the status name contains "blocked", or a linked issue of type "is blocked by" is present. These items need an explicit unblocking action before they can move forward.' },
      { q: 'Needs Review', a: 'Shows items whose status contains "review", "qa", "testing", or "validation". These are items that have finished development but are waiting for sign-off. A long queue here often signals a bottleneck in the review stage.' },
      { q: 'Sprint Today', a: "Shows items assigned to the sprint that is active on today's date. If your Jira export includes multiple sprints, this filter isolates only the current sprint's items so you can focus on today's delivery commitments." },
    ],
  },
  {
    id: 'attention', icon: 'warning', title: 'Attention Cards',
    items: [
      { q: 'Blockers', a: 'A blocker is any item where the Blocked field is true, the status name includes "blocked", or a "is blocked by" link points to an open issue. Attention cards for blockers show the blocking issue key, how long the item has been blocked, and the assignee responsible for resolving it.' },
      { q: 'Overdue items', a: 'An item is overdue when its Due Date field is set and the date has passed while the issue remains open (not Done, Closed, or Resolved). The attention card shows the number of calendar days past due and the original due date.' },
      { q: 'Orphan items', a: 'An orphan is an issue that has no sprint assignment and no epic link. Orphans are invisible to sprint planning and epic tracking, meaning they risk being forgotten indefinitely. The attention card lists each orphan with its creation date and assignee (if any) so you can triage and assign them quickly.' },
    ],
  },
  {
    id: 'kpi', icon: 'chartBar', title: 'KPI Cards',
    items: [
      { q: 'Completion Rate', a: 'Percentage of all issues in the export that have a status of Done, Closed, or Resolved. Calculated as: (done issues / total issues) × 100. This is the primary delivery health indicator and is weighted at 28% of the overall Delivery Health Score.' },
      { q: 'Open Alerts', a: 'Count of issues classified as Warning or Critical health. Warning items have been active 7–14 days or waited more than 30 days without being started. Critical items exceed 14 days active, are blocked, are overdue, or carry the highest priority and are still open.' },
      { q: 'Active Items', a: 'Count of issues currently In Progress, In Development, In Review, or in any status that indicates active work. This helps gauge team load and whether WIP (work-in-progress) limits are being respected.' },
      { q: 'Avg Lead Time', a: "Average number of calendar days from an issue's Created date to its Resolution date, measured only across completed issues. Lead Time includes backlog wait time. A high lead time relative to cycle time means items sit in the backlog before anyone starts them." },
      { q: 'Avg Cycle Time', a: 'Average number of calendar days from when an issue first moved to In Progress to when it reached Done. Cycle Time is the pure delivery measurement. If cycle time is rising sprint-over-sprint, it typically signals growing complexity or a bottleneck in the workflow.' },
      { q: 'Story Points', a: 'Total story points completed in the current period versus the total planned. If story point data is missing from the export, this card falls back to issue count. A large gap between planned and delivered points is the most important number to explain in a stakeholder report.' },
    ],
  },
  {
    id: 'charts', icon: 'chartTrendUp', title: 'Charts Page',
    items: [
      { q: 'Donut charts', a: 'Two donut charts appear at the top of the Charts page. The left donut shows the distribution of issues by Status (Done, In Progress, To Do, Blocked, etc.). The right donut shows the distribution by Health classification (Healthy, Warning, Critical). Hover over any segment to see the exact count and percentage.' },
      { q: 'Bar charts', a: 'Stacked bar charts show sprint-over-sprint progress, breaking each sprint into Done, In Progress, and Not Started segments. A separate bar chart shows story points planned versus delivered per sprint. These are the fastest way to spot a sprint that fell significantly short of its commitment.' },
      { q: 'Gantt / timeline chart', a: 'The timeline chart plots each epic as a horizontal bar spanning its earliest created date to its latest resolved (or estimated completion) date. Epics with no resolved date extend to today. Use this to spot overlapping epics, identify long-running efforts, and understand delivery sequencing.' },
    ],
  },
  {
    id: 'composition', icon: 'component', title: 'Delivery Composition',
    items: [
      { q: 'What the Delivery Composition panel shows', a: 'The Delivery Composition panel is a stacked horizontal bar showing what proportion of the current delivery period is in each state. It gives you an instant visual sense of how healthy the overall pipeline is — whether most work is done, in progress, or not yet started.' },
      { q: 'Segment colours', a: 'Done / Closed / Resolved: green. In Progress / In Development / In Review: blue. Blocked: red. To Do / Backlog / Open: grey. The exact colours follow the status category from Jira — the engine groups any status not matching "done" or "in progress" into the backlog segment.' },
      { q: 'Priority ordering', a: 'Within each state segment the items are ordered by priority. Done items appear first (left-most, green). Within the active segments, Critical items appear before High, then Medium, then Low, then No Priority. This ordering ensures the most impactful work is always visible first when the bar is narrow.' },
    ],
  },
  {
    id: 'controls', icon: 'settings', title: 'Delivery Controls',
    items: [
      { q: 'Flow Efficiency', a: 'Flow Efficiency = (active work time / total elapsed time) × 100. A score above 40% is generally considered healthy for software teams. Anything below 25% indicates items spend most of their life waiting — in queues, in review, or blocked — rather than being actively worked on.' },
      { q: 'Story Points panel', a: "The Story Points panel breaks down points into: Completed, In Progress, and Remaining. It also shows the sprint's velocity (points completed per sprint) and a burn-down projection. If the remaining points exceed the projected capacity before the sprint ends, the panel highlights this as a risk." },
      { q: 'Critical signals', a: 'Critical signals are binary indicators that appear in the delivery controls section: Blocked items present (yes/no), Overdue items present (yes/no), No-sprint orphans present (yes/no), and No-assignee items present (yes/no). Any active signal is highlighted in red and links directly to the matching filtered view in the flow table.' },
    ],
  },
  {
    id: 'quarters', icon: 'calendar', title: 'Quarters',
    items: [
      { q: 'Grouping logic', a: 'The Quarters page groups all issues by the quarter in which they were resolved (or created, if unresolved). Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec. Issues without a date fall into an "Undated" bucket. The grouping uses the fiscal year of the export data, not the calendar year of the upload.' },
      { q: 'Completion rate per quarter', a: 'For each quarter, the page shows the total issues, the number completed, and the completion rate as a percentage. A declining rate quarter-over-quarter is a leading indicator of accumulating technical debt or backlog growth outpacing delivery.' },
      { q: 'Timing signals', a: 'The Quarters page also highlights quarters where the average cycle time was above 14 days (shown in amber) or above 21 days (shown in red). This helps identify periods when the team was under particular stress or process friction was high.' },
    ],
  },
  {
    id: 'kanban', icon: 'folder', title: 'Kanban',
    items: [
      { q: 'Status distribution', a: 'The Kanban page maps every issue to its Jira status and groups them into standard Kanban columns: Backlog, To Do, In Progress, Review, Done, and Blocked. Each column shows the item count, total story points, and percentage of overall work. Items are sorted within each column by priority.' },
      { q: 'Health table', a: 'Below the column cards is a health table listing each issue with its status, health classification, days in current status, assignee, and priority. You can sort by any column. Red rows are Critical-health items; amber rows are Warning-health items.' },
      { q: 'Bottleneck detection', a: 'The engine flags a bottleneck when one column holds more than 30% of all in-flight (not Done) items. The bottleneck column is highlighted with an orange border and a warning label. Common bottlenecks surface in the Review column when QA capacity is insufficient, or in Blocked when upstream dependencies are unresolved.' },
    ],
  },
  {
    id: 'sprint', icon: 'priorityHigh', title: 'Sprint',
    items: [
      { q: 'Sprint comparison', a: 'The Sprint page shows all sprints present in the export side by side, sorted from oldest to newest. For each sprint you see: planned points, completed points, completion percentage, number of issues, number of blockers, and average cycle time. Tap any sprint header to expand the full issue list for that sprint.' },
      { q: 'Sprint status', a: 'Each sprint is tagged as Active, Closed, or Future based on the sprint state field in the Jira export. If your export does not include sprint state metadata, the engine infers status: a sprint whose start and end dates bracket today is Active; one whose end date is in the past is Closed; one whose start date is in the future is Future.' },
      { q: 'Missing sprint data', a: 'If the Sprint column is absent or empty for many items, the Sprint page will display a warning banner. Items without a sprint assignment are counted in the "Unassigned Sprint" row. To fix this in Jira, ensure you export from the Backlog view (not the Board view) and include the Sprint field in your column selection.' },
    ],
  },
  {
    id: 'ownership', icon: 'person', title: 'Ownership',
    items: [
      { q: 'Capacity view', a: 'The Ownership page lists every assignee in the export along with their current WIP (work-in-progress count), total assigned items, completed items, completion rate, average cycle time, and assigned story points. This gives team leads an instant capacity snapshot without needing a separate report.' },
      { q: 'Epic performance per owner', a: 'For each assignee, the page breaks down their items by epic. This makes it easy to see whether one person is carrying a disproportionate share of a high-risk epic, or whether a critical epic has no clear owner.' },
      { q: 'Orphan items', a: 'The Ownership page also shows a dedicated Unassigned Items section listing every issue where the Assignee field is blank. Unassigned items with Critical or Warning health are highlighted in red. These items are at highest risk of being forgotten because no individual is accountable for them.' },
    ],
  },
  {
    id: 'readiness', icon: 'flag', title: 'Readiness',
    items: [
      { q: 'At-risk epics', a: 'The Readiness page scores each epic on a 0–100 readiness scale based on: percentage of child issues completed (40%), absence of critical-health child issues (30%), absence of open blockers (20%), and presence of a due date (10%). Epics scoring below 50 are flagged as At Risk.' },
      { q: 'Dependencies', a: 'The Dependencies panel shows all "is blocked by", "depends on", and "relates to" link types across all issues. Issues with unresolved inbound dependencies are listed with the count of open blockers. This is the fastest way to identify a release that is being held up by another team or another epic.' },
      { q: 'Release signals', a: 'Release signals are Boolean indicators at the top of the Readiness page: All critical items resolved (yes/no), No open blockers (yes/no), All epics above 80% complete (yes/no), and No items past due date (yes/no). A green tick on all four signals indicates the release is ready to proceed.' },
    ],
  },
  {
    id: 'justification', icon: 'comment', title: 'Justification',
    items: [
      { q: 'What is Justification?', a: 'Justification is the plain-language insights panel. Instead of showing raw numbers, it narrates the most important signals from the current data as short sentences. Example outputs: "5 items have been in progress for more than 14 days — consider breaking them down or reassigning." or "Sprint velocity has dropped 30% from the previous sprint."' },
      { q: 'How insights are generated', a: 'Insights are generated server-side by comparing computed metric values against threshold rules. They are not AI-generated — they are deterministic logic that fires when a metric crosses a threshold. Each insight links to the relevant section of the dashboard so you can drill in immediately.' },
      { q: 'Using insights in stakeholder reports', a: 'The Justification panel is designed to be copy-paste ready for status reports. Each sentence is written in plain language without Jira jargon. You can copy the full panel text, paste it into an email or Confluence page, and it will read naturally to a non-technical stakeholder.' },
    ],
  },
  {
    id: 'flow', icon: 'search', title: 'Flow Table — Story & Task Flow Health',
    items: [
      { q: 'The 11 filters', a: 'The Flow Table supports 11 independent filters: (1) Issue Key search, (2) Status multi-select, (3) Sprint multi-select, (4) Assignee multi-select, (5) Health classification (Healthy / Warning / Critical), (6) Labels multi-select, (7) Issue Type multi-select, (8) Priority multi-select, (9) Epic multi-select, (10) Reason keyword search (searches the health reason field), (11) Date range (filters by created or resolved date). All filters are ANDed together.' },
      { q: 'Time metrics', a: 'For each issue the table shows three time columns: Lead Time (days from Created to Done), Cycle Time (days from first In Progress to Done), and Wait Time (Lead Time minus Cycle Time — the time spent waiting before work started). For in-progress items, these are calculated using today as the end date.' },
      { q: 'Health and reason columns', a: 'The Health column shows Healthy (green), Warning (amber), or Critical (red). The Reason column shows the plain-language explanation for the classification: e.g. "Active > 14 days", "Blocked flag set", "Due date passed 3 days ago", or "High priority and open > 7 days". Multiple reasons are comma-separated.' },
    ],
  },
  {
    id: 'labels', icon: 'tag', title: 'Labels & Classification',
    items: [
      { q: 'Label distribution', a: 'The Labels section shows a frequency chart of all labels present in the export. Labels are normalised to lowercase before counting so "bug" and "Bug" are treated as the same label. The top 20 labels are shown by default; tap "Show all" to see the full list.' },
      { q: 'Label health', a: 'For each label, the engine computes the health breakdown of all issues carrying that label: percentage Healthy, Warning, and Critical. Labels where more than 30% of issues are Critical are highlighted in red. This helps identify label-based workstreams (e.g. a "migration" label) that are in distress.' },
      { q: 'Types and projects', a: 'The Classification panel groups issues by Issue Type (Story, Task, Bug, Sub-task, Epic, Spike, etc.) and by Jira Project Key (the prefix before the hyphen in each issue key). For multi-project exports this makes it easy to see which project is contributing the most risk.' },
    ],
  },
  {
    id: 'relations', icon: 'link', title: 'Relations',
    items: [
      { q: 'Link types', a: 'Delivery Clarity recognises five Jira link types: "is blocked by" / "blocks", "depends on" / "is depended on by", "relates to", "duplicates" / "is duplicated by", and "is cloned by" / "clones". Each type is shown in the Relations panel with a count of open links of that type.' },
      { q: 'Most connected items', a: 'The Most Connected list ranks issues by total inbound + outbound link count. Highly connected items are often architectural or integration issues. If a highly connected item is also Critical health, it represents a systemic risk — one unresolved issue that is blocking many others.' },
      { q: "Blocked items via relations", a: "The Relations panel's Blocked via Link section lists every issue that has at least one open \"is blocked by\" link pointing to another open issue. For each blocked item it shows: the blocking issue key, blocking issue status, and the assignee of the blocking issue — so you know exactly who to contact." },
    ],
  },
  {
    id: 'export-guide', icon: 'upload', title: 'Jira Export Guide',
    items: [
      {
        q: 'Step-by-step export instructions',
        a: (
          <ol style={{ paddingLeft: 18, margin: 0, color: 'var(--dc-p2, #909090)', fontSize: 12, lineHeight: 1.8 }}>
            <li>In Jira, navigate to your project and open the <strong style={{ color: 'var(--dc-p1, #F2F2F2)', fontWeight: 700 }}>Backlog</strong> view (not the Board view).</li>
            <li>Click the three-dot menu (<strong style={{ color: 'var(--dc-p1, #F2F2F2)', fontWeight: 700 }}>…</strong>) in the top-right corner of the backlog.</li>
            <li>Choose <strong style={{ color: 'var(--dc-p1, #F2F2F2)', fontWeight: 700 }}>Export</strong> → <strong style={{ color: 'var(--dc-p1, #F2F2F2)', fontWeight: 700 }}>Export Excel XML</strong> (for .xls) or <strong style={{ color: 'var(--dc-p1, #F2F2F2)', fontWeight: 700 }}>Export to CSV (all fields)</strong>.</li>
            <li>If prompted to select columns, ensure the recommended columns below are included.</li>
            <li>Save the file to your computer. The file will be named something like <em style={{ color: 'var(--dc-p2, #909090)' }}>Jira.csv</em> or <em style={{ color: 'var(--dc-p2, #909090)' }}>Jira.xls</em>.</li>
            <li>Return to Delivery Clarity and drop the file on the upload screen.</li>
          </ol>
        ),
      },
      {
        q: 'Recommended columns to include',
        a: (
          <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--dc-p2, #909090)', fontSize: 12, lineHeight: 1.8, columns: 2 }}>
            <li>Summary</li><li>Issue Key</li><li>Issue Type</li><li>Status</li>
            <li>Priority</li><li>Assignee</li><li>Sprint</li><li>Story Points</li>
            <li>Created</li><li>Updated</li><li>Resolved</li><li>Due Date</li>
            <li>Labels</li><li>Epic Link</li><li>Epic Name</li><li>Linked Issues</li>
            <li>Description (optional)</li><li>Components (optional)</li>
          </ul>
        ),
      },
      { q: 'Tips for best results', a: 'Export the full backlog rather than a single sprint — this enables quarter trends and epic readiness analysis. If your export is very large (thousands of issues), consider filtering to a date range of 6–12 months to stay within the 20 MB limit. For multi-project reports, export each project separately and upload the one most relevant to the current delivery review.' },
    ],
  },
  {
    id: 'aliases', icon: 'text', title: 'Field Aliases',
    items: [
      { q: 'What are field aliases?', a: 'Jira exports use different column names depending on the Jira version, the export method, and any custom field configuration. Delivery Clarity maps a broad set of known aliases to the canonical field names it uses internally. This means you do not need to rename columns before uploading.' },
      {
        q: 'Supported alias mappings',
        a: (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--dc-s1, #141414)', borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--dc-p2, #909090)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Canonical field</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--dc-p2, #909090)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accepted aliases</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Key','Issue Key, Issue Id, Key, ID'],['Summary','Summary, Title, Subject'],
                  ['Issue Type','Issue Type, Type, IssueType, issuetype'],['Status','Status, State, Issue Status'],
                  ['Priority','Priority, Severity'],['Assignee','Assignee, Assigned To, Owner, Developer'],
                  ['Sprint','Sprint, Sprint Name, Sprint(s)'],['Story Points','Story Points, Story point estimate, Points, SP, Estimate, Original Estimate'],
                  ['Created','Created, Created Date, Create Date, Date Created'],['Updated','Updated, Last Updated, Updated Date, Modified'],
                  ['Resolved','Resolved, Resolution Date, Resolved Date, Completion Date, Done Date'],['Due Date','Due Date, Due, Target Date, Deadline'],
                  ['Labels','Labels, Label, Tags, Tag'],['Epic Link','Epic Link, Epic, Epic Name, Epic/Theme, Parent Epic'],
                  ['Linked Issues','Linked Issues, Links, Issue Links, Outward issue link'],['Blocked','Blocked, Is Blocked, Flagged, Impediment'],
                ].map(([canonical, aliases]) => (
                  <tr key={canonical} style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                    <td style={{ padding: '7px 12px', color: 'var(--dc-acc2, #FF8A4C)', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap', fontSize: 11 }}>{canonical}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--dc-p2, #909090)', fontSize: 11 }}>{aliases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      },
    ],
  },
  {
    id: 'api', icon: 'settings', title: 'API Routes',
    items: [
      {
        q: 'Available API endpoints',
        a: (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--dc-s1, #141414)', borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--dc-p2, #909090)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--dc-p2, #909090)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Route</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--dc-p2, #909090)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['POST','/api/upload','Upload a Jira CSV or Excel file and trigger import processing. Returns computed metrics, parse warnings, and an import log entry. Accepts multipart/form-data with a field named "file". Rate limited to 20 requests per 15 minutes per IP. Max file size 20 MB.'],
                  ['GET','/api/imports','Return the full import log — a JSON array of all past upload attempts including status, file name, row count, timestamp, and any validation errors.'],
                  ['GET','/api/metrics','Return computed KPI metrics derived from the most recent successful import. Returns 404 if no successful import exists.'],
                  ['GET','/api/dashboard','Return dashboard status and service metadata (version, service name, status: ok).'],
                  ['GET','/api/health','Health check endpoint — confirms the API service is running. Returns { status: "ok", service: "delivery-clarity-api", version: "2.0.0" }.'],
                  ['GET','/api/backend-view','JSON overview of import statistics (total, successful, failed), the 10 most recent import logs, and a list of all API endpoints.'],
                  ['GET','/api/developer-view','Developer wiki — architecture notes, service descriptions, and data-flow documentation for contributors.'],
                ].map(([method, route, desc]) => (
                  <tr key={route} style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: method === 'POST' ? '#16a34a' : '#2563eb' }}>{method}</span>
                    </td>
                    <td style={{ padding: '7px 12px', color: 'var(--dc-acc2, #FF8A4C)', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, whiteSpace: 'nowrap' }}>{route}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--dc-p2, #909090)', fontSize: 11, lineHeight: 1.6 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      },
      { q: 'Authentication', a: 'All API routes are unauthenticated in the current version. They are intended for same-origin use by the Next.js frontend. If you are deploying Delivery Clarity in a shared or production environment, add authentication middleware (e.g. NextAuth.js or a Vercel Edge Function with a secret header check) before exposing the API publicly.' },
    ],
  },
  {
    id: 'explorer-export', icon: 'download', title: 'Explorer Export',
    items: [
      { q: 'How do I export from the Work Item Explorer?', a: 'After exploring any issue key on the /explore page, an "↓ Export" dropdown button appears in the results header. Choose "Export to Excel (.xlsx)" for a 5-sheet workbook (Summary, All Issues, Risk Items, Orphans, Insights) or "Export to CSV (.csv)" for a flat table. The file is named explorer-{key}-{date}.' },
      { q: 'What is included in the Excel workbook?', a: 'Sheet 1 (Summary): focus issue key, delivery stats, confidence score, largest unfinished branch, and insights. Sheet 2 (All Issues): all connected nodes and orphans with health, risk-path, blocked, and role columns. Sheet 3 (Risk Items): only blocked, critical, or on-risk-path items. Sheet 4 (Orphans): orphan items only. Sheet 5 (Insights): generated insight text bullets.' },
      { q: 'Why is the Export button not showing?', a: 'The Export dropdown only appears after a graph has been loaded — enter an issue key and click "Explore Issue" first.' },
    ],
  },
  {
    id: 'teams', icon: 'people', title: 'Teams',
    items: [
      { q: 'What is the Teams page?', a: 'The /teams page shows a side-by-side health comparison for each team member (assignee) in your Jira data. It computes a Team Health Score (0–100) per person based on their completion rate, critical items, and blocked items.' },
      { q: 'How is the Team Health Score calculated?', a: 'Score = (done/total) × 50 + (1 − critical/total) × 30 + (1 − blocked/total) × 20, clamped 0–100. Bands: Healthy ≥ 70 / At Risk ≥ 40 / Critical < 40.' },
      { q: 'What do the four comparison charts show?', a: 'Health Score (ranked by score, colour-coded by band) · Completion % (ranked by completion) · Workload Share (load%, red > 35%, amber > 20%) · Blocked + Critical Items (ranked by total risk count).' },
      { q: 'The Teams page shows "No team data available"', a: 'This means no assignee data was found in the uploaded Jira export. Ensure your Jira export includes the Assignee column and has been uploaded from the home page.' },
    ],
  },
  {
    id: 'portfolio', icon: 'folder', title: 'Portfolio',
    items: [
      { q: 'What is the Portfolio page?', a: 'The /portfolio page aggregates all epics, projects, sprints, and quarters into a single Portfolio Score (0–100) and health view. It is designed for programme leads and directors who need a cross-team delivery snapshot.' },
      { q: 'How is the Portfolio Score calculated?', a: 'Score = epic completion × 40% + project completion × 30% + sprint performance × 20% + data quality × 10%, weighted by issue count. Bands: Excellent ≥ 85 / Good ≥ 70 / Moderate ≥ 55 / At Risk ≥ 35 / Critical < 35.' },
      { q: 'What does the Epic Progress panel show?', a: 'A scrollable list of all epics with health dots (green/amber/red), completion bars, percentage, issue counts, and critical/warning counts. Sorted by the order they appear in your Jira data.' },
      { q: 'What do the Quarter Throughput bars show?', a: 'Bar height represents total issues per quarter. Bar colour represents completion rate: green ≥ 70%, amber 40–69%, red < 40%. Bars are capped to the last 8 quarters. "No date" quarters are excluded.' },
    ],
  },
  {
    id: 'release-confidence', icon: 'chartTrendDown', title: 'Release Confidence Trend',
    items: [
      { q: 'What is the Release Confidence Score?', a: 'A 0–100 score computed on every upload that specifically measures release readiness — not just general health. It weights completion (55 pts), absence of blockers (25 pts), absence of critical items (12 pts), and absence of open defects (8 pts).' },
      { q: 'Where do I see the Release Confidence Trend?', a: 'On the /trends page (requires 2+ uploads while logged in): a purple "Release Confidence" chart, a stat card in the summary row, and a "Rel. Confidence" column in the upload log table — colour-coded green ≥ 80%, amber ≥ 60%, red < 60%.' },
      { q: 'Why does the Release Confidence column show "—" for some uploads?', a: 'Uploads made before this feature was added (v4.1) do not have a stored score. Only uploads from v4.1 onwards will show a value.' },
    ],
  },
  {
    id: 'filter-bar', icon: 'search', title: 'Filter Bar',
    items: [
      { q: 'What do the filter tabs at the top of the dashboard do?', a: 'The filter bar has four quick-filter tabs: All (show everything), High Risk (critical and warning items), Blocked (items with blocked flag), Needs Review (items needing attention). The active tab shows a coloured underline — blue for All, red for High Risk, orange for Blocked, purple for Needs Review.' },
      { q: 'What does the red dot on "High Risk" mean?', a: 'A red dot badge on the High Risk tab means there are currently blocked or critical items in your data. It disappears when no high-risk items exist.' },
      { q: 'What do Clear, Show filters, Copy link, and Save snapshot do?', a: '"Clear" resets all active filters to show all items. "Show filters" opens the advanced filter panel for detailed filtering (status, assignee, sprint, health, etc.). "Copy link" copies a shareable URL with your current filter state. "Save snapshot" saves the current dashboard metrics as a named point-in-time report.' },
    ],
  },
  {
    id: 'cloud-sync', icon: 'refresh', title: 'Cloud Sync & Data Source',
    items: [
      {
        q: 'Where does my data come from — and how do I know?',
        a: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <p style={{ color: 'var(--dc-p2, #909090)', margin: 0 }}>Every page shows a <strong style={{ color: 'var(--dc-p1, #F2F2F2)', fontWeight: 700 }}>data source badge</strong> in the top navigation bar indicating where the current data came from:</p>
            <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li style={{ color: 'var(--dc-p2, #909090)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#FF8A4C' }}><SvgIcon name="cloud" size={12} /> S3</span> — loaded or cached from Amazon S3</li>
              <li style={{ color: 'var(--dc-p2, #909090)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#60a5fa' }}><SvgIcon name="cloud" size={12} /> Azure</span> — loaded or cached from Azure Blob Storage</li>
              <li style={{ color: 'var(--dc-p2, #909090)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#4ade80' }}><SvgIcon name="globe" size={12} /> GCP</span> — loaded or cached from Google Cloud Storage</li>
              <li style={{ color: 'var(--dc-p2, #909090)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--dc-p2, #909090)' }}><SvgIcon name="save" size={12} /> Local cache</span> — cloud provider is set but data served from local cache (no re-fetch needed)</li>
              <li style={{ color: 'var(--dc-p2, #909090)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#c084fc' }}><SvgIcon name="upload" size={12} /> Jira upload</span> — data came from a fresh Jira CSV upload in this browser session</li>
              <li style={{ color: 'var(--dc-p2, #909090)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#fcd34d' }}><SvgIcon name="warning" size={12} /> localStorage fallback</span> — bucket/server metrics were unavailable; data came from this browser&apos;s saved fallback copy</li>
            </ul>
            <p style={{ color: 'var(--dc-p2, #909090)', margin: 0, marginTop: 4 }}>When data is actively loading from the cloud, a blue <strong style={{ color: 'var(--dc-p1, #F2F2F2)', fontWeight: 700 }}>loading banner</strong> appears at the top of the page: <em>&ldquo;Loading data from Amazon S3…&rdquo;</em></p>
          </div>
        ),
      },
      { q: 'How does the cloud sync work? Will it re-download from S3 every time?', a: 'No — the app uses a cache-first strategy. On startup it checks whether the local cache is already current by comparing a content hash. If the hash matches the latest cloud backup, no download happens. You only get a real download when the cloud has a newer version than your local cache.' },
      { q: 'What happens if the cloud is unreachable?', a: 'The app first tries the bucket-backed server copy through /api/metrics/latest. If that is unavailable, it falls back to the browser localStorage copy and shows a "localStorage fallback" warning badge. Local server changes waiting to be pushed are protected: startup sync will not overwrite them with an older bucket backup.' },
      { q: 'What happens when I upload a new Jira file?', a: "After every successful Jira CSV upload, the app writes the latest dashboard metrics to data/latest-metrics.json, stores a browser fallback copy, and immediately pushes a fresh backup to your configured cloud bucket (non-blocking — it doesn't slow down your upload). The data source badge updates to \"Jira upload\"." },
      { q: 'What happens when I switch from S3 to Azure (or any other provider)?', a: 'The app downloads the latest backup from your current cloud provider first, then pushes it to the new provider — so no data is lost during a provider switch. Both providers end up with the same version. After the switch, all new backups go to the new provider.' },
      { q: 'What if I switch to Local storage from the Cloud Storage settings?', a: 'When you select "Local Storage" in Admin Settings → Cloud Storage, the app downloads the latest backup from your cloud bucket first (so you have it locally), then switches to local-only mode. From that point, backups are saved to data/cloud-backups/ on the server instead of the cloud.' },
      { q: 'Are all cloud backups the same version? How do I avoid having outdated copies?', a: 'Yes — the sync strategy ensures all copies are always at the same version. Push-on-change: every data modification immediately pushes to cloud. If the push fails (network issue), the change is marked as pending and retried on next startup or sync. You can also manually trigger a sync from Admin Settings → Cloud Storage → Sync button.' },
      { q: 'How do I manually check or trigger a sync?', a: 'Go to Admin Settings → Cloud Storage tab. The "Disaster Recovery / Auto-restore" section shows the current sync status (last fetched, last pushed, pending push indicator). Use the "Auto-restore (if empty DB)" or "Force restore (overwrite)" buttons to manually pull from cloud.' },
    ],
  },
  {
    id: 'cloud-storage', icon: 'cloud', title: 'Cloud Storage',
    items: [
      { q: 'What is the Cloud Storage feature?', a: 'The Cloud Storage tab in /admin/settings allows admins to configure a cloud provider (AWS S3, Azure Blob, or Google Cloud Storage) to receive automatic backup files. Backups include the SQLite database, config files, import logs, and data/latest-metrics.json so the dashboard can load from the bucket-backed server copy on the next session.' },
      { q: 'Which providers are supported?', a: 'Four options: (1) Local — saves to data/cloud-backups/ on the server, no credentials needed. (2) AWS S3 — also compatible with MinIO, Backblaze B2, Cloudflare R2. (3) Azure Blob Storage. (4) Google Cloud Storage. Each requires its SDK: @aws-sdk/client-s3, @azure/storage-blob, @google-cloud/storage.' },
      { q: 'How do I configure a cloud provider?', a: 'Go to /admin/settings → Cloud Storage tab → select a provider → fill in credentials → click "Save settings" → click "Test connection" → if successful, click "Upload backup now" to push the first backup.' },
      { q: 'Are credentials stored securely?', a: 'Credentials are stored in data/storage-settings.json on the server and are never sent to the browser. API responses show only whether credentials are present (not their values). The saved connection remains available across login, logout, session expiry, and refresh; it changes only when an admin saves a different provider/settings.' },
      { q: 'Where are profile images stored?', a: 'When Amazon S3 is the active cloud provider, profile images uploaded from /profile are stored in the S3 folder images/profile/. The app serves them back through an authenticated /api/profile/image URL, so the bucket does not need to be public.' },
    ],
  },
  {
    id: 'diagnostics', icon: 'statusInfo', title: 'System Diagnostics',
    items: [
      { q: 'What is the System Diagnostics page?', a: 'The /admin/diagnostics page (admin-only) shows a live system health snapshot including: an Ops Health Score (0–100), database row counts (users, sessions, imports, snapshots), import success rate and average health score, environment variable checks, system info (Node version, uptime), and the last 8 audit events.' },
      { q: 'How is the Ops Health Score calculated?', a: 'Score starts at 100 and loses points for: missing SESSION_SECRET (−30), non-production NODE_ENV (−10), open registration enabled (−10), failed imports (−1 each, max −10), and zero active sessions when users exist (−5). Score is clamped to 0–100.' },
      { q: 'What do the environment checks show?', a: 'Five checks with pass/fail indicators: SESSION_SECRET set (≥32 chars), NODE_ENV=production, DATABASE_URL configured, ALLOW_OPEN_REGISTRATION=false (registration locked), and NEXT_PUBLIC_APP_URL set. Values are never shown — only presence/validity is checked.' },
      { q: 'How do I access the System Diagnostics page?', a: 'Navigate to Data → Diagnostics in the nav menu, or go directly to /admin/diagnostics. Requires admin role — regular users are redirected to the dashboard.' },
    ],
  },
  {
    id: 'about', icon: 'home', title: 'About / Feature Overview',
    items: [
      { q: 'What is the About (Landing) page?', a: 'The /landing page is an in-app product showcase. It shows all 12 major features with clickable cards (each linking directly to that feature), a "How it works" section, key product stats, and a branded CTA footer. Access it via Reference → About in the nav, or click "See all 12 features →" on the upload page.' },
      { q: 'Which features are shown on the landing page?', a: 'Sprint Throughput, Work Item Explorer, Upload-to-Upload Trends, Team Health, Portfolio Summary, Release Readiness, Visual Analytics, Customer View, Smart Export Suite, Dashboard Snapshots, Data Quality Score, and Admin Diagnostics.' },
    ],
  },
  {
    id: 'branding', icon: 'palette', title: 'Branding',
    items: [
      { q: 'Why do the login and register pages show a logo instead of text?', a: 'The login and register pages now display the Delivery Clarity horizontal logo SVG instead of plain text, for consistent visual branding across all user-facing pages.' },
      { q: 'Does the product have a favicon?', a: 'Yes — the browser tab shows a Delivery Clarity lightning bolt favicon (SVG + ICO fallback). On iOS/Android home screens, the 128×128 PNG icon is used as the apple-touch-icon.' },
      { q: 'What branding appears in exported reports?', a: 'HTML reports and Executive PDF files include the lightning bolt brand mark in the header alongside the report title. Footers show "Delivery Clarity v4.1 · Ali Abu Ras · aliaburas80@gmail.com". Excel workbooks include the product name, slogan, and author in the Executive Summary sheet.' },
    ],
  },
  {
    id: 'deployment', icon: 'release', title: 'Deployment',
    items: [
      { q: 'What is the recommended way to deploy Delivery Clarity?', a: 'Docker is the recommended deployment method for production. Clone the repo, copy .env.example to .env, set SESSION_SECRET (openssl rand -hex 32) and ADMIN_PASSWORD, then run: docker compose up -d --build. The app will be available on port 3000. Full instructions are in product/DEPLOYMENT_GUIDE.md and the Developer Portal → Deployment Guide.' },
      { q: 'Can I deploy on Vercel?', a: "Vercel works for demos and previews but is NOT recommended for production. Vercel's serverless functions have no persistent filesystem, so SQLite data, data/latest-metrics.json, cache metadata, user accounts, import logs, and sessions are lost between cold starts. The CSV-upload → dashboard flow can still work when browser localStorage fallback is available." },
      { q: 'How do I deploy on a VPS without Docker?', a: 'Install Node.js 20 and PM2. Clone the repo, copy .env.example to .env.local, set the required environment variables. Run: npm ci → npx prisma generate → npx prisma migrate deploy → npm run build → pm2 start npm --name "delivery-clarity" -- start. Then run pm2 save and pm2 startup to enable autostart.' },
      { q: 'File uploads fail with a 413 error', a: 'This is an nginx upload size limit. Add client_max_body_size 25M; inside the server {} block of your nginx site config. Jira CSV/XLSX exports can exceed the nginx default of 1 MB.' },
      { q: 'How do I set up HTTPS?', a: "Use Certbot with Let's Encrypt: sudo apt install certbot python3-certbot-nginx → sudo certbot --nginx -d your-domain.com. Certbot updates the nginx config and sets up auto-renewal. Full instructions are in product/DEPLOYMENT_GUIDE.md §8." },
      { q: 'What environment variables are required?', a: 'Required: SESSION_SECRET (≥ 32 chars, use: openssl rand -hex 32), DATABASE_URL (SQLite file path), ADMIN_EMAIL, ADMIN_PASSWORD. Optional: SESSION_TTL_HOURS (default 8), ALLOW_OPEN_REGISTRATION / NEXT_PUBLIC_ALLOW_REGISTER (default false), PORT (default 3000).' },
    ],
  },
  {
    id: 'chart-customization', icon: 'chartBar', title: 'Chart Customization',
    items: [
      { q: 'Where is the chart customizer?', a: 'Click the "Customise" button in the top-right of the Visual Analytics (/charts) page header. A blue dot appears when your settings differ from the defaults.' },
      { q: 'What can I customise per chart?', a: 'Three things per chart: (1) Visibility — toggle the chart on or off. (2) Column width — 1/3 (narrow), 2/3 (medium), or Full (full width). (3) Order — use ▲▼ buttons to move charts up or down in the panel.' },
      { q: 'Where are chart preferences saved?', a: 'Saved to dc_chart_prefs in your browser localStorage. Applied automatically on every page load.' },
    ],
  },
  {
    id: 'layout-builder', icon: 'menu', title: 'Layout Builder',
    items: [
      { q: 'Where is the Layout Builder?', a: 'Click the "Layout" button (☰) on the right side of the section switcher bar at the top of the Dashboard (/dashboard). A blue dot appears on the button when your layout differs from the default.' },
      { q: 'What can I customise in the Layout Builder?', a: 'Two things: (1) Section order — use the ▲ and ▼ arrow buttons to move any of the 14 dashboard sections up or down. This changes their order in the section switcher tabs. (2) Section visibility — toggle each section on or off. Hidden sections disappear from both the switcher and the dashboard body.' },
      { q: 'Where is my layout saved?', a: "Layout preferences are saved to your browser's localStorage (dc_section_layout). They persist across page reloads and are specific to your browser." },
      { q: 'How do I reset to the default layout?', a: 'Click "Reset" inside the Layout Builder panel. This restores all 14 sections in the original default order, all visible.' },
    ],
  },
  {
    id: 'theme-customization', icon: 'palette', title: 'Theme Customization',
    items: [
      { q: 'Where is the theme customizer?', a: 'Click the palette icon in the top-right of the header, next to the dark/light mode toggle. The panel opens inline.' },
      { q: 'What can I customise?', a: 'Three settings: (1) Accent colour — 7 presets (Blue, Purple, Teal, Orange, Indigo, Rose, Slate) that change all primary action buttons and focus elements. (2) Corner radius — Sharp (4px), Default (12px), or Rounded (18px). (3) Text size — Small (13px), Medium (14px), or Large (16px).' },
      { q: 'Where are my theme settings saved?', a: 'Settings are saved to your browser localStorage (dc_theme_custom) and applied automatically on every page load. They are browser-specific — other users keep their own settings.' },
      { q: 'How do I reset to the default theme?', a: 'Click "Reset" in the theme customizer panel. This restores Blue accent, Default radius, and Medium font size.' },
    ],
  },
  {
    id: 'product-tour', icon: 'target', title: 'Product Tour',
    items: [
      { q: 'How do I start the guided tour?', a: 'Two ways: (1) On the Overview (/summary) page, click the "Take a tour" button in the CTA row — it navigates to the dashboard and starts the tour automatically. (2) On the Dashboard (/dashboard), click the small "Tour" info button in the top-right of the header card.' },
      { q: 'What does the tour cover?', a: '8 steps: Welcome → Section Switcher (tab navigation) → Health Score & Key Metrics → Priority Attention (blockers/overdue) → Smart Recommendations (action cards) → Sprint Throughput → Work Item Explorer (opens /explore) → Done.' },
      { q: 'How do I navigate the tour?', a: 'Click "Next →" and "← Back" buttons, or use arrow keys (→ Next, ← Back). Press Esc or click "Skip tour" at any time to exit.' },
      { q: 'How do I replay the tour after completing it?', a: 'Click the "Tour" button on the dashboard at any time — it always restarts from Step 1. Or run resetTour() in the browser console to fully clear the completed state.' },
    ],
  },
  {
    id: 'export-sheets', icon: 'clipboard', title: 'Export Sheets Reference',
    items: [
      {
        q: 'What sheets are included in the main Excel export (17 sheets)?',
        a: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            <p style={{ fontWeight: 700, color: 'var(--dc-p1, #F2F2F2)', margin: '0 0 6px' }}>Main workbook — triggered from the Export button or Overview page:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                ['01 Executive Summary','Health score, completion rate, velocity, top 5 recommendations, executive narrative'],
                ['02 Project Health','9 health metrics with scores and interpretation'],
                ['03 Team Performance','Per-assignee: issues, done, active, blocked, load %, SP, bug count'],
                ['04 Sprint Throughput','Per-sprint: committed vs completed, carryover, scope changes, goal outcome'],
                ['05 Mid-Sprint Delivery','Mid-sprint delivery patterns (healthy, end-loaded, blocked, scope instability)'],
                ['06 Kanban Flow','Kanban periods: throughput, cycle time, lead time, flow efficiency, aging WIP'],
                ['07 Risks and Blockers','All blocked, critical, overdue, and orphan items with reasons'],
                ['08 Orphan & Data Quality','Orphan items + data quality score, field breakdown, missing-field impact'],
                ['09 Assignee Workload','Per-assignee capacity: issues, story points, load share %'],
                ['10 Story Points Analysis','SP distribution, completion %, velocity, breakdown by type'],
                ['11 Cycle & Lead Time','P50/P75/P85/P95 percentiles for cycle and lead time'],
                ['12 Throughput Trends','Sprint-over-sprint delivery trend with direction indicator'],
                ['13 Recommendations','All smart recommendations: priority, evidence, suggested owner, action'],
                ['14 Release Readiness','Per-version Go/No-Go verdict, checklist, completion %'],
                ['15 Dependencies','Issue dependency links and blocked-by relationships'],
                ['16 Metric Dictionary','Formula for every metric in the workbook — the "how it\'s calculated" reference'],
                ['17 Raw Data Reference','Complete issue-level data export with all fields'],
              ].map(([sheet, desc]) => (
                <div key={sheet} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--dc-p2, #909090)', flexShrink: 0, width: 176, fontSize: 10 }}>{sheet}</span>
                  <span style={{ color: 'var(--dc-p3, #505050)', fontSize: 10 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        q: 'What sheets are in the Work Item Explorer Excel export (5 sheets)?',
        a: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            <p style={{ fontWeight: 700, color: 'var(--dc-p1, #F2F2F2)', margin: '0 0 6px' }}>Explorer workbook — triggered from the Export button on /explore after a graph is loaded:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                ['01 Summary','Focus key, delivery stats, confidence score, largest unfinished branch, insights'],
                ['02 All Issues','All connected nodes + orphans with 17 columns: key, summary, type, status, health, blocked, risk-path, role'],
                ['03 Risk Items','Filtered to blocked, critical, or on-risk-path items only'],
                ['04 Orphans','Orphan items only (no epic or parent link)'],
                ['05 Insights','Generated insight bullets for the explored issue'],
              ].map(([sheet, desc]) => (
                <div key={sheet} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--dc-p2, #909090)', flexShrink: 0, width: 112, fontSize: 10 }}>{sheet}</span>
                  <span style={{ color: 'var(--dc-p3, #505050)', fontSize: 10 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      { q: 'What does the Executive PDF export contain?', a: 'A single A4 landscape page (downloaded as .html, printed as PDF from the browser) with: health score circle + band label, 6 KPI cards (completion, total issues, done, active, blocked, story points), top 5 epic progress bars, top 4 team capacity bars, key insights, and top 3 recommendations with priority dots.' },
      { q: 'What does the HTML report export contain?', a: 'A self-contained HTML file with: header (health score + band), key metrics grid, delivery composition donut, health mix donut, issue types donut, story points donut, team capacity bars, epic/sprint progress, status distribution, label distribution, and flow metrics. Fully printable with @media print styles.' },
    ],
  },
  {
    id: 'rec-owners', icon: 'person', title: 'Recommendation Owners',
    items: [
      { q: 'How do I assign an owner to a recommendation?', a: 'On the dashboard Smart Recommendations section, each card shows a "+ Assign" button with the suggested owner role as a hint (e.g., "+ Assign (Scrum Master / Delivery Manager)"). Click it to open an inline input, type the owner name, then press Enter or click Save.' },
      { q: 'Where is the owner assignment saved?', a: 'Owner assignments are saved to your browser localStorage (dc_rec_owners key). They persist across page reloads but are specific to your browser. They are not synced to the server or visible to other users.' },
      { q: 'Can I change or remove an owner?', a: 'Yes — the blue owner badge shows Edit and ✕ buttons. Click Edit to update the name, or ✕ to clear the assignment entirely.' },
    ],
  },
  {
    id: 'executive-pdf', icon: 'file', title: 'Executive PDF',
    items: [
      { q: 'What is the Executive PDF export?', a: 'The "Executive PDF" button on the Overview (/summary) page generates a print-optimised single-page HTML file designed to fit on one A4 landscape page. It contains: health score, 6 KPI cards, top 5 epic progress bars, top 4 team capacity bars, insights, and the top 3 recommendations.' },
      { q: 'How do I save it as a PDF?', a: 'After clicking "Executive PDF", a file named executive-summary-{date}.html downloads. Open it in your browser, then press Ctrl+P (Windows) or Cmd+P (Mac) → change destination to "Save as PDF" → Print. The layout is optimised to fit one page in landscape orientation.' },
      { q: 'Why is it downloaded as .html instead of .pdf?', a: 'No external PDF library is needed — your browser already contains a high-quality PDF rendering engine. Downloading as .html and printing to PDF produces a better, smaller file than any JavaScript PDF library could generate.' },
    ],
  },
  {
    id: 'member-requests', icon: 'person', title: 'Member Requests & Email',
    items: [
      { q: 'How do I request a new user to be added to the platform?', a: "Go to /members and click \"Request add member\" (visible to non-admin users). Fill in the new user's full name, email, requested role, and a business reason. Submit the form — the request is sent to the admin queue. You will receive an in-app notification when the admin accepts or rejects it." },
      { q: 'How does the admin accept a member request?', a: 'Go to Admin Settings → Member Requests tab. Expand the pending card. Click "Generate" to auto-fill a secure 14-character temporary password (or type one manually). Click Accept. The new user account is created, the requester receives an in-app notification, and a welcome email is sent to the new user automatically.' },
      { q: 'What is the "Generate" button in the accept panel?', a: 'The Generate button auto-fills the temporary password field with a cryptographically secure 14-character password. It meets all complexity rules: at least 2 uppercase letters, 2 digits, and 2 special characters. You can click it multiple times to get a different password. The Accept button activates as soon as a valid password is present.' },
      { q: 'Does the new user receive an email with their credentials?', a: "Yes — when an admin accepts a request, a welcome email is automatically sent to the new user's email address. The email contains their login email, temporary password, and a \"Log In Now\" link. The admin panel shows a green \"Welcome email sent\" badge on success, or an amber warning badge if SMTP is not configured." },
      { q: 'What does the new user need to do after receiving the welcome email?', a: 'The new user clicks the "Log In Now" link in the email, enters their email and temporary password, and is redirected to /change-password. They must set a new permanent password before accessing the dashboard. After changing it, they land on the dashboard — fully onboarded.' },
      { q: 'Why did I receive a notification when my request was accepted?', a: 'In-app notifications are sent automatically on both accept and reject. An accepted notification includes the new user\'s email and role. Click the notification to navigate directly to /members (as the requester) or to Admin Settings → Member Requests (as an admin).' },
      { q: 'Do notifications navigate me somewhere when I click them?', a: 'Yes. Clicking a navigable notification (one with a → arrow) marks it as read, closes the dropdown, and routes you to the relevant page. Accepted/rejected request notifications take non-admin users to /members and admin users to Admin Settings → Member Requests.' },
    ],
  },
  {
    id: 'roadmap', icon: 'roadmap', title: 'Roadmap',
    items: [
      { q: 'What does the Roadmap page show?', a: 'The Roadmap page (/roadmap) shows every epic from your uploaded Jira data as a card with a progress bar, health indicator, delivery forecast label, and confidence badge. It is accessible from the Planning dropdown in the header.' },
      { q: 'How are delivery forecasts calculated?', a: 'Forecasts use linear velocity extrapolation: remaining issues ÷ average throughput (items completed per sprint) = sprints remaining. Weeks = ceil(sprints × 2), assuming 2-week sprints. Labels are: Complete, Within 2 weeks, ~N weeks, ~N months, or Insufficient data.' },
      { q: 'What is forecast confidence?', a: 'Confidence reflects how reliable the estimate is based on remaining work: High = less than 2 sprints remaining; Medium = 2–5 sprints; Low = 5 or more sprints, or no sprint data available.' },
      { q: 'Why do some epics show "Insufficient data"?', a: 'If no sprint history is available in your upload (no Sprint column or no completed sprints), average throughput is 0 and no forecast can be calculated. Upload a Jira export that includes sprint data to enable forecasts.' },
      { q: 'Can I filter or sort epics?', a: 'Yes. Use the filter tabs to show: In Progress, All, Critical, or Done epics. Use the sort control to order by Forecast (soonest first), Progress (most complete first), or Name.' },
    ],
  },
  {
    id: 'forecast', icon: 'eye', title: 'Forecast',
    items: [
      { q: 'What does the Forecast page show?', a: 'The Forecast page (/forecast) shows your overall delivery status (On Track / At Risk / Off Track / Complete / Insufficient Data), a burn-up chart of actual vs forecast vs target, a KPI row, a next-quarter capacity plan, risk signals, and actionable recommendations.' },
      { q: 'What do the forecast statuses mean?', a: 'Complete = all issues done. On Track = 6 or fewer sprints remaining at current velocity. At Risk = 7–12 sprints remaining. Off Track = more than 12 sprints remaining. Insufficient Data = no sprint throughput history available.' },
      { q: 'What is the burn-up chart?', a: 'The chart shows three lines: a solid blue line for actual cumulative completed issues per sprint, a dashed blue line extending the forecast forward, and a grey dashed target line showing where you need to be to complete all work.' },
      { q: 'What is the Next Quarter Plan?', a: 'It shows how many issues you can realistically complete in 6 sprints at your current throughput, compared to how many remain. If the achievable count is less than remaining, the plan flags that the quarter target is not achievable at current velocity.' },
    ],
  },

  // 27. Admin — System Errors
  {
    id: 'system-errors',
    icon: '🛡️',
    title: 'Admin — System Errors',
    items: [
      {
        q: 'What is the System Errors page?',
        a: 'The /admin/system-errors page (admin-only) records every database failure the app encounters — for example, when a write fails because a referenced user was deleted. Each entry shows a red "What failed" panel explaining the error and a green/blue "How it was handled" panel showing what the system did. You can retry failed operations or dismiss them.',
      },
      {
        q: 'What do the resolution states mean?',
        a: 'logged — recorded but not yet resolved; needs your attention. auto-fixed — the system retried automatically with a safe fallback (e.g. null userId) and succeeded. retried — you manually retried the operation from this page. resolved — marked as resolved by an admin. skipped — the operation was intentionally skipped to prevent a cascade of errors.',
      },
      {
        q: 'What is a "ghost session"?',
        a: 'When an admin deletes a user account, that user\'s login cookie remains valid for up to 8 hours. If the deleted user tries to perform an action during that window, the server detects the missing account and returns a "Your account no longer exists" message instead of a database error. This prevents corrupted data from being written.',
      },
      {
        q: 'What does "Foreign key constraint failed" (P2003) mean?',
        a: 'A Prisma P2003 error means a write referenced a parent record that no longer exists — most commonly a deleted user account. The system automatically retries audit events with a null user ID so the record is never lost, and logs the incident as "auto-fixed".',
      },
      {
        q: 'Can I retry a failed operation?',
        a: 'Yes. Click "Retry operation" on any unresolved error entry. The system will re-run the original database operation using the stored payload. The result is shown immediately and the retry count is incremented. If the retry fails again, a new error entry is created.',
      },
      {
        q: 'How do I use bulk user operations?',
        a: 'In /admin/settings → Users, check the box in the table header to select all users (your own row is always excluded). Or check individual rows. Once you have a selection, a blue action bar appears with two options: "Delete selected" (confirmation dialog required) and "Change role to…" (apply a new role to all selected users at once).',
      },
    ],
  },

  {
    id: 'retro', icon: 'refresh', title: 'Retrospective',
    items: [
      { q: 'What does the Retrospective page do?', a: 'The Retro page (/retro) is a sprint retrospective tool. You can fill out a retrospective directly in the app, download a CSV template to fill offline, or upload a completed file (coming soon). On submit, the app generates improvement suggestions based on your inputs.' },
      { q: 'How do I run a retrospective in the app?', a: 'Click "Fill in App" on the Retro landing page. Fill in: Sprint Name (required), Team Name, Retro Date, Sprint Goal, Sprint Goal Met (yes/partial/no), What Went Well entries, What Did Not Go Well entries, Blockers, and Action Items (each with owner, due date, and priority). Click "Submit & Get Suggestions" when done.' },
      { q: 'What suggestions does the app generate?', a: 'The app evaluates your inputs and flags: sprint goal not met or only partially met, unresolved blockers, high-priority action items, action items missing an owner, action items missing a due date, and zero action items recorded. Each finding becomes an actionable suggestion.' },
      { q: 'How do I download the retro template?', a: 'Click "Download CSV →" on the Download Template card on the Retro landing page. The file Retrospective_Template.csv downloads to your browser with all supported columns and two example rows.' },
    ],
  },
  {
    id: 'troubleshooting', icon: 'tools', title: 'Troubleshooting',
    items: [
      { q: '"No file uploaded" or upload button does nothing', a: 'Check that your browser allows file access (some corporate security tools block file dialogs). Ensure the file is a .csv, .xls, or .xlsx — PDF and Word exports are not supported. Check that the file is under 20 MB. If you are on a slow connection, wait for the progress indicator to complete before navigating away.' },
      { q: '"Unsupported file type" error', a: 'Delivery Clarity only accepts .csv, .xls, and .xlsx files exported directly from Jira. Do not upload Jira XML exports, JSON exports, PDF reports, or Word documents. If your Jira instance exports as .xlsm (macro-enabled Excel), save a copy as .xlsx before uploading.' },
      { q: '"Validation failed" error with details', a: 'This means the file was parsed successfully but failed data validation — for example, zero issues were found, or every row had an empty Status column. Check the error details shown on screen. Common fixes: (1) Ensure you exported from the Backlog view, not the Roadmap or Timeline view. (2) Ensure you exported "all fields" not just a subset. (3) Verify the file is not empty or password-protected.' },
      { q: 'Dashboard shows no sprint data', a: 'The Sprint column is missing or all values are empty. In Jira, this happens when you export from the Board view (which does not include sprint metadata). Fix: re-export from the Backlog view and include the Sprint field. Alternatively, if your team does not use Jira Sprints, ignore the Sprint sections — the rest of the dashboard will work with the columns available.' },
      { q: 'Story points are all zero or missing', a: 'Story Points is a custom field in Jira and its column name varies by instance. Common names include "Story Points", "Story point estimate", "SP", "Points", and "Estimate". If none of these are present in your export, Delivery Clarity falls back to issue count for all point-based metrics. To fix, add the custom story points field to your Jira export column configuration.' },
      { q: 'All items show as Healthy when I expect warnings', a: 'Health classification requires date fields. If Created, Updated, or Resolved dates are missing from the export, the engine cannot calculate active duration or cycle time and defaults to Healthy. Check that your export includes the Created and Updated columns. Also verify that the dates are in a standard format (ISO 8601 or common locale formats — MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD).' },
      { q: 'The page loads but shows "No successful import found"', a: 'The dashboard could not find bucket-backed latest metrics and could not find a browser localStorage fallback. Navigate to the Upload page (/), drop your Jira export, and wait for the success message. That creates data/latest-metrics.json on the server and a browser fallback copy.' },
      { q: 'Rate limit error (429 Too Many Requests)', a: 'The upload endpoint allows 20 uploads per 15 minutes per IP address. If you hit this limit, wait 15 minutes before trying again. This limit prevents accidental runaway upload loops. If you are a developer testing the app locally and need to lift the limit, see the RATE_MAX and RATE_WINDOW_MS constants in /app/api/upload/route.ts.' },
    ],
  },
];

const SECTION_GROUPS: { id: string; label: string; icon: string; sectionIds: string[] }[] = [
  { id: 'start',    label: 'Getting Started', icon: 'release', sectionIds: ['welcome'] },
  { id: 'dash',     label: 'Dashboard',       icon: 'chartBar', sectionIds: ['summary','filters','attention','kpi','charts','composition','controls'] },
  { id: 'planning', label: 'Planning',        icon: 'calendar', sectionIds: ['quarters','kanban','sprint','ownership','readiness'] },
  { id: 'analysis', label: 'Analysis',        icon: 'search', sectionIds: ['justification','flow','labels','relations','teams','portfolio','release-confidence','filter-bar'] },
  { id: 'export',   label: 'Export & Data',   icon: 'upload', sectionIds: ['export-guide','aliases','api','explorer-export','export-sheets','executive-pdf'] },
  { id: 'system',   label: 'System',          icon: 'cloud', sectionIds: ['cloud-sync','cloud-storage','diagnostics','deployment','about','branding'] },
  { id: 'ux',       label: 'Customization',   icon: 'palette', sectionIds: ['chart-customization','layout-builder','theme-customization','product-tour'] },
  { id: 'delivery', label: 'Delivery Intel',  icon: 'roadmap', sectionIds: ['roadmap','forecast','retro'] },
  { id: 'people',   label: 'People',          icon: 'people', sectionIds: ['member-requests','rec-owners'] },
  { id: 'support',  label: 'Troubleshooting', icon: 'tools', sectionIds: ['troubleshooting'] },
];

const HERO_CARDS = [
  { icon: 'release', title: 'Get Started',      desc: 'Upload your Jira data and navigate the dashboard.',      groupIds: ['start', 'dash'],                     color: '#3B82F6' },
  { icon: 'calendar', title: 'Plan & Deliver',   desc: 'Sprint planning, roadmap, forecast, and retro.',         groupIds: ['planning', 'delivery'],              color: '#8B5CF6' },
  { icon: 'search', title: 'Analyze & Teams', desc: 'Flow analysis, labels, relations, and people.',          groupIds: ['analysis', 'people'],                color: '#10B981' },
  { icon: 'upload', title: 'Data & Export',    desc: 'Export formats, cloud, customization, and system.',      groupIds: ['export', 'system', 'ux', 'support'],  color: '#F59E0B' },
];

// ── AccordionItem ──────────────────────────────────────────────────────────────
function AccordionItem({ item, isOpen, onToggle, query }: {
  item: Item; isOpen: boolean; onToggle: () => void; query?: string;
}) {
  const [hovered, setHovered] = useState(false);

  function highlight(text: string) {
    if (!query) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(232,93,18,0.3)', color: 'var(--dc-p1, #F2F2F2)', borderRadius: 2, padding: '0 2px' }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div style={{ borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
      <button
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 10, padding: '5px 8px', margin: '2px 0',
          background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: 'none', cursor: 'pointer', transition: 'background 120ms', textAlign: 'left',
          borderRadius: 6,
        }}
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: isOpen ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p2, #909090)', lineHeight: 1.5, flex: 1 }}>
          {highlight(item.q)}
        </span>
        <span style={{
          color: isOpen ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p2, #909090)',
          fontSize: 10, flexShrink: 0, marginTop: 2,
          display: 'inline-block',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms',
        }} aria-hidden>▾</span>
      </button>
      {isOpen && (
        <div style={{ padding: '4px 8px 12px 8px' }}>
          {typeof item.a === 'string' ? (
            <p style={{ fontSize: 13, color: 'var(--dc-p2, #909090)', lineHeight: 1.75, margin: 0 }}>
              {highlight(item.a)}
            </p>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--dc-p2, #909090)', lineHeight: 1.75 }}>{item.a}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SectionCard ────────────────────────────────────────────────────────────────
function SectionCard({ section, expandedItem, onToggleItem, forceOpen = false, query }: {
  section: Section; expandedItem: string | null;
  onToggleItem: (key: string) => void; forceOpen?: boolean; query?: string;
}) {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;

  const containerStyle = isOpen ? {
    background: 'rgba(232,93,18,0.03)',
    border: '1px solid rgba(232,93,18,0.14)',
    borderLeft: '2px solid var(--dc-acc2, #FF8A4C)',
    borderRadius: '0 9px 9px 0' as const,
    overflow: 'hidden' as const,
  } : {
    background: 'var(--dc-s2, #1E1E1E)',
    border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
    borderRadius: 9,
    overflow: 'hidden' as const,
  };

  return (
    <div style={containerStyle}>
      <button
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms',
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--dc-s3, #282828)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        onClick={() => setOpen(v => !v)}
        aria-expanded={isOpen}
      >
        <SvgIcon name={section.icon} size={18} style={{ color: isOpen ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p2, #909090)' }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: isOpen ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p1, #F2F2F2)' }}>{section.title}</span>
        <span style={{ fontSize: 10, color: 'var(--dc-p2, #909090)', flexShrink: 0, marginRight: 6 }}>
          {section.items.length} {section.items.length === 1 ? 'topic' : 'topics'}
        </span>
        <span style={{
          color: isOpen ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p2, #909090)',
          fontSize: 10, flexShrink: 0,
          display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms',
        }} aria-hidden>▾</span>
      </button>
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', padding: '4px 8px 8px' }}>
          {section.items.map((item, i) => {
            const key = `${section.id}-${i}`;
            return (
              <AccordionItem
                key={key} item={item}
                isOpen={expandedItem === key}
                onToggle={() => onToggleItem(key)}
                query={query}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HelpPage() {
  const [search, setSearch]               = useState('');
  const [activeGroupId, setActiveGroupId] = useState('all');
  const [expandedItem, setExpandedItem]   = useState<string | null>(null);

  function toggleItem(key: string) { setExpandedItem(prev => (prev === key ? null : key)); }

  const totalTopics = SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const isSearching = search.trim().length > 0;

  const visibleSections = useMemo(() => {
    let secs = SECTIONS;
    if (activeGroupId !== 'all') {
      const g = SECTION_GROUPS.find(g => g.id === activeGroupId);
      if (g) secs = secs.filter(s => g.sectionIds.includes(s.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      secs = secs
        .map(s => ({ ...s, items: s.items.filter(item => item.q.toLowerCase().includes(q) || (typeof item.a === 'string' && item.a.toLowerCase().includes(q))) }))
        .filter(s => s.items.length > 0);
    }
    return secs;
  }, [search, activeGroupId]);

  return (
    <AppShell showNav>
      <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 48 }}>

        {/* Hero */}
        <div style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 16, padding: '28px 28px 24px', marginBottom: 24 }}>
          <span className="chip c-acc" style={{ borderRadius: 100, fontSize: 9, letterSpacing: '0.08em', display: 'inline-flex' }}>HELP &amp; DOCS</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--dc-p1, #F2F2F2)', letterSpacing: -0.5, margin: '8px 0 6px' }}>
            Help &amp; Documentation
          </h1>
          <p style={{ fontSize: 13, color: 'var(--dc-p2, #909090)', margin: '0 0 20px', lineHeight: 1.6 }}>
            Everything you need to get value from Delivery Clarity.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Topics',   value: String(totalTopics) },
              { label: 'Sections', value: String(SECTIONS.length) },
              { label: 'Groups',   value: String(SECTION_GROUPS.length) },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--dc-s1, #141414)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, padding: '10px 18px', textAlign: 'center', minWidth: 72 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--dc-acc2, #FF8A4C)', lineHeight: 1, fontFamily: 'var(--font-mono, monospace)' }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: 'var(--dc-p3, #505050)', marginTop: 3 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <SvgIcon name="search" size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--dc-p3, #505050)', pointerEvents: 'none' }} />
          <input
            type="search"
            placeholder="Search help topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 40px', fontSize: 13, color: 'var(--dc-p1, #F2F2F2)', background: 'var(--dc-s2, #1E1E1E)', border: '1.5px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 12, outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(232,93,18,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,93,18,0.12)'; }}
            onBlur={e  => { e.target.style.borderColor = 'var(--dc-bdr, rgba(255,255,255,0.07))'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* 4 Hero Entry Cards */}
        {!isSearching && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
            {HERO_CARDS.map(card => {
              const isActive = card.groupIds.includes(activeGroupId);
              const pills = card.groupIds
                .flatMap(gid => {
                  const g = SECTION_GROUPS.find(g => g.id === gid);
                  return g ? g.sectionIds.slice(0, 2).map(sid => SECTIONS.find(s => s.id === sid)?.title.split(' — ')[0]).filter((t): t is string => Boolean(t)) : [];
                })
                .slice(0, 4);
              return (
                <button
                  key={card.title}
                  onClick={() => setActiveGroupId(card.groupIds[0])}
                  style={{
                    background: isActive ? 'var(--dc-s3, #282828)' : 'var(--dc-s2, #1E1E1E)',
                    border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
                    borderTop: '2px solid var(--dc-acc, #E85D12)',
                    borderRadius: 10, padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
                    transition: 'all 150ms',
                    boxShadow: isActive ? '0 0 0 1px rgba(232,93,18,0.18)' : 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--dc-s3, #282828)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'var(--dc-s3, #282828)' : 'var(--dc-s2, #1E1E1E)'; }}
                >
                  <SvgIcon name={card.icon} size={22} style={{ color: 'var(--dc-acc2, #FF8A4C)', marginBottom: 6 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dc-p1, #F2F2F2)', marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--dc-p2, #909090)', marginBottom: 10, lineHeight: 1.5 }}>{card.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {pills.map(t => (
                      <span
                        key={t}
                        className="chip c-nt"
                        style={{ borderRadius: 999, cursor: 'default', transition: 'all 120ms' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,93,18,0.12)'; e.currentTarget.style.color = 'var(--dc-acc2, #FF8A4C)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}
                      >{t}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Group Filter Pills */}
        {!isSearching && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {[{ id: 'all', label: 'All topics', icon: 'book' }, ...SECTION_GROUPS].map(g => {
              const isActive = activeGroupId === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  className={isActive ? 'chip c-acc' : 'chip c-nt'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 12px', borderRadius: 100, cursor: 'pointer',
                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                    border: isActive ? 'none' : '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
                    transition: 'all 150ms',
                  }}
                >
                  <SvgIcon name={g.icon} size={11} />
                  {g.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Sections */}
        {visibleSections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--dc-p3, #505050)' }}>
            <SvgIcon name="search" size={40} style={{ margin: '0 auto 12px', color: 'var(--dc-p3, #505050)' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dc-p2, #909090)', marginBottom: 4 }}>No results for &ldquo;{search}&rdquo;</div>
            <div style={{ fontSize: 13 }}>Try a different keyword or clear the search box.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleSections.map(section => (
              <SectionCard
                key={section.id} section={section}
                expandedItem={expandedItem} onToggleItem={toggleItem}
                forceOpen={isSearching} query={isSearching ? search : undefined}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--dc-acc, #E85D12)', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            ↑ Back to Top
          </button>
          <p style={{ fontSize: 11, color: 'var(--dc-p3, #505050)', marginTop: 14 }}>
            Delivery Clarity v4.6 · © 2026 Ali Abu Ras · aliaburas80@gmail.com
          </p>
        </div>
      </div>
    </AppShell>
  );
}
