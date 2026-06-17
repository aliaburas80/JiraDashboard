// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Advanced chart customization — order, visibility, and column span per chart.
// Persisted to dc_chart_prefs in localStorage.

const STORAGE_KEY = 'dc_chart_prefs';

export type ChartSpan = 1 | 2 | 3;

export interface ChartPref {
  id:      string;
  visible: boolean;
  span:    ChartSpan;
}

// ── Chart registry ────────────────────────────────────────────────────────────

export interface ChartMeta {
  id:           string;
  label:        string;
  icon:         string;
  defaultSpan:  ChartSpan;
}

export const CHART_REGISTRY: ChartMeta[] = [
  { id: 'delivery',   label: 'Delivery Composition',  icon: 'chartPie', defaultSpan: 2 },
  { id: 'health',     label: 'Health Mix',             icon: 'statusSuccess', defaultSpan: 1 },
  { id: 'types',      label: 'Issue Types',            icon: 'folder', defaultSpan: 1 },
  { id: 'points',     label: 'Story Points',           icon: 'story', defaultSpan: 1 },
  { id: 'velocity',   label: 'Sprint Velocity',        icon: 'sprint', defaultSpan: 2 },
  { id: 'team',       label: 'Team Load',              icon: 'people', defaultSpan: 1 },
  { id: 'quarters',   label: 'Quarter Throughput',     icon: 'calendar', defaultSpan: 2 },
  { id: 'kanban',     label: 'Kanban Status Flow',     icon: 'board', defaultSpan: 1 },
  { id: 'timeline',   label: 'Timeline / Gantt',       icon: 'chartBar', defaultSpan: 3 },
  { id: 'labels',     label: 'Label Distribution',     icon: 'tag', defaultSpan: 2 },
  { id: 'links',      label: 'Link Type Distribution', icon: 'link', defaultSpan: 1 },
];

// ── Defaults ──────────────────────────────────────────────────────────────────

export function getDefaultChartPrefs(): ChartPref[] {
  return CHART_REGISTRY.map(c => ({ id: c.id, visible: true, span: c.defaultSpan }));
}

// ── Persistence ───────────────────────────────────────────────────────────────

export function getChartPrefs(): ChartPref[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultChartPrefs();

    const saved = JSON.parse(raw) as ChartPref[];
    const validIds = new Set(CHART_REGISTRY.map(c => c.id));

    // Keep saved order, drop unknown ids, append new ones
    const filtered = saved
      .filter(p => validIds.has(p.id))
      .map(p => ({
        id:      p.id,
        visible: typeof p.visible === 'boolean' ? p.visible : true,
        span:    [1, 2, 3].includes(p.span) ? p.span as ChartSpan : (CHART_REGISTRY.find(c => c.id === p.id)?.defaultSpan ?? 1),
      }));

    const savedIds = new Set(filtered.map(p => p.id));
    const appended = CHART_REGISTRY
      .filter(c => !savedIds.has(c.id))
      .map(c => ({ id: c.id, visible: true, span: c.defaultSpan }));

    return [...filtered, ...appended];
  } catch {
    return getDefaultChartPrefs();
  }
}

export function saveChartPrefs(prefs: ChartPref[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
}

export function resetChartPrefs(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ── Mutators (return new array) ───────────────────────────────────────────────

export function chartMoveUp(prefs: ChartPref[], id: string): ChartPref[] {
  const idx = prefs.findIndex(p => p.id === id);
  if (idx <= 0) return prefs;
  const next = [...prefs];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  return next;
}

export function chartMoveDown(prefs: ChartPref[], id: string): ChartPref[] {
  const idx = prefs.findIndex(p => p.id === id);
  if (idx < 0 || idx >= prefs.length - 1) return prefs;
  const next = [...prefs];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  return next;
}

export function chartToggleVisible(prefs: ChartPref[], id: string): ChartPref[] {
  return prefs.map(p => p.id === id ? { ...p, visible: !p.visible } : p);
}

export function chartSetSpan(prefs: ChartPref[], id: string, span: ChartSpan): ChartPref[] {
  return prefs.map(p => p.id === id ? { ...p, span } : p);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isDefaultChartPrefs(prefs: ChartPref[]): boolean {
  const def = getDefaultChartPrefs();
  if (prefs.length !== def.length) return false;
  return prefs.every((p, i) => p.id === def[i].id && p.visible === def[i].visible && p.span === def[i].span);
}
