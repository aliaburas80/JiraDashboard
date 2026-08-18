import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import {
  ADMIN_SESSION_OPTIONS,
  isFullyAuthenticatedAdminSession,
  type AdminSessionData,
} from './lib/session';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];
const PRE_MFA_PATHS = ['/mfa/enroll', '/mfa/verify', '/api/mfa', '/api/auth/logout'];
const OWNER_ONLY_PATHS = [
  '/system-errors',
  '/diagnostics',
  '/security',
  '/settings',
  '/api/ops/system-errors',
  '/api/ops/diagnostics',
  '/api/ops/security',
  '/api/ops/settings',
];

function matches(pathname: string, paths: string[]): boolean {
  return paths.some(path => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (matches(pathname, PUBLIC_PATHS)) return NextResponse.next();

  const res = NextResponse.next();
  const session = await getIronSession<AdminSessionData>(req, res, ADMIN_SESSION_OPTIONS);

  if (matches(pathname, PRE_MFA_PATHS)) {
    if (!session.userId || !session.passwordVerified) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Administrator password verification required.' }, { status: 401 });
      }
      const login = req.nextUrl.clone();
      login.pathname = '/login';
      login.searchParams.set('redirect', '/');
      return NextResponse.redirect(login);
    }

    if (isFullyAuthenticatedAdminSession(session) && pathname.startsWith('/mfa/')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
  }

  if (!isFullyAuthenticatedAdminSession(session)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Multi-factor authenticated administrator session required.' }, { status: 401 });
    }

    const login = req.nextUrl.clone();
    login.pathname = '/login';
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }

  // EP-024 defense in depth: Owner-only pages are blocked before React renders,
  // while their route handlers independently revalidate isSuperAdmin against
  // the database through requireOwnerAdmin(). The cookie flag alone is never
  // sufficient for an API authorization decision.
  if (matches(pathname, OWNER_ONLY_PATHS) && !session.isSuperAdmin) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Owner Admin access required.' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
