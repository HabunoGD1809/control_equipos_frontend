"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Proveedor } from "@/types/api";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useRouter } from "next/navigation";
import { ProveedorForm } from "@/components/features/proveedores/ProveedorForm";
import api from "@/lib/api";

interface ProveedoresClientProps {
   initialData: Proveedor[];
}

export const ProveedoresClient: React.FC<ProveedoresClientProps> = ({ initialData }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
   const router = useRouter();

   const {
      isAlertOpen,
      isDeleting,
      openAlert,
      setIsAlertOpen,
      handleDelete,
      itemToDelete
   } = useDeleteConfirmation("Proveedor", () => {
      router.refresh();
   });

   const handleSuccess = () => {
      setIsModalOpen(false);
      setSelectedProveedor(null);
      router.refresh();
   };

   const openModal = (proveedor: Proveedor | null = null) => {
      setSelectedProveedor(proveedor);
      setIsModalOpen(true);
   };

   const columns: ColumnDef<Proveedor>[] = [
      { accessorKey: "nombre", header: "Nombre" },
      { accessorKey: "contacto", header: "Contacto" },
      { accessorKey: "sitio_web", header: "Sitio Web" },
      { accessorKey: "rnc", header: "RNC / ID Fiscal" },
      {
         id: "actions",
         cell: ({ row }) => {
            const proveedor = row.original;
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
                     <DropdownMenuItem onClick={() => openModal(proveedor)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => openAlert(proveedor.id)}
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
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[625px]">
               <DialogHeader>
                  <DialogTitle>{selectedProveedor ? "Editar Proveedor" : "Crear Nuevo Proveedor"}</DialogTitle>
                  <DialogDescription>
                     {selectedProveedor ? "Modifica los datos del proveedor." : "Completa el formulario para añadir un nuevo proveedor."}
                  </DialogDescription>
               </DialogHeader>
               <ProveedorForm
                  initialData={selectedProveedor}
                  onSuccess={handleSuccess}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            <Button onClick={() => openModal()}>
               <PlusCircle className="mr-2 h-4 w-4" />
               Añadir Proveedor
            </Button>
         </div>

         <DataTable columns={columns} data={initialData} filterColumn="nombre" />
      </>
   );
};
