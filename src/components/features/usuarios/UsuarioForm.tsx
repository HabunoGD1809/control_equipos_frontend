"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { usuarioCreateSchema, usuarioUpdateSchema } from "@/lib/zod";
import { usuariosService } from "@/app/services/usuariosService";
import { rolesService } from "@/app/services/rolesService";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import type { Usuario, Rol } from "@/types/api";

type CreateValues = z.infer<typeof usuarioCreateSchema>;
type UpdateValues = z.infer<typeof usuarioUpdateSchema>;

interface UsuarioFormProps {
   initialData?: Usuario;
   onSuccess: () => void;
   onCancel: () => void;
}

export function UsuarioForm({ initialData, onSuccess, onCancel }: UsuarioFormProps) {
   const { toast } = useToast();
   const isEditing = !!initialData;

   const { isInitialized, isAuthenticated } = useAuthStore();

   const [isSubmitting, setIsSubmitting] = useState(false);
   const [roles, setRoles] = useState<Rol[]>([]);
   const [loadingRoles, setLoadingRoles] = useState(true);

   useEffect(() => {
      if (!isInitialized || !isAuthenticated) return;

      const fetchRoles = async () => {
         try {
            const data = await rolesService.getAll();
            setRoles(data);
         } catch {
            toast({
               variant: "destructive",
               title: "Error",
               description: "No se pudieron cargar los roles.",
            });
         } finally {
            setLoadingRoles(false);
         }
      };

      fetchRoles();
   }, [isInitialized, isAuthenticated, toast]);

   // ── Formulario CREACIÓN ──────────────────────────────────────────────────────
   const createForm = useForm<CreateValues>({
      resolver: standardSchemaResolver(usuarioCreateSchema),
      defaultValues: {
         nombre_usuario: "",
         email: "",
         password: "",
         rol_id: "",
      },
   });

   // ── Formulario EDICIÓN ───────────────────────────────────────────────────────
   const updateForm = useForm<UpdateValues>({
      resolver: standardSchemaResolver(usuarioUpdateSchema),
      defaultValues: {
         nombre_usuario: initialData?.nombre_usuario ?? "",
         email: initialData?.email ?? "",
         password: "",
         rol_id: initialData?.rol_id ?? "",
         bloqueado: initialData?.bloqueado ?? false,
         requiere_cambio_contrasena: initialData?.requiere_cambio_contrasena ?? false,
      },
   });

   const handleCreate = async (data: CreateValues) => {
      setIsSubmitting(true);
      try {
         await usuariosService.create({
            nombre_usuario: data.nombre_usuario,
            email: data.email || null,
            password: data.password,
            rol_id: data.rol_id,
         });
         toast({ title: "Éxito", description: "Usuario creado correctamente." });
         onSuccess();
      } catch (error: unknown) {
         const detail =
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "No se pudo crear el usuario.";
         toast({ variant: "destructive", title: "Error", description: detail });
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleUpdate = async (data: UpdateValues) => {
      if (!initialData) return;
      setIsSubmitting(true);
      try {
         await usuariosService.update(initialData.id, {
            nombre_usuario: data.nombre_usuario ?? undefined,
            email: data.email || null,
            password: data.password || null,
            rol_id: data.rol_id ?? undefined,
            bloqueado: data.bloqueado,
            requiere_cambio_contrasena: data.requiere_cambio_contrasena,
         });
         toast({ title: "Éxito", description: "Usuario actualizado correctamente." });
         onSuccess();
      } catch (error: unknown) {
         const detail =
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "No se pudo actualizar el usuario.";
         toast({ variant: "destructive", title: "Error", description: detail });
      } finally {
         setIsSubmitting(false);
      }
   };

   if (!isInitialized) {
      return (
         <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </div>
      );
   }

   // ─── RENDER EDICIÓN ──────────────────────────────────────────────────────────

   if (isEditing) {
      return (
         <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(handleUpdate)} className="space-y-4 pt-2">
               <FormField
                  control={updateForm.control}
                  name="nombre_usuario"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Nombre de Usuario</FormLabel>
                        <FormControl>
                           <Input placeholder="ej. jperez" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <FormField
                  control={updateForm.control}
                  name="email"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Email <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                        <FormControl>
                           <Input type="email" placeholder="ej. jperez@empresa.com" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <FormField
                  control={updateForm.control}
                  name="password"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>
                           Nueva Contraseña{" "}
                           <span className="text-muted-foreground text-xs">(dejar vacío para no cambiar)</span>
                        </FormLabel>
                        <FormControl>
                           <Input type="password" placeholder="Mínimo 8 caracteres" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <FormField
                  control={updateForm.control}
                  name="rol_id"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingRoles}>
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder={loadingRoles ? "Cargando roles..." : "Seleccione un rol"} />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {roles.map((r) => (
                                 <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <FormField
                  control={updateForm.control}
                  name="bloqueado"
                  render={({ field }) => (
                     <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                           <FormLabel className="text-sm font-medium">Cuenta Bloqueada</FormLabel>
                           <p className="text-xs text-muted-foreground">El usuario no podrá iniciar sesión.</p>
                        </div>
                        <FormControl>
                           <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        </FormControl>
                     </FormItem>
                  )}
               />
               <FormField
                  control={updateForm.control}
                  name="requiere_cambio_contrasena"
                  render={({ field }) => (
                     <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                           <FormLabel className="text-sm font-medium">Requiere Cambio de Contraseña</FormLabel>
                           <p className="text-xs text-muted-foreground">Se solicitará al próximo inicio de sesión.</p>
                        </div>
                        <FormControl>
                           <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        </FormControl>
                     </FormItem>
                  )}
               />
               <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                     Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Guardar Cambios
                  </Button>
               </div>
            </form>
         </Form>
      );
   }

   // ─── RENDER CREACIÓN ─────────────────────────────────────────────────────────

   return (
      <Form {...createForm}>
         <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 pt-2">
            <FormField
               control={createForm.control}
               name="nombre_usuario"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nombre de Usuario</FormLabel>
                     <FormControl>
                        <Input placeholder="ej. jperez" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={createForm.control}
               name="email"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Email <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                     <FormControl>
                        <Input type="email" placeholder="ej. jperez@empresa.com" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={createForm.control}
               name="password"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Contraseña</FormLabel>
                     <FormControl>
                        <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={createForm.control}
               name="rol_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Rol</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingRoles}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder={loadingRoles ? "Cargando roles..." : "Seleccione un rol"} />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {roles.map((r) => (
                              <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancelar
               </Button>
               <Button type="submit" disabled={isSubmitting || loadingRoles}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Usuario
               </Button>
            </div>
         </form>
      </Form>
   );
}
