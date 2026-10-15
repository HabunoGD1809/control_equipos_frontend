import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { isSameOrigin } from "@/lib/request-security";
import { boundedBody, BodyTooLargeError } from "@/lib/request-body";

type RouteContext = { params: Promise<{ path: string[] }> };
async function proxyRequest(request: NextRequest, ctx: RouteContext, method: string) {
   if (method !== "GET" && !isSameOrigin(request)) return NextResponse.json({ detail: "Origen no permitido." }, { status: 403 });
   const { path } = await ctx.params;
   if (path.some(segment => !segment || segment === "." || segment === ".." || /[\\/\u0000]/.test(segment))) return NextResponse.json({ detail: "Ruta inválida." }, { status: 400 });
   const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   if (!base) return NextResponse.json({ detail: "Servidor no configurado." }, { status: 503 });
   const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
   const publicRequest = method === "GET" && (path.join("/") === "empresa/publica" || path.join("/") === "empresa/publica/logo");
   if (!token && !publicRequest) return NextResponse.json({ detail: "Sesión requerida." }, { status: 401 });
   const target = new URL(`${base.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.pathname.endsWith("/") ? "/" : ""}`);
   target.search = request.nextUrl.search;
   const headers = new Headers({ Accept: request.headers.get("accept") || "application/json" });
   if (token) headers.set("Authorization", `Bearer ${token}`);
   const contentType = request.headers.get("content-type");
   if (contentType) headers.set("Content-Type", contentType);
   try {
      const body = method === "GET" ? undefined : await boundedBody(request);
      const upstream = await fetch(target, { method, headers, body: body?.buffer as ArrayBuffer | undefined, cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(120000)]) });
      const responseHeaders = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      for (const header of ["content-type", "content-disposition"]) {
         const value = upstream.headers.get(header);
         if (value) responseHeaders.set(header, value);
      }
      return new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: responseHeaders });
   } catch (error) {
      if (error instanceof BodyTooLargeError) return NextResponse.json({ detail: "Archivo demasiado grande." }, { status: 413 });
      return NextResponse.json({ detail: "Error de conexión con el servidor." }, { status: 503 });
   }
}
export const GET = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx, "GET");
export const POST = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx, "POST");
export const PUT = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx, "PUT");
export const PATCH = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx, "PATCH");
export const DELETE = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx, "DELETE");
