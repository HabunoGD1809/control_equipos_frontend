"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import {
   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/AlertDialog";
import { GenericCatalogForm } from "./GenericCatalogForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

type GenericItem = {
   id: string;
   nombre: string;
   descripcion?: string;
   [key: string]: unknown;
};

interface GenericCatalogTabProps {
   data: GenericItem[];
   title: string;
   apiEndpoint: string;
   formFields: string[];
}

export const GenericCatalogTab: React.FC<GenericCatalogTabProps> = ({ data, title, apiEndpoint, formFields }) => {
   const [items, setItems] = useState(data);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<GenericItem | null>(null);
   const router = useRouter();

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation(title, async () => {
      const response = await api.get(apiEndpoint);
      setItems(response.data);
   });

   const handleEdit = (item: GenericItem) => {
      setSelectedItem(item);
      setIsModalOpen(true);
   };

   const handleNew = () => {
      setSelectedItem(null);
      setIsModalOpen(true);
   };

   const columns: ColumnDef<GenericItem>[] = [
      { accessorKey: "nombre", header: "Nombre" },
      { accessorKey: "descripcion", header: "Descripción", cell: ({ row }) => (row.original as GenericItem).descripcion || 'N/A' },
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
                     Esta acción no se puede deshacer. Eliminar este ítem puede causar errores si está siendo utilizado.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(`${apiEndpoint}/${itemToDelete}`)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedItem ? `Editar ${title}` : `Crear Nuevo ${title}`}</DialogTitle>
               </DialogHeader>
               <GenericCatalogForm
                  initialData={selectedItem ?? undefined}
                  apiEndpoint={apiEndpoint}
                  formFields={formFields}
                  onSuccess={() => {
                     setIsModalOpen(false);
                     router.refresh();
                  }}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            <Button onClick={handleNew}>
               <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo {title}
            </Button>
         </div>

         <DataTable columns={columns} data={items} filterColumn="nombre" />
      </>
   );
}
