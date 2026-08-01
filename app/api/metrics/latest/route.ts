// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/metrics/latest — load latest dashboard metrics from cloud-backed server storage.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readLatestMetrics, writeLatestMetrics } from '@/services/metrics/latestMetricsStorage';
import { getMetricsScopeKeyForUser } from '@/lib/workspace';
import { getVerifiedUserStorageProviderInstance } from '@/services/storage/userStorageProvider.service';
import { getEntitlementForUser } from '@/lib/entitlement';

export const dynamic = 'force-dynamic';

// EP-024: when the local scoped cache file is missing (e.g. wiped, new
// server instance) and the user has their own verified cloud provider,
// restore their durable copy from their own bucket before giving up —
// mirrors the admin-level syncFromCloud() cache-restore, scoped to one
// user's one object instead of a whole-app backup bundle/manifest.
async function tryRestoreFromUserBucket(userId: string, scopeKey: string) {
  const provider = await getVerifiedUserStorageProviderInstance(userId).catch(() => null);
  if (!provider) return null;
  try {
    const content = await provider.download('delivery-clarity-metrics.json');
    const metrics = JSON.parse(content);
    writeLatestMetrics(scopeKey, metrics, { source: 'file' });
    return readLatestMetrics(scopeKey);
  } catch {
    return null;
  }
}

function sourceFromSync(sync: any): 'bucket' | 'cache' | 'server-local' | 'none' {
  if (!sync) return 'server-local';
  if (sync.status === 'restored') return 'bucket';
  if (sync.status === 'cache-hit') return 'cache';
  if (sync.status === 'fallback' && sync.source === 'cache') return 'cache';
  if (sync.status === 'fallback' && sync.source === 'local') return 'server-local';
  if (sync.status === 'offline' || sync.source === 'local') return 'server-local';
  return 'none';
}

export async function GET() {
  // P0A-04: metrics data is not public — require an active session.
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // EP-015/P0B-02: master plan §4.1 — after expiry, disable access to the
  // private workspace (preserve access to the demo dataset instead, via '/'
  // — see app/page.tsx's handleSampleData()). This is the one true chokepoint
  // every dashboard page funnels through via loadMetricsWithSource().
  if (session.role !== 'admin') {
    const ent = await getEntitlementForUser(session.userId).catch(() => null);
    if (ent?.status === 'expired') {
      return NextResponse.json({
        available: false,
        reason:    'expired',
        message:   'Your 30-day free trial has expired.',
      });
    }
  }

  let sync: any = null;

  try {
    const { syncFromCloud } = await import('@/services/storage/cloudSync');
    sync = await syncFromCloud();
  } catch (error) {
    sync = {
      status: 'error',
      source: 'none',
      error: error instanceof Error ? error.message : String(error),
      reason: 'Cloud sync failed before metrics load.',
    };
  }

  // EP-020: this used to read one flat file shared by every logged-in user —
  // now scoped to the caller's own workspace/user.
  const scopeKey = await getMetricsScopeKeyForUser(session.userId);
  let latest = readLatestMetrics(scopeKey);
  if (!latest) {
    latest = await tryRestoreFromUserBucket(session.userId, scopeKey);
  }
  if (!latest) {
    return NextResponse.json({
      available: false,
      source: 'none',
      sync,
      error: sync?.error,
      message: sync?.reason ?? 'No latest metrics file found on the server.',
    });
  }

  // The snapshot's own origin (set at write time by the Jira sync route or
  // upload routes) takes priority over cloud-transport detection — a dashboard
  // viewer cares whether the *data* came from Jira, not how the file reached
  // this server.
  let source: 'bucket' | 'cache' | 'server-local' | 'none' | 'jira-api' = sourceFromSync(sync);
  let connectionName: string | undefined;
  if (latest.origin?.source === 'jira-api') {
    source = 'jira-api';
    connectionName = latest.origin.connectionName;
  }

  return NextResponse.json({
    available: true,
    metrics: latest.metrics,
    savedAt: latest.savedAt,
    source,
    connectionName,
    sync,
    provider: sync?.provider,
    key: sync?.key,
    message: sync?.reason,
    // Lets the client tag its localStorage fallback cache with the actual
    // owning account, so a later read can verify it before trusting it —
    // see src/lib/storage.ts.
    userId: session.userId,
  });
}
