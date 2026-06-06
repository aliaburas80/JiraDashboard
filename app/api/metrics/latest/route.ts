// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET /api/metrics/latest — load latest dashboard metrics from cloud-backed server storage.

import { NextResponse } from 'next/server';
import { readLatestMetrics } from '@/services/metrics/latestMetricsStorage';

export const dynamic = 'force-dynamic';

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

  const latest = readLatestMetrics();
  if (!latest) {
    return NextResponse.json({
      available: false,
      source: 'none',
      sync,
      error: sync?.error,
      message: sync?.reason ?? 'No latest metrics file found on the server.',
    });
  }

  const source = sourceFromSync(sync);
  return NextResponse.json({
    available: true,
    metrics: latest.metrics,
    savedAt: latest.savedAt,
    source,
    sync,
    provider: sync?.provider,
    key: sync?.key,
    message: sync?.reason,
  });
}
