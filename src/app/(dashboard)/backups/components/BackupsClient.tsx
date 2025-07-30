"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BackupLog } from "@/types/api";

const columns: ColumnDef<BackupLog>[] = [
   {
      accessorKey: "backup_timestamp",
      header: "Fecha y Hora",
      cell: ({ row }) => {
         const date = new Date(row.getValue("backup_timestamp"));
         return format(date, "PPp", { locale: es });
      },
   },
   {
      accessorKey: "backup_type",
      header: "Tipo",
   },
   {
      accessorKey: "backup_status",
      header: "Estado",
      cell: ({ row }) => {
         const status = row.getValue("backup_status") as string;
         let variant: "default" | "secondary" | "destructive" = "secondary";
         if (status === "Completado" || status === "Completed") variant = "default";
         if (status === "Fallido" || status === "Failed") variant = "destructive";
         return <Badge variant={variant}>{status}</Badge>;
      },
   },
   {
      accessorKey: "duration",
      header: "Duración",
      cell: ({ row }) => {
         const duration = row.original.duration;
         return duration ? duration.split('.')[0] : "N/A";
      },
   },
   {
      accessorKey: "file_path",
      header: "Archivo",
      cell: ({ row }) => (
         <span className="truncate font-mono text-sm">
            {row.original.file_path || "N/A"}
         </span>
      ),
   },
   {
      accessorKey: "error_message",
      header: "Detalles",
      cell: ({ row }) => (
         <span className="text-destructive text-xs">
            {row.original.error_message || ""}
         </span>
      ),
   },
];

interface BackupsClientProps {
   data: BackupLog[];
}

export const BackupsClient: React.FC<BackupsClientProps> = ({ data }) => {
   return (
      <DataTable
         columns={columns}
         data={data}
         filterColumn="backup_type"
      />
   );
};
