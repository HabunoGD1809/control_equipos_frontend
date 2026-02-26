import { serverApi } from "@/lib/http-server";
import { BackupLog } from "@/types/api";

export const backupsServerService = {
   getLogs: async (searchParams?: { backup_status?: string; backup_type?: string }): Promise<BackupLog[]> => {
      const params = new URLSearchParams();
      params.append('limit', '100');

      if (searchParams?.backup_status) params.append('backup_status', searchParams.backup_status);
      if (searchParams?.backup_type) params.append('backup_type', searchParams.backup_type);

      try {
         // Usamos tu utilidad serverApi que ya maneja las cookies y el token automáticamente
         const response = await serverApi.get<any>(`/backups/logs/?${params.toString()}`);

         // Si tu API devuelve un objeto con "items", lo desenvolvemos. Si es array directo, lo devolvemos.
         if (response && Array.isArray(response)) return response;
         if (response && response.items) return response.items;
         return [];
      } catch (error) {
         console.error("[GET_BACKUP_LOGS_ERROR]", error);
         return [];
      }
   }
};
