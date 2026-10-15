import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { refreshAccessToken } from "@/lib/token-refresh";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
   let { accessToken } = await getSession();
   const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   if (!base) return new Response("Servidor no configurado", { status: 503 });
   const controller = new AbortController();
   const abort = () => controller.abort();
   request.signal.addEventListener("abort", abort, { once: true });
   const connect = async () => {
      const timer = setTimeout(abort, 10000);
      try { return await fetch(`${base.replace(/\/$/, "")}/notificaciones/stream`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "text/event-stream" }, cache: "no-store", signal: controller.signal }); }
      finally { clearTimeout(timer); }
   };
   try {
      if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined;
      if (!accessToken) { request.signal.removeEventListener("abort", abort); return new Response("Sesión requerida", { status: 401 }); }
      let upstream = await connect();
      if (upstream.status === 401) {
         await upstream.body?.cancel();
         accessToken = (await refreshAccessToken()) ?? undefined;
         if (accessToken) upstream = await connect();
      }
      if (!upstream.ok || !upstream.body) { controller.abort(); request.signal.removeEventListener("abort", abort); return new Response("Conexión no disponible", { status: upstream.status }); }
      const reader = upstream.body.getReader();
      const cleanup = () => { request.signal.removeEventListener("abort", abort); controller.abort(); };
      const stream = new ReadableStream<Uint8Array>({
         async pull(output) {
            try {
               const { done, value } = await reader.read();
               if (done) { cleanup(); output.close(); } else output.enqueue(value);
            } catch { cleanup(); output.close(); }
         },
         async cancel() { cleanup(); await reader.cancel().catch(() => undefined); },
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "X-Content-Type-Options": "nosniff" } });
   } catch { controller.abort(); request.signal.removeEventListener("abort", abort); return new Response("Conexión no disponible", { status: 503 }); }
}
