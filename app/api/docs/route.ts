// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALLOWED: Record<string, string> = {
  brd:            'BRD.md',
  srs:            'SRS.md',
  'use-cases':    'USE_CASES.md',
  scenarios:      'SCENARIOS.md',
  'test-cases':   'TEST_CASES.md',
  'user-journeys':'USER_JOURNEYS.md',
  'dev-guide':    'DEVELOPER_GUIDE.md',
  readme:         'README.md',
};

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') || '';
  const filename = ALLOWED[slug];
  if (!filename) {
    return NextResponse.json({ error: 'Unknown document' }, { status: 404 });
  }
  try {
    const filePath = path.join(process.cwd(), 'product', filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ slug, filename, content });
  } catch {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
}
