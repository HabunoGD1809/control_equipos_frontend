"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Mantenimiento, Proveedor, TipoMantenimiento } from "@/types/api";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { ScheduleMantenimientoForm } from "./ScheduleMantenimientoForm";
import { Badge } from "@/components/ui/Badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";
import { EditarMantenimientoForm } from "@/app/(dashboard)/mantenimientos/components/EditarMantenimientoForm";
import { useHasPermission } from "@/hooks/useHasPermission";

interface EquipoMantenimientoTabProps {
   equipoId: string;
   mantenimientos: Mantenimiento[];
   tiposMantenimiento: TipoMantenimiento[];
   proveedores: Proveedor[]; // Añadir proveedores para el formulario de edición
}

export function EquipoMantenimientoTab({ equipoId, mantenimientos, tiposMantenimiento, proveedores }: EquipoMantenimientoTabProps) {
   const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);
   const router = useRouter();

   const canEdit = useHasPermission(['editar_mantenimientos']);
   const canDelete = useHasPermission(['eliminar_mantenimientos']);

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Mantenimiento", () => router.refresh());

   const handleEditClick = (mantenimiento: Mantenimiento) => {
      setSelectedMantenimiento(mantenimiento);
      setIsEditModalOpen(true);
   };

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
                  {canEdit && (
                     <DropdownMenuItem onClick={() => handleEditClick(row.original)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                     </DropdownMenuItem>
                  )}
                  {canDelete && (
                     <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openAlert(row.original.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />Eliminar
                     </DropdownMenuItem>
                  )}
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

         {/* Modal de Edición */}
         {selectedMantenimiento && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Editar Mantenimiento</DialogTitle>
                  </DialogHeader>
                  <EditarMantenimientoForm
                     mantenimiento={selectedMantenimiento}
                     proveedores={proveedores}
                     onSuccess={() => {
                        setIsEditModalOpen(false);
                        setSelectedMantenimiento(null);
                     }}
                  />
               </DialogContent>
            </Dialog>
         )}

         <div className="flex justify-end">
            <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
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
                        setIsScheduleModalOpen(false);
                     }}
                  />
               </DialogContent>
            </Dialog>
         </div>
         <DataTable columns={columns} data={mantenimientos} filterColumn="tipo_mantenimiento" />
      </div>
   );
}
