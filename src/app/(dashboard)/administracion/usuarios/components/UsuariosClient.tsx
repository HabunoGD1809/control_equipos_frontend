"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Ban, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/components/ui/use-toast";
import { UsuarioForm } from "@/components/features/usuarios/UsuarioForm";
import { usuariosService } from "@/app/services/usuariosService";
import type { Usuario } from "@/types/api";

export function UsuariosClient() {
   const { toast } = useToast();

   const [data, setData] = useState<Usuario[]>([]);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedUser, setSelectedUser] = useState<Usuario | undefined>(undefined);
   const [showInactive, setShowInactive] = useState(false);

   const fetchUsuarios = useCallback(async () => {
      setLoading(true);
      try {
         const users = await usuariosService.getAll({ include_inactive: showInactive });
         setData(users);
      } catch {
         toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los usuarios.",
         });
      } finally {
         setLoading(false);
      }
   }, [toast, showInactive]);

   useEffect(() => {
      fetchUsuarios();
   }, [fetchUsuarios]);

   const filteredData = useMemo(() => {
      return data.filter((u) => showInactive || u.is_active !== false);
   }, [data, showInactive]);

   const handleEdit = (user: Usuario) => { setSelectedUser(user); setIsModalOpen(true); };
   const handleCreate = () => { setSelectedUser(undefined); setIsModalOpen(true); };

   const handleToggleBloqueo = async (user: Usuario) => {
      try {
         const nuevoEstado = !user.bloqueado;
         await usuariosService.update(user.id, { bloqueado: nuevoEstado });
         toast({
            title: "Estado actualizado",
            description: `Usuario ${user.nombre_usuario} ${nuevoEstado ? "bloqueado" : "desbloqueado"}.`,
         });
         fetchUsuarios();
      } catch {
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
         cell: ({ row }) => (
            <div className="flex flex-col gap-0.5">
               <div className="flex items-center gap-2">
                  <span className="font-medium">{row.original.nombre_usuario}</span>
                  {row.original.is_active === false && (
                     <Badge variant="outline" className="text-[10px] text-destructive border-destructive">Inactivo</Badge>
                  )}
               </div>
               {row.original.email && <span className="text-xs text-muted-foreground">{row.original.email}</span>}
            </div>
         ),
      },
      {
         // Mostramos el Departamento aquí
         accessorKey: "departamento_rel.nombre",
         header: "Departamento",
         cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.departamento_rel?.nombre || "--"}</span>
         ),
      },
      {
         accessorKey: "rol.nombre",
         header: "Rol",
         cell: ({ row }) => (
            <Badge variant="secondary" className="capitalize">{row.original.rol?.nombre}</Badge>
         ),
      },
      {
         accessorKey: "bloqueado",
         header: "Acceso",
         cell: ({ row }) => {
            if (row.original.is_active === false) return <Badge variant="secondary">Cuenta Eliminada</Badge>;
            return (
               <Badge variant={row.original.bloqueado ? "destructive" : "default"}>
                  {row.original.bloqueado ? "Bloqueado" : "Permitido"}
               </Badge>
            );
         },
      },
      {
         accessorKey: "ultimo_login",
         header: "Último Acceso",
         cell: ({ row }) => {
            const dateStr = row.original.ultimo_login;
            return dateStr
               ? format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: es })
               : "Nunca";
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
                     disabled={user.is_active === false}
                     className={
                        user.bloqueado
                           ? "text-green-600 hover:text-green-700"
                           : "text-destructive hover:text-destructive"
                     }
                  >
                     {user.bloqueado ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </Button>
               </div>
            );
         },
      },
   ];

   if (loading && data.length === 0) {
      return (
         <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      );
   }

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
               <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
               <Label htmlFor="show-inactive" className="text-sm text-muted-foreground cursor-pointer">
                  Mostrar eliminados
               </Label>
            </div>
            <div className="flex gap-2">
               <Button variant="outline" onClick={fetchUsuarios} disabled={loading} title="Actualizar lista">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
               </Button>
               <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
               </Button>
            </div>
         </div>

         <DataTable columns={columns} data={filteredData} tableContainerClassName="shadow-sm border rounded-md" />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-125">
               <DialogHeader>
                  <DialogTitle>{selectedUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
               </DialogHeader>
               <UsuarioForm
                  initialData={selectedUser}
                  onSuccess={() => { setIsModalOpen(false); fetchUsuarios(); }}
                  onCancel={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>
      </div>
   );
}
