// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// POST /api/auth/register — reserved for future use; public registration is inactive.

import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({
    error: 'Registration is disabled. Users must be created by an administrator.',
  }, { status: 403 });
}
