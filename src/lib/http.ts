type Primitive = string | number | boolean;

interface FetchOptions extends Omit<RequestInit, "headers"> {
   params?: Record<string, Primitive | null | undefined>;
   headers?: Record<string, string>;
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
   // Import dinámico: evita que el bundle de client intente incluir next/headers
   const { headers } = await import("next/headers");
   const h = await headers();

   const proto = h.get("x-forwarded-proto") ?? "http";
   const host = h.get("x-forwarded-host") ?? h.get("host");

   if (!host) {
      // fallback seguro: si no hay host, al menos no crashear con "Invalid URL"
      return "http://localhost:3000";
   }
   return `${proto}://${host}`;
}

async function http<T>(path: string, options: FetchOptions = {}): Promise<T> {
   const { params, headers, ...rest } = options;

   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   const qs = buildQuery(params);
   const proxyPath = `${PROXY_PREFIX}${cleanPath}${qs}`;

   const isServer = typeof window === "undefined";

   // URL absoluta en server, relativa en client
   const url = isServer
      ? new URL(proxyPath, await getServerOrigin()).toString()
      : proxyPath;

   // ✅ Forward cookies when running on the server (SSR / Server Components)
   // Without this, /api/proxy won't receive the user's auth cookies and will 401.
   let cookieHeader: string | null = null;
   if (isServer) {
      const { headers: nextHeaders } = await import("next/headers");
      const h = await nextHeaders();
      cookieHeader = h.get("cookie");
   }

   const res = await fetch(url, {
      ...rest,
      headers: {
         "Content-Type": "application/json",
         ...(cookieHeader ? { cookie: cookieHeader } : {}),
         ...(headers ?? {}),
      },
      cache: rest.cache ?? "no-store",
   });

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
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
   }

   if (res.status === 204) return null as T;

   const ct = res.headers.get("content-type") || "";
   if (!ct.includes("application/json")) {
      // si algún endpoint devuelve texto
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
