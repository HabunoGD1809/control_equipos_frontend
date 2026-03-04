"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { PageHeader } from "@/components/layout/PageHeader";

import type { Mantenimiento, EquipoSimple, TipoMantenimiento, Proveedor } from "@/types/api";
import { EstadoMantenimientoEnum } from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";

import { MantenimientoForm } from "./MantenimientoForm";
import { EditarMantenimientoForm } from "@/components/features/mantenimientos/EditarMantenimientoForm";
import { documentosService } from "@/app/services/documentosService";
import { mantenimientosService } from "@/app/services/mantenimientosService";

interface MantenimientosClientProps {
   initialData: Mantenimiento[];
   equipos: EquipoSimple[];
   tiposMantenimiento: TipoMantenimiento[];
   proveedores: Proveedor[];
}

function getErrorMessage(err: unknown, fallback: string): string {
   if (typeof err === "object" && err !== null) {
      const errorObj = err as Record<string, unknown>;
      const data = errorObj.data as Record<string, unknown>;
      const detail = data?.detail || errorObj.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      if (typeof errorObj.message === "string" && errorObj.message.trim()) return errorObj.message;
   }
   return fallback;
}

export function MantenimientosClient({ initialData, equipos, tiposMantenimiento, proveedores }: MantenimientosClientProps) {
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);
   const [isRefreshing, setIsRefreshing] = useState(false);

   const [hasDocs, setHasDocs] = useState(false);
   const [isLoadingDetails, setIsLoadingDetails] = useState(false);

   const router = useRouter();
   const { toast } = useToast();

   const canSchedule = useHasPermission(["programar_mantenimientos"]);
   const canEdit = useHasPermission(["editar_mantenimientos"]);
   const canDelete = useHasPermission(["eliminar_mantenimientos"]);

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => mantenimientosService.delete(id),
      onSuccess: () => router.refresh(),
      successMessage: "El registro de mantenimiento ha sido eliminado permanentemente.",
   });

   const handleRefresh = () => {
      setIsRefreshing(true);
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 800);
   };

   const handleEditClick = async (mantenimiento: Mantenimiento) => {
      setSelectedMantenimiento(mantenimiento);
      setIsLoadingDetails(true);

      try {
         const docs = await documentosService.getByMantenimiento(mantenimiento.id, { limit: 1 });
         setHasDocs(docs.length > 0);
         setIsEditModalOpen(true);
      } catch (error: unknown) {
         toast({
            variant: "destructive",
            title: "Error de conexión",
            description: getErrorMessage(error, "No se pudo verificar la documentación del mantenimiento."),
         });
      } finally {
         setIsLoadingDetails(false);
      }
   };

   const columns: ColumnDef<Mantenimiento>[] = [
      {
         accessorFn: (row) => row.equipo.nombre,
         id: "equipo_nombre",
         header: "Equipo",
         cell: ({ row }) => <span className="font-semibold text-foreground">{row.getValue("equipo_nombre")}</span>
      },
      {
         accessorFn: (row) => row.tipo_mantenimiento.nombre,
         id: "tipo_mantenimiento",
         header: "Tipo",
         cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("tipo_mantenimiento")}</span>
      },
      {
         accessorKey: "fecha_programada",
         header: "Fecha Programada",
         cell: ({ row }) => {
            const date = row.getValue("fecha_programada");
            return date ? format(new Date(date as string), "PP", { locale: es }) : "N/A";
         },
      },
      {
         accessorKey: "estado",
         header: "Estado",
         cell: ({ row }) => {
            const estado = row.getValue("estado") as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
            if (estado === EstadoMantenimientoEnum.Completado) variant = "default";
            if (estado === EstadoMantenimientoEnum.Cancelado) variant = "destructive";
            if (estado === EstadoMantenimientoEnum.EnProceso) variant = "outline";
            if (estado === EstadoMantenimientoEnum.RequierePiezas) variant = "destructive";
            return <Badge variant={variant} className="shadow-sm">{estado}</Badge>;
         },
      },
      {
         accessorKey: "tecnico_responsable",
         header: "Técnico Asignado",
         cell: ({ row }) => <span className="capitalize">{row.getValue("tecnico_responsable") || "--"}</span>
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     {isLoadingDetails && selectedMantenimiento?.id === row.original.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                     ) : (
                        <MoreHorizontal className="h-4 w-4" />
                     )}
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-44 shadow-md">
                  {canEdit && (
                     <DropdownMenuItem onClick={() => handleEditClick(row.original)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4 text-primary" /> Gestionar / Cerrar
                     </DropdownMenuItem>
                  )}
                  {canDelete && (
                     <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                        onClick={() => openAlert(row.original.id)}
                     >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                     </DropdownMenuItem>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         ),
      },
   ];

   return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <PageHeader
            title="Gestión de Mantenimientos"
            description="Programa, visualiza y gestiona todos los mantenimientos de los equipos."
            actions={
               <>
                  <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} title="Sincronizar lista">
                     <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  {canSchedule && (
                     <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Programar Mantenimiento
                     </Button>
                  )}
               </>
            }
         />

         <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>Programar Intervención</DialogTitle>
                  <DialogDescription>Agende una nueva revisión o reparación técnica para un equipo.</DialogDescription>
               </DialogHeader>

               <MantenimientoForm
                  equipos={equipos}
                  tiposMantenimiento={tiposMantenimiento}
                  proveedores={proveedores}
                  onSuccess={() => {
                     setIsCreateModalOpen(false);
                     router.refresh();
                  }}
               />
            </DialogContent>
         </Dialog>

         {selectedMantenimiento && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
               <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="border-b pb-4">
                     <DialogTitle className="text-lg text-primary">Detalle de Mantenimiento</DialogTitle>
                     <DialogDescription className="text-foreground font-medium mt-1">
                        {selectedMantenimiento.equipo.nombre} <span className="text-muted-foreground mx-2">|</span> Tarea: {selectedMantenimiento.tipo_mantenimiento.nombre}
                     </DialogDescription>
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

         <DataTable
            columns={columns}
            data={initialData}
            filterColumn="equipo_nombre"
            tableContainerClassName="shadow-sm border rounded-lg bg-card"
         />

         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Eliminar intervención?"
            description="Esta acción eliminará el registro del mantenimiento de forma irreversible."
         />
      </div>
   );
}
