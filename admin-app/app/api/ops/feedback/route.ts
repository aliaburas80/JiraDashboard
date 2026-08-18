import { NextRequest, NextResponse } from 'next/server';
import { requireFullyAuthenticatedAdmin } from '../../../../lib/adminGuard';
import {
  createOrganizationAuditEvent,
  listOrganizationFeedback,
  updateOrganizationFeedback,
} from '../../../../../src/server/tenancy/adminOperationalRepository';

const ALLOWED_STATUSES = new Set(['New', 'Reviewing', 'Accepted', 'Planned', 'In Progress', 'Released', 'Rejected']);

export async function GET(req: NextRequest) {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  const take = Number(new URL(req.url).searchParams.get('take') ?? 200);
  const feedback = await listOrganizationFeedback(guard.admin.organizationId, take);
  return NextResponse.json({
    feedback: feedback.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  let body: { id?: string; status?: string; statusNote?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  if (!body.id) return NextResponse.json({ error: 'Feedback id is required.' }, { status: 400 });
  if (body.status && !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Unsupported feedback status.' }, { status: 400 });
  }

  const updated = await updateOrganizationFeedback(guard.admin.organizationId, body.id, {
    ...(body.status ? { status: body.status } : {}),
    ...(typeof body.statusNote === 'string' ? { statusNote: body.statusNote.trim() || null } : {}),
  });
  if (!updated) return NextResponse.json({ error: 'Feedback not found.' }, { status: 404 });

  await createOrganizationAuditEvent({
    organizationId: guard.admin.organizationId,
    userId: guard.admin.id,
    eventType: 'admin_feedback_update',
    eventDescription: `${guard.admin.email} updated feedback ${body.id} in the separate Admin console.`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
