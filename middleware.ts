// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Route protection — unauthenticated users are redirected to /login.

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { canAccessRoute, fallbackRouteForRole } from '@/lib/roles';

const PROTECTED  = ['/', '/dashboard', '/summary', '/charts', '/explore', '/backend', '/profile', '/members', '/customer', '/snapshots', '/trends', '/readiness', '/teams', '/portfolio', '/landing', '/glossary', '/developer', '/help', '/admin', '/change-password'];
const ADMIN_ONLY = ['/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p));
  const isAdminOnly = ADMIN_ONLY.some(p => pathname.startsWith(p));

  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!isProtected && !isAdminOnly) return NextResponse.next();

  const res     = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);

  if (!session.isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/') url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (session.mustChangePassword && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', req.url));
  }

  if (isAdminOnly && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!canAccessRoute(session.role, pathname)) {
    return NextResponse.redirect(new URL(fallbackRouteForRole(session.role), req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/summary/:path*', '/charts/:path*',
    '/explore/:path*',   '/backend/:path*', '/profile/:path*',
    '/customer/:path*',  '/snapshots/:path*', '/trends/:path*', '/readiness/:path*',
    '/teams/:path*', '/portfolio/:path*', '/landing/:path*', '/glossary/:path*',
    '/', '/register/:path*', '/developer/:path*', '/help/:path*', '/admin/:path*', '/change-password/:path*', '/members/:path*',
  ],
};
