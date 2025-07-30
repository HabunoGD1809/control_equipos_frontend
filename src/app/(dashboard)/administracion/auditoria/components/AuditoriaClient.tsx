"use client"

import { ColumnDef } from "@tanstack/react-table";
import { format } from 'date-fns';
import { DataTable } from "@/components/ui/DataTable";
import { AuditLog } from "@/types/api";

const columns: ColumnDef<AuditLog>[] = [
    {
        accessorKey: "audit_timestamp",
        header: "Fecha y Hora",
        cell: ({ row }) => format(new Date(row.getValue("audit_timestamp")), 'dd/MM/yyyy HH:mm:ss'),
    },
    {
        accessorKey: "table_name",
        header: "Tabla Afectada",
    },
    {
        accessorKey: "operation",
        header: "Operación",
    },
    {
        accessorKey: "username",
        header: "Usuario DB",
    },
    {
        accessorKey: "app_user_id",
        header: "Usuario App (ID)",
    },
];

interface AuditoriaClientProps {
    initialData: AuditLog[];
}

export function AuditoriaClient({ initialData }: AuditoriaClientProps) {
    return (
        <DataTable columns={columns} data={initialData} filterColumn="table_name" />
    );
}
