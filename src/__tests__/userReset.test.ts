// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-023: manual admin reset for non-@deliveryclarity.app users — TC-RESET-01 to TC-RESET-14.

const mockFindUnique   = jest.fn();
const mockWorkspaceFindFirst = jest.fn();
const mockImportLogCount = jest.fn();
const mockSnapshotCount = jest.fn();
const mockConnectionCount = jest.fn();
const mockAppSettingCount = jest.fn();
const mockImportLogDeleteMany = jest.fn();
const mockSnapshotDeleteMany  = jest.fn();
const mockConnectionDeleteMany = jest.fn();
const mockAppSettingDeleteMany = jest.fn();
const mockUserFindMany = jest.fn();
const mockSafeAuditEvent = jest.fn();
const mockExistsSync = jest.fn();
const mockUnlinkSync  = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      findMany:   (...a: unknown[]) => mockUserFindMany(...a),
    },
    workspace: {
      findFirst: (...a: unknown[]) => mockWorkspaceFindFirst(...a),
    },
    importLog: {
      count:      (...a: unknown[]) => mockImportLogCount(...a),
      deleteMany: (...a: unknown[]) => mockImportLogDeleteMany(...a),
    },
    dashboardSnapshot: {
      count:      (...a: unknown[]) => mockSnapshotCount(...a),
      deleteMany: (...a: unknown[]) => mockSnapshotDeleteMany(...a),
    },
    jiraConnection: {
      count:      (...a: unknown[]) => mockConnectionCount(...a),
      deleteMany: (...a: unknown[]) => mockConnectionDeleteMany(...a),
    },
    appSetting: {
      count:      (...a: unknown[]) => mockAppSettingCount(...a),
      deleteMany: (...a: unknown[]) => mockAppSettingDeleteMany(...a),
    },
  },
}));

jest.mock('../lib/system-error-logger', () => ({
  safeAuditEvent: (...a: unknown[]) => mockSafeAuditEvent(...a),
}));

jest.mock('../services/metrics/latestMetricsStorage', () => ({
  metricsScopeFileDir: () => '/fake/data/metrics',
}));

jest.mock('fs', () => ({
  existsSync: (...a: unknown[]) => mockExistsSync(...a),
  unlinkSync: (...a: unknown[]) => mockUnlinkSync(...a),
}));

import {
  previewUserReset,
  resetUserData,
  listExternalUsersEligibleForReset,
} from '../services/settings/userReset.service';

const EXTERNAL_USER = { id: 'user-ext-1', email: 'someone@othercompany.com' };
const INTERNAL_USER = { id: 'user-int-1', email: 'ali@deliveryclarity.app' };

beforeEach(() => {
  jest.clearAllMocks();
  mockWorkspaceFindFirst.mockResolvedValue(null);
  mockAppSettingCount.mockResolvedValue(0);
  mockAppSettingDeleteMany.mockResolvedValue({ count: 0 });
  mockExistsSync.mockReturnValue(false);
});

// TC-RESET-01: preview blocks an internal @deliveryclarity.app account
test('TC-RESET-01: previewUserReset blocks an internal @deliveryclarity.app account', async () => {
  mockFindUnique.mockResolvedValue(INTERNAL_USER);
  const preview = await previewUserReset(INTERNAL_USER.id);
  expect(preview.blocked).toBe(true);
  expect(preview.blockedReason).toContain('deliveryclarity.app');
  expect(mockImportLogCount).not.toHaveBeenCalled();
});

// TC-RESET-02: preview reports correct counts for an eligible external user
test('TC-RESET-02: previewUserReset reports correct counts for an external user', async () => {
  mockFindUnique.mockResolvedValue(EXTERNAL_USER);
  mockImportLogCount.mockResolvedValue(3);
  mockSnapshotCount.mockResolvedValue(2);
  mockConnectionCount.mockResolvedValue(1);
  mockAppSettingCount.mockResolvedValue(2);
  mockExistsSync.mockReturnValue(true);

  const preview = await previewUserReset(EXTERNAL_USER.id);
  expect(preview.blocked).toBe(false);
  expect(preview.importLogs).toBe(3);
  expect(preview.dashboardSnapshots).toBe(2);
  expect(preview.jiraConnections).toBe(1);
  expect(preview.reportShares).toBe(2);
  expect(preview.hasScopedMetricsFile).toBe(true);
});

