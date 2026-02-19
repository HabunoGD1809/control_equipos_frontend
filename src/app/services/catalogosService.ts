import { api } from "@/lib/http";
import type {
   EstadoEquipo,
   TipoDocumento,
   TipoMantenimiento,
   PaginatedResponse,
} from "@/types/api";

export interface CatalogoCreatePayload {
   nombre: string;
   descripcion?: string | null;
   [key: string]: unknown;
}

function unwrapItems<T>(data: PaginatedResponse<T> | T[]): T[] {
   if (
      data &&
      typeof data === "object" &&
      "items" in data &&
      Array.isArray((data as any).items)
   ) {
      return (data as PaginatedResponse<T>).items ?? [];
   }
   return Array.isArray(data) ? data : [];
}

export const catalogosService = {
   // --- Estados de Equipo ---
   async getEstadosEquipo(): Promise<EstadoEquipo[]> {
      const data = await api.get<
         PaginatedResponse<EstadoEquipo> | EstadoEquipo[]
      >("/catalogos/estados-equipo/");
      return unwrapItems(data);
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
      const data = await api.get<
         PaginatedResponse<TipoDocumento> | TipoDocumento[]
      >("/catalogos/tipos-documento/");
      return unwrapItems(data);
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
      const data = await api.get<
         PaginatedResponse<TipoMantenimiento> | TipoMantenimiento[]
      >("/catalogos/tipos-mantenimiento/");
      return unwrapItems(data);
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
