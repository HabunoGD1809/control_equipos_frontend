import { api } from '@/lib/http';
import type { Rol, RolCreate, Permiso, PaginatedResponse } from '@/types/api';

export const rolesService = {
   getAll: async (): Promise<Rol[]> => {
      try {
         const data = await api.get<PaginatedResponse<Rol> | Rol[]>('/gestion/roles/');

         if ('items' in data && Array.isArray(data.items)) return data.items;
         if (Array.isArray(data)) return data;
         return [];
      } catch (error) {
         console.error('Error fetching roles', error);
         throw error;
      }
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
      try {
         const data = await api.get<PaginatedResponse<Permiso> | Permiso[]>('/gestion/permisos/');

         if ('items' in data && Array.isArray(data.items)) return data.items;
         if (Array.isArray(data)) return data;
         return [];
      } catch (error) {
         console.error('Error fetching permisos', error);
         throw error;
      }
   },
};
