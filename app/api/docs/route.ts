// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import fs from 'fs';
import path from 'path';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

const ALLOWED: Record<string, string> = {
  brd:            'BRD.md',
  srs:            'SRS.md',
  'use-cases':    'USE_CASES.md',
  scenarios:      'SCENARIOS.md',
  'test-cases':   'TEST_CASES.md',
  'user-journeys':'USER_JOURNEYS.md',
  'dev-guide':    'DEVELOPER_GUIDE.md',
  'deployment':   'DEPLOYMENT_GUIDE.md',
  readme:         'README.md',
};

export async function GET(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

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
