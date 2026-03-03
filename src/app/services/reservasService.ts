import { api } from "@/lib/http";
import type {
   ReservaEquipo,
   ReservaEquipoCreate,
   ReservaEquipoUpdate,
   ReservaEquipoUpdateEstado,
   ReservaEquipoCheckInOut,
} from "@/types/api";

type ReservasQuery = {
   skip?: number;
   limit?: number;
   equipo_id?: string;
   usuario_id?: string;
   estado?: string;
   fecha_inicio?: string;
   fecha_fin?: string;
};

export const reservasService = {
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
