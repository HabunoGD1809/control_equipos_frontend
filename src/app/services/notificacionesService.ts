import { api } from "@/lib/http";
import type { Notificacion, PaginatedResponse } from "@/types/api";

function unwrapItems<T>(data: PaginatedResponse<T> | T[]): T[] {
   if (data && typeof data === "object" && "items" in data && Array.isArray((data as any).items)) {
      return (data as PaginatedResponse<T>).items ?? [];
   }
   return Array.isArray(data) ? data : [];
}

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
      const data = await api.get<PaginatedResponse<Notificacion> | Notificacion[]>("/notificaciones/", {
         params,
      });
      return unwrapItems(data);
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
    * (Si tu backend no requiere body, puedes mandar {} igual)
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
