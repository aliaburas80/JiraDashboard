// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Flat admin-settings console tests — TC-AC-01 to TC-AC-03

import {
  type Tab,
  type ManagedUser,
  ADMIN_TABS,
  activeTabMeta,
  buildSettingsStats,
  roleOptionsFor,
  matchesUserFilter,
} from '../lib/adminConsole';

const baseStatsArgs = {
  userSummary: { total: 10, active: 8, admins: 2 },
  settings: null,
  stats: null,
  thresholds: null,
  orphanRules: null,
  issueTypeHierarchy: null,
  backupFiles: [] as any[],
};

function userFor(overrides: Partial<ManagedUser> = {}): ManagedUser {
  return {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'user',
    roleLabel: 'User',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: null,
    importCount: 0,
    snapshotCount: 0,
    ...overrides,
  };
}

// ── TC-AC-01: current tab name and status badge are derivable from the active tab ──

describe('TC-AC-01: flat admin console exposes current tab name and status', () => {
  test('activeTabMeta resolves the selected tab to its label and description', () => {
    const usersTab = activeTabMeta('users');
    expect(usersTab.label).toBe('User Management');
    expect(usersTab.description.length).toBeGreaterThan(0);

    const cloudTab = activeTabMeta('cloud');
    expect(cloudTab.id).toBe('cloud');
    expect(cloudTab.label).toBe('Cloud Storage');
  });

  test('activeTabMeta falls back to the first tab for an unknown id', () => {
    expect(activeTabMeta('does-not-exist' as Tab)).toBe(ADMIN_TABS[0]);
  });

  test('ADMIN_TABS lists every console tab with a label and an icon for the sidebar', () => {
    const ids = ADMIN_TABS.map(item => item.id);
    expect(ids).toEqual(['users', 'requests', 'config', 'retention', 'thresholds', 'orphan', 'issueTypes', 'backup', 'cloud', 'jira', 'browser']);
    ADMIN_TABS.forEach(item => {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
    });
  });
});

// ── TC-AC-02: switching tabs changes the active panel without changing the layout ──

describe('TC-AC-02: switching tabs updates the active tab and its stats in place', () => {
  test('selecting a different tab changes the resolved tab metadata', () => {
    expect(activeTabMeta('users').id).toBe('users');
    expect(activeTabMeta('retention').id).toBe('retention');
    expect(activeTabMeta('users').id).not.toBe(activeTabMeta('retention').id);
  });

  test('buildSettingsStats returns tab-specific cards for each tab while keeping the layout contract', () => {
    const tabs: Tab[] = ['users', 'requests', 'retention', 'thresholds', 'orphan', 'issueTypes', 'backup', 'cloud', 'jira', 'browser'];
    tabs.forEach(tab => {
      const cards = buildSettingsStats({ tab, ...baseStatsArgs });
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach(card => {
        expect(typeof card.label).toBe('string');
        expect(typeof card.value).toBe('string');
      });
    });
  });

  test('buildSettingsStats reflects the selected tab — users vs. retention produce different cards', () => {
    const usersCards = buildSettingsStats({ tab: 'users', ...baseStatsArgs });
    const retentionCards = buildSettingsStats({ tab: 'retention', ...baseStatsArgs });
    expect(usersCards.map(c => c.label)).not.toEqual(retentionCards.map(c => c.label));
    expect(usersCards.find(c => c.label === 'Total Users')?.value).toBe('10');
  });

  test('buildSettingsStats returns no cards for an unrecognised tab', () => {
    expect(buildSettingsStats({ tab: 'unknown' as Tab, ...baseStatsArgs })).toEqual([]);
  });
});

// ── TC-AC-03: Users tab is table-first with inline role/status editing and summary cards ──

describe('TC-AC-03: Users tab summary cards and inline role/status editing', () => {
  test('buildSettingsStats summarises the user table — totals, active share, admin share', () => {
    const cards = buildSettingsStats({ tab: 'users', ...baseStatsArgs, userSummary: { total: 4, active: 2, admins: 1 } });
    expect(cards.find(c => c.label === 'Total Users')?.value).toBe('4');
    expect(cards.find(c => c.label === 'Active Users')?.note).toBe('50% of total');
    expect(cards.find(c => c.label === 'Admin Users')?.note).toBe('25% of total');
  });

  test('buildSettingsStats avoids divide-by-zero notes when there are no users yet', () => {
    const cards = buildSettingsStats({ tab: 'users', ...baseStatsArgs, userSummary: { total: 0, active: 0, admins: 0 } });
    expect(cards.find(c => c.label === 'Active Users')?.note).toBe('No users yet');
    expect(cards.find(c => c.label === 'Admin Users')?.note).toBe('No users yet');
  });

  test('roleOptionsFor offers the user role plus assignable roles for plain users, and excludes it for elevated roles', () => {
    const plainUserOptions = roleOptionsFor(userFor({ role: 'user' }));
    expect(plainUserOptions[0]).toBe('user');
    expect(plainUserOptions).toContain('user');

    const adminOptions = roleOptionsFor(userFor({ role: 'admin' }));
    expect(adminOptions).not.toContain('user');
  });

  test('matchesUserFilter narrows the inline-editable table by name/email search and role', () => {
    const jane = userFor({ name: 'Jane Doe', email: 'jane@example.com', role: 'admin' });
    const bob = userFor({ id: 'user-2', name: 'Bob Smith', email: 'bob@example.com', role: 'user' });

    expect(matchesUserFilter(jane, 'jane', 'all')).toBe(true);
    expect(matchesUserFilter(jane, 'bob', 'all')).toBe(false);
    expect(matchesUserFilter(jane, '', 'admin')).toBe(true);
    expect(matchesUserFilter(bob, '', 'admin')).toBe(false);
    expect(matchesUserFilter(bob, 'bob', 'user')).toBe(true);
  });
});
