import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
   const { pathname } = request.nextUrl;

   // 1. Verificamos la cookie correcta: 'access_token'
   const isAuthenticated = request.cookies.has('access_token');

   const authRoutes = ['/login', '/forgot-password', '/reset-password'];
   const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

   // Si el usuario está en una ruta de autenticación
   if (isAuthRoute) {
      if (isAuthenticated) {
         // Y ya está logueado, lo mandamos al dashboard
         return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Si no está logueado, le permitimos ver la página (login, etc.)
      return NextResponse.next();
   }

   // Si el usuario está en una ruta protegida y no está logueado
   if (!isAuthenticated) {
      // Lo mandamos al login
      return NextResponse.redirect(new URL('/login', request.url));
   }

   // Si está logueado, le permitimos continuar
   return NextResponse.next();
}

// 2. Añadimos la ruta principal '/' al matcher para protegerla
export const config = {
   matcher: [
      '/', // Proteger la página de bienvenida
      '/dashboard/:path*',
      '/login',
      '/forgot-password',
      '/reset-password',
   ],
};
