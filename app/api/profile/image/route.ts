// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET/POST /api/profile/image — authenticated S3-backed profile image upload/proxy.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import {
  downloadProfileImageFromS3,
  uploadProfileImageToS3,
} from '@/services/storage/profileImages';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function requireUser(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return session;
}

function imageUrlFor(key: string): string {
  return `/api/profile/image?key=${encodeURIComponent(key)}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireUser();
  if (session instanceof NextResponse) return session;

  let form: FormData;
  try { form = await req.formData(); } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  const file = form.get('image');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, or GIF profile images are supported.' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Profile image must be 5 MB or smaller.' }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { key } = await uploadProfileImageToS3({
      userId: session.userId,
      content: buffer,
      contentType: file.type,
    });
    const avatarUrl = imageUrlFor(key);
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl },
      select: { id: true, email: true, avatarUrl: true },
    });

    await prisma.auditEvent.create({ data: {
      userId: user.id,
      eventType: 'profile_image_upload',
      eventDescription: `${user.email} uploaded a profile image to ${key}.`,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    }}).catch(() => {});

    try {
      const { pushToCloud } = await import('@/services/storage/cloudSync');
      await pushToCloud();
    } catch {
      // Image upload and profile update succeeded; cloud DB sync can retry later.
    }

    return NextResponse.json({ ok: true, key, avatarUrl: user.avatarUrl });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Could not upload profile image.',
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireUser();
  if (session instanceof NextResponse) return session;

  const key = req.nextUrl.searchParams.get('key')?.trim();
  if (!key) return NextResponse.json({ error: 'Image key is required.' }, { status: 400 });

  try {
    const image = await downloadProfileImageFromS3(key);
    return new NextResponse(new Uint8Array(image.body), {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Could not load profile image.',
    }, { status: 404 });
  }
}

export const dynamic = 'force-dynamic';
