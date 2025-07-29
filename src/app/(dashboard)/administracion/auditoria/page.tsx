import { cookies } from 'next/headers';
import { AuditoriaClient } from "./components/AuditoriaClient";
import { AuditLog } from '@/types/api';

async function getAuditLogs(): Promise<AuditLog[]> {
   const accessToken = cookies().get('access_token')?.value;
   if (!accessToken) return [];

   try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auditoria/?limit=100`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!response.ok) return [];
      return response.json();
   } catch (error) {
      console.error("[GET_AUDIT_LOGS_ERROR]", error);
      return [];
   }
}

export default async function AuditoriaPage() {
   const logs = await getAuditLogs();

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
