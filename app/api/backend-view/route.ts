// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// GET /api/backend-view — session-aware import log overview.
// - Authenticated user  → only their own logs
// - Admin               → all users' logs with name and email
// - Unauthenticated     → file-based fallback (no user data)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { readImportLogs } from '@/services/imports/importLogs.service';

export const dynamic = 'force-dynamic';

const ENDPOINTS = [
  { method: 'POST', path: '/api/upload',         description: 'Upload a Jira CSV or Excel file and trigger import processing' },
  { method: 'POST', path: '/api/upload/merge',   description: 'Merge up to 10 Jira exports into one unified report' },
  { method: 'GET',  path: '/api/imports',        description: 'List import logs for the current user (admin: ?all=true for all)' },
  { method: 'GET',  path: '/api/metrics',        description: 'Return computed KPI metrics from the latest successful import' },
  { method: 'GET',  path: '/api/dashboard',      description: 'Return dashboard status and service metadata' },
  { method: 'GET',  path: '/api/health',         description: 'Health check — confirms the API service is running' },
  { method: 'GET',  path: '/api/backend-view',   description: 'JSON overview of import stats, recent logs, and all API endpoints' },
  { method: 'GET',  path: '/api/developer-view', description: 'Developer wiki — architecture, services, and data-flow docs' },
  { method: 'POST', path: '/api/auth/login',     description: 'Authenticate with email + password — sets session cookie' },
  { method: 'POST', path: '/api/auth/logout',    description: 'Clear session cookie' },
  { method: 'POST', path: '/api/auth/register',  description: 'Inactive public registration endpoint — returns 403' },
  { method: 'POST', path: '/api/auth/change-password', description: 'Authenticated first-login password change' },
  { method: 'GET',  path: '/api/auth/me',        description: 'Return the current authenticated user' },
  { method: 'GET/PATCH', path: '/api/profile',   description: 'Read or update the current user member profile' },
  { method: 'GET/POST', path: '/api/profile/image', description: 'Upload or stream S3-backed profile images under images/profile/' },
  { method: 'GET',  path: '/api/members',        description: 'List active members for the logged-in user directory' },
  { method: 'GET/POST/PATCH/DELETE', path: '/api/admin/users', description: 'Admin-only user management' },
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Session-aware DB path ─────────────────────────────────────────────────
  try {
    const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);

    if (session.isLoggedIn) {
      const isAdmin = session.role === 'admin';

      const dbLogs = await prisma.importLog.findMany({
        where:   isAdmin ? {} : { userId: session.userId },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { uploadedAt: 'desc' },
        take:    50,
      });

      const total      = dbLogs.length;
      const successful = dbLogs.filter(l => l.status === 'success').length;
      const failed     = dbLogs.filter(l => ['failed', 'validation_failed'].includes(l.status)).length;
      const last       = dbLogs[0] ?? null;

      const stats = {
        totalImports:      total,
        successfulImports: successful,
        failedImports:     failed,
        lastImport:        last?.uploadedAt?.toISOString() ?? null,
        lastFilename:      last?.fileName ?? null,
        lastRowCount:      last?.rowCount ?? null,
      };

      const logs = dbLogs.map(l => ({
        id:          l.id,
        timestamp:   l.uploadedAt?.toISOString() ?? null,
        filename:    l.fileName,
        rowCount:    l.rowCount,
        status:      l.status,
        filesize:    l.fileSize,
        healthScore: l.healthScore,
        totalIssues: l.totalIssues,
        // Only expose user identity to admins
        userName:    isAdmin ? (l.user?.name  ?? 'Unknown') : null,
        userEmail:   isAdmin ? (l.user?.email ?? '')        : null,
      }));

      return NextResponse.json({
        stats, logs, endpoints: ENDPOINTS,
        isAdmin, currentUser: { name: session.name, email: session.email, role: session.role },
      });
    }
  } catch {
    // Prisma unavailable or session error — fall through
  }

  // ── Fallback: file-based logs (unauthenticated) ───────────────────────────
  try {
    const logs     = readImportLogs();
    const total      = logs.length;
    const successful = logs.filter((l) => l.status === 'success').length;
    const failed     = logs.filter((l) => ['failed', 'validation_failed'].includes(l.status)).length;
    const last = (logs[0] ?? null) as any;

    const stats = {
      totalImports:      total,
      successfulImports: successful,
      failedImports:     failed,
      lastImport:        last ? (last.importedAt ?? last.timestamp ?? null) : null,
      lastFilename:      last ? (last.file?.name ?? last.filename ?? null)  : null,
      lastRowCount:      last ? (last.extraction?.rowCount ?? last.rowCount ?? null) : null,
    };

    const normalisedLogs = logs.slice(0, 20).map((log: any) => ({
      timestamp:   log.importedAt ?? log.timestamp ?? null,
      filename:    log.file?.name ?? log.filename  ?? null,
      rowCount:    log.extraction?.rowCount ?? log.rowCount ?? null,
      status:      log.status    ?? 'unknown',
      filesize:    log.file?.sizeBytes ?? log.filesize ?? null,
      healthScore: null,
      totalIssues: null,
      userName:    null,
      userEmail:   null,
    }));

    return NextResponse.json({
      stats, logs: normalisedLogs, endpoints: ENDPOINTS,
      isAdmin: false, currentUser: null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to build backend view', details: String(error) }, { status: 500 });
  }
}
