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
import { Textarea } from "@/components/ui/Textarea"
import { useToast } from "@/components/ui/use-toast"
import { equipoSchema } from "@/lib/zod"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { EquipoRead, EstadoEquipo, Proveedor } from "@/types/api"

interface EquipoFormProps {
   initialData?: EquipoRead | null;
   estados: EstadoEquipo[];
   proveedores: Proveedor[];
}

type EquipoFormValues = z.infer<typeof equipoSchema>;

export function EquipoForm({ initialData, estados, proveedores }: EquipoFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const action = initialData ? "Guardar Cambios" : "Crear";

   const form = useForm<EquipoFormValues>({
      resolver: zodResolver(equipoSchema),
      defaultValues: initialData ? {
         ...initialData,
         fecha_adquisicion: initialData.fecha_adquisicion ? new Date(initialData.fecha_adquisicion) : null,
         fecha_puesta_marcha: initialData.fecha_puesta_marcha ? new Date(initialData.fecha_puesta_marcha) : null,
         fecha_garantia_expiracion: initialData.fecha_garantia_expiracion ? new Date(initialData.fecha_garantia_expiracion) : null,
         valor_adquisicion: initialData.valor_adquisicion ? Number(initialData.valor_adquisicion) : null,
      } : {},
   });

   const onSubmit = async (data: EquipoFormValues) => {
      setIsLoading(true);
      try {
         if (initialData) {
            await api.put(`/equipos/${initialData.id}`, data);
            toast({ title: "Éxito", description: "Equipo actualizado correctamente." });
            router.push(`/equipos/${initialData.id}`);
         } else {
            const response = await api.post<EquipoRead>('/equipos/', data);
            toast({ title: "Éxito", description: "Equipo creado correctamente." });
            router.push(`/equipos/${response.data.id}`);
         }
         router.refresh();
      } catch (error) {
         console.error("Error al guardar el equipo:", error);
         toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el equipo." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nombre del Equipo</FormLabel>
                     <FormControl><Input placeholder="Ej: Laptop Dell XPS 15" {...field} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="numero_serie" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Número de Serie</FormLabel>
                     <FormControl><Input placeholder="ABC-123-DEF" {...field} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="estado_id" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Estado</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                        <SelectContent>{estados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="proveedor_id" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Proveedor</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un proveedor" /></SelectTrigger></FormControl>
                        <SelectContent>{proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="fecha_adquisicion" render={({ field }) => (
                  <FormItem className="flex flex-col">
                     <FormLabel>Fecha de Adquisición</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                 {field.value ? (format(field.value, "PPP", { locale: es })) : (<span>Seleccione una fecha</span>)}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                           </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                     </Popover>
                     <FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="valor_adquisicion" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Valor de Adquisición</FormLabel>
                     <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ""} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />
               <div className="md:col-span-2">
                  <FormField control={form.control} name="notas" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl><Textarea placeholder="Observaciones generales sobre el equipo..." {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
               </div>
            </div>
            <div className="flex justify-end">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {action}
               </Button>
            </div>
         </form>
      </Form>
   )
}
