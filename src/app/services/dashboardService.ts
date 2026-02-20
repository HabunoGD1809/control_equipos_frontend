import { api } from '@/lib/http';
import type { DashboardData } from '@/types/api';

export const dashboardService = {
   getSummary: async (): Promise<DashboardData> => {
      return await api.get<DashboardData>('/dashboard/');
   },
};
