import { BaseFetchOptions, buildQueryString, parseApiError, prepareFetchPayload } from "./http-utils";

export interface FetchOptions extends Omit<BaseFetchOptions, "headers" | "body" | "method"> {
   headers?: Record<string, string>;
   responseType?: "json" | "text" | "blob" | "arraybuffer";
}

const PROXY_PREFIX = "/api/proxy";

// ─── GESTOR DE ROTACIÓN DE TOKENS ───
let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function onRefreshed(success: boolean) {
   refreshSubscribers.forEach((cb) => cb(success));
   refreshSubscribers = [];
}

function handleUnauthorizedClient() {
   if (typeof window !== "undefined") {
      window.location.href = "/login";
   }
}

async function http<T>(path: string, options: FetchOptions & { method: string; body?: BodyInit }): Promise<T> {
   const { params, headers, responseType, _retry, ...rest } = options;

   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   const proxyPath = `${PROXY_PREFIX}${cleanPath}${buildQueryString(params)}`;

   const fetchOptions: RequestInit = {
      ...rest,
      headers: { ...(headers ?? {}) },
      cache: rest.cache ?? "no-store",
   };

   let res = await fetch(proxyPath, fetchOptions);

   if (res.status === 401 && !_retry) {
      if (isRefreshing) {
         return new Promise<T>((resolve, reject) => {
            refreshSubscribers.push(async (success: boolean) => {
               if (success) {
                  try { resolve(await http<T>(path, { ...options, _retry: true })); }
                  catch (err) { reject(err); }
               } else {
                  reject(new Error("No autorizado"));
               }
            });
         });
      }

      isRefreshing = true;
      try {
         const refreshRes = await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
         if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed(true);
            res = await fetch(proxyPath, fetchOptions);
         } else {
            throw new Error("Sesión expirada");
         }
      } catch (error) {
         isRefreshing = false;
         onRefreshed(false);
         handleUnauthorizedClient();
         throw error;
      }
   }

   if (!res.ok) {
      if (res.status === 401) handleUnauthorizedClient();
      throw await parseApiError(res);
   }

   if (res.status === 204) return null as T;
   if (responseType === "blob") return (await res.blob()) as unknown as T;
   if (responseType === "arraybuffer") return (await res.arrayBuffer()) as unknown as T;
   if (responseType === "text" || !res.headers.get("content-type")?.includes("application/json")) {
      return (await res.text()) as unknown as T;
   }

   return (await res.json()) as T;
}

function createMethod(method: "POST" | "PUT" | "PATCH") {
   return <T>(path: string, body?: unknown, options?: FetchOptions) => {
      const { body: parsedBody, headers } = prepareFetchPayload(body, options);
      return http<T>(path, { method, ...options, body: parsedBody, headers: headers as Record<string, string> });
   };
}

export const api = {
   get: <T>(path: string, options?: FetchOptions) => http<T>(path, { method: "GET", ...options }),
   delete: <T>(path: string, options?: FetchOptions) => http<T>(path, { method: "DELETE", ...options }),
   post: createMethod("POST"),
   put: createMethod("PUT"),
   patch: createMethod("PATCH"),
};
