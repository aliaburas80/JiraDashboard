import { canAccessRoute } from '@/lib/roles';
import type { IconName } from '@/lib/icons';

export type DCShellNavStatus = 'critical' | 'warning' | 'success' | 'neutral' | 'info';

export type DCShellNavItem = {
  id: string;
  title: string;
  desc: string;
  href: string;
  status: DCShellNavStatus;
  // Semantic icon name from the approved registry (src/lib/icons.ts) — used
  // by global search result cards. Optional so existing dropdown-menu
  // rendering (which never showed icons) doesn't need every item touched to
  // stay valid; new items should still set it for a good search result card.
  icon?: IconName;
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
      { id: 'overview',   title: 'Overview',     desc: 'Health at a glance',           href: '/summary',    status: 'neutral', icon: 'dashboard'   },
      { id: 'dashboard',  title: 'Full Report',  desc: 'All metrics & filters',        href: '/dashboard',  status: 'neutral', icon: 'table'       },
      { id: 'charts',     title: 'Charts',       desc: 'Visual breakdowns',            href: '/charts',     status: 'info',    icon: 'chartBar'    },
      { id: 'trends',     title: 'Trends',       desc: 'Upload-over-upload change',    href: '/trends',     status: 'info',    icon: 'chartTrendUp' },
      { id: 'teams',      title: 'Teams',        desc: 'Team health comparison',       href: '/teams',      status: 'success', icon: 'teams'       },
      { id: 'portfolio',  title: 'Portfolio',    desc: 'Cross-team portfolio summary', href: '/portfolio',  status: 'success', icon: 'briefcase'   },
    ],
  },
  // ── Delivery ──────────────────────────────────────────────────────────────
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      { id: 'release-readiness', title: 'Readiness',       desc: 'Go / No-Go per release',    href: '/release-readiness', status: 'warning', icon: 'release'  },
      { id: 'flow-health',       title: 'Flow Health',     desc: 'Lead time & blockers',      href: '/flow-health',       status: 'warning', icon: 'activity' },
      { id: 'sprint-kanban',     title: 'Sprint & Kanban', desc: 'Velocity & throughput',     href: '/sprint-kanban',     status: 'success', icon: 'board'    },
      { id: 'delivery-mix',      title: 'Delivery Mix',    desc: 'Work type & value mix',     href: '/delivery-mix',      status: 'success', icon: 'chartPie' },
      { id: 'explore',           title: 'Explore',         desc: 'Work item dependency graph', href: '/explore',           status: 'neutral', icon: 'dataFlow' },
      { id: 'customer',          title: 'Customer',        desc: 'Customer-visible progress', href: '/customer',          status: 'neutral', icon: 'person'   },
    ],
  },
  // ── Planning ──────────────────────────────────────────────────────────────
  {
    id: 'planning',
    label: 'Planning',
    items: [
      { id: 'roadmap',  title: 'Roadmap',  desc: 'Epic progress & delivery ETA', href: '/roadmap',  status: 'neutral', icon: 'roadmap'  },
      { id: 'forecast', title: 'Forecast', desc: 'Velocity & burn-up outlook',   href: '/forecast', status: 'warning', icon: 'timeline' },
      { id: 'retro',    title: 'Retro',    desc: 'Sprint retrospective tool',    href: '/retro',    status: 'neutral', icon: 'comment'  },
    ],
  },
  // ── Data ──────────────────────────────────────────────────────────────────
  {
    id: 'data',
    label: 'Data',
    items: [
      { id: 'work-explorer',  title: 'Work Explorer',  desc: 'Issue table & detail',    href: '/work-explorer',  status: 'neutral', icon: 'workItems'     },
      { id: 'data-quality',   title: 'Data Quality',   desc: 'Field confidence scores', href: '/data-quality',   status: 'success', icon: 'statusVerified' },
      { id: 'snapshots',      title: 'Snapshots',      desc: 'Saved metric snapshots',  href: '/snapshots',      status: 'info',    icon: 'camera'        },
      { id: 'column-mapping', title: 'Column Mapping', desc: 'Field mapping config',    href: '/column-mapping', status: 'neutral', icon: 'field'         },
      { id: 'backend',        title: 'Backend',        desc: 'Import logs & raw data',  href: '/backend',        status: 'neutral', icon: 'database'      },
    ],
  },
  // ── Administration ────────────────────────────────────────────────────────
  {
    id: 'administration',
    label: 'Administration',
    items: [
      { id: 'admin-settings',    title: 'Settings',         desc: 'Users, storage, retention',   href: '/admin/settings',    status: 'neutral', icon: 'settings'    },
      { id: 'admin-theme',       title: 'Theme & Branding', desc: 'Palette, logo, app name',     href: '/admin/theme',        status: 'neutral', icon: 'palette'     },
      { id: 'admin-users',       title: 'User Management',  desc: 'Accounts & roles',            href: '/admin/users',        status: 'neutral', icon: 'people'      },
      { id: 'admin-diagnostics', title: 'Diagnostics',      desc: 'System health & admin stats', href: '/admin/diagnostics',  status: 'info',    icon: 'stopwatch'   },
      { id: 'admin-security',    title: 'Security',         desc: 'Production security checks',  href: '/admin/security',     status: 'warning', icon: 'shield'      },
      { id: 'admin-logs',        title: 'Import Logs',      desc: 'All user import activity',    href: '/admin/logs',         status: 'neutral', icon: 'clipboard'   },
    ],
  },
  // ── Reference ─────────────────────────────────────────────────────────────
  {
    id: 'reference',
    label: 'Reference',
    items: [
      { id: 'members',   title: 'Members',   desc: 'Team directory & contacts',  href: '/members',   status: 'success', icon: 'teams'    },
      { id: 'landing',   title: 'About',     desc: 'Product overview & features', href: '/landing',   status: 'neutral', icon: 'info'     },
      { id: 'glossary',  title: 'Glossary',  desc: 'Term & abbreviation guide',  href: '/glossary',  status: 'neutral', icon: 'book'     },
      { id: 'developer', title: 'Developer', desc: 'API & technical docs',       href: '/developer', status: 'neutral', icon: 'terminal' },
      { id: 'help',      title: 'Help',      desc: 'How to use this app',        href: '/help',      status: 'info',    icon: 'support'  },
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
// EP-025: the 'members' item is a narrow exception on top of the normal
// role-based filtering above — it's gated by the protected super-admin flag
// (isSuperAdmin), which is orthogonal to AppRole, rather than by role.
export function getNavGroupsForRole(role: string | null | undefined, isSuperAdmin?: boolean): DCShellNavGroup[] {
  function isVisible(item: DCShellNavItem): boolean {
    if (item.id === 'members') return isSuperAdmin === true;
    return canAccessRoute(role, item.href);
  }

  return DC_NAV_GROUPS
    .map(group => ({ ...group, items: group.items.filter(isVisible) }))
    .filter(group => group.items.length > 0);
}

export const DC_ADMIN_NAV_ITEMS: DCShellNavItem[] = [
  { id: 'admin-logs',        title: 'Import Logs',  desc: 'All upload history',         href: '/admin/logs',        status: 'neutral' },
  { id: 'admin-settings',    title: 'Settings',     desc: 'Thresholds · data retention', href: '/admin/settings',    status: 'neutral' },
  { id: 'admin-security',    title: 'Security',     desc: 'Production checklist',        href: '/admin/security',    status: 'neutral' },
  { id: 'admin-diagnostics', title: 'Diagnostics',  desc: 'Ops health · audit events',   href: '/admin/diagnostics', status: 'neutral' },
];
