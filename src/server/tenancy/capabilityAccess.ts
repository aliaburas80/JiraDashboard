// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Narrow public-capability owner check. Public share links have no authenticated
// organization context, so they cannot use scopedRepository(); this helper
// lives inside the tenancy boundary and returns only an allow/deny boolean.

import 'server-only';
import { prisma } from '@/lib/prisma';

export async function isCapabilityOwnerActive(userId: string): Promise<boolean> {
  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });
  return owner?.isActive === true;
}
