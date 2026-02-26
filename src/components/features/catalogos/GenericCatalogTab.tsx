// [Manteniendo imports y lógica superior exactamente igual]
"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

import { GenericCatalogForm } from "./GenericCatalogForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { api } from "@/lib/http";

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

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => api.delete(`${apiEndpoint}/${id}`),
      onSuccess: async () => {
         const fresh = await api.get<GenericItem[]>(apiEndpoint);
         setItems(fresh);
      },
      successMessage: `El ítem ha sido eliminado correctamente del catálogo.`,
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
      { accessorKey: "nombre", header: "Nombre", cell: ({ row }) => <span className="font-medium">{row.getValue("nombre")}</span> },
      {
         accessorKey: "descripcion",
         header: "Descripción",
         cell: ({ row }) => <span className="text-muted-foreground">{(row.original as GenericItem).descripcion || "Sin descripción"}</span>,
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     <MoreHorizontal className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                     <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="text-destructive focus:text-destructive focus:bg-destructive/10"
                     onClick={() => openAlert(row.original.id)}
                  >
                     <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         ),
      },
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title={`¿Eliminar ${title}?`}
            description="Esta acción no se puede deshacer. Eliminar este ítem puede causar errores si está siendo utilizado en otros registros."
         />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedItem ? `Editar ${title}` : `Crear Nuevo ${title}`}</DialogTitle>
               </DialogHeader>
               <GenericCatalogForm
                  initialData={selectedItem ?? undefined}
                  apiEndpoint={apiEndpoint}
                  formFields={formFields}
                  onSuccess={async () => {
                     setIsModalOpen(false);
                     const fresh = await api.get<GenericItem[]>(apiEndpoint);
                     setItems(fresh);
                  }}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            <Button onClick={handleNew} className="shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo {title}
            </Button>
         </div>

         <DataTable
            columns={columns}
            data={items}
            filterColumn="nombre"
            tableContainerClassName="shadow-sm"
         />
      </div>
   );
};
