// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/backend-view — session-aware import log overview.
// - Authenticated user  → only their own logs
// - Admin               → all users' logs with name and email
// - Unauthenticated     → static endpoint index only, no import data (see
//   2026-07-18 note below)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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

  // ── Fallback: unauthenticated — static endpoint index only ────────────────
  //
  // SEC (2026-07-18, docs/product-audit/10-technical-cleanup.md Part 1
  // finding 2): this used to call readImportLogs(), reading
  // data/import-logs.json — the SAME single flat file, shared globally by
  // every user with no per-user scoping whatsoever, that GET /api/imports'
  // 2026-07-08 P0 fix (see that route's own comment) removed entirely from
  // ITS unauthenticated path for exactly this reason: "no legitimate case
  // where this route should ever answer without a valid session or with
  // unscoped data." That file is still actively written on every upload
  // (app/api/upload/route.ts's appendImportLog() call) — so this fallback
  // was serving real cross-account filenames, row counts, statuses, and file
  // sizes to any unauthenticated caller, unlike the route's own doc comment
  // claimed ("no user data"): userName/userEmail were nulled out, but
  // filename/rowCount/status/filesize were not, and a filename alone can be
  // sensitive (client/project names, confidential markers). Unlike
  // /api/imports, this route's whole purpose also includes doubling as a
  // public, unauthenticated API index (see the "endpoints" list returned
  // below and its inclusion in PUBLIC_API in middleware.ts), so the fix here
  // is narrower than that route's outright 401: keep the endpoint index
  // public, drop the real import data instead of substituting a different
  // unscoped source.
  return NextResponse.json({
    stats: {
      totalImports: null, successfulImports: null, failedImports: null,
      lastImport: null, lastFilename: null, lastRowCount: null,
    },
    logs: [],
    endpoints: ENDPOINTS,
    isAdmin: false,
    currentUser: null,
  });
}
