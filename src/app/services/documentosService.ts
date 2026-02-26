import { api } from "@/lib/http";
import type {
   Documentacion,
   DocumentacionVerify,
   DocumentacionUpdate,
} from "@/types/api";

type DocumentosQuery = {
   equipo_id?: string;
   mantenimiento_id?: string;
   licencia_id?: string;
   tipo_documento_id?: string;
   estado?: string;
   skip?: number;
   limit?: number;
};

export const documentosService = {
   async getAll(params?: DocumentosQuery): Promise<Documentacion[]> {
      return api.get<Documentacion[]>("/documentacion/", { params });
   },

   async getByEquipo(equipoId: string, params?: { skip?: number; limit?: number }): Promise<Documentacion[]> {
      return api.get<Documentacion[]>(`/documentacion/equipo/${equipoId}`, { params });
   },

   async getByMantenimiento(mantenimientoId: string, params?: { skip?: number; limit?: number }): Promise<Documentacion[]> {
      return api.get<Documentacion[]>(`/documentacion/mantenimiento/${mantenimientoId}`, { params });
   },

   async getByLicencia(licenciaId: string, params?: { skip?: number; limit?: number }): Promise<Documentacion[]> {
      return api.get<Documentacion[]>(`/documentacion/licencia/${licenciaId}`, { params });
   },

   getById(id: string): Promise<Documentacion> {
      return api.get<Documentacion>(`/documentacion/${id}`);
   },

   async upload(payload: {
      titulo: string;
      tipo_documento_id: string;
      file: File;
      descripcion?: string | null;
      equipo_id?: string | null;
      mantenimiento_id?: string | null;
      licencia_id?: string | null;
   }): Promise<Documentacion> {
      const formData = new FormData();
      formData.append("titulo", payload.titulo);
      formData.append("tipo_documento_id", payload.tipo_documento_id);
      formData.append("file", payload.file);

      if (payload.descripcion) formData.append("descripcion", payload.descripcion);
      if (payload.equipo_id) formData.append("equipo_id", payload.equipo_id);
      if (payload.mantenimiento_id) formData.append("mantenimiento_id", payload.mantenimiento_id);
      if (payload.licencia_id) formData.append("licencia_id", payload.licencia_id);

      return api.post<Documentacion>("/documentacion/", formData);
   },

   update(
      id: string,
      payload: DocumentacionUpdate,
   ): Promise<Documentacion> {
      return api.put<Documentacion>(`/documentacion/${id}`, payload);
   },

   verificar(id: string, payload: DocumentacionVerify): Promise<Documentacion> {
      return api.post<Documentacion>(`/documentacion/${id}/verificar`, payload);
   },

   delete(id: string): Promise<void> {
      return api.delete<void>(`/documentacion/${id}`);
   },
};
