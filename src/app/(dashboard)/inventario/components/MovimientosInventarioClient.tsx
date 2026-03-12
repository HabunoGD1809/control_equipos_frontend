"use client"

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

import { DataTable } from "@/components/ui/DataTable";
import { InventarioMovimiento } from "@/types/api";
import { Badge } from "@/components/ui/Badge";

interface MovimientosInventarioClientProps {
   data: InventarioMovimiento[];
}

export const columns: ColumnDef<InventarioMovimiento>[] = [
   {
      accessorFn: (row) => row.tipo_item?.nombre || 'N/A',
      id: "item_nombre",
      header: "Ítem",
   },
   {
      accessorKey: "tipo_movimiento",
      header: "Tipo",
      cell: ({ row }) => <Badge variant="secondary">{row.getValue("tipo_movimiento")}</Badge>
   },
   {
      accessorKey: "cantidad",
      header: "Cantidad",
      cell: ({ row }) => {
         const movimiento = row.original;
         const isSalida = movimiento.tipo_movimiento.toLowerCase().includes('salida') || movimiento.tipo_movimiento.toLowerCase().includes('negativo');
         const color = isSalida ? 'text-red-500' : 'text-green-500';
         const prefix = isSalida ? '-' : '+';
         return <span className={`font-bold ${color}`}>{prefix}{movimiento.cantidad}</span>
      }
   },
   {
      accessorKey: "ubicacion",
      header: "Ubicación (Origen -> Destino)",
      cell: ({ row }) => {
         const mov = row.original;
         return (
            <div className="flex items-center gap-2 text-xs">
               <span className="text-muted-foreground truncate max-w-30" title={mov.ubicacion_origen_nombre || 'N/A'}>
                  {mov.ubicacion_origen_nombre || 'N/A'}
               </span>
               <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
               <span className="font-medium text-foreground truncate max-w-30" title={mov.ubicacion_destino_nombre || 'N/A'}>
                  {mov.ubicacion_destino_nombre || 'N/A'}
               </span>
            </div>
         );
      }
   },
   {
      accessorKey: "fecha_hora",
      header: "Fecha",
      cell: ({ row }) => format(new Date(row.original.fecha_hora), "PPp", { locale: es })
   },
   {
      accessorFn: (row) => row.usuario_registrador?.nombre_usuario || 'Sistema',
      id: 'usuario',
      header: "Registrado por",
   },
];

export function MovimientosInventarioClient({ data }: MovimientosInventarioClientProps) {
   return (
      <DataTable
         columns={columns}
         data={data}
         filterColumn="item_nombre"
         tableContainerClassName="shadow-sm"
      />
   );
}
