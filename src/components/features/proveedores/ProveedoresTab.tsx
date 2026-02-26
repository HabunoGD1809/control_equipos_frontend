"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Building2, Mail, Globe } from "lucide-react";

import { Proveedor } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

import { ProveedorForm } from "./ProveedorForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { api } from "@/lib/http";

interface ProveedoresTabProps {
   data: Proveedor[];
}

export const ProveedoresTab: React.FC<ProveedoresTabProps> = ({ data }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
   const router = useRouter();

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => api.delete(`/proveedores/${id}`),
      onSuccess: () => router.refresh(),
      successMessage: "El proveedor ha sido eliminado correctamente."
   });

   const handleEdit = (proveedor: Proveedor) => {
      setSelectedProveedor(proveedor);
      setIsModalOpen(true);
   };

   const handleCreate = () => {
      setSelectedProveedor(null);
      setIsModalOpen(true);
   };

   const handleSuccess = () => {
      setIsModalOpen(false);
      router.refresh();
   };

   const columns: ColumnDef<Proveedor>[] = [
      {
         accessorKey: "nombre",
         header: "Empresa",
         cell: ({ row }) => (
            <div className="flex items-center gap-2 font-medium">
               <Building2 className="h-4 w-4 text-muted-foreground" />
               {row.getValue("nombre")}
            </div>
         )
      },
      {
         accessorKey: "rnc",
         header: "RNC / ID Fiscal",
         cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("rnc") || "N/A"}</span>
      },
      {
         accessorKey: "contacto",
         header: "Contacto",
         cell: ({ row }) => {
            const email = row.getValue("contacto") as string;
            return email ? (
               <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" /> {email}
               </div>
            ) : <span className="text-muted-foreground">-</span>;
         }
      },
      {
         accessorKey: "sitio_web",
         header: "Sitio Web",
         cell: ({ row }) => {
            const url = row.getValue("sitio_web") as string;
            return url ? (
               <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                  <Globe className="h-3 w-3" /> Link
               </a>
            ) : <span className="text-muted-foreground">-</span>;
         }
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     <span className="sr-only">Abrir menú</span>
                     <MoreHorizontal className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                     <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="text-destructive focus:text-destructive focus:bg-destructive/10"
                     onClick={() => openAlert(row.original.id)}
                  >
                     <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <div className="flex justify-end mb-4">
            <Button onClick={handleCreate} className="shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" /> Registrar Proveedor
            </Button>
         </div>

         <DataTable
            columns={columns}
            data={data}
            filterColumn="nombre"
            tableContainerClassName="shadow-sm"
         />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-150">
               <DialogHeader>
                  <DialogTitle>{selectedProveedor ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}</DialogTitle>
                  <DialogDescription>
                     Gestione la información de contacto y fiscal de sus suplidores.
                  </DialogDescription>
               </DialogHeader>
               <ProveedorForm
                  initialData={selectedProveedor ?? undefined}
                  onSuccess={handleSuccess}
               />
            </DialogContent>
         </Dialog>

         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Está seguro de eliminar este proveedor?"
            description="Esta acción no se puede deshacer. Los datos del proveedor se eliminarán del sistema permanentemente. La operación podría ser rechazada si el proveedor tiene equipos asociados."
         />
      </div>
   );
};
