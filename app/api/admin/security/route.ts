// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/security — run security checks and return report (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { runSecurityChecks } from '@/services/settings/securityCheck.service';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { getRequestId } from '@/lib/requestId';

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const report = runSecurityChecks();

  // P0A-07: this report discloses sensitive configuration state (whether
  // SESSION_SECRET/CONFIG_ENCRYPTION_KEY are weak/default, DB path existence,
  // etc.) — it had zero audit logging until now, unlike every other admin route.
  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_security_report_viewed',
    eventDescription: `${session.email} viewed the security checks report (score ${report.overallScore}/100, ${report.criticalFails} critical failing check(s)).`,
    correlationId: getRequestId(req),
  });

  return NextResponse.json(report);
}

export const dynamic = 'force-dynamic';
