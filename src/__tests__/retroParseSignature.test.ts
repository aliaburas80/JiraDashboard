// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/retro/parse content-signature gate tests — SEC (2026-07-18,
// docs/product-audit/10-technical-cleanup.md Part 1 finding 3).

export {};

const mockSession = { isLoggedIn: true, userId: 'user-1' };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/services/retro/retroFileParser.service', () => ({
  parseRetroFile: jest.fn(() => ({
    records: [{ sprintName: 'Sprint 1' }],
    warnings: [],
    corrections: [],
  })),
}));
jest.mock('@/services/retro/retroInsights.service', () => ({
  generateInsightsForRecords: jest.fn(() => []),
}));

function multipartRequest(file: File | null) {
  const form = new FormData();
  if (file) form.append('file', file);
  return {
    formData: jest.fn(async () => form),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
});

test('SEC-2026-07-18: retro/parse rejects a .csv file whose content is binary garbage, not text', async () => {
  const { parseRetroFile } = await import('@/services/retro/retroFileParser.service');
  const { POST } = await import('../../app/api/retro/parse/route');

  const binary = new Uint8Array(Array.from({ length: 200 }, (_, i) => (i * 37) % 256).filter((b) => b !== 0));
  const response = await POST(multipartRequest(new File([binary], 'retro.csv', { type: 'text/csv' })));
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toContain('.csv');
  expect(parseRetroFile).not.toHaveBeenCalled();
});

test('retro/parse still accepts a real .csv text file past the content-signature gate', async () => {
  const { POST } = await import('../../app/api/retro/parse/route');

  const csv = 'Sprint Name,What Went Well\nSprint 1,Good pace\n';
  const response = await POST(multipartRequest(new File([csv], 'retro.csv', { type: 'text/csv' })));

  expect(response.status).toBe(200);
});

test('retro/parse rejects a spoofed .xlsx (content is plain text, not a ZIP/OOXML archive)', async () => {
  const { parseRetroFile } = await import('@/services/retro/retroFileParser.service');
  const { POST } = await import('../../app/api/retro/parse/route');

  const response = await POST(multipartRequest(new File(['plain text pretending to be xlsx'], 'retro.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })));
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toContain('.xlsx');
  expect(parseRetroFile).not.toHaveBeenCalled();
});

test('retro/parse still returns 401 for an unauthenticated request (unrelated to the signature gate)', async () => {
  mockSession.isLoggedIn = false;
  const { POST } = await import('../../app/api/retro/parse/route');

  const response = await POST(multipartRequest(new File(['Sprint Name\nSprint 1\n'], 'retro.csv', { type: 'text/csv' })));

  expect(response.status).toBe(401);
});
