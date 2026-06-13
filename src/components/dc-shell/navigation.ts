export type DCShellNavStatus = 'critical' | 'warning' | 'success' | 'neutral' | 'info';

export type DCShellNavItem = {
  id: string;
  title: string;
  desc: string;
  href: string;
  status: DCShellNavStatus;
};

export type DCShellNavGroup = {
  id: string;
  label: string;
  items: DCShellNavItem[];
};

export const DC_NAV_GROUPS: DCShellNavGroup[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { id: 'charts',    title: 'Charts',       desc: 'Visual analysis',      href: '/charts',    status: 'info' },
      { id: 'teams',     title: 'Team Health',   desc: 'Member health scores', href: '/teams',     status: 'success' },
      { id: 'trends',    title: 'Trends',        desc: 'Upload deltas',        href: '/trends',    status: 'info' },
      { id: 'forecast',  title: 'Forecast',      desc: 'Delivery projection',  href: '/forecast',  status: 'warning' },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    items: [
      { id: 'portfolio', title: 'Portfolio',         desc: 'Epic & programme view',  href: '/portfolio', status: 'success' },
      { id: 'customer',  title: 'Customer View',     desc: 'Stakeholder-safe view',  href: '/customer',  status: 'neutral' },
      { id: 'retro',     title: 'Retrospective',     desc: 'Sprint insights',        href: '/retro',     status: 'neutral' },
      { id: 'roadmap',   title: 'Roadmap',           desc: 'Timeline & scope',       href: '/roadmap',   status: 'neutral' },
      { id: 'explore',   title: 'Relationship Map',  desc: 'Hierarchy graph',        href: '/explore',   status: 'neutral' },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      { id: 'overview',          title: 'Executive Summary',  desc: 'Health & top actions',   href: '/summary',           status: 'critical' },
      { id: 'dashboard',         title: 'Full Dashboard',     desc: 'All metrics & filters',  href: '/dashboard',         status: 'neutral' },
      { id: 'flow-health',       title: 'Flow Health',        desc: 'Lead time & blockers',   href: '/flow-health',       status: 'warning' },
      { id: 'sprint-kanban',     title: 'Sprint & Kanban',    desc: 'Velocity & throughput',  href: '/sprint-kanban',     status: 'success' },
      { id: 'delivery-mix',      title: 'Delivery Mix',       desc: 'Work & value mix',       href: '/delivery-mix',      status: 'success' },
      { id: 'release-readiness', title: 'Release Readiness',  desc: 'Go / no-go gates',       href: '/release-readiness', status: 'warning' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    items: [
      { id: 'work-explorer',   title: 'Work Explorer',    desc: 'Issue table & detail',   href: '/work-explorer',   status: 'neutral' },
      { id: 'data-quality',    title: 'Data Quality',     desc: 'Field confidence',       href: '/data-quality',    status: 'success' },
      { id: 'snapshots',       title: 'Snapshots',        desc: 'Saved baselines',        href: '/snapshots',       status: 'info' },
      { id: 'column-mapping',  title: 'Column Mapping',   desc: 'Field mapping config',   href: '/column-mapping',  status: 'neutral' },
      { id: 'members',         title: 'Members',          desc: 'Team directory',         href: '/members',         status: 'success' },
      { id: 'backend',         title: 'Backend Status',   desc: 'API & DB health',        href: '/backend',         status: 'neutral' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      { id: 'admin-logs',        title: 'Import Logs',     desc: 'Audit trail',        href: '/admin/logs',        status: 'neutral' },
      { id: 'admin-settings',    title: 'Settings',        desc: 'System config',      href: '/admin/settings',    status: 'neutral' },
      { id: 'admin-users',       title: 'User Management', desc: 'Accounts & roles',   href: '/admin/users',       status: 'neutral' },
      { id: 'admin-system',      title: 'System Config',   desc: 'Storage & theme',    href: '/admin/system',      status: 'neutral' },
      { id: 'admin-security',    title: 'Security',        desc: 'Hardening checks',   href: '/admin/security',    status: 'warning' },
      { id: 'admin-diagnostics', title: 'Diagnostics',     desc: 'System health',      href: '/admin/diagnostics', status: 'info' },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    items: [
      { id: 'help',      title: 'Help Guide',       desc: 'User guide',         href: '/help',      status: 'info' },
      { id: 'glossary',  title: 'Glossary',         desc: 'Terminology',        href: '/glossary',  status: 'neutral' },
      { id: 'developer', title: 'Developer Portal', desc: 'Technical guide',    href: '/developer', status: 'neutral' },
      { id: 'landing',   title: 'About',            desc: 'Product overview',   href: '/landing',   status: 'neutral' },
      { id: 'profile',   title: 'Profile',          desc: 'Account settings',   href: '/profile',   status: 'neutral' },
    ],
  },
];

export const DC_NAV_ITEMS = DC_NAV_GROUPS.flatMap(g => g.items);

export const DC_ADMIN_NAV_ITEMS: DCShellNavItem[] = [
  { id: 'admin-logs',        title: 'Import Logs',  desc: 'All upload history',         href: '/admin/logs',        status: 'neutral' },
  { id: 'admin-settings',    title: 'Settings',     desc: 'Thresholds · data retention', href: '/admin/settings',    status: 'neutral' },
  { id: 'admin-security',    title: 'Security',     desc: 'Production checklist',        href: '/admin/security',    status: 'neutral' },
  { id: 'admin-diagnostics', title: 'Diagnostics',  desc: 'Ops health · audit events',   href: '/admin/diagnostics', status: 'neutral' },
];
