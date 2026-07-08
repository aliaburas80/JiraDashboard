// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Small DB-backed settings store for admin settings that can be either
// profile-specific or global. Super-admin saves write to the global owner so
// every user inherits them; regular admin saves write only to that profile.

import { prisma } from '@/lib/prisma';

export const GLOBAL_SETTINGS_OWNER = 'global';

export interface SettingsScopeInput {
  userId: string;
  isSuperAdmin?: boolean;
}

export function ownerForWrite(scope: SettingsScopeInput): string {
  return scope.isSuperAdmin ? GLOBAL_SETTINGS_OWNER : scope.userId;
}

export async function readScopedSetting<T>(
  key: string,
  userId: string,
  fallback: () => T,
): Promise<T> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key, ownerId: { in: [userId, GLOBAL_SETTINGS_OWNER] } },
    });
    const own = rows.find(row => row.ownerId === userId);
    const global = rows.find(row => row.ownerId === GLOBAL_SETTINGS_OWNER);
    const selected = own ?? global;
    if (selected?.valueJson) return JSON.parse(selected.valueJson) as T;
  } catch {
    // DB unavailable, corrupt JSON, or Prisma client not generated yet.
  }
  return fallback();
}

export async function writeScopedSetting<T>(
  key: string,
  value: T,
  scope: SettingsScopeInput & { updatedBy?: string },
): Promise<void> {
  const ownerId = ownerForWrite(scope);
  await prisma.appSetting.upsert({
    where: { ownerId_key: { ownerId, key } },
    create: {
      ownerId,
      key,
      valueJson: JSON.stringify(value),
      updatedBy: scope.updatedBy ?? null,
    },
    update: {
      valueJson: JSON.stringify(value),
      updatedBy: scope.updatedBy ?? null,
    },
  });
}
