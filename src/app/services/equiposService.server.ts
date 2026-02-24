import { serverApi } from "@/lib/http-server";
import type { EquipoRead } from "@/types/api";

type GetAllParams = {
   skip?: number;
   limit?: number;
   q?: string;
   estado_id?: string;
   proveedor_id?: string;
   ubicacion?: string;
};

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
};
