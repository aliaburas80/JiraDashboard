import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'delivery-clarity-admin',
    version: process.env.APP_VERSION ?? '2.0.0',
  });
}

export const dynamic = 'force-dynamic';
