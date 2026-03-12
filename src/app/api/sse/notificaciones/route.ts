import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import * as http from "http";
import * as https from "https";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
   const { accessToken } = await getSession();

   if (!accessToken) {
      return new Response("No autenticado", { status: 401 });
   }

   const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
   if (!apiBase) {
      return new Response("API_BASE_URL no configurada", { status: 500 });
   }

   const sseUrl = `${apiBase.replace(/\/$/, "")}/notificaciones/stream`;

   // Usamos http/https nativo de Node — sin timeout por defecto, ideal para SSE
   return new Promise<Response>((resolve) => {
      const parsedUrl = new URL(sseUrl);
      const transport = parsedUrl.protocol === "https:" ? https : http;

      const req = transport.request(
         {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: "GET",
            headers: {
               Authorization: `Bearer ${accessToken}`,
               Accept: "text/event-stream",
               "Cache-Control": "no-cache",
               Connection: "keep-alive",
            },
            // Sin timeout — necesario para streams SSE indefinidos
            timeout: 0,
         },
         (backendRes) => {
            if (backendRes.statusCode !== 200) {
               resolve(new Response("Backend SSE no disponible", { status: backendRes.statusCode ?? 502 }));
               return;
            }

            // Convertir el stream de Node a un ReadableStream web
            const readable = new ReadableStream({
               start(controller) {
                  let closed = false;

                  const close = () => {
                     if (!closed) {
                        closed = true;
                        try { controller.close(); } catch { }
                     }
                  };

                  backendRes.on("data", (chunk: Buffer) => {
                     if (!closed) controller.enqueue(chunk);
                  });
                  backendRes.on("end", close);
                  backendRes.on("error", close);

                  request.signal.addEventListener("abort", () => {
                     req.destroy();
                     close();
                  });
               },
            });

            resolve(
               new Response(readable, {
                  headers: {
                     "Content-Type": "text/event-stream",
                     "Cache-Control": "no-cache",
                     Connection: "keep-alive",
                     "X-Accel-Buffering": "no",
                  },
               })
            );
         }
      );

      req.on("error", (err) => {
         console.error("[SSE Proxy] Error conectando al backend:", err);
         resolve(new Response("Error conectando al backend SSE", { status: 502 }));
      });

      req.end();
   });
}
