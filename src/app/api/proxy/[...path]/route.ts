import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const API_BASE =
   process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) throw new Error("API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) is not defined");

function buildBackendUrl(base: string, parts: string[], request: NextRequest) {
   const cleanBase = base.replace(/\/$/, "");
   const cleanPath = parts.join("/");
   const url = new URL(`${cleanBase}/${cleanPath}`);

   // Copia querystring intacto
   request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
   });

   return url.toString();
}

async function proxyRequest(
   request: NextRequest,
   params: Promise<{ path: string[] }>,
   method: string
) {
   const { path } = await params;

   const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

   const backendUrl = buildBackendUrl(API_BASE!, path, request);

   const headers: Record<string, string> = {
      // opcional: forward accept
      Accept: request.headers.get("accept") || "application/json",
   };

   if (token) headers["Authorization"] = `Bearer ${token}`;

   // Body solo para métodos con body
   let body: string | undefined;
   if (method !== "GET" && method !== "DELETE") {
      const contentType = request.headers.get("content-type") || "application/json";
      headers["Content-Type"] = contentType;

      try {
         body = await request.text();
      } catch {
         body = undefined;
      }
   }

   try {
      const backendResponse = await fetch(backendUrl, {
         method,
         headers,
         body,
         cache: "no-store",
      });

      // Soporta JSON y binarios
      const buffer = await backendResponse.arrayBuffer();

      const resHeaders = new Headers();
      const contentType = backendResponse.headers.get("content-type");
      if (contentType) resHeaders.set("Content-Type", contentType);

      const contentDisposition = backendResponse.headers.get("content-disposition");
      if (contentDisposition) resHeaders.set("Content-Disposition", contentDisposition);

      return new NextResponse(buffer, {
         status: backendResponse.status,
         headers: resHeaders,
      });
   } catch (error) {
      console.error(`[Proxy] ${method} ${backendUrl} failed:`, error);
      return NextResponse.json({ detail: "Error de conexión con el servidor" }, { status: 503 });
   }
}

export function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
   return proxyRequest(req, ctx.params, "GET");
}
export function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
   return proxyRequest(req, ctx.params, "POST");
}
export function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
   return proxyRequest(req, ctx.params, "PUT");
}
export function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
   return proxyRequest(req, ctx.params, "PATCH");
}
export function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
   return proxyRequest(req, ctx.params, "DELETE");
}
