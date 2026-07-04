import { canAccessRoute } from '@/lib/roles';

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
  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { id: 'overview',   title: 'Overview',     desc: 'Health at a glance',           href: '/summary',    status: 'neutral' },
      { id: 'dashboard',  title: 'Full Report',  desc: 'All metrics & filters',        href: '/dashboard',  status: 'neutral' },
      { id: 'charts',     title: 'Charts',       desc: 'Visual breakdowns',            href: '/charts',     status: 'info'    },
      { id: 'trends',     title: 'Trends',       desc: 'Upload-over-upload change',    href: '/trends',     status: 'info'    },
      { id: 'teams',      title: 'Teams',        desc: 'Team health comparison',       href: '/teams',      status: 'success' },
      { id: 'portfolio',  title: 'Portfolio',    desc: 'Cross-team portfolio summary', href: '/portfolio',  status: 'success' },
    ],
  },
  // ── Delivery ──────────────────────────────────────────────────────────────
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      { id: 'release-readiness', title: 'Readiness',       desc: 'Go / No-Go per release',    href: '/release-readiness', status: 'warning' },
      { id: 'flow-health',       title: 'Flow Health',     desc: 'Lead time & blockers',      href: '/flow-health',       status: 'warning' },
      { id: 'sprint-kanban',     title: 'Sprint & Kanban', desc: 'Velocity & throughput',     href: '/sprint-kanban',     status: 'success' },
      { id: 'delivery-mix',      title: 'Delivery Mix',    desc: 'Work type & value mix',     href: '/delivery-mix',      status: 'success' },
      { id: 'explore',           title: 'Explore',         desc: 'Work item dependency graph', href: '/explore',           status: 'neutral' },
      { id: 'customer',          title: 'Customer',        desc: 'Customer-visible progress', href: '/customer',          status: 'neutral' },
    ],
  },
  // ── Planning ──────────────────────────────────────────────────────────────
  {
    id: 'planning',
    label: 'Planning',
    items: [
      { id: 'roadmap',  title: 'Roadmap',  desc: 'Epic progress & delivery ETA', href: '/roadmap',  status: 'neutral' },
      { id: 'forecast', title: 'Forecast', desc: 'Velocity & burn-up outlook',   href: '/forecast', status: 'warning' },
      { id: 'retro',    title: 'Retro',    desc: 'Sprint retrospective tool',    href: '/retro',    status: 'neutral' },
    ],
  },
  // ── Data ──────────────────────────────────────────────────────────────────
  {
    id: 'data',
    label: 'Data',
    items: [
      { id: 'work-explorer',  title: 'Work Explorer',  desc: 'Issue table & detail',    href: '/work-explorer',  status: 'neutral' },
      { id: 'data-quality',   title: 'Data Quality',   desc: 'Field confidence scores', href: '/data-quality',   status: 'success' },
      { id: 'snapshots',      title: 'Snapshots',      desc: 'Saved metric snapshots',  href: '/snapshots',      status: 'info'    },
      { id: 'column-mapping', title: 'Column Mapping', desc: 'Field mapping config',    href: '/column-mapping', status: 'neutral' },
      { id: 'backend',        title: 'Backend',        desc: 'Import logs & raw data',  href: '/backend',        status: 'neutral' },
    ],
  },
  // ── Administration ────────────────────────────────────────────────────────
  {
    id: 'administration',
    label: 'Administration',
    items: [
      { id: 'admin-settings',    title: 'Settings',         desc: 'Users, storage, retention',   href: '/admin/settings',    status: 'neutral' },
      { id: 'admin-theme',       title: 'Theme & Branding', desc: 'Palette, logo, app name',     href: '/admin/theme',        status: 'neutral' },
      { id: 'admin-users',       title: 'User Management',  desc: 'Accounts & roles',            href: '/admin/users',        status: 'neutral' },
      { id: 'admin-diagnostics', title: 'Diagnostics',      desc: 'System health & admin stats', href: '/admin/diagnostics',  status: 'info'    },
      { id: 'admin-security',    title: 'Security',         desc: 'Production security checks',  href: '/admin/security',     status: 'warning' },
      { id: 'admin-logs',        title: 'Import Logs',      desc: 'All user import activity',    href: '/admin/logs',         status: 'neutral' },
    ],
  },
  // ── Reference ─────────────────────────────────────────────────────────────
  {
    id: 'reference',
    label: 'Reference',
    items: [
      { id: 'members',   title: 'Members',   desc: 'Team directory & contacts',  href: '/members',   status: 'success' },
      { id: 'landing',   title: 'About',     desc: 'Product overview & features', href: '/landing',   status: 'neutral' },
      { id: 'glossary',  title: 'Glossary',  desc: 'Term & abbreviation guide',  href: '/glossary',  status: 'neutral' },
      { id: 'developer', title: 'Developer', desc: 'API & technical docs',       href: '/developer', status: 'neutral' },
      { id: 'help',      title: 'Help',      desc: 'How to use this app',        href: '/help',      status: 'info'    },
    ],
  },
];

export const DC_NAV_ITEMS = DC_NAV_GROUPS.flatMap(g => g.items);

// Filters the shared nav config down to what the given role can actually open —
// previously every menu showed every group/item to every role (AppShell.tsx and
// DashboardTopbar.tsx each had a "no role-based filtering in the nav" comment
// baked in), so clicking an item a role isn't allowed to open would render
// nothing useful once canAccessRoute() blocked the destination page. A group
// left with zero visible items after filtering is dropped entirely rather than
// rendering an empty dropdown.
export function getNavGroupsForRole(role: string | null | undefined): DCShellNavGroup[] {
  return DC_NAV_GROUPS
    .map(group => ({ ...group, items: group.items.filter(item => canAccessRoute(role, item.href)) }))
    .filter(group => group.items.length > 0);
}

export const DC_ADMIN_NAV_ITEMS: DCShellNavItem[] = [
  { id: 'admin-logs',        title: 'Import Logs',  desc: 'All upload history',         href: '/admin/logs',        status: 'neutral' },
  { id: 'admin-settings',    title: 'Settings',     desc: 'Thresholds · data retention', href: '/admin/settings',    status: 'neutral' },
  { id: 'admin-security',    title: 'Security',     desc: 'Production checklist',        href: '/admin/security',    status: 'neutral' },
  { id: 'admin-diagnostics', title: 'Diagnostics',  desc: 'Ops health · audit events',   href: '/admin/diagnostics', status: 'neutral' },
];
