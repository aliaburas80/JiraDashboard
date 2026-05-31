// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Route protection middleware — redirects unauthenticated users to /login.
// Activate after running: npm install iron-session && npx prisma migrate dev

// NOTE: Middleware is currently COMMENTED OUT so the app works without auth.
// Uncomment when F3 auth packages are installed and DB is initialised.
//
// import { NextRequest, NextResponse } from 'next/server';
// import { getIronSession } from 'iron-session';
// import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
//
// const PROTECTED = ['/dashboard', '/summary', '/charts', '/explore', '/backend', '/profile', '/admin'];
// const ADMIN_ONLY = ['/admin'];
//
// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;
//   const isProtected = PROTECTED.some(p => pathname.startsWith(p));
//   if (!isProtected) return NextResponse.next();
//
//   const res = NextResponse.next();
//   const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);
//
//   if (!session.isLoggedIn) {
//     const url = req.nextUrl.clone();
//     url.pathname = '/login';
//     url.searchParams.set('redirect', pathname);
//     return NextResponse.redirect(url);
//   }
//
//   if (ADMIN_ONLY.some(p => pathname.startsWith(p)) && session.role !== 'admin') {
//     return NextResponse.redirect(new URL('/dashboard', req.url));
//   }
//
//   return res;
// }
//
// export const config = {
//   matcher: ['/dashboard/:path*', '/summary/:path*', '/charts/:path*', '/explore/:path*',
//             '/backend/:path*', '/profile/:path*', '/admin/:path*'],
// };

export function middleware() {}
