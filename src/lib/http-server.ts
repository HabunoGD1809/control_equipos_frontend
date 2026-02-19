import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const BASE_URL: string = (() => {
   const v = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   if (!v) throw new Error("API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) is not defined");
   return v;
})();

type Primitive = string | number | boolean;

interface FetchOptions extends RequestInit {
   params?: Record<string, Primitive | undefined | null>;
}

type HttpError = Error & { status?: number };

async function httpServer<T>(path: string, options: FetchOptions = {}): Promise<T> {
   const { params, headers, ...rest } = options;

   const cleanBase = BASE_URL.replace(/\/$/, "");
   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   const url = new URL(`${cleanBase}${cleanPath}`);

   if (params) {
      for (const [key, value] of Object.entries(params)) {
         if (value === undefined || value === null) continue;
         url.searchParams.set(key, String(value));
      }
   }

   const cookieStore = await cookies();
   const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

   const defaultHeaders: HeadersInit = {
      Accept: "application/json",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((headers as Record<string, string>) || {}),
   };

   const response = await fetch(url.toString(), {
      headers: defaultHeaders,
      ...rest,
      cache: rest.cache ?? "no-store",
   });

   if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
         const ct = response.headers.get("content-type") || "";
         if (ct.includes("application/json")) {
            const body = await response.json();
            message = body?.detail || body?.message || message;
         } else {
            const text = await response.text();
            message = text || message;
         }
      } catch { }

      const err = new Error(message) as HttpError;
      err.status = response.status;
      throw err;
   }

   if (response.status === 204) return null as T;

   const ct = response.headers.get("content-type") || "";
   if (!ct.includes("application/json")) {
      return (await response.text()) as unknown as T;
   }

   return (await response.json()) as T;
}

export const serverApi = {
   get: <T>(path: string, options?: FetchOptions) =>
      httpServer<T>(path, { method: "GET", ...options }),

   post: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "POST", body: JSON.stringify(body), ...options }),

   put: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "PUT", body: JSON.stringify(body), ...options }),

   patch: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "PATCH", body: JSON.stringify(body), ...options }),

   delete: <T>(path: string, options?: FetchOptions) =>
      httpServer<T>(path, { method: "DELETE", ...options }),
};
