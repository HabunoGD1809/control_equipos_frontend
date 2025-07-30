import { cookies } from 'next/headers';
import { BackupLog } from '@/types/api';
import { BackupsClient } from "@/app/(dashboard)/backups/components/BackupsClient";

async function getBackupLogs(): Promise<BackupLog[]> {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return [];
   try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/backups/logs/`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!response.ok) return [];
      return response.json();
   } catch (error) {
      console.error("[GET_BACKUP_LOGS_ERROR]", error);
      return [];
   }
}

export default async function BackupsPage() {
   const logs = await getBackupLogs();

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Historial de Backups</h1>
            <p className="text-muted-foreground">
               Consulte el registro de todas las operaciones de respaldo de la base de datos.
            </p>
         </div>
         {/* Usa el componente cliente y solo pásale los datos */}
         <BackupsClient data={logs} />
      </div>
   );
}
