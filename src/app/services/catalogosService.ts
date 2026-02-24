import { api } from "@/lib/http";
import type {
   EstadoEquipo,
   TipoDocumento,
   TipoMantenimiento,
} from "@/types/api";

export interface CatalogoCreatePayload {
   nombre: string;
   descripcion?: string | null;
   [key: string]: unknown;
}

export const catalogosService = {
   // --- Estados de Equipo ---
   async getEstadosEquipo(): Promise<EstadoEquipo[]> {
      return api.get<EstadoEquipo[]>("/catalogos/estados-equipo/");
   },

   createEstadoEquipo(payload: CatalogoCreatePayload): Promise<EstadoEquipo> {
      return api.post<EstadoEquipo>("/catalogos/estados-equipo/", payload);
   },

   updateEstadoEquipo(
      id: string,
      payload: Partial<CatalogoCreatePayload>,
   ): Promise<EstadoEquipo> {
      return api.put<EstadoEquipo>(`/catalogos/estados-equipo/${id}`, payload);
   },

   deleteEstadoEquipo(id: string): Promise<void> {
      return api.delete<void>(`/catalogos/estados-equipo/${id}`);
   },

   // --- Tipos de Documento ---
   async getTiposDocumento(): Promise<TipoDocumento[]> {
      return api.get<TipoDocumento[]>("/catalogos/tipos-documento/");
   },

   createTipoDocumento(payload: CatalogoCreatePayload): Promise<TipoDocumento> {
      return api.post<TipoDocumento>("/catalogos/tipos-documento/", payload);
   },

   updateTipoDocumento(
      id: string,
      payload: Partial<CatalogoCreatePayload>,
   ): Promise<TipoDocumento> {
      return api.put<TipoDocumento>(`/catalogos/tipos-documento/${id}`, payload);
   },

   deleteTipoDocumento(id: string): Promise<void> {
      return api.delete<void>(`/catalogos/tipos-documento/${id}`);
   },

   // --- Tipos de Mantenimiento ---
   async getTiposMantenimiento(): Promise<TipoMantenimiento[]> {
      return api.get<TipoMantenimiento[]>("/catalogos/tipos-mantenimiento/");
   },

   createTipoMantenimiento(
      payload: CatalogoCreatePayload,
   ): Promise<TipoMantenimiento> {
      return api.post<TipoMantenimiento>(
         "/catalogos/tipos-mantenimiento/",
         payload,
      );
   },

   updateTipoMantenimiento(
      id: string,
      payload: Partial<CatalogoCreatePayload>,
   ): Promise<TipoMantenimiento> {
      return api.put<TipoMantenimiento>(
         `/catalogos/tipos-mantenimiento/${id}`,
         payload,
      );
   },

   deleteTipoMantenimiento(id: string): Promise<void> {
      return api.delete<void>(`/catalogos/tipos-mantenimiento/${id}`);
   },
};
