// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-07: POST /api/events — validation, persistence, idempotent ack, and rate limiting.

export {};

const mockCount      = jest.fn(async (..._args: unknown[]) => 0);
const mockCreate     = jest.fn(async (..._args: unknown[]) => ({}));
const mockDeleteMany = jest.fn(async (..._args: unknown[]) => ({ count: 0 }));
const mockCreateMany = jest.fn(async (..._args: unknown[]) => ({ count: 1 }));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    loginAttempt: {
      count:      (...a: unknown[]) => mockCount(...a),
      create:     (...a: unknown[]) => mockCreate(...a),
      deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
    },
    productAnalyticsEvent: {
      createMany: (...a: unknown[]) => mockCreateMany(...a),
    },
  },
}));

function request(body: unknown) {
  return {
    headers: { get: () => '127.0.0.1' },
    json: jest.fn(async () => body),
  } as any;
}

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_id: 'evt-1',
    schema_version: 1,
    event_name: 'page_viewed',
    occurred_at: '2026-08-18T09:00:00.000Z',
    user_id: null,
    anonymous_id: 'anon-1',
    session_id: 'session-1',
    page: '/dashboard',
    section: null,
    component: null,
    app_version: '2.0.0',
    role: null,
    browser_family: 'Chrome',
    browser_major: '151',
    os_family: 'Windows',
    device_category: 'desktop',
    result_status: null,
    duration_ms: null,
    properties: {},
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCount.mockResolvedValue(0);
  mockCreateMany.mockResolvedValue({ count: 1 });
});

test('TC-EVAPI-01: a well-formed event is persisted and accepted', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [validEvent()] }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.accepted).toEqual(['evt-1']);
  expect(body.rejected).toEqual([]);
  expect(mockCreateMany).toHaveBeenCalledWith(expect.objectContaining({
    skipDuplicates: true,
    data: [expect.objectContaining({
      eventId: 'evt-1',
      eventName: 'page_viewed',
      page: '/dashboard',
      propertiesJson: '{}',
    })],
  }));
});

test('TC-EVAPI-02: an event with an unknown event_name is rejected, valid siblings still persisted', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({
    events: [validEvent({ event_id: 'evt-1' }), validEvent({ event_id: 'evt-2', event_name: 'not_a_real_event' })],
  }));
  const body = await res.json();

  expect(body.accepted).toEqual(['evt-1']);
  expect(body.rejected).toEqual([{ event_id: 'evt-2', reason: 'invalid_schema' }]);
  expect(mockCreateMany).toHaveBeenCalledTimes(1);
});

test('TC-EVAPI-03: a missing event_id is rejected with a reason and no storage write', async () => {
  const { POST } = await import('../../app/api/events/route');
  const event = validEvent();
  delete (event as any).event_id;
  const res = await POST(request({ events: [event] }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.rejected[0].reason).toBe('missing_event_id');
  expect(mockCreateMany).not.toHaveBeenCalled();
});

test('TC-EVAPI-04: a missing schema_version is rejected', async () => {
  const { POST } = await import('../../app/api/events/route');
  const event = validEvent();
  delete (event as any).schema_version;
  const res = await POST(request({ events: [event] }));
  const body = await res.json();

  expect(body.rejected[0]).toEqual({ event_id: 'evt-1', reason: 'missing_schema_version' });
});

test('TC-EVAPI-05: a non-array "events" body is rejected with 400', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: 'not-an-array' }));

  expect(res.status).toBe(400);
});

test('TC-EVAPI-06: a batch over 50 entries is truncated to the server-side cap', async () => {
  const { POST } = await import('../../app/api/events/route');
  const events = Array.from({ length: 60 }, (_, i) => validEvent({ event_id: `evt-${i}` }));
  const res = await POST(request({ events }));
  const body = await res.json();

  expect(body.accepted.length + body.rejected.length).toBe(50);
  expect((mockCreateMany.mock.calls[0][0] as any).data).toHaveLength(50);
});

test('TC-EVAPI-07: rate limit trips and returns 429 without processing the batch', async () => {
  mockCount.mockResolvedValue(120);
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [validEvent()] }));

  expect(res.status).toBe(429);
  expect(mockCreate).not.toHaveBeenCalled();
  expect(mockCreateMany).not.toHaveBeenCalled();
});

test('TC-EVAPI-08: unsupported schema versions are rejected and not persisted', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [validEvent({ schema_version: 2 })] }));
  const body = await res.json();

  expect(body.rejected).toEqual([{ event_id: 'evt-1', reason: 'unsupported_schema_version' }]);
  expect(mockCreateMany).not.toHaveBeenCalled();
});

test('TC-EVAPI-09: invalid properties are rejected', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [validEvent({ properties: { nested: { secret: true } } })] }));
  const body = await res.json();

  expect(body.rejected).toEqual([{ event_id: 'evt-1', reason: 'invalid_properties' }]);
  expect(mockCreateMany).not.toHaveBeenCalled();
});

test('TC-EVAPI-10: storage failure returns 503 and acknowledges nothing so the client retries', async () => {
  mockCreateMany.mockRejectedValueOnce(new Error('database unavailable'));
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    const { POST } = await import('../../app/api/events/route');
    const res = await POST(request({ events: [validEvent()] }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({ accepted: [], rejected: [] });
  } finally {
    consoleSpy.mockRestore();
  }
});

test('TC-EVAPI-11: duplicate-retry semantics use skipDuplicates while still acknowledging the event id', async () => {
  mockCreateMany.mockResolvedValueOnce({ count: 0 });
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [validEvent()] }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.accepted).toEqual(['evt-1']);
  expect(mockCreateMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
});
