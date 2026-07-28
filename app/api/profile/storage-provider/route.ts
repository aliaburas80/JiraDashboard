// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET/PUT/DELETE /api/profile/storage-provider — EP-024's per-user "bring your
// own cloud" storage config. Every user manages only their own — no admin
// bypass needed here, unlike most other admin-facing storage config.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { getRequestId } from '@/lib/requestId';
import {
  getUserStorageProviderSafe,
  saveUserStorageProvider,
  deleteUserStorageProvider,
  type UserStorageProviderType,
} from '@/services/storage/userStorageProvider.service';

const VALID_PROVIDERS: UserStorageProviderType[] = ['s3', 'azure', 'gcp'];

async function requireSession(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const config = await getUserStorageProviderSafe(session.userId);
  return NextResponse.json({ ok: true, config });
}

export async function PUT(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const provider = body.provider;
  if (typeof provider !== 'string' || !VALID_PROVIDERS.includes(provider as UserStorageProviderType)) {
    return NextResponse.json({ error: 'provider must be one of: s3, azure, gcp.' }, { status: 400 });
  }
  const config = (body.config && typeof body.config === 'object') ? body.config as Record<string, string> : {};
  const credentials = (body.credentials && typeof body.credentials === 'object') ? body.credentials as Record<string, string> : {};

  const result = await saveUserStorageProvider(session.userId, {
    provider: provider as UserStorageProviderType,
    config,
    credentials,
  });

  if (!result.ok) {
    return NextResponse.json({ error: (result as { error: string }).error }, { status: 400 });
  }

  await safeAuditEvent({
    userId:           session.userId,
    eventType:        'user_storage_provider_saved',
    eventDescription: `${session.email} saved a ${provider} storage provider configuration. Must be tested before uploads use it.`,
    correlationId:    getRequestId(req),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  await deleteUserStorageProvider(session.userId);

  await safeAuditEvent({
    userId:           session.userId,
    eventType:        'user_storage_provider_removed',
    eventDescription: `${session.email} removed their own cloud storage provider configuration. Uploads revert to App storage.`,
    correlationId:    getRequestId(req),
  });

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
