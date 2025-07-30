"use client"

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { DataTable } from "@/components/ui/DataTable";
import { LicenciaSoftware } from "@/types/api";

interface EquipoLicenciasTabProps {
   licenciasAsignadas: LicenciaSoftware[];
}

// Columnas para la tabla de Licencias Asignadas
const columns: ColumnDef<LicenciaSoftware>[] = [
   {
      accessorFn: (row) => `${row.software_info.nombre} ${row.software_info.version || ''}`,
      id: "software",
      header: "Software",
   },
   {
      accessorKey: "fecha_adquisicion",
      header: "Fecha Adquisición",
      cell: ({ row }) => format(new Date(row.original.fecha_adquisicion), "P", { locale: es })
   },
   {
      accessorKey: "fecha_expiracion",
      header: "Expira",
      cell: ({ row }) => row.original.fecha_expiracion ? format(new Date(row.original.fecha_expiracion), "P", { locale: es }) : 'Perpetua'
   },
];

export function EquipoLicenciasTab({ licenciasAsignadas }: EquipoLicenciasTabProps) {
   return (
      <div className="mt-4">
         <DataTable columns={columns} data={licenciasAsignadas} filterColumn="software" />
      </div>
   );
}
