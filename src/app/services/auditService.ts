import { api } from '@/lib/http';
import type { AuditLog } from '@/types/api';

export const auditService = {
   getAll: async (params?: {
      skip?: number;
      limit?: number;
      username?: string;
      table_name?: string;
      start_date?: string;
      end_date?: string;
   }): Promise<AuditLog[]> => {
      return api.get<AuditLog[]>('/auditoria/', { params });
   },

   getByEntity: async (tableName: string, entityId: string): Promise<AuditLog[]> => {
      return api.get<AuditLog[]>('/auditoria/', {
         params: {
            table_name: tableName,
            record_pk_value: entityId,
            limit: 50
         }
      });
   }
};
