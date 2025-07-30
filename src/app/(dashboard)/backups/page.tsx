import { cookies } from "next/headers";
import { BackupLog } from "@/types/api";
import { BackupsClient } from "./components/BackupsClient";

export default async function BackupsPage() {
   const accessToken = (await cookies()).get('access_token')?.value;
   let logs: BackupLog[] = [];

   if (accessToken) {
      try {
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/backups/logs/?limit=100`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            cache: 'no-store',
         });

         if (res.ok) {
            logs = await res.json();
         } else {
            console.error(`Error fetching backup logs: ${res.status} ${res.statusText}`);
         }
      } catch (error) {
         console.error('Failed to fetch backup logs:', error);
      }
   }

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Historial de Backups</h1>
            <p className="text-muted-foreground">
               Consulte el registro de todas las operaciones de respaldo del sistema.
            </p>
         </div>

         {/* Pasamos los datos puros (un array de objetos) al componente cliente */}
         <BackupsClient data={logs} />
      </div>
   );
}
