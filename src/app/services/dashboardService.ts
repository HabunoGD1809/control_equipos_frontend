import api from '@/lib/api';
import type { DashboardData } from '@/types/api';

export const dashboardService = {
   getSummary: async (): Promise<DashboardData> => {
      const { data } = await api.get<DashboardData>('/dashboard/');
      return data;
   },
};
