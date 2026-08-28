import type { OwnerAnalyticsEvent } from '../../../../src/server/tenancy/ownerAnalyticsIntelligenceRepository';

export const ANALYTICS_PERIODS = [1, 7, 30, 90] as const;

const LOW_VALUE_EVENT_NAMES = new Set([
  'page_viewed',
  'page_engaged',
  'session_started',
  'surface_clicked',
  'section_viewed',
  'scroll_depth_reached',
]);

const SUCCESS_EVENT_NAMES = new Set([
  'signup_completed',
  'email_verified',
  'upload_completed',
  'analysis_completed',
  'dashboard_viewed',
  'insight_opened',
  'calculation_explanation_opened',
  'relation_map_opened',
  'report_exported',
  'feedback_submitted',
  'checkout_completed',
  'subscription_started',
  'subscription_renewed',
  'refund_completed',
]);

const GENERIC_ACTION_LABELS = new Set([
  'click control',
  'clicked control',
  'click button',
  'clicked button',
  'click div',
  'clicked div',
  'click span',
  'clicked span',
  'click page surface',
  'clicked page surface',
  'open menu',
  'opened menu',
  'close menu',
  'closed menu',
]);

export type JourneyOutcome = {
  kind: 'success' | 'friction' | 'engaged' | 'viewed';
  label: string;
};

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

function humanize(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const result = value
    .replace(/[-_:]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return result.replace(/\b\w/g, char => char.toUpperCase());
}

function usableLabel(value: unknown): string {
  if (typeof value !== 'string') return '';
  const label = value.trim();
  return label && label.toLowerCase() !== 'unlabeled action' ? label : '';
}

export function pageDisplayName(route: string): string {
  if (!route || route === '/') return 'Upload / Home';
  const segments = route
    .split('/')
    .filter(Boolean)
    .map(segment => humanize(segment));
  return segments.length ? segments.join(' / ') : 'Home';
}

function routeFromLegacyLabel(label: string): string | null {
  const direct = label.match(/^\/?([a-z0-9][a-z0-9/_-]*)$/i);
  if (label.startsWith('/') && direct) return label;
  const open = label.match(/^Open\s+(\/[A-Za-z0-9/_-]+)(?:\s+page)?$/i);
  return open?.[1] ?? null;
}

function pastTenseAction(label: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/^Open\s+/i, 'Opened '],
    [/^Click\s+/i, 'Clicked '],
    [/^Change\s+/i, 'Changed '],
    [/^Select\s+/i, 'Selected '],
    [/^Toggle\s+/i, 'Toggled '],
    [/^Close\s+/i, 'Closed '],
    [/^Expand\s+/i, 'Expanded '],
    [/^Collapse\s+/i, 'Collapsed '],
    [/^Use\s+/i, 'Used '],
    [/^Submit\s+/i, 'Submitted '],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(label)) return label.replace(pattern, replacement);
  }
  return label;
}

function normalizedStoredLabel(value: unknown): string {
  const label = usableLabel(value);
  if (!label) return '';
  const route = routeFromLegacyLabel(label);
  if (route) return `Opened ${pageDisplayName(route)} page`;
  return pastTenseAction(label);
}

