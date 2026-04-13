import "server-only";
import { serverApi } from "@/lib/http-server";
import type { Departamento } from "@/types/api";

export const catalogosServerService = {
   getDepartamentos: (params?: { q?: string; include_inactive?: boolean; limit?: number }): Promise<Departamento[]> => {
      return serverApi.get<Departamento[]>("/catalogos/departamentos/", { params });
   },
};
