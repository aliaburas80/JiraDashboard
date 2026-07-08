// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Global page search — ranking logic tests (see src/lib/pageSearch.ts).

import { searchPages } from '../lib/pageSearch';
import type { DCShellNavGroup } from '../components/dc-shell/navigation';

const GROUPS: DCShellNavGroup[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { id: 'overview',  title: 'Overview',    desc: 'Health at a glance',    href: '/summary',   status: 'neutral', icon: 'dashboard' },
      { id: 'charts',    title: 'Charts',      desc: 'Visual breakdowns',     href: '/charts',    status: 'info',    icon: 'chartBar'  },
      { id: 'trends',    title: 'Trends',      desc: 'Chart of change over time', href: '/trends', status: 'info',    icon: 'chartTrendUp' },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      { id: 'flow-health', title: 'Flow Health', desc: 'Lead time & blockers', href: '/flow-health', status: 'warning', icon: 'activity' },
    ],
  },
];

describe('searchPages', () => {
  test('empty query returns every item in natural group order', () => {
    const results = searchPages('', GROUPS);
    expect(results.map(r => r.id)).toEqual(['overview', 'charts', 'trends', 'flow-health']);
  });

  test('whitespace-only query is treated as empty', () => {
    const results = searchPages('   ', GROUPS);
    expect(results).toHaveLength(4);
  });

  test('exact title match ranks above a partial match', () => {
    const results = searchPages('charts', GROUPS);
    // "Charts" is an exact title match; "Trends" only matches via its desc
    // ("Chart of change over time") — exact title must rank first.
    expect(results[0].id).toBe('charts');
  });

  test('title match ranks above description-only match', () => {
    const results = searchPages('chart', GROUPS);
    const ids = results.map(r => r.id);
    // "Charts" (title startsWith) should outrank "Trends" (desc includes only)
    expect(ids.indexOf('charts')).toBeLessThan(ids.indexOf('trends'));
  });

  test('matches are case-insensitive', () => {
    const results = searchPages('FLOW health', GROUPS);
    expect(results.map(r => r.id)).toEqual(['flow-health']);
  });

  test('matching on group label works (e.g. searching "delivery")', () => {
    const results = searchPages('delivery', GROUPS);
    expect(results.map(r => r.id)).toEqual(['flow-health']);
  });

  test('no matches returns an empty array, not null/undefined', () => {
    const results = searchPages('xyz-nonexistent-page', GROUPS);
    expect(results).toEqual([]);
  });

  test('each result carries its owning group id/label for display', () => {
    const results = searchPages('overview', GROUPS);
    expect(results[0]).toMatchObject({ groupId: 'analytics', groupLabel: 'Analytics' });
  });

  test('special/regex-meaningful characters in the query do not throw and simply find no match', () => {
    expect(() => searchPages('.*(', GROUPS)).not.toThrow();
    expect(searchPages('.*(', GROUPS)).toEqual([]);
  });

  test('respects the groups passed in — items from a role-filtered-out group never appear', () => {
    const restricted = [GROUPS[0]]; // caller already dropped the 'delivery' group
    const results = searchPages('flow', restricted);
    expect(results).toEqual([]);
  });
});
