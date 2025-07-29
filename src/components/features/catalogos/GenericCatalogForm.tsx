"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"
import { useToast } from "@/components/ui/use-toast"
import { genericCatalogSchema } from "@/lib/zod"
import api from "@/lib/api"

interface GenericCatalogFormProps {
   initialData?: { [key: string]: any } | null;
   apiEndpoint: string;
   formFields: string[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof genericCatalogSchema>;

interface ApiError {
   detail: string;
}

export function GenericCatalogForm({ initialData, apiEndpoint, formFields, onSuccess }: GenericCatalogFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const form = useForm<FormValues>({
      resolver: zodResolver(genericCatalogSchema),
      defaultValues: initialData || {},
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         if (isEditing) {
            await api.put(`${apiEndpoint}/${initialData.id}`, data);
            toast({ title: "Éxito", description: "Ítem actualizado correctamente." });
         } else {
            await api.post(apiEndpoint, data);
            toast({ title: "Éxito", description: "Ítem creado correctamente." });
         }
         router.refresh();
         onSuccess();
      } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
         toast({ variant: "destructive", title: "Error", description: axiosError.response?.data?.detail || "No se pudo guardar el ítem." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {formFields.includes('nombre') && <FormField control={form.control} name="nombre" render={({ field }) => (
               <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />}
            {formFields.includes('descripcion') && <FormField control={form.control} name="descripcion" render={({ field }) => (
               <FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />}
            {formFields.includes('color_hex') && <FormField control={form.control} name="color_hex" render={({ field }) => (
               <FormItem><FormLabel>Color (Hex)</FormLabel><FormControl><Input placeholder="#4CAF50" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />}
            {formFields.includes('periodicidad_dias') && <FormField control={form.control} name="periodicidad_dias" render={({ field }) => (
               <FormItem><FormLabel>Periodicidad (días)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />}
            {formFields.includes('es_preventivo') && <FormField control={form.control} name="es_preventivo" render={({ field }) => (
               <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <FormLabel>Es Preventivo</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
               </FormItem>
            )} />}
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Crear Ítem"}
               </Button>
            </div>
         </form>
      </Form>
   )
}
