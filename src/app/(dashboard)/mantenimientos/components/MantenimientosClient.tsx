"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Mantenimiento, EquipoSimple, TipoMantenimiento, Proveedor } from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { MantenimientoForm } from "./MantenimientoForm";
import { Badge } from "@/components/ui/Badge";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useRouter } from "next/navigation";
import { EditarMantenimientoForm } from "./EditarMantenimientoForm";

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
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);
   const router = useRouter();

   const canSchedule = useHasPermission(['programar_mantenimientos']);
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
      <>
         {/* Modal de Creación */}
         <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
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
                  onSuccess={() => {
                     setIsCreateModalOpen(false);
                     router.refresh();
                  }}
               />
            </DialogContent>
         </Dialog>

         {/* Modal de Edición */}
         {selectedMantenimiento && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
               <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                     <DialogTitle>Editar Mantenimiento</DialogTitle>
                     <DialogDescription>
                        Actualiza el estado y los detalles de este mantenimiento.
                     </DialogDescription>
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
