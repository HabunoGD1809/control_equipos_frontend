import api from '@/lib/api';
import { Usuario, UsuarioCreate, UsuarioUpdate, PaginatedResponse } from '@/types/api';

export const usuariosService = {
   getAll: async (params?: { skip?: number; limit?: number; q?: string }): Promise<Usuario[]> => {
      const rawLimit = params?.limit || 100;
      // Ruta sin barra final para evitar 307
      const response = await api.get<PaginatedResponse<Usuario> | Usuario[]>('/usuarios', {
         params: {
            ...params,
            limit: rawLimit,
            // Mapeamos 'q' a lo que el backend podría esperar para filtrado si es distinto
         }
      });

      const data = response.data;

      // Validación robusta para PaginatedResponse vs Array directo
      if ('items' in data && Array.isArray(data.items)) {
         return data.items;
      }
      if (Array.isArray(data)) {
         return data;
      }

      // Si llega aquí, la respuesta no tiene el formato esperado
      console.warn('Estructura de respuesta inesperada en usuariosService.getAll', data);
      return [];
   },

   getById: async (id: string): Promise<Usuario> => {
      const { data } = await api.get<Usuario>(`/usuarios/${id}`);
      return data;
   },

   getMe: async (): Promise<Usuario> => {
      const { data } = await api.get<Usuario>('/usuarios/me');
      return data;
   },

   create: async (payload: UsuarioCreate): Promise<Usuario> => {
      const { data } = await api.post<Usuario>('/usuarios', payload);
      return data;
   },

   update: async (id: string, payload: UsuarioUpdate): Promise<Usuario> => {
      const { data } = await api.put<Usuario>(`/usuarios/${id}`, payload);
      return data;
   },

   delete: async (id: string): Promise<void> => {
      await api.delete(`/usuarios/${id}`);
   },

   toggleBloqueo: async (id: string, bloqueado: boolean): Promise<Usuario> => {
      return await usuariosService.update(id, { bloqueado });
   },

   updateMe: async (payload: Partial<UsuarioUpdate>): Promise<Usuario> => {
      const { data } = await api.put<Usuario>('/usuarios/me', payload);
      return data;
   },
};
