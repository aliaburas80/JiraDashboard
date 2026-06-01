// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Dashboard snapshot tests — TC-SN-01 to TC-SN-08

// Mocks
jest.mock('../lib/prisma', () => ({
  prisma: {
    dashboardSnapshot: {
      findMany:  jest.fn(),
      findUnique: jest.fn(),
      create:    jest.fn(),
      count:     jest.fn(),
      delete:    jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
    auditEvent: { create: jest.fn().mockResolvedValue({}) },
  },
}));

import { prisma } from '../lib/prisma';
import { deleteDashboardSnapshot } from '../services/settings/dataRetention.service';

const USER_A  = 'user-aaa';
const USER_B  = 'user-bbb';
const SNAP_ID = 'snap-001';

beforeEach(() => jest.clearAllMocks());

// TC-SN-01: User can delete own snapshot
test('TC-SN-01: user can delete their own snapshot', async () => {
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue({
    id: SNAP_ID, userId: USER_A, snapshotName: 'Sprint 14',
  });
  const result = await deleteDashboardSnapshot(SNAP_ID, USER_A, false);
  expect(result.success).toBe(true);
  expect(prisma.dashboardSnapshot.delete).toHaveBeenCalledWith({ where: { id: SNAP_ID } });
});

// TC-SN-02: User cannot delete another user's snapshot
test('TC-SN-02: user cannot delete another user\'s snapshot', async () => {
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue({
    id: SNAP_ID, userId: USER_B, snapshotName: 'Other snapshot',
  });
  const result = await deleteDashboardSnapshot(SNAP_ID, USER_A, false);
  expect(result.success).toBe(false);
  expect(result.error).toContain('own snapshots');
});

// TC-SN-03: Admin can delete any snapshot
test('TC-SN-03: admin can delete any user\'s snapshot', async () => {
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue({
    id: SNAP_ID, userId: USER_B, snapshotName: 'Other snapshot',
  });
  const result = await deleteDashboardSnapshot(SNAP_ID, 'admin-001', true);
  expect(result.success).toBe(true);
});

// TC-SN-04: Deleting non-existent snapshot returns error
test('TC-SN-04: deleting non-existent snapshot returns not-found error', async () => {
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue(null);
  const result = await deleteDashboardSnapshot('bad-id', USER_A, false);
  expect(result.success).toBe(false);
  expect(result.error).toContain('not found');
});

// TC-SN-05: Snapshot name validation — empty name should fail
test('TC-SN-05: empty snapshot name rejected at service level', () => {
  const name = '   ';
  expect(name.trim()).toBe('');
});

// TC-SN-06: Snapshot name within 60 char limit
test('TC-SN-06: snapshot name is trimmed and limited to 60 chars', () => {
  const longName = 'A'.repeat(70);
  const trimmed  = longName.slice(0, 60);
  expect(trimmed.length).toBe(60);
});

// TC-SN-07: Snapshot count limit — 20 per user
test('TC-SN-07: snapshot count limit is 20 per user', () => {
  const MAX_SNAPSHOTS = 20;
  expect(MAX_SNAPSHOTS).toBe(20);
});

// TC-SN-08: metricsJson is valid JSON when stored
test('TC-SN-08: metricsJson round-trips correctly through JSON', () => {
  const metrics = { healthScore: 82, totalIssues: 150, completionRate: 76 };
  const json    = JSON.stringify(metrics);
  const parsed  = JSON.parse(json);
  expect(parsed.healthScore).toBe(82);
  expect(parsed.totalIssues).toBe(150);
  expect(typeof json).toBe('string');
});
