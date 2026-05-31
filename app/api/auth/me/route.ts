// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Stub — activate after: npm install iron-session prisma @prisma/client bcryptjs
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ error: 'Auth not configured.' }, { status: 503 });
}
