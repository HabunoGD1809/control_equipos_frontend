import api from '@/lib/api';
import type { Rol, RolCreate, Permiso, PaginatedResponse } from '@/types/api';

export const rolesService = {
   getAll: async (): Promise<Rol[]> => {
      try {
         const response = await api.get<PaginatedResponse<Rol> | Rol[]>('/gestion/roles/');
         const data = response.data;

         if ('items' in data && Array.isArray(data.items)) return data.items;
         if (Array.isArray(data)) return data;
         return [];
      } catch (error) {
         console.error('Error fetching roles', error);
         throw error;
      }
   },

   getById: async (id: string): Promise<Rol> => {
      const { data } = await api.get<Rol>(`/gestion/roles/${id}/`);
      return data;
   },

   create: async (payload: RolCreate): Promise<Rol> => {
      const { data } = await api.post<Rol>('/gestion/roles/', payload);
      return data;
   },

   update: async (id: string, payload: Partial<RolCreate>): Promise<Rol> => {
      const { data } = await api.put<Rol>(`/gestion/roles/${id}/`, payload);
      return data;
   },

   delete: async (id: string): Promise<void> => {
      await api.delete(`/gestion/roles/${id}/`);
   },

   // --- PERMISOS ---
   getAllPermisos: async (): Promise<Permiso[]> => {
      try {
         const response = await api.get<PaginatedResponse<Permiso> | Permiso[]>('/gestion/permisos/');
         const data = response.data;

         if ('items' in data && Array.isArray(data.items)) return data.items;
         if (Array.isArray(data)) return data;
         return [];
      } catch (error) {
         console.error('Error fetching permisos', error);
         throw error;
      }
   },
};
