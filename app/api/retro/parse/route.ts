// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/retro/parse — RETRO-04 to RETRO-10. Parses an uploaded retro
// file (CSV/XLSX/XLS/Markdown/plain text) and returns a preview — records,
// generated insights, warnings, and corrections — for the user to review
// before importing. No persistence; this is a read-through preview endpoint.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { parseRetroFile } from '@/services/retro/retroFileParser.service';
import { generateInsightsForRecords } from '@/services/retro/retroInsights.service';
import { validateFileSignature } from '@/lib/fileSignature';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB — retro files are small, text-based
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.md', '.txt'];

function getExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file uploaded. Choose a CSV, Excel, Markdown, or plain text retrospective file.' }, { status: 400 });
  }

  const originalname = (file as File).name ?? 'retro-upload';
  const ext = getExtension(originalname);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type "${ext}". Upload a .csv, .xlsx, .xls, .md, or .txt retrospective file.` },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5 MB. Retrospective files are expected to be small and text-based.' }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Could not read the uploaded file.' }, { status: 400 });
  }

  // --- Content-signature sanity check (SEC, 2026-07-18) ---
  // See app/api/upload/route.ts's identical gate + src/lib/fileSignature.ts
  // for the full rationale (docs/product-audit/10-technical-cleanup.md
  // Part 1 finding 3).
  const signatureError = validateFileSignature(buffer, ext);
  if (signatureError) {
    return NextResponse.json({ error: signatureError }, { status: 400 });
  }

  let parsed: ReturnType<typeof parseRetroFile>;
  try {
    parsed = parseRetroFile(buffer, originalname);
  } catch {
    return NextResponse.json({ error: 'The file could not be parsed. Confirm it is a valid CSV, Excel, Markdown, or plain text file.' }, { status: 400 });
  }

  if (!parsed.records.length) {
    return NextResponse.json({ error: parsed.warnings[0] ?? 'No retrospective data could be found in this file.', warnings: parsed.warnings }, { status: 422 });
  }

  const insights = generateInsightsForRecords(parsed.records, 'upload');

  return NextResponse.json({
    records: parsed.records,
    insights,
    warnings: parsed.warnings,
    corrections: parsed.corrections,
  });
}

export const dynamic = 'force-dynamic';
