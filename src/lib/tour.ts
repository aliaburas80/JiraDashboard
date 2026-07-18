// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Product tour content — one short, self-contained tour per page, keyed by
// pathname. Manually triggered only (PageTourButton, mounted once in
// app/layout.tsx) — no auto-start, no cross-page navigation. Each page's
// tour describes only what's actually on that page.

export interface TourStep {
  id:          string;
  title:       string;
  description: string;
  targetId?:   string;   // DOM element id to highlight (optional — omit for a centered, non-targeted step)
  placement?:  'top' | 'bottom' | 'left' | 'right' | 'center';
}

// Keyed by exact pathname (matches the routes in DC_NAV_GROUPS /
// getAdminNavSections, plus /profile which is linked from the user menu but
// isn't in the nav registry). A page with no entry here simply gets no
// "Page tour" button — PageTourButton renders nothing for it.
// Shared second step for every /dashboard/* page — same real anchor
// (the small health block near the top of the sidebar, not the full-height
// <aside>, so the popover's above/below-only positioning never lands
// off-screen against a near-full-viewport-height target).
const DASHBOARD_SIDEBAR_STEP: TourStep = {
  id:          'sidebar-nav',
  title:       'Jump to Any Section',
  description: 'Use this sidebar to jump directly to any dashboard section — Priority Attention, Sprint Status, Ownership, and more.',
  targetId:    'dashboard-nav-sidebar',
  placement:   'bottom',
};

