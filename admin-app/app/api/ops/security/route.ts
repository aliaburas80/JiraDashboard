import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerAdmin } from '../../../../lib/adminGuard';
import { safeAdminAudit } from '../../../../lib/auth';
import { runAdminSecurityChecks } from '../../../../lib/securityChecks';

export async function GET(req: NextRequest) {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;

  const report = runAdminSecurityChecks();
  await safeAdminAudit({
    organizationId: guard.admin.organizationId,
    userId: guard.admin.id,
    eventType: 'admin_security_report_viewed',
    eventDescription: `${guard.admin.email} viewed the security checks report in the separate Admin console (score ${report.overallScore}/100, ${report.criticalFails} critical failing check(s)).`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json(report);
}

export const dynamic = 'force-dynamic';
