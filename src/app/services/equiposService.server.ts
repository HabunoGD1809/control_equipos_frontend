import { serverApi } from "@/lib/http-server";
import type { EquipoRead, ComponenteInfo, PadreInfo } from "@/types/api";

type GetAllParams = {
   skip?: number;
   limit?: number;
   q?: string;
   estado_id?: string;
   proveedor_id?: string;
   ubicacion?: string;
};

// Función auxiliar para normalizar la respuesta de la API
function unwrap<T>(data: any): T[] {
   if (!data) return [];
   if (Array.isArray(data)) return data;
   if (typeof data === "object" && "items" in data && Array.isArray(data.items)) {
      return data.items;
   }
   return [];
}

export const equiposServerService = {
   async getAll(params: GetAllParams = {}): Promise<EquipoRead[]> {
      const limit = params.limit ?? 10;
      const skip = params.skip ?? 0;

      return serverApi.get<EquipoRead[]>("/equipos", {
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

   getById(id: string) {
      return serverApi.get<EquipoRead>(`/equipos/${id}`);
   },

   // 🚀 SSR MINIMALISTA: Solo pedimos lo que la pantalla necesita para pintar el primer frame
   getEquipoDetailBasics: async (id: string) => {
      const [equipo, compRes, padresRes] = await Promise.all([
         serverApi.get<EquipoRead>(`/equipos/${id}`),
         serverApi.get<any>(`/equipos/${id}/componentes`).catch(() => []),
         serverApi.get<any>(`/equipos/${id}/parte_de`).catch(() => []),
      ]);

      return {
         equipo,
         componentes: unwrap<ComponenteInfo>(compRes),
         padres: unwrap<PadreInfo>(padresRes),
      };
   }
};
