// @ts-nocheck
import { NextResponse } from 'next/server';
import { readImportLogs } from '@/services/imports/importLogs.service';
export async function GET() {
  try {
    const logs = readImportLogs();
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: 'Failed to read import logs' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
