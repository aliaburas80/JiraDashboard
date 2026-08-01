// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/feedback notifies support@deliveryclarity.app (configurable via
// FEEDBACK_NOTIFICATION_TO) whenever feedback is submitted. The Feedback row
// is the source of truth — a failed notification email must never fail the
// submission itself.

export {};

import { buildFeedbackNotificationEmail, buildFeedbackReceivedEmail } from '../lib/email';

let mockSession: { isLoggedIn: boolean; userId?: string; email?: string; name?: string } = { isLoggedIn: false };

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
    nextUrl: new URL('http://localhost/api/feedback'),
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
  mockSession = { isLoggedIn: true, userId: 'user-1', email: 'sam@test.com', name: 'Sam' };
  const { POST } = await import('../../app/api/feedback/route');
  await POST(request({ ...validBody, canContact: true }));

  const supportEmail = mockSendEmail.mock.calls[0][0];
  const receiptEmail = mockSendEmail.mock.calls[1][0];
  expect(mockSendEmail).toHaveBeenCalledTimes(2);
  expect(supportEmail.text).toContain('sam@test.com');
  expect(receiptEmail).toEqual(expect.objectContaining({
    to: 'sam@test.com',
    toName: 'Sam',
    subject: 'We received your Delivery Clarity feedback',
  }));
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

// P0B-09: optional, user-initiated screenshot capture.

test('TC-FB-11: a valid screenshot data URI is stored on the Feedback row', async () => {
  const screenshot = `data:image/jpeg;base64,${'A'.repeat(100)}`;
  const { POST } = await import('../../app/api/feedback/route');
  const res = await POST(request({ ...validBody, screenshot }));

  expect(res.status).toBe(200);
  expect(mockFeedbackCreate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ screenshotData: screenshot }),
  }));
});

test('TC-FB-12: submission without a screenshot still works unchanged', async () => {
  const { POST } = await import('../../app/api/feedback/route');
  const res = await POST(request(validBody));

  expect(res.status).toBe(200);
  expect(mockFeedbackCreate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ screenshotData: undefined }),
  }));
});

test('TC-FB-13: a malformed screenshot value (not a data:image/ URI) is rejected with 400', async () => {
  const { POST } = await import('../../app/api/feedback/route');
  const res = await POST(request({ ...validBody, screenshot: 'not-a-data-uri' }));
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toMatch(/screenshot/i);
  expect(mockFeedbackCreate).not.toHaveBeenCalled();
});

test('TC-FB-14: an oversized screenshot is rejected with 400, never silently truncated', async () => {
  const oversized = `data:image/jpeg;base64,${'A'.repeat(3 * 1024 * 1024)}`;
  const { POST } = await import('../../app/api/feedback/route');
  const res = await POST(request({ ...validBody, screenshot: oversized }));
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toMatch(/too large/i);
  expect(mockFeedbackCreate).not.toHaveBeenCalled();
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

describe('new user-facing email templates', () => {
  test('TC-EMAIL-01: feedback receipt escapes HTML in user-supplied summary', () => {
    const result = buildFeedbackReceivedEmail({
      userName: 'Ali',
      appUrl: 'https://app.example.com',
      feedbackSummary: '<script>alert(1)</script> & "quotes"',
    });

    expect(result.subject).toBe('We received your Delivery Clarity feedback');
    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
    expect(result.html).toContain('&amp;');
    expect(result.text).toContain('<script>alert(1)</script> & "quotes"');
  });
});
