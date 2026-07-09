// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
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
    isSuperAdmin: false,
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
    const requestsTab = activeTabMeta('requests');
    expect(requestsTab.label).toBe('Member Requests');
    expect(requestsTab.description.length).toBeGreaterThan(0);

    const cloudTab = activeTabMeta('cloud');
    expect(cloudTab.id).toBe('cloud');
    expect(cloudTab.label).toBe('Cloud Storage');
  });

  test('activeTabMeta falls back to the first tab for an unknown id', () => {
    expect(activeTabMeta('does-not-exist' as Tab)).toBe(ADMIN_TABS[0]);
  });

  test('ADMIN_TABS lists every console tab with a label and an icon for the sidebar — no "users" tab (removed, not just hidden; see TC-NAV-18)', () => {
    const ids = ADMIN_TABS.map(item => item.id);
    expect(ids).toEqual(['requests', 'config', 'retention', 'thresholds', 'orphan', 'issueTypes', 'backup', 'cloud', 'jira', 'browser', 'personaPreview']);
    expect(ids).not.toContain('users');
    ADMIN_TABS.forEach(item => {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
    });
  });
});

// ── TC-AC-02: switching tabs changes the active panel without changing the layout ──

describe('TC-AC-02: switching tabs updates the active tab and its stats in place', () => {
  test('selecting a different tab changes the resolved tab metadata', () => {
    expect(activeTabMeta('requests').id).toBe('requests');
    expect(activeTabMeta('retention').id).toBe('retention');
    expect(activeTabMeta('requests').id).not.toBe(activeTabMeta('retention').id);
  });

  test('buildSettingsStats returns tab-specific cards for each tab while keeping the layout contract', () => {
    const tabs: Tab[] = ['requests', 'retention', 'thresholds', 'orphan', 'issueTypes', 'backup', 'cloud', 'jira', 'browser'];
    tabs.forEach(tab => {
      const cards = buildSettingsStats({ tab, ...baseStatsArgs });
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach(card => {
        expect(typeof card.label).toBe('string');
        expect(typeof card.value).toBe('string');
      });
    });
  });

  test('buildSettingsStats reflects the selected tab — requests vs. retention produce different cards', () => {
    const requestsCards = buildSettingsStats({ tab: 'requests', ...baseStatsArgs });
    const retentionCards = buildSettingsStats({ tab: 'retention', ...baseStatsArgs });
    expect(requestsCards.map(c => c.label)).not.toEqual(retentionCards.map(c => c.label));
  });

  test('buildSettingsStats returns no cards for an unrecognised tab (including the removed "users" tab)', () => {
    expect(buildSettingsStats({ tab: 'unknown' as Tab, ...baseStatsArgs })).toEqual([]);
    expect(buildSettingsStats({ tab: 'users' as Tab, ...baseStatsArgs })).toEqual([]);
  });
});

// ── TC-AC-03: user-management helpers used by the standalone /admin/users page ──
// buildSettingsStats no longer has a 'users' case (that tab was removed
// entirely — see TC-NAV-18) but roleOptionsFor/matchesUserFilter remain
// exported for /admin/users/page.tsx, which is now the only place that
// manages users. Tested here since that's still their home module.

describe('TC-AC-03: user-management helpers (roleOptionsFor, matchesUserFilter)', () => {
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

// ── Navigation duplication cleanup ──────────────────────────────────────────
// User Management appeared twice: once as its own top-level Admin sidebar
// item (/admin/users), and again as a "users" tab inside Settings — a full
// duplicate *implementation*, not just a duplicate menu entry (both hit
// GET/POST /api/admin/users independently). Per explicit follow-up
// instruction, the Settings-tab version was removed entirely (not just
// hidden from nav) — only /admin/users remains.

describe('TC-NAV-18: Settings no longer has a "users" tab at all — User Management exists only at /admin/users', () => {
  test('ADMIN_TABS contains no "users" entry', () => {
    const ids: string[] = ADMIN_TABS.map(item => item.id);
    expect(ids).not.toContain('users');
  });

  test('requests (Member Requests) is the first tab, per "keep Member Requests inside Settings"', () => {
    expect(ADMIN_TABS[0].id).toBe('requests');
  });

  test('personaPreview remains superAdminOnly, filtered independently of the users-tab removal', () => {
    const visibleForAdmin = ADMIN_TABS.filter(item => !item.superAdminOnly);
    const visibleForSuperAdmin = ADMIN_TABS;
    expect(visibleForAdmin.map(i => i.id)).not.toContain('personaPreview');
    expect(visibleForSuperAdmin.map(i => i.id)).toContain('personaPreview');
  });
});
