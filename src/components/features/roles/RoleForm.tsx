"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Shield, CheckSquare } from "lucide-react";

import { rolSchema } from "@/lib/zod";
import { rolesService } from "@/app/services/rolesService";
import { useAuthStore } from "@/store/authStore";
import type { Rol, Permiso } from "@/types/api";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormDescription,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardContent } from "@/components/ui/Card";

type RoleFormValues = z.infer<typeof rolSchema>;

interface RoleFormProps {
   initialData?: Rol;
   onSuccess?: () => void;
   onCancel?: () => void;
}

export function RoleForm({ initialData, onSuccess, onCancel }: RoleFormProps) {
   const router = useRouter();
   const { toast } = useToast();

   const { isInitialized, isAuthenticated } = useAuthStore();

   const [isLoading, setIsLoading] = useState(false);
   const [permisosDisponibles, setPermisosDisponibles] = useState<Permiso[]>([]);
   const [loadingPermisos, setLoadingPermisos] = useState(true);

   // 🚀 REGLA DE NEGOCIO: Proteger el nombre del rol 'admin'
   const isAdminRole = initialData?.nombre.toLowerCase() === "admin";

   const form = useForm<RoleFormValues>({
      resolver: standardSchemaResolver(rolSchema),
      defaultValues: {
         nombre: initialData?.nombre ?? "",
         descripcion: initialData?.descripcion ?? "",
         permiso_ids: initialData?.permisos?.map((p) => p.id) ?? [],
      },
   });

   // Observamos los permisos seleccionados para la lógica de "Seleccionar Todo"
   const selectedPermisos = useWatch({
      control: form.control,
      name: "permiso_ids",
   });

   useEffect(() => {
      if (!isInitialized || !isAuthenticated) return;

      rolesService
         .getAllPermisos()
         .then(setPermisosDisponibles)
         .catch(() =>
            toast({
               variant: "destructive",
               title: "Error de carga",
               description:
                  "No se pudieron cargar los permisos. Verifique conexión.",
            }),
         )
         .finally(() => setLoadingPermisos(false));
   }, [isInitialized, isAuthenticated, toast]);

   const onSubmit = async (data: RoleFormValues) => {
      setIsLoading(true);
      try {
         const payload = {
            nombre: data.nombre,
            descripcion: data.descripcion?.trim() ? data.descripcion : undefined,
            permiso_ids: data.permiso_ids,
         };

         if (initialData) {
            await rolesService.update(initialData.id, payload);
            toast({ title: "Rol actualizado correctamente" });
         } else {
            await rolesService.create(payload);
            toast({ title: "Rol creado correctamente" });
         }

         if (onSuccess) {
            onSuccess();
         } else {
            router.push("/administracion/roles");
            router.refresh();
         }
      } catch (error: unknown) {
         const detail =
            (error as any)?.response?.data?.detail || (error as any)?.message || "";

         if (detail.includes("uq_roles_nombre")) {
            form.setError("nombre", {
               type: "manual",
               message: "Este nombre de rol ya existe.",
            });
         } else {
            toast({
               variant: "destructive",
               title: "Error al guardar",
               description: detail || "Ocurrió un error inesperado.",
            });
         }
      } finally {
         setIsLoading(false);
      }
   };

   const handleCancel = () => (onCancel ? onCancel() : router.back());

   // 🚀 MEJORA UI: Agrupación semántica más limpia e inteligente
   const permisoGroups = useMemo(() => {
      return permisosDisponibles.reduce<Record<string, Permiso[]>>((acc, p) => {
         const parts = p.nombre.split("_");
         // Si tiene múltiples partes (ej: administrar_inventario_tipos), tomamos la segunda palabra como módulo
         let key = parts.length > 1 ? parts[1] : "general";

         // Limpieza de nombres para la UI
         if (key === "software") key = "licencias"; // Unir catalogo software con licencias

         (acc[key] ??= []).push(p);
         return acc;
      }, {});
   }, [permisosDisponibles]);

   // 🚀 MEJORA UX: Función para seleccionar/deseleccionar un módulo completo
   const handleToggleGroup = (groupPerms: Permiso[], selectAll: boolean) => {
      const currentSet = new Set(form.getValues("permiso_ids") || []);

      groupPerms.forEach((p) => {
         if (selectAll) {
            currentSet.add(p.id);
         } else {
            currentSet.delete(p.id);
         }
      });

      form.setValue("permiso_ids", Array.from(currentSet), {
         shouldValidate: true,
         shouldDirty: true,
      });
   };

   if (!isInitialized) {
      return (
         <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </div>
      );
   }

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
               <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>
                           Nombre del Rol <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                           <Input
                              placeholder="Ej: supervisor_almacen"
                              {...field}
                              disabled={isAdminRole || isLoading}
                           />
                        </FormControl>
                        {isAdminRole && (
                           <FormDescription className="text-amber-600">
                              El nombre del rol Administrador no puede ser modificado por seguridad.
                           </FormDescription>
                        )}
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                           <Textarea
                              placeholder="Breve detalle de las funciones del rol..."
                              {...field}
                              value={field.value ?? ""}
                              disabled={isLoading}
                              className="resize-none"
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <Card>
               <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4 border-b pb-4">
                     <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="font-medium text-lg">Permisos del Sistema</h3>
                     </div>
                     <span className="text-sm text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
                        {selectedPermisos?.length || 0} / {permisosDisponibles.length} seleccionados
                     </span>
                  </div>

                  {loadingPermisos ? (
                     <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                     </div>
                  ) : permisosDisponibles.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center py-4">
                        No se encontraron permisos disponibles.
                     </p>
                  ) : (
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(permisoGroups).map(([groupName, permisos]) => {
                           // Calculamos el estado de selección del grupo
                           const groupSelectedCount = permisos.filter(p => selectedPermisos?.includes(p.id)).length;
                           const isAllSelected = groupSelectedCount === permisos.length;
                           const isIndeterminate = groupSelectedCount > 0 && !isAllSelected;

                           return (
                              <div
                                 key={groupName}
                                 className={cn(
                                    "space-y-3 border p-4 rounded-lg transition-colors",
                                    isAllSelected ? "bg-primary/5 border-primary/20" : "bg-card"
                                 )}
                              >
                                 <div className="flex items-center justify-between border-b pb-2 mb-3">
                                    <h4 className="font-semibold capitalize text-sm text-foreground">
                                       Módulo: {groupName}
                                    </h4>
                                    <Button
                                       type="button"
                                       variant="ghost"
                                       size="sm"
                                       className="h-6 px-2 text-xs"
                                       onClick={() => handleToggleGroup(permisos, !isAllSelected)}
                                    >
                                       <CheckSquare className={cn("h-3 w-3 mr-1", isAllSelected ? "text-primary" : "text-muted-foreground")} />
                                       {isAllSelected ? "Deseleccionar" : "Todos"}
                                    </Button>
                                 </div>

                                 <div className="space-y-3">
                                    {permisos.map((permiso) => (
                                       <FormField
                                          key={permiso.id}
                                          control={form.control}
                                          name="permiso_ids"
                                          render={({ field }) => (
                                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                   <Checkbox
                                                      checked={field.value?.includes(permiso.id)}
                                                      disabled={isAdminRole || isLoading}
                                                      onCheckedChange={(checked) =>
                                                         field.onChange(
                                                            checked
                                                               ? [...field.value, permiso.id]
                                                               : field.value.filter(
                                                                  (v) => v !== permiso.id,
                                                               ),
                                                         )
                                                      }
                                                   />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                   <FormLabel className={cn(
                                                      "font-normal text-sm cursor-pointer",
                                                      field.value?.includes(permiso.id) ? "text-foreground font-medium" : "text-muted-foreground"
                                                   )}>
                                                      {permiso.nombre}
                                                   </FormLabel>
                                                   {permiso.descripcion && (
                                                      <FormDescription className="text-xs">
                                                         {permiso.descripcion}
                                                      </FormDescription>
                                                   )}
                                                </div>
                                             </FormItem>
                                          )}
                                       />
                                    ))}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}
                  {form.formState.errors.permiso_ids?.message && (
                     <p className="text-sm font-medium text-destructive mt-4 text-center bg-destructive/10 py-2 rounded-md">
                        {form.formState.errors.permiso_ids.message}
                     </p>
                  )}{" "}
               </CardContent>
            </Card>

            <div className="flex justify-end gap-4 sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 border-t">
               <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancelar
               </Button>
               <Button type="submit" disabled={isLoading || loadingPermisos}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Rol
               </Button>
            </div>
         </form>
      </Form>
   );
}
