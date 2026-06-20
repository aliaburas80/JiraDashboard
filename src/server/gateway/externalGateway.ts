// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Backend Integration Gateway — single entry point for all external HTTP
// calls (GW-03, GW-09–GW-14, GW-21, GW-22).
//
// callExternal() is the chokepoint every future integration must use:
// resolve provider → policy-validate the endpoint (SSRF/protocol/host/path)
// → pick a routing target → execute with timeout + retry/backoff → log every
// attempt (redacted) → return a typed, redacted GatewayResult. It never
// throws — failures come back as { ok: false, errorCategory, error }.

import crypto from 'crypto';
import { getProviderConfig } from './providerRegistry';
import { validateEndpoint } from './endpointPolicy';
import { DEFAULT_RETRY_POLICY, isRetryable, computeBackoffDelay, categorizeHttpStatus } from './retryPolicy';
import { redact, logGatewayCall } from './gatewayLogger';
import type {
  GatewayRequestOptions,
  GatewayResult,
  GatewayErrorCategory,
  GatewayRoutingStrategy,
} from './types';

const isProduction = process.env.NODE_ENV === 'production';

function buildRequestUrl(baseUrl: string, path?: string, query?: Record<string, string>): string {
  const url = new URL(path ?? '', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * Picks a target from the candidate list per the requested routing strategy.
 * Only `single` is implemented today — it returns the first candidate. The
 * other strategies are typed (GatewayRoutingStrategy) so adding them later is
 * additive, not a breaking change to the GW-03/GW-22 contract.
 */
export function resolveRoutingTarget<T>(strategy: GatewayRoutingStrategy, candidates: T[]): T | undefined {
  if (candidates.length === 0) return undefined;
  switch (strategy) {
    case 'single':
    default:
      return candidates[0];
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AttemptOutcome {
  ok: boolean;
  status?: number;
  data?: unknown;
  errorCategory?: GatewayErrorCategory;
  error?: string;
}

async function executeAttempt(url: string, options: GatewayRequestOptions, timeoutMs: number): Promise<AttemptOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const status = response.status;
    if (response.ok) {
      const data = await response.json().catch(() => undefined);
      return { ok: true, status, data };
    }
    const bodyText = await response.text().catch(() => '');
    return {
      ok: false,
      status,
      errorCategory: categorizeHttpStatus(status),
      error: redact(`HTTP ${status}: ${bodyText.slice(0, 500)}`),
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, errorCategory: 'timeout', error: `Request exceeded ${timeoutMs}ms timeout.` };
    }
    return { ok: false, errorCategory: 'network', error: redact(err instanceof Error ? err.message : String(err)) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The single entry point for outbound gateway calls. Never throws.
 */
export async function callExternal<T = unknown>(options: GatewayRequestOptions): Promise<GatewayResult<T>> {
  const startedAt = new Date();
  const requestId = crypto.randomUUID();
  const policy = {
    ...DEFAULT_RETRY_POLICY,
    timeoutMs: options.timeoutMs ?? DEFAULT_RETRY_POLICY.timeoutMs,
    maxRetries: options.maxRetries ?? DEFAULT_RETRY_POLICY.maxRetries,
  };

  const finish = (outcome: AttemptOutcome, retryCount: number, endpointAlias: string): GatewayResult<T> => {
    const endedAt = new Date();
    const durationMs = endedAt.getTime() - startedAt.getTime();
    logGatewayCall({
      requestId,
      correlationId: options.correlationId,
      userId: options.userId ?? null,
      provider: options.provider,
      operation: options.operation,
      endpointAlias,
      method: options.method,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMs,
      status: outcome.status,
      retryCount,
      errorCategory: outcome.errorCategory,
      error: outcome.error,
    });
    return {
      ok: outcome.ok,
      data: outcome.ok ? (outcome.data as T) : undefined,
      status: outcome.status,
      errorCategory: outcome.errorCategory,
      error: outcome.error,
      requestId,
      correlationId: options.correlationId,
      durationMs,
      retryCount,
      provider: options.provider,
      operation: options.operation,
    };
  };

  const config = getProviderConfig(options.provider, {
    baseUrlOverride: options.baseUrlOverride,
    extraAllowedHosts: options.extraAllowedHosts,
    credentialsPresentOverride: options.credentialsPresentOverride,
  });
  const endpointAlias = `${options.provider}:${options.operation}`;

  if (!config.enabled || !config.baseUrl) {
    return finish({
      ok: false,
      errorCategory: 'policy_rejected',
      error: `Provider "${options.provider}" is not configured — no live providers are registered in this foundation.`,
    }, 0, endpointAlias);
  }

  const candidateUrls = [buildRequestUrl(config.baseUrl, options.path, options.query)];
  const target = resolveRoutingTarget(options.routingStrategy ?? 'single', candidateUrls);
  if (!target) {
    return finish({ ok: false, errorCategory: 'policy_rejected', error: 'No routing target available.' }, 0, endpointAlias);
  }

  const policyResult = validateEndpoint(target, { allowedHosts: config.allowedHosts, isProduction });
  if (!policyResult.allowed) {
    return finish({ ok: false, errorCategory: 'policy_rejected', error: policyResult.reason }, 0, endpointAlias);
  }

  const resolvedUrl = policyResult.resolvedUrl ?? target;
  let lastOutcome: AttemptOutcome = { ok: false, errorCategory: 'unknown', error: 'No attempt was made.' };

  for (let attempt = 0; attempt <= policy.maxRetries; attempt += 1) {
    lastOutcome = await executeAttempt(resolvedUrl, options, policy.timeoutMs);
    if (lastOutcome.ok) {
      return finish(lastOutcome, attempt, endpointAlias);
    }
    const canRetry = attempt < policy.maxRetries && isRetryable(lastOutcome.status, lastOutcome.errorCategory, policy);
    if (!canRetry) {
      return finish(lastOutcome, attempt, endpointAlias);
    }
    await sleep(computeBackoffDelay(attempt, policy));
  }

  return finish(lastOutcome, policy.maxRetries, endpointAlias);
}
