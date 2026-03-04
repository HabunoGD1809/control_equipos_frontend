type Primitive = string | number | boolean | Date;

export interface FetchOptions extends Omit<RequestInit, "headers" | "body" | "method"> {
   params?: Record<string, Primitive | null | undefined>;
   headers?: Record<string, string>;
   responseType?: "json" | "text" | "blob" | "arraybuffer";
   _retry?: boolean;
}

const PROXY_PREFIX = "/api/proxy";

// ─── GESTOR DE ROTACIÓN DE TOKENS (PREVENCIÓN DE RACE CONDITIONS) ───
let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function onRefreshed(success: boolean) {
   refreshSubscribers.forEach((cb) => cb(success));
   refreshSubscribers = [];
}

function handleUnauthorizedClient() {
   if (typeof window !== "undefined") {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
   }
}

function buildQuery(params?: FetchOptions["params"]): string {
   if (!params) return "";
   const sp = new URLSearchParams();
   for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      sp.set(k, v instanceof Date ? v.toISOString() : String(v));
   }
   const qs = sp.toString();
   return qs ? `?${qs}` : "";
}

async function http<T>(path: string, options: FetchOptions & { method: string; body?: BodyInit }): Promise<T> {
   const { params, headers, responseType, _retry, ...rest } = options;

   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   const proxyPath = `${PROXY_PREFIX}${cleanPath}${buildQuery(params)}`;

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
                  try {
                     resolve(await http<T>(path, { ...options, _retry: true }));
                  } catch (err) {
                     reject(err);
                  }
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

      let message = `HTTP ${res.status}`;
      try {
         if (res.headers.get("content-type")?.includes("application/json")) {
            const body = await res.json();
            message = Array.isArray(body?.detail) ? body.detail.map((e: any) => e.msg).join(" | ") : (body?.detail || body?.message || message);
         } else {
            message = await res.text() || message;
         }
      } catch { /* silencioso */ }

      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
   }

   if (res.status === 204) return null as T;
   if (responseType === "blob") return (await res.blob()) as unknown as T;
   if (responseType === "arraybuffer") return (await res.arrayBuffer()) as unknown as T;
   if (responseType === "text" || !res.headers.get("content-type")?.includes("application/json")) {
      return (await res.text()) as unknown as T;
   }

   return (await res.json()) as T;
}

function preparePayload(body: unknown, options?: FetchOptions) {
   if (!body) return { headers: options?.headers };
   const isNative = typeof window !== "undefined" && (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob);
   return isNative || typeof body === "string"
      ? { body: body as BodyInit, headers: options?.headers }
      : { body: JSON.stringify(body), headers: { "Content-Type": "application/json", ...options?.headers } };
}

function createMethod(method: "POST" | "PUT" | "PATCH") {
   return <T>(path: string, body?: unknown, options?: FetchOptions) => {
      const { body: parsedBody, headers } = preparePayload(body, options);
      return http<T>(path, { method, ...options, body: parsedBody, headers });
   };
}

export const api = {
   get: <T>(path: string, options?: FetchOptions) => http<T>(path, { method: "GET", ...options }),
   delete: <T>(path: string, options?: FetchOptions) => http<T>(path, { method: "DELETE", ...options }),
   post: createMethod("POST"),
   put: createMethod("PUT"),
   patch: createMethod("PATCH"),
};
