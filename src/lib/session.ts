import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Estas son las claves que deben coincidir con el middleware
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export async function getSession() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get(ACCESS_TOKEN_KEY)?.value;
   const refreshToken = cookieStore.get(REFRESH_TOKEN_KEY)?.value;

   return { accessToken, refreshToken };
}

export async function setSession(accessToken: string, refreshToken: string) {
   const cookieStore = await cookies();

   cookieStore.set(ACCESS_TOKEN_KEY, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hora
   });

   cookieStore.set(REFRESH_TOKEN_KEY, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 días
   });
}

export async function deleteSession() {
   const cookieStore = await cookies();
   cookieStore.delete(ACCESS_TOKEN_KEY);
   cookieStore.delete(REFRESH_TOKEN_KEY);
}

export async function verifySession() {
   const { accessToken } = await getSession();
   if (!accessToken) {
      redirect('/login');
   }
   return accessToken;
}
