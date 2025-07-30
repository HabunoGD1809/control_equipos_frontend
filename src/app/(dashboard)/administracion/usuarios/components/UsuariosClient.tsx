"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Usuario, Rol } from "@/types/api";
import { UsuarioForm } from "@/components/features/usuarios/UsuarioForm";
import api from "@/lib/api";

interface UsuariosClientProps {
   initialData: Usuario[];
   roles: Rol[];
}

export const UsuariosClient: React.FC<UsuariosClientProps> = ({ initialData, roles }) => {
   const [usuarios, setUsuarios] = useState(initialData);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

   const handleSuccess = async () => {
      const response = await api.get('/usuarios/?limit=200'); // Consistent limit
      setUsuarios(response.data);
      setIsModalOpen(false);
      setSelectedUser(null);
   };

   const openModal = (user: Usuario | null = null) => {
      setSelectedUser(user);
      setIsModalOpen(true);
   };

   const columns: ColumnDef<Usuario>[] = [
      { accessorKey: "nombre_usuario", header: "Nombre de Usuario" },
      { accessorKey: "email", header: "Email" },
      {
         // ✅ CORRECCIÓN: Usar accessorFn para datos anidados
         accessorFn: (row) => row.rol.nombre,
         id: "rol",
         header: "Rol"
      },
      {
         accessorKey: "bloqueado",
         header: "Estado",
         cell: ({ row }) => (row.getValue("bloqueado") ? "Bloqueado" : "Activo"),
      },
      {
         id: "actions",
         cell: ({ row }) => {
            const usuario = row.original;
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
                     <DropdownMenuItem onClick={() => openModal(usuario)}>
                        Editar Usuario
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
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedUser ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>
                     {selectedUser ? "Modifica los datos del usuario." : "Completa el formulario para añadir un nuevo usuario."}
                  </DialogDescription>
               </DialogHeader>
               <UsuarioForm
                  roles={roles}
                  initialData={selectedUser}
                  onSuccess={handleSuccess}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            <Button onClick={() => openModal()}>
               <PlusCircle className="mr-2 h-4 w-4" />
               Añadir Usuario
            </Button>
         </div>

         <DataTable columns={columns} data={usuarios} filterColumn="nombre_usuario" />
      </>
   );
};
