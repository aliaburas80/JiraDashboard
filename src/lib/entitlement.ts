// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-015: Trial Entitlement State Machine
// All entitlement logic lives here. Never scattered across routes.
//
// State machine:
//   eligible   → processing (upload started)
//   processing → consumed  (upload succeeded, sets consumedAt + expiresAt)
//   processing → eligible  (upload failed — revert, no entitlement consumed)
//   consumed   → expired   (expiresAt has passed — checked lazily on each request)
//   any        → suspended (admin action)
//   suspended/expired/consumed → restored → eligible (admin action)

import { prisma } from '@/lib/prisma';

export const TRIAL_DAYS = 30;

// Statuses visible outside this module
export type EntitlementStatus =
  | 'eligible'
  | 'processing'
  | 'consumed'
  | 'expired'
  | 'suspended'
  | 'restored';

export interface EntitlementView {
  status:     EntitlementStatus;
  consumedAt: Date | null;
  expiresAt:  Date | null;
  daysLeft:   number | null; // null when not consumed or expired
}

// ── Read ───────────────────────────────────────────────────────────────────────

export async function getEntitlementForUser(userId: string): Promise<EntitlementView | null> {
  const ent = await prisma.entitlement.findUnique({ where: { userId } });
  if (!ent) return null;

  // Lazily expire consumed entitlements whose window has passed
  if (ent.status === 'consumed' && ent.expiresAt && new Date() > ent.expiresAt) {
    await prisma.entitlement.update({
      where: { id: ent.id },
      data:  { status: 'expired', updatedAt: new Date() },
    });
    return { status: 'expired', consumedAt: ent.consumedAt, expiresAt: ent.expiresAt, daysLeft: 0 };
  }

  // Also lazily recover stuck 'processing' states older than 10 minutes
  if (ent.status === 'processing') {
    const stuckThreshold = new Date(Date.now() - 10 * 60_000);
    if (ent.updatedAt < stuckThreshold) {
      await prisma.entitlement.update({
        where: { id: ent.id },
        data:  { status: 'eligible', updatedAt: new Date() },
      });
      return { status: 'eligible', consumedAt: null, expiresAt: null, daysLeft: null };
    }
  }

  const daysLeft = ent.expiresAt && ent.status === 'consumed'
    ? Math.max(0, Math.ceil((ent.expiresAt.getTime() - Date.now()) / 86_400_000))
    : null;

  return {
    status:     ent.status as EntitlementStatus,
    consumedAt: ent.consumedAt,
    expiresAt:  ent.expiresAt,
    daysLeft,
  };
}

// ── Check before upload ────────────────────────────────────────────────────────

export interface EntitlementCheckResult {
  allowed:  boolean;
  reason?:  'not_found' | 'consumed' | 'expired' | 'suspended' | 'processing';
  message?: string;
}

export async function checkUploadEntitlement(userId: string, isAdmin: boolean): Promise<EntitlementCheckResult> {
  // Admins bypass entitlement — owner can always upload
  if (isAdmin) return { allowed: true };

  const ent = await getEntitlementForUser(userId);

  if (!ent)              return { allowed: false, reason: 'not_found',   message: 'No entitlement record found. Contact support.' };
  if (ent.status === 'suspended') return { allowed: false, reason: 'suspended',  message: 'Your account entitlement has been suspended. Contact support.' };
  if (ent.status === 'expired')   return { allowed: false, reason: 'expired',    message: 'Your 30-day free trial has expired. Contact support for renewal options.' };
  if (ent.status === 'consumed')  return { allowed: false, reason: 'consumed',   message: `You have used your free analysis. Your workspace is in read-only mode for ${ent.daysLeft ?? 0} more day${ent.daysLeft !== 1 ? 's' : ''}.` };
  if (ent.status === 'processing') return { allowed: false, reason: 'processing', message: 'An upload is already in progress for your account. Please wait.' };

  return { allowed: true }; // eligible or restored
}

// ── Mark processing (optimistic lock before upload starts) ────────────────────

export async function beginUploadEntitlement(userId: string): Promise<boolean> {
  const result = await prisma.entitlement.updateMany({
    where: { userId, status: { in: ['eligible', 'restored'] } },
    data:  { status: 'processing', updatedAt: new Date() },
  });
  return result.count === 1;
}

// ── Consume on success ─────────────────────────────────────────────────────────

export async function consumeEntitlement(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId:      string,
  importLogId: string,
): Promise<void> {
  const consumedAt = new Date();
  const expiresAt  = new Date(consumedAt.getTime() + TRIAL_DAYS * 86_400_000);

  await tx.entitlement.update({
    where: { userId },
    data:  {
      status:     'consumed',
      consumedAt,
      expiresAt,
      importLogId,
      updatedAt:  consumedAt,
    },
  });
}

// ── Revert on failure (never consumed if upload fails) ────────────────────────

export async function revertEntitlement(userId: string): Promise<void> {
  // Only revert if still in 'processing' — prevents double-revert
  await prisma.entitlement.updateMany({
    where: { userId, status: 'processing' },
    data:  { status: 'eligible', updatedAt: new Date() },
  });
}

// ── Admin: create entitlement for a new user ───────────────────────────────────

export async function createEntitlementForUser(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId:      string,
  workspaceId: string,
): Promise<void> {
  await tx.entitlement.create({
    data: { userId, workspaceId, status: 'eligible' },
  });
}

// ── Admin: restore entitlement ─────────────────────────────────────────────────

export async function restoreEntitlement(
  userId:      string,
  adminUserId: string,
  note?:       string,
): Promise<void> {
  await prisma.entitlement.update({
    where: { userId },
    data:  {
      status:       'eligible',
      consumedAt:   null,
      expiresAt:    null,
      importLogId:  null,
      restoredBy:   adminUserId,
      restoredAt:   new Date(),
      restoredNote: note ?? null,
      updatedAt:    new Date(),
    },
  });
}
