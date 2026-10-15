import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import type { Token } from "@/types/api";
import { isSameOrigin } from "@/lib/request-security";
import { boundedBody, BodyTooLargeError } from "@/lib/request-body";

export async function POST(req: NextRequest) {
   if (!isSameOrigin(req)) return NextResponse.json({ detail: "Origen no permitido." }, { status: 403 });
   try {
      const content = await boundedBody(req, 8192);
      let credentials;
      try { credentials = JSON.parse(new TextDecoder().decode(content)); }
      catch { return NextResponse.json({ detail: "Solicitud inválida." }, { status: 400 }); }
      const { username, password } = credentials ?? {};
      if (typeof username !== "string" || typeof password !== "string" || !username.trim() || username.length > 100 || !password || password.length > 1024) return NextResponse.json({ detail: "Usuario o contraseña inválidos." }, { status: 422 });

      const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) throw new Error("API base URL no configurada.");

      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const apiResponse = await fetch(`${baseUrl}/auth/login/access-token`, {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: formData.toString(),
         cache: "no-store",
         signal: AbortSignal.timeout(10000),
      });

      if (!apiResponse.ok) {
         const errorData = await apiResponse.json().catch(() => ({}));
         return NextResponse.json(
            { detail: errorData.detail || "Error en la autenticación" },
            { status: apiResponse.status }
         );
      }

      const { access_token, refresh_token } = await apiResponse.json() as Token;

      await createSession(access_token, refresh_token);

      return NextResponse.json({ success: true });
   } catch (error: any) {
      if (error instanceof BodyTooLargeError) return NextResponse.json({ detail: "Solicitud demasiado grande." }, { status: 413 });
      return NextResponse.json({ detail: "No se pudo conectar con el servidor de autenticación." }, { status: 503 });
   }
}
