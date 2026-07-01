import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerEnv } from '@/lib/env/server';
import { logServerEvent } from '@/lib/logger';
import packageJson from '../../../package.json';

const READINESS_TIMEOUT_MS = 3_000;

async function checkDatabase(): Promise<void> {
  await Promise.race([
    prisma.$queryRaw`SELECT 1`,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database readiness check timed out.')), READINESS_TIMEOUT_MS);
    }),
  ]);
}

export async function GET() {
  try {
    getServerEnv();
    await checkDatabase();

    return NextResponse.json({
      status:    'ready',
      service:   'delivery-clarity',
      version:   packageJson.version,
      timestamp: new Date().toISOString(),
      checks:    { database: 'ok' },
    });
  } catch (error) {
    logServerEvent('warn', 'readiness.failed', {
      error: error instanceof Error ? error.message : 'Unknown readiness failure.',
    });

    return NextResponse.json(
      {
        status:    'not_ready',
        service:   'delivery-clarity',
        version:   packageJson.version,
        timestamp: new Date().toISOString(),
        checks:    { database: 'unavailable' },
      },
      { status: 503 },
    );
  }
}

export const dynamic = 'force-dynamic';
