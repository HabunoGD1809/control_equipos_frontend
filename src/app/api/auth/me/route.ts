import { NextResponse } from "next/server";
import { serverApi } from "@/lib/http-server";
import type { Usuario } from "@/types/api";

export async function GET() {
   try {
      return NextResponse.json(await serverApi.get<Usuario>("/usuarios/me", { skipAuthRedirect: true }), { headers: { "Cache-Control": "no-store" } });
   } catch {
      return NextResponse.json({ detail: "Sesión no disponible" }, { status: 401 });
   }
}
