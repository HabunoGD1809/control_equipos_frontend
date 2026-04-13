import "server-only";
import { serverApi } from "@/lib/http-server";
import type { Rol, Permiso } from "@/types/api";

export const rolesServerService = {
   getAll: (): Promise<Rol[]> =>
      serverApi.get<Rol[]>("/gestion/roles/"),

   getAllPermisos: (): Promise<Permiso[]> =>
      serverApi.get<Permiso[]>("/gestion/permisos/"),

   getById: (id: string): Promise<Rol> =>
      serverApi.get<Rol>(`/gestion/roles/${id}`),
};
