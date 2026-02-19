import { api } from "@/lib/http";
import type {
   EquipoRead,
   EquipoCreate,
   EquipoUpdate,
   EquipoSearchResult,
   ComponenteInfo,
   PadreInfo,
   EquipoSimple,
   PaginatedResponse,
} from "@/types/api";

type GetAllParams = {
   skip?: number;
   limit?: number;
   q?: string;
   estado_id?: string;
   proveedor_id?: string;
   ubicacion?: string;
};

function normalizePaginated<T>(
   data: PaginatedResponse<T> | T[],
   fallback: { skip: number; limit: number },
): PaginatedResponse<T> {
   if (
      data &&
      typeof data === "object" &&
      "items" in data &&
      Array.isArray((data as any).items)
   ) {
      const d = data as PaginatedResponse<T>;
      return {
         items: d.items ?? [],
         total: d.total ?? d.items?.length ?? 0,
         skip: d.skip ?? fallback.skip,
         limit: d.limit ?? fallback.limit,
      };
   }
   if (Array.isArray(data)) {
      return {
         items: data,
         total: data.length,
         skip: fallback.skip,
         limit: fallback.limit,
      };
   }
   return { items: [], total: 0, skip: fallback.skip, limit: fallback.limit };
}

export const equiposService = {
   async getAll(
      params: GetAllParams = {},
   ): Promise<PaginatedResponse<EquipoRead>> {
      const limit = params.limit ?? 10;
      const skip = params.skip ?? 0;

      const data = await api.get<PaginatedResponse<EquipoRead> | EquipoRead[]>(
         "/equipos",
         {
            params: {
               limit,
               skip,
               q: params.q || undefined,
               estado_id: params.estado_id || undefined,
               proveedor_id: params.proveedor_id || undefined,
               ubicacion_actual: params.ubicacion || undefined,
            },
         },
      );

      return normalizePaginated(data, { skip, limit });
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
      const data = await api.get<PaginatedResponse<EquipoRead> | EquipoRead[]>(
         "/equipos",
         { params: { limit: 1000 } },
      );
      const normalized = normalizePaginated(data, { skip: 0, limit: 1000 });

      return normalized.items.map((e) => ({
         id: e.id,
         nombre: e.nombre,
         numero_serie: e.numero_serie,
         marca: e.marca,
         modelo: e.modelo,
      }));
   },
};
