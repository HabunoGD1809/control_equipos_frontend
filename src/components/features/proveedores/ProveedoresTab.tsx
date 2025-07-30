"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import {
   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/AlertDialog";
import { Proveedor } from "@/types/api";
import { ProveedorForm } from "./ProveedorForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import api from "@/lib/api";

interface ProveedoresTabProps {
   data: Proveedor[];
}

export const ProveedoresTab: React.FC<ProveedoresTabProps> = ({ data }) => {
   const [proveedores, setProveedores] = useState(data);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<Proveedor | null>(null);

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Proveedor", async () => {
      const response = await api.get('/proveedores/');
      setProveedores(response.data);
   });

   const handleSuccess = async () => {
      setIsModalOpen(false);
      const response = await api.get('/proveedores/');
      setProveedores(response.data);
   };

   const handleEdit = (item: Proveedor) => {
      setSelectedItem(item);
      setIsModalOpen(true);
   };

   const handleNew = () => {
      setSelectedItem(null);
      setIsModalOpen(true);
   };

   const columns: ColumnDef<Proveedor>[] = [
      { accessorKey: "nombre", header: "Nombre" },
      { accessorKey: "contacto", header: "Contacto" },
      { accessorKey: "sitio_web", header: "Sitio Web" },
      { accessorKey: "rnc", header: "RNC / ID Fiscal" },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openAlert(row.original.id)}>
                     <Trash2 className="mr-2 h-4 w-4" />Eliminar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   return (
      <>
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no se puede deshacer. Eliminar un proveedor puede causar errores si está asociado a equipos o licencias.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(`/proveedores/${itemToDelete}`)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedItem ? `Editar Proveedor` : `Crear Nuevo Proveedor`}</DialogTitle>
                  <DialogDescription>
                     {selectedItem ? "Modifique los detalles del proveedor." : "Complete los datos para crear un nuevo proveedor."}
                  </DialogDescription>
               </DialogHeader>
               <ProveedorForm
                  initialData={selectedItem}
                  onSuccess={handleSuccess}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            <Button onClick={handleNew}>
               <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Proveedor
            </Button>
         </div>

         <DataTable columns={columns} data={proveedores} filterColumn="nombre" />
      </>
   );
}
