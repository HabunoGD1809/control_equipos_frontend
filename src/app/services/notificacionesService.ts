import { api } from "@/lib/http";
import type { Notificacion } from "@/types/api";

type UnreadCountResponse =
   | { unread_count: number }
   | { count: number }
   | { unreadCount: number };

export const notificacionesService = {
   /**
    * Lista notificaciones.
    * params.unread_only: filtra solo no leídas si el backend lo soporta
    * params.limit: limita cantidad
    */
   async getAll(params?: { unread_only?: boolean; limit?: number }): Promise<Notificacion[]> {
      return api.get<Notificacion[]>("/notificaciones/", { params });
   },

   /**
    * Conteo de no leídas
    * Soporta múltiples shapes por compatibilidad.
    */
   async getUnreadCount(): Promise<number> {
      const data = await api.get<UnreadCountResponse>("/notificaciones/count/unread");
      if ("unread_count" in data) return data.unread_count;
      if ("unreadCount" in data) return data.unreadCount;
      return data.count;
   },

   /**
    * Marcar una como leída
    */
   async marcarComoLeida(id: string): Promise<void> {
      await api.put<void>(`/notificaciones/${id}/marcar`, { leido: true });
   },

   async marcarTodasComoLeidas(): Promise<void> {
      await api.post<void>("/notificaciones/marcar-todas-leidas", {});
   },

   async delete(id: string): Promise<void> {
      await api.delete<void>(`/notificaciones/${id}`);
   },
};
