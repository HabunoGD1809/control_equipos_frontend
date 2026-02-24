import { api } from "@/lib/http";
import type {
   Mantenimiento,
   MantenimientoCreate,
   MantenimientoUpdate,
} from "@/types/api";

type MantenimientosQuery = {
   skip?: number;
   limit?: number;
   equipo_id?: string;
   estado?: string;
   tipo_mantenimiento_id?: string;
   start_date?: string;
   end_date?: string;
};

export const mantenimientosService = {
   async getAll(params?: MantenimientosQuery): Promise<Mantenimiento[]> {
      return api.get<Mantenimiento[]>("/mantenimientos/", { params });
   },

   getById(id: string): Promise<Mantenimiento> {
      return api.get<Mantenimiento>(`/mantenimientos/${id}`);
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
