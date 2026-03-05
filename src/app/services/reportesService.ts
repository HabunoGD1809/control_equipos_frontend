import { api } from "@/lib/http";
import type { ReporteParams } from "@/types/api";

export const reportesService = {
   generarReporte: async (params: ReporteParams): Promise<{ status: string; msg: string; task_id: string }> => {
      return await api.post("/reportes/", params);
   },

   descargarReporte: async (reportId: string): Promise<Blob> => {
      return await api.get<Blob>(`/reportes/${reportId}/download`, {
         responseType: "blob",
      });
   },
};
