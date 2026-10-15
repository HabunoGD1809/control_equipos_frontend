import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";
import { requestOrigin } from "@/lib/request-security";

function expiresSoon(token?: string): boolean {
   if (!token) return true;
   try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      return typeof payload.exp !== "number" || payload.exp * 1000 < Date.now() + 30000;
   } catch { return true; }
}

export function proxy(request: NextRequest) {
   const { pathname, search } = request.nextUrl;
   if (pathname.startsWith("/_next") || pathname.startsWith("/api/") || pathname.startsWith("/static/") || pathname.includes(".")) return NextResponse.next();
   const access = request.cookies.get(AUTH_COOKIE_NAME)?.value;
   const refresh = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
   const authRoute = ["/login", "/forgot-password", "/reset-password"].some(route => pathname === route);
   if (expiresSoon(access) && refresh) {
      const renew = new URL("/api/auth/renew", requestOrigin(request));
      renew.searchParams.set("next", authRoute ? "/dashboard" : pathname + search);
      return NextResponse.redirect(renew);
   }
   if (authRoute && access && !expiresSoon(access)) return NextResponse.redirect(new URL("/dashboard", requestOrigin(request)));
   if (!authRoute && (!access || expiresSoon(access))) return NextResponse.redirect(new URL("/api/auth/logout?callbackUrl=/login", requestOrigin(request)));
   const headers = new Headers(request.headers);
   headers.set("x-auth-return-to", pathname + search);
   return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
