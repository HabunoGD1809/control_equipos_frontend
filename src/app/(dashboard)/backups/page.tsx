import { backupsServerService } from "@/app/services/backupsService.server";
import { BackupsClient } from "./components/BackupsClient";

interface BackupsPageProps {
   searchParams: Promise<{
      backup_status?: string;
      backup_type?: string;
   }>;
}

export default async function BackupsPage({ searchParams }: BackupsPageProps) {
   const resolvedParams = await searchParams;

   const logs = await backupsServerService.getLogs(resolvedParams);

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Historial de Backups</h1>
            <p className="text-muted-foreground mt-2">
               Consulte el registro de todas las operaciones de respaldo del sistema.
            </p>
         </div>
         <BackupsClient initialData={logs} />
      </div>
   );
}
