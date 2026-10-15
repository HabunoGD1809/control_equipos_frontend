import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/token-refresh";
import { deleteSession } from "@/lib/session";
import { safeReturnPath, requestOrigin } from "@/lib/request-security";

export async function GET(request: NextRequest) {
   const token = await refreshAccessToken();
   if (!token) {
      await deleteSession();
      return NextResponse.redirect(new URL("/login", requestOrigin(request)));
   }
   return NextResponse.redirect(new URL(safeReturnPath(request.nextUrl.searchParams.get("next")), requestOrigin(request)));
}
