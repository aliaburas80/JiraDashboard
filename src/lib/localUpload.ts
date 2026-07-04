// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-017: runs the same parse → validate → calculate pipeline as POST /api/upload
// (app/api/upload/route.ts), but entirely client-side, so the file's contents
// never touch the network. Used by app/page.tsx's handleFile() only when the
// logged-in user's dataStorageMode is "local".

import type { ColumnMappingResult } from '@/types/columnMapping';

// Mirrors the server's own limits (app/api/upload/route.ts ALLOWED_EXTENSIONS /
// MAX_UPLOAD_MB default) so behavior matches regardless of storage mode.
export const LOCAL_MODE_ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
export const LOCAL_MODE_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

export type ProcessFileLocallyResult =
  | { metrics: any; warnings: string[]; columnMapping: ColumnMappingResult }
  | { error: string; details?: string[] };

export async function processFileLocally(file: File): Promise<ProcessFileLocallyResult> {
  const ext = getFileExtension(file.name);
  if (!LOCAL_MODE_ALLOWED_EXTENSIONS.includes(ext)) {
    return { error: `Unsupported file type "${ext}". Upload a .csv, .xlsx, or .xls Jira export.` };
  }
  if (file.size > LOCAL_MODE_MAX_FILE_SIZE_BYTES) {
    return { error: 'File exceeds the 20 MB size limit. Export a smaller date range or reduce the number of columns.' };
  }

  const [{ parseJiraFile }, { validateIssueData }, { calculateDashboardMetrics }] = await Promise.all([
    import('@/services/jira/parser'),
    import('@/services/jira/validation'),
    import('@/services/metrics/metrics.service'),
  ]);

  const buffer = await file.arrayBuffer();
  let parseResult: ReturnType<typeof parseJiraFile>;
  try {
    parseResult = parseJiraFile({ buffer, originalname: file.name });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unable to process Jira export file.' };
  }

  const { issues, warnings } = parseResult;
  const validation = validateIssueData(issues);
  if (!validation.isValid) {
    return { error: 'Validation failed', details: validation.errors };
  }

  const metrics = calculateDashboardMetrics(issues);
  return { metrics, warnings, columnMapping: parseResult.columnMapping };
}
