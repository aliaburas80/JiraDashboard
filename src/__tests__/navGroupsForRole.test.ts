// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-019: nav menus (AppShell.tsx, DashboardTopbar.tsx) must only show groups/items
// the current role can actually open — found showing everything to every role
// regardless of access (both had a "no role-based filtering in the nav" comment).

import { getNavGroupsForRole, getAdminNavSections, DC_NAV_GROUPS } from '../components/dc-shell/navigation';

test('TC-NAV-01: admin sees the Administration group', () => {
  const groups = getNavGroupsForRole('admin');
  expect(groups.some(g => g.id === 'administration')).toBe(true);
});

test('TC-NAV-02: a non-admin role never sees the Administration group', () => {
  for (const role of ['scrum_master', 'product_owner', 'manager', 'c_level', 'user']) {
    const groups = getNavGroupsForRole(role);
    expect(groups.some(g => g.id === 'administration')).toBe(false);
  }
});

test('TC-NAV-03: a non-admin role never sees the Developer link (admin-only route)', () => {
  for (const role of ['scrum_master', 'product_owner', 'manager', 'c_level', 'user', null, undefined]) {
    const groups = getNavGroupsForRole(role);
    const developerToolsGroup = groups.find(g => g.id === 'developer-tools');
    expect(developerToolsGroup?.items.some(item => item.id === 'developer')).toBeFalsy();
  }
});

test('TC-NAV-04: admin sees the Developer link', () => {
  const groups = getNavGroupsForRole('admin');
  const developerToolsGroup = groups.find(g => g.id === 'developer-tools');
  expect(developerToolsGroup?.items.some(item => item.id === 'developer')).toBe(true);
});

test('TC-NAV-05: c_level does not see Flow Health / Sprint & Kanban / Work Explorer (restricted routes)', () => {
  const groups = getNavGroupsForRole('c_level');
  const allItemIds = groups.flatMap(g => g.items.map(i => i.id));
  expect(allItemIds).not.toContain('flow-health');
  expect(allItemIds).not.toContain('sprint-kanban');
  expect(allItemIds).not.toContain('work-explorer');
});

test('TC-NAV-06: a group with zero visible items after filtering is dropped entirely, never rendered empty', () => {
  const groups = getNavGroupsForRole('c_level');
  for (const group of groups) {
    expect(group.items.length).toBeGreaterThan(0);
  }
});

test('TC-NAV-07: a super-admin sees every group and every item — nothing over-filtered for the most privileged account', () => {
  const groups = getNavGroupsForRole('admin', true);
  const totalItems = groups.flatMap(g => g.items).length;
  const totalSourceItems = DC_NAV_GROUPS.flatMap(g => g.items).length;
  expect(totalItems).toBe(totalSourceItems);
});

// EP-025: Members directory is gated by isSuperAdmin, not by role — a regular
// admin (role: 'admin', isSuperAdmin: false/undefined) must not see it either.
test('TC-NAV-08: a regular admin (not super-admin) does not see the Members link', () => {
  const groups = getNavGroupsForRole('admin');
  const allItemIds = groups.flatMap(g => g.items.map(i => i.id));
  expect(allItemIds).not.toContain('members');
});

test('TC-NAV-09: no role sees the Members link without isSuperAdmin: true, even admin', () => {
  for (const role of ['admin', 'scrum_master', 'product_owner', 'manager', 'c_level', 'user', null, undefined]) {
    const groups = getNavGroupsForRole(role, false);
    const allItemIds = groups.flatMap(g => g.items.map(i => i.id));
    expect(allItemIds).not.toContain('members');
  }
});

test('TC-NAV-10: isSuperAdmin: true shows the Members link regardless of role', () => {
  const groups = getNavGroupsForRole('user', true);
  const allItemIds = groups.flatMap(g => g.items.map(i => i.id));
  expect(allItemIds).toContain('members');
});

// ── Navigation duplication cleanup — single-source-of-truth guarantees ──────

