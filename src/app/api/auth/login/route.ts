import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";

interface LoginError {
   detail?: string;
}

const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d

export async function POST(req: NextRequest) {
   try {
      const body = await req.json();
      const { username, password } = body;

      const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) throw new Error("API base URL no configurada.");

      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const apiResponse = await fetch(`${baseUrl}/auth/login/access-token`, {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: formData.toString(),
         cache: "no-store",
      });

      if (!apiResponse.ok) {
         const errorData: LoginError = await apiResponse.json().catch(() => ({}));
         return NextResponse.json(
            { detail: errorData.detail || "Error en la autenticación desde el backend" },
            { status: apiResponse.status }
         );
      }

      const { access_token, refresh_token } = await apiResponse.json();

      const cookieStore = await cookies();

      cookieStore.set(AUTH_COOKIE_NAME, access_token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         path: "/",
         maxAge: ACCESS_COOKIE_MAX_AGE,
      });

      if (refresh_token) {
         cookieStore.set(REFRESH_COOKIE_NAME, refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: REFRESH_COOKIE_MAX_AGE,
         });
      }

      return NextResponse.json({ success: true });
   } catch (error: any) {
      console.error("Error en el proxy de login:", error);
      return NextResponse.json(
         { detail: error.message || "Error interno del servidor" },
         { status: 500 }
      );
   }
}
