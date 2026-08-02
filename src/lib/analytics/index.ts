// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: public API for the analytics module. Most call sites only need
// trackEvent(); setAnalyticsConsentCache()/clearAnalyticsConsentCache() are
// exposed for the two places that own the consent lifecycle outside a tracked
// event (PrivacyTab's toggle, UserMenu's logout). getBrowserContext() is
// exposed separately for FeedbackButton, which needs raw browser detection
// outside a tracked event.

export { trackEvent, configureAnalyticsTransport, type AnalyticsEvent, type AnalyticsTransport } from './track';
export { ANALYTICS_EVENTS, ANALYTICS_EVENT_DOMAINS, isAnalyticsEventName, type AnalyticsEventName, type AnalyticsEventDomain } from './eventTaxonomy';
export { getBrowserContext, type BrowserContext } from './clientContext';
export { setAnalyticsConsentCache, clearAnalyticsConsentCache } from './consentGate';
