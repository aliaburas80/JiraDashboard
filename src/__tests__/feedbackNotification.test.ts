// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/feedback notifies support@deliveryclarity.app (configurable via
// FEEDBACK_NOTIFICATION_TO) whenever feedback is submitted. The Feedback row
// is the source of truth — a failed notification email must never fail the
// submission itself.

export {};

import { buildFeedbackNotificationEmail } from '../lib/email';

let mockSession: { isLoggedIn: boolean; userId?: string; email?: string } = { isLoggedIn: false };

const mockFeedbackCreate = jest.fn(async (args: any) => ({ id: 'fb-1', ...args.data }));
const mockSendEmail = jest.fn(async (_opts: any) => true);

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    feedback: {
      create: (args: any) => mockFeedbackCreate(args),
    },
    loginAttempt: {
      count: jest.fn(async () => 0),
      create: jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
  },
}));
// Only sendEmail (the actual network/SMTP-touching call) is mocked —
// buildFeedbackNotificationEmail is a pure function and runs for real, so
// its content is exercised through the route tests below too.
jest.mock('@/lib/email', () => ({
  ...jest.requireActual('@/lib/email'),
  sendEmail: (opts: any) => mockSendEmail(opts),
}));

function request(body: unknown) {
  return {
    headers: { get: () => '127.0.0.1' },
    json: jest.fn(async () => body),
  } as any;
}

const validBody = {
  category: 'Suggestion',
  message: 'This is a valid feedback message.',
  impactLevel: 'Minor',
  canContact: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = { isLoggedIn: false };
});

test('TC-FB-01: valid submission creates a Feedback row and returns ok', async () => {
  const { POST } = await import('../../app/api/feedback/route');
  const res = await POST(request(validBody));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body).toEqual({ ok: true });
  expect(mockFeedbackCreate).toHaveBeenCalledTimes(1);
});

test('TC-FB-02: sends a notification email to the configured recipient (default support address)', async () => {
  const { POST } = await import('../../app/api/feedback/route');
  await POST(request(validBody));

  expect(mockSendEmail).toHaveBeenCalledTimes(1);
  expect(mockSendEmail).toHaveBeenCalledWith(
    expect.objectContaining({ to: 'support@deliveryclarity.app' }),
  );
});

test('TC-FB-03: notification email subject/text reflect the submitted feedback', async () => {
  const { POST } = await import('../../app/api/feedback/route');
  await POST(request({ ...validBody, category: 'Problem/Bug', message: 'Something broke.', impactLevel: 'Blocks Me' }));

  const sentWith = mockSendEmail.mock.calls[0][0];
  expect(sentWith.subject).toContain('Problem/Bug');
  expect(sentWith.subject).toContain('Blocks Me');
  expect(sentWith.text).toContain('Something broke.');
});

test('TC-FB-04: a failed notification email does not fail the feedback submission', async () => {
  mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));
  const { POST } = await import('../../app/api/feedback/route');
  const res = await POST(request(validBody));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body).toEqual({ ok: true });
  expect(mockFeedbackCreate).toHaveBeenCalledTimes(1);
});

test('TC-FB-05: includes the user\'s email in the notification when logged in and canContact is true', async () => {
  mockSession = { isLoggedIn: true, userId: 'user-1', email: 'sam@test.com' };
  const { POST } = await import('../../app/api/feedback/route');
  await POST(request({ ...validBody, canContact: true }));

  const sentWith = mockSendEmail.mock.calls[0][0];
  expect(sentWith.text).toContain('sam@test.com');
});

test('TC-FB-06: omits the user\'s email from the notification when canContact is false, even if logged in', async () => {
  mockSession = { isLoggedIn: true, userId: 'user-1', email: 'sam@test.com' };
  const { POST } = await import('../../app/api/feedback/route');
  await POST(request({ ...validBody, canContact: false }));

  const sentWith = mockSendEmail.mock.calls[0][0];
  expect(sentWith.text).not.toContain('sam@test.com');
  expect(sentWith.text).toContain('(not provided)');
});

test('TC-FB-07: invalid feedback (too short) is rejected before any email is sent', async () => {
  const { POST } = await import('../../app/api/feedback/route');
  const res = await POST(request({ ...validBody, message: 'hi' }));

  expect(res.status).toBe(400);
  expect(mockFeedbackCreate).not.toHaveBeenCalled();
  expect(mockSendEmail).not.toHaveBeenCalled();
});

describe('buildFeedbackNotificationEmail', () => {
  test('TC-FB-08: HTML-escapes user-supplied message content to prevent injection', () => {
    const result = buildFeedbackNotificationEmail({
      category: 'Suggestion',
      message: '<script>alert(1)</script> & "quotes"',
      impactLevel: 'Minor',
      submittedAt: '2026-07-06T00:00:00.000Z',
    });

    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
    expect(result.html).toContain('&amp;');
    expect(result.html).toContain('&quot;quotes&quot;');
  });

  test('TC-FB-09: subject includes category and impact level', () => {
    const result = buildFeedbackNotificationEmail({
      category: 'Problem/Bug',
      message: 'Something is broken.',
      impactLevel: 'Blocks Me',
      submittedAt: '2026-07-06T00:00:00.000Z',
    });

    expect(result.subject).toContain('Problem/Bug');
    expect(result.subject).toContain('Blocks Me');
  });

  test('TC-FB-10: text body includes the raw message unescaped (plain text, not HTML)', () => {
    const result = buildFeedbackNotificationEmail({
      category: 'Suggestion',
      message: 'Plain <text> & stuff',
      impactLevel: 'Minor',
      submittedAt: '2026-07-06T00:00:00.000Z',
    });

    expect(result.text).toContain('Plain <text> & stuff');
  });
});
