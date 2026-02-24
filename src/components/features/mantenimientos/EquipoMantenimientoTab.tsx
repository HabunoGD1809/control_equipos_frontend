"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useToast } from "@/components/ui/use-toast";

import { Mantenimiento, Proveedor, TipoMantenimiento } from "@/types/api";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useHasPermission } from "@/hooks/useHasPermission";

import { ScheduleMantenimientoForm } from "./ScheduleMantenimientoForm";
import { EditarMantenimientoForm } from "./EditarMantenimientoForm";
import { documentosService } from "@/app/services/documentosService";
import { mantenimientosService } from "@/app/services/mantenimientosService";

interface EquipoMantenimientoTabProps {
   equipoId: string;
   mantenimientos: Mantenimiento[];
   tiposMantenimiento: TipoMantenimiento[];
   proveedores: Proveedor[];
}

export function EquipoMantenimientoTab({ equipoId, mantenimientos, tiposMantenimiento, proveedores }: EquipoMantenimientoTabProps) {
   const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);

   const [hasDocs, setHasDocs] = useState(false);
   const [isLoadingDetails, setIsLoadingDetails] = useState(false);

   const router = useRouter();
   const { toast } = useToast();

   const canEdit = useHasPermission(['editar_mantenimientos']);
   const canDelete = useHasPermission(['eliminar_mantenimientos']);

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => mantenimientosService.delete(id),
      onSuccess: () => router.refresh(),
      successMessage: "El mantenimiento ha sido eliminado correctamente del historial del equipo.",
   });

   const handleEditClick = async (mantenimiento: Mantenimiento) => {
      setSelectedMantenimiento(mantenimiento);
      setIsLoadingDetails(true);

      try {
         const docs = await documentosService.getByMantenimiento(mantenimiento.id, { limit: 1 });
         setHasDocs(docs.length > 0);
         setIsEditModalOpen(true);
      } catch (error: any) {
         console.error("Error fetching docs", error);
         toast({
            variant: "destructive",
            title: "Error de conexión",
            description: error.message || "No se pudo verificar la documentación del mantenimiento.",
         });
      } finally {
         setIsLoadingDetails(false);
      }
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
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     {isLoadingDetails && selectedMantenimiento?.id === row.original.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                     ) : (
                        <MoreHorizontal className="h-4 w-4" />
                     )}
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  {canEdit && (
                     <DropdownMenuItem onClick={() => handleEditClick(row.original)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar / Cerrar
                     </DropdownMenuItem>
                  )}
                  {canDelete && (
                     <DropdownMenuItem
                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                        onClick={() => openAlert(row.original.id)}
                     >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                     </DropdownMenuItem>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   return (
      <div className="mt-4 space-y-4">

         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Eliminar mantenimiento?"
            description="Esta acción eliminará permanentemente este registro del historial del equipo."
         />

         {selectedMantenimiento && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
               <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                     <DialogTitle>Editar Mantenimiento</DialogTitle>
                  </DialogHeader>
                  <EditarMantenimientoForm
                     mantenimiento={selectedMantenimiento}
                     proveedores={proveedores}
                     tieneDocumentosAdjuntos={hasDocs}
                     onSuccess={() => {
                        setIsEditModalOpen(false);
                        setSelectedMantenimiento(null);
                        router.refresh();
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
               <DialogContent className="sm:max-w-150">
                  <DialogHeader>
                     <DialogTitle>Programar Nuevo Mantenimiento</DialogTitle>
                     <DialogDescription>
                        Complete los detalles para agendar una nueva tarea de mantenimiento para este equipo.
                     </DialogDescription>
                  </DialogHeader>
                  <ScheduleMantenimientoForm
                     equipoId={equipoId}
                     tiposMantenimiento={tiposMantenimiento}
                     proveedores={proveedores}
                     onSuccess={() => {
                        setIsScheduleModalOpen(false);
                        router.refresh();
                     }}
                  />
               </DialogContent>
            </Dialog>
         </div>

         <DataTable columns={columns} data={mantenimientos} filterColumn="tipo_mantenimiento" />
      </div>
   );
}
