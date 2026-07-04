// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Merge and deduplicate raw Jira issue arrays from multiple exports.
// Deduplication key: Issue Key field.
// When the same key appears in multiple files, fields are merged by preferring
// the most complete value (non-null, non-empty string wins over empty).

type RawIssue = Record<string, unknown>;

export interface MergeStats {
  fileCount: number;
  totalBeforeMerge: number;
  duplicatesRemoved: number;
  uniqueIssues: number;
}

// Returns true if b is more informative than a for a given field value
function isBetter(a: unknown, b: unknown): boolean {
  if (b === null || b === undefined || b === '') return false;
  if (a === null || a === undefined || a === '') return true;
  // Prefer longer strings (more detail)
  if (typeof a === 'string' && typeof b === 'string') return b.length > a.length;
  return false;
}

function mergeTwo(base: RawIssue, incoming: RawIssue): RawIssue {
  const result = { ...base };
  for (const [key, val] of Object.entries(incoming)) {
    if (isBetter(result[key], val)) {
      result[key] = val;
    }
  }
  return result;
}

export function mergeIssueArrays(arrays: RawIssue[][]): {
  merged: RawIssue[];
  stats: MergeStats;
} {
  const map = new Map<string, RawIssue>();
  let totalBeforeMerge = 0;

  for (const issues of arrays) {
    totalBeforeMerge += issues.length;
    for (const issue of issues) {
      const key = String(issue['Issue Key'] ?? '').trim();
      if (!key) continue;

      if (map.has(key)) {
        map.set(key, mergeTwo(map.get(key)!, issue));
      } else {
        map.set(key, { ...issue });
      }
    }
  }

  const merged = [...map.values()];
  return {
    merged,
    stats: {
      fileCount:           arrays.length,
      totalBeforeMerge,
      duplicatesRemoved:   totalBeforeMerge - merged.length,
      uniqueIssues:        merged.length,
    },
  };
}
