// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Route protection — unauthenticated users are redirected to /login.

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

const PROTECTED  = ['/dashboard', '/summary', '/charts', '/explore', '/backend', '/profile', '/customer', '/snapshots'];
const ADMIN_ONLY = ['/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAdminOnly = ADMIN_ONLY.some(p => pathname.startsWith(p));

  if (!isProtected && !isAdminOnly) return NextResponse.next();

  const res     = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);

  if (!session.isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminOnly && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/summary/:path*', '/charts/:path*',
    '/explore/:path*',   '/backend/:path*', '/profile/:path*',
    '/customer/:path*',  '/snapshots/:path*', '/admin/:path*',
  ],
};
