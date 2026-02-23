import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/token-refresh";

export async function POST() {
   try {
      const newToken = await refreshAccessToken();

      if (!newToken) {
         return NextResponse.json(
            { detail: "Refresh token inválido o expirado" },
            { status: 401 }
         );
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error al refrescar el token:", error);
      return NextResponse.json(
         { detail: "Internal Server Error" },
         { status: 500 }
      );
   }
}
