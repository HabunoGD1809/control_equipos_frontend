import { backupsServerService } from '@/app/services/backupsService.server';
import { BackupsClient } from './components/BackupsClient';

export default async function BackupsPage() {
   const logs = await backupsServerService.getLogs();

   return (
      <div className="flex-1 space-y-6">
         <BackupsClient initialData={logs} />
      </div>
   );
}
