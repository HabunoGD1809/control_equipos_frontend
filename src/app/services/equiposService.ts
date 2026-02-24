import { api } from "@/lib/http";
import type {
   EquipoRead,
   EquipoCreate,
   EquipoUpdate,
   EquipoSearchResult,
   ComponenteInfo,
   PadreInfo,
   EquipoSimple,
} from "@/types/api";

type GetAllParams = {
   skip?: number;
   limit?: number;
   q?: string;
   estado_id?: string;
   proveedor_id?: string;
   ubicacion?: string;
};

export const equiposService = {
   async getAll(params: GetAllParams = {}): Promise<EquipoRead[]> {
      const limit = params.limit ?? 10;
      const skip = params.skip ?? 0;

      return api.get<EquipoRead[]>("/equipos", {
         params: {
            limit,
            skip,
            q: params.q || undefined,
            estado_id: params.estado_id || undefined,
            proveedor_id: params.proveedor_id || undefined,
            ubicacion_actual: params.ubicacion || undefined,
         },
      });
   },

   getById: (id: string) => api.get<EquipoRead>(`/equipos/${id}`),

   create: (payload: EquipoCreate) => api.post<EquipoRead>("/equipos", payload),

   update: (id: string, payload: EquipoUpdate) =>
      api.put<EquipoRead>(`/equipos/${id}`, payload),

   delete: (id: string) => api.delete<void>(`/equipos/${id}`),

   search: async (termino: string) => {
      if (!termino) return [];
      return api.get<EquipoSearchResult[]>("/equipos/search", {
         params: { q: termino },
      });
   },

   getComponentes: (id: string) =>
      api.get<ComponenteInfo[]>(`/equipos/${id}/componentes`),

   getPadres: (id: string) => api.get<PadreInfo[]>(`/equipos/${id}/parte_de`),

   addComponente: (
      padreId: string,
      payload: {
         equipo_componente_id: string;
         cantidad: number;
         tipo_relacion: string;
         notas?: string;
      },
   ) => api.post<ComponenteInfo>(`/equipos/${padreId}/componentes`, payload),

   updateComponente: (
      relacionId: string,
      payload: { cantidad: number; tipo_relacion: string; notas?: string },
   ) => api.put<ComponenteInfo>(`/equipos/componentes/${relacionId}`, payload),

   removeComponente: (relacionId: string) =>
      api.delete<void>(`/equipos/componentes/${relacionId}`),

   getOptions: async (): Promise<EquipoSimple[]> => {
      const data = await api.get<EquipoRead[]>("/equipos", {
         params: { limit: 1000, skip: 0 },
      });

      return data.map((e) => ({
         id: e.id,
         nombre: e.nombre,
         numero_serie: e.numero_serie,
         marca: e.marca,
         modelo: e.modelo,
      }));
   },
};
