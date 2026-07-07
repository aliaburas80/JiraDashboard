// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-018: self-registration must default new accounts to local-only storage
// mode (per explicit user request), never the shared server database, unlike
// admin-created accounts (POST /api/admin/users) which keep defaulting to cloud.

export {};

const mockCreatedUser = { id: 'user-1', name: 'Sam', email: 'sam@test.com' };
const mockCreate = jest.fn(async (args: any) => ({ ...mockCreatedUser, ...args.data }));
const mockFindUnique = jest.fn(async (_args: unknown) => null as { id: string } | null);

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (args: unknown) => mockFindUnique(args),
      create: (args: any) => mockCreate(args),
    },
    loginAttempt: {
      count: jest.fn(async () => 0),
      create: jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = { user: { create: (args: any) => mockCreate(args) } };
      return fn(tx);
    }),
  },
}));
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(async () => 'HASHED_PW'),
  validatePasswordStrength: jest.fn(() => null),
  generateVerificationToken: jest.fn(() => 'test-token'),
  EMAIL_VERIFICATION_TTL_HOURS: 24,
}));
jest.mock('@/lib/workspace', () => ({
  createWorkspaceForUser: jest.fn(async () => ({ id: 'ws-1' })),
}));
jest.mock('@/lib/entitlement', () => ({
  createEntitlementForUser: jest.fn(async () => ({})),
}));
jest.mock('@/lib/system-error-logger', () => ({
  safeAuditEvent: jest.fn(async () => {}),
}));
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(async () => true),
  buildVerificationEmail: jest.fn(() => ({ subject: '', text: '', html: '' })),
}));

function request(body: unknown) {
  return {
    headers: { get: () => '127.0.0.1' },
    json: jest.fn(async () => body),
    nextUrl: new URL('http://localhost/api/auth/register'),
  } as any;
}

const validBody = {
  name: 'Sam Example',
  email: 'sam@test.com',
  password: 'ValidPass1!',
  persona: 'Scrum Master',
  consentAccepted: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFindUnique.mockResolvedValue(null);
});

test('TC-REG-01: self-registration creates the user with dataStorageMode "local"', async () => {
  const { POST } = await import('../../app/api/auth/register/route');
  const res = await POST(request(validBody));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ dataStorageMode: 'local', role: 'user' }),
  }));
});

test('TC-REG-02: self-registration rejects an email that already has an account', async () => {
  mockFindUnique.mockResolvedValue({ id: 'existing-user' });
  const { sendEmail } = await import('@/lib/email');
  const { POST } = await import('../../app/api/auth/register/route');

  const res = await POST(request(validBody));
  const body = await res.json();

  expect(res.status).toBe(409);
  expect(body).toEqual(expect.objectContaining({
    code: 'ALREADY_REGISTERED',
    loginPath: '/login',
  }));
  expect(body.error).toMatch(/welcome back/i);
  expect(body.error).toMatch(/log in/i);
  expect(mockCreate).not.toHaveBeenCalled();
  expect(sendEmail).not.toHaveBeenCalled();
});
