"use client"

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { AuditLog } from "@/types/api";

const getOperationVariant = (op: string) => {
   switch (op) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
   }
}

export const columns: ColumnDef<AuditLog>[] = [
   {
      accessorKey: "audit_timestamp",
      header: "Fecha y Hora",
      cell: ({ row }) => format(new Date(row.original.audit_timestamp), "Pp", { locale: es })
   },
   { accessorKey: "table_name", header: "Tabla Afectada" },
   {
      accessorKey: "operation",
      header: "Operación",
      cell: ({ row }) => <Badge variant={getOperationVariant(row.getValue("operation"))}>{row.getValue("operation")}</Badge>
   },
   { accessorKey: "username", header: "Usuario DB" },
   { accessorKey: "app_user_id", header: "Usuario App (ID)" },
];

interface AuditoriaClientProps {
   initialData: AuditLog[];
}

export const AuditoriaClient: React.FC<AuditoriaClientProps> = ({ initialData }) => {
   // Aquí se podrían añadir inputs de filtros para fecha, usuario, etc.
   return <DataTable columns={columns} data={initialData} />;
}
