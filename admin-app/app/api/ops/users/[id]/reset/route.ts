import { NextRequest, NextResponse } from 'next/server';
import { requireFullyAuthenticatedAdmin } from '../../../../../../lib/adminGuard';
import { findOrganizationUserById } from '../../../../../../../src/server/tenancy/adminOperationalRepository';
import { resetUserData } from '../../../../../../../src/services/settings/userReset.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  const { id } = await params;
  const target = await findOrganizationUserById(guard.admin.organizationId, id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const result = await resetUserData(id, guard.admin.id, req.headers.get('x-request-id') ?? undefined);
  if (!result.success) return NextResponse.json({ error: result.error ?? 'Reset failed.' }, { status: 400 });
  return NextResponse.json({ ok: true, ...result });
}

export const dynamic = 'force-dynamic';
