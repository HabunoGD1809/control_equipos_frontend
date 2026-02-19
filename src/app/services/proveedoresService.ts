import { api } from "@/lib/http";
import type { Proveedor, ProveedorSimple, ProveedorCreate } from "@/types/api";

export const proveedoresService = {
   getAll: (): Promise<Proveedor[]> => api.get<Proveedor[]>("/proveedores/"),

   async getOptions(): Promise<ProveedorSimple[]> {
      const data = await api.get<Proveedor[]>("/proveedores/");
      return data.map((p) => ({ id: p.id, nombre: p.nombre }));
   },

   getById: (id: string): Promise<Proveedor> =>
      api.get<Proveedor>(`/proveedores/${id}`),

   create: (payload: ProveedorCreate): Promise<Proveedor> =>
      api.post<Proveedor>("/proveedores/", payload),

   update: (id: string, payload: Partial<ProveedorCreate>): Promise<Proveedor> =>
      api.put<Proveedor>(`/proveedores/${id}`, payload),

   delete: (id: string): Promise<void> => api.delete<void>(`/proveedores/${id}`),
};
