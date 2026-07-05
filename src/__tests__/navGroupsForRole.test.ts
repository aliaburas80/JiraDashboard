// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-019: nav menus (AppShell.tsx, DashboardTopbar.tsx) must only show groups/items
// the current role can actually open — found showing everything to every role
// regardless of access (both had a "no role-based filtering in the nav" comment).

import { getNavGroupsForRole, DC_NAV_GROUPS } from '../components/dc-shell/navigation';

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
    const referenceGroup = groups.find(g => g.id === 'reference');
    expect(referenceGroup?.items.some(item => item.id === 'developer')).toBeFalsy();
  }
});

test('TC-NAV-04: admin sees the Developer link', () => {
  const groups = getNavGroupsForRole('admin');
  const referenceGroup = groups.find(g => g.id === 'reference');
  expect(referenceGroup?.items.some(item => item.id === 'developer')).toBe(true);
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
