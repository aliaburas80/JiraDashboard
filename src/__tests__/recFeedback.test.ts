// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Recommendation Feedback tests — TC-RF-01 to TC-RF-08

if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', { value: global, writable: true });
}

const store: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { Object.keys(store).forEach(k => delete store[k]); },
  },
});

import { getVote, castVote, clearVote, clearAllFeedback, getAllFeedback, getFeedbackSummary } from '../lib/recFeedback';

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

// TC-RF-01: getVote returns null when no vote exists
test('TC-RF-01: getVote returns null for unknown key', () => {
  expect(getVote('rec-1')).toBeNull();
});

// TC-RF-02: castVote stores a helpful vote
test('TC-RF-02: castVote stores helpful vote', () => {
  castVote('rec-1', 'Fix blockers', 'helpful');
  expect(getVote('rec-1')).toBe('helpful');
});

// TC-RF-03: castVote stores a not_helpful vote
test('TC-RF-03: castVote stores not_helpful vote', () => {
  castVote('rec-2', 'Review orphans', 'not_helpful');
  expect(getVote('rec-2')).toBe('not_helpful');
});

// TC-RF-04: casting same vote again toggles it off
test('TC-RF-04: casting same vote toggles off (removes)', () => {
  castVote('rec-1', 'Fix blockers', 'helpful');
  castVote('rec-1', 'Fix blockers', 'helpful'); // same vote again
  expect(getVote('rec-1')).toBeNull();
});

// TC-RF-05: casting different vote replaces previous
test('TC-RF-05: casting different vote replaces previous', () => {
  castVote('rec-1', 'Fix blockers', 'helpful');
  castVote('rec-1', 'Fix blockers', 'not_helpful');
  expect(getVote('rec-1')).toBe('not_helpful');
});

// TC-RF-06: clearVote removes the vote
test('TC-RF-06: clearVote removes vote for key', () => {
  castVote('rec-1', 'Fix blockers', 'helpful');
  clearVote('rec-1');
  expect(getVote('rec-1')).toBeNull();
});

// TC-RF-07: getFeedbackSummary counts correctly
test('TC-RF-07: getFeedbackSummary returns correct counts', () => {
  castVote('rec-1', 'A', 'helpful');
  castVote('rec-2', 'B', 'helpful');
  castVote('rec-3', 'C', 'not_helpful');
  const { helpful, not_helpful } = getFeedbackSummary();
  expect(helpful).toBe(2);
  expect(not_helpful).toBe(1);
});

// TC-RF-08: clearAllFeedback removes all entries
test('TC-RF-08: clearAllFeedback removes all feedback', () => {
  castVote('rec-1', 'A', 'helpful');
  castVote('rec-2', 'B', 'not_helpful');
  clearAllFeedback();
  expect(getAllFeedback()).toHaveLength(0);
  expect(getVote('rec-1')).toBeNull();
});
