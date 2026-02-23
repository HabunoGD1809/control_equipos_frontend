import "server-only";
import { serverApi } from "@/lib/http-server";
import type { Movimiento, PaginatedResponse } from "@/types/api";

function normalizeList<T>(data: PaginatedResponse<T> | T[]): T[] {
   if (Array.isArray(data)) return data;
   if (data && "items" in data && Array.isArray(data.items)) return data.items;
   return [];
}

export const movimientosServerService = {
   getAll: async (params?: { skip?: number; limit?: number }): Promise<Movimiento[]> => {
      const data = await serverApi.get<PaginatedResponse<Movimiento> | Movimiento[]>("/movimientos", {
         params: {
            skip: params?.skip ?? 0,
            limit: params?.limit ?? 200,
         },
      });
      return normalizeList(data);
   },
};
