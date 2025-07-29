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
import { Textarea } from "@/components/ui/Textarea"
import { useToast } from "@/components/ui/use-toast"
import { proveedorSchema } from "@/lib/zod"
import api from "@/lib/api"
import { Proveedor } from "@/types/api"

interface ProveedorFormProps {
   initialData?: Proveedor | null;
   onSuccess: () => void;
}

type FormValues = z.infer<typeof proveedorSchema>;

export function ProveedorForm({ initialData, onSuccess }: ProveedorFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const form = useForm<FormValues>({
      resolver: zodResolver(proveedorSchema),
      defaultValues: initialData || {},
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         if (isEditing) {
            await api.put(`/proveedores/${initialData.id}`, data);
            toast({ title: "Éxito", description: "Proveedor actualizado correctamente." });
         } else {
            await api.post('/proveedores/', data);
            toast({ title: "Éxito", description: "Proveedor creado correctamente." });
         }
         router.refresh();
         onSuccess();
      } catch (error) {
         console.error("Error al guardar el proveedor:", error);
         toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el proveedor." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
               <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="rnc" render={({ field }) => (
               <FormItem><FormLabel>RNC / ID Fiscal</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="contacto" render={({ field }) => (
               <FormItem><FormLabel>Contacto (Email, Teléfono)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="sitio_web" render={({ field }) => (
               <FormItem><FormLabel>Sitio Web</FormLabel><FormControl><Input placeholder="https://ejemplo.com" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="direccion" render={({ field }) => (
               <FormItem><FormLabel>Dirección</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="descripcion" render={({ field }) => (
               <FormItem><FormLabel>Descripción / Notas</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Crear Proveedor"}
               </Button>
            </div>
         </form>
      </Form>
   )
}
