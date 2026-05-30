// @ts-nocheck
// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { NextResponse } from 'next/server';
import { readImportLogs } from '@/services/imports/importLogs.service';

export const dynamic = 'force-dynamic';

const ENDPOINTS = [
  { method: 'POST', path: '/api/upload',        description: 'Upload a Jira CSV or Excel file and trigger import processing' },
  { method: 'GET',  path: '/api/imports',       description: 'List all import log entries stored in the data directory' },
  { method: 'GET',  path: '/api/metrics',       description: 'Return computed KPI metrics derived from the latest successful import' },
  { method: 'GET',  path: '/api/dashboard',     description: 'Return dashboard status and service metadata' },
  { method: 'GET',  path: '/api/health',        description: 'Health check — confirms the API service is running' },
  { method: 'GET',  path: '/api/backend-view',  description: 'JSON overview of import stats, recent logs, and all API endpoints' },
  { method: 'GET',  path: '/api/developer-view', description: 'Developer wiki — architecture, services, and data-flow documentation' },
];

export async function GET() {
  try {
    const logs = readImportLogs();

    const totalImports = logs.length;
    const successfulImports = logs.filter((log) => log.status === 'success').length;
    const failedImports = logs.filter(
      (log) => log.status === 'failed' || log.status === 'validation_failed',
    ).length;

    const lastLog = logs[0] ?? null;
    const lastImport = lastLog ? lastLog.importedAt : null;
    const lastFilename = lastLog ? lastLog.file.name : null;
    const lastRowCount = lastLog ? lastLog.extraction.rowCount : null;

    const stats = {
      totalImports,
      successfulImports,
      failedImports,
      lastImport,
      lastFilename,
      lastRowCount,
    };

    return NextResponse.json({
      stats,
      logs: logs.slice(0, 10),
      endpoints: ENDPOINTS,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to build backend view', details: String(error) },
      { status: 500 },
    );
  }
}
