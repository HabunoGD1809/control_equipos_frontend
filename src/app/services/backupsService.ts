import { api } from '@/lib/http';
import type { BackupLog } from '@/types/api';

export const backupsService = {
   getLogs: async (params?: { skip?: number; limit?: number; backup_status?: string; backup_type?: string }): Promise<BackupLog[]> => {
      try {
         const safeParams = {
            skip: params?.skip || 0,
            limit: params?.limit || 100,
            backup_status: (params?.backup_status && params.backup_status !== 'all') ? params.backup_status : undefined,
            backup_type: (params?.backup_type && params.backup_type !== 'all') ? params.backup_type : undefined,
         };

         return await api.get<BackupLog[]>('/backups/logs', {
            params: safeParams
         });
      } catch (error) {
         console.error("Error fetching backup logs", error);
         return [];
      }
   },

   getLogById: async (id: string): Promise<BackupLog> => {
      return await api.get<BackupLog>(`/backups/logs/${id}`);
   },

   triggerBackup: async (): Promise<{ message: string; job_id: string }> => {
      return await api.post<{ message: string; job_id: string }>('/backups/run', {});
   }
};
