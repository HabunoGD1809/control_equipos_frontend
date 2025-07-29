"use client"

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

import { DataTable } from "@/components/ui/DataTable";
import { Movimiento } from "@/types/api";
import { Badge } from "@/components/ui/Badge";

interface EquipoHistorialTabProps {
   movimientos: Movimiento[];
}

export const columns: ColumnDef<Movimiento>[] = [
   {
      accessorKey: "tipo_movimiento",
      header: "Tipo",
      cell: ({ row }) => <Badge variant="secondary">{row.getValue("tipo_movimiento")}</Badge>
   },
   {
      accessorKey: "fecha_hora",
      header: "Fecha",
      cell: ({ row }) => format(new Date(row.original.fecha_hora), "PPp", { locale: es })
   },
   {
      accessorKey: "ubicacion",
      header: "Ubicación",
      cell: ({ row }) => (
         <div className="flex items-center gap-2">
            <span>{row.original.origen || 'N/A'}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.destino || 'N/A'}</span>
         </div>
      )
   },
   {
      accessorKey: "usuario_registrador.nombre_usuario",
      header: "Registrado por",
      cell: ({ row }) => row.original.usuario_registrador?.nombre_usuario || 'Sistema'
   },
   { accessorKey: "proposito", header: "Propósito" },
];


export function EquipoHistorialTab({ movimientos }: EquipoHistorialTabProps) {
   return (
      <div className="mt-4">
         <DataTable columns={columns} data={movimientos} />
      </div>
   );
}
