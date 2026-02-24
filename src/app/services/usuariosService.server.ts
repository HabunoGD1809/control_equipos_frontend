import "server-only";
import { serverApi } from "@/lib/http-server";
import type { Usuario } from "@/types/api";

export const usuariosServerService = {
   getAll: async (params?: { skip?: number; limit?: number; q?: string }): Promise<Usuario[]> => {
      return serverApi.get<Usuario[]>("/usuarios", {
         params: {
            skip: params?.skip ?? 0,
            limit: Math.min(params?.limit ?? 100, 200),
         },
      });
   },

   getById: (id: string): Promise<Usuario> =>
      serverApi.get<Usuario>(`/usuarios/${id}`),

   getMe: (): Promise<Usuario> =>
      serverApi.get<Usuario>("/usuarios/me"),
};
