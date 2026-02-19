import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export function proxy(request: NextRequest) {
   const { pathname } = request.nextUrl;
   const hasToken = request.cookies.has(AUTH_COOKIE_NAME);

   const authRoutes = ['/login', '/forgot-password', '/reset-password'];
   const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

   // Ignorar estáticos y API interna
   if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
      return NextResponse.next();
   }

   // Usuario logueado yendo a login -> Dashboard
   if (isAuthRoute && hasToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
   }

   // Usuario anónimo yendo a ruta protegida -> Login
   if (!isAuthRoute && !hasToken) {
      return NextResponse.redirect(new URL('/login', request.url));
   }

   return NextResponse.next();
}

export const config = {
   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
