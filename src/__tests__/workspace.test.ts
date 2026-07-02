// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Workspace helper tests — EP-006 (TC-WS-01 to TC-WS-09)

export {};

// ── Mock Prisma ────────────────────────────────────────────────────────────────

const mockWorkspaceFindFirst = jest.fn();
const mockWorkspaceCreate    = jest.fn();
const mockMemberCreate       = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    workspace: {
      findFirst: (...args: unknown[]) => mockWorkspaceFindFirst(...args),
      create:    (...args: unknown[]) => mockWorkspaceCreate(...args),
    },
    workspaceMember: {
      create: (...args: unknown[]) => mockMemberCreate(...args),
    },
  },
}));

import { getWorkspaceForUser, createWorkspaceForUser } from '../lib/workspace';

// ── TC-WS-01: Returns workspace for a user with an active owned workspace ──────

test('TC-WS-01: getWorkspaceForUser returns the workspace when one exists', async () => {
  const expected = { id: 'ws-1', name: 'Alice', slug: 'ws-user-1', status: 'active' };
  mockWorkspaceFindFirst.mockResolvedValueOnce(expected);

  const result = await getWorkspaceForUser('user-1');

  expect(result).toEqual(expected);
  expect(mockWorkspaceFindFirst).toHaveBeenCalledWith(
    expect.objectContaining({ where: { ownerUserId: 'user-1', status: 'active' } }),
  );
});

// ── TC-WS-02: Returns null when no workspace exists ───────────────────────────

test('TC-WS-02: getWorkspaceForUser returns null when no workspace exists', async () => {
  mockWorkspaceFindFirst.mockResolvedValueOnce(null);
  const result = await getWorkspaceForUser('user-no-ws');
  expect(result).toBeNull();
});

// ── TC-WS-03: Returns null for a suspended workspace ─────────────────────────

test('TC-WS-03: getWorkspaceForUser returns null for a suspended workspace', async () => {
  // status: 'active' filter means suspended workspace is excluded by the query.
  mockWorkspaceFindFirst.mockResolvedValueOnce(null);
  const result = await getWorkspaceForUser('user-suspended');
  expect(result).toBeNull();
  // Confirm the query filtered by status: 'active'
  expect(mockWorkspaceFindFirst).toHaveBeenCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ status: 'active' }) }),
  );
});

// ── TC-WS-04: createWorkspaceForUser creates workspace + member ───────────────

test('TC-WS-04: createWorkspaceForUser creates workspace then member via transaction', async () => {
  const mockWorkspace = { id: 'ws-new', name: 'Bob', slug: 'ws-user-2', status: 'active' };
  mockWorkspaceCreate.mockResolvedValueOnce(mockWorkspace);
  mockMemberCreate.mockResolvedValueOnce({ id: 'mem-1' });

  const tx = {
    workspace:       { create: mockWorkspaceCreate },
    workspaceMember: { create: mockMemberCreate },
  } as unknown as Parameters<typeof createWorkspaceForUser>[0];

  const result = await createWorkspaceForUser(tx, 'user-2', 'Bob');

  expect(result).toEqual(mockWorkspace);
  expect(mockWorkspaceCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ ownerUserId: 'user-2', name: 'Bob', slug: 'ws-user-2' }),
    }),
  );
});

// ── TC-WS-05: Workspace slug format is ws-{userId} ───────────────────────────

test('TC-WS-05: createWorkspaceForUser sets slug to ws-{userId}', async () => {
  const userId = 'clxyz123abc';
  mockWorkspaceCreate.mockResolvedValueOnce({ id: 'ws-x', name: 'Test', slug: `ws-${userId}`, status: 'active' });
  mockMemberCreate.mockResolvedValueOnce({ id: 'mem-x' });

  const tx = {
    workspace:       { create: mockWorkspaceCreate },
    workspaceMember: { create: mockMemberCreate },
  } as unknown as Parameters<typeof createWorkspaceForUser>[0];

  await createWorkspaceForUser(tx, userId, 'Test');

  expect(mockWorkspaceCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ slug: `ws-${userId}` }),
    }),
  );
});

// ── TC-WS-06: WorkspaceMember accessRole is 'owner' ──────────────────────────

test('TC-WS-06: createWorkspaceForUser sets WorkspaceMember accessRole to owner', async () => {
  const wsId = 'ws-role-test';
  mockWorkspaceCreate.mockResolvedValueOnce({ id: wsId, name: 'Carol', slug: 'ws-user-3', status: 'active' });
  mockMemberCreate.mockResolvedValueOnce({ id: 'mem-2' });

  const tx = {
    workspace:       { create: mockWorkspaceCreate },
    workspaceMember: { create: mockMemberCreate },
  } as unknown as Parameters<typeof createWorkspaceForUser>[0];

  await createWorkspaceForUser(tx, 'user-3', 'Carol');

  expect(mockMemberCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ workspaceId: wsId, userId: 'user-3', accessRole: 'owner' }),
    }),
  );
});

// ── TC-WS-07: Two users produce two separate workspaces ──────────────────────

test('TC-WS-07: two different userIds produce two separate getWorkspaceForUser calls', async () => {
  const ws1 = { id: 'ws-a', name: 'Alice', slug: 'ws-user-a', status: 'active' };
  const ws2 = { id: 'ws-b', name: 'Bob',   slug: 'ws-user-b', status: 'active' };
  mockWorkspaceFindFirst
    .mockResolvedValueOnce(ws1)
    .mockResolvedValueOnce(ws2);

  const [r1, r2] = await Promise.all([
    getWorkspaceForUser('user-a'),
    getWorkspaceForUser('user-b'),
  ]);

  expect(r1?.id).toBe('ws-a');
  expect(r2?.id).toBe('ws-b');
  expect(r1?.id).not.toBe(r2?.id);
});

// ── TC-WS-08: Workspace ownerUserId matches registering user ─────────────────

test('TC-WS-08: createWorkspaceForUser sets ownerUserId to the provided userId', async () => {
  const userId = 'owner-user-id';
  mockWorkspaceCreate.mockResolvedValueOnce({ id: 'ws-owner', name: 'Owner', slug: `ws-${userId}`, status: 'active' });
  mockMemberCreate.mockResolvedValueOnce({ id: 'mem-owner' });

  const tx = {
    workspace:       { create: mockWorkspaceCreate },
    workspaceMember: { create: mockMemberCreate },
  } as unknown as Parameters<typeof createWorkspaceForUser>[0];

  await createWorkspaceForUser(tx, userId, 'Owner');

  expect(mockWorkspaceCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ ownerUserId: userId }),
    }),
  );
});

// ── TC-WS-09: New workspace status defaults to active ────────────────────────

test('TC-WS-09: createWorkspaceForUser sets workspace status to active', async () => {
  mockWorkspaceCreate.mockResolvedValueOnce({ id: 'ws-status', name: 'Status Test', slug: 'ws-st', status: 'active' });
  mockMemberCreate.mockResolvedValueOnce({ id: 'mem-status' });

  const tx = {
    workspace:       { create: mockWorkspaceCreate },
    workspaceMember: { create: mockMemberCreate },
  } as unknown as Parameters<typeof createWorkspaceForUser>[0];

  await createWorkspaceForUser(tx, 'user-st', 'Status Test');

  expect(mockWorkspaceCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: 'active' }),
    }),
  );
});
