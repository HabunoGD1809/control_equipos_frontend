import "server-only";
import { redirect } from "next/navigation";
import { headers as requestHeaders } from "next/headers";
import { safeReturnPath } from "@/lib/request-security";
import { getSession } from "@/lib/session";
import { BaseFetchOptions, buildQueryString, parseApiError, prepareFetchPayload } from "./http-utils";

function getApiBaseUrl(): string {
   const v = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   if (!v) throw new Error("API_BASE_URL no está definida");
   return v.replace(/\/$/, "");
}

interface ServerFetchOptions extends BaseFetchOptions {
   skipAuthRedirect?: boolean;
}

function redirectToLogout(): never {
   redirect("/api/auth/logout?callbackUrl=/login");
}

async function httpServer<T>(path: string, options: ServerFetchOptions = {}): Promise<T> {
   const { params, headers, _retry, skipAuthRedirect, ...rest } = options;
   const { accessToken } = await getSession();

   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   const url = new URL(`${getApiBaseUrl()}${cleanPath}${buildQueryString(params)}`);

   const defaultHeaders: HeadersInit = {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...((headers as Record<string, string>) || {}),
   };

   const response = await fetch(url.toString(), {
      headers: defaultHeaders,
      ...rest,
      cache: rest.cache ?? "no-store",
      signal: rest.signal ?? AbortSignal.timeout(15000),
   });

   // Older APIs may return 404 for the identity behind a stale session.
   // Clear its cookies through a route handler before returning to the login.
   if (response.status === 404 && cleanPath.replace(/\/+$/, "") === "/usuarios/me" && !skipAuthRedirect) {
      redirectToLogout();
   }

   if (response.status === 401 && !_retry) {
      if (skipAuthRedirect) {
         throw await parseApiError(response);
      }
      const returnTo = safeReturnPath((await requestHeaders()).get("x-auth-return-to"), "/dashboard");
      redirect(`/api/auth/renew?next=${encodeURIComponent(returnTo)}`);
   }

   if (!response.ok) {
      if (response.status === 401 && !skipAuthRedirect) {
         redirectToLogout();
      }
      throw await parseApiError(response);
   }

   if (response.status === 204) return null as T;
   if (!response.headers.get("content-type")?.includes("application/json"))
      return (await response.text()) as unknown as T;

   return (await response.json()) as T;
}

export const serverApi = {
   get: <T>(path: string, options?: ServerFetchOptions) =>
      httpServer<T>(path, { method: "GET", ...options }),
   post: <T>(path: string, body: unknown, options?: ServerFetchOptions) =>
      httpServer<T>(path, { method: "POST", ...prepareFetchPayload(body, options), ...options }),
   put: <T>(path: string, body: unknown, options?: ServerFetchOptions) =>
      httpServer<T>(path, { method: "PUT", ...prepareFetchPayload(body, options), ...options }),
   patch: <T>(path: string, body: unknown, options?: ServerFetchOptions) =>
      httpServer<T>(path, { method: "PATCH", ...prepareFetchPayload(body, options), ...options }),
   delete: <T>(path: string, options?: ServerFetchOptions) =>
      httpServer<T>(path, { method: "DELETE", ...options }),
};
