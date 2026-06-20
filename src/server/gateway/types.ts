// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Backend Integration Gateway — shared type contract (GW-02).
//
// This is the foundation that ALL future external HTTP calls (Jira, cloud
// providers, email, Slack, Teams, push notifications, custom) must route
// through — see product/DEVELOPER_GUIDE.md "Backend Integration Gateway"
// for the full architecture write-up. Not a live integration: zero providers
// are registered by default (see providerRegistry.ts).

export type GatewayProviderType =
  | 'jira'
  | 'aws_s3'
  | 'azure_blob'
  | 'gcp_storage'
  | 'email'
  | 'slack'
  | 'teams'
  | 'push_notification'
  | 'custom';

export type GatewayErrorCategory =
  | 'validation'        // bad request shape — never sent
  | 'policy_rejected'   // endpoint policy (allowlist/SSRF/protocol) blocked the call
  | 'timeout'           // exceeded the configured timeout
  | 'network'           // fetch-level failure (DNS, connection refused, etc.)
  | 'retryable_http'    // HTTP status in the retryable set, retries exhausted
  | 'non_retryable_http' // HTTP status in the non-retryable set
  | 'unknown';

export type GatewayRoutingStrategy =
  | 'single'              // implemented — first registered candidate
  | 'round_robin'         // typed for future use — not yet implemented
  | 'weighted_round_robin'
  | 'failover'
  | 'least_error_rate';

export type GatewayHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface GatewayRequestOptions {
  provider: GatewayProviderType;
  /** Human-readable label for logs/audit, e.g. "jira.fetchIssues". */
  operation: string;
  method: GatewayHttpMethod;
  /** Appended to the provider's allowlisted base URL — never a raw external URL. */
  path?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
  userId?: string | null;
  correlationId?: string;
  idempotencyKey?: string;
  /**
   * ARCH-05: override the provider's base URL for this call (e.g. a
   * per-connection JiraConnection.baseUrl) instead of the provider's global
   * env var. Credential values are never overridden — they always come
   * from the provider's env vars.
   */
  baseUrlOverride?: string;
  extraAllowedHosts?: string[];
  routingStrategy?: GatewayRoutingStrategy;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface GatewayResult<T = unknown> {
  ok: boolean;
  data?: T;
  status?: number;
  errorCategory?: GatewayErrorCategory;
  /** Always redacted — safe to log or surface to an admin. */
  error?: string;
  requestId: string;
  correlationId?: string;
  durationMs: number;
  retryCount: number;
  provider: GatewayProviderType;
  operation: string;
}

export interface GatewayLogRecord {
  requestId: string;
  correlationId?: string;
  instanceId?: string;
  userId?: string | null;
  provider: GatewayProviderType;
  operation: string;
  endpointAlias: string;
  method: GatewayHttpMethod;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  status?: number;
  retryCount: number;
  errorCategory?: GatewayErrorCategory;
  /** Always redacted before this record is constructed. */
  error?: string;
}

export interface ProviderConfig {
  type: GatewayProviderType;
  /** Name of the env var holding the provider's base URL (e.g. "JIRA_BASE_URL"). */
  baseUrlEnvVar: string;
  /** Names of env vars holding credentials — values are never logged or persisted. */
  credentialEnvVars: string[];
  /** Hostnames this provider is allowed to call — the SSRF allowlist. */
  allowedHosts: string[];
  /** True only when baseUrlEnvVar and all credentialEnvVars resolve to non-empty values. */
  enabled: boolean;
  baseUrl?: string;
}

export interface EndpointPolicyResult {
  allowed: boolean;
  reason?: string;
  resolvedUrl?: string;
}

export interface RetryPolicy {
  timeoutMs: number;
  maxRetries: number;
  baseDelayMs: number;
  retryableStatus: number[];
  nonRetryableStatus: number[];
}