// TC-RESET-03: preview throws for an unknown user id
test('TC-RESET-03: previewUserReset throws when the user does not exist', async () => {
  mockFindUnique.mockResolvedValue(null);
  await expect(previewUserReset('nonexistent')).rejects.toThrow('User not found.');
});

// TC-RESET-04: reset refuses an internal account and deletes nothing
test('TC-RESET-04: resetUserData refuses an internal @deliveryclarity.app account', async () => {
  mockFindUnique.mockResolvedValue(INTERNAL_USER);
  const result = await resetUserData(INTERNAL_USER.id, 'admin-1');
  expect(result.success).toBe(false);
  expect(result.error).toContain('deliveryclarity.app');
  expect(mockImportLogDeleteMany).not.toHaveBeenCalled();
  expect(mockSnapshotDeleteMany).not.toHaveBeenCalled();
  expect(mockConnectionDeleteMany).not.toHaveBeenCalled();
  expect(mockAppSettingDeleteMany).not.toHaveBeenCalled();
});

// TC-RESET-05: reset deletes the external user's data and logs an audit event
test('TC-RESET-05: resetUserData deletes an external user\'s workspace data, public report shares, and audits it', async () => {
  mockFindUnique.mockResolvedValue(EXTERNAL_USER);
  mockImportLogCount.mockResolvedValue(4);
  mockSnapshotCount.mockResolvedValue(1);
  mockConnectionCount.mockResolvedValue(0);
  mockAppSettingCount.mockResolvedValue(2);
  mockImportLogDeleteMany.mockResolvedValue({ count: 4 });
  mockSnapshotDeleteMany.mockResolvedValue({ count: 1 });
  mockConnectionDeleteMany.mockResolvedValue({ count: 0 });
  mockAppSettingDeleteMany.mockResolvedValue({ count: 2 });
  mockExistsSync.mockReturnValue(true);

  const result = await resetUserData(EXTERNAL_USER.id, 'admin-1');
  expect(result.success).toBe(true);
  expect(result.importLogsDeleted).toBe(4);
  expect(result.snapshotsDeleted).toBe(1);
  expect(result.jiraConnectionsDeleted).toBe(0);
  expect(result.reportSharesDeleted).toBe(2);
  expect(mockImportLogDeleteMany).toHaveBeenCalledWith({ where: { userId: EXTERNAL_USER.id } });
  expect(mockConnectionDeleteMany).toHaveBeenCalledWith({ where: { createdByUserId: EXTERNAL_USER.id } });
  expect(mockAppSettingDeleteMany).toHaveBeenCalledWith({
    where: { ownerId: EXTERNAL_USER.id, key: { startsWith: 'report-share:' } },
  });
  expect(mockUnlinkSync).toHaveBeenCalled();
  expect(mockSafeAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
    userId: 'admin-1',
    eventType: 'user_data_reset',
  }));
});

// TC-RESET-06: reset never touches the account itself
test('TC-RESET-06: resetUserData never calls prisma.user.update/delete — the account is untouched', async () => {
  mockFindUnique.mockResolvedValue(EXTERNAL_USER);
  mockImportLogDeleteMany.mockResolvedValue({ count: 0 });
  mockSnapshotDeleteMany.mockResolvedValue({ count: 0 });
  mockConnectionDeleteMany.mockResolvedValue({ count: 0 });

  await resetUserData(EXTERNAL_USER.id, 'admin-1');
  // The mocked prisma.user object only exposes findUnique/findMany — if the
  // service tried to call .update or .delete on it, this would throw.
  expect(mockFindUnique).toHaveBeenCalled();
});

// TC-RESET-07: reset does not fail if there's no scoped metrics file to delete
test('TC-RESET-07: resetUserData succeeds even when there is no scoped metrics file', async () => {
  mockFindUnique.mockResolvedValue(EXTERNAL_USER);
  mockImportLogDeleteMany.mockResolvedValue({ count: 0 });
  mockSnapshotDeleteMany.mockResolvedValue({ count: 0 });
  mockConnectionDeleteMany.mockResolvedValue({ count: 0 });
  mockExistsSync.mockReturnValue(false);

  const result = await resetUserData(EXTERNAL_USER.id, 'admin-1');
  expect(result.success).toBe(true);
  expect(mockUnlinkSync).not.toHaveBeenCalled();
});

