// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

export type FeedbackVote = 'helpful' | 'not_helpful';

export interface RecFeedback {
  key:       string;
  title:     string;
  vote:      FeedbackVote;
  timestamp: string;
}

const STORAGE_KEY = 'dc_rec_feedback';

function load(): RecFeedback[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function save(items: RecFeedback[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

/** Returns the current vote for a recommendation key, or null if none. */
export function getVote(key: string): FeedbackVote | null {
  const item = load().find(f => f.key === key);
  return item?.vote ?? null;
}

/** Returns all stored feedback entries. */
export function getAllFeedback(): RecFeedback[] {
  return load();
}

/**
 * Records a vote for a recommendation.
 * If the same vote is cast again, it is toggled off (removed).
 */
export function castVote(key: string, title: string, vote: FeedbackVote): void {
  const items = load().filter(f => f.key !== key);
  const existing = load().find(f => f.key === key);
  // Toggle off if same vote
  if (existing?.vote === vote) {
    save(items);
  } else {
    save([...items, { key, title, vote, timestamp: new Date().toISOString() }]);
  }
}

/** Removes the vote for a recommendation. */
export function clearVote(key: string): void {
  save(load().filter(f => f.key !== key));
}

/** Removes all stored feedback. */
export function clearAllFeedback(): void {
  save([]);
}

/** Returns counts of helpful and not_helpful votes across all recommendations. */
export function getFeedbackSummary(): { helpful: number; not_helpful: number } {
  const all = load();
  return {
    helpful:     all.filter(f => f.vote === 'helpful').length,
    not_helpful: all.filter(f => f.vote === 'not_helpful').length,
  };
}
