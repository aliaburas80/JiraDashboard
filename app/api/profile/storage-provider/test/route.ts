// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/profile/storage-provider/test — EP-024: test the caller's own
// saved cloud storage provider. Sets `verified: true` only on real success —
// this is the only path that ever makes getVerifiedUserStorageProviderInstance
// return a usable provider for the upload pipeline.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { testUserStorageProvider } from '@/services/storage/userStorageProvider.service';

export async function POST() {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const result = await testUserStorageProvider(session.userId);
  return NextResponse.json(result);
}

export const dynamic = 'force-dynamic';
