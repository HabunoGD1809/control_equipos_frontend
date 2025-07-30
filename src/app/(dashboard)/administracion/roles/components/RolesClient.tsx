"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import {
   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/AlertDialog";
import { Rol, Permiso } from "@/types/api";
import { RoleForm } from "@/components/features/roles/RoleForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import api from "@/lib/api";

interface RolesClientProps {
   initialData: Rol[];
   allPermissions: Permiso[];
}

export const RolesClient: React.FC<RolesClientProps> = ({ initialData, allPermissions }) => {
   const [roles, setRoles] = useState(initialData);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedRole, setSelectedRole] = useState<Rol | null>(null);

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Rol", async () => {
      const response = await api.get('/gestion/roles/');
      setRoles(response.data);
   });

   const handleEdit = (role: Rol) => {
      setSelectedRole(role);
      setIsModalOpen(true);
   };

   const handleNew = () => {
      setSelectedRole(null);
      setIsModalOpen(true);
   };

   const columns: ColumnDef<Rol>[] = [
      { accessorKey: "nombre", header: "Rol" },
      { accessorKey: "descripcion", header: "Descripción" },
      {
         id: "permisos",
         header: "Permisos",
         cell: ({ row }) => <span className="font-bold">{row.original.permisos.length}</span>
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)}>Editar Permisos</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openAlert(row.original.id)}>
                     <Trash2 className="mr-2 h-4 w-4" />Eliminar Rol
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
                     Esta acción no se puede deshacer. Eliminar un rol puede afectar a los usuarios que lo tengan asignado.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(`/gestion/roles/${itemToDelete}`)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl">
               <DialogHeader>
                  <DialogTitle>{selectedRole ? `Editar Rol: ${selectedRole.nombre}` : "Crear Nuevo Rol"}</DialogTitle>
                  <DialogDescription>
                     {selectedRole ? "Modifique los detalles y permisos del rol." : "Complete los datos para crear un nuevo rol y asigne sus permisos."}
                  </DialogDescription>
               </DialogHeader>
               <RoleForm
                  initialData={selectedRole}
                  allPermissions={allPermissions}
                  onSuccess={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>
         <div className="flex justify-end mb-4">
            <Button onClick={handleNew}>
               <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Rol
            </Button>
         </div>
         <div className="mt-4">
            <DataTable columns={columns} data={roles} filterColumn="nombre" />
         </div>
      </>
   );
}
