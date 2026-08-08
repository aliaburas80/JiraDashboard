// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// ORG-08: isolation unit tests for src/server/tenancy/scopedRepository.ts
// (ORG-05 rebuild). Proves organizationId is always injected and always
// overwrites any caller-supplied value — the actual security property
// this module exists for.

export {};

const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();
const mockFindUniqueOrThrow = jest.fn();
const mockCreate = jest.fn();
const mockCreateMany = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateMany = jest.fn();
const mockDelete = jest.fn();
const mockDeleteMany = jest.fn();
const mockCount = jest.fn();

const mockDelegate = {
  findMany: (...a: unknown[]) => mockFindMany(...a),
  findFirst: (...a: unknown[]) => mockFindFirst(...a),
  findUnique: (...a: unknown[]) => mockFindUnique(...a),
  findUniqueOrThrow: (...a: unknown[]) => mockFindUniqueOrThrow(...a),
  create: (...a: unknown[]) => mockCreate(...a),
  createMany: (...a: unknown[]) => mockCreateMany(...a),
  update: (...a: unknown[]) => mockUpdate(...a),
  updateMany: (...a: unknown[]) => mockUpdateMany(...a),
  delete: (...a: unknown[]) => mockDelete(...a),
  deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
  count: (...a: unknown[]) => mockCount(...a),
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: mockDelegate,
    importLog: mockDelegate,
    dashboardSnapshot: mockDelegate,
    auditEvent: mockDelegate,
    userAddRequest: mockDelegate,
    notification: mockDelegate,
    jiraConnection: mockDelegate,
  },
}));

import { scopedRepository } from '@/server/tenancy/scopedRepository';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scopedRepository', () => {
  test('TC-ORG-01: throws when constructed with an empty organizationId', () => {
    expect(() => scopedRepository('')).toThrow(/organizationId/);
  });

  test('TC-ORG-02: findMany injects organizationId into where', async () => {
    mockFindMany.mockResolvedValue([]);
    await scopedRepository(ORG_A).importLog.findMany({ where: { status: 'success' } });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: 'success', organizationId: ORG_A },
    });
  });

  test('TC-ORG-03: findMany overwrites a caller-supplied organizationId rather than merging it', async () => {
    mockFindMany.mockResolvedValue([]);
    await scopedRepository(ORG_A).importLog.findMany({ where: { organizationId: ORG_B } });
    expect(mockFindMany).toHaveBeenCalledWith({ where: { organizationId: ORG_A } });
  });

  test('TC-ORG-04: findFirst injects organizationId into where', async () => {
    mockFindFirst.mockResolvedValue(null);
    await scopedRepository(ORG_A).userAddRequest.findFirst({ where: { status: 'pending' } });
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { status: 'pending', organizationId: ORG_A },
    });
  });

  test('TC-ORG-05: findUnique returns the row when it belongs to the bound organization', async () => {
    mockFindUnique.mockResolvedValue({ id: 'row-1', organizationId: ORG_A });
    const row = await scopedRepository(ORG_A).user.findUnique({ where: { id: 'row-1' } });
    expect(row).toEqual({ id: 'row-1', organizationId: ORG_A });
  });

  test('TC-ORG-06: findUnique returns null when the row belongs to a different organization', async () => {
    mockFindUnique.mockResolvedValue({ id: 'row-1', organizationId: ORG_B });
    const row = await scopedRepository(ORG_A).user.findUnique({ where: { id: 'row-1' } });
    expect(row).toBeNull();
  });

  test('TC-ORG-07: findUniqueOrThrow throws when the row belongs to a different organization', async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ id: 'row-1', organizationId: ORG_B });
    await expect(
      scopedRepository(ORG_A).user.findUniqueOrThrow({ where: { id: 'row-1' } }),
    ).rejects.toThrow();
  });

  test('TC-ORG-08: create injects organizationId into data, overwriting any caller-supplied value', async () => {
    mockCreate.mockResolvedValue({});
    await scopedRepository(ORG_A).notification.create({
      data: { organizationId: ORG_B, title: 'hi' },
    });
    expect(mockCreate).toHaveBeenCalledWith({ data: { organizationId: ORG_A, title: 'hi' } });
  });

  test('TC-ORG-09: createMany injects organizationId into every row', async () => {
    mockCreateMany.mockResolvedValue({ count: 2 });
    await scopedRepository(ORG_A).notification.createMany({
      data: [{ title: 'a' }, { title: 'b', organizationId: ORG_B }],
    });
    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [
        { title: 'a', organizationId: ORG_A },
        { title: 'b', organizationId: ORG_A },
      ],
    });
  });

  test('TC-ORG-10: update injects organizationId into where', async () => {
    mockUpdate.mockResolvedValue({});
    await scopedRepository(ORG_A).jiraConnection.update({
      where: { id: 'conn-1' },
      data: { name: 'Renamed' },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'conn-1', organizationId: ORG_A },
      data: { name: 'Renamed' },
    });
  });

  test('TC-ORG-11: delete and deleteMany inject organizationId into where', async () => {
    mockDelete.mockResolvedValue({});
    mockDeleteMany.mockResolvedValue({ count: 1 });
    await scopedRepository(ORG_A).dashboardSnapshot.delete({ where: { id: 'snap-1' } });
    await scopedRepository(ORG_A).dashboardSnapshot.deleteMany({ where: {} });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'snap-1', organizationId: ORG_A } });
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { organizationId: ORG_A } });
  });

  test('TC-ORG-12: count injects organizationId into where', async () => {
    mockCount.mockResolvedValue(3);
    await scopedRepository(ORG_A).auditEvent.count({ where: { eventType: 'login' } });
    expect(mockCount).toHaveBeenCalledWith({
      where: { eventType: 'login', organizationId: ORG_A },
    });
  });
});
