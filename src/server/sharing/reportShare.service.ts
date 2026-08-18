// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import 'server-only';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { generateShareToken, hashShareToken } from '@/lib/shareToken';
import type { SharedReportPayload, SharedRiskItem } from '@/services/export/sharedReportPayload.service';
import { isCapabilityOwnerActive } from '@/server/tenancy/capabilityAccess';

const SHARE_KEY_PREFIX = 'report-share:';
const MAX_ACTIVE_SHARES = 50;

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validString(value: unknown, max: number, allowEmpty = true): value is string {
  return typeof value === 'string' && value.length <= max && (allowEmpty || value.trim().length > 0);
}

function validFinite(value: unknown, nonnegative = false): value is number {
  return typeof value === 'number' && Number.isFinite(value) && (!nonnegative || value >= 0);
}

function parseRisk(value: unknown): SharedRiskItem | null {
  if (!isObject(value)) return null;
  if (!validString(value.key, 80) || !validString(value.summary, 500) || !validString(value.status, 100)) return null;
  if (value.assignee !== undefined && !validString(value.assignee, 200)) return null;
  if (value.reason !== undefined && !validString(value.reason, 500)) return null;
  return {
    key: value.key,
    summary: value.summary,
    status: value.status,
    assignee: value.assignee as string | undefined,
    reason: value.reason as string | undefined,
  };
}

export function parseSharedReport(value: unknown): SharedReportPayload | null {
  if (!isObject(value) || value.version !== 1) return null;
  if (!validString(value.title, 120, false)) return null;
  if (!validString(value.generatedAt, 40, false) || !Number.isFinite(Date.parse(value.generatedAt))) return null;
  if (!validFinite(value.healthScore)) return null;
  if (!validFinite(value.totalIssues, true) || !validFinite(value.doneIssues, true)) return null;
  if (!validFinite(value.completionRate)) return null;
  if (!validFinite(value.blockedIssues, true) || !validFinite(value.openDefects, true)) return null;
  if (!validFinite(value.averageLeadTimeDays, true) || !validFinite(value.averageCycleTimeDays, true)) return null;
  if (!Array.isArray(value.risks) || value.risks.length > 25) return null;
  const risks = value.risks.map(parseRisk);
  if (risks.some(risk => risk === null)) return null;

  return {
    version: 1,
    title: value.title.trim(),
    generatedAt: value.generatedAt,
    healthScore: value.healthScore,
    totalIssues: value.totalIssues,
    doneIssues: value.doneIssues,
    completionRate: value.completionRate,
    blockedIssues: value.blockedIssues,
    openDefects: value.openDefects,
    averageLeadTimeDays: value.averageLeadTimeDays,
    averageCycleTimeDays: value.averageCycleTimeDays,
    risks: risks as SharedRiskItem[],
  };
}

function parseStored(value: string): StoredShareRecord | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isObject(parsed) || !validString(parsed.id, 100, false)) return null;
    const report = parseSharedReport(parsed.report);
    if (!report || !validString(parsed.createdAt, 40, false)) return null;
    if (parsed.expiresAt !== null && !validString(parsed.expiresAt, 40, false)) return null;
    if (parsed.revokedAt !== null && !validString(parsed.revokedAt, 40, false)) return null;
    if (parsed.lastAccessedAt !== null && !validString(parsed.lastAccessedAt, 40, false)) return null;
    if (!validFinite(parsed.accessCount, true)) return null;
    return {
      id: parsed.id,
      report,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt as string | null,
      revokedAt: parsed.revokedAt as string | null,
      lastAccessedAt: parsed.lastAccessedAt as string | null,
      accessCount: parsed.accessCount,
    };
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
  const report = parseSharedReport(input.report);
  if (!report) throw new Error('INVALID_REPORT');

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
    id: `share_${randomUUID()}`,
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
  return rows
    .map(row => parseStored(row.valueJson))
    .filter((row): row is StoredShareRecord => Boolean(row))
    .map(summaryOf);
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
    select: { id: true, ownerId: true, valueJson: true },
  });
  if (!row) return { state: 'not_found' };

  // A capability cannot outlive the account that issued it. This also makes
  // admin suspension effective immediately without relying on every account
  // lifecycle path to remember to revoke public links first.
  if (!(await isCapabilityOwnerActive(row.ownerId))) return { state: 'not_found' };

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
