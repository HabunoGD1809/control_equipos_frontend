import { serverApi } from "@/lib/http-server";
import { BackupLog } from "@/types/api";

export const backupsServerService = {
   getLogs: async (searchParams?: {
      backup_status?: string;
      backup_type?: string;
   }): Promise<BackupLog[]> => {
      // Aprovechamos la capacidad de `serverApi` para procesar params automáticamente
      const params: Record<string, string | number> = { limit: 100 };

      if (searchParams?.backup_status)
         params.backup_status = searchParams.backup_status;
      if (searchParams?.backup_type)
         params.backup_type = searchParams.backup_type;

      try {
         const response = await serverApi.get<any>("/backups/logs/", { params });

         // Desenvolvemos si viene envuelto en "items", de lo contrario devolvemos directo
         if (response && Array.isArray(response)) return response;
         if (response && response.items) return response.items;
         return [];
      } catch (error) {
         console.error("[GET_BACKUP_LOGS_ERROR]", error);
         return [];
      }
   },
};
