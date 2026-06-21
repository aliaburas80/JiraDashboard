// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Pure helpers for the flat admin-settings console — shared between the page and its tests.

import { ASSIGNABLE_ROLES, type AppRole } from '@/lib/roles';
import type { RetentionSettings, RetentionStats } from '@/types/settings';
import type { HealthThresholds } from '@/types/thresholds';
import type { OrphanRules } from '@/types/orphanRules';
import type { AdminConsoleStat } from '@/components/admin/AdminConsoleLayout';

export type Tab = 'users' | 'requests' | 'retention' | 'thresholds' | 'orphan' | 'backup' | 'cloud' | 'browser' | 'config' | 'jira';

export const ADMIN_TABS: Array<{ id: Tab; label: string; icon: string; description: string }> = [
  { id: 'users',      label: 'User Management',     icon: 'people', description: 'Accounts, roles, access state' },
  { id: 'requests',   label: 'Member Requests',     icon: 'email', description: 'Pending add-member requests' },
  { id: 'config',     label: 'App Config',   icon: 'settings', description: 'SMTP, email, and app-level settings' },
  { id: 'retention',  label: 'Privacy & Retention', icon: 'lock', description: 'Data windows and cleanup' },
  { id: 'thresholds', label: 'Health Thresholds',   icon: 'priorityHigh', description: 'Delivery health rules' },
  { id: 'orphan',     label: 'Orphan Rules',        icon: 'link', description: 'Hierarchy detection rules' },
  { id: 'backup',     label: 'Backup & Restore',    icon: 'archive', description: 'Local backup bundles' },
  { id: 'cloud',      label: 'Cloud Storage',       icon: 'cloud', description: 'S3, Azure, GCP, restore' },
  { id: 'jira',       label: 'Jira Integration',    icon: 'link', description: 'Live Jira API connections (read-only, ARCH-05)' },
  { id: 'browser',    label: 'Browser Data',        icon: 'delete', description: 'Client-side cached data' },
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
        { icon: 'people', label: 'Total Users', value: String(userSummary.total), note: 'All accounts', color: 'var(--dc-p1, #F2F2F2)', toneStyle: { background: 'rgba(255,255,255,0.06)', color: '#F2F2F2' } },
        { icon: 'shield', label: 'Active Users', value: String(userSummary.active), note: userSummary.total ? `${Math.round((userSummary.active / userSummary.total) * 100)}% of total` : 'No users yet', color: '#22C55E', toneStyle: { background: 'rgba(34,197,94,0.12)', color: '#22C55E' } },
        { icon: 'priorityHigh', label: 'Admin Users', value: String(userSummary.admins), note: userSummary.total ? `${Math.round((userSummary.admins / userSummary.total) * 100)}% of total` : 'No users yet', color: 'var(--dc-acc2, #FF8A4C)', toneStyle: { background: 'rgba(232,93,18,0.12)', color: '#FF8A4C' } },
        { icon: 'teams', label: 'Role Types', value: String(ASSIGNABLE_ROLES.length), note: 'Assignable roles', color: 'var(--dc-p1, #F2F2F2)', toneStyle: { background: 'rgba(255,255,255,0.06)', color: '#F2F2F2' } },
      ];
    case 'retention':
      return [
        { icon: 'lock', label: 'Retention Window', value: retentionLabel(settings), note: settings?.autoDeleteOldLogs ? 'Auto-delete enabled' : 'Manual cleanup', color: 'var(--dc-acc2, #FF8A4C)', toneStyle: { background: 'rgba(232,93,18,0.12)', color: '#FF8A4C' } },
        { icon: 'upload', label: 'Import Logs', value: String(stats?.totalLogs ?? 0), note: `${stats?.logsEligible ?? 0} eligible`, color: 'var(--dc-p1, #F2F2F2)', toneStyle: { background: 'rgba(255,255,255,0.06)', color: '#F2F2F2' } },
        { icon: 'dashboard', label: 'Snapshots', value: String(stats?.totalSnapshots ?? 0), note: `${stats?.snapshotsEligible ?? 0} eligible`, color: 'var(--dc-p1, #F2F2F2)', toneStyle: { background: 'rgba(255,255,255,0.06)', color: '#F2F2F2' } },
        { icon: 'checkCircle', label: 'Storage Mode', value: settings?.storeUploadLogs ? 'On' : 'Off', note: settings?.storeDashboardSnapshots ? 'Snapshots stored' : 'Snapshots off', color: settings?.storeUploadLogs ? '#22C55E' : 'var(--dc-p2, #909090)', toneStyle: settings?.storeUploadLogs ? { background: 'rgba(34,197,94,0.12)', color: '#22C55E' } : { background: 'rgba(255,255,255,0.06)', color: '#909090' } },
      ];
    case 'thresholds':
      return [
        { icon: 'priorityHigh', label: 'Cycle Critical', value: `${thresholds?.cycleTimeCriticalDays ?? '—'}d`, note: 'Cycle-time hard limit', tone: 'bg-amber-50 text-amber-700' },
        { icon: 'timeline', label: 'Lead Critical', value: `${thresholds?.leadTimeCriticalDays ?? '—'}d`, note: 'Lead-time hard limit' },
        { icon: 'workItem', label: 'Active Age', value: `${thresholds?.activeAgeCriticalDays ?? '—'}d`, note: 'Work-item age limit' },
        { icon: 'warning', label: 'Blocked Ratio', value: `${thresholds?.blockedRatioWarningPct ?? '—'}%`, note: 'Warning threshold' },
      ];
    case 'orphan':
      return [
        { icon: 'link', label: 'Parent Fields', value: String(orphanRules?.parentLinkFields?.length ?? 0), note: 'Hierarchy sources', tone: 'bg-blue-50 text-blue-700' },
        { icon: 'workItems', label: 'Exempt Types', value: String(orphanRules?.exemptIssueTypes?.length ?? 0), note: 'Ignored issue types' },
        { icon: 'subtasks', label: 'Sub-task Rule', value: orphanRules?.flagSubTasksWithoutParent ? 'On' : 'Off', note: 'Parent validation' },
        { icon: 'priorityHigh', label: 'Risk Threshold', value: `${orphanRules?.riskThresholdPct ?? '—'}%`, note: 'Warning threshold' },
      ];
    case 'backup':
      return [
        { icon: 'archive', label: 'Backup Files', value: String(backupFiles?.length ?? 0), note: 'Local bundles', tone: 'bg-blue-50 text-blue-700' },
        { icon: 'checkCircle', label: 'Included', value: String(includedBackups), note: 'Ready to restore' },
        { icon: 'statusSuccess', label: 'Latest Backup', value: latestBackup, note: backupFiles?.length ? 'Backup detected' : 'No backup found' },
        { icon: 'folder', label: 'Restore Path', value: 'Local', note: 'Server filesystem' },
      ];
    case 'cloud':
      return [
        { icon: 'cloud', label: 'Provider Setup', value: 'Cloud', note: 'S3, Azure, GCP', tone: 'bg-blue-50 text-blue-700' },
        { icon: 'checkCircle', label: 'Backup State', value: latestBackup, note: backupFiles?.length ? 'Backup available' : 'No backup found' },
        { icon: 'archive', label: 'Local Bundles', value: String(backupFiles?.length ?? 0), note: 'Known backup files' },
        { icon: 'retry', label: 'Recovery', value: 'Ready', note: 'Test provider first' },
      ];
    case 'jira':
      return [
        { icon: 'link', label: 'Connections', value: 'Manage', note: 'Cloud or Server/DC', tone: 'bg-blue-50 text-blue-700' },
        { icon: 'checkCircle', label: 'Access', value: 'Read-only', note: 'No write-back (ARCH-05)' },
        { icon: 'lock', label: 'Credentials', value: 'App Config', note: 'Token encrypted, never stored in DB' },
        { icon: 'retry', label: 'Sync', value: 'Manual', note: 'Scheduled sync not yet built' },
      ];
    case 'requests':
      return [
        { icon: 'email', label: 'Requests', value: 'Inbox', note: 'Pending add-member requests', tone: 'bg-amber-50 text-amber-700' },
        { icon: 'checkCircle', label: 'Accept', value: 'Creates account', note: 'With first-login password' },
        { icon: 'cross', label: 'Reject', value: 'Notifies requester', note: 'Optional decision note' },
        { icon: 'lock', label: 'Self-approval', value: 'Blocked', note: 'Admin cannot approve own' },
      ];
    case 'browser':
      return [
        { icon: 'delete', label: 'Browser Data', value: 'Local', note: 'Client-side cache', tone: 'bg-red-50 text-red-700' },
        { icon: 'target', label: 'Scope', value: 'This device', note: 'Browser storage only' },
        { icon: 'lock', label: 'Server Data', value: 'Safe', note: 'Not cleared here' },
        { icon: 'checkCircle', label: 'Admin Action', value: 'Manual', note: 'Confirmation required' },
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
