import "server-only";
import { serverApi } from "@/lib/http-server";
import type { Empleado } from "@/types/api";

export const empleadosServerService = {
   getAll: (skip: number = 0, limit: number = 100): Promise<Empleado[]> => {
      return serverApi.get<Empleado[]>("/empleados/", { params: { skip, limit } });
   },
};
