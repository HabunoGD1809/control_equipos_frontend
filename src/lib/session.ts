import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";

const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d

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

export async function deleteSession() {
   const cookieStore = await cookies();
   cookieStore.delete(AUTH_COOKIE_NAME);
   cookieStore.delete(REFRESH_COOKIE_NAME);
}

export async function verifySession() {
   const { accessToken } = await getSession();
   if (!accessToken) redirect("/login");
   return accessToken;
}
