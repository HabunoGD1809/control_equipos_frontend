import api from '@/lib/api';
import type { BackupLog, PaginatedResponse } from '@/types/api';

export const backupsService = {
   getLogs: async (params?: { skip?: number; limit?: number; backup_status?: string; backup_type?: string }): Promise<BackupLog[]> => {
      try {
         const safeParams = {
            skip: params?.skip || 0,
            limit: params?.limit || 100,
            backup_status: (params?.backup_status && params.backup_status !== 'all') ? params.backup_status : undefined,
            backup_type: (params?.backup_type && params.backup_type !== 'all') ? params.backup_type : undefined,
         };

         const { data } = await api.get<PaginatedResponse<BackupLog> | BackupLog[]>('/backups/logs', {
            params: safeParams
         });

         if ('items' in data && Array.isArray(data.items)) return data.items;
         if (Array.isArray(data)) return data;
         return [];
      } catch (error) {
         console.error("Error fetching backup logs", error);
         return [];
      }
   },

   getLogById: async (id: string): Promise<BackupLog> => {
      const { data } = await api.get<BackupLog>(`/backups/logs/${id}`);
      return data;
   },

   triggerBackup: async (): Promise<{ message: string; job_id: string }> => {
      const { data } = await api.post<{ message: string; job_id: string }>('/backups/run', {});
      return data;
   }
};
