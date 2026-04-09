import { api } from '@/lib/http';
import type {
   Empleado,
   EmpleadoSimple,
   EmpleadoCreate,
   EmpleadoUpdate
} from '@/types/api';

export const empleadosService = {
   getAll: async (skip: number = 0, limit: number = 100): Promise<Empleado[]> => {
      return await api.get<Empleado[]>('/empleados/', { params: { skip, limit } });
   },

   search: async (query: string): Promise<EmpleadoSimple[]> => {
      return await api.get<EmpleadoSimple[]>('/empleados/search', { params: { query } });
   },

   getById: async (id: string): Promise<Empleado> => {
      return await api.get<Empleado>(`/empleados/${id}`);
   },

   create: async (payload: EmpleadoCreate): Promise<Empleado> => {
      return await api.post<Empleado>('/empleados/', payload);
   },

   update: async (id: string, payload: EmpleadoUpdate): Promise<Empleado> => {
      return await api.put<Empleado>(`/empleados/${id}`, payload);
   },

   // Nota: En el backend configuramos esto como un "Soft Delete" (is_active = false)
   delete: async (id: string): Promise<Empleado> => {
      return await api.delete<Empleado>(`/empleados/${id}`);
   },
};
