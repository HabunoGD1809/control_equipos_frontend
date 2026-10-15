import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";

const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function getSession() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
   const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
   return { accessToken, refreshToken };
}

export async function createSession(accessToken: string, refreshToken?: string) {
   const cookieStore = await cookies();
   const isProd = process.env.NODE_ENV === "production";

   cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: isProd,
      maxAge: ACCESS_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
   });

   if (refreshToken) {
      cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
         httpOnly: true,
         secure: isProd,
         maxAge: REFRESH_COOKIE_MAX_AGE,
         path: "/",
         sameSite: "lax",
      });
   }
}

export async function deleteSession({ deferRevocation = false }: { deferRevocation?: boolean } = {}) {
   const cookieStore = await cookies();
   const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
   const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   cookieStore.delete(AUTH_COOKIE_NAME);
   cookieStore.delete(REFRESH_COOKIE_NAME);
   if (refreshToken && base) {
      const revoke = async () => {
         try {
            await fetch(`${base.replace(/\/$/, "")}/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refreshToken }), cache: "no-store", signal: AbortSignal.timeout(3000) });
         } catch { /* The local session must still close when the API is unavailable. */ }
      };
      if (deferRevocation) after(revoke);
      else await revoke();
   }
}

export async function verifySession() {
   const { accessToken } = await getSession();
   if (!accessToken) redirect("/login");
   return accessToken;
}
