"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Rol, Permiso } from "@/types/api";
import { RoleForm } from "@/components/features/roles/RoleForm";

interface RolesClientProps {
   initialData: Rol[];
   allPermissions: Permiso[];
}

export const RolesClient: React.FC<RolesClientProps> = ({ initialData, allPermissions }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedRole, setSelectedRole] = useState<Rol | null>(null);

   const handleEdit = (role: Rol) => {
      setSelectedRole(role);
      setIsModalOpen(true);
   };

   const handleNew = () => {
      setSelectedRole(null);
      setIsModalOpen(true);
   }

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
                  <DropdownMenuItem className="text-destructive focus:text-destructive">Eliminar Rol</DropdownMenuItem>
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
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Rol
               </Button>
            </div>
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

         <div className="mt-4">
            <DataTable columns={columns} data={initialData} />
         </div>
      </>
   );
}
