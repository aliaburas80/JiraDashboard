// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0A-07: correlationId pass-through for safeAuditEvent()/logSystemError().

const mockAuditCreate     = jest.fn();
const mockErrorLogCreate  = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    auditEvent:     { create: (...a: unknown[]) => mockAuditCreate(...a) },
    systemErrorLog: { create: (...a: unknown[]) => mockErrorLogCreate(...a) },
  },
}));

import { safeAuditEvent, logSystemError } from '../lib/system-error-logger';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('logSystemError — correlationId pass-through', () => {
  test('writes the given correlationId', async () => {
    await logSystemError({
      errorCode: 'UNKNOWN',
      errorMessage: 'boom',
      operation: 'test.op',
      correlationId: 'req-1',
    });

    expect(mockErrorLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ correlationId: 'req-1' }),
    }));
  });

  test('writes null when no correlationId was given', async () => {
    await logSystemError({
      errorCode: 'UNKNOWN',
      errorMessage: 'boom',
      operation: 'test.op',
    });

    expect(mockErrorLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ correlationId: null }),
    }));
  });
});

describe('safeAuditEvent — correlationId pass-through', () => {
  test('passes correlationId straight through on the happy path', async () => {
    mockAuditCreate.mockResolvedValueOnce({});

    await safeAuditEvent({
      userId: 'user-1',
      eventType: 'test_event',
      eventDescription: 'did a thing',
      correlationId: 'req-2',
    });

    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ correlationId: 'req-2' }),
    });
  });

  test('P2003 retry: the re-written auditEvent.create call and the resulting logSystemError call both carry the original correlationId', async () => {
    const p2003 = Object.assign(new Error('FK violation'), { code: 'P2003' });
    mockAuditCreate
      .mockRejectedValueOnce(p2003)   // first attempt fails
      .mockResolvedValueOnce({});     // retry with userId: null succeeds

    await safeAuditEvent({
      userId: 'ghost-user',
      eventType: 'test_event',
      eventDescription: 'did a thing',
      correlationId: 'req-3',
    });

    // Retried write still carries the original correlationId.
    expect(mockAuditCreate).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({ userId: null, correlationId: 'req-3' }),
    });
    // The incident log for the auto-fix also carries it.
    expect(mockErrorLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ correlationId: 'req-3' }),
    }));
  });

  test('a non-P2003 error logs to systemErrorLog with the original correlationId', async () => {
    mockAuditCreate.mockRejectedValueOnce(new Error('unexpected'));

    await safeAuditEvent({
      userId: 'user-1',
      eventType: 'test_event',
      eventDescription: 'did a thing',
      correlationId: 'req-4',
    });

    expect(mockErrorLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ correlationId: 'req-4' }),
    }));
  });
});
