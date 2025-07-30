"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { Loader2, CalendarIcon } from "lucide-react"
import { AxiosError } from "axios"
import { format } from "date-fns"
import { es } from 'date-fns/locale'

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { Calendar } from "@/components/ui/Calendar"
import { Textarea } from "@/components/ui/Textarea"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { EquipoCreate, EquipoUpdate, EquipoRead, EstadoEquipo, Proveedor } from "@/types/api"
import { equipoSchema } from "@/lib/zod"

type FormValues = z.infer<typeof equipoSchema>;

interface ApiError {
   detail: string | { msg: string, loc: string[] }[];
}

interface EquipoFormProps {
   initialData: EquipoRead | null;
   estados: EstadoEquipo[];
   proveedores: Proveedor[];
   onSuccess: () => void;
}

export function EquipoForm({ initialData, estados, proveedores, onSuccess }: EquipoFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(equipoSchema),
      defaultValues: {
         nombre: initialData?.nombre || "",
         numero_serie: initialData?.numero_serie || "",
         codigo_interno: initialData?.codigo_interno || "",
         estado_id: initialData?.estado_id || "",
         ubicacion_actual: initialData?.ubicacion_actual || "",
         marca: initialData?.marca || "",
         modelo: initialData?.modelo || "",
         fecha_adquisicion: initialData?.fecha_adquisicion ? new Date(initialData.fecha_adquisicion) : undefined,
         fecha_puesta_marcha: initialData?.fecha_puesta_marcha ? new Date(initialData.fecha_puesta_marcha) : undefined,
         fecha_garantia_expiracion: initialData?.fecha_garantia_expiracion ? new Date(initialData.fecha_garantia_expiracion) : undefined,
         valor_adquisicion: initialData?.valor_adquisicion ? parseFloat(initialData.valor_adquisicion) : undefined,
         proveedor_id: initialData?.proveedor_id || null,
         centro_costo: initialData?.centro_costo || "",
         notas: initialData?.notas || "",
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      const apiData: EquipoCreate | EquipoUpdate = {
         ...data,
         // La API espera el valor como string
         valor_adquisicion: data.valor_adquisicion ? data.valor_adquisicion.toString() : null,
         // Formateamos las fechas a string si existen
         fecha_adquisicion: data.fecha_adquisicion ? format(data.fecha_adquisicion, 'yyyy-MM-dd') : null,
         fecha_puesta_marcha: data.fecha_puesta_marcha ? format(data.fecha_puesta_marcha, 'yyyy-MM-dd') : null,
         fecha_garantia_expiracion: data.fecha_garantia_expiracion ? format(data.fecha_garantia_expiracion, 'yyyy-MM-dd') : null,
      };

      try {
         if (initialData) {
            await api.put(`/equipos/${initialData.id}`, apiData);
            toast({ title: "Éxito", description: "Equipo actualizado correctamente." });
         } else {
            await api.post('/equipos/', apiData);
            toast({ title: "Éxito", description: "Equipo creado correctamente." });
         }
         onSuccess();
      } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
         let errorMsg = "Ocurrió un error inesperado.";
         if (typeof axiosError.response?.data?.detail === "string") {
            errorMsg = axiosError.response.data.detail;
         }
         toast({ variant: "destructive", title: "Error", description: errorMsg });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem><FormLabel>Nombre del Equipo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="numero_serie" render={({ field }) => (
                  <FormItem><FormLabel>Número de Serie</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="codigo_interno" render={({ field }) => (
                  <FormItem><FormLabel>Código Interno (Activo Fijo)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="estado_id" render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                        <SelectContent>{estados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
                     </Select><FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="marca" render={({ field }) => (
                  <FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="modelo" render={({ field }) => (
                  <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="ubicacion_actual" render={({ field }) => (
                  <FormItem><FormLabel>Ubicación Actual</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="centro_costo" render={({ field }) => (
                  <FormItem><FormLabel>Centro de Costo</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
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
                           <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                     </Popover><FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="valor_adquisicion" render={({ field }) => (
                  <FormItem><FormLabel>Valor Adquisición</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="proveedor_id" render={({ field }) => (
                  <FormItem><FormLabel>Proveedor</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un proveedor" /></SelectTrigger></FormControl>
                        <SelectContent>{proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                     </Select><FormMessage />
                  </FormItem>
               )} />
            </div>
            <FormField control={form.control} name="notas" render={({ field }) => (
               <FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea placeholder="Añade notas u observaciones..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? "Guardar Cambios" : "Crear Equipo"}
               </Button>
            </div>
         </form>
      </Form>
   )
}
