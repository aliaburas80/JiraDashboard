// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Pure helpers for the flat admin-settings console — shared between the page and its tests.

import { ASSIGNABLE_ROLES, type AppRole } from '@/lib/roles';
import type { RetentionSettings, RetentionStats } from '@/types/settings';
import type { HealthThresholds } from '@/types/thresholds';
import type { OrphanRules } from '@/types/orphanRules';
import type { AdminConsoleStat } from '@/components/admin/AdminConsoleLayout';

export type Tab = 'users' | 'requests' | 'retention' | 'thresholds' | 'orphan' | 'backup' | 'cloud' | 'browser';

export const ADMIN_TABS: Array<{ id: Tab; label: string; icon: string; description: string }> = [
  { id: 'users',      label: 'User Management',     icon: '👥', description: 'Accounts, roles, access state' },
  { id: 'requests',   label: 'Member Requests',     icon: '📬', description: 'Pending add-member requests' },
  { id: 'retention',  label: 'Privacy & Retention', icon: '🔒', description: 'Data windows and cleanup' },
  { id: 'thresholds', label: 'Health Thresholds',   icon: '⚡', description: 'Delivery health rules' },
  { id: 'orphan',     label: 'Orphan Rules',        icon: '👻', description: 'Hierarchy detection rules' },
  { id: 'backup',     label: 'Backup & Restore',    icon: '🗄️', description: 'Local backup bundles' },
  { id: 'cloud',      label: 'Cloud Storage',       icon: '☁️', description: 'S3, Azure, GCP, restore' },
  { id: 'browser',    label: 'Browser Data',        icon: '🗑️', description: 'Client-side cached data' },
];

export function activeTabMeta(tab: Tab) {
  return ADMIN_TABS.find(item => item.id === tab) ?? ADMIN_TABS[0];
}

export function retentionLabel(settings: RetentionSettings | null): string {
  if (!settings) return 'Loading';
  return settings.retentionDays === -1 ? 'Forever' : `${settings.retentionDays} days`;
}

