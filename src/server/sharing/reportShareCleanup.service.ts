// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Explicit lifecycle cleanup for the temporary AppSetting-backed share store.
// AppSetting.ownerId is not a User foreign key, so share rows would otherwise
// survive user-data reset or account deletion and keep public reports reachable.

import { prisma } from '@/lib/prisma';

const SHARE_KEY_PREFIX = 'report-share:';

/** Permanently removes every report-share record owned by one user. */
export async function deleteReportSharesForUser(userId: string): Promise<number> {
  const result = await prisma.appSetting.deleteMany({
    where: { ownerId: userId, key: { startsWith: SHARE_KEY_PREFIX } },
  });
  return result.count;
}