export const PAGE_TOURS: Record<string, TourStep[]> = {
  '/summary': [
    {
      id:          'header',
      title:       'Delivery Summary',
      description: 'Your live delivery health overview — completion rate, active issue count, and the top signals across the current dataset.',
      targetId:    'tour-header-summary',
      placement:   'bottom',
    },
    {
      id:          'kpi-grid',
      title:       'Key Metrics At a Glance',
      description: 'Health score, completion rate, active issues, and other headline KPIs for the current upload — the fastest way to see where things stand.',
      targetId:    'tour-kpi-grid',
      placement:   'bottom',
    },
    {
      id:          'alert-strip',
      title:       'Delivery Alert Strip',
      description: 'Chips flagging blocked, overdue, and orphan item counts — shown only when at least one of those risks exists.',
      targetId:    'tour-section-summary-1',
      placement:   'bottom',
    },
    {
      id:          'actions-preview',
      title:       'Smart Actions Preview',
      description: 'Up to 3 top recommendations drawn from blockers, capacity imbalance, orphans, and at-risk epics.',
      targetId:    'tour-section-summary-2',
      placement:   'top',
    },
  ],

  '/dashboard/priority-attention': [
    {
      id:          'header',
      title:       'Priority Attention',
      description: 'Your top blockers, overdue items, and orphan issues — ranked by impact — plus recommended actions. The first place to look before a standup.',
      targetId:    'tour-header-priority-attention',
      placement:   'bottom',
    },
    {
      id:          'summary-row',
      title:       'Attention Summary Row',
      description: 'A four-card strip showing live counts of Blockers, Overdue, Orphans, and Critical flow items.',
      targetId:    'tour-section-priority-attention-1',
      placement:   'bottom',
    },
    {
      id:          'smart-actions',
      title:       'Smart Actions',
      description: 'Recommendation cards generated from the same data — e.g. unblocking critical items or rebalancing capacity — each with a severity badge and a suggested owner.',
      targetId:    'tour-section-priority-attention-actions',
      placement:   'bottom',
    },
    {
      id:          'blockers-table',
      title:       'Blockers Table',
      description: "The Blockers table listing each blocked item's key, summary, status, and health badge.",
      targetId:    'tour-section-priority-attention-2',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/key-metrics': [
    {
      id:          'header',
      title:       'Key Metrics',
      description: 'Delivery KPIs — lead time, cycle time, throughput, and predictability — summarized across a set of KPI cards.',
      targetId:    'tour-header-key-metrics',
      placement:   'bottom',
    },
    {
      id:          'story-points',
      title:       'Story Points Breakdown',
      description: 'Total Points, Completed points, and the point-based Completion Rate for the loaded dataset.',
      targetId:    'tour-section-key-metrics-1',
      placement:   'bottom',
    },
    {
      id:          'flow-metrics',
      title:       'Flow Metrics Grid',
      description: 'Four stat cards for Average Lead Time, Average Cycle Time, Critical Items, and Warning Items.',
      targetId:    'tour-section-key-metrics-2',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/data-quality': [
    {
      id:          'header',
      title:       'Data Quality & Composition',
      description: 'Field confidence scores, the impact of missing data on your metrics, and guidance for fixing it.',
      targetId:    'tour-header-dashboard-data-quality',
      placement:   'bottom',
    },
    {
      id:          'score-block',
      title:       'Data Quality Score',
      description: 'A circular score gauge plus a reliability label and per-severity issue-count badges for the loaded file.',
      targetId:    'tour-section-dashboard-data-quality-1',
      placement:   'bottom',
    },
    {
      id:          'missing-column-issue',
      title:       'Missing Column Impact',
      description: 'A list of fields with missing data, each showing severity, how many items are affected, and the impact on your metrics.',
      targetId:    'tour-section-dashboard-data-quality-2',
      placement:   'top',
    },
    {
      id:          'composition-ring',
      title:       'Delivery Composition',
      description: 'A donut chart of Done, In Progress, At Risk, Critical, and Backlog work, with totals, orphan count, and story points alongside it.',
      targetId:    'tour-section-dashboard-data-quality-3',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/trends': [
    {
      id:          'header',
      title:       'Trends',
      description: 'Sprint velocity and quarter-over-quarter delivery trends, one page with a toggle between the two views.',
      targetId:    'tour-header-trends',
      placement:   'bottom',
    },
    {
      id:          'toggle',
      title:       'Sprints / Quarters Toggle',
      description: 'Switch between the sprint-level view (stat tiles, velocity, per-sprint completion history) and the quarter-level view (throughput chart and breakdown table).',
      targetId:    'tour-section-trends-content',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/ownership': [
    {
      id:          'header',
      title:       'Ownership & Capacity',
      description: 'How work is distributed across the team — load per assignee. See Epic Readiness for epic-level ownership.',
      targetId:    'tour-header-ownership',
      placement:   'bottom',
    },
    {
      id:          'capacity-chart',
      title:       'Capacity by Assignee',
      description: 'A horizontal bar chart ranking each assignee by issue count and load share, flagging anyone above 35% load.',
      targetId:    'tour-section-ownership-1',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/labels': [
    {
      id:          'header',
      title:       'Labels & Types',
      description: 'How work is labeled and classified — label distribution and issue type breakdown across the project.',
      targetId:    'tour-header-labels',
      placement:   'bottom',
    },
    {
      id:          'label-badges',
      title:       'Label Summary Badges',
      description: 'The total number of unique labels and how many issues are unlabeled, above the label distribution chart.',
      targetId:    'tour-section-labels-1',
      placement:   'bottom',
    },
    {
      id:          'label-table',
      title:       'Label Health & Completion Table',
      description: 'Per-label issue count, done count, a completion-percentage bar, critical/warning counts, story points, and average lead/cycle time.',
      targetId:    'tour-section-labels-2',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/epic-readiness': [
    {
      id:          'header',
      title:       'Epic Readiness',
      description: 'Which epics are ready to ship, which are at risk, and the dependencies behind them.',
      targetId:    'tour-header-epic-readiness',
      placement:   'bottom',
    },
    {
      id:          'summary-kpis',
      title:       'Epic Summary KPIs',
      description: 'Four stat tiles — Total Epics, On Track, At Risk, and Critical — summarizing epic readiness across the dataset.',
      targetId:    'tour-section-epic-readiness-1',
      placement:   'bottom',
    },
    {
      id:          'epics-table',
      title:       'All Epics Table',
      description: 'Every tracked epic with issue/done counts, average lead/cycle time, critical/warning counts, a progress bar, and a risk label.',
      targetId:    'tour-section-epic-readiness-2',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/flow-health': [
    {
      id:          'header',
      title:       'Flow Health Table',
      description: 'A filterable, exportable table of every item in this delivery — the detailed view behind the summary metrics.',
      targetId:    'tour-header-dashboard-flow-health',
      placement:   'bottom',
    },
    {
      id:          'filter-toolbar',
      title:       'Filter Action Toolbar',
      description: 'Reset filters and Export CSV buttons, plus a live count of how many items match the current filters out of the total.',
      targetId:    'tour-section-dashboard-flow-health-1',
      placement:   'bottom',
    },
    {
      id:          'items-table',
      title:       'Flow Items Table',
      description: 'Key, summary, type, status, sprint, epic/parent, assignee, lead/cycle/age days, health badge, and reason, per item.',
      targetId:    'tour-section-dashboard-flow-health-2',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/coaching': [
    {
      id:          'header',
      title:       'Team Role View',
      description: 'Every visitor sees the same grid — one column per role, each showing only the rules, actions, and measures relevant to that role. No tabs, no picking your own role first.',
      targetId:    'tour-header-coaching',
      placement:   'bottom',
    },
    {
      id:          'role-grid',
      title:       'Role Columns',
      description: 'One column per role — Scrum Master, Product Owner, Manager — each with rules to monitor, current actions, and key measures at a glance.',
      targetId:    'tour-section-coaching-grid',
      placement:   'top',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],

  '/admin/audit': [
    {
      id:          'header',
      title:       'Audit Events',
      description: 'A real-time log of activity across the app — every meaningful action, who did it, and when, for investigating what happened.',
      targetId:    'tour-header-admin-audit',
      placement:   'bottom',
    },
    {
      id:          'activity-charts',
      title:       'Daily Activity Charts',
      description: 'A 30-day bar chart of daily audit event counts, alongside a donut chart breaking events down by type.',
      targetId:    'tour-section-admin-audit-1',
      placement:   'bottom',
    },
    {
      id:          'event-filters',
      title:       'Event Log Filters',
      description: 'Filter the event table below by event type and date range.',
      targetId:    'tour-section-admin-audit-2',
      placement:   'top',
    },
  ],
  '/admin/logs': [
    {
      id:          'header',
      title:       'Import Logs',
      description: 'Every Jira import across all users — when it ran, what changed, and whether it succeeded.',
      targetId:    'tour-header-admin-logs',
      placement:   'bottom',
    },
    {
      id:          'log-table',
      title:       'Import Log Table',
      description: 'Every import across all users, showing uploader, filename, file type, issue count, health score, status, and upload time.',
      targetId:    'tour-section-admin-logs-1',
      placement:   'bottom',
    },
  ],
  '/admin/feedback': [
    {
      id:          'header',
      title:       'User Feedback',
      description: 'User-submitted suggestions, bugs, and questions — triage and track them here.',
      targetId:    'tour-header-admin-feedback',
      placement:   'bottom',
    },
    {
      id:          'status-tabs',
      title:       'Status Filter Tabs',
      description: 'Filter the feedback list by status — New, Reviewing, Accepted, Planned, In Progress, Released, Rejected — each with a live count.',
      targetId:    'tour-section-admin-feedback-1',
      placement:   'bottom',
    },
    {
      id:          'feedback-table',
      title:       'Feedback Table',
      description: 'Category, message, impact level, page, contact email, an editable status dropdown, and submission date for each entry.',
      targetId:    'tour-section-admin-feedback-2',
      placement:   'top',
    },
  ],
  '/admin/system-errors': [
    {
      id:          'header',
      title:       'System Errors',
      description: 'Database errors and failed operations, with the ability to retry or dismiss each one.',
      targetId:    'tour-header-admin-system-errors',
      placement:   'bottom',
    },
    {
      id:          'diagnosis-panel',
      title:       'Error Diagnosis Panel',
      description: 'A human-readable title and explanation for each logged error, plus the raw error message.',
      targetId:    'tour-section-admin-system-errors-1',
      placement:   'bottom',
    },
    {
      id:          'resolution-panel',
      title:       'Resolution Status Panel',
      description: 'How each error was handled — logged, auto-fixed, retried, or resolved — with retry history and Retry/Dismiss actions.',
      targetId:    'tour-section-admin-system-errors-2',
      placement:   'top',
    },
  ],
  '/admin/diagnostics': [
    {
      id:          'header',
      title:       'System Diagnostics',
      description: 'A live snapshot of overall system health, refreshed on demand.',
      targetId:    'tour-header-admin-diagnostics',
      placement:   'bottom',
    },
    {
      id:          'health-banner',
      title:       'Operational Health Banner',
      description: 'The overall Ops Score out of 100 with a health band, plus total users, active sessions, imports, and audit event counts.',
      targetId:    'tour-section-admin-diagnostics-1',
      placement:   'bottom',
    },
    {
      id:          'environment-checks',
      title:       'Environment Checks',
      description: 'Pass/fail status for required server configuration, plus Node.js version, platform, and process uptime.',
      targetId:    'tour-section-admin-diagnostics-2',
      placement:   'top',
    },
  ],
  '/admin/security': [
    {
      id:          'header',
      title:       'Security Checklist',
      description: 'An automated and manual security checklist for production readiness.',
      targetId:    'tour-header-admin-security',
      placement:   'bottom',
    },
    {
      id:          'score-banner',
      title:       'Security Score Banner',
      description: 'The overall security score out of 100, production-readiness status, and counts of passing, failing, warning, and manual-review checks.',
      targetId:    'tour-section-admin-security-1',
      placement:   'bottom',
    },
    {
      id:          'check-filters',
      title:       'Security Check Filters',
      description: 'Filter the checklist below by category and status, with a live count of matching checks.',
      targetId:    'tour-section-admin-security-2',
      placement:   'top',
    },
  ],
  '/admin/users': [
    {
      id:          'header',
      title:       'User Management',
      description: 'Manage every account in the system — roles, access, and account status.',
      targetId:    'tour-header-admin-users',
      placement:   'bottom',
    },
    {
      id:          'search-filters',
      title:       'Search & Role Filters',
      description: 'Search and filter the user list by name, email, or role, with a live count of matching users.',
      targetId:    'tour-section-admin-users-1',
      placement:   'bottom',
    },
    {
      id:          'user-table',
      title:       'User Table',
      description: 'User, Role, Status, Imports, Last Login, and Actions columns, with a select-all checkbox for bulk operations.',
      targetId:    'tour-section-admin-users-2',
      placement:   'top',
    },
  ],
  '/admin/settings': [
    {
      id:          'header',
      title:       'Settings',
      description: 'System-wide configuration — cloud storage, security policy, and other settings that apply to everyone. Use the sidebar to switch between categories.',
      targetId:    'tour-header-admin-settings',
      placement:   'bottom',
    },
    {
      id:          'settings-panel',
      title:       'Settings Panel',
      description: 'Displays whichever settings category is currently selected — User Requests, Jira Connections, App Config, Data Retention, Health Thresholds, Orphan Rules, Issue Types, Backup & Restore, Cloud Storage, Browser Data, or Persona Preview.',
      targetId:    'tour-section-admin-settings-1',
      placement:   'top',
    },
  ],
  '/admin/theme': [
    {
      id:          'header',
      title:       'Branding',
      description: 'Customize the app name, logo, and favicon shown across the app — changes apply instantly for everyone.',
      targetId:    'tour-header-admin-theme',
      placement:   'bottom',
    },
    {
      id:          'app-name-field',
      title:       'App Name Field',
      description: 'Set the application name shown in the navigation bar and page title — takes effect after clicking Save changes.',
      targetId:    'tour-section-admin-theme-1',
      placement:   'bottom',
    },
    {
      id:          'logo-upload',
      title:       'Navigation Logo Upload',
      description: "Replace the navigation logo shown in the app's top bar, with a live preview and remove option.",
      targetId:    'tour-section-admin-theme-2',
      placement:   'top',
    },
  ],

  '/charts': [
    {
      id:          'header',
      title:       'Visual Analytics',
      description: 'Charts and diagrams — tabbed Charts and Circles views — summarizing delivery health, flow, team, and progress, with a KPI strip up top.',
      targetId:    'tour-header-charts',
      placement:   'bottom',
    },
    {
      id:          'view-tabs',
      title:       'Chart View Tabs',
      description: 'Toggle between animated bar/line Bar Charts and donut-style Circles visualizations.',
      targetId:    'tour-section-charts-1',
      placement:   'bottom',
    },
    {
      id:          'velocity-legend',
      title:       'Sprint Velocity Legend',
      description: 'Bars are colored green for sprints ≥80% complete, amber for ≥60%, and red below that.',
      targetId:    'tour-section-charts-2',
      placement:   'top',
    },
  ],
  '/trends': [
    {
      id:          'header',
      title:       'Upload-to-Upload Trends',
      description: 'Compares your metrics across multiple Jira export uploads over time — needs at least two uploads to show a trend.',
      targetId:    'tour-header-trends',
      placement:   'bottom',
    },
    {
      id:          'comparison-stats',
      title:       'Upload Comparison Stats',
      description: 'Compares Health Score, Completion, Blocked Items, Avg Lead Time, and Release Confidence between the first and most recent uploads.',
      targetId:    'tour-section-trends-1',
      placement:   'bottom',
    },
    {
      id:          'upload-log',
      title:       'Upload Log Table',
      description: 'Every recorded upload with its date, file name, and full metric snapshot, newest first.',
      targetId:    'tour-section-trends-2',
      placement:   'top',
    },
  ],
  '/teams': [
    {
      id:          'header',
      title:       'Team Health Comparison',
      description: 'Side-by-side health scorecards, workload, and risk signals for each team member, plus comparison charts and a detail table.',
      targetId:    'tour-header-teams',
      placement:   'bottom',
    },
    {
      id:          'scorecards',
      title:       'Member Scorecards',
      description: 'Per-member cards showing health score, completion %, and issue/blocked/critical counts.',
      targetId:    'tour-section-teams-1',
      placement:   'bottom',
    },
    {
      id:          'comparison-charts',
      title:       'Comparison Charts',
      description: 'Four charts ranking team members side by side on Health Score, Completion %, Workload Share, and Blocked + Critical Items.',
      targetId:    'tour-section-teams-2',
      placement:   'top',
    },
  ],
  '/portfolio': [
    {
      id:          'header',
      title:       'Portfolio Overview',
      description: 'A cross-team health summary — every epic, project, sprint, and quarter rolled into one portfolio score, with supporting KPIs and insights.',
      targetId:    'tour-header-portfolio',
      placement:   'bottom',
    },
    {
      id:          'epic-progress',
      title:       'Epic Progress Panel',
      description: 'Every epic with a health badge and an animated completion-percentage bar.',
      targetId:    'tour-section-portfolio-1',
      placement:   'bottom',
    },
    {
      id:          'quarterly-throughput',
      title:       'Quarterly Throughput',
      description: 'Total vs. completed issues per quarter, charted over time.',
      targetId:    'tour-section-portfolio-2',
      placement:   'top',
    },
  ],
  '/release-readiness': [
    {
      id:          'header',
      title:       'Release Readiness',
      description: 'A Go / Conditional Go / No-Go decision framework that checks your data against 7 release quality gates.',
      targetId:    'tour-header-release-readiness',
      placement:   'bottom',
    },
    {
      id:          'how-it-works',
      title:       'How This Works',
      description: 'A plain-English explainer defining what Pass, Warning, and Failed mean for each check below.',
      targetId:    'tour-section-release-readiness-1',
      placement:   'bottom',
    },
    {
      id:          'verdict-counts',
      title:       'Pass / Warning / Failed Counts',
      description: 'A summary tally of results across all 7 release-readiness checks.',
      targetId:    'tour-section-release-readiness-2',
      placement:   'top',
    },
  ],
  '/flow-health': [
    {
      id:          'header',
      title:       'Flow Health',
      description: 'Blockers, aging work-in-progress, and flow stability — with a drawer to drill into any flagged item.',
      targetId:    'tour-header-flow-health',
      placement:   'bottom',
    },
    {
      id:          'kpi-strip',
      title:       'Flow Metrics KPI Strip',
      description: 'Avg Lead Time, Avg Cycle Time, Flow Efficiency, and Aging WIP count.',
      targetId:    'tour-section-flow-health-1',
      placement:   'bottom',
    },
    {
      id:          'bottleneck-map',
      title:       'Bottleneck Map',
      description: 'A bar chart of active work distribution across each status, colored by whether that status holds critical or warning items.',
      targetId:    'tour-section-flow-health-2',
      placement:   'top',
    },
  ],
  '/sprint-kanban': [
    {
      id:          'header',
      title:       'Sprint & Kanban',
      description: "Sprint-by-sprint delivery analysis — completion rate, delivery pattern, scope changes — or Kanban flow analytics when there's no sprint data.",
      targetId:    'tour-header-sprint-kanban',
      placement:   'bottom',
    },
    {
      id:          'mode-banner',
      title:       'Sprint / Kanban Mode Banner',
      description: 'Shows whether your export is being analyzed in Sprint Mode or Kanban Mode, based on whether sprint data was found.',
      targetId:    'tour-section-sprint-kanban-1',
      placement:   'bottom',
    },
    {
      id:          'delivery-kpis',
      title:       'Delivery KPI Strip',
      description: 'Sprint- or Kanban-specific metrics, depending on which mode applies to your data.',
      targetId:    'tour-section-sprint-kanban-2',
      placement:   'top',
    },
  ],
  '/delivery-mix': [
    {
      id:          'header',
      title:       'Delivery Mix',
      description: 'How your issue types break down — features vs. bugs vs. other work — and whether that mix is healthy.',
      targetId:    'tour-header-delivery-mix',
      placement:   'bottom',
    },
    {
      id:          'type-distribution',
      title:       'Issue Type Distribution',
      description: "A donut chart plus legend showing each issue type's count, category, and completion rate.",
      targetId:    'tour-section-delivery-mix-1',
      placement:   'bottom',
    },
    {
      id:          'mix-analysis',
      title:       'Work Mix Analysis',
      description: "A narrative breakdown of each work category's share, health split, and computed risk/quality signal.",
      targetId:    'tour-section-delivery-mix-2',
      placement:   'top',
    },
  ],
  '/explore': [
    {
      id:          'header',
      title:       'Explore Delivery Structure',
      description: 'Search any Jira issue key to visualize its full work hierarchy, relations, and delivery risk.',
      targetId:    'tour-header-explore',
      placement:   'bottom',
    },
    {
      id:          'search-bar',
      title:       'Issue Search Bar',
      description: 'Type an Epic, Story, Task, Bug, or Sub-task key and submit to build its relation graph.',
      targetId:    'tour-section-explore-1',
      placement:   'bottom',
    },
    {
      id:          'graph-controls',
      title:       'Focus & Graph Controls',
      description: "The focused issue's key, type, connected-item count, orphan count, a blocked-branch filter, and an export option for the relationship map.",
      targetId:    'tour-section-explore-2',
      placement:   'top',
    },
  ],
  '/customer': [
    {
      id:          'header',
      title:       'Project Delivery Summary',
      description: 'A printable, customer-facing summary card — plain-English delivery headline, status, and health at a glance.',
      targetId:    'tour-header-customer',
      placement:   'bottom',
    },
    {
      id:          'kpi-strip',
      title:       'Key Metrics Strip',
      description: 'Overall Done %, In Progress count, Blocked count, and Story Points/Quality completion.',
      targetId:    'tour-section-customer-1',
      placement:   'bottom',
    },
    {
      id:          'current-risks',
      title:       'Current Risks',
      description: 'Active delivery risks — blocked items, overdue issues, high-priority open items, open defects, and orphaned work.',
      targetId:    'tour-section-customer-2',
      placement:   'top',
    },
  ],
  '/roadmap': [
    {
      id:          'header',
      title:       'Epic Roadmap',
      description: 'An epic delivery timeline — toggle between Gantt and Cards views — with forecasts and health per epic.',
      targetId:    'tour-header-roadmap',
      placement:   'bottom',
    },
    {
      id:          'view-toggle',
      title:       'Timeline / Cards Toggle',
      description: 'Switch between the animated Gantt timeline view and the epic cards view.',
      targetId:    'tour-section-roadmap-1',
      placement:   'bottom',
    },
    {
      id:          'portfolio-kpis',
      title:       'Portfolio KPI Strip',
      description: 'Total Epics, Done, In Progress, At Risk, Critical, and Issues Done across the portfolio.',
      targetId:    'tour-section-roadmap-2',
      placement:   'top',
    },
  ],
  '/forecast': [
    {
      id:          'header',
      title:       'Delivery Forecast',
      description: 'A velocity-based outlook — sprints remaining, projected ship date, and the risk factors that could change it.',
      targetId:    'tour-header-forecast',
      placement:   'bottom',
    },
    {
      id:          'status-banner',
      title:       'Delivery Status Banner',
      description: 'The overall forecast status, confidence level, and time remaining to complete outstanding work.',
      targetId:    'tour-section-forecast-1',
      placement:   'bottom',
    },
    {
      id:          'forecast-kpis',
      title:       'Forecast KPI Row',
      description: 'Total Issues, Done, Remaining, Avg/Sprint throughput, and Delivery Confidence.',
      targetId:    'tour-section-forecast-2',
      placement:   'top',
    },
  ],

  '/retro': [
    {
      id:          'header',
      title:       'Retrospective',
      description: 'Past sprint retrospectives, plus AI-generated next-action suggestions — open one to capture what happened and what to improve.',
      targetId:    'tour-header-retro',
      placement:   'bottom',
    },
    {
      id:          'entry-options',
      title:       'Retrospective Entry Options',
      description: 'Fill the retrospective in-app, download an Excel/CSV template, or upload a completed retro file for analysis.',
      targetId:    'tour-section-retro-1',
      placement:   'bottom',
    },
    {
      id:          'what-it-does',
      title:       'What This Tool Does',
      description: 'Captures observations, records action items with owners and due dates, and generates insights and recommendations.',
      targetId:    'tour-section-retro-2',
      placement:   'top',
    },
  ],
  '/work-explorer': [
    {
      id:          'header',
      title:       'Work Explorer',
      description: 'A filterable, searchable table of every individual work item, with a live count of items shown vs. total.',
      targetId:    'tour-header-work-explorer',
      placement:   'bottom',
    },
    {
      id:          'search-toolbar',
      title:       'Search & Filter Toolbar',
      description: 'A search box plus Type/Status/Priority/Health dropdown filters that narrow the table below.',
      targetId:    'tour-section-work-explorer-1',
      placement:   'bottom',
    },
    {
      id:          'table-header',
      title:       'Work Item Table',
      description: 'Sortable columns — Key, Priority, Type, Summary, Status, Assignee, Age.',
      targetId:    'tour-section-work-explorer-2',
      placement:   'top',
    },
  ],
  '/data-quality': [
    {
      id:          'header',
      title:       'Data Quality',
      description: 'An overall data-quality score, completeness checks, field-level impact, and recommended fixes for your imported dataset.',
      targetId:    'tour-header-data-quality',
      placement:   'bottom',
    },
    {
      id:          'missing-field-kpis',
      title:       'Missing Field KPIs',
      description: 'Counts of missing dates, missing epic/parent links, missing statuses, and missing story-point estimates.',
      targetId:    'tour-section-data-quality-1',
      placement:   'bottom',
    },
    {
      id:          'field-impact',
      title:       'Field Impact Details',
      description: 'An expandable list of individual field-impact rows, with chips counting critical vs. high severity issues.',
      targetId:    'tour-section-data-quality-2',
      placement:   'top',
    },
  ],
  '/snapshots': [
    {
      id:          'header',
      title:       'Saved Snapshots',
      description: 'Point-in-time snapshots of your dashboard data that you can reload or compare against later.',
      targetId:    'tour-header-snapshots',
      placement:   'bottom',
    },
    {
      id:          'compare-actions',
      title:       'Compare & Dashboard Actions',
      description: 'Compare two saved snapshots, or jump back to the live dashboard.',
      targetId:    'tour-section-snapshots-1',
      placement:   'bottom',
    },
    {
      id:          'snapshots-list',
      title:       'Saved Snapshots List',
      description: 'Each saved snapshot with its name, saved date, and Load/Delete actions.',
      targetId:    'tour-section-snapshots-2',
      placement:   'top',
    },
  ],
  '/column-mapping': [
    {
      id:          'header',
      title:       'Column Mapping',
      description: "Map your Jira export's column headers to the fields Delivery Clarity expects, as part of setting up an import.",
      targetId:    'tour-header-column-mapping',
      placement:   'bottom',
    },
    {
      id:          'mapping-health',
      title:       'Field Mapping Health',
      description: 'How many required fields, optional fields, and total fields from your upload matched successfully.',
      targetId:    'tour-section-column-mapping-1',
      placement:   'bottom',
    },
    {
      id:          'required-fields',
      title:       'Required Fields',
      description: 'The mapping table for every mandatory field and whether it was detected in your upload.',
      targetId:    'tour-section-column-mapping-2',
      placement:   'top',
    },
  ],
  '/backend': [
    {
      id:          'header',
      title:       'Backend Status',
      description: 'Operational status information for the backend systems behind this app.',
      targetId:    'tour-header-backend',
      placement:   'bottom',
    },
    {
      id:          'import-stats',
      title:       'Import Statistics',
      description: "Total, successful, and failed import counts, plus the most recent import's timestamp, filename, and row count.",
      targetId:    'tour-section-backend-1',
      placement:   'bottom',
    },
    {
      id:          'endpoints-table',
      title:       'API Endpoints Table',
      description: 'Every registered API endpoint with its HTTP method, path, description, and online status.',
      targetId:    'tour-section-backend-2',
      placement:   'top',
    },
  ],
  '/members': [
    {
      id:          'header',
      title:       'Members',
      description: 'The team directory — roles, profile details, and contact info for everyone with access.',
      targetId:    'tour-header-members',
      placement:   'bottom',
    },
    {
      id:          'member-counts',
      title:       'Member and Role Counts',
      description: 'The total member count and the number of distinct roles present.',
      targetId:    'tour-section-members-1',
      placement:   'bottom',
    },
    {
      id:          'member-search',
      title:       'Member Search',
      description: 'Filter the member grid by name, role, position, or shared contact info.',
      targetId:    'tour-section-members-2',
      placement:   'top',
    },
  ],
  '/landing': [
    {
      id:          'header',
      title:       'Welcome to Delivery Clarity',
      description: 'A quick look at what Delivery Clarity does — upload a Jira export, get sprint health, team comparison, risk signals, and release readiness, without API keys or Jira credentials.',
      targetId:    'landing-hero',
      placement:   'bottom',
    },
    {
      id:          'product-flow',
      title:       'Export to Decision Flow',
      description: 'An animated diagram showing data flowing from a Jira export, through the engine, to delivery decisions.',
      targetId:    'tour-section-landing-1',
      placement:   'bottom',
    },
    {
      id:          'how-it-works',
      title:       'How It Works',
      description: 'Three steps — exporting from Jira, uploading, and acting on insights.',
      targetId:    'tour-section-landing-2',
      placement:   'top',
    },
  ],
  '/glossary': [
    {
      id:          'header',
      title:       'Glossary & Appendix',
      description: 'Definitions for every term, code, and abbreviation used across Delivery Clarity, organized into browsable sections.',
      targetId:    'tour-header-glossary',
      placement:   'bottom',
    },
    {
      id:          'search-box',
      title:       'Term Search',
      description: 'Filter the term list by term, full name, or meaning as you type.',
      targetId:    'tour-section-glossary-1',
      placement:   'bottom',
    },
    {
      id:          'category-pills',
      title:       'Category Filter Pills',
      description: 'Jump to a category — Priority levels, Delivery terms, Reference codes, People & roles.',
      targetId:    'tour-section-glossary-2',
      placement:   'top',
    },
  ],
  '/profile': [
    {
      id:          'header',
      title:       'Settings',
      description: 'Manage your profile, data storage mode, and account security.',
      targetId:    'tour-header-profile',
      placement:   'bottom',
    },
    {
      id:          'tab-switcher',
      title:       'Settings Tab Switcher',
      description: 'Switch between Profile, Storage, and Security settings.',
      targetId:    'tour-section-profile-1',
      placement:   'bottom',
    },
    {
      id:          'active-panel',
      title:       'Active Settings Panel',
      description: 'The form for whichever settings tab is currently selected.',
      targetId:    'tour-section-profile-2',
      placement:   'top',
    },
  ],

  // These two pages document the app to the user directly, so their tour
  // points at real structural elements (search, nav) rather than markdown
  // content, which can't take a plain DOM id the way JSX elements can.
  '/developer': [
    {
      id:          'header',
      title:       'Developer Documentation',
      description: 'Setup instructions, architecture, API reference, and internal documentation for engineers working on Delivery Clarity.',
      placement:   'center',
    },
    {
      id:          'search-box',
      title:       'Documentation Search',
      description: 'Search across every documentation section from one box.',
      targetId:    'tour-section-developer-search',
      placement:   'bottom',
    },
    {
      id:          'section-nav',
      title:       'Section Navigation',
      description: 'Jump directly to any documentation section — Setup, Pages, API Endpoints, Architecture, and more.',
      targetId:    'tour-section-developer-nav',
      placement:   'bottom',
    },
  ],
  '/help': [
    {
      id:          'header',
      title:       'Help Center',
      description: 'Answers organized by topic — Getting Started, Dashboard, Planning, Analysis, Export & Data, System, Customization, People, and Troubleshooting.',
      placement:   'center',
    },
    {
      id:          'search-box',
      title:       'Help Search',
      description: 'Search every FAQ answer from one box.',
      targetId:    'tour-section-help-search',
      placement:   'bottom',
    },
    {
      id:          'category-pills',
      title:       'Topic Filter Pills',
      description: 'Jump straight to a topic — Dashboard, Planning, Analysis, and more.',
      targetId:    'tour-section-help-pills',
      placement:   'top',
    },
  ],
};

export function getPageTour(pathname: string): TourStep[] | null {
  return PAGE_TOURS[pathname] ?? null;
}
