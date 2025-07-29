import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface LoginError {
   detail?: string;
}

export async function POST(req: NextRequest) {
   try {
      const body = await req.json();
      const { username, password } = body;

      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
         throw new Error("La URL de la API no está configurada en las variables de entorno.");
      }

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login/access-token`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: formData.toString(),
      });

      if (!apiResponse.ok) {
         const errorData: LoginError = await apiResponse.json();
         return NextResponse.json(
            { detail: errorData.detail || 'Error en la autenticación desde el backend' },
            { status: apiResponse.status }
         );
      }

      const { access_token, refresh_token } = await apiResponse.json();

      const cookieStore = await cookies();

      cookieStore.set('access_token', access_token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'strict',
         path: '/',
         maxAge: 60 * 60, // 1 hora
      });

      cookieStore.set('refresh_token', refresh_token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'strict',
         path: '/',
         maxAge: 60 * 60 * 24 * 7, // 7 días
      });

      return NextResponse.json({ access_token, refresh_token });

   } catch (error: any) {
      console.error('Error en el proxy de login:', error);
      return NextResponse.json(
         { detail: error.message || 'Error interno del servidor' },
         { status: 500 }
      );
   }
}
