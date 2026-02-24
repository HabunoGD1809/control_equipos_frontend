import "server-only";
import { serverApi } from "@/lib/http-server";
import type { Movimiento } from "@/types/api";

export const movimientosServerService = {
   getAll: async (params?: { skip?: number; limit?: number }): Promise<Movimiento[]> => {
      return serverApi.get<Movimiento[]>("/movimientos", {
         params: {
            skip: params?.skip ?? 0,
            limit: params?.limit ?? 200,
         },
      });
   },
};
