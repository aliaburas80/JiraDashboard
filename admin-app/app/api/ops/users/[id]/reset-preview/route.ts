import { NextResponse } from 'next/server';
import { requireFullyAuthenticatedAdmin } from '../../../../../../lib/adminGuard';
import { findOrganizationUserById } from '../../../../../../../src/server/tenancy/adminOperationalRepository';
import { previewUserReset } from '../../../../../../../src/services/settings/userReset.service';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  const { id } = await params;
  const target = await findOrganizationUserById(guard.admin.organizationId, id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const preview = await previewUserReset(id);
  return NextResponse.json({ preview });
}

export const dynamic = 'force-dynamic';
