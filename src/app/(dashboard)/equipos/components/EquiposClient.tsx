"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import {
   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/AlertDialog";
import { EquipoRead, EstadoEquipo, Proveedor } from "@/types/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { EquipoForm } from "@/components/features/equipos/EquipoForm";
import api from "@/lib/api";

interface EquiposClientProps {
   initialData: EquipoRead[];
   estados: EstadoEquipo[];
   proveedores: Proveedor[];
}

export const EquiposClient: React.FC<EquiposClientProps> = ({ initialData, estados, proveedores }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedEquipo, setSelectedEquipo] = useState<EquipoRead | null>(null);
   const router = useRouter();

   const {
      isAlertOpen,
      isDeleting,
      openAlert,
      setIsAlertOpen,
      handleDelete,
      itemToDelete
   } = useDeleteConfirmation("Equipo", () => {
      router.refresh();
   });

   const handleSuccess = () => {
      setIsModalOpen(false);
      setSelectedEquipo(null);
      router.refresh();
   };

   const openModal = (equipo: EquipoRead | null = null) => {
      setSelectedEquipo(equipo);
      setIsModalOpen(true);
   };

   const columns: ColumnDef<EquipoRead>[] = [
      {
         accessorKey: "nombre",
         header: "Nombre",
         cell: ({ row }) => (
            <span
               className="font-medium cursor-pointer hover:underline text-primary"
               onClick={() => router.push(`/equipos/${row.original.id}`)}
            >
               {row.original.nombre}
            </span>
         )
      },
      { accessorKey: "numero_serie", header: "Número de Serie" },
      { accessorKey: "marca", header: "Marca" },
      { accessorKey: "modelo", header: "Modelo" },
      {
         accessorFn: (row) => row.estado?.nombre || 'N/A',
         id: "estado",
         header: "Estado",
      },
      { accessorKey: "ubicacion_actual", header: "Ubicación" },
      {
         accessorKey: "fecha_adquisicion",
         header: "Fecha de Adquisición",
         cell: ({ row }) => {
            const fecha = row.original.fecha_adquisicion;
            return fecha ? format(new Date(fecha), "dd MMM yyyy", { locale: es }) : 'N/A';
         }
      },
      {
         id: "actions",
         cell: ({ row }) => {
            const equipo = row.original;
            return (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                     <DropdownMenuItem onClick={() => router.push(`/equipos/${equipo.id}`)}>
                        Ver Detalles
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => openModal(equipo)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => openAlert(equipo.id)}
                     >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            );
         },
      },
   ];

   return (
      <>
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro de eliminar este equipo?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no se puede deshacer. Se eliminará el equipo y todos sus datos asociados.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => handleDelete(`/equipos/${itemToDelete}`)}
                     disabled={isDeleting}
                     className="bg-destructive hover:bg-destructive/90"
                  >
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[625px]">
               <DialogHeader>
                  <DialogTitle>{selectedEquipo ? "Editar Equipo" : "Crear Nuevo Equipo"}</DialogTitle>
                  <DialogDescription>
                     {selectedEquipo ? "Modifica los datos del equipo." : "Completa el formulario para añadir un nuevo equipo."}
                  </DialogDescription>
               </DialogHeader>
               <EquipoForm
                  initialData={selectedEquipo}
                  estados={estados}
                  proveedores={proveedores}
                  onSuccess={handleSuccess}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-between items-center mb-4">
            <div>
               <h1 className="text-3xl font-bold">Gestión de Equipos</h1>
               <p className="text-muted-foreground">Crea, edita y gestiona todos los equipos de la organización.</p>
            </div>
            <Button onClick={() => openModal()}>
               <PlusCircle className="mr-2 h-4 w-4" />
               Añadir Equipo
            </Button>
         </div>

         <DataTable columns={columns} data={initialData} filterColumn="nombre" />
      </>
   );
};
