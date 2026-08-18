import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from './lib/session';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const res = NextResponse.next();
  const session = await getIronSession<AdminSessionData>(req, res, ADMIN_SESSION_OPTIONS);

  if (!session.isLoggedIn || !session.userId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
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
