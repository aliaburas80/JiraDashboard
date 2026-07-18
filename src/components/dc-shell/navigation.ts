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
  // Sub-grouping within a DCShellNavGroup — currently only used by the
  // 'administration' group, whose items are rendered as three labelled
  // sections (Activity / Observability / Configure) inside the admin
  // sidebar (AdminNavSidebar.tsx), while the topbar dropdown and global
  // search render the same group as one flat list and ignore this field.
  section?: string;
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
      { id: 'dashboard',  title: 'Full Report',  desc: 'Priority items & full metrics', href: '/dashboard',  status: 'neutral', icon: 'table'       },
      { id: 'charts',     title: 'Charts',       desc: 'Visual breakdowns',            href: '/charts',     status: 'info',    icon: 'chartBar'    },
      { id: 'trends',     title: 'Trends',       desc: 'Cross-upload history, not current data', href: '/trends', status: 'info',    icon: 'chartTrendUp' },
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
  // Single source of truth for every admin-only destination — also drives
  // AdminNavSidebar.tsx's sectioned rendering (grouped by `section` below,
  // in array order) so the topbar dropdown, global search, and the admin
  // sidebar can never drift into three independently-maintained lists again.
  {
    id: 'administration',
    label: 'Administration',
    items: [
      // Activity
      { id: 'admin-audit',       title: 'Audit Events',     desc: 'Admin action audit trail',    href: '/admin/audit',        status: 'neutral', icon: 'clipboard', section: 'Activity' },
      { id: 'admin-logs',        title: 'Import Logs',      desc: 'All user import activity',    href: '/admin/logs',         status: 'neutral', icon: 'archive',   section: 'Activity' },
      { id: 'admin-feedback',    title: 'User Feedback',    desc: 'Submitted feedback & reports', href: '/admin/feedback',    status: 'neutral', icon: 'email',     section: 'Activity' },
      // Observability
      { id: 'admin-syserrors',   title: 'System Errors',    desc: 'Logged application errors',   href: '/admin/system-errors', status: 'warning', icon: 'warning',   section: 'Observability' },
      { id: 'admin-diagnostics', title: 'Diagnostics',      desc: 'System health & admin stats', href: '/admin/diagnostics',  status: 'info',    icon: 'statusInfo', section: 'Observability' },
      { id: 'admin-security',    title: 'Security',         desc: 'Production security checks',  href: '/admin/security',     status: 'warning', icon: 'shield',    section: 'Observability' },
      // Configure
      { id: 'admin-users',       title: 'User Management',  desc: 'Accounts & roles',            href: '/admin/users',        status: 'neutral', icon: 'people',    section: 'Configure' },
      { id: 'admin-settings',    title: 'Settings',         desc: 'Users, storage, retention',   href: '/admin/settings',     status: 'neutral', icon: 'tools',     section: 'Configure' },
      { id: 'admin-theme',       title: 'Branding',         desc: 'Logo, favicon & app name',    href: '/admin/theme',        status: 'neutral', icon: 'tag',       section: 'Configure' },
    ],
  },
  // ── Directory ─────────────────────────────────────────────────────────────
  // Split out of the former 'reference' group — 07-information-architecture.md
  // §D flagged 'Reference' as mixing a people directory, marketing, end-user
  // docs, and developer tooling under one ambiguous label. 'members' is a
  // people directory, a distinct audience from the self-serve product docs
  // kept in 'reference' below. Still gated by the isSuperAdmin flag in
  // isVisible() below (EP-025), unchanged by this regrouping.
  {
    id: 'directory',
    label: 'Directory',
    items: [
      { id: 'members', title: 'Members', desc: 'Team directory & contacts', href: '/members', status: 'success', icon: 'teams' },
    ],
  },
  // ── Developer Tools ───────────────────────────────────────────────────────
  // Split out of the former 'reference' group — 'developer' is admin-only
  // technical/API documentation (see the admin-only '/developer' entry in
  // roles.ts, alongside '/admin'), a different audience than the self-serve
  // end-user docs kept in 'reference' below.
  {
    id: 'developer-tools',
    label: 'Developer Tools',
    items: [
      { id: 'developer', title: 'Developer', desc: 'API & technical docs', href: '/developer', status: 'neutral', icon: 'terminal' },
    ],
  },
  // ── Reference ─────────────────────────────────────────────────────────────
  // Self-serve, product-info destinations open to every role — trimmed to
  // this one coherent audience (07-information-architecture.md §D); 'members'
  // and 'developer' moved to their own groups above.
  {
    id: 'reference',
    label: 'Reference',
    items: [
      { id: 'landing',   title: 'About',    desc: 'Product overview & features', href: '/landing',  status: 'neutral', icon: 'info'    },
      { id: 'glossary',  title: 'Glossary', desc: 'Term & abbreviation guide',   href: '/glossary',  status: 'neutral', icon: 'book'    },
      { id: 'help',      title: 'Help',     desc: 'How to use this app',         href: '/help',      status: 'info',    icon: 'support' },
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

export type DCShellNavSection = { label: string; items: DCShellNavItem[] };

/**
 * The 'administration' group's items, grouped by `section` and in array
 * order — this is what AdminNavSidebar.tsx renders as its three labelled
 * sections (Activity / Observability / Configure). Single source shared
 * with the topbar dropdown and global search (which render the same group
 * flat, ignoring `section`) so there is exactly one place that defines what
 * an admin destination is called, which icon it uses, and where it lives.
 */
export function getAdminNavSections(role: string | null | undefined, isSuperAdmin?: boolean): DCShellNavSection[] {
  const adminGroup = getNavGroupsForRole(role, isSuperAdmin).find(g => g.id === 'administration');
  if (!adminGroup) return [];

  const sections: DCShellNavSection[] = [];
  for (const item of adminGroup.items) {
    const label = item.section ?? 'General';
    let section = sections.find(s => s.label === label);
    if (!section) {
      section = { label, items: [] };
      sections.push(section);
    }
    section.items.push(item);
  }
  return sections;
}