export function buildSettingsStats({
  tab,
  userSummary,
  settings,
  stats,
  thresholds,
  orphanRules,
  backupFiles,
}: {
  tab: Tab;
  userSummary: { total: number; active: number; admins: number };
  settings: RetentionSettings | null;
  stats: RetentionStats | null;
  thresholds: HealthThresholds | null;
  orphanRules: OrphanRules | null;
  backupFiles: any[];
}): AdminConsoleStat[] {
  const latestBackup = backupFiles?.some(file => file.included) ? 'Available' : 'Not yet';
  const includedBackups = backupFiles?.filter(file => file.included).length ?? 0;

  switch (tab) {
    case 'users':
      return [
        { icon: '👥', label: 'Total Users', value: String(userSummary.total), note: 'All accounts', tone: 'bg-blue-50 text-blue-700' },
        { icon: '🛡', label: 'Active Users', value: String(userSummary.active), note: userSummary.total ? `${Math.round((userSummary.active / userSummary.total) * 100)}% of total` : 'No users yet' },
        { icon: '↥', label: 'Admin Users', value: String(userSummary.admins), note: userSummary.total ? `${Math.round((userSummary.admins / userSummary.total) * 100)}% of total` : 'No users yet' },
        { icon: '▣', label: 'Role Types', value: String(ASSIGNABLE_ROLES.length), note: 'Assignable roles' },
      ];
    case 'retention':
      return [
        { icon: '🔒', label: 'Retention Window', value: retentionLabel(settings), note: settings?.autoDeleteOldLogs ? 'Auto-delete enabled' : 'Manual cleanup' },
        { icon: '↥', label: 'Import Logs', value: String(stats?.totalLogs ?? 0), note: `${stats?.logsEligible ?? 0} eligible` },
        { icon: '▣', label: 'Snapshots', value: String(stats?.totalSnapshots ?? 0), note: `${stats?.snapshotsEligible ?? 0} eligible` },
        { icon: '✓', label: 'Storage Mode', value: settings?.storeUploadLogs ? 'On' : 'Off', note: settings?.storeDashboardSnapshots ? 'Snapshots stored' : 'Snapshots off' },
      ];
    case 'thresholds':
      return [
        { icon: '⚡', label: 'Cycle Critical', value: `${thresholds?.cycleTimeCriticalDays ?? '—'}d`, note: 'Cycle-time hard limit', tone: 'bg-amber-50 text-amber-700' },
        { icon: '↥', label: 'Lead Critical', value: `${thresholds?.leadTimeCriticalDays ?? '—'}d`, note: 'Lead-time hard limit' },
        { icon: '▣', label: 'Active Age', value: `${thresholds?.activeAgeCriticalDays ?? '—'}d`, note: 'Work-item age limit' },
        { icon: '⚖', label: 'Blocked Ratio', value: `${thresholds?.blockedRatioWarningPct ?? '—'}%`, note: 'Warning threshold' },
      ];
    case 'orphan':
      return [
        { icon: '⚖', label: 'Parent Fields', value: String(orphanRules?.parentLinkFields?.length ?? 0), note: 'Hierarchy sources', tone: 'bg-blue-50 text-blue-700' },
        { icon: '▣', label: 'Exempt Types', value: String(orphanRules?.exemptIssueTypes?.length ?? 0), note: 'Ignored issue types' },
        { icon: '↥', label: 'Sub-task Rule', value: orphanRules?.flagSubTasksWithoutParent ? 'On' : 'Off', note: 'Parent validation' },
        { icon: '⚡', label: 'Risk Threshold', value: `${orphanRules?.riskThresholdPct ?? '—'}%`, note: 'Warning threshold' },
      ];
    case 'backup':
      return [
        { icon: '🗄️', label: 'Backup Files', value: String(backupFiles?.length ?? 0), note: 'Local bundles', tone: 'bg-blue-50 text-blue-700' },
        { icon: '▣', label: 'Included', value: String(includedBackups), note: 'Ready to restore' },
        { icon: '✓', label: 'Latest Backup', value: latestBackup, note: backupFiles?.length ? 'Backup detected' : 'No backup found' },
        { icon: '↥', label: 'Restore Path', value: 'Local', note: 'Server filesystem' },
      ];
    case 'cloud':
      return [
        { icon: '☁️', label: 'Provider Setup', value: 'Cloud', note: 'S3, Azure, GCP', tone: 'bg-blue-50 text-blue-700' },
        { icon: '✓', label: 'Backup State', value: latestBackup, note: backupFiles?.length ? 'Backup available' : 'No backup found' },
        { icon: '↥', label: 'Local Bundles', value: String(backupFiles?.length ?? 0), note: 'Known backup files' },
        { icon: '▣', label: 'Recovery', value: 'Ready', note: 'Test provider first' },
      ];
    case 'requests':
      return [
        { icon: '📬', label: 'Requests', value: 'Inbox', note: 'Pending add-member requests', tone: 'bg-amber-50 text-amber-700' },
        { icon: '✓', label: 'Accept', value: 'Creates account', note: 'With first-login password' },
        { icon: '✕', label: 'Reject', value: 'Notifies requester', note: 'Optional decision note' },
        { icon: '🔒', label: 'Self-approval', value: 'Blocked', note: 'Admin cannot approve own' },
      ];
    case 'browser':
      return [
        { icon: '🗑️', label: 'Browser Data', value: 'Local', note: 'Client-side cache', tone: 'bg-red-50 text-red-700' },
        { icon: '▣', label: 'Scope', value: 'This device', note: 'Browser storage only' },
        { icon: '🔒', label: 'Server Data', value: 'Safe', note: 'Not cleared here' },
        { icon: '✓', label: 'Admin Action', value: 'Manual', note: 'Confirmation required' },
      ];
    default:
      return [];
  }
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  roleLabel: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  importCount: number;
  snapshotCount: number;
}

export function roleOptionsFor(user?: ManagedUser): AppRole[] {
  return user?.role === 'user' ? ['user', ...ASSIGNABLE_ROLES] : ASSIGNABLE_ROLES;
}

export function matchesUserFilter(user: ManagedUser, query: string, roleFilter: AppRole | 'all'): boolean {
  const searchText = `${user.name} ${user.email}`.toLowerCase();
  const matchesQuery = !query.trim() || searchText.includes(query.trim().toLowerCase());
  const matchesRole = roleFilter === 'all' || user.role === roleFilter;
  return matchesQuery && matchesRole;
}
