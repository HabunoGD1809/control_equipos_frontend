import "server-only";
import { serverApi } from "@/lib/http-server";
import type { Ubicacion } from "@/types/api";

export const ubicacionesServerService = {
   getAll: async (params?: {
      skip?: number;
      limit?: number;
   }): Promise<Ubicacion[]> => {
      return serverApi.get<Ubicacion[]>("/ubicaciones/", {
         params: {
            skip: params?.skip ?? 0,
            limit: Math.min(params?.limit ?? 100, 500),
         },
      });
   },

   getById: (id: string): Promise<Ubicacion> =>
      serverApi.get<Ubicacion>(`/ubicaciones/${id}`),
};
