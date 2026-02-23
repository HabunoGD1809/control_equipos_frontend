import { api } from "@/lib/http";
import type {
   ReservaEquipo,
   ReservaEquipoCreate,
   ReservaEquipoUpdate,
   ReservaEquipoUpdateEstado,
   ReservaEquipoCheckInOut,
   PaginatedResponse,
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

function unwrapItems<T>(data: PaginatedResponse<T> | T[]): T[] {
   if (data && typeof data === "object" && "items" in data) {
      const items = (data as PaginatedResponse<T>).items;
      return Array.isArray(items) ? items : [];
   }
   return Array.isArray(data) ? data : [];
}

export const reservasService = {
   async getAll(params?: ReservasQuery): Promise<ReservaEquipo[]> {
      const data = await api.get<
         PaginatedResponse<ReservaEquipo> | ReservaEquipo[]
      >("/reservas/", { params });
      return unwrapItems(data);
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
