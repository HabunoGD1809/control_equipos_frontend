"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/use-toast";

import type { Mantenimiento, EquipoSimple, TipoMantenimiento, Proveedor } from "@/types/api";
import { EstadoMantenimientoEnum } from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";

import { MantenimientoForm } from "./MantenimientoForm";
import { EditarMantenimientoForm } from "./EditarMantenimientoForm";
import { documentosService } from "@/app/services/documentosService";

interface MantenimientosClientProps {
   initialData: Mantenimiento[];
   equipos: EquipoSimple[];
   tiposMantenimiento: TipoMantenimiento[];
   proveedores: Proveedor[];
}

function getErrorMessage(err: unknown, fallback: string) {
   if (typeof err === "object" && err) {
      const anyErr = err as any;
      const detail = anyErr?.data?.detail || anyErr?.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      if (typeof anyErr?.message === "string" && anyErr.message.trim()) return anyErr.message;
   }
   return fallback;
}

export function MantenimientosClient({ initialData, equipos, tiposMantenimiento, proveedores }: MantenimientosClientProps) {
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);

   const [hasDocs, setHasDocs] = useState(false);
   const [isLoadingDetails, setIsLoadingDetails] = useState(false);

   const router = useRouter();
   const { toast } = useToast();

   const canSchedule = useHasPermission(["programar_mantenimientos"]);
   const canEdit = useHasPermission(["editar_mantenimientos"]);
   const canDelete = useHasPermission(["eliminar_mantenimientos"]);

   const { openAlert } = useDeleteConfirmation("Mantenimiento", () => router.refresh());

   const handleEditClick = async (mantenimiento: Mantenimiento) => {
      setSelectedMantenimiento(mantenimiento);
      setIsLoadingDetails(true);

      try {
         const docs = await documentosService.getByMantenimiento(mantenimiento.id, { limit: 1 });
         setHasDocs(docs.length > 0);
         setIsEditModalOpen(true);
      } catch (error) {
         console.error("Error fetching docs", error);
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
      },
      {
         accessorFn: (row) => row.tipo_mantenimiento.nombre,
         id: "tipo_mantenimiento",
         header: "Tipo",
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
            return <Badge variant={variant}>{estado}</Badge>;
         },
      },
      {
         accessorKey: "tecnico_responsable",
         header: "Técnico",
      },
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
                        <Edit className="mr-2 h-4 w-4" /> Gestionar / Cerrar
                     </DropdownMenuItem>
                  )}
                  {canDelete && (
                     <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
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
      <>
         {/* Modal Crear */}
         <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-150">
               <DialogHeader>
                  <DialogTitle>Programar Mantenimiento</DialogTitle>
                  <DialogDescription>Agende una nueva intervención técnica.</DialogDescription>
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
               <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                     <DialogTitle>Gestión de Mantenimiento</DialogTitle>
                     <DialogDescription>
                        {selectedMantenimiento.equipo.nombre} - {selectedMantenimiento.tipo_mantenimiento.nombre}
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

         <div className="flex justify-end mb-4">
            {canSchedule && (
               <Button onClick={() => setIsCreateModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Programar Mantenimiento
               </Button>
            )}
         </div>

         <DataTable columns={columns} data={initialData} filterColumn="equipo_nombre" />
      </>
   );
}
