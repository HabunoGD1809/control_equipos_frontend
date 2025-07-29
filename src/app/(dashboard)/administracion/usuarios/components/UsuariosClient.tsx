"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { Usuario, Rol } from "@/types/api";
import { UsuarioForm } from "@/components/features/usuarios/UsuarioForm";

interface UsuariosClientProps {
   initialData: Usuario[];
   roles: Rol[];
}

export const UsuariosClient: React.FC<UsuariosClientProps> = ({ initialData, roles }) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

   const handleEdit = (user: Usuario) => {
      setSelectedUser(user);
      setIsModalOpen(true);
   };

   const handleNew = () => {
      setSelectedUser(null);
      setIsModalOpen(true);
   }

   const columns: ColumnDef<Usuario>[] = [
      { accessorKey: "nombre_usuario", header: "Usuario" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "rol.nombre", header: "Rol", cell: ({ row }) => row.original.rol.nombre },
      {
         accessorKey: "bloqueado",
         header: "Estado",
         cell: ({ row }) => (
            <Badge variant={row.getValue("bloqueado") ? "destructive" : "default"}>
               {row.getValue("bloqueado") ? "Bloqueado" : "Activo"}
            </Badge>
         )
      },
      {
         accessorKey: "ultimo_login",
         header: "Último Login",
         cell: ({ row }) => row.original.ultimo_login ? format(new Date(row.original.ultimo_login), "Pp", { locale: es }) : 'Nunca'
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive">Eliminar</DropdownMenuItem>
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
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Usuario
               </Button>
            </div>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedUser ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>
                     {selectedUser ? "Modifique los detalles del usuario." : "Complete los datos para crear un nuevo usuario."}
                  </DialogDescription>
               </DialogHeader>
               <UsuarioForm
                  initialData={selectedUser}
                  roles={roles}
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
