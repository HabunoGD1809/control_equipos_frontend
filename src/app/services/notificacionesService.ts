import { api } from "@/lib/http";
import type { Notificacion, NotificacionUpdate } from "@/types/api";

type UnreadCountResponse =
   | { unread_count: number }
   | { count: number }
   | { unreadCount: number };

export const notificacionesService = {
   /**
    * Obtiene la lista de notificaciones con filtros opcionales.
    */
   async getAll(params?: {
      unread_only?: boolean;
      limit?: number;
   }): Promise<Notificacion[]> {
      return api.get<Notificacion[]>("/notificaciones/", { params });
   },

   /**
    * Obtiene el conteo de notificaciones no leídas.
    */
   async getUnreadCount(): Promise<number> {
      const data = await api.get<UnreadCountResponse>(
         "/notificaciones/count/unread/"
      );
      if ("unread_count" in data) return data.unread_count;
      if ("unreadCount" in data) return data.unreadCount;
      return data.count;
   },

   /**
    * Marca una notificación específica como leída.
    */
   async marcarComoLeida(id: string): Promise<void> {
      const payload: NotificacionUpdate = { leido: true };
      await api.put<void>(`/notificaciones/${id}/marcar/`, payload);
   },

   /**
    * Marca todas las notificaciones del usuario actual como leídas.
    */
   async marcarTodasComoLeidas(): Promise<void> {
      await api.post<void>("/notificaciones/marcar-todas-leidas/", {});
   },

   /**
    * Elimina permanentemente una notificación.
    */
   async delete(id: string): Promise<void> {
      await api.delete<void>(`/notificaciones/${id}`);
   },
};
