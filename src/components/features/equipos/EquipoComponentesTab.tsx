"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";
import { ComponenteInfo, EquipoSimple } from "@/types/api";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { AddComponenteForm } from "./AddComponenteForm";

interface EquipoComponentesTabProps {
   equipoId: string;
   componentes: ComponenteInfo[];
   equiposDisponibles: EquipoSimple[];
}

export function EquipoComponentesTab({ equipoId, componentes, equiposDisponibles }: EquipoComponentesTabProps) {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const router = useRouter();

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Componente", () => router.refresh());

   const columns: ColumnDef<ComponenteInfo>[] = [
      { accessorFn: row => row.componente.nombre, id: "nombre", header: "Nombre" },
      { accessorFn: row => row.componente.numero_serie, id: "numero_serie", header: "Número de Serie" },
      { accessorKey: "cantidad", header: "Cantidad" },
      { accessorKey: "tipo_relacion", header: "Relación" },
      {
         id: "actions",
         cell: ({ row }) => (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => openAlert(row.original.id)}>
               <Trash2 className="h-4 w-4" />
            </Button>
         ),
      },
   ];

   return (
      <div className="mt-4 space-y-4">
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Desvincular componente?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no eliminará el equipo componente, solo lo desvinculará de este equipo padre.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(`/equipos/componentes/${itemToDelete}`)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                     {isDeleting ? "Desvinculando..." : "Sí, desvincular"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <div className="flex justify-end">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
               <DialogTrigger asChild>
                  <Button>
                     <PlusCircle className="mr-2 h-4 w-4" />
                     Añadir Componente
                  </Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Añadir Nuevo Componente</DialogTitle>
                     <DialogDescription>
                        Seleccione un equipo de la lista para añadirlo como componente de este activo.
                     </DialogDescription>
                  </DialogHeader>
                  <AddComponenteForm
                     equipoPadreId={equipoId}
                     equiposDisponibles={equiposDisponibles}
                     onSuccess={() => setIsModalOpen(false)}
                  />
               </DialogContent>
            </Dialog>
         </div>
         <DataTable columns={columns} data={componentes} filterColumn="nombre" />
      </div>
   );
}
