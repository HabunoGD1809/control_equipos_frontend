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
   async getAll(params?: ReservasQuery): Promise<ReservaEquipo[]> {
      return api.get<ReservaEquipo[]>("/reservas/", { params });
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
