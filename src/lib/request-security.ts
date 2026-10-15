export function requestOrigin(request: Request): string {
   // Next normalizes loopback addresses in Request.url. Host preserves the
   // browser's actual origin, including its port, and reverse proxies preserve it.
   const url = new URL(request.url);
   const host = request.headers.get("host") || url.host;
   const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.slice(0, -1);
   if (!["http", "https"].includes(protocol)) return url.origin;
   try { return new URL(`${protocol}://${host}`).origin; }
   catch { return url.origin; }
}

export function isSameOrigin(request: Request): boolean {
   const origin = request.headers.get("origin");
   const fetchSite = request.headers.get("sec-fetch-site");
   if (fetchSite === "cross-site") return false;
   return !origin || origin === requestOrigin(request);
}

export function safeReturnPath(value: string | null, fallback = "/dashboard"): string {
   return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}
