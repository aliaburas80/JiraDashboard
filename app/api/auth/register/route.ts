// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// POST /api/auth/register — creates a user (open registration or admin-only).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const allowOpen = process.env.ALLOW_OPEN_REGISTRATION === 'true';
  if (!allowOpen) {
    return NextResponse.json({ error: 'Registration is restricted. Contact your administrator.' }, { status: 403 });
  }

  try {
    const { syncFromCloud } = await import('@/services/storage/cloudSync');
    await syncFromCloud();
  } catch {
    // Registration can still proceed against the local server database.
  }

  let body: { name?: string; email?: string; password?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { name, email, password } = body;
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  const pwError = validatePasswordStrength(password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase().trim(), passwordHash, role: 'user' },
  });

  await prisma.auditEvent.create({ data: {
    userId: user.id, eventType: 'register',
    eventDescription: `New user registered: ${user.email}`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
  }});

  try {
    const { pushToCloud } = await import('@/services/storage/cloudSync');
    await pushToCloud();
  } catch {
    // Registration succeeded locally; cloud sync will retry from pending state.
  }

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
