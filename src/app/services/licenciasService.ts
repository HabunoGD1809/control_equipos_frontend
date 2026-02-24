import { api } from "@/lib/http";
import type {
   SoftwareCatalogo,
   LicenciaSoftware,
   AsignacionLicencia,
   LicenciaSoftwareCreate,
   LicenciaSoftwareUpdate,
   AsignacionLicenciaCreate,
} from "@/types/api";

type SoftwareCatalogoCreate = Omit<SoftwareCatalogo, "id" | "created_at" | "updated_at"> & {
   // Asegúrate de que coincida con el schema de backend si es necesario añadir más campos
};

export const licenciasService = {

   // --- Catálogo ---
   async getCatalogo(): Promise<SoftwareCatalogo[]> {
      return api.get<SoftwareCatalogo[]>("/licencias/catalogo/");
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
      return api.get<LicenciaSoftware[]>("/licencias/");
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
