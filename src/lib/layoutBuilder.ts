// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Custom dashboard layout builder — section order + visibility preferences.
// Persisted to dc_section_layout in localStorage.

import { DASHBOARD_SECTIONS, type SwitcherSection } from '@/lib/dashboardSections';

const STORAGE_KEY = 'dc_section_layout';

export interface SectionPref {
  key:     string;
  visible: boolean;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function getDefaultLayout(): SectionPref[] {
  return DASHBOARD_SECTIONS.map(s => ({ key: s.key, visible: true }));
}

// ── Persistence ───────────────────────────────────────────────────────────────

export function getLayoutPrefs(): SectionPref[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultLayout();

    const saved = JSON.parse(raw) as SectionPref[];
    const validKeys = new Set(DASHBOARD_SECTIONS.map(s => s.key));

    // Validate — keep saved order, drop unknown keys, append new ones at end
    const filtered = saved.filter(p => validKeys.has(p.key));
    const savedKeys = new Set(filtered.map(p => p.key));
    const appended  = DASHBOARD_SECTIONS
      .filter(s => !savedKeys.has(s.key))
      .map(s => ({ key: s.key, visible: true }));

    return [...filtered, ...appended];
  } catch {
    return getDefaultLayout();
  }
}

export function saveLayoutPrefs(prefs: SectionPref[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
}

export function resetLayoutPrefs(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ── Derived helpers ───────────────────────────────────────────────────────────

/** Returns DASHBOARD_SECTIONS in the user's saved order, excluding hidden. */
export function getOrderedVisibleSections(prefs: SectionPref[]): SwitcherSection[] {
  const map = new Map(DASHBOARD_SECTIONS.map(s => [s.key, s]));
  return prefs
    .filter(p => p.visible)
    .map(p => map.get(p.key))
    .filter((s): s is SwitcherSection => !!s);
}

/** Returns the set of hidden section keys from prefs. */
export function getHiddenKeys(prefs: SectionPref[]): Set<string> {
  return new Set(prefs.filter(p => !p.visible).map(p => p.key));
}

// ── Mutators (return new array, don't mutate) ─────────────────────────────────

export function moveUp(prefs: SectionPref[], key: string): SectionPref[] {
  const idx = prefs.findIndex(p => p.key === key);
  if (idx <= 0) return prefs;
  const next = [...prefs];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  return next;
}

export function moveDown(prefs: SectionPref[], key: string): SectionPref[] {
  const idx = prefs.findIndex(p => p.key === key);
  if (idx < 0 || idx >= prefs.length - 1) return prefs;
  const next = [...prefs];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  return next;
}

export function toggleVisibility(prefs: SectionPref[], key: string): SectionPref[] {
  return prefs.map(p => p.key === key ? { ...p, visible: !p.visible } : p);
}
