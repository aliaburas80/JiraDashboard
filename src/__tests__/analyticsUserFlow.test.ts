import {
  eventLabel,
  isMeaningfulJourneyAction,
  journeyOutcome,
  pageDisplayName,
} from '../../admin-app/app/(operations)/analytics/analyticsIntelligence';

function event(overrides: Record<string, unknown> = {}) {
  return {
    eventName: 'interaction_clicked',
    occurredAt: new Date('2026-08-28T12:22:00.000Z'),
    userId: 'user-1',
    anonymousId: 'anon-1',
    sessionId: 'session-1',
    page: '/help',
    section: 'header',
    component: 'interaction',
    role: 'admin',
    browserFamily: 'Chrome',
    deviceCategory: 'desktop',
    resultStatus: null,
    durationMs: null,
    propertiesJson: '{}',
    ...overrides,
  } as any;
}

test('historical Unlabeled action with a route target becomes a useful navigation action', () => {
  const item = event({
    propertiesJson: JSON.stringify({
      label: 'Unlabeled action',
      target_kind: 'route',
      target: '/members',
      element_type: 'a',
    }),
  });

  expect(eventLabel(item)).toBe('Opened Members page');
  expect(isMeaningfulJourneyAction(item)).toBe(true);
});

test('historical raw path labels are humanized instead of shown as route noise', () => {
  const item = event({ propertiesJson: JSON.stringify({ label: 'Open /data-quality' }) });
  expect(eventLabel(item)).toBe('Opened Data Quality page');
});

test('generic unlabeled button clicks are excluded from meaningful action counts', () => {
  const item = event({
    propertiesJson: JSON.stringify({
      label: 'Unlabeled action',
      target_kind: 'action',
      element_type: 'button',
    }),
  });

  expect(eventLabel(item)).toBe('Clicked Button');
  expect(isMeaningfulJourneyAction(item)).toBe(false);
});

test('menu open and close telemetry is hidden from the decision journey', () => {
  const openMenu = event({ propertiesJson: JSON.stringify({ label: 'Open Reference menu' }) });
  const closeMenu = event({ propertiesJson: JSON.stringify({ label: 'Close Reference menu' }) });

  expect(isMeaningfulJourneyAction(openMenu)).toBe(false);
  expect(isMeaningfulJourneyAction(closeMenu)).toBe(false);
});

test('page names are readable for nested routes', () => {
  expect(pageDisplayName('/dashboard/key-metrics')).toBe('Dashboard / Key Metrics');
  expect(pageDisplayName('/')).toBe('Upload / Home');
});

test('journey outcome prioritizes friction over otherwise successful activity', () => {
  const completed = event({ eventName: 'analysis_completed', resultStatus: 'success' });
  const failed = event({ eventName: 'api_error', resultStatus: 'error' });

  expect(journeyOutcome([completed])).toEqual({ kind: 'success', label: 'Completed' });
  expect(journeyOutcome([completed, failed])).toEqual({ kind: 'friction', label: 'Friction' });
});
