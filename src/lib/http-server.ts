import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";
import { refreshAccessToken } from "@/lib/token-refresh";

const BASE_URL: string = (() => {
   const v = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   if (!v) {
      throw new Error("API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) is not defined");
   }
   return v;
})();

type Primitive = string | number | boolean;

interface FetchOptions extends RequestInit {
   params?: Record<string, Primitive | undefined | null>;
   _retry?: boolean;
}

type HttpError = Error & { status?: number; detail?: any };

async function httpServer<T>(path: string, options: FetchOptions = {}): Promise<T> {
   const { params, headers, _retry, ...rest } = options;

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
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((headers as Record<string, string>) || {}),
   };

   const response = await fetch(url.toString(), {
      headers: defaultHeaders,
      ...rest,
      cache: rest.cache ?? "no-store",
   });

   // 401 → intenta refresh 1 vez
   if (response.status === 401 && !_retry) {
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
         // Reintenta una vez con el token actualizado en cookie
         return httpServer<T>(path, { ...options, _retry: true });
      }

      // Refresh falló → limpiar cookies para evitar loop con tokens viejos
      cookieStore.delete(AUTH_COOKIE_NAME);
      cookieStore.delete(REFRESH_COOKIE_NAME);

      redirect("/login");
   }

   if (!response.ok) {
      if (response.status === 401) {
         // Si llega aquí con 401 (ej. _retry ya true), igual limpia y manda a login
         cookieStore.delete(AUTH_COOKIE_NAME);
         cookieStore.delete(REFRESH_COOKIE_NAME);
         redirect("/login");
      }

      let message = `HTTP ${response.status}`;
      let detail = null;

      try {
         const ct = response.headers.get("content-type") || "";
         if (ct.includes("application/json")) {
            const body = await response.json();
            detail = body?.detail || body?.message;
            message = detail || message;
         } else {
            const text = await response.text();
            message = text || message;
         }
      } catch {
         // ignore parse errors
      }

      const err = new Error(message) as HttpError;
      err.status = response.status;
      err.detail = detail;
      throw err;
   }

   if (response.status === 204) return null as T;

   const ct = response.headers.get("content-type") || "";
   if (!ct.includes("application/json")) {
      return (await response.text()) as unknown as T;
   }

   return (await response.json()) as T;
}

const formatPayload = (body: unknown, options?: FetchOptions): FetchOptions => {
   const isFormData = body instanceof FormData;
   const isUrlEncoded = body instanceof URLSearchParams;
   const isString = typeof body === "string";

   const parsedBody = isFormData || isUrlEncoded || isString ? (body as BodyInit) : JSON.stringify(body);

   let defaultContentType: string | undefined = "application/json";
   if (isFormData) defaultContentType = undefined;
   if (isUrlEncoded) defaultContentType = "application/x-www-form-urlencoded";

   const headers = {
      ...(defaultContentType ? { "Content-Type": defaultContentType } : {}),
      ...(options?.headers ?? {}),
   };

   return { ...options, body: parsedBody, headers };
};

export const serverApi = {
   get: <T>(path: string, options?: FetchOptions) => httpServer<T>(path, { method: "GET", ...options }),
   post: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "POST", ...formatPayload(body, options) }),
   put: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "PUT", ...formatPayload(body, options) }),
   patch: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "PATCH", ...formatPayload(body, options) }),
   delete: <T>(path: string, options?: FetchOptions) => httpServer<T>(path, { method: "DELETE", ...options }),
};
