// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-03: src/lib/consent.ts — append-only consent records. Current status
// for a purpose is always the latest row for (userId, purpose); falls back
// to the legacy flat User.termsAcceptedAt/termsVersion fields for accounts
// that registered before this shipped and have no Consent rows at all.

export {};

const mockConsentFindFirst = jest.fn();
const mockConsentCreate    = jest.fn();
const mockUserFindUnique   = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    consent: {
      findFirst: (args: unknown) => mockConsentFindFirst(args),
      create:    (args: unknown) => mockConsentCreate(args),
    },
    user: {
      findUnique: (args: unknown) => mockUserFindUnique(args),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockConsentFindFirst.mockResolvedValue(null);
  mockUserFindUnique.mockResolvedValue({ termsAcceptedAt: null, termsVersion: '' });
});

describe('recordConsent', () => {
  test('writes the expected fields via the default prisma client', async () => {
    const { recordConsent } = await import('@/lib/consent');
    await recordConsent('user-1', 'analytics', true, { source: 'settings', ipAddress: '1.2.3.4', userAgent: 'jest' });

    expect(mockConsentCreate).toHaveBeenCalledWith({
      data: {
        userId:    'user-1',
        purpose:   'analytics',
        granted:   true,
        version:   '',
        source:    'settings',
        ipAddress: '1.2.3.4',
        userAgent: 'jest',
      },
    });
  });

  test('uses the passed transaction client instead of the default prisma client', async () => {
    const { recordConsent } = await import('@/lib/consent');
    const txCreate = jest.fn(async () => ({}));
    const tx = { consent: { create: txCreate } } as any;

    await recordConsent('user-1', 'terms_and_privacy', true, { version: 'v1', source: 'registration' }, tx);

    expect(txCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ purpose: 'terms_and_privacy', version: 'v1' }),
    }));
    expect(mockConsentCreate).not.toHaveBeenCalled();
  });
});

describe('getConsentStatus', () => {
  test('falls back to legacy User fields when no terms_and_privacy Consent row exists', async () => {
    mockUserFindUnique.mockResolvedValue({ termsAcceptedAt: new Date('2026-01-01'), termsVersion: 'v1' });
    const { getConsentStatus } = await import('@/lib/consent');

    const status = await getConsentStatus('user-1');
    expect(status.termsAndPrivacy).toEqual({ granted: true, version: 'v1', acceptedAt: new Date('2026-01-01') });
  });

  test('reports analytics as not decided when no Consent row exists', async () => {
    const { getConsentStatus } = await import('@/lib/consent');
    const status = await getConsentStatus('user-1');

    expect(status.analytics).toEqual({ granted: false, version: '', updatedAt: null, decided: false });
  });

  test('prefers the latest Consent row over the legacy User fields', async () => {
    const latestRow = { granted: true, version: 'v2', createdAt: new Date('2026-06-01') };
    mockConsentFindFirst.mockImplementation(async (args: any) =>
      args.where.purpose === 'terms_and_privacy' ? latestRow : null);
    mockUserFindUnique.mockResolvedValue({ termsAcceptedAt: new Date('2026-01-01'), termsVersion: 'v1' });

    const { getConsentStatus } = await import('@/lib/consent');
    const status = await getConsentStatus('user-1');

    expect(status.termsAndPrivacy).toEqual({ granted: true, version: 'v2', acceptedAt: new Date('2026-06-01') });
  });

  test('reports a granted, decided analytics status when the latest row is a withdrawal', async () => {
    const withdrawalRow = { granted: false, version: '', createdAt: new Date('2026-07-01') };
    mockConsentFindFirst.mockImplementation(async (args: any) =>
      args.where.purpose === 'analytics' ? withdrawalRow : null);

    const { getConsentStatus } = await import('@/lib/consent');
    const status = await getConsentStatus('user-1');

    expect(status.analytics).toEqual({ granted: false, version: '', updatedAt: new Date('2026-07-01'), decided: true });
  });
});
