import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";
import type { Token } from "@/types/api";

const pending = new Map<string, Promise<Token | null>>();
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", sameSite: "lax" as const };

async function rotate(refreshToken: string): Promise<Token | null> {
   const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   if (!base) return null;
   try {
      const response = await fetch(`${base.replace(/\/$/, "")}/auth/refresh-token`, {
         method: "POST", headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ refresh_token: refreshToken }), cache: "no-store",
         signal: AbortSignal.timeout(10000),
      });
      return response.ok ? await response.json() as Token : null;
   } catch { return null; }
}

// Concurrent requests share a single rotation. Only a digest is used as a map key.
export async function refreshAccessToken(): Promise<string | null> {
   const store = await cookies();
   const refreshToken = store.get(REFRESH_COOKIE_NAME)?.value;
   if (!refreshToken) return null;
   const key = createHash("sha256").update(refreshToken).digest("hex");
   let operation = pending.get(key);
   if (!operation) {
      if (pending.size >= 256) return null;
      operation = rotate(refreshToken);
      pending.set(key, operation);
      void operation.finally(() => { setTimeout(() => pending.delete(key), 2000).unref(); });
   }
   const tokens = await operation;
   if (!tokens) return null;
   store.set(AUTH_COOKIE_NAME, tokens.access_token, { ...cookieOptions, maxAge: 86400 });
   if (tokens.refresh_token) store.set(REFRESH_COOKIE_NAME, tokens.refresh_token, { ...cookieOptions, maxAge: 604800 });
   return tokens.access_token;
}
