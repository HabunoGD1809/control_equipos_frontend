"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Mantenimiento, TipoMantenimiento } from "@/types/api";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { ScheduleMantenimientoForm } from "./ScheduleMantenimientoForm";
import { Badge } from "@/components/ui/Badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";

interface EquipoMantenimientoTabProps {
   equipoId: string;
   mantenimientos: Mantenimiento[];
   tiposMantenimiento: TipoMantenimiento[];
}

export function EquipoMantenimientoTab({ equipoId, mantenimientos, tiposMantenimiento }: EquipoMantenimientoTabProps) {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const router = useRouter();

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Mantenimiento", () => router.refresh());

   const columns: ColumnDef<Mantenimiento>[] = [
      {
         accessorFn: row => row.tipo_mantenimiento?.nombre || 'N/A',
         id: "tipo_mantenimiento",
         header: "Tipo",
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
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openAlert(row.original.id)}>
                     <Trash2 className="mr-2 h-4 w-4" />Eliminar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   return (
      <div className="mt-4 space-y-4">
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no se puede deshacer. Se eliminará permanentemente el registro de mantenimiento.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(`/mantenimientos/${itemToDelete}`)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <div className="flex justify-end">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
               <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Programar Mantenimiento</Button>
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
                     onSuccess={() => {
                        router.refresh();
                        setIsModalOpen(false);
                     }}
                  />
               </DialogContent>
            </Dialog>
         </div>
         <DataTable columns={columns} data={mantenimientos} filterColumn="tipo_mantenimiento" />
      </div>
   );
}
