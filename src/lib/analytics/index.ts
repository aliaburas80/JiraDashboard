// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Public API for the analytics module.

export {
  trackEvent,
  configureAnalyticsTransport,
  sanitizeAnalyticsPath,
  type AnalyticsEvent,
  type AnalyticsTransport,
} from './track';
export { ANALYTICS_EVENTS, ANALYTICS_EVENT_DOMAINS, isAnalyticsEventName, type AnalyticsEventName, type AnalyticsEventDomain } from './eventTaxonomy';
export { getBrowserContext, type BrowserContext } from './clientContext';
export {
  setAnalyticsConsentCache,
  clearAnalyticsConsentCache,
  getAnonymousAnalyticsConsentDecision,
  setAnonymousAnalyticsConsent,
} from './consentGate';
