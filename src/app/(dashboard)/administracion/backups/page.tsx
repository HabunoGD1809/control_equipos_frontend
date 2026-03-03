import { backupsServerService } from '@/app/services/backupsService.server';
import { BackupsClient } from '../../backups/components/BackupsClient';

export default async function BackupsPage() {
   const logs = await backupsServerService.getLogs();

   return (
      <div className="space-y-8 animate-in fade-in duration-300">
         <div>
            <h1 className="text-3xl font-bold">Historial de Backups</h1>
            <p className="text-muted-foreground">
               Consulte el registro de todas las operaciones de respaldo de la base de datos.
            </p>
         </div>

         <BackupsClient initialData={logs} />
      </div>
   );
}
