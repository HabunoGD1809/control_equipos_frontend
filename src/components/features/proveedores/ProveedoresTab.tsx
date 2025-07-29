"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Proveedor } from "@/types/api";
import { ProveedorForm } from "./ProveedorForm";

interface ProveedoresTabProps {
   data: Proveedor[];
}

export const ProveedoresTab: React.FC<ProveedoresTabProps> = ({ data }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<Proveedor | null>(null);

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
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Proveedor
               </Button>
            </div>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedItem ? `Editar Proveedor` : `Crear Nuevo Proveedor`}</DialogTitle>
                  <DialogDescription>
                     {selectedItem ? "Modifique los detalles del proveedor." : "Complete los datos para crear un nuevo proveedor."}
                  </DialogDescription>
               </DialogHeader>
               <ProveedorForm
                  initialData={selectedItem}
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
