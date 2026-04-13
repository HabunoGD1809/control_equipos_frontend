"use client";

import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, Eraser } from "lucide-react";

import { usuarioCreateSchema, usuarioUpdateSchema } from "@/lib/zod";
import { usuariosService } from "@/app/services/usuariosService";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { AsyncCombobox, type Option } from "@/components/ui/AsyncCombobox";
import type { Usuario, Rol } from "@/types/api";

interface FormValues {
   nombre_usuario: string;
   email?: string | null;
   password?: string;
   rol_id: string;
   departamento_id?: string | null;
   empleado_id?: string | null;
   bloqueado?: boolean;
   requiere_cambio_contrasena?: boolean;
}

interface UsuarioFormProps {
   initialData?: Usuario;
   initialOptions: {
      roles: Rol[];
      departamentos: Option[];
      empleados: Option[];
   };
   onSuccess: () => void;
   onCancel: () => void;
}

const cleanString = (str?: string | null) => (str && str.trim() !== "" ? str.trim() : null);

export function UsuarioForm({ initialData, initialOptions, onSuccess, onCancel }: UsuarioFormProps) {
   const { toast } = useToast();
   const isEditing = !!initialData;

   const [isSubmitting, setIsSubmitting] = useState(false);

   // Extraemos los datos pre-cargados desde las props
   const { roles, departamentos, empleados } = initialOptions;

   const formSchema = isEditing ? usuarioUpdateSchema : usuarioCreateSchema;

   const form = useForm<FormValues>({
      // @ts-expect-error TypeScript inference con zod resolver mixto
      resolver: standardSchemaResolver(formSchema),
      defaultValues: {
         nombre_usuario: initialData?.nombre_usuario ?? "",
         email: initialData?.email ?? "",
         password: "",
         rol_id: initialData?.rol_id ?? "",
         departamento_id: initialData?.departamento_id ?? null,
         empleado_id: initialData?.empleado_id ?? null,
         bloqueado: initialData?.bloqueado ?? false,
         requiere_cambio_contrasena: initialData?.requiere_cambio_contrasena ?? false,
      },
   });

   // OPCIONES POR DEFECTO DINÁMICAS
   const defaultDepartamentoOptions = useMemo<Option[]>(() => {
      if (departamentos.length > 0) return departamentos;
      if (initialData?.departamento_rel) return [{ value: initialData.departamento_rel.id, label: initialData.departamento_rel.nombre }];
      return [];
   }, [departamentos, initialData]);

   const defaultEmpleadoOptions = useMemo<Option[]>(() => {
      if (empleados.length > 0) return empleados;
      if (initialData?.empleado_rel) return [{ value: initialData.empleado_rel.id, label: initialData.empleado_rel.nombre_completo }];
      return [];
   }, [empleados, initialData]);

   // FETCHERS LOCALES SÚPER RÁPIDOS (Filtran en memoria en lugar de ir a la API)
   const fetchDepartamentos = useCallback(async (search: string): Promise<Option[]> => {
      const lower = search.toLowerCase();
      return departamentos.filter(d => d.label.toLowerCase().includes(lower));
   }, [departamentos]);

   const fetchEmpleados = useCallback(async (search: string): Promise<Option[]> => {
      const lower = search.toLowerCase();
      return empleados.filter(e => e.label.toLowerCase().includes(lower));
   }, [empleados]);

   const handleApiError = (error: any) => {
      const { message, field } = getFriendlyErrorMessage(error);
      if (field) {
         form.setError(field as keyof FormValues, { type: "manual", message });
      } else {
         toast({ variant: "destructive", title: "Error", description: message });
      }
   };

   const onSubmit = async (data: FormValues) => {
      setIsSubmitting(true);
      try {
         if (isEditing) {
            const payload: any = {
               nombre_usuario: data.nombre_usuario?.trim() || undefined,
               email: cleanString(data.email),
               rol_id: data.rol_id,
               departamento_id: data.departamento_id || null,
               empleado_id: data.empleado_id || null,
               bloqueado: data.bloqueado,
               requiere_cambio_contrasena: data.requiere_cambio_contrasena,
            };
            if (data.password) payload.password = data.password;

            await usuariosService.update(initialData!.id, payload);
            toast({ title: "Éxito", description: "Usuario actualizado correctamente." });
         } else {
            await usuariosService.create({
               nombre_usuario: data.nombre_usuario.trim(),
               email: cleanString(data.email),
               password: data.password!,
               rol_id: data.rol_id,
               departamento_id: data.departamento_id || null,
               empleado_id: data.empleado_id || null,
               requiere_cambio_contrasena: data.requiere_cambio_contrasena,
            });
            toast({ title: "Éxito", description: "Usuario creado correctamente." });
         }
         onSuccess();
      } catch (error) {
         handleApiError(error);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField control={form.control} name="nombre_usuario" render={({ field }) => (
               <FormItem>
                  <FormLabel>Nombre de Usuario <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                     <Input placeholder="ej. jperez" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
               </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
               <FormItem>
                  <FormLabel>Email <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                  <FormControl>
                     <Input type="email" placeholder="ej. correo@empresa.com" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
               </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
               <FormItem>
                  <FormLabel>
                     {isEditing ? "Nueva Contraseña" : "Contraseña"}{" "}
                     <span className="text-destructive">{!isEditing && "*"}</span>
                     {isEditing && (
                        <span className="text-muted-foreground font-normal text-xs ml-1">
                           (dejar vacío para no cambiar)
                        </span>
                     )}
                  </FormLabel>
                  <FormControl>
                     <Input type="password" placeholder="Mínimo 8 caracteres" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
               </FormItem>
            )} />

            <FormField control={form.control} name="rol_id" render={({ field }) => (
               <FormItem>
                  <FormLabel>Rol <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                     <FormControl>
                        <SelectTrigger>
                           <SelectValue placeholder="Seleccione un rol" />
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
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="departamento_id" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Departamento <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <AsyncCombobox
                           value={field.value}
                           onChange={field.onChange}
                           fetcher={fetchDepartamentos}
                           defaultOptions={defaultDepartamentoOptions}
                           placeholder="Buscar departamento..."
                           emptyMessage="No se encontraron departamentos."
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="empleado_id" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Perfil de Empleado <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <AsyncCombobox
                           value={field.value}
                           onChange={field.onChange}
                           fetcher={fetchEmpleados}
                           defaultOptions={defaultEmpleadoOptions}
                           placeholder="Buscar empleado de RRHH..."
                           emptyMessage="No se encontraron empleados."
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
               <FormField control={form.control} name="requiere_cambio_contrasena" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-card shadow-sm">
                     <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">Forzar Cambio</FormLabel>
                        <p className="text-xs text-muted-foreground">Al próximo login.</p>
                     </div>
                     <FormControl>
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                     </FormControl>
                  </FormItem>
               )} />

               {isEditing && (
                  <FormField control={form.control} name="bloqueado" render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-card shadow-sm">
                        <div className="space-y-0.5">
                           <FormLabel className="text-sm font-medium">Bloquear Acceso</FormLabel>
                           <p className="text-xs text-muted-foreground">Impide inicio de sesión temporal.</p>
                        </div>
                        <FormControl>
                           <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        </FormControl>
                     </FormItem>
                  )} />
               )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t mt-6">
               {!isEditing ? (
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => form.reset()}
                     disabled={isSubmitting}
                     className="text-muted-foreground hover:text-foreground"
                  >
                     <Eraser className="mr-2 h-4 w-4" /> Limpiar
                  </Button>
               ) : <div />}

               <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                     Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-35">
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {isEditing ? "Guardar Cambios" : "Crear Usuario"}
                  </Button>
               </div>
            </div>
         </form>
      </Form>
   );
}
