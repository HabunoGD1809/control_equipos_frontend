type Primitive = string | number | boolean;

export interface FetchOptions extends Omit<RequestInit, "headers" | "body" | "method"> {
   params?: Record<string, Primitive | null | undefined>;
   headers?: Record<string, string>;
   responseType?: "json" | "text" | "blob" | "arraybuffer";
   _retry?: boolean;
}

const PROXY_PREFIX = "/api/proxy";

// ─── GESTOR DE ESTADO PARA ROTACIÓN DE TOKENS (PREVENCIÓN DE RACE CONDITIONS) ───
let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
   refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
   refreshSubscribers.forEach((cb) => cb(success));
   refreshSubscribers = [];
}
// ────────────────────────────────────────────────────────────────────────────────

function buildQuery(params?: FetchOptions["params"]): string {
   if (!params) return "";
   const sp = new URLSearchParams();

   for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      sp.set(k, String(v));
   }

   const qs = sp.toString();
   return qs ? `?${qs}` : "";
}

async function getServerOrigin(): Promise<string> {
   const { headers } = await import("next/headers");
   const h = await headers();

   const proto = h.get("x-forwarded-proto") ?? "http";
   const host = h.get("x-forwarded-host") ?? h.get("host");

   return host ? `${proto}://${host}` : "http://localhost:3000";
}

function handleUnauthorizedClient() {
   if (typeof window !== "undefined") {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
   }
}

function prepareBodyAndHeaders(
   body: unknown,
   customHeaders?: Record<string, string>
): { body?: BodyInit; headers?: Record<string, string> } {
   if (body === undefined || body === null) {
      return { headers: customHeaders };
   }

   const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
   const isString = typeof body === "string";
   const isURLSearchParams = typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
   const isBlob = typeof Blob !== "undefined" && body instanceof Blob;

   if (isFormData || isString || isURLSearchParams || isBlob) {
      return {
         body: body as BodyInit,
         headers: customHeaders,
      };
   }

   return {
      body: JSON.stringify(body),
      headers: {
         "Content-Type": "application/json",
         ...(customHeaders ?? {}),
      },
   };
}

async function http<T>(path: string, options: FetchOptions & { method: string; body?: BodyInit }): Promise<T> {
   const { params, headers, responseType, _retry, ...rest } = options;

   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   const proxyPath = `${PROXY_PREFIX}${cleanPath}${buildQuery(params)}`;

   const isServer = typeof window === "undefined";
   const url = isServer
      ? new URL(proxyPath, await getServerOrigin()).toString()
      : proxyPath;

   let cookieHeader: string | null = null;
   if (isServer) {
      const { headers: nextHeaders } = await import("next/headers");
      cookieHeader = (await nextHeaders()).get("cookie");
   }

   const fetchOptions: RequestInit = {
      ...rest,
      headers: {
         ...(cookieHeader ? { cookie: cookieHeader } : {}),
         ...(headers ?? {}),
      },
      cache: rest.cache ?? "no-store",
   };

   let res = await fetch(url, fetchOptions);

   // Lógica de intercepción de expiración de token
   if (res.status === 401 && !_retry) {
      if (isRefreshing) {
         // Si ya hay un refresco en curso, encolamos esta petición
         return new Promise<T>((resolve, reject) => {
            subscribeTokenRefresh(async (success: boolean) => {
               if (success) {
                  try {
                     const retryRes = await http<T>(path, { ...options, _retry: true });
                     resolve(retryRes);
                  } catch (err) {
                     reject(err);
                  }
               } else {
                  handleUnauthorizedClient();
                  reject(new Error("No autorizado"));
               }
            });
         });
      }

      isRefreshing = true;
      try {
         const refreshUrl = isServer
            ? new URL("/api/auth/refresh", await getServerOrigin()).toString()
            : "/api/auth/refresh";

         const refreshRes = await fetch(refreshUrl, {
            method: "POST",
            headers: cookieHeader ? { cookie: cookieHeader } : {},
            cache: "no-store",
         });

         if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed(true);
            res = await fetch(url, fetchOptions); // Reintenta la petición original
         } else {
            isRefreshing = false;
            onRefreshed(false);
            handleUnauthorizedClient();
            throw new Error("Sesión expirada");
         }
      } catch (error) {
         isRefreshing = false;
         onRefreshed(false);
         handleUnauthorizedClient();
         throw error;
      }
   }

   // Manejo de errores estándar
   if (!res.ok) {
      if (res.status === 401) handleUnauthorizedClient();

      let message = `HTTP ${res.status}`;
      try {
         const ct = res.headers.get("content-type") || "";
         if (ct.includes("application/json")) {
            const body = await res.json();
            message = body?.detail || body?.message || message;
         } else {
            const text = await res.text();
            message = text || message;
         }
      } catch {
         // Silencia errores de parseo si el backend no devuelve un body coherente
      }

      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
   }

   // Respuestas exitosas sin contenido
   if (res.status === 204) return null as T;

   // Manejo de flujos binarios para descargas (Reportes, Documentos)
   if (responseType === "blob") {
      return (await res.blob()) as unknown as T;
   }
   if (responseType === "arraybuffer") {
      return (await res.arrayBuffer()) as unknown as T;
   }
   if (responseType === "text") {
      return (await res.text()) as unknown as T;
   }

   // Por defecto asume JSON, pero previene errores si el header no cuadra
   const ct = res.headers.get("content-type") || "";
   if (!ct.includes("application/json")) {
      return (await res.text()) as unknown as T;
   }

   return (await res.json()) as T;
}

function createMethod(method: "POST" | "PUT" | "PATCH") {
   return <T>(path: string, body?: unknown, options?: FetchOptions) => {
      const prepared = prepareBodyAndHeaders(body, options?.headers);

      return http<T>(path, {
         method,
         ...options,
         body: prepared.body,
         headers: prepared.headers,
      });
   };
}

export const api = {
   get: <T>(path: string, options?: FetchOptions) =>
      http<T>(path, { method: "GET", ...options }),

   delete: <T>(path: string, options?: FetchOptions) =>
      http<T>(path, { method: "DELETE", ...options }),

   post: createMethod("POST"),
   put: createMethod("PUT"),
   patch: createMethod("PATCH"),
};
