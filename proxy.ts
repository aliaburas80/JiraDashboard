// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Route protection — unauthenticated users are redirected to /login.

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { canAccessRoute, fallbackRouteForRole } from '@/lib/roles';
import { REQUEST_ID_HEADER, resolveRequestId } from '@/lib/requestId';

const PROTECTED  = [
  '/', '/dashboard', '/summary', '/charts', '/explore', '/backend', '/profile',
  '/members', '/customer', '/snapshots', '/trends', '/readiness', '/teams',
  '/portfolio', '/landing', '/glossary', '/developer', '/help', '/admin',
  '/change-password', '/reports',
  // Routes added v4.6–v4.9 — were missing from PROTECTED (unauthenticated access possible)
  '/roadmap', '/forecast', '/retro',
  '/data-quality', '/delivery-mix', '/flow-health', '/release-readiness',
  '/sprint-kanban', '/work-explorer', '/column-mapping',
];
const ADMIN_ONLY = ['/admin'];

// SEC (2026-07-18, docs/product-audit/10-technical-cleanup.md Part 1 finding
// 1): defense-in-depth backstop for /api/*. Until now every one of the ~73
// API route handlers was solely, independently responsible for its own auth
// check, with zero shared enforcement layer — a route that forgot to check
// its session had no safety net, unlike page routes above. This backstop
// checks ONLY "is there a valid session" (authentication), never role or
// ownership (authorization) — that stays each route's own responsibility
// (e.g. admin routes' own `requireAdmin()` / `session.role === 'admin'`
// checks still run, unaffected, after this gate passes) so it cannot
// conflict with a route's more granular logic, only backstop the case where
// a route has none at all.
//
// PUBLIC_API is an explicit allow-list, not an inference from each route's
// own code — every entry below was individually verified (grepped + read)
// to be an intentionally public route: the pre-login auth flows (a logged-in
// gate on the login/register endpoints themselves is a contradiction),
// liveness/readiness probes, the public promo lead-gen form, the documented
// pre-login client-error sink, the zero-sensitive-content status stub, and
// backend-view (which does its own session-aware branching and must stay
// reachable unauthenticated for its documented API-index purpose — see the
// 2026-07-18 fix to its unauthenticated fallback in app/api/backend-view/
// route.ts, which stopped that fallback returning real file-derived data).
// Every other /api/* route — including ones that already self-check, where
// this is intentionally redundant-but-harmless — now requires a session.
const PUBLIC_API = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/resend-verification',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/health',
  '/api/ready',
  '/api/demo-request',
  '/api/events/error',
  '/api/dashboard',
  '/api/backend-view',
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/')) {
    // P0A-07: per-request correlation ID. Reuse an inbound x-request-id if an
    // upstream proxy/load balancer already set one, else mint a fresh one.
    // Set on both the forwarded request (so route handlers can read it via
    // getRequestId()) and every response (so a caller/support ticket can
    // quote it back).
    const requestId        = resolveRequestId(req.headers);
    const forwardedHeaders = new Headers(req.headers);
    forwardedHeaders.set(REQUEST_ID_HEADER, requestId);

    if (isPublicApi(pathname)) {
      const res = NextResponse.next({ request: { headers: forwardedHeaders } });
      res.headers.set(REQUEST_ID_HEADER, requestId);
      return res;
    }

    const res = NextResponse.next({ request: { headers: forwardedHeaders } });
    res.headers.set(REQUEST_ID_HEADER, requestId);
    const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);
    if (!session.isLoggedIn) {
      const unauthorized = NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
      unauthorized.headers.set(REQUEST_ID_HEADER, requestId);
      return unauthorized;
    }
    return res;
  }

  const isProtected = PROTECTED.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p));
  const isAdminOnly = ADMIN_ONLY.some(p => pathname.startsWith(p));

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
    '/', '/developer/:path*', '/help/:path*', '/admin/:path*',
    '/change-password/:path*', '/members/:path*', '/reports/:path*',
    '/roadmap/:path*', '/forecast/:path*', '/retro/:path*',
    '/data-quality/:path*', '/delivery-mix/:path*', '/flow-health/:path*',
    '/release-readiness/:path*', '/sprint-kanban/:path*', '/work-explorer/:path*',
    '/column-mapping/:path*',
    // SEC (2026-07-18): /api/* backstop — see PUBLIC_API note above.
    '/api/:path*',
  ],
};
