import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import type { Token } from "@/types/api";

export async function POST(req: NextRequest) {
   try {
      const { username, password } = await req.json();

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
      console.error("[API_LOGIN] Error proxy:", error);
      return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 });
   }
}
