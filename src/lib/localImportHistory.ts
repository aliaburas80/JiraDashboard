// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-017: import history for users in "local" data-storage mode (see profile
// dataStorageMode). Mirrors the subset of ImportLog fields the profile page's
// history list already renders — everything here stays in the browser and is
// never sent to the server, unlike GET/DELETE /api/imports (the cloud-mode path).

const STORAGE_KEY = 'dc_local_import_history_v1';
const MAX_ITEMS   = 20; // bounded to stay well inside typical localStorage quotas

export interface LocalImportRecord {
  id:            string;
  fileName:      string;
  fileType:      string;
  totalIssues:   number;
  healthScore:   number;
  status:        'success' | 'validation_failed';
  warningsCount: number;
  uploadedAt:    string;
}

function isLocalImportRecord(value: unknown): value is LocalImportRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.fileName === 'string' &&
    typeof r.fileType === 'string' &&
    typeof r.totalIssues === 'number' &&
    typeof r.healthScore === 'number' &&
    (r.status === 'success' || r.status === 'validation_failed') &&
    typeof r.warningsCount === 'number' &&
    typeof r.uploadedAt === 'string'
  );
}

/** Reads and validates the history list — malformed entries are dropped, never thrown. */
export function listLocalImports(): LocalImportRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalImportRecord);
  } catch {
    return [];
  }
}

export interface AddLocalImportResult {
  record: LocalImportRecord;
  quotaExceeded: boolean;
}

/** Prepends a new record, keeping only the most recent MAX_ITEMS. */
export function addLocalImport(
  entry: Omit<LocalImportRecord, 'id' | 'uploadedAt'>,
): AddLocalImportResult {
  const record: LocalImportRecord = {
    ...entry,
    id: `local-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uploadedAt: new Date().toISOString(),
  };

  const next = [record, ...listLocalImports()].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { record, quotaExceeded: false };
  } catch {
    // Browser storage is full — the current upload still succeeded and is on
    // the dashboard (saveMetrics already ran); only the history entry is lost.
    return { record, quotaExceeded: true };
  }
}

export function removeLocalImport(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listLocalImports().filter(r => r.id !== id)));
  } catch {
    // Nothing to roll back to — leave existing history as-is.
  }
}

export function clearLocalImportHistory(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export { STORAGE_KEY as LOCAL_IMPORT_HISTORY_KEY };
