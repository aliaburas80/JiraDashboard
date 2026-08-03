// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-06: POST /api/events — TC-EVAPI-01 to TC-EVAPI-07.
// Deliberately minimal scope: this route validates shape/taxonomy membership
// and acknowledges per the master plan's {accepted, rejected} contract, but
// persists nothing — P0B-07 adds real validation depth, dedup, and storage
// behind this same contract. These tests only assert the ack contract and
// rate limiting, not any storage behavior (there is none yet).

export {};

const mockCount      = jest.fn(async (..._args: unknown[]) => 0);
const mockCreate     = jest.fn(async (..._args: unknown[]) => ({}));
const mockDeleteMany = jest.fn(async (..._args: unknown[]) => ({ count: 0 }));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    loginAttempt: {
      count:      (...a: unknown[]) => mockCount(...a),
      create:     (...a: unknown[]) => mockCreate(...a),
      deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
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
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCount.mockResolvedValue(0);
});

test('TC-EVAPI-01: a well-formed event is accepted', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [validEvent()] }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.accepted).toEqual(['evt-1']);
  expect(body.rejected).toEqual([]);
});

test('TC-EVAPI-02: an event with an unknown event_name is rejected, valid siblings still accepted', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({
    events: [validEvent({ event_id: 'evt-1' }), validEvent({ event_id: 'evt-2', event_name: 'not_a_real_event' })],
  }));
  const body = await res.json();

  expect(body.accepted).toEqual(['evt-1']);
  expect(body.rejected).toEqual([{ event_id: 'evt-2', reason: 'invalid_schema' }]);
});

test('TC-EVAPI-03: a missing event_id is rejected with a reason and no crash', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [{ schema_version: 1, event_name: 'page_viewed' }] }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.rejected[0].reason).toBe('missing_event_id');
});

test('TC-EVAPI-04: a missing schema_version is rejected', async () => {
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [{ event_id: 'evt-1', event_name: 'page_viewed' }] }));
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
});

test('TC-EVAPI-07: rate limit trips and returns 429 without processing the batch', async () => {
  mockCount.mockResolvedValue(120);
  const { POST } = await import('../../app/api/events/route');
  const res = await POST(request({ events: [validEvent()] }));

  expect(res.status).toBe(429);
  expect(mockCreate).not.toHaveBeenCalled();
});
