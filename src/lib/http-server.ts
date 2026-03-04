import "server-only";
import { redirect } from "next/navigation";
import { refreshAccessToken } from "@/lib/token-refresh";
import { getSession, deleteSession } from "@/lib/session";

const BASE_URL: string = (() => {
   const v = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   if (!v) throw new Error("API_BASE_URL no está definida");
   return v.replace(/\/$/, "");
})();

type Primitive = string | number | boolean | Date;

interface FetchOptions extends RequestInit {
   params?: Record<string, Primitive | undefined | null>;
   _retry?: boolean;
}

type HttpError = Error & { status?: number; detail?: any };

async function httpServer<T>(
   path: string,
   options: FetchOptions = {},
): Promise<T> {
   const { params, headers, _retry, ...rest } = options;

   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   const url = new URL(`${BASE_URL}${cleanPath}`);

   if (params) {
      for (const [key, value] of Object.entries(params)) {
         if (value === undefined || value === null) continue;
         url.searchParams.set(
            key,
            value instanceof Date ? value.toISOString() : String(value),
         );
      }
   }

   const { accessToken } = await getSession();

   const defaultHeaders: HeadersInit = {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...((headers as Record<string, string>) || {}),
   };

   const response = await fetch(url.toString(), {
      headers: defaultHeaders,
      ...rest,
      cache: rest.cache ?? "no-store",
   });

   if (response.status === 401 && !_retry) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken)
         return httpServer<T>(path, { ...options, _retry: true });

      await deleteSession();
      redirect("/login");
   }

   if (!response.ok) {
      if (response.status === 401) {
         await deleteSession();
         redirect("/login");
      }

      let message = `HTTP ${response.status}`;
      let detail = null;

      try {
         if (response.headers.get("content-type")?.includes("application/json")) {
            const body = await response.json();
            detail = body?.detail || body?.message;
            message = Array.isArray(detail)
               ? detail.map((e: any) => e.msg).join(" | ")
               : detail || message;
         } else {
            message = (await response.text()) || message;
         }
      } catch {
         /* Silenciado */
      }

      const err = new Error(message) as HttpError;
      err.status = response.status;
      err.detail = detail;
      throw err;
   }

   if (response.status === 204) return null as T;
   if (!response.headers.get("content-type")?.includes("application/json"))
      return (await response.text()) as unknown as T;

   return (await response.json()) as T;
}

const formatPayload = (body: unknown, options?: FetchOptions): FetchOptions => {
   if (!body) return options || {};
   const isNative = body instanceof FormData || body instanceof URLSearchParams;
   const parsedBody =
      isNative || typeof body === "string"
         ? (body as BodyInit)
         : JSON.stringify(body);

   const headers = {
      ...(!isNative ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers ?? {}),
   };

   return { ...options, body: parsedBody, headers };
};

export const serverApi = {
   get: <T>(path: string, options?: FetchOptions) =>
      httpServer<T>(path, { method: "GET", ...options }),
   post: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "POST", ...formatPayload(body, options) }),
   put: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "PUT", ...formatPayload(body, options) }),
   patch: <T>(path: string, body: unknown, options?: FetchOptions) =>
      httpServer<T>(path, { method: "PATCH", ...formatPayload(body, options) }),
   delete: <T>(path: string, options?: FetchOptions) =>
      httpServer<T>(path, { method: "DELETE", ...options }),
};
