import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/lib/constants';

export function proxy(request: NextRequest) {
   const { pathname } = request.nextUrl;

   const hasAccessToken = request.cookies.has(AUTH_COOKIE_NAME);
   const hasRefreshToken = request.cookies.has(REFRESH_COOKIE_NAME);
   const hasAnyToken = hasAccessToken || hasRefreshToken;

   const authRoutes = ['/login', '/forgot-password', '/reset-password'];
   const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

   if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.includes('.')
   ) {
      return NextResponse.next();
   }

   // Usuario con sesión yendo a login → Dashboard
   if (isAuthRoute && hasAnyToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
   }

   // Usuario sin sesión yendo a ruta protegida → Login
   if (!isAuthRoute && !hasAnyToken) {
      return NextResponse.redirect(new URL('/login', request.url));
   }

   return NextResponse.next();
}

export const config = {
   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
