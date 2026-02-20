type Primitive = string | number | boolean;

interface FetchOptions extends Omit<RequestInit, "headers"> {
   params?: Record<string, Primitive | null | undefined>;
   headers?: Record<string, string>;
   _retry?: boolean;
}

const PROXY_PREFIX = "/api/proxy";

function buildQuery(params?: FetchOptions["params"]) {
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

   if (!host) {
      return "http://localhost:3000";
   }
   return `${proto}://${host}`;
}

async function http<T>(path: string, options: FetchOptions = {}): Promise<T> {
   const { params, headers, _retry, ...rest } = options;

   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   const qs = buildQuery(params);
   const proxyPath = `${PROXY_PREFIX}${cleanPath}${qs}`;

   const isServer = typeof window === "undefined";

   const url = isServer
      ? new URL(proxyPath, await getServerOrigin()).toString()
      : proxyPath;

   let cookieHeader: string | null = null;
   if (isServer) {
      const { headers: nextHeaders } = await import("next/headers");
      const h = await nextHeaders();
      cookieHeader = h.get("cookie");
   }

   const fetchOptions: RequestInit = {
      ...rest,
      headers: {
         "Content-Type": "application/json",
         ...(cookieHeader ? { cookie: cookieHeader } : {}),
         ...(headers ?? {}),
      },
      cache: rest.cache ?? "no-store",
   };

   let res = await fetch(url, fetchOptions);

   // 🚨 INTERCEPTOR DE REFESH TOKEN 🚨
   if (res.status === 401 && !_retry) {
      // 1. Evitamos bucles infinitos marcando el intento
      options._retry = true;

      try {
         // 2. Intentamos refrescar el token a través de un endpoint local o del action
         // Como tu proxy intercepta todo, usaremos un endpoint dedicado en tu Next API 
         // para que él maneje las cookies de forma segura.
         const refreshUrl = isServer
            ? new URL("/api/auth/refresh", await getServerOrigin()).toString()
            : "/api/auth/refresh";

         const refreshRes = await fetch(refreshUrl, {
            method: "POST",
            headers: cookieHeader ? { cookie: cookieHeader } : {},
         });

         if (refreshRes.ok) {
            // 3. El token se refrescó exitosamente (las nuevas cookies se setearon).
            // Reintentamos la petición original.

            // Si estamos en el server, debemos actualizar el cookieHeader 
            // con las nuevas cookies recibidas (si fuera necesario, aunque next/headers 
            // no expone un setter directo en medio de un fetch, por lo general en el 
            // cliente es automático).
            res = await fetch(url, fetchOptions);
         } else {
            // El refresh token expiró o es inválido. Redirigimos al login.
            if (!isServer && typeof window !== "undefined") {
               window.location.href = "/login";
            }
         }
      } catch (refreshError) {
         if (!isServer && typeof window !== "undefined") {
            window.location.href = "/login";
         }
      }
   }

   if (!res.ok) {
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
         // ignore parsing errors
      }

      // Si a pesar del intento de refresh sigue dando 401, expulsamos al usuario
      if (res.status === 401 && !isServer && typeof window !== "undefined") {
         window.location.href = "/login";
      }

      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
   }

   if (res.status === 204) return null as T;

   const ct = res.headers.get("content-type") || "";
   if (!ct.includes("application/json")) {
      return (await res.text()) as unknown as T;
   }

   return (await res.json()) as T;
}

export const api = {
   get: <T>(path: string, options?: FetchOptions) =>
      http<T>(path, { method: "GET", ...options }),

   post: <T>(path: string, body: unknown, options?: FetchOptions) =>
      http<T>(path, {
         method: "POST",
         body:
            body instanceof FormData || typeof body === "string"
               ? (body as any)
               : JSON.stringify(body),
         ...options,
         headers: {
            ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(options?.headers ?? {}),
         },
      }),

   put: <T>(path: string, body: unknown, options?: FetchOptions) =>
      http<T>(path, {
         method: "PUT",
         body:
            body instanceof FormData || typeof body === "string"
               ? (body as any)
               : JSON.stringify(body),
         ...options,
         headers: {
            ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(options?.headers ?? {}),
         },
      }),

   patch: <T>(path: string, body: unknown, options?: FetchOptions) =>
      http<T>(path, {
         method: "PATCH",
         body:
            body instanceof FormData || typeof body === "string"
               ? (body as any)
               : JSON.stringify(body),
         ...options,
         headers: {
            ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(options?.headers ?? {}),
         },
      }),

   delete: <T>(path: string, options?: FetchOptions) =>
      http<T>(path, { method: "DELETE", ...options }),
};
