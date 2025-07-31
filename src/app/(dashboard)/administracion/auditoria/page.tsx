import { cookies } from 'next/headers';
import { AuditoriaClient } from "./components/AuditoriaClient";
import { AuditLog } from '@/types/api';

interface AuditoriaPageProps {
   searchParams: {
      table_name?: string;
      operation?: string;
      username?: string;
      app_user_id?: string;
   }
}

async function getAuditLogs(params: URLSearchParams): Promise<AuditLog[]> {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return [];

   const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auditoria/?limit=100&${params.toString()}`;

   try {
      const response = await fetch(url, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!response.ok) {
         console.error(`[GET_AUDIT_LOGS_ERROR] Status: ${response.status}`);
         return [];
      }
      return response.json();
   } catch (error) {
      console.error("[GET_AUDIT_LOGS_ERROR]", error);
      return [];
   }
}

export default async function AuditoriaPage({ searchParams }: AuditoriaPageProps) {
   const params = new URLSearchParams();
   if (searchParams.table_name) params.append('table_name', searchParams.table_name);
   if (searchParams.operation) params.append('operation', searchParams.operation);
   if (searchParams.username) params.append('username', searchParams.username);
   if (searchParams.app_user_id) params.append('app_user_id', searchParams.app_user_id);

   const logs = await getAuditLogs(params);

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Log de Auditoría</h1>
            <p className="text-muted-foreground">
               Rastree todos los cambios y operaciones realizadas en el sistema.
            </p>
         </div>
         <AuditoriaClient initialData={logs} />
      </div>
   );
}
