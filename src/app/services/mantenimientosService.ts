import { api } from "@/lib/http";
import type {
   Mantenimiento,
   MantenimientoCreate,
   MantenimientoUpdate,
   PaginatedResponse,
} from "@/types/api";

type MantenimientosQuery = {
   skip?: number;
   limit?: number;
   equipo_id?: string;
   estado?: string;
   tecnico_responsable?: string;
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

export const mantenimientosService = {
   async getAll(params?: MantenimientosQuery): Promise<Mantenimiento[]> {
      const data = await api.get<
         PaginatedResponse<Mantenimiento> | Mantenimiento[]
      >("/mantenimientos/", { params });
      return unwrapItems(data);
   },

   getById(id: string): Promise<Mantenimiento> {
      return api.get<Mantenimiento>(`/mantenimientos/${id}`);
   },

   getProximos(): Promise<Mantenimiento[]> {
      return api.get<Mantenimiento[]>("/mantenimientos/proximos");
   },

   create(payload: MantenimientoCreate): Promise<Mantenimiento> {
      return api.post<Mantenimiento>("/mantenimientos/", payload);
   },

   update(id: string, payload: MantenimientoUpdate): Promise<Mantenimiento> {
      return api.put<Mantenimiento>(`/mantenimientos/${id}`, payload);
   },

   delete(id: string): Promise<void> {
      return api.delete<void>(`/mantenimientos/${id}`);
   },
};
