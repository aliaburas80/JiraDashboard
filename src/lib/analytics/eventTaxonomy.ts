// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: the versioned product-event taxonomy — master plan §4.2.
// This module only defines *what* events exist. Nothing here sends or
// stores anything — see track.ts for envelope construction and the
// consent-gated transport.

export const ANALYTICS_EVENT_DOMAINS = {
  identity: [
    'signup_started',
    'signup_completed',
    'email_verified',
    'login_completed',
    'role_selected',
  ],
  upload: [
    'upload_started',
    'upload_validation_failed',
    'upload_completed',
    'analysis_started',
    'analysis_completed',
    'analysis_failed',
  ],
  value: [
    'dashboard_viewed',
    'insight_opened',
    'calculation_explanation_opened',
    'relation_map_opened',
    'report_exported',
  ],
  navigation: [
    'page_viewed',
    'page_engaged',
    'interaction_clicked',
    'surface_clicked',
    'control_changed',
    'form_submitted',
    'section_viewed',
    'scroll_depth_reached',
    'filter_applied',
    'search_used',
    'help_opened',
  ],
  feedback: [
    'feedback_opened',
    'feedback_submitted',
    'feedback_attachment_added',
  ],
  lifecycle: [
    'session_started',
    'trial_expiring',
    'trial_expired',
    'return_visit',
    'release_note_viewed',
  ],
  quality: [
    'client_error',
    'api_error',
    'performance_threshold_exceeded',
    'dead_click_detected',
    'rage_click_detected',
  ],
  payments: [
    'pricing_viewed',
    'checkout_started',
    'checkout_completed',
    'checkout_failed',
    'subscription_started',
    'subscription_renewed',
    'subscription_cancelled',
    'refund_requested',
    'refund_completed',
  ],
} as const satisfies Record<string, readonly string[]>;

export type AnalyticsEventDomain = keyof typeof ANALYTICS_EVENT_DOMAINS;

export const ANALYTICS_EVENTS = Object.values(ANALYTICS_EVENT_DOMAINS).flat() as ReadonlyArray<
  (typeof ANALYTICS_EVENT_DOMAINS)[AnalyticsEventDomain][number]
>;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

const ANALYTICS_EVENT_SET: ReadonlySet<string> = new Set(ANALYTICS_EVENTS);

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return ANALYTICS_EVENT_SET.has(value);
}
