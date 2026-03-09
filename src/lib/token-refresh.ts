import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";
import type { RefreshTokenPayload, Token } from "@/types/api";

const BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL)!;

const COOKIE_BASE_OPTIONS = {
   httpOnly: true,
   secure: process.env.NODE_ENV === "production",
   path: "/",
   sameSite: "lax" as const,
};

const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function refreshAccessToken(): Promise<string | null> {
   const cookieStore = await cookies();
   const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

   if (!refreshToken) return null;

   try {
      const payload: RefreshTokenPayload = { refresh_token: refreshToken };

      const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
         cache: "no-store",
      });

      if (!res.ok) return null;

      const tokens = (await res.json()) as Token;

      cookieStore.set(AUTH_COOKIE_NAME, tokens.access_token, {
         ...COOKIE_BASE_OPTIONS,
         maxAge: ACCESS_COOKIE_MAX_AGE,
      });

      if (tokens.refresh_token) {
         cookieStore.set(REFRESH_COOKIE_NAME, tokens.refresh_token, {
            ...COOKIE_BASE_OPTIONS,
            maxAge: REFRESH_COOKIE_MAX_AGE,
         });
      }

      return tokens.access_token;
   } catch {
      return null;
   }
}
