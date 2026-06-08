// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// HTML export branding test — TC-X-14

import { buildReportHtml } from '../lib/exportUtils';
import type { DashboardMetrics } from '../types/metrics';

function makeMetrics(): DashboardMetrics {
  return {
    healthScore: 72,
    flow: { issues: 1, done: 1, good: 1, warning: 0, critical: 0, items: [] },
  } as unknown as DashboardMetrics;
}

// TC-X-14: the redesigned HTML export carries the Delivery Clarity brand mark, title, and footer attribution
test('TC-X-14: exported HTML report carries the Delivery Clarity brand mark, title, and footer attribution', () => {
  const html = buildReportHtml(makeMetrics());

  // Brand mark — lightning-bolt SVG in a gradient badge
  expect(html).toContain('<svg viewBox="0 0 24 24"');
  expect(html).toContain('Delivery Clarity');

  // Browser tab title
  expect(html).toContain('<title>Delivery Clarity — Report</title>');

  // Header eyebrow + report heading
  expect(html).toContain('Delivery Report');

  // Footer attribution
  expect(html).toContain('Ali Abu Ras');
  expect(html).toContain('aliaburas80@gmail.com');
  expect(html).toContain('Delivery Clarity v4.1');
});
