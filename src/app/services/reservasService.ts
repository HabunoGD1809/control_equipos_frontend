import { api } from "@/lib/http";
import type {
   ReservaEquipo,
   ReservaEquipoCreate,
   ReservaEquipoUpdate,
   ReservaEquipoUpdateEstado,
   ReservaEquipoCheckInOut,
} from "@/types/api";
import { formatISO } from "date-fns";

type ReservasQuery = {
   skip?: number;
   limit?: number;
   equipo_id?: string;
   usuario_id?: string;
   estado?: string;
   fecha_inicio?: string;
   fecha_fin?: string;
};

// UI Payload Interface (basado en el Zod schema)
export interface ReservaFormPayload {
   equipo_id: string;
   fecha_inicio: Date;
   hora_inicio: string; // formato "HH:mm"
   fecha_fin: Date;
   hora_fin: string;    // formato "HH:mm"
   proposito: string;
   notas?: string | null;
}

export const reservasService = {
   // --- ADAPTERS ---
   /**
    * Transforma el payload separado del formulario UI (Fecha + Hora)
    * al formato estricto ISO 8601 exigido por el backend OpenAPI.
    */
   transformFormPayload(uiData: ReservaFormPayload): ReservaEquipoCreate {
      const start = new Date(uiData.fecha_inicio);
      const [sh, sm] = uiData.hora_inicio.split(":").map(Number);
      start.setHours(sh, sm, 0, 0);

      const end = new Date(uiData.fecha_fin);
      const [eh, em] = uiData.hora_fin.split(":").map(Number);
      end.setHours(eh, em, 0, 0);

      return {
         equipo_id: uiData.equipo_id,
         fecha_hora_inicio: formatISO(start),
         fecha_hora_fin: formatISO(end),
         proposito: uiData.proposito,
         notas: uiData.notas,
      };
   },

   // --- API CALLS ---
   async getAll(params: ReservasQuery = {}): Promise<ReservaEquipo[]> {
      const apiParams: Record<string, any> = {
         skip: params.skip,
         limit: params.limit,
         equipo_id: params.equipo_id || undefined,
         usuario_id: params.usuario_id || undefined,
         estado: params.estado || undefined,
         start_date: params.fecha_inicio || undefined,
         end_date: params.fecha_fin || undefined,
      };

      return api.get<ReservaEquipo[]>("/reservas/", { params: apiParams });
   },

   getById: (id: string): Promise<ReservaEquipo> =>
      api.get<ReservaEquipo>(`/reservas/${id}`),

   create: (payload: ReservaEquipoCreate): Promise<ReservaEquipo> =>
      api.post<ReservaEquipo>("/reservas/", payload),

   update: (id: string, payload: ReservaEquipoUpdate): Promise<ReservaEquipo> =>
      api.put<ReservaEquipo>(`/reservas/${id}`, payload),

   cambiarEstado: (
      id: string,
      payload: ReservaEquipoUpdateEstado,
   ): Promise<ReservaEquipo> =>
      api.patch<ReservaEquipo>(`/reservas/${id}/estado`, payload),

   registrarCheckInOut: (
      id: string,
      payload: ReservaEquipoCheckInOut,
   ): Promise<ReservaEquipo> =>
      api.patch<ReservaEquipo>(`/reservas/${id}/check-in-out`, payload),

   cancelar: (id: string): Promise<ReservaEquipo> =>
      api.post<ReservaEquipo>(`/reservas/${id}/cancelar`, {}),

   delete: (id: string): Promise<void> => api.delete<void>(`/reservas/${id}`),
};
