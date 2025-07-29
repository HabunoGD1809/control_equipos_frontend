"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { GenericCatalogForm } from "./GenericCatalogForm";

type GenericItem = {
   id: string;
   nombre: string;
   descripcion?: string;
   [key: string]: any;
};

interface GenericCatalogTabProps {
   data: GenericItem[];
   title: string;
   apiEndpoint: string;
   formFields: string[];
}

export const GenericCatalogTab: React.FC<GenericCatalogTabProps> = ({ data, title, apiEndpoint, formFields }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<GenericItem | null>(null);

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
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   return (
      <>
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <div className="flex justify-end">
               <Button onClick={handleNew}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo {title}
               </Button>
            </div>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedItem ? `Editar ${title}` : `Crear Nuevo ${title}`}</DialogTitle>
               </DialogHeader>
               <GenericCatalogForm
                  initialData={selectedItem}
                  apiEndpoint={apiEndpoint}
                  formFields={formFields}
                  onSuccess={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>
         <div className="mt-4">
            <DataTable columns={columns} data={data} />
         </div>
      </>
   );
}
