import { api } from '@/lib/http';
import type { AuditLog, PaginatedResponse } from '@/types/api';

export const auditService = {
   getAll: async (params?: {
      skip?: number;
      limit?: number;
      username?: string;
      table_name?: string
   }): Promise<PaginatedResponse<AuditLog>> => {
      const data = await api.get<PaginatedResponse<AuditLog>>('/auditoria/', { params });

      if (Array.isArray(data)) {
         return {
            items: data,
            total: data.length,
            skip: params?.skip || 0,
            limit: params?.limit || 100
         };
      }
      return data;
   },

   getByEntity: async (tableName: string, entityId: string): Promise<PaginatedResponse<AuditLog>> => {
      const data = await api.get<PaginatedResponse<AuditLog>>('/auditoria/', {
         params: {
            table_name: tableName,
            record_pk_value: entityId,
            limit: 50
         }
      });

      if (Array.isArray(data)) {
         return {
            items: data,
            total: data.length,
            skip: 0,
            limit: 50
         };
      }
      return data;
   }
};
