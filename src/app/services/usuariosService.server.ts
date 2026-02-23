import "server-only";
import { serverApi } from "@/lib/http-server";
import type { Usuario, PaginatedResponse } from "@/types/api";

function normalizeList<T>(data: PaginatedResponse<T> | T[]): T[] {
   if (Array.isArray(data)) return data;
   if (data && "items" in data && Array.isArray(data.items)) return data.items;
   return [];
}

export const usuariosServerService = {
   getAll: async (params?: { skip?: number; limit?: number; q?: string }): Promise<Usuario[]> => {
      const data = await serverApi.get<PaginatedResponse<Usuario> | Usuario[]>("/usuarios", {
         params: {
            skip: params?.skip ?? 0,
            limit: Math.min(params?.limit ?? 100, 200),
         },
      });
      return normalizeList(data);
   },

   getById: (id: string): Promise<Usuario> =>
      serverApi.get<Usuario>(`/usuarios/${id}`),

   getMe: (): Promise<Usuario> =>
      serverApi.get<Usuario>("/usuarios/me"),
};
