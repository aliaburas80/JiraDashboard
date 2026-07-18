// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Profile image upload API tests.

export {};

const mockSession = {
  isLoggedIn: true,
  role: 'scrum_master',
  userId: 'user-1',
  email: 'sam@test.com',
  name: 'Sam',
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(async () => ({
        id: 'user-1',
        email: 'sam@test.com',
        avatarUrl: '/api/profile/image?key=images%2Fprofile%2Fuser-1.png',
      })),
    },
    auditEvent: { create: jest.fn(async () => ({})) },
  },
}));
jest.mock('@/services/storage/profileImages', () => ({
  uploadProfileImageToS3: jest.fn(async () => ({ key: 'images/profile/user-1.png' })),
  downloadProfileImageFromS3: jest.fn(async () => ({
    body: Buffer.from('image-bytes'),
    contentType: 'image/png',
  })),
}));
jest.mock('@/services/storage/cloudSync', () => ({
  pushToCloud: jest.fn(async () => ({ status: 'pushed' })),
}));

function multipartRequest(file: File | null) {
  const form = new FormData();
  if (file) form.append('image', file);
  return {
    formData: jest.fn(async () => form),
    headers: { get: jest.fn(() => null) },
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
});

test('profile image upload rejects unsupported file types', async () => {
  const { POST } = await import('../../app/api/profile/image/route');

  const response = await POST(multipartRequest(new File(['x'], 'avatar.txt', { type: 'text/plain' })));
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toContain('Only JPG');
});

// Real PNG magic bytes (89 50 4E 47 0D 0A 1A 0A) — SEC (2026-07-18): the
// route now verifies actual image content via magic bytes rather than
// trusting the client-declared File.type, so fixtures below must contain
// genuine signature bytes, not arbitrary placeholder strings like 'png'.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

test('profile image upload stores image and updates avatar URL', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { uploadProfileImageToS3 } = await import('@/services/storage/profileImages');
  const { pushToCloud } = await import('@/services/storage/cloudSync');
  const { POST } = await import('../../app/api/profile/image/route');

  const response = await POST(multipartRequest(new File([PNG_SIGNATURE], 'avatar.png', { type: 'image/png' })));
  const body = await response.json();

  expect(body.ok).toBe(true);
  expect(body.key).toBe('images/profile/user-1.png');
  expect(body.avatarUrl).toBe('/api/profile/image?key=images%2Fprofile%2Fuser-1.png');
  expect(uploadProfileImageToS3).toHaveBeenCalledWith(expect.objectContaining({
    userId: 'user-1',
    contentType: 'image/png',
  }));
  expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
    data: { avatarUrl: '/api/profile/image?key=images%2Fprofile%2Fuser-1.png' },
  }));
  expect(pushToCloud).toHaveBeenCalled();
});

// SEC (2026-07-18, docs/product-audit/10-technical-cleanup.md Part 1 finding
// 4): a client can declare any File.type it wants — the server must verify
// the actual bytes and use ITS OWN detected type for S3 storage, not the
// client's claim. Here the client falsely declares 'image/png' but the real
// content is a JPEG; the upload must still succeed (real image content, just
// mislabeled) using the server-verified 'image/jpeg' contentType.
test('SEC-2026-07-18: profile image upload uses the server-verified type, not the client-declared one, when they disagree', async () => {
  const { uploadProfileImageToS3 } = await import('@/services/storage/profileImages');
  const { POST } = await import('../../app/api/profile/image/route');

  const response = await POST(multipartRequest(new File([JPEG_SIGNATURE], 'avatar.png', { type: 'image/png' })));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(uploadProfileImageToS3).toHaveBeenCalledWith(expect.objectContaining({
    contentType: 'image/jpeg',
  }));
});

// A spoofed declared type ('image/png') over content that isn't any
// supported image format at all (not just mislabeled) must still be
// rejected — the client-declared type provides no accept path once content
// verification is in place.
test('SEC-2026-07-18: profile image upload rejects non-image content even when File.type falsely claims image/png', async () => {
  const { uploadProfileImageToS3 } = await import('@/services/storage/profileImages');
  const { POST } = await import('../../app/api/profile/image/route');

  const response = await POST(multipartRequest(new File(['not an image at all'], 'avatar.png', { type: 'image/png' })));
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toContain('Only JPG');
  expect(uploadProfileImageToS3).not.toHaveBeenCalled();
});
