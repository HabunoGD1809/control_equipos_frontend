import { cookies } from 'next/headers';
import { BackupLog } from '@/types/api';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

async function getBackupLogs(): Promise<BackupLog[]> {
   const accessToken = cookies().get('access_token')?.value;
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

const getStatusBadge = (status: string) => {
   switch (status.toLowerCase()) {
      case 'completado': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-2 h-4 w-4" />{status}</Badge>;
      case 'fallido': return <Badge variant="destructive"><XCircle className="mr-2 h-4 w-4" />{status}</Badge>;
      default: return <Badge variant="secondary"><Clock className="mr-2 h-4 w-4" />{status}</Badge>;
   }
}

export const columns: ColumnDef<BackupLog>[] = [
   {
      accessorKey: "backup_timestamp",
      header: "Fecha y Hora",
      cell: ({ row }) => format(new Date(row.original.backup_timestamp), "Pp", { locale: es })
   },
   { accessorKey: "backup_type", header: "Tipo" },
   {
      accessorKey: "backup_status",
      header: "Estado",
      cell: ({ row }) => getStatusBadge(row.getValue("backup_status"))
   },
   { accessorKey: "file_path", header: "Archivo" },
   { accessorKey: "error_message", header: "Mensaje de Error", cell: ({ row }) => row.original.error_message || 'N/A' },
];

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
         <DataTable columns={columns} data={logs} />
      </div>
   );
}