export function eventLabel(event: OwnerAnalyticsEvent): string {
  const props = eventProperties(event);
  const label = normalizedStoredLabel(props.label);
  const target = typeof props.target === 'string' ? props.target : '';
  const targetKind = typeof props.target_kind === 'string' ? props.target_kind : '';
  const controlKey = humanize(props.control_key);
  const elementType = humanize(props.element_type);

  switch (event.eventName) {
    case 'page_viewed':
      return `Viewed ${pageDisplayName(eventRoute(event))}`;
    case 'page_engaged':
      return event.durationMs ? `Spent ${formatDuration(event.durationMs)} on page` : 'Engaged with page';
    case 'interaction_clicked':
      if (targetKind === 'route' && target) return `Opened ${pageDisplayName(target)} page`;
      if (targetKind === 'external' && target) return `Opened external site ${target}`;
      if (label) return label;
      if (controlKey) return `Clicked ${controlKey}`;
      if (elementType) return `Clicked ${elementType}`;
      return 'Clicked control';
    case 'surface_clicked':
      return `Clicked ${elementType || 'page'} surface`;
    case 'control_changed': {
      const subject = label || controlKey || humanize(props.control_type) || 'control';
      return subject.toLowerCase().startsWith('changed ') ? subject : `Changed ${subject}`;
    }
    case 'form_submitted': {
      const form = humanize(props.form_key);
      if (form) return `Submitted ${form}`;
      return target && target !== eventRoute(event) ? `Submitted form to ${target}` : 'Submitted form';
    }
    case 'section_viewed': {
      const section = humanize(props.section_key);
      return section ? `Viewed ${section} section` : 'Viewed section';
    }
    case 'scroll_depth_reached':
      return typeof props.depth_pct === 'number' ? `Scrolled to ${props.depth_pct}%` : 'Scrolled page';
    case 'session_started':
      return 'Session started';
    case 'rage_click_detected':
      return label ? `Repeated rapid clicks on ${label}` : 'Repeated rapid clicks detected';
    case 'dead_click_detected':
      return label ? `Dead click on ${label}` : 'Dead click detected';
    case 'signup_started':
      return 'Started signup';
    case 'signup_completed':
      return 'Completed signup';
    case 'email_verified':
      return 'Verified email';
    case 'login_completed':
      return 'Logged in';
    case 'role_selected':
      return 'Selected role';
    case 'upload_started':
      return 'Started upload';
    case 'upload_completed':
      return 'Completed upload';
    case 'upload_validation_failed':
      return 'Upload validation failed';
    case 'analysis_started':
      return 'Started analysis';
    case 'analysis_completed':
      return 'Completed analysis';
    case 'analysis_failed':
      return 'Analysis failed';
    case 'dashboard_viewed':
      return 'Viewed dashboard';
    case 'insight_opened':
      return 'Opened insight';
    case 'calculation_explanation_opened':
      return 'Opened calculation explanation';
    case 'relation_map_opened':
      return 'Opened relation map';
    case 'report_exported':
      return 'Exported report';
    case 'filter_applied':
      return 'Applied filter';
    case 'search_used':
      return 'Used search';
    case 'help_opened':
      return 'Opened help';
    case 'feedback_opened':
      return 'Opened feedback';
    case 'feedback_submitted':
      return 'Submitted feedback';
    case 'client_error':
      return 'Client error';
    case 'api_error':
      return 'API error';
    case 'performance_threshold_exceeded':
      return 'Performance threshold exceeded';
    case 'pricing_viewed':
      return 'Viewed pricing';
    case 'checkout_started':
      return 'Started checkout';
    case 'checkout_completed':
      return 'Completed checkout';
    case 'checkout_failed':
      return 'Checkout failed';
    case 'subscription_started':
      return 'Started subscription';
    case 'subscription_renewed':
      return 'Renewed subscription';
    case 'subscription_cancelled':
      return 'Cancelled subscription';
    case 'refund_requested':
      return 'Requested refund';
    case 'refund_completed':
      return 'Completed refund';
    default:
      return label || humanize(event.eventName) || event.eventName;
  }
}

export function isMeaningfulJourneyAction(event: OwnerAnalyticsEvent): boolean {
  if (LOW_VALUE_EVENT_NAMES.has(event.eventName)) return false;
  if (isFailureEvent(event)) return true;

  if (event.eventName === 'interaction_clicked') {
    const props = eventProperties(event);
    const targetKind = typeof props.target_kind === 'string' ? props.target_kind : '';
    const target = typeof props.target === 'string' ? props.target : '';
    if (targetKind === 'route' && target) return true;
    if (targetKind === 'external' && target) return true;

    const label = eventLabel(event).trim().toLowerCase();
    if (!label || GENERIC_ACTION_LABELS.has(label)) return false;
    if (/^(opened|closed) .* menu$/.test(label)) return false;
    if (/^(opened|closed) navigation menu$/.test(label)) return false;
    return true;
  }

  return true;
}

export function journeyOutcome(events: OwnerAnalyticsEvent[]): JourneyOutcome {
  if (events.some(isFailureEvent)) return { kind: 'friction', label: 'Friction' };
  if (events.some(event => SUCCESS_EVENT_NAMES.has(event.eventName)
    || ['success', 'completed', 'ok'].includes((event.resultStatus ?? '').toLowerCase()))) {
    return { kind: 'success', label: 'Completed' };
  }
  if (events.some(isMeaningfulJourneyAction)) return { kind: 'engaged', label: 'Engaged' };
  return { kind: 'viewed', label: 'Viewed only' };
}

export function measuredEngagementMs(events: OwnerAnalyticsEvent[]): number {
  const measured = events
    .filter(event => event.eventName === 'page_engaged' && typeof event.durationMs === 'number' && event.durationMs > 0)
    .reduce((total, event) => total + (event.durationMs ?? 0), 0);
  if (measured > 0) return measured;

  if (events.length < 2) return 0;
  const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const elapsed = ordered[ordered.length - 1].occurredAt.getTime() - ordered[0].occurredAt.getTime();
  return Math.min(Math.max(0, elapsed), 30 * 60_000);
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
    || event.eventName === 'checkout_failed'
    || event.resultStatus === 'failed'
    || event.resultStatus === 'error'
    || event.resultStatus === 'friction';
}
