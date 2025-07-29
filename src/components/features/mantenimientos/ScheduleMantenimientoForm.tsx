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
import { mantenimientoSchema } from "@/lib/zod"
import api from "@/lib/api"
import { TipoMantenimiento } from "@/types/api"
import { cn } from "@/lib/utils"

interface ScheduleMantenimientoFormProps {
   equipoId: string;
   tiposMantenimiento: TipoMantenimiento[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof mantenimientoSchema>;

export function ScheduleMantenimientoForm({ equipoId, tiposMantenimiento, onSuccess }: ScheduleMantenimientoFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(mantenimientoSchema),
      defaultValues: {
         prioridad: "0", // Baja por defecto
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const payload = { ...data, equipo_id: equipoId, prioridad: parseInt(data.prioridad, 10) };
         await api.post('/mantenimientos/', payload);
         toast({ title: "Éxito", description: "Mantenimiento programado correctamente." });
         router.refresh();
         onSuccess();
      } catch (error) {
         console.error("Error al programar mantenimiento:", error);
         toast({ variant: "destructive", title: "Error", description: "No se pudo programar el mantenimiento." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField control={form.control} name="tipo_mantenimiento_id" render={({ field }) => (
               <FormItem>
                  <FormLabel>Tipo de Mantenimiento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo..." /></SelectTrigger></FormControl>
                     <SelectContent>{tiposMantenimiento.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="fecha_programada" render={({ field }) => (
               <FormItem className="flex flex-col">
                  <FormLabel>Fecha Programada</FormLabel>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                     </PopoverContent>
                  </Popover>
                  <FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="tecnico_responsable" render={({ field }) => (
               <FormItem>
                  <FormLabel>Técnico Responsable</FormLabel>
                  <FormControl><Input placeholder="Nombre del técnico o empresa" {...field} /></FormControl>
                  <FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="prioridad" render={({ field }) => (
               <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                     <SelectContent>
                        <SelectItem value="0">Baja</SelectItem>
                        <SelectItem value="1">Media</SelectItem>
                        <SelectItem value="2">Alta</SelectItem>
                     </SelectContent>
                  </Select>
                  <FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="observaciones" render={({ field }) => (
               <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl><Textarea placeholder="Describa el trabajo a realizar..." {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
               </FormItem>
            )} />
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Programar Tarea
               </Button>
            </div>
         </form>
      </Form>
   )
}
