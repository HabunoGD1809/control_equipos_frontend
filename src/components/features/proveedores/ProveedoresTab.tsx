"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
   MoreHorizontal,
   PlusCircle,
   Trash2,
   Pencil,
   Globe,
   Mail,
   Building2
} from "lucide-react";

import { Proveedor } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { ProveedorForm } from "./ProveedorForm";
import { useRouter } from "next/navigation";

interface ProveedoresTabProps {
   data: Proveedor[];
}

export const ProveedoresTab: React.FC<ProveedoresTabProps> = ({ data }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
   const router = useRouter();

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Proveedor");

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
      router.refresh(); // Recarga los datos del servidor
   };

   const columns: ColumnDef<Proveedor>[] = [
      {
         accessorKey: "nombre",
         header: "Empresa",
         cell: ({ row }) => (
            <div className="flex items-center gap-2">
               <Building2 className="h-4 w-4 text-muted-foreground" />
               <span className="font-medium">{row.getValue("nombre")}</span>
            </div>
         )
      },
      {
         accessorKey: "rnc",
         header: "RNC / ID",
         cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("rnc") || "N/A"}</span>
      },
      {
         accessorKey: "contacto",
         header: "Contacto",
         cell: ({ row }) => {
            const email = row.getValue("contacto") as string;
            return email ? (
               <div className="flex items-center gap-1 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {email}
               </div>
            ) : "-";
         }
      },
      {
         accessorKey: "sitio_web",
         header: "Sitio Web",
         cell: ({ row }) => {
            const url = row.getValue("sitio_web") as string;
            return url ? (
               <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Link
               </a>
            ) : "-";
         }
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
                     className="text-destructive focus:text-destructive"
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
      <>
         <div className="flex justify-end mb-4">
            <Button onClick={handleCreate}>
               <PlusCircle className="mr-2 h-4 w-4" /> Registrar Proveedor
            </Button>
         </div>

         <DataTable columns={columns} data={data} filterColumn="nombre" />

         {/* Modal de Creación/Edición */}
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
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

         {/* Alerta de Eliminación */}
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro de eliminar este proveedor?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no se puede deshacer. Si el proveedor tiene equipos o licencias asociadas, la operación podría ser rechazada por el servidor.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => handleDelete(`/proveedores/${itemToDelete}`)}
                     disabled={isDeleting}
                     className="bg-destructive hover:bg-destructive/90"
                  >
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   );
};