test('TC-NAV-11: no two items anywhere in DC_NAV_GROUPS share an id', () => {
  const ids = DC_NAV_GROUPS.flatMap(g => g.items.map(i => i.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test('TC-NAV-12: no two items anywhere in DC_NAV_GROUPS share an href — every destination appears exactly once', () => {
  const hrefs = DC_NAV_GROUPS.flatMap(g => g.items.map(i => i.href));
  expect(new Set(hrefs).size).toBe(hrefs.length);
});

test('TC-NAV-13: super-admin sees every Administration destination exactly once, not duplicated across sections', () => {
  const groups = getNavGroupsForRole('admin', true);
  const adminItems = groups.find(g => g.id === 'administration')?.items ?? [];
  const ids = adminItems.map(i => i.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(adminItems.length).toBe(8);
});

test('TC-NAV-14: getAdminNavSections groups all Owner Admin destinations into Activity / Observability / Configure with no cross-section duplicates', () => {
  const sections = getAdminNavSections('admin', true);
  expect(sections.map(s => s.label)).toEqual(['Activity', 'Observability', 'Configure']);

  const allIds = sections.flatMap(s => s.items.map(i => i.id));
  expect(new Set(allIds).size).toBe(allIds.length);

  const configureIds = sections.find(s => s.label === 'Configure')?.items.map(i => i.id) ?? [];
  expect(configureIds).toEqual(['admin-users', 'admin-settings']);
});

test('TC-NAV-15: a non-admin role gets no admin sections at all', () => {
  for (const role of ['scrum_master', 'product_owner', 'manager', 'c_level', 'user', null, undefined]) {
    expect(getAdminNavSections(role)).toEqual([]);
  }
});

test('TC-NAV-16: User Management appears exactly once across the entire nav registry (as its own Admin sidebar item, not also duplicated elsewhere)', () => {
  const allItems = DC_NAV_GROUPS.flatMap(g => g.items);
  const userManagementEntries = allItems.filter(i => i.title === 'User Management');
  expect(userManagementEntries).toHaveLength(1);
  expect(userManagementEntries[0].href).toBe('/admin/users');
});

test('TC-NAV-17: the Reference menu contains only non-admin reference/help destinations', () => {
  const referenceGroup = DC_NAV_GROUPS.find(g => g.id === 'reference');
  const hrefs = referenceGroup?.items.map(i => i.href) ?? [];
  for (const href of hrefs) {
    expect(href.startsWith('/admin')).toBe(false);
  }
});

test('TC-NAV-18: the Reference group no longer mixes the people directory or developer tooling with end-user docs', () => {
  const referenceGroup = DC_NAV_GROUPS.find(g => g.id === 'reference');
  const referenceIds = referenceGroup?.items.map(i => i.id) ?? [];
  expect(referenceIds).toEqual(['landing', 'glossary', 'help']);
  expect(referenceIds).not.toContain('members');
  expect(referenceIds).not.toContain('developer');
});

test('TC-NAV-19: Members lives in its own Directory group, Developer in its own Developer Tools group', () => {
  const directoryGroup = DC_NAV_GROUPS.find(g => g.id === 'directory');
  const developerToolsGroup = DC_NAV_GROUPS.find(g => g.id === 'developer-tools');
  expect(directoryGroup?.items.map(i => i.id)).toEqual(['members']);
  expect(developerToolsGroup?.items.map(i => i.id)).toEqual(['developer']);
});

test('TC-NAV-20: regular admin only sees organization-scoped Admin operations', () => {
  const adminItems = getNavGroupsForRole('admin', false)
    .find(g => g.id === 'administration')?.items.map(i => i.id) ?? [];
  expect(adminItems).toEqual([
    'admin-overview',
    'admin-audit',
    'admin-feedback',
    'admin-users',
  ]);
});

test('TC-NAV-21: every Admin menu destination exists in the separate Admin runtime', () => {
  const adminGroup = DC_NAV_GROUPS.find(g => g.id === 'administration');
  const runtimePaths = (adminGroup?.items ?? []).map(item => (
    item.href === '/admin' ? '/' : item.href.replace(/^\/admin/, '')
  ));
  expect(runtimePaths).toEqual([
    '/',
    '/audit',
    '/feedback',
    '/system-errors',
    '/diagnostics',
    '/security',
    '/users',
    '/settings',
  ]);
});

test('TC-NAV-22: Developer Tools carries an explicit adminOnly defense-in-depth gate', () => {
  const developer = DC_NAV_GROUPS
    .find(group => group.id === 'developer-tools')
    ?.items.find(item => item.id === 'developer');
  expect(developer?.adminOnly).toBe(true);
});
