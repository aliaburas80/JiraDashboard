// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-03: Consent records.
// Append-only — one row per grant/withdrawal event, never updated in place.
// Current status for a purpose is always the latest row for (userId, purpose).

import { prisma } from '@/lib/prisma';

export const CONSENT_PURPOSES = ['terms_and_privacy', 'analytics'] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export type ConsentSource = 'registration' | 'settings';

export interface RecordConsentOptions {
  version?:   string;
  source:     ConsentSource;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentStatus {
  termsAndPrivacy: { granted: boolean; version: string; acceptedAt: Date | null };
  analytics:       { granted: boolean; version: string; updatedAt: Date | null; decided: boolean };
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// ── Write ─────────────────────────────────────────────────────────────────────

export async function recordConsent(
  userId:  string,
  purpose: ConsentPurpose,
  granted: boolean,
  opts:    RecordConsentOptions,
  tx: TxClient | typeof prisma = prisma,
): Promise<void> {
  await tx.consent.create({
    data: {
      userId,
      purpose,
      granted,
      version:   opts.version ?? '',
      source:    opts.source,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
    },
  });
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getConsentStatus(userId: string): Promise<ConsentStatus> {
  const [termsRow, analyticsRow, user] = await Promise.all([
    prisma.consent.findFirst({ where: { userId, purpose: 'terms_and_privacy' }, orderBy: { createdAt: 'desc' } }),
    prisma.consent.findFirst({ where: { userId, purpose: 'analytics' },         orderBy: { createdAt: 'desc' } }),
    prisma.user.findUnique({ where: { id: userId }, select: { termsAcceptedAt: true, termsVersion: true } }),
  ]);

  // Every user who registered before this shipped has no `Consent` row for
  // terms_and_privacy — fall back to the legacy write-once User fields so
  // their status is never reported as "not accepted."
  const termsAndPrivacy = termsRow
    ? { granted: termsRow.granted, version: termsRow.version, acceptedAt: termsRow.createdAt }
    : { granted: !!user?.termsAcceptedAt, version: user?.termsVersion ?? '', acceptedAt: user?.termsAcceptedAt ?? null };

  const analytics = analyticsRow
    ? { granted: analyticsRow.granted, version: analyticsRow.version, updatedAt: analyticsRow.createdAt, decided: true }
    : { granted: false, version: '', updatedAt: null, decided: false };

  return { termsAndPrivacy, analytics };
}
