import { api } from "@/lib/http";
import type {
   SoftwareCatalogo,
   LicenciaSoftware,
   AsignacionLicencia,
   PaginatedResponse,
   LicenciaSoftwareCreate,
   LicenciaSoftwareUpdate,
   AsignacionLicenciaCreate,
} from "@/types/api";

function unwrapItems<T>(data: PaginatedResponse<T> | T[]): T[] {
   if (data && typeof data === "object" && "items" in data) {
      const items = (data as PaginatedResponse<T>).items;
      return Array.isArray(items) ? items : [];
   }
   return Array.isArray(data) ? data : [];
}

type SoftwareCatalogoCreate = Omit<SoftwareCatalogo, "id" | "created_at" | "updated_at"> & {
   // si tu backend lo requiere: nombre, version, fabricante, tipo_licencia, metrica_licenciamiento...
};

export const licenciasService = {
   
   // --- Catálogo ---
   async getCatalogo(): Promise<SoftwareCatalogo[]> {
      const data = await api.get<PaginatedResponse<SoftwareCatalogo> | SoftwareCatalogo[]>(
         "/licencias/catalogo/"
      );
      return unwrapItems(data);
   },

   createSoftware(payload: SoftwareCatalogoCreate): Promise<SoftwareCatalogo> {
      return api.post<SoftwareCatalogo>("/licencias/catalogo/", payload);
   },

   updateSoftware(id: string, payload: Partial<SoftwareCatalogoCreate>): Promise<SoftwareCatalogo> {
      return api.put<SoftwareCatalogo>(`/licencias/catalogo/${id}`, payload);
   },

   deleteSoftware(id: string): Promise<void> {
      return api.delete<void>(`/licencias/catalogo/${id}`);
   },

   // --- Licencias ---
   async getAll(): Promise<LicenciaSoftware[]> {
      const data = await api.get<PaginatedResponse<LicenciaSoftware> | LicenciaSoftware[]>(
         "/licencias/"
      );
      return unwrapItems(data);
   },

   getById(id: string): Promise<LicenciaSoftware> {
      return api.get<LicenciaSoftware>(`/licencias/${id}`);
   },

   create(payload: LicenciaSoftwareCreate): Promise<LicenciaSoftware> {
      return api.post<LicenciaSoftware>("/licencias/", payload);
   },

   update(id: string, payload: LicenciaSoftwareUpdate): Promise<LicenciaSoftware> {
      return api.put<LicenciaSoftware>(`/licencias/${id}`, payload);
   },

   delete(id: string): Promise<void> {
      return api.delete<void>(`/licencias/${id}`);
   },

   // --- Asignaciones ---
   getAsignaciones(params?: { licencia_id?: string; equipo_id?: string; usuario_id?: string; limit?: number; skip?: number; }): Promise<AsignacionLicencia[]> {
      return api.get<AsignacionLicencia[]>("/licencias/asignaciones/", { params });
   },

   asignar(payload: AsignacionLicenciaCreate): Promise<AsignacionLicencia> {
      return api.post<AsignacionLicencia>("/licencias/asignaciones/", payload);
   },

   revocarAsignacion(id: string): Promise<void> {
      return api.delete<void>(`/licencias/asignaciones/${id}`);
   },
};
