"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from 'date-fns/locale';

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
   initialData: LicenciaSoftware & { software_catalogo_id?: string, clave_producto?: string, proveedor_id?: string, numero_orden_compra?: string, notas?: string } | null;
   catalogo: SoftwareCatalogo[];
   proveedores: Proveedor[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof licenciaSoftwareSchema>;

export function LicenciaSoftwareForm({ initialData, catalogo, proveedores, onSuccess }: LicenciaSoftwareFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(licenciaSoftwareSchema),
      defaultValues: {
         software_catalogo_id: initialData?.software_catalogo_id || "",
         clave_producto: initialData?.clave_producto || "",
         fecha_adquisicion: initialData?.fecha_adquisicion ? new Date(initialData.fecha_adquisicion) : undefined,
         fecha_expiracion: initialData?.fecha_expiracion ? new Date(initialData.fecha_expiracion) : undefined,
         proveedor_id: initialData?.proveedor_id || null,
         costo_adquisicion: initialData?.costo_adquisicion ? parseFloat(initialData.costo_adquisicion as any) : undefined,
         numero_orden_compra: initialData?.numero_orden_compra || "",
         cantidad_total: initialData?.cantidad_total || 1,
         notas: initialData?.notas || "",
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      const payload = {
         ...data,
         costo_adquisicion: data.costo_adquisicion?.toString(),
         fecha_adquisicion: format(data.fecha_adquisicion, 'yyyy-MM-dd'),
         fecha_expiracion: data.fecha_expiracion ? format(data.fecha_expiracion, 'yyyy-MM-dd') : null,
      };

      try {
         if (initialData) {
            await api.put(`/licencias/${initialData.id}`, payload);
            toast({ title: "Éxito", description: "Licencia actualizada correctamente." });
         } else {
            await api.post('/licencias/', payload);
            toast({ title: "Éxito", description: "Licencia registrada correctamente." });
         }
         router.refresh();
         onSuccess();
      } catch (error) {
         console.error("Error en el formulario de licencia:", error);
         toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la licencia." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="software_catalogo_id" render={({ field }) => (
               <FormItem>
                  <FormLabel>Software (del Catálogo)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un software..." /></SelectTrigger></FormControl>
                     <SelectContent>
                        {catalogo.map(item => <SelectItem key={item.id} value={item.id}>{item.nombre} {item.version || ''}</SelectItem>)}
                     </SelectContent>
                  </Select>
                  <FormMessage />
               </FormItem>
            )} />

            <FormField control={form.control} name="clave_producto" render={({ field }) => (
               <FormItem><FormLabel>Clave del Producto</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="fecha_adquisicion" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Adquisición</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                 {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                           </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                     </Popover>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="fecha_expiracion" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Expiración</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                 {field.value ? format(field.value, "PPP", { locale: es }) : <span>(Opcional)</span>}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                           </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} />
                        </PopoverContent>
                     </Popover>
                     <FormMessage />
                  </FormItem>
               )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="cantidad_total" render={({ field }) => (
                  <FormItem><FormLabel>Cantidad de Puestos</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>
               )} />

               <FormField control={form.control} name="costo_adquisicion" render={({ field }) => (
                  <FormItem><FormLabel>Costo de Adquisición</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
            </div>

            <FormField control={form.control} name="proveedor_id" render={({ field }) => (
               <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un proveedor..." /></SelectTrigger></FormControl>
                     <SelectContent>{proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
               </FormItem>
            )} />

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? "Guardar Cambios" : "Registrar Licencia"}
               </Button>
            </div>
         </form>
      </Form>
   );
}
