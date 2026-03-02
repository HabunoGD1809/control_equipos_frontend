import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";

export async function getSession() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
   const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
   return { accessToken, refreshToken };
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
