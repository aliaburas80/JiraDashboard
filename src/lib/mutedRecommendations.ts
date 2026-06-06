// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Mute and snooze recommendations — persisted to localStorage.

const STORAGE_KEY = 'dc_muted_recs';

export type SnoozeUntil = 'forever' | string; // 'forever' or ISO date string

export interface MutedRec {
  key:     string;        // stable identifier: type:title[:40]
  label:   string;        // human-readable for restore UI
  mutedAt: string;        // ISO timestamp when muted/snoozed
  until:   SnoozeUntil;  // 'forever' or ISO expiry date
}

// Derive a stable key from a recommendation
export function recKey(type: string, title: string): string {
  return `${type}:${title.slice(0, 60)}`;
}

export function loadMuted(): MutedRec[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MutedRec[]) : [];
  } catch { return []; }
}

function save(recs: MutedRec[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recs)); } catch {}
}

// Check if a recommendation is currently muted/snoozed
export function isMuted(key: string): boolean {
  const now = Date.now();
  const muted = loadMuted();
  const entry = muted.find(m => m.key === key);
  if (!entry) return false;
  if (entry.until === 'forever') return true;
  return new Date(entry.until).getTime() > now;
}

// Mute permanently
export function muteRec(key: string, label: string): void {
  const muted = loadMuted().filter(m => m.key !== key);
  muted.push({ key, label, mutedAt: new Date().toISOString(), until: 'forever' });
  save(muted);
}

// Snooze for N days
export function snoozeRec(key: string, label: string, days: number): void {
  const until = new Date(Date.now() + days * 86_400_000).toISOString();
  const muted = loadMuted().filter(m => m.key !== key);
  muted.push({ key, label, mutedAt: new Date().toISOString(), until });
  save(muted);
}

// Restore (unmute) a specific recommendation
export function restoreRec(key: string): void {
  save(loadMuted().filter(m => m.key !== key));
}

// Restore all muted/snoozed recommendations
export function restoreAll(): void {
  save([]);
}

// Remove expired snoozes (cleanup)
export function pruneExpired(): void {
  const now = Date.now();
  save(loadMuted().filter(m => m.until === 'forever' || new Date(m.until).getTime() > now));
}

// Get all currently active mutes (for display in "N muted" counter)
export function getActiveMuted(): MutedRec[] {
  pruneExpired();
  return loadMuted();
}
