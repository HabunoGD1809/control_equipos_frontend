import { serverApi } from "@/lib/http-server";
import type { EquipoRead, PaginatedResponse } from "@/types/api";

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
   if (data && typeof data === "object" && "items" in data && Array.isArray((data as any).items)) {
      const d = data as PaginatedResponse<T>;
      return {
         items: d.items ?? [],
         total: d.total ?? d.items?.length ?? 0,
         skip: d.skip ?? fallback.skip,
         limit: d.limit ?? fallback.limit,
      };
   }
   if (Array.isArray(data)) {
      return { items: data, total: data.length, skip: fallback.skip, limit: fallback.limit };
   }
   return { items: [], total: 0, skip: fallback.skip, limit: fallback.limit };
}

export const equiposServerService = {
   async getAll(params: GetAllParams = {}): Promise<PaginatedResponse<EquipoRead>> {
      const limit = params.limit ?? 10;
      const skip = params.skip ?? 0;

      const data = await serverApi.get<PaginatedResponse<EquipoRead> | EquipoRead[]>("/equipos", {
         params: {
            limit,
            skip,
            q: params.q || undefined,
            estado_id: params.estado_id || undefined,
            proveedor_id: params.proveedor_id || undefined,
            ubicacion_actual: params.ubicacion || undefined,
         },
      });

      return normalizePaginated(data, { skip, limit });
   },

   getById(id: string) {
      return serverApi.get<EquipoRead>(`/equipos/${id}`);
   },
};
