// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
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

test('profile image upload stores image and updates avatar URL', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { uploadProfileImageToS3 } = await import('@/services/storage/profileImages');
  const { pushToCloud } = await import('@/services/storage/cloudSync');
  const { POST } = await import('../../app/api/profile/image/route');

  const response = await POST(multipartRequest(new File(['png'], 'avatar.png', { type: 'image/png' })));
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
