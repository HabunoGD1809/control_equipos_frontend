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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { useToast } from "@/components/ui/use-toast"
import { tipoItemSchema } from "@/lib/zod"
import api from "@/lib/api"
import { TipoItemInventario, Proveedor } from "@/types/api"

interface TipoItemFormProps {
   initialData?: TipoItemInventario | null;
   proveedores: Proveedor[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof tipoItemSchema>;

interface ApiError {
   detail: string;
}

export function TipoItemForm({ initialData, proveedores, onSuccess }: TipoItemFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const form = useForm<FormValues>({
      resolver: zodResolver(tipoItemSchema),
      defaultValues: initialData || {
         nombre: "",
         categoria: "Consumible",
         unidad_medida: "Unidad",
         stock_minimo: 0,
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         if (isEditing) {
            await api.put(`/inventario/tipos/${initialData?.id}`, data);
            toast({ title: "Éxito", description: "Tipo de ítem actualizado." });
         } else {
            await api.post('/inventario/tipos/', data);
            toast({ title: "Éxito", description: "Tipo de ítem creado." });
         }
         router.refresh();
         onSuccess();
      } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || "No se pudo guardar el ítem.";
         toast({ variant: "destructive", title: "Error", description: msg });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
               <FormItem><FormLabel>Nombre del Ítem</FormLabel><FormControl><Input placeholder="Ej. Teclado USB" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="sku" render={({ field }) => (
               <FormItem><FormLabel>SKU (Opcional)</FormLabel><FormControl><Input placeholder="Ej. TEC-LOGI-K120" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="categoria" render={({ field }) => (
               <FormItem><FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una categoría" /></SelectTrigger></FormControl>
                     <SelectContent>
                        <SelectItem value="Consumible">Consumible</SelectItem>
                        <SelectItem value="Parte Repuesto">Parte/Repuesto</SelectItem>
                        <SelectItem value="Accesorio">Accesorio</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                     </SelectContent>
                  </Select><FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="unidad_medida" render={({ field }) => (
               <FormItem><FormLabel>Unidad de Medida</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una unidad" /></SelectTrigger></FormControl>
                     <SelectContent>
                        <SelectItem value="Unidad">Unidad</SelectItem>
                        <SelectItem value="Metro">Metro</SelectItem>
                        <SelectItem value="Kg">Kg</SelectItem>
                        <SelectItem value="Litro">Litro</SelectItem>
                        <SelectItem value="Caja">Caja</SelectItem>
                        <SelectItem value="Paquete">Paquete</SelectItem>
                     </SelectContent>
                  </Select><FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="stock_minimo" render={({ field }) => (
               <FormItem><FormLabel>Stock Mínimo</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="proveedor_preferido_id" render={({ field }) => (
               <FormItem><FormLabel>Proveedor Preferido (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un proveedor" /></SelectTrigger></FormControl>
                     <SelectContent>{proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
               </FormItem>
            )} />
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
