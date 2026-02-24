import { api } from '@/lib/http';
import type { Rol, RolCreate, Permiso } from '@/types/api';

export const rolesService = {
   getAll: async (): Promise<Rol[]> => {
      return await api.get<Rol[]>('/gestion/roles/');
   },

   getById: async (id: string): Promise<Rol> => {
      return await api.get<Rol>(`/gestion/roles/${id}/`);
   },

   create: async (payload: RolCreate): Promise<Rol> => {
      return await api.post<Rol>('/gestion/roles/', payload);
   },

   update: async (id: string, payload: Partial<RolCreate>): Promise<Rol> => {
      return await api.put<Rol>(`/gestion/roles/${id}/`, payload);
   },

   delete: async (id: string): Promise<void> => {
      await api.delete(`/gestion/roles/${id}/`);
   },

   // --- PERMISOS ---
   getAllPermisos: async (): Promise<Permiso[]> => {
      return await api.get<Permiso[]>('/gestion/permisos/');
   },
};
