// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// System error logging + retry utilities for Prisma operations.
//
// Usage:
//   await safeAuditEvent({ userId, eventType, eventDescription, correlationId });
//   await safeNotifications(data);
//   const result = await withDbRetry(() => prisma.foo.create({ ... }), { context: 'route/action' });

import { prisma } from './prisma';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SysErrorPayload {
  errorCode:      string;
  errorMessage:   string;
  prismaModel?:   string;
  operation:      string;
  context?:       string;
  payload?:       unknown;
  resolution?:    string;
  correlationId?: string;
}

// ── Core logger ───────────────────────────────────────────────────────────────

export async function logSystemError(opts: SysErrorPayload): Promise<void> {
  try {
    await prisma.systemErrorLog.create({
      data: {
        errorCode:    opts.errorCode,
        errorMessage: opts.errorMessage,
        prismaModel:  opts.prismaModel ?? null,
        operation:    opts.operation,
        context:      opts.context ?? null,
        payload:      opts.payload ? JSON.stringify(opts.payload) : null,
        resolution:   opts.resolution ?? 'logged',
        correlationId: opts.correlationId ?? null,
      },
    });
  } catch {
    // Never let error logging itself crash the caller.
    console.error('[system-error-logger] Failed to write error log:', opts.errorMessage);
  }
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────

const NON_RETRIABLE = new Set(['P2002', 'P2003', 'P2025', 'P2014', 'P2015']);

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  {
    context,
    retries   = 3,
    delayMs   = 400,
  }: { context: string; retries?: number; delayMs?: number },
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const code: string = (err as any)?.code ?? '';
      // FK violations, not-found, and unique conflicts won't heal — bail immediately.
      if (NON_RETRIABLE.has(code)) throw err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  // All retries exhausted — log and rethrow
  const err = lastErr as any;
  await logSystemError({
    errorCode:    err?.code ?? 'UNKNOWN',
    errorMessage: err?.message ?? String(lastErr),
    prismaModel:  err?.meta?.modelName,
    operation:    context,
    context,
    resolution:   `failed after ${retries} retries`,
  });
  throw lastErr;
}

// ── Safe audit event ──────────────────────────────────────────────────────────
// When userId references a deleted user (ghost session), retries with userId:null
// so the audit trail is never silently dropped.

interface AuditEventData {
  userId?:          string | null;
  eventType:        string;
  eventDescription: string;
  ipAddress?:       string;
  userAgent?:       string;
  correlationId?:   string;
}

export async function safeAuditEvent(data: AuditEventData): Promise<void> {
  try {
    await prisma.auditEvent.create({ data });
  } catch (err: unknown) {
    const code = (err as any)?.code;
    if (code === 'P2003') {
      // userId no longer exists — write with system attribution and log it
      try {
        await prisma.auditEvent.create({
          data: { ...data, userId: null },
        });
        await logSystemError({
          errorCode:    'P2003',
          errorMessage: `AuditEvent.create FK violation — userId "${data.userId}" not found. Re-written with userId: null.`,
          prismaModel:  'AuditEvent',
          operation:    'auditEvent.create',
          context:      data.eventType,
          payload:      data,
          resolution:   'auto-fixed: userId set to null',
          correlationId: data.correlationId,
        });
      } catch (inner) {
        console.error('[safeAuditEvent] Could not write audit event even with null userId:', inner);
      }
    } else {
      await logSystemError({
        errorCode:    code ?? 'UNKNOWN',
        errorMessage: (err as any)?.message ?? String(err),
        prismaModel:  'AuditEvent',
        operation:    'auditEvent.create',
        context:      data.eventType,
        payload:      data,
        resolution:   'logged',
        correlationId: data.correlationId,
      });
    }
  }
}

// ── Safe notification batch ───────────────────────────────────────────────────

export async function safeNotifications(
  data: NonNullable<Parameters<typeof prisma.notification.createMany>[0]>['data'],
  context?: string,
): Promise<void> {
  try {
    await withDbRetry(
      () => prisma.notification.createMany({ data }),
      { context: context ?? 'notification.createMany', retries: 2 },
    );
  } catch (err: unknown) {
    await logSystemError({
      errorCode:    (err as any)?.code ?? 'UNKNOWN',
      errorMessage: (err as any)?.message ?? String(err),
      prismaModel:  'Notification',
      operation:    'notification.createMany',
      context,
      payload:      data,
      resolution:   'logged',
    });
  }
}
