import type { ReporteParams } from "@/types/api";

const PROXY_PREFIX = "/api/proxy";

function buildFileName(params: ReporteParams) {
   const ext = params.formato === "excel" ? "xlsx" : "pdf";
   return `reporte_${params.tipo_reporte}_${Date.now()}.${ext}`;
}

function parseContentDispositionFilename(cd: string | null): string | null {
   if (!cd) return null;

   // filename="..."
   const m1 = cd.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i);
   if (!m1?.[1]) return null;

   try {
      return decodeURIComponent(m1[1]);
   } catch {
      return m1[1];
   }
}

export const reportesService = {
   /**
    * Genera un reporte y fuerza descarga del archivo (PDF/Excel).
    * Usa fetch directo porque necesitamos blob().
    */
   async generarReporte(params: ReporteParams): Promise<void> {
      const res = await fetch(`${PROXY_PREFIX}/reportes/`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(params),
         cache: "no-store",
      });

      // Si backend devuelve error JSON
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
         if (ct.includes("application/json")) {
            const body = await res.json().catch(() => null);
            throw new Error(body?.detail || body?.message || `HTTP ${res.status}`);
         }
         const text = await res.text().catch(() => "");
         throw new Error(text || `HTTP ${res.status}`);
      }

      // A veces backend manda JSON "camuflado"
      if (ct.includes("application/json")) {
         const body = await res.json().catch(() => null);
         throw new Error(body?.detail || body?.message || "Error al generar el reporte");
      }

      const blob = await res.blob();

      const cd = res.headers.get("content-disposition");
      const fileName = parseContentDispositionFilename(cd) ?? buildFileName(params);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
   },
};
