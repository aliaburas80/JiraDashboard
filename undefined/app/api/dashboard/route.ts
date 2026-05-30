// @ts-nocheck
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'delivery-clarity-api', version: '2.0.0' });
}
