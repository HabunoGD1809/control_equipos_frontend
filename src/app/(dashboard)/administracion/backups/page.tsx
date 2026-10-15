import { guardPage } from "@/lib/page-access";
import { backupsServerService } from '@/app/services/backupsService.server';
import { BackupsClient } from './components/BackupsClient';

export default async function BackupsPage() {
   const pageAccessDenied = await guardPage("/administracion/backups");
   if (pageAccessDenied) return pageAccessDenied;

   const logs = await backupsServerService.getLogs();

   return (
      <div className="flex-1 space-y-6">
         <BackupsClient initialData={logs} />
      </div>
   );
}
