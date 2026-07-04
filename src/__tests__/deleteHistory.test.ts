// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Delete import history tests — TC-DH-01 to TC-DH-10

// These tests cover the business logic around delete operations.
// The actual Prisma calls are mocked so no real DB is needed.

jest.mock('../lib/prisma', () => ({
  prisma: {
    importLog: {
      findUnique: jest.fn(),
      delete:     jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
    },
    dashboardSnapshot: {
      findUnique: jest.fn(),
      delete:     jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
    auditEvent: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

import { deleteImportLog, deleteAllUserLogs, deleteDashboardSnapshot, clearAllData } from '../services/settings/dataRetention.service';
import { prisma } from '../lib/prisma';

const USER_ID  = 'user-123';
const ADMIN_ID = 'admin-456';
const LOG_ID   = 'log-abc';
const SNAP_ID  = 'snap-xyz';

// TC-DH-01: User can delete their own log
test('TC-DH-01: user can delete their own import log', async () => {
  (prisma.importLog.findUnique as jest.Mock).mockResolvedValue({
    id: LOG_ID, userId: USER_ID, fileName: 'jira.csv',
  });
  const result = await deleteImportLog(LOG_ID, USER_ID, false);
  expect(result.success).toBe(true);
  expect(prisma.importLog.delete).toHaveBeenCalledWith({ where: { id: LOG_ID } });
});

// TC-DH-02: User cannot delete another user's log
test('TC-DH-02: user cannot delete another user\'s log', async () => {
  (prisma.importLog.findUnique as jest.Mock).mockResolvedValue({
    id: LOG_ID, userId: 'other-user', fileName: 'jira.csv',
  });
  const result = await deleteImportLog(LOG_ID, USER_ID, false);
  expect(result.success).toBe(false);
  expect(result.error).toContain('own import logs');
});

// TC-DH-03: Admin can delete any log
test('TC-DH-03: admin can delete any user\'s log', async () => {
  (prisma.importLog.findUnique as jest.Mock).mockResolvedValue({
    id: LOG_ID, userId: 'other-user', fileName: 'jira.csv',
  });
  const result = await deleteImportLog(LOG_ID, ADMIN_ID, true);
  expect(result.success).toBe(true);
});

// TC-DH-04: Delete non-existent log returns error
test('TC-DH-04: deleting non-existent log returns error', async () => {
  (prisma.importLog.findUnique as jest.Mock).mockResolvedValue(null);
  const result = await deleteImportLog('bad-id', USER_ID, false);
  expect(result.success).toBe(false);
  expect(result.error).toContain('not found');
});

// TC-DH-05: deleteAllUserLogs — user can delete own logs
test('TC-DH-05: user can delete all their own logs', async () => {
  const result = await deleteAllUserLogs(USER_ID, USER_ID, false);
  expect(result.success).toBe(true);
  expect(result.deleted).toBe(5);
  expect(prisma.importLog.deleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
});

// TC-DH-06: deleteAllUserLogs — user cannot delete others' logs
test('TC-DH-06: user cannot delete another user\'s all logs', async () => {
  const result = await deleteAllUserLogs('other-user', USER_ID, false);
  expect(result.success).toBe(false);
  expect(result.error).toContain('own logs');
});

// TC-DH-07: Admin can delete any user's all logs
test('TC-DH-07: admin can delete any user\'s all logs', async () => {
  const result = await deleteAllUserLogs(USER_ID, ADMIN_ID, true);
  expect(result.success).toBe(true);
});

// TC-DH-08: User can delete their own snapshot
test('TC-DH-08: user can delete their own dashboard snapshot', async () => {
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue({
    id: SNAP_ID, userId: USER_ID, snapshotName: 'My snapshot',
  });
  const result = await deleteDashboardSnapshot(SNAP_ID, USER_ID, false);
  expect(result.success).toBe(true);
  expect(prisma.dashboardSnapshot.delete).toHaveBeenCalledWith({ where: { id: SNAP_ID } });
});

// TC-DH-09: User cannot delete another user's snapshot
test('TC-DH-09: user cannot delete another user\'s snapshot', async () => {
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue({
    id: SNAP_ID, userId: 'other-user', snapshotName: 'Other snapshot',
  });
  const result = await deleteDashboardSnapshot(SNAP_ID, USER_ID, false);
  expect(result.success).toBe(false);
  expect(result.error).toContain('own snapshots');
});

// TC-DH-10: clearAllData — deletes all logs and snapshots
test('TC-DH-10: clearAllData deletes all logs and snapshots and returns counts', async () => {
  (prisma.importLog.deleteMany as jest.Mock).mockResolvedValue({ count: 42 });
  (prisma.dashboardSnapshot.deleteMany as jest.Mock).mockResolvedValue({ count: 7 });
  const result = await clearAllData(ADMIN_ID);
  expect(result.logsDeleted).toBe(42);
  expect(result.snapshotsDeleted).toBe(7);
  expect(prisma.importLog.deleteMany).toHaveBeenCalledWith({});
  expect(prisma.dashboardSnapshot.deleteMany).toHaveBeenCalledWith({});
});
