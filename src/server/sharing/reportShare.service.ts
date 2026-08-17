// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import 'server-only';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateShareToken, hashShareToken } from '@/lib/shareToken';
import type { SharedReportPayload } from '@/services/export/sharedReportPayload.service';

const SHARE_KEY_PREFIX = 'report-share:';
const MAX_ACTIVE_SHARES = 50;

const riskSchema = z.object({
  key: z.string().max(80),
  summary: z.string().max(500),
  status: z.string().max(100),
  assignee: z.string().max(200).optional(),
  reason: z.string().max(500).optional(),
});

export const sharedReportSchema = z.object({
  version: z.literal(1),
  title: z.string().trim().min(1).max(120),
  generatedAt: z.string().datetime(),
  healthScore: z.number().finite(),
  totalIssues: z.number().finite().nonnegative(),
  doneIssues: z.number().finite().nonnegative(),
  completionRate: z.number().finite(),
  blockedIssues: z.number().finite().nonnegative(),
  openDefects: z.number().finite().nonnegative(),
  averageLeadTimeDays: z.number().finite().nonnegative(),
  averageCycleTimeDays: z.number().finite().nonnegative(),
  risks: z.array(riskSchema).max(25),
});

interface StoredShareRecord {
  id: string;
  report: SharedReportPayload;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
}

export interface ReportShareSummary {
  id: string;
  title: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
  status: 'active' | 'expired' | 'revoked';
}

export type ResolveShareResult =
  | { state: 'active'; report: SharedReportPayload; expiresAt: string | null }
  | { state: 'expired' | 'revoked' | 'not_found' };

function parseStored(value: string): StoredShareRecord | null {
  try {
    const parsed = JSON.parse(value) as StoredShareRecord;
    if (!parsed || typeof parsed.id !== 'string' || !parsed.report) return null;
    const report = sharedReportSchema.parse(parsed.report);
    return { ...parsed, report };
  } catch {
    return null;
  }
}

function statusOf(record: StoredShareRecord, now = new Date()): ReportShareSummary['status'] {
  if (record.revokedAt) return 'revoked';
  if (record.expiresAt && new Date(record.expiresAt).getTime() <= now.getTime()) return 'expired';
  return 'active';
}

function summaryOf(record: StoredShareRecord): ReportShareSummary {
  return {
    id: record.id,
    title: record.report.title,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt,
    lastAccessedAt: record.lastAccessedAt,
    accessCount: record.accessCount,
    status: statusOf(record),
  };
}

export async function createReportShare(input: {
  userId: string;
  report: unknown;
  expiresInDays?: number | null;
}): Promise<{ token: string; share: ReportShareSummary }> {
  const report = sharedReportSchema.parse(input.report) as SharedReportPayload;
  const existing = await prisma.appSetting.findMany({
    where: { ownerId: input.userId, key: { startsWith: SHARE_KEY_PREFIX } },
    select: { valueJson: true },
  });
  const activeCount = existing.reduce((count, row) => {
    const record = parseStored(row.valueJson);
    return count + (record && statusOf(record) === 'active' ? 1 : 0);
  }, 0);
  if (activeCount >= MAX_ACTIVE_SHARES) throw new Error('ACTIVE_SHARE_LIMIT');

  const token = generateShareToken();
  const tokenHash = hashShareToken(token);
  const createdAt = new Date();
  const expiresAt = input.expiresInDays
    ? new Date(createdAt.getTime() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const record: StoredShareRecord = {
    id: `share_${crypto.randomUUID()}`,
    report,
    createdAt: createdAt.toISOString(),
    expiresAt,
    revokedAt: null,
    lastAccessedAt: null,
    accessCount: 0,
  };

  await prisma.appSetting.create({
    data: {
      ownerId: input.userId,
      key: `${SHARE_KEY_PREFIX}${tokenHash}`,
      valueJson: JSON.stringify(record),
      updatedBy: input.userId,
    },
  });

  return { token, share: summaryOf(record) };
}

export async function listReportShares(userId: string): Promise<ReportShareSummary[]> {
  const rows = await prisma.appSetting.findMany({
    where: { ownerId: userId, key: { startsWith: SHARE_KEY_PREFIX } },
    orderBy: { createdAt: 'desc' },
    select: { valueJson: true },
  });
  return rows.map(row => parseStored(row.valueJson)).filter((row): row is StoredShareRecord => Boolean(row)).map(summaryOf);
}

export async function revokeReportShare(userId: string, shareId: string): Promise<boolean> {
  const rows = await prisma.appSetting.findMany({
    where: { ownerId: userId, key: { startsWith: SHARE_KEY_PREFIX } },
    select: { id: true, valueJson: true },
  });
  for (const row of rows) {
    const record = parseStored(row.valueJson);
    if (!record || record.id !== shareId) continue;
    if (!record.revokedAt) record.revokedAt = new Date().toISOString();
    await prisma.appSetting.update({ where: { id: row.id }, data: { valueJson: JSON.stringify(record), updatedBy: userId } });
    return true;
  }
  return false;
}

export async function resolveReportShare(rawToken: string): Promise<ResolveShareResult> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(rawToken)) return { state: 'not_found' };
  const tokenHash = hashShareToken(rawToken);
  const row = await prisma.appSetting.findFirst({
    where: { key: `${SHARE_KEY_PREFIX}${tokenHash}` },
    select: { id: true, valueJson: true },
  });
  if (!row) return { state: 'not_found' };
  const record = parseStored(row.valueJson);
  if (!record) return { state: 'not_found' };
  const status = statusOf(record);
  if (status === 'revoked') return { state: 'revoked' };
  if (status === 'expired') return { state: 'expired' };

  record.lastAccessedAt = new Date().toISOString();
  record.accessCount += 1;
  await prisma.appSetting.update({ where: { id: row.id }, data: { valueJson: JSON.stringify(record) } });
  return { state: 'active', report: record.report, expiresAt: record.expiresAt };
}
