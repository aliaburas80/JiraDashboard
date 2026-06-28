import { NextResponse } from 'next/server';
import packageJson from '../../../package.json';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'delivery-clarity',
    version: packageJson.version,
    timestamp: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
