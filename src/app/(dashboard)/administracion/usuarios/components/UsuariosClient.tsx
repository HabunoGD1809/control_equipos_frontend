"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Ban, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/use-toast";
import { UsuarioForm } from "@/components/features/usuarios/UsuarioForm";
import { usuariosService } from "@/app/services/usuariosService";
import { useAuthStore } from "@/store/authStore";
import type { Usuario } from "@/types/api";

export function UsuariosClient() {
   const { toast } = useToast();
   const { isInitialized, isAuthenticated } = useAuthStore();

   const [data, setData] = useState<Usuario[]>([]);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedUser, setSelectedUser] = useState<Usuario | undefined>(undefined);

   const fetchUsuarios = useCallback(async () => {
      if (!isInitialized || !isAuthenticated) return;
      setLoading(true);
      try {
         const users = await usuariosService.getAll();
         setData(users);
      } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los usuarios.",
         });
      } finally {
         setLoading(false);
      }
   }, [isInitialized, isAuthenticated, toast]);

   useEffect(() => {
      if (isInitialized && isAuthenticated) {
         fetchUsuarios();
      } else if (isInitialized && !isAuthenticated) {
         setLoading(false);
      }
   }, [isInitialized, isAuthenticated, fetchUsuarios]);

   const handleEdit = (user: Usuario) => {
      setSelectedUser(user);
      setIsModalOpen(true);
   };

   const handleCreate = () => {
      setSelectedUser(undefined);
      setIsModalOpen(true);
   };

   const handleToggleBloqueo = async (user: Usuario) => {
      try {
         const nuevoEstado = !user.bloqueado;
         await usuariosService.update(user.id, { bloqueado: nuevoEstado });
         toast({
            title: "Estado actualizado",
            description: `Usuario ${user.nombre_usuario} ${nuevoEstado ? "bloqueado" : "desbloqueado"}.`,
         });
         fetchUsuarios();
      } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo actualizar el estado del usuario.",
         });
      }
   };

   const columns: ColumnDef<Usuario>[] = [
      {
         accessorKey: "nombre_usuario",
         header: "Usuario",
         cell: ({ row }) => <span className="font-medium">{row.original.nombre_usuario}</span>,
      },
      {
         accessorKey: "email",
         header: "Email",
         cell: ({ row }) => <span className="text-muted-foreground">{row.original.email || "--"}</span>
      },
      {
         accessorKey: "rol.nombre",
         header: "Rol",
         cell: ({ row }) => (
            <Badge variant="secondary" className="capitalize">
               {row.original.rol?.nombre}
            </Badge>
         ),
      },
      {
         accessorKey: "bloqueado",
         header: "Estado",
         cell: ({ row }) => (
            <Badge variant={row.original.bloqueado ? "destructive" : "success"}>
               {row.original.bloqueado ? "Bloqueado" : "Activo"}
            </Badge>
         ),
      },
      {
         accessorKey: "ultimo_login",
         header: "Último Acceso",
         cell: ({ row }) => {
            const dateStr = row.original.ultimo_login;
            return dateStr ? format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: es }) : "Nunca";
         },
      },
      {
         id: "actions",
         cell: ({ row }) => {
            const user = row.original;
            return (
               <div className="flex items-center gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} title="Editar Usuario">
                     <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => handleToggleBloqueo(user)}
                     title={user.bloqueado ? "Desbloquear" : "Bloquear"}
                     className={user.bloqueado ? "text-green-600 hover:text-green-700" : "text-destructive hover:text-destructive"}
                  >
                     {user.bloqueado ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </Button>
               </div>
            );
         },
      },
   ];

   if (!isInitialized || (loading && data.length === 0)) {
      return (
         <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      );
   }

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <div className="flex justify-end items-center mb-4">
            <div className="flex gap-2">
               <Button variant="outline" onClick={fetchUsuarios} disabled={loading} title="Actualizar lista">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
               </Button>
               <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
               </Button>
            </div>
         </div>

         <DataTable columns={columns} data={data} tableContainerClassName="shadow-sm border rounded-md" />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-125">
               <DialogHeader>
                  <DialogTitle>{selectedUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
               </DialogHeader>
               <UsuarioForm
                  initialData={selectedUser}
                  onSuccess={() => {
                     setIsModalOpen(false);
                     fetchUsuarios();
                  }}
                  onCancel={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>
      </div>
   );
}
