"use client";

import { useCallback, useState } from "react";
import { Plus, Pencil, Ban, CheckCircle, Loader2, RefreshCw, Key, Copy } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";
import { UsuarioForm } from "@/components/features/usuarios/UsuarioForm";
import { usuariosService } from "@/app/services/usuariosService";
import { api } from "@/lib/http";
import type { Usuario, Rol } from "@/types/api";

export interface UsuariosClientProps {
   initialData: Usuario[];
   initialOptions: {
      roles: Rol[];
      departamentos: { value: string; label: string }[];
      empleados: { value: string; label: string }[];
   };
}

export function UsuariosClient({ initialData, initialOptions }: UsuariosClientProps) {
   const { toast } = useToast();

   // Inicializamos con la data que viene del servidor (SSR/RSC)
   const [data, setData] = useState<Usuario[]>(initialData);
   const [loading, setLoading] = useState(false); // Empieza en falso porque ya tenemos la data inicial
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedUser, setSelectedUser] = useState<Usuario | undefined>(undefined);

   const [isResetting, setIsResetting] = useState<string | null>(null);
   const [generatedTokenData, setGeneratedTokenData] = useState<{ username: string, token: string } | null>(null);

   const fetchUsuarios = useCallback(async () => {
      setLoading(true);
      try {
         const users = await usuariosService.getAll();
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
   }, [toast]);

   // Nota: Ya no necesitamos el useEffect de montaje porque initialData llena la tabla al instante.

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

   const handleRequestReset = async (user: Usuario) => {
      setIsResetting(user.id);
      try {
         const response = await api.post<{ username: string, reset_token: string }>("/auth/password-recovery/request-reset", {
            username_or_email: user.nombre_usuario
         });

         setGeneratedTokenData({
            username: response.username,
            token: response.reset_token
         });

         toast({
            title: "Token Generado",
            description: "El token temporal ha sido creado exitosamente.",
         });
      } catch (err) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo generar el token de reseteo.",
         });
      } finally {
         setIsResetting(null);
      }
   };

   const copyToClipboard = async (text: string) => {
      await navigator.clipboard.writeText(text);
      toast({ description: "Token copiado al portapapeles." });
   };

   const columns: ColumnDef<Usuario>[] = [
      {
         accessorKey: "nombre_usuario",
         header: "Usuario",
         cell: ({ row }) => (
            <div className="flex flex-col gap-0.5">
               <span className="font-medium">{row.original.nombre_usuario}</span>
               {row.original.email && <span className="text-xs text-muted-foreground">{row.original.email}</span>}
            </div>
         ),
      },
      {
         accessorKey: "departamento_rel.nombre",
         header: "Departamento",
         cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.departamento_rel?.nombre || "--"}</span>
         ),
      },
      {
         accessorKey: "empleado_rel.nombre_completo",
         header: "Empleado Vinculado",
         cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.empleado_rel?.nombre_completo || "--"}</span>
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
            const isGeneratingToken = isResetting === user.id;

            return (
               <div className="flex items-center gap-2 justify-end">
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => handleRequestReset(user)}
                     disabled={isGeneratingToken}
                     title="Generar token de recuperación"
                     className="text-amber-600 hover:text-amber-700 hover:bg-amber-600/10"
                  >
                     {isGeneratingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} title="Editar Usuario">
                     <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => handleToggleBloqueo(user)}
                     title={user.bloqueado ? "Desbloquear" : "Bloquear"}
                     className={
                        user.bloqueado
                           ? "text-green-600 hover:text-green-700 hover:bg-green-600/10"
                           : "text-destructive hover:text-destructive hover:bg-destructive/10"
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
         <div className="flex justify-end items-center mb-4">
            <div className="flex gap-2">
               <Button variant="outline" onClick={fetchUsuarios} disabled={loading} title="Actualizar lista">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
                  initialOptions={initialOptions} 
                  onSuccess={() => { setIsModalOpen(false); fetchUsuarios(); }}
                  onCancel={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         <Dialog open={!!generatedTokenData} onOpenChange={(open) => !open && setGeneratedTokenData(null)}>
            <DialogContent className="sm:max-w-md">
               <DialogHeader>
                  <DialogTitle>Token de Recuperación Generado</DialogTitle>
                  <DialogDescription>
                     Copia este token y envíaselo al usuario <b>{generatedTokenData?.username}</b>. Es válido por 15 minutos.
                  </DialogDescription>
               </DialogHeader>
               <div className="flex items-center space-x-2 pt-4">
                  <Input
                     readOnly
                     value={generatedTokenData?.token || ""}
                     className="font-mono text-sm"
                  />
                  <Button
                     size="icon"
                     className="shrink-0"
                     onClick={() => copyToClipboard(generatedTokenData?.token || "")}
                  >
                     <Copy className="h-4 w-4" />
                  </Button>
               </div>
               <div className="pt-4 flex justify-end">
                  <Button variant="secondary" onClick={() => setGeneratedTokenData(null)}>Cerrar</Button>
               </div>
            </DialogContent>
         </Dialog>
      </div>
   );
}
