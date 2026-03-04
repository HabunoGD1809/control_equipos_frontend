import { api } from "@/lib/http";
import type { ReporteParams } from "@/types/api";

export const reportesService = {
   generarReporte: async (params: ReporteParams): Promise<any> => {
      // Llamamos al endpoint real que envía la tarea a Celery en segundo plano
      return await api.post("/reportes/", params);
   }
};
