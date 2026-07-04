// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Backend Integration Gateway — timeout / retry / backoff policy (GW-06, GW-17–GW-19).

import type { GatewayErrorCategory, RetryPolicy } from './types';

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  timeoutMs: 10_000,
  maxRetries: 2,
  baseDelayMs: 250,
  retryableStatus: [408, 429, 500, 502, 503, 504],
  nonRetryableStatus: [400, 401, 403, 404, 409, 422],
};

/**
 * Decides whether a failed attempt should be retried. Only HTTP statuses in
 * the retryable set are retried; statuses in the non-retryable set (and any
 * policy/validation rejection) fail immediately — never retried.
 */
export function isRetryable(
  status: number | undefined,
  errorCategory: GatewayErrorCategory | undefined,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): boolean {
  if (errorCategory === 'policy_rejected' || errorCategory === 'validation') return false;
  if (status === undefined) {
    // Network-level failure / timeout with no HTTP response — retry.
    return errorCategory === 'network' || errorCategory === 'timeout';
  }
  if (policy.nonRetryableStatus.includes(status)) return false;
  return policy.retryableStatus.includes(status);
}

/** Exponential backoff: baseDelayMs * 2^attempt (attempt is zero-based). */
export function computeBackoffDelay(attempt: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  return policy.baseDelayMs * 2 ** attempt;
}

export function categorizeHttpStatus(status: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): GatewayErrorCategory {
  if (policy.retryableStatus.includes(status)) return 'retryable_http';
  if (policy.nonRetryableStatus.includes(status)) return 'non_retryable_http';
  return 'unknown';
}
