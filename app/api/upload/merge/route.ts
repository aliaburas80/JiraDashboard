// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// POST /api/upload/merge — accepts multiple Jira export files, merges
// raw issues by Issue Key, and returns unified DashboardMetrics.

import { NextRequest, NextResponse } from 'next/server';
import { parseJiraFile } from '@/services/jira/parser';
import { validateIssueData } from '@/services/jira/validation';
import { calculateDashboardMetrics } from '@/services/metrics/metrics.service';
import { writeLatestMetrics } from '@/services/metrics/latestMetricsStorage';
import { mergeIssueArrays } from '@/lib/mergeIssues';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES     = 10;
const ALLOWED_EXT   = new Set(['.csv', '.xlsx', '.xls']);

function ext(name: string): string {
  return name.slice(name.lastIndexOf('.')).toLowerCase();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ error: 'Invalid multipart form data.' }, { status: 400 });
  }

  // Collect all files (field names: file_0, file_1, … or just "file" multiple times)
  const blobs: Blob[] = [];
  for (const [, value] of formData.entries()) {
    if (value instanceof Blob) blobs.push(value);
  }

  if (!blobs.length) {
    return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
  }
  if (blobs.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed.` }, { status: 400 });
  }

  const allIssueArrays: Record<string, unknown>[][] = [];
  const fileWarnings: string[] = [];

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const name = (blob as File).name ?? `file_${i}`;

    if (!ALLOWED_EXT.has(ext(name))) {
      return NextResponse.json({ error: `File "${name}" is not a supported format.` }, { status: 400 });
    }
    if (blob.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File "${name}" exceeds 20 MB.` }, { status: 400 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    try {
      const { issues, warnings } = parseJiraFile({ buffer, originalname: name });
      const validation = validateIssueData(issues);
      if (!validation.isValid) {
        return NextResponse.json({ error: `File "${name}" failed validation: ${validation.errors.join(', ')}` }, { status: 422 });
      }
      allIssueArrays.push(issues);
      fileWarnings.push(...warnings.map(w => `[${name}] ${w}`));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Parse error';
      return NextResponse.json({ error: `File "${name}": ${msg}` }, { status: 400 });
    }
  }

  try {
    const { merged, stats } = mergeIssueArrays(allIssueArrays);
    const metrics = calculateDashboardMetrics(merged);
    writeLatestMetrics(metrics);
    import('@/services/storage/cloudSync')
      .then(({ pushToCloud }) => pushToCloud())
      .catch(() => {});
    return NextResponse.json({ metrics, warnings: fileWarnings, mergeStats: stats });
  } catch {
    return NextResponse.json({ error: 'Failed to calculate metrics from merged data.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
