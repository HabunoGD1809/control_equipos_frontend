import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";

const BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL)!;

const COOKIE_BASE_OPTIONS = {
   httpOnly: true,
   secure: process.env.NODE_ENV === "production",
   path: "/",
   sameSite: "lax" as const,
};

export async function refreshAccessToken(): Promise<string | null> {
   const cookieStore = await cookies();
   const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

   if (!refreshToken) return null;

   try {
      const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ refresh_token: refreshToken }),
         cache: "no-store",
      });

      if (!res.ok) {
         cookieStore.delete(AUTH_COOKIE_NAME);
         cookieStore.delete(REFRESH_COOKIE_NAME);
         return null;
      }

      const tokens = await res.json();

      cookieStore.set(AUTH_COOKIE_NAME, tokens.access_token, {
         ...COOKIE_BASE_OPTIONS,
         maxAge: 60 * 60 * 24 * 7, // 7 días
      });

      if (tokens.refresh_token) {
         cookieStore.set(REFRESH_COOKIE_NAME, tokens.refresh_token, {
            ...COOKIE_BASE_OPTIONS,
            maxAge: 60 * 60 * 24 * 30, // 30 días
         });
      }

      return tokens.access_token;
   } catch {
      return null;
   }
}
