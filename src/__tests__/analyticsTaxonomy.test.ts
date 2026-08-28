// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: event taxonomy (master plan §4.2) — TC-ATX-01 to TC-ATX-05

import { ANALYTICS_EVENT_DOMAINS, ANALYTICS_EVENTS, isAnalyticsEventName } from '../lib/analytics/eventTaxonomy';

const EXPECTED_DOMAINS: Record<string, string[]> = {
  identity: ['signup_started', 'signup_completed', 'email_verified', 'login_completed', 'role_selected'],
  upload: ['upload_started', 'upload_validation_failed', 'upload_completed', 'analysis_started', 'analysis_completed', 'analysis_failed'],
  value: ['dashboard_viewed', 'insight_opened', 'calculation_explanation_opened', 'relation_map_opened', 'report_exported'],
  navigation: ['page_viewed', 'page_engaged', 'interaction_clicked', 'section_viewed', 'filter_applied', 'search_used', 'help_opened'],
  feedback: ['feedback_opened', 'feedback_submitted', 'feedback_attachment_added'],
  lifecycle: ['trial_expiring', 'trial_expired', 'return_visit', 'release_note_viewed'],
  quality: ['client_error', 'api_error', 'performance_threshold_exceeded', 'dead_click_detected'],
  payments: [
    'pricing_viewed', 'checkout_started', 'checkout_completed', 'checkout_failed',
    'subscription_started', 'subscription_renewed', 'subscription_cancelled',
    'refund_requested', 'refund_completed',
  ],
};

test('TC-ATX-01: every §4.2 domain and event name is present', () => {
  for (const [domain, events] of Object.entries(EXPECTED_DOMAINS)) {
    expect(ANALYTICS_EVENT_DOMAINS).toHaveProperty(domain);
    expect([...(ANALYTICS_EVENT_DOMAINS as Record<string, readonly string[]>)[domain]].sort())
      .toEqual([...events].sort());
  }
});

test('TC-ATX-02: no event name is duplicated across domains', () => {
  const seen = new Set<string>();
  for (const name of ANALYTICS_EVENTS) {
    expect(seen.has(name)).toBe(false);
    seen.add(name);
  }
});

test('TC-ATX-03: ANALYTICS_EVENTS is the flattened union of every domain', () => {
  const expectedTotal = Object.values(EXPECTED_DOMAINS).flat().length;
  expect(ANALYTICS_EVENTS).toHaveLength(expectedTotal);
});

test('TC-ATX-04: isAnalyticsEventName accepts every taxonomy event', () => {
  for (const name of ANALYTICS_EVENTS) {
    expect(isAnalyticsEventName(name)).toBe(true);
  }
});

test('TC-ATX-05: isAnalyticsEventName rejects an unknown string', () => {
  expect(isAnalyticsEventName('totally_made_up_event')).toBe(false);
  expect(isAnalyticsEventName('')).toBe(false);
});
