export type Primitive = string | number | boolean | Date;

export interface BaseFetchOptions extends RequestInit {
   params?: Record<string, Primitive | null | undefined>;
   _retry?: boolean;
}

// Clase unificada para errores HTTP
export class HttpError extends Error {
   status?: number;
   data?: any;
   detail?: any;
   error_code?: string;
   field?: string;

   constructor(message: string, status?: number, data?: any) {
      super(message);
      this.name = "HttpError";
      this.status = status;
      this.data = data;
      this.detail = data?.detail;
      this.error_code = data?.error_code;
      this.field = data?.field;
   }
}

// 1. Lógica centralizada para armar URLs
export function buildQueryString(params?: Record<string, Primitive | null | undefined>): string {
   if (!params) return "";
   const sp = new URLSearchParams();
   for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      sp.set(k, v instanceof Date ? v.toISOString() : String(v));
   }
   const qs = sp.toString();
   return qs ? `?${qs}` : "";
}

// 2. Lógica centralizada para parsear respuestas de error (Pydantic/FastAPI)
export async function parseApiError(res: Response): Promise<HttpError> {
   let message = `HTTP ${res.status}`;
   let data: any = null;

   try {
      if (res.headers.get("content-type")?.includes("application/json")) {
         data = await res.json();

         // Soporte para nueva arquitectura estandarizada
         if (data?.error_code) {
            message = data.message || message;
         }
         // Soporte para errores de validación de Pydantic/FastAPI
         else if (Array.isArray(data?.detail)) {
            message = data.detail.map((e: any) => `${e.loc?.slice(-1) || 'Campo'}: ${e.msg}`).join(" | ");
         }
         // Fallback a mensajes simples
         else {
            message = data?.detail || data?.message || message;
         }
      } else {
         message = (await res.text()) || message;
      }
   } catch {
      // Silencioso, mantenemos el mensaje por defecto si el parseo falla
   }

   return new HttpError(message, res.status, data);
}

// 3. Lógica centralizada para formatear el Body y los Headers
export function prepareFetchPayload(body: unknown, options?: RequestInit): { body?: BodyInit, headers: HeadersInit } {
   if (!body) return { headers: options?.headers ?? {} };

   const isNative = typeof window !== "undefined"
      ? (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob)
      : (body instanceof FormData || body instanceof URLSearchParams);

   const parsedBody = (isNative || typeof body === "string")
      ? (body as BodyInit)
      : JSON.stringify(body);

   const headers: HeadersInit = {
      ...(!isNative ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers as Record<string, string> ?? {}),
   };

   return { body: parsedBody, headers };
}
