// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Public demo-request route guardrails.

export {};

const mockFindUnique = jest.fn(async (_args: unknown) => null as { id: string } | null);
const mockSendEmail = jest.fn(async (_args: unknown) => true);

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (args: unknown) => mockFindUnique(args),
    },
  },
}));

jest.mock('@/lib/email', () => ({
  sendEmail: (args: unknown) => mockSendEmail(args),
  buildDemoRequestEmail: jest.fn(() => ({
    subject: 'Demo request',
    text: 'Demo request text',
    html: '<p>Demo request</p>',
  })),
}));

function request(body: unknown) {
  return {
    headers: { get: () => '127.0.0.1' },
    json: jest.fn(async () => body),
  } as any;
}

const validBody = {
  name: 'Sam Example',
  email: 'sam@test.com',
  organization: 'Example Co',
  role: 'Delivery Lead',
  need: 'Understand Jira delivery flow',
  justification: 'We want to evaluate Delivery Clarity for our team.',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFindUnique.mockResolvedValue(null);
});

test('TC-DEMO-01: demo request rejects an email that already has an account', async () => {
  mockFindUnique.mockResolvedValue({ id: 'existing-user' });
  const { POST } = await import('../../app/api/demo-request/route');

  const res = await POST(request(validBody));
  const body = await res.json();

  expect(res.status).toBe(409);
  expect(body).toEqual(expect.objectContaining({
    code: 'ALREADY_REGISTERED',
    loginPath: '/login',
  }));
  expect(body.error).toMatch(/welcome back/i);
  expect(body.error).toMatch(/log in/i);
  expect(mockSendEmail).not.toHaveBeenCalled();
});

test('TC-DEMO-02: demo request still sends for a new email', async () => {
  const { POST } = await import('../../app/api/demo-request/route');

  const res = await POST(request(validBody));
  const body = await res.json();

  expect(res.status).toBe(201);
  expect(body).toEqual({ ok: true });
  expect(mockFindUnique).toHaveBeenCalledWith({
    where:  { email: 'sam@test.com' },
    select: { id: true },
  });
  expect(mockSendEmail).toHaveBeenCalledTimes(1);
});
