import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const API_BASE =
   process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
   throw new Error("API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) is not defined");
}

function buildBackendUrl(base: string, request: NextRequest): string {
   const cleanBase = base.replace(/\/$/, "");
   const targetPath = request.nextUrl.pathname.replace(/^\/api\/proxy/, "");
   const url = new URL(`${cleanBase}${targetPath}`);

   request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
   });

   return url.toString();
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyRequest(
   request: NextRequest,
   ctx: RouteContext,
   method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
) {
   const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
   const backendUrl = buildBackendUrl(API_BASE!, request);

   const headers = new Headers();

   const accept = request.headers.get("accept");
   if (accept) headers.set("Accept", accept);

   if (token) {
      headers.set("Authorization", `Bearer ${token}`);
   }

   let body: BodyInit | undefined = undefined;

   if (method !== "GET" && method !== "DELETE") {
      const contentType = request.headers.get("content-type");

      if (request.body) {
         body = request.body;

         if (contentType) {
            headers.set("Content-Type", contentType);
         }
      }
   }

   try {
      const backendResponse = await fetch(backendUrl, {
         method,
         headers,
         body,
         // ✅ Requerido cuando body es un ReadableStream: deshabilita duplex restriction
         // @ts-expect-error — duplex es requerido por la spec pero aún no está en los tipos de TS
         duplex: "half",
         cache: "no-store",
      });

      const buffer = await backendResponse.arrayBuffer();
      const resHeaders = new Headers();

      const contentType = backendResponse.headers.get("content-type");
      if (contentType) resHeaders.set("Content-Type", contentType);

      const contentDisposition = backendResponse.headers.get("content-disposition");
      if (contentDisposition) resHeaders.set("Content-Disposition", contentDisposition);

      const cacheControl = backendResponse.headers.get("cache-control");
      if (cacheControl) resHeaders.set("Cache-Control", cacheControl);

      return new NextResponse(buffer, {
         status: backendResponse.status,
         headers: resHeaders,
      });
   } catch (error) {
      console.error(`[Proxy] ${method} ${backendUrl} failed:`, error);
      return NextResponse.json(
         { detail: "Error de conexión con el servidor interno." },
         { status: 503 },
      );
   }
}

export function GET(req: NextRequest, ctx: RouteContext) {
   return proxyRequest(req, ctx, "GET");
}
export function POST(req: NextRequest, ctx: RouteContext) {
   return proxyRequest(req, ctx, "POST");
}
export function PUT(req: NextRequest, ctx: RouteContext) {
   return proxyRequest(req, ctx, "PUT");
}
export function PATCH(req: NextRequest, ctx: RouteContext) {
   return proxyRequest(req, ctx, "PATCH");
}
export function DELETE(req: NextRequest, ctx: RouteContext) {
   return proxyRequest(req, ctx, "DELETE");
}
