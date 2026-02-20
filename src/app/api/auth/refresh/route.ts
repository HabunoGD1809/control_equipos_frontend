import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST() {
   const cookieStore = await cookies();
   const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

   if (!refreshToken) {
      return NextResponse.json(
         { detail: "No refresh token available" },
         { status: 401 }
      );
   }

   try {
      // Llamada directa al backend FastAPI para rotar el token
      const res = await fetch(`${API_URL}/auth/refresh-token`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
         // Si el refresh token expiró o fue revocado en la BD, limpiamos las cookies
         cookieStore.delete(AUTH_COOKIE_NAME);
         cookieStore.delete(REFRESH_COOKIE_NAME);
         return NextResponse.json(
            { detail: "Refresh token is invalid or expired" },
            { status: 401 }
         );
      }

      const tokens = await res.json();

      // Guardamos el nuevo Access Token
      cookieStore.set(AUTH_COOKIE_NAME, tokens.access_token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         maxAge: 60 * 60 * 24 * 7, // 7 días
         path: "/",
         sameSite: "lax",
      });

      // Si el backend aplicó rotación de Refresh Token, lo actualizamos también
      if (tokens.refresh_token) {
         cookieStore.set(REFRESH_COOKIE_NAME, tokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30, // 30 días
            path: "/",
            sameSite: "lax",
         });
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error al refrescar el token:", error);
      return NextResponse.json(
         { detail: "Internal Server Error" },
         { status: 500 }
      );
   }
}
