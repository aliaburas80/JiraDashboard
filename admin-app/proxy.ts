import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import {
  ADMIN_SESSION_OPTIONS,
  isFullyAuthenticatedAdminSession,
  type AdminSessionData,
} from './lib/session';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];
const PRE_MFA_PATHS = ['/mfa/enroll', '/mfa/verify', '/api/mfa', '/api/auth/logout'];

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

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
