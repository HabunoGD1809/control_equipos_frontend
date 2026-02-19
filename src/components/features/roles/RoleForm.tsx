"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";

import { rolSchema } from "@/lib/zod";
import { rolesService } from "@/app/services/rolesService";
import { useAuthStore } from "@/store/authStore";
import type { Rol, Permiso } from "@/types/api";
import { useToast } from "@/components/ui/use-toast";

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

   const form = useForm<RoleFormValues>({
      resolver: standardSchemaResolver(rolSchema),
      defaultValues: {
         nombre: initialData?.nombre ?? "",
         descripcion: initialData?.descripcion ?? "",
         permiso_ids: initialData?.permisos?.map((p) => p.id) ?? [],
      },
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
               description: "No se pudieron cargar los permisos. Verifique conexión.",
            }),
         )
         .finally(() => setLoadingPermisos(false));
   }, [isInitialized, isAuthenticated, toast]);

   const onSubmit = async (data: RoleFormValues) => {
      setIsLoading(true);
      try {
         const payload = {
            nombre: data.nombre,
            descripcion: data.descripcion ?? undefined,
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
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "Ocurrió un error inesperado.";
         toast({ variant: "destructive", title: "Error al guardar", description: detail });
      } finally {
         setIsLoading(false);
      }
   };

   const handleCancel = () => (onCancel ? onCancel() : router.back());

   const permisoGroups = permisosDisponibles.reduce<Record<string, Permiso[]>>(
      (acc, p) => {
         const key = p.nombre.split("_")[1] ?? "general";
         (acc[key] ??= []).push(p);
         return acc;
      },
      {},
   );

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
                        <FormLabel>Nombre del Rol</FormLabel>
                        <FormControl>
                           <Input placeholder="Ej: supervisor_almacen" {...field} />
                        </FormControl>
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
                              placeholder="Descripción..."
                              {...field}
                              value={field.value ?? ""}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <Card>
               <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                     <Shield className="h-5 w-5 text-primary" />
                     <h3 className="font-medium text-lg">Permisos del Sistema</h3>
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
                        {Object.entries(permisoGroups).map(([groupName, permisos]) => (
                           <div key={groupName} className="space-y-3 border p-4 rounded-lg">
                              <h4 className="font-semibold capitalize text-sm text-muted-foreground border-b pb-2">
                                 Módulo: {groupName}
                              </h4>

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
                                                onCheckedChange={(checked) =>
                                                   field.onChange(
                                                      checked
                                                         ? [...field.value, permiso.id]
                                                         : field.value.filter((v) => v !== permiso.id),
                                                   )
                                                }
                                             />
                                          </FormControl>
                                          <div className="space-y-1 leading-none">
                                             <FormLabel className="font-normal cursor-pointer">
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
                        ))}
                     </div>
                  )}

                  <FormMessage>{form.formState.errors.permiso_ids?.message}</FormMessage>
               </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
               <Button type="button" variant="outline" onClick={handleCancel}>
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
