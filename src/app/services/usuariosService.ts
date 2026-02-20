import { api } from '@/lib/http';
import { Usuario, UsuarioCreate, UsuarioUpdate, PaginatedResponse } from '@/types/api';

export const usuariosService = {
   getAll: async (params?: { skip?: number; limit?: number; q?: string }): Promise<Usuario[]> => {
      const rawLimit = params?.limit || 100;
      const data = await api.get<PaginatedResponse<Usuario> | Usuario[]>('/usuarios', {
         params: {
            ...params,
            limit: rawLimit,
         }
      });

      if ('items' in data && Array.isArray(data.items)) {
         return data.items;
      }
      if (Array.isArray(data)) {
         return data;
      }

      console.warn('Estructura de respuesta inesperada en usuariosService.getAll', data);
      return [];
   },

   getById: async (id: string): Promise<Usuario> => {
      return await api.get<Usuario>(`/usuarios/${id}`);
   },

   getMe: async (): Promise<Usuario> => {
      return await api.get<Usuario>('/usuarios/me');
   },

   create: async (payload: UsuarioCreate): Promise<Usuario> => {
      return await api.post<Usuario>('/usuarios', payload);
   },

   update: async (id: string, payload: UsuarioUpdate): Promise<Usuario> => {
      return await api.put<Usuario>(`/usuarios/${id}`, payload);
   },

   delete: async (id: string): Promise<void> => {
      await api.delete(`/usuarios/${id}`);
   },

   toggleBloqueo: async (id: string, bloqueado: boolean): Promise<Usuario> => {
      return await usuariosService.update(id, { bloqueado });
   },

   updateMe: async (payload: Partial<UsuarioUpdate>): Promise<Usuario> => {
      return await api.put<Usuario>('/usuarios/me', payload);
   },
};
