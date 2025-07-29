"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { Calendar } from "@/components/ui/Calendar"
import { useToast } from "@/components/ui/use-toast"
import { licenciaSoftwareSchema } from "@/lib/zod"
import api from "@/lib/api"
import { LicenciaSoftware, SoftwareCatalogo, Proveedor } from "@/types/api"
import { cn } from "@/lib/utils"

interface LicenciaSoftwareFormProps {
   initialData?: LicenciaSoftware | null;
   catalogo: SoftwareCatalogo[];
   proveedores: Proveedor[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof licenciaSoftwareSchema>;

export function LicenciaSoftwareForm({ initialData, catalogo, proveedores, onSuccess }: LicenciaSoftwareFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const form = useForm<FormValues>({
      resolver: zodResolver(licenciaSoftwareSchema),
      defaultValues: initialData ? {
         ...initialData,
         fecha_adquisicion: initialData.fecha_adquisicion ? new Date(initialData.fecha_adquisicion) : new Date(),
         fecha_expiracion: initialData.fecha_expiracion ? new Date(initialData.fecha_expiracion) : null,
         costo_adquisicion: initialData.costo_adquisicion ? Number(initialData.costo_adquisicion) : null,
      } : {
         cantidad_total: 1,
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         if (isEditing) {
            await api.put(`/licencias/${initialData.id}`, data);
            toast({ title: "Éxito", description: "Licencia actualizada correctamente." });
         } else {
            await api.post('/licencias/', data);
            toast({ title: "Éxito", description: "Licencia registrada correctamente." });
         }
         router.refresh();
         onSuccess();
      } catch (error) {
         console.error("Error al guardar la licencia:", error);
         toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la licencia." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="software_catalogo_id" render={({ field }) => (
               <FormItem><FormLabel>Software del Catálogo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un software..." /></SelectTrigger></FormControl>
                     <SelectContent>{catalogo.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} {s.version || ''}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="clave_producto" render={({ field }) => (
               <FormItem><FormLabel>Clave de Producto (Opcional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="fecha_adquisicion" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Adquisición</FormLabel>
                     <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                           {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                           <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                     </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent></Popover><FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="fecha_expiracion" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Expiración (Opcional)</FormLabel>
                     <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                           {field.value ? format(field.value, "PPP", { locale: es }) : <span>Licencia perpetua</span>}
                           <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                     </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} />
                        </PopoverContent></Popover><FormMessage />
                  </FormItem>
               )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="cantidad_total" render={({ field }) => (
                  <FormItem><FormLabel>Cantidad de Puestos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="costo_adquisicion" render={({ field }) => (
                  <FormItem><FormLabel>Costo (Opcional)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
            </div>
            <FormField control={form.control} name="proveedor_id" render={({ field }) => (
               <FormItem><FormLabel>Proveedor (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un proveedor..." /></SelectTrigger></FormControl>
                     <SelectContent>{proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
               </FormItem>
            )} />
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Registrar Licencia"}
               </Button>
            </div>
         </form>
      </Form>
   )
}
