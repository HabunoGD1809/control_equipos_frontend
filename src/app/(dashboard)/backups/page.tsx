import { cookies } from 'next/headers';
import { BackupLog } from '@/types/api';
import { BackupsClient } from "./components/BackupsClient";

interface BackupsPageProps {
   searchParams: {
      backup_status?: string;
      backup_type?: string;
   }
}

async function getBackupLogs(params: URLSearchParams): Promise<BackupLog[]> {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return [];

   const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/backups/logs/?limit=100&${params.toString()}`;

   try {
      const response = await fetch(url, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!response.ok) {
         console.error(`Error fetching backup logs: ${response.status} ${response.statusText}`);
         return [];
      }
      return response.json();
   } catch (error) {
      console.error("[GET_BACKUP_LOGS_ERROR]", error);
      return [];
   }
}

export default async function BackupsPage({ searchParams }: BackupsPageProps) {
   const params = new URLSearchParams();
   if (searchParams.backup_status) params.append('backup_status', searchParams.backup_status);
   if (searchParams.backup_type) params.append('backup_type', searchParams.backup_type);

   const logs = await getBackupLogs(params);

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Historial de Backups</h1>
            <p className="text-muted-foreground">
               Consulte el registro de todas las operaciones de respaldo del sistema.
            </p>
         </div>
         <BackupsClient data={logs} />
      </div>
   );
}