// TC-RESET-08: eligible-users list excludes internal accounts via the query itself
test('TC-RESET-08: listExternalUsersEligibleForReset queries excluding @deliveryclarity.app', async () => {
  mockUserFindMany.mockResolvedValue([EXTERNAL_USER]);
  const list = await listExternalUsersEligibleForReset();
  expect(list).toEqual([EXTERNAL_USER]);
  const callArg = mockUserFindMany.mock.calls[0][0];
  expect(callArg.where.NOT.email.endsWith).toBe('@deliveryclarity.app');
});

// TC-RESET-09: preview scope key prefers the user's workspace over a bare user key
test('TC-RESET-09: previewUserReset checks the scoped metrics file under the user\'s workspace when one exists', async () => {
  mockFindUnique.mockResolvedValue(EXTERNAL_USER);
  mockWorkspaceFindFirst.mockResolvedValue({ id: 'ws-77' });
  mockImportLogCount.mockResolvedValue(0);
  mockSnapshotCount.mockResolvedValue(0);
  mockConnectionCount.mockResolvedValue(0);

  await previewUserReset(EXTERNAL_USER.id);
  expect(mockExistsSync).toHaveBeenCalledWith('/fake/data/metrics/ws_ws-77.json');
});

// TC-RESET-10: reset is case-insensitive about the internal domain check
test('TC-RESET-10: internal-domain check is case-insensitive', async () => {
  mockFindUnique.mockResolvedValue({ id: 'user-int-2', email: 'Someone@DeliveryClarity.App' });
  const preview = await previewUserReset('user-int-2');
  expect(preview.blocked).toBe(true);
});

// TC-RESET-11: super-admin is protected regardless of email domain
test('TC-RESET-11: previewUserReset blocks the super-admin even with a non-internal email', async () => {
  mockFindUnique.mockResolvedValue({ id: 'user-super-1', email: 'root@othercompany.com', isSuperAdmin: true });
  const preview = await previewUserReset('user-super-1');
  expect(preview.blocked).toBe(true);
  expect(preview.blockedReason).toContain('super-admin');
  expect(mockImportLogCount).not.toHaveBeenCalled();
});

// TC-RESET-12: resetUserData refuses the super-admin and deletes nothing
test('TC-RESET-12: resetUserData refuses the super-admin account and deletes nothing', async () => {
  mockFindUnique.mockResolvedValue({ id: 'user-super-1', email: 'root@othercompany.com', isSuperAdmin: true });
  const result = await resetUserData('user-super-1', 'admin-1');
  expect(result.success).toBe(false);
  expect(result.error).toContain('super-admin');
  expect(mockImportLogDeleteMany).not.toHaveBeenCalled();
  expect(mockAppSettingDeleteMany).not.toHaveBeenCalled();
});

// TC-RESET-13: eligible-users list excludes the super-admin via the query itself
test('TC-RESET-13: listExternalUsersEligibleForReset queries excluding isSuperAdmin', async () => {
  mockUserFindMany.mockResolvedValue([EXTERNAL_USER]);
  await listExternalUsersEligibleForReset();
  const callArg = mockUserFindMany.mock.calls[0][0];
  expect(callArg.where.isSuperAdmin).toBe(false);
});

// TC-RESET-14: preview scopes report-share count to the target user and report-share namespace
test('TC-RESET-14: previewUserReset counts only the target user\'s report shares', async () => {
  mockFindUnique.mockResolvedValue(EXTERNAL_USER);
  mockImportLogCount.mockResolvedValue(0);
  mockSnapshotCount.mockResolvedValue(0);
  mockConnectionCount.mockResolvedValue(0);
  mockAppSettingCount.mockResolvedValue(3);

  const preview = await previewUserReset(EXTERNAL_USER.id);
  expect(preview.reportShares).toBe(3);
  expect(mockAppSettingCount).toHaveBeenCalledWith({
    where: { ownerId: EXTERNAL_USER.id, key: { startsWith: 'report-share:' } },
  });
});
