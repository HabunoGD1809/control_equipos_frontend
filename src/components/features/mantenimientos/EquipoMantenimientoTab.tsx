"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Mantenimiento, TipoMantenimiento } from "@/types/api";
import { ScheduleMantenimientoForm } from "./ScheduleMantenimientoForm";
import { Badge } from "@/components/ui/Badge";

interface EquipoMantenimientoTabProps {
   equipoId: string;
   mantenimientos: Mantenimiento[];
   tiposMantenimiento: TipoMantenimiento[];
}

export function EquipoMantenimientoTab({ equipoId, mantenimientos, tiposMantenimiento }: EquipoMantenimientoTabProps) {
   const [isModalOpen, setIsModalOpen] = useState(false);

   const columns: ColumnDef<Mantenimiento>[] = [
      {
         accessorKey: "tipo_mantenimiento.nombre",
         header: "Tipo",
         cell: ({ row }) => row.original.tipo_mantenimiento?.nombre || 'N/A'
      },
      {
         accessorKey: "fecha_programada",
         header: "Fecha Programada",
         cell: ({ row }) => row.original.fecha_programada ? format(new Date(row.original.fecha_programada), "PPP", { locale: es }) : 'N/A'
      },
      {
         accessorKey: "fecha_finalizacion",
         header: "Fecha Finalización",
         cell: ({ row }) => row.original.fecha_finalizacion ? format(new Date(row.original.fecha_finalizacion), "PPP", { locale: es }) : 'N/A'
      },
      { accessorKey: "estado", header: "Estado", cell: ({ row }) => <Badge variant="outline">{row.getValue("estado")}</Badge> },
      { accessorKey: "tecnico_responsable", header: "Técnico" },
   ];

   return (
      <div className="mt-4 space-y-4">
         <div className="flex justify-end">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
               <DialogTrigger asChild>
                  <Button>
                     <PlusCircle className="mr-2 h-4 w-4" />
                     Programar Mantenimiento
                  </Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Programar Nuevo Mantenimiento</DialogTitle>
                     <DialogDescription>
                        Complete los detalles para agendar una nueva tarea de mantenimiento para este equipo.
                     </DialogDescription>
                  </DialogHeader>
                  <ScheduleMantenimientoForm
                     equipoId={equipoId}
                     tiposMantenimiento={tiposMantenimiento}
                     onSuccess={() => setIsModalOpen(false)}
                  />
               </DialogContent>
            </Dialog>
         </div>
         <DataTable columns={columns} data={mantenimientos} />
      </div>
   );
}
