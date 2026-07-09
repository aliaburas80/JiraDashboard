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
  ],

  '/dashboard/priority-attention': [
    {
      id:          'header',
      title:       'Priority Attention',
      description: 'Your top blockers, overdue items, and orphan issues — ranked by impact. The first place to look before a standup.',
      targetId:    'tour-header-priority-attention',
      placement:   'bottom',
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
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/actions': [
    {
      id:          'header',
      title:       'Smart Actions',
      description: 'AI-generated recommendations to improve delivery health. Assign an owner, mark helpful or not, or snooze one for later.',
      targetId:    'tour-header-actions',
      placement:   'bottom',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/data-quality': [
    {
      id:          'header',
      title:       'Data Quality',
      description: 'Field confidence scores, the impact of missing data on your metrics, and guidance for fixing it.',
      targetId:    'tour-header-dashboard-data-quality',
      placement:   'bottom',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/visual-analytics': [
    {
      id:          'header',
      title:       'Visual Analytics',
      description: 'Charts and distributions for visually exploring delivery patterns across your dataset.',
      targetId:    'tour-header-visual-analytics',
      placement:   'bottom',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/delivery-composition': [
    {
      id:          'header',
      title:       'Delivery Composition',
      description: 'How your work breaks down — by status, issue type, health, and epic contribution.',
      targetId:    'tour-header-delivery-composition',
      placement:   'bottom',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/delivery-controls': [
    {
      id:          'header',
      title:       'Delivery Controls',
      description: 'Work-in-progress limits, blocked items, aging work, flow efficiency, and the risk thresholds behind them.',
      targetId:    'tour-header-delivery-controls',
      placement:   'bottom',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/quarter-statistics': [
    {
      id:          'header',
      title:       'Quarter Statistics',
      description: 'Throughput, completion, and delivery trends compared quarter over quarter.',
      targetId:    'tour-header-quarter-statistics',
      placement:   'bottom',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/kanban-health': [
    {
      id:          'header',
      title:       'Kanban Health',
      description: 'Board health signals — WIP, throughput, aging work, and flow distribution across your Kanban board.',
      targetId:    'tour-header-kanban-health',
      placement:   'bottom',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/sprint-status': [
    {
      id:          'header',
      title:       'Sprint Status',
      description: 'Sprint goal and progress, commitment vs. completion, blockers, and risk callouts for the active sprint.',
      targetId:    'tour-header-sprint-status',
      placement:   'bottom',
    },
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/ownership': [
    {
      id:          'header',
      title:       'Ownership & Capacity',
      description: 'How work is distributed across the team — load per assignee, and epic-level ownership performance.',
      targetId:    'tour-header-ownership',
      placement:   'bottom',
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
    DASHBOARD_SIDEBAR_STEP,
  ],
  '/dashboard/coaching': [
    {
      id:          'header',
      title:       'Role-Based Coaching Insights',
      description: 'Evidence-based coaching insights tailored to different roles — pick a view to see targeted guidance.',
      targetId:    'tour-header-coaching',
      placement:   'bottom',
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
  ],
  '/admin/logs': [
    {
      id:          'header',
      title:       'Import Logs',
      description: 'Every Jira import across all users — when it ran, what changed, and whether it succeeded.',
      targetId:    'tour-header-admin-logs',
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
  ],
  '/admin/system-errors': [
    {
      id:          'header',
      title:       'System Errors',
      description: 'Database errors and failed operations, with the ability to retry or dismiss each one.',
      targetId:    'tour-header-admin-system-errors',
      placement:   'bottom',
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
  ],
  '/admin/security': [
    {
      id:          'header',
      title:       'Security Checklist',
      description: 'An automated and manual security checklist for production readiness.',
      targetId:    'tour-header-admin-security',
      placement:   'bottom',
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
  ],
  '/admin/settings': [
    {
      id:          'header',
      title:       'Settings',
      description: 'System-wide configuration — cloud storage, security policy, and other settings that apply to everyone. Use the sidebar to switch between categories.',
      targetId:    'tour-header-admin-settings',
      placement:   'bottom',
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
  ],

  '/charts': [
    {
      id:          'header',
      title:       'Visual Analytics',
      description: 'Charts and diagrams — tabbed Charts and Circles views — summarizing delivery health, flow, team, and progress, with a KPI strip up top.',
      targetId:    'tour-header-charts',
      placement:   'bottom',
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
  ],
  '/teams': [
    {
      id:          'header',
      title:       'Team Health Comparison',
      description: 'Side-by-side health scorecards, workload, and risk signals for each team member, plus comparison charts and a detail table.',
      targetId:    'tour-header-teams',
      placement:   'bottom',
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
  ],
  '/release-readiness': [
    {
      id:          'header',
      title:       'Release Readiness',
      description: 'A Go / Conditional Go / No-Go decision framework that checks your data against 7 release quality gates.',
      targetId:    'tour-header-release-readiness',
      placement:   'bottom',
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
  ],
  '/sprint-kanban': [
    {
      id:          'header',
      title:       'Sprint & Kanban',
      description: "Sprint-by-sprint delivery analysis — completion rate, delivery pattern, scope changes — or Kanban flow analytics when there's no sprint data.",
      targetId:    'tour-header-sprint-kanban',
      placement:   'bottom',
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
  ],
  '/explore': [
    {
      id:          'header',
      title:       'Explore Delivery Structure',
      description: 'Search any Jira issue key to visualize its full work hierarchy, relations, and delivery risk.',
      targetId:    'tour-header-explore',
      placement:   'bottom',
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
  ],
  '/roadmap': [
    {
      id:          'header',
      title:       'Epic Roadmap',
      description: 'An epic delivery timeline — toggle between Gantt and Cards views — with forecasts and health per epic.',
      targetId:    'tour-header-roadmap',
      placement:   'bottom',
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
  ],

  '/retro': [
    {
      id:          'header',
      title:       'Retrospective',
      description: 'Past sprint retrospectives, plus AI-generated next-action suggestions — open one to capture what happened and what to improve.',
      targetId:    'tour-header-retro',
      placement:   'bottom',
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
  ],
  '/data-quality': [
    {
      id:          'header',
      title:       'Data Quality',
      description: 'An overall data-quality score, completeness checks, field-level impact, and recommended fixes for your imported dataset.',
      targetId:    'tour-header-data-quality',
      placement:   'bottom',
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
  ],
  '/column-mapping': [
    {
      id:          'header',
      title:       'Column Mapping',
      description: "Map your Jira export's column headers to the fields Delivery Clarity expects, as part of setting up an import.",
      targetId:    'tour-header-column-mapping',
      placement:   'bottom',
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
  ],
  '/members': [
    {
      id:          'header',
      title:       'Members',
      description: 'The team directory — roles, profile details, and contact info for everyone with access.',
      targetId:    'tour-header-members',
      placement:   'bottom',
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
  ],
  '/glossary': [
    {
      id:          'header',
      title:       'Glossary & Appendix',
      description: 'Definitions for every term, code, and abbreviation used across Delivery Clarity, organized into browsable sections.',
      targetId:    'tour-header-glossary',
      placement:   'bottom',
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
  ],

  // These two pages document the app to the user directly, so their tour is
  // a single centered step rather than a highlighted anchor.
  '/developer': [
    {
      id:          'header',
      title:       'Developer Documentation',
      description: 'Setup instructions, architecture, API reference, and internal documentation for engineers working on Delivery Clarity.',
      placement:   'center',
    },
  ],
  '/help': [
    {
      id:          'header',
      title:       'Help Center',
      description: 'Answers organized by topic — Getting Started, Dashboard, Planning, Analysis, Export & Data, System, Customization, People, and Troubleshooting.',
      placement:   'center',
    },
  ],
};

export function getPageTour(pathname: string): TourStep[] | null {
  return PAGE_TOURS[pathname] ?? null;
}
