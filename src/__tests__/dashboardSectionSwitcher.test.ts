// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Dashboard Section Switcher tests — TC-DS-01 to TC-DS-10

import { DASHBOARD_SECTIONS, OVERVIEW_KEYS } from '../lib/dashboardSections';

// ── Replicate the helper functions from dashboard/page.tsx ───────────────────
type SectionMode = 'full' | 'overview' | string;

function makeSectionHelpers(
  sectionMode: SectionMode,
  hiddenByRole: Set<string>,
  expandedSections: Set<string>,
) {
  const isHidden = (key: string) => hiddenByRole.has(key);

  function isModeVisible(key: string): boolean {
    if (sectionMode === 'full') return true;
    if (sectionMode === 'overview') return OVERVIEW_KEYS.has(key);
    return key === sectionMode;
  }
  function sectionHeaderVisible(key: string): boolean {
    return !isHidden(key) && isModeVisible(key);
  }
  function sectionVisible(key: string): boolean {
    if (isHidden(key)) return false;
    if (sectionMode === 'full') return expandedSections.has(key);
    return isModeVisible(key);
  }

  return { isModeVisible, sectionHeaderVisible, sectionVisible };
}

// TC-DS-01: Full mode — all non-hidden sections that are expanded are visible
test('TC-DS-01: full mode respects expandedSections', () => {
  const { sectionVisible } = makeSectionHelpers('full', new Set(), new Set(['overview', 'attention']));
  expect(sectionVisible('overview')).toBe(true);
  expect(sectionVisible('attention')).toBe(true);
  expect(sectionVisible('sprint')).toBe(false);  // not in expandedSections
});

// TC-DS-02: Overview mode — only OVERVIEW_KEYS sections are visible
test('TC-DS-02: overview mode shows only overview, attention, recommendations', () => {
  const { sectionVisible } = makeSectionHelpers('overview', new Set(), new Set());
  expect(sectionVisible('overview')).toBe(true);
  expect(sectionVisible('attention')).toBe(true);
  expect(sectionVisible('recommendations')).toBe(true);
  expect(sectionVisible('sprint')).toBe(false);
  expect(sectionVisible('kanban')).toBe(false);
});

// TC-DS-03: Single section mode — only the targeted section is visible
test('TC-DS-03: single-section mode shows only the targeted section', () => {
  const { sectionVisible } = makeSectionHelpers('sprint', new Set(), new Set());
  expect(sectionVisible('sprint')).toBe(true);
  expect(sectionVisible('overview')).toBe(false);
  expect(sectionVisible('kanban')).toBe(false);
});

// TC-DS-04: Role-based hidden sections are never visible regardless of mode
test('TC-DS-04: role-hidden sections remain hidden in all modes', () => {
  const hidden = new Set(['throughput', 'visuals']);
  const { sectionVisible: sv1 } = makeSectionHelpers('full', hidden, new Set(['throughput']));
  const { sectionVisible: sv2 } = makeSectionHelpers('throughput', hidden, new Set());
  expect(sv1('throughput')).toBe(false);  // full mode + hidden by role
  expect(sv2('throughput')).toBe(false);  // single mode + hidden by role
});

// TC-DS-05: sectionHeaderVisible returns false for role-hidden sections
test('TC-DS-05: sectionHeaderVisible hides role-hidden sections in all modes', () => {
  const { sectionHeaderVisible } = makeSectionHelpers('full', new Set(['kanban']), new Set());
  expect(sectionHeaderVisible('kanban')).toBe(false);
  expect(sectionHeaderVisible('sprint')).toBe(true);
});

// TC-DS-06: sectionHeaderVisible hides sections not in current mode
test('TC-DS-06: sectionHeaderVisible hides off-mode sections', () => {
  const { sectionHeaderVisible } = makeSectionHelpers('sprint', new Set(), new Set());
  expect(sectionHeaderVisible('sprint')).toBe(true);
  expect(sectionHeaderVisible('kanban')).toBe(false);
});

// TC-DS-07: Overview mode — sections are always visible even if not in expandedSections
test('TC-DS-07: overview mode ignores expandedSections', () => {
  const { sectionVisible } = makeSectionHelpers('overview', new Set(), new Set());
  expect(sectionVisible('overview')).toBe(true);   // not in expanded but still visible
  expect(sectionVisible('attention')).toBe(true);
});

// TC-DS-08: DASHBOARD_SECTIONS has exactly 14 entries (matches SectionNav test TC-062)
test('TC-DS-08: DASHBOARD_SECTIONS has exactly 14 sections', () => {
  expect(DASHBOARD_SECTIONS).toHaveLength(14);
});

// TC-DS-09: OVERVIEW_KEYS contains the 3 correct keys
test('TC-DS-09: OVERVIEW_KEYS contains overview, attention, recommendations', () => {
  expect(OVERVIEW_KEYS.has('overview')).toBe(true);
  expect(OVERVIEW_KEYS.has('attention')).toBe(true);
  expect(OVERVIEW_KEYS.has('recommendations')).toBe(true);
  expect(OVERVIEW_KEYS.size).toBe(3);
});

// TC-DS-10: All DASHBOARD_SECTIONS have unique keys and valid sectionIds
test('TC-DS-10: all sections have unique keys and sectionId strings', () => {
  const keys = DASHBOARD_SECTIONS.map(s => s.key);
  const uniqueKeys = new Set(keys);
  expect(uniqueKeys.size).toBe(keys.length);
  DASHBOARD_SECTIONS.forEach(s => {
    expect(typeof s.sectionId).toBe('string');
    expect(s.sectionId.length).toBeGreaterThan(0);
  });
});
