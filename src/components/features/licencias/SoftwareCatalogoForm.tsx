"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { useToast } from "@/components/ui/use-toast"
import { softwareCatalogoSchema } from "@/lib/zod"
import api from "@/lib/api"
import { SoftwareCatalogo } from "@/types/api"

interface SoftwareCatalogoFormProps {
   initialData?: SoftwareCatalogo | null;
   onSuccess: () => void;
}

type FormValues = z.infer<typeof softwareCatalogoSchema>;

export function SoftwareCatalogoForm({ initialData, onSuccess }: SoftwareCatalogoFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const form = useForm<FormValues>({
      resolver: zodResolver(softwareCatalogoSchema),
      defaultValues: initialData || {},
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         if (isEditing) {
            await api.put(`/licencias/catalogo/${initialData.id}`, data);
            toast({ title: "Éxito", description: "Software actualizado en el catálogo." });
         } else {
            await api.post('/licencias/catalogo/', data);
            toast({ title: "Éxito", description: "Software añadido al catálogo." });
         }
         router.refresh();
         onSuccess();
      } catch (error) {
         console.error("Error al guardar en catálogo:", error);
         toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el software." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem><FormLabel>Nombre del Software</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="version" render={({ field }) => (
                  <FormItem><FormLabel>Versión</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
            </div>
            <FormField control={form.control} name="fabricante" render={({ field }) => (
               <FormItem><FormLabel>Fabricante</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="tipo_licencia" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de Licencia</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo..." /></SelectTrigger></FormControl>
                        <SelectContent>
                           <SelectItem value="Perpetua">Perpetua</SelectItem>
                           <SelectItem value="Suscripción Anual">Suscripción Anual</SelectItem>
                           <SelectItem value="Suscripción Mensual">Suscripción Mensual</SelectItem>
                           <SelectItem value="OEM">OEM</SelectItem>
                           <SelectItem value="Freeware">Freeware</SelectItem>
                           <SelectItem value="Open Source">Open Source</SelectItem>
                           <SelectItem value="Otra">Otra</SelectItem>
                        </SelectContent>
                     </Select><FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="metrica_licenciamiento" render={({ field }) => (
                  <FormItem><FormLabel>Métrica</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una métrica..." /></SelectTrigger></FormControl>
                        <SelectContent>
                           <SelectItem value="Por Dispositivo">Por Dispositivo</SelectItem>
                           <SelectItem value="Por Usuario Nominal">Por Usuario Nominal</SelectItem>
                           <SelectItem value="Por Usuario Concurrente">Por Usuario Concurrente</SelectItem>
                           <SelectItem value="Por Core">Por Core</SelectItem>
                           <SelectItem value="Por Servidor">Por Servidor</SelectItem>
                           <SelectItem value="Gratuita">Gratuita</SelectItem>
                           <SelectItem value="Otra">Otra</SelectItem>
                        </SelectContent>
                     </Select><FormMessage />
                  </FormItem>
               )} />
            </div>
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Añadir al Catálogo"}
               </Button>
            </div>
         </form>
      </Form>
   )
}
