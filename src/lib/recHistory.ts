// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export interface HistoryRec {
  type:   string;
  icon:   string;
  title:  string;
  detail: string;
}

export interface RecHistoryEntry {
  id:              string;   // ISO timestamp used as unique ID
  savedAt:         string;   // ISO timestamp
  healthScore:     number;
  recommendations: HistoryRec[];
}

const STORAGE_KEY = 'dc_rec_history';
const MAX_ENTRIES  = 10;

function load(): RecHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

function save(entries: RecHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
}

/** Returns all history entries, newest first. */
export function getRecHistory(): RecHistoryEntry[] {
  return load();
}

/** Returns the most recent entry, or null if history is empty. */
export function getLatestEntry(): RecHistoryEntry | null {
  return load()[0] ?? null;
}

/**
 * Saves a snapshot of the current recommendations.
 * Skips saving if the recommendation titles are identical to the last snapshot
 * (avoids bloating history on repeated loads of the same data).
 * Keeps at most MAX_ENTRIES entries.
 */
export function saveRecSnapshot(healthScore: number, recs: HistoryRec[]): void {
  const existing = load();
  const titles    = recs.map(r => r.title).sort().join('|');
  const lastTitles = (existing[0]?.recommendations ?? []).map(r => r.title).sort().join('|');
  if (titles === lastTitles) return; // same recs — no new snapshot needed

  const entry: RecHistoryEntry = {
    id:              new Date().toISOString(),
    savedAt:         new Date().toISOString(),
    healthScore,
    recommendations: recs,
  };

  save([entry, ...existing].slice(0, MAX_ENTRIES));
}

/** Removes all history. */
export function clearRecHistory(): void {
  save([]);
}

/**
 * Returns rec titles that are NEW compared to the upload before the current one.
 * Compares current titles against history[1] (previous snapshot, before the
 * current upload's snapshot was saved at history[0]).
 */
export function getNewTitles(currentTitles: string[]): Set<string> {
  const history = load();
  const prev = history[1]; // the snapshot before the current one
  if (!prev) return new Set(); // only one or zero snapshots — nothing is "new"
  const prevSet = new Set(prev.recommendations.map(r => r.title));
  return new Set(currentTitles.filter(t => !prevSet.has(t)));
}

/**
 * Returns recs from the previous upload that are no longer present in the current one.
 * Compares history[1] (previous) against current titles.
 */
export function getResolvedRecs(currentTitles: string[]): HistoryRec[] {
  const history = load();
  const prev = history[1]; // the snapshot before the current one
  if (!prev) return [];
  const currentSet = new Set(currentTitles);
  return prev.recommendations.filter(r => !currentSet.has(r.title));
}
