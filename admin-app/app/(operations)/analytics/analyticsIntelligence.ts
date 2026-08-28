import type { OwnerAnalyticsEvent } from '../../../../src/server/tenancy/ownerAnalyticsIntelligenceRepository';

export const ANALYTICS_PERIODS = [1, 7, 30, 90] as const;

export function resolveDays(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw ?? 30);
  return ANALYTICS_PERIODS.includes(value as (typeof ANALYTICS_PERIODS)[number]) ? value : 30;
}

export function visitorKey(event: OwnerAnalyticsEvent): string | null {
  if (event.userId) return `user:${event.userId}`;
  if (event.anonymousId) return `anon:${event.anonymousId}`;
  if (event.sessionId) return `session:${event.sessionId}`;
  return null;
}

export function eventProperties(event: OwnerAnalyticsEvent): Record<string, unknown> {
  try {
    const value = JSON.parse(event.propertiesJson) as unknown;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export function eventRoute(event: OwnerAnalyticsEvent): string {
  const props = eventProperties(event);
  const route = props.route;
  return typeof route === 'string' && route ? route : event.page || '/';
}

export function eventLabel(event: OwnerAnalyticsEvent): string {
  const props = eventProperties(event);
  const label = props.label;
  if (typeof label === 'string' && label) return label;
  if (event.eventName === 'page_viewed') return eventRoute(event);
  return event.eventName.replaceAll('_', ' ');
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: value >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

export function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  if (ms < 1_000) return `${Math.round(ms)}ms`;
  const seconds = Math.round(ms / 1_000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export function formatDateTime(value: Date | null): string {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(value);
}

function reachedRoute(routes: string[], prefixes: string[]): boolean {
  return routes.some(route => prefixes.some(prefix => route === prefix || route.startsWith(`${prefix}/`)));
}

export function stageForEvents(events: OwnerAnalyticsEvent[]): string {
  const names = new Set(events.map(event => event.eventName));
  const routes = events.map(eventRoute);

  if (names.has('report_exported') || reachedRoute(routes, ['/reports'])) return 'Report';
  if (names.has('dashboard_viewed') || reachedRoute(routes, ['/dashboard', '/summary'])) return 'Dashboard';
  if (
    names.has('analysis_completed')
    || reachedRoute(routes, ['/intelligence', '/forecast', '/flow-health', '/data-quality', '/release-readiness', '/readiness'])
  ) return 'Analysis';
  if (names.has('upload_completed')) return 'Upload';
  if (names.has('signup_completed') || events.some(event => Boolean(event.userId))) return 'Signed up';
  return 'Visitor';
}

export function isFailureEvent(event: OwnerAnalyticsEvent): boolean {
  return event.eventName === 'analysis_failed'
    || event.eventName === 'upload_validation_failed'
    || event.eventName === 'client_error'
    || event.eventName === 'api_error'
    || event.eventName === 'dead_click_detected'
    || event.eventName === 'rage_click_detected'
    || event.resultStatus === 'failed'
    || event.resultStatus === 'error'
    || event.resultStatus === 'friction';
}
