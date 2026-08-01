// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-015: Trial Entitlement State Machine
// All entitlement logic lives here. Never scattered across routes.
//
// State machine:
//   eligible   → processing (upload started)
//   processing → consumed  (upload succeeded, sets consumedAt + expiresAt)
//   processing → eligible  (upload failed — revert, no entitlement consumed)
//   consumed   → consumed  (one replacement upload within 24h of consumedAt —
//                           sets replacementUsedAt, never touches status/consumedAt/expiresAt)
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
  status:            EntitlementStatus;
  consumedAt:        Date | null;
  expiresAt:         Date | null;
  daysLeft:          number | null; // null when not consumed or expired
  replacementUsedAt: Date | null;
}

// EP-015: master plan §4.1 — "optionally allow one replacement upload within
// 24 hours of the first successful analysis." Anchored to the original
// consumedAt/expiresAt (does not reset the 30-day clock) — a replacement is a
// correction, not a fresh grant.
const REPLACEMENT_WINDOW_MS = 24 * 60 * 60_000;

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
    return { status: 'expired', consumedAt: ent.consumedAt, expiresAt: ent.expiresAt, daysLeft: 0, replacementUsedAt: ent.replacementUsedAt };
  }

  // Also lazily recover stuck 'processing' states older than 10 minutes
  if (ent.status === 'processing') {
    const stuckThreshold = new Date(Date.now() - 10 * 60_000);
    if (ent.updatedAt < stuckThreshold) {
      await prisma.entitlement.update({
        where: { id: ent.id },
        data:  { status: 'eligible', updatedAt: new Date() },
      });
      return { status: 'eligible', consumedAt: null, expiresAt: null, daysLeft: null, replacementUsedAt: null };
    }
  }

  const daysLeft = ent.expiresAt && ent.status === 'consumed'
    ? Math.max(0, Math.ceil((ent.expiresAt.getTime() - Date.now()) / 86_400_000))
    : null;

  return {
    status:            ent.status as EntitlementStatus,
    consumedAt:        ent.consumedAt,
    expiresAt:         ent.expiresAt,
    daysLeft,
    replacementUsedAt: ent.replacementUsedAt,
  };
}

// ── Check before upload ────────────────────────────────────────────────────────

export interface EntitlementCheckResult {
  allowed:        boolean;
  reason?:        'not_found' | 'consumed' | 'expired' | 'suspended' | 'processing';
  message?:       string;
  isReplacement?: boolean;
}

export async function checkUploadEntitlement(userId: string, isAdmin: boolean): Promise<EntitlementCheckResult> {
  // Admins bypass entitlement — owner can always upload
  if (isAdmin) return { allowed: true };

  const ent = await getEntitlementForUser(userId);

  if (!ent)              return { allowed: false, reason: 'not_found',   message: 'No entitlement record found. Contact support.' };
  if (ent.status === 'suspended') return { allowed: false, reason: 'suspended',  message: 'Your account entitlement has been suspended. Contact support.' };
  if (ent.status === 'expired')   return { allowed: false, reason: 'expired',    message: 'Your 30-day free trial has expired. Contact support for renewal options.' };
  if (ent.status === 'consumed') {
    // EP-015: master plan §4.1 — one replacement upload allowed within 24h of
    // the original successful analysis, provided it hasn't been used yet.
    if (!ent.replacementUsedAt && ent.consumedAt && (Date.now() - ent.consumedAt.getTime()) <= REPLACEMENT_WINDOW_MS) {
      return { allowed: true, isReplacement: true };
    }
    return { allowed: false, reason: 'consumed', message: `You have used your free analysis. Your workspace is in read-only mode for ${ent.daysLeft ?? 0} more day${ent.daysLeft !== 1 ? 's' : ''}.` };
  }
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

// ── Replacement upload (EP-015, master plan §4.1) ──────────────────────────────
// Mirrors begin/consume/revert above, but operates on `replacementUsedAt` as
// the lock field instead of `status` — a replacement never leaves `status`
// at anything other than 'consumed', in either the lock or the revert path.
// Flipping `status` away from 'consumed' on a failed replacement would wrongly
// grant a fresh 30-day trial, so these functions deliberately never touch it.

export async function beginReplacementUpload(userId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - REPLACEMENT_WINDOW_MS);
  const result = await prisma.entitlement.updateMany({
    where: {
      userId,
      status:            'consumed',
      replacementUsedAt: null,
      consumedAt:        { gte: windowStart },
    },
    data: { replacementUsedAt: new Date() },
  });
  return result.count === 1;
}

export async function revertReplacementUpload(userId: string): Promise<void> {
  await prisma.entitlement.updateMany({
    where: { userId, status: 'consumed' },
    data:  { replacementUsedAt: null },
  });
}

export async function consumeReplacementUpload(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId:      string,
  importLogId: string,
): Promise<void> {
  // Deliberately does not touch consumedAt/expiresAt/status — the 30-day
  // clock stays anchored to the original successful analysis.
  await tx.entitlement.update({
    where: { userId },
    data:  { importLogId, updatedAt: new Date() },
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
      status:            'eligible',
      consumedAt:        null,
      expiresAt:         null,
      importLogId:       null,
      replacementUsedAt: null,
      restoredBy:        adminUserId,
      restoredAt:        new Date(),
      restoredNote:      note ?? null,
      updatedAt:         new Date(),
    },
  });
}
