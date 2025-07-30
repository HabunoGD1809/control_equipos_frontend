"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Mantenimiento, EquipoSimple, TipoMantenimiento, Proveedor } from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { MantenimientoForm } from "./MantenimientoForm";
import { Badge } from "@/components/ui/Badge";

const columns: ColumnDef<Mantenimiento>[] = [
   {
      accessorFn: (row) => row.equipo.nombre,
      id: "equipo_nombre",
      header: "Equipo",
   },
   {
      accessorFn: (row) => row.tipo_mantenimiento.nombre,
      id: "tipo_mantenimiento",
      header: "Tipo",
   },
   {
      accessorKey: "fecha_programada",
      header: "Fecha Programada",
      cell: ({ row }) => format(new Date(row.getValue("fecha_programada")), 'dd/MM/yyyy'),
   },
   {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
         const estado = row.getValue("estado") as string;
         let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
         if (estado === 'Completado') variant = 'default';
         if (estado === 'Cancelado') variant = 'destructive';
         if (estado === 'En Proceso') variant = 'outline';

         return <Badge variant={variant}>{estado}</Badge>;
      }
   },
   {
      accessorKey: "tecnico_responsable",
      header: "Técnico Responsable",
   },
];

interface MantenimientosClientProps {
   initialData: Mantenimiento[];
   equipos: EquipoSimple[];
   tiposMantenimiento: TipoMantenimiento[];
   proveedores: Proveedor[];
}

export function MantenimientosClient({
   initialData,
   equipos,
   tiposMantenimiento,
   proveedores
}: MantenimientosClientProps) {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const canSchedule = useHasPermission(['programar_mantenimientos']);

   return (
      <>
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
               <DialogHeader>
                  <DialogTitle>Programar Mantenimiento</DialogTitle>
                  <DialogDescription>
                     Completa los detalles para programar un nuevo mantenimiento para un equipo.
                  </DialogDescription>
               </DialogHeader>
               <MantenimientoForm
                  equipos={equipos}
                  tiposMantenimiento={tiposMantenimiento}
                  proveedores={proveedores}
                  onSuccess={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            {canSchedule && (
               <Button onClick={() => setIsModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Programar Mantenimiento
               </Button>
            )}
         </div>
         {/* {} */}
         <DataTable columns={columns} data={initialData} filterColumn="equipo_nombre" />
      </>
   );
}
