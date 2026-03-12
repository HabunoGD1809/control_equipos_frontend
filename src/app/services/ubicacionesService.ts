import { api } from "@/lib/http";
import type { Ubicacion, UbicacionCreate, UbicacionUpdate } from "@/types/api";

type UbicacionesQuery = {
   skip?: number;
   limit?: number;
   include_inactive?: boolean;
};

export const ubicacionesService = {
   getAll: async (params?: UbicacionesQuery): Promise<Ubicacion[]> => {
      return api.get<Ubicacion[]>("/ubicaciones/", { params });
   },

   create: (payload: UbicacionCreate): Promise<Ubicacion> =>
      api.post<Ubicacion>("/ubicaciones/", payload),

   update: (id: string, payload: UbicacionUpdate): Promise<Ubicacion> =>
      api.put<Ubicacion>(`/ubicaciones/${id}`, payload),

   delete: (id: string): Promise<{ msg: string }> =>
      api.delete<{ msg: string }>(`/ubicaciones/${id}`),
};
