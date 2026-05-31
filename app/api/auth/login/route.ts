// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Stub — activate by running: npm install prisma @prisma/client iron-session bcryptjs
// Then replace this file with the full implementation from DEVELOPER_GUIDE.md

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Authentication is not yet configured. Run: npm install prisma @prisma/client iron-session bcryptjs && npx prisma migrate dev' },
    { status: 503 },
  );
}
