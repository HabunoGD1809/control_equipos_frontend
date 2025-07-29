"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Checkbox } from "@/components/ui/Checkbox"
import { useToast } from "@/components/ui/use-toast"
import { rolSchema } from "@/lib/zod"
import api from "@/lib/api"
import { Rol, Permiso } from "@/types/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

interface RoleFormProps {
   initialData?: Rol | null;
   allPermissions: Permiso[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof rolSchema>;

// Función para agrupar permisos por categoría (ej: 'ver_equipos' -> 'equipos')
const groupPermissions = (permissions: Permiso[]) => {
   return permissions.reduce((acc, permission) => {
      const category = permission.nombre.split('_').pop() || 'general';
      if (!acc[category]) {
         acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
   }, {} as Record<string, Permiso[]>);
};

export function RoleForm({ initialData, allPermissions, onSuccess }: RoleFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const groupedPermissions = useMemo(() => groupPermissions(allPermissions), [allPermissions]);

   const form = useForm<FormValues>({
      resolver: zodResolver(rolSchema),
      defaultValues: {
         nombre: initialData?.nombre || "",
         descripcion: initialData?.descripcion || "",
         permiso_ids: initialData?.permisos.map(p => p.id) || [],
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         if (isEditing) {
            await api.put(`/gestion/roles/${initialData.id}`, data);
            toast({ title: "Éxito", description: "Rol actualizado correctamente." });
         } else {
            await api.post('/gestion/roles/', data);
            toast({ title: "Éxito", description: "Rol creado correctamente." });
         }
         router.refresh();
         onSuccess();
      } catch (error) {
         console.error("Error al guardar el rol:", error);
         toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el rol." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem><FormLabel>Nombre del Rol</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="descripcion" render={({ field }) => (
                  <FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
            </div>

            <FormField
               control={form.control}
               name="permiso_ids"
               render={() => (
                  <FormItem>
                     <div className="mb-4">
                        <FormLabel className="text-base">Permisos</FormLabel>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                        {Object.entries(groupedPermissions).map(([category, permissions]) => (
                           <Card key={category}>
                              <CardHeader className="p-4"><CardTitle className="text-base capitalize">{category}</CardTitle></CardHeader>
                              <CardContent className="p-4 pt-0 space-y-2">
                                 {permissions.map((item) => (
                                    <FormField key={item.id} control={form.control} name="permiso_ids"
                                       render={({ field }) => (
                                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                             <FormControl>
                                                <Checkbox
                                                   checked={field.value?.includes(item.id)}
                                                   onCheckedChange={(checked) => {
                                                      return checked
                                                         ? field.onChange([...field.value, item.id])
                                                         : field.onChange(field.value?.filter((value) => value !== item.id))
                                                   }}
                                                />
                                             </FormControl>
                                             <FormLabel className="font-normal text-sm">{item.descripcion || item.nombre}</FormLabel>
                                          </FormItem>
                                       )}
                                    />
                                 ))}
                              </CardContent>
                           </Card>
                        ))}
                     </div>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Crear Rol"}
               </Button>
            </div>
         </form>
      </Form>
   )
}
