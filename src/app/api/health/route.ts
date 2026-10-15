export const dynamic = "force-dynamic";

export async function GET() {
   try {
      const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBase) throw new Error("Backend configuration unavailable");
      const response = await fetch(new URL("/health", apiBase), { cache: "no-store", signal: AbortSignal.timeout(5000) });
      const data = await response.json();
      if (!response.ok || data.status !== "ok") throw new Error("Backend unavailable");
      const testDatabase = typeof data.test_database === "string" && /^[a-z0-9_]{1,63}$/.test(data.test_database) && data.test_database.includes("_test") ? data.test_database : undefined;
      return Response.json({ status: "ok", backend: "ok", ...(testDatabase ? { test_database: testDatabase } : {}) }, { headers: { "Cache-Control": "no-store" } });
   } catch {
      return Response.json({ status: "unavailable", backend: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
   }
}
