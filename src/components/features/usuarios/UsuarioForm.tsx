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

const cleanString = (str?: string | null) => (str && str.trim() !== "" ? str.trim() : null);

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

   const createForm = useForm<CreateValues>({
      resolver: standardSchemaResolver(usuarioCreateSchema),
      defaultValues: {
         nombre_usuario: "",
         email: "",
         password: "",
         rol_id: "",
      },
   });

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

   const handleApiError = (error: unknown, isUpdate: boolean) => {
      const detail = (error as any)?.response?.data?.detail || (error as any)?.message || "";
      const formToUse = isUpdate ? updateForm : createForm;

      if (detail.includes("uq_usuarios_email")) {
         formToUse.setError("email", { message: "Este email ya está en uso." });
      } else if (detail.includes("uq_usuarios_nombre_usuario")) {
         formToUse.setError("nombre_usuario", { message: "Este nombre de usuario ya existe." });
      } else {
         toast({ variant: "destructive", title: "Error", description: detail || "Error inesperado." });
      }
   };

   const handleCreate = async (data: CreateValues) => {
      setIsSubmitting(true);
      try {
         await usuariosService.create({
            nombre_usuario: data.nombre_usuario.trim(),
            email: cleanString(data.email),
            password: data.password,
            rol_id: data.rol_id,
         });
         toast({ title: "Éxito", description: "Usuario creado correctamente." });
         onSuccess();
      } catch (error: unknown) {
         handleApiError(error, false);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleUpdate = async (data: UpdateValues) => {
      if (!initialData) return;
      setIsSubmitting(true);
      try {
         const payload: any = {
            nombre_usuario: data.nombre_usuario?.trim() || undefined,
            email: cleanString(data.email),
            rol_id: data.rol_id ?? undefined,
            bloqueado: data.bloqueado,
            requiere_cambio_contrasena: data.requiere_cambio_contrasena,
         };

         if (data.password && data.password !== "") {
            payload.password = data.password;
         }

         await usuariosService.update(initialData.id, payload);
         toast({ title: "Éxito", description: "Usuario actualizado correctamente." });
         onSuccess();
      } catch (error: unknown) {
         handleApiError(error, true);
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

   const FormComponent = isEditing ? updateForm : createForm;
   const submitHandler = isEditing ? handleUpdate : handleCreate;

   return (
      <Form {...(FormComponent as any)}>
         <form onSubmit={FormComponent.handleSubmit(submitHandler as any)} className="space-y-4 pt-2">
            <FormField
               control={FormComponent.control}
               name="nombre_usuario"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nombre de Usuario <span className="text-destructive">*</span></FormLabel>
                     <FormControl>
                        <Input placeholder="ej. jperez" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={FormComponent.control}
               name="email"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Email <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <Input type="email" placeholder="ej. jperez@empresa.com" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={FormComponent.control}
               name="password"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>
                        {isEditing ? "Nueva Contraseña" : "Contraseña"} <span className="text-destructive">{!isEditing && "*"}</span>
                        {isEditing && <span className="text-muted-foreground font-normal text-xs ml-1">(dejar vacío para no cambiar)</span>}
                     </FormLabel>
                     <FormControl>
                        <Input type="password" placeholder="Mínimo 8 caracteres" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={FormComponent.control}
               name="rol_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Rol <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value || undefined} disabled={loadingRoles}>
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

            {isEditing && (
               <>
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
                              <FormLabel className="text-sm font-medium">Forzar Cambio de Contraseña</FormLabel>
                              <p className="text-xs text-muted-foreground">Se solicitará al próximo inicio de sesión.</p>
                           </div>
                           <FormControl>
                              <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                           </FormControl>
                        </FormItem>
                     )}
                  />
               </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t mt-4">
               <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancelar
               </Button>
               <Button type="submit" disabled={isSubmitting || loadingRoles} className="min-w-37.5">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Crear Usuario"}
               </Button>
            </div>
         </form>
      </Form>
   );
}
