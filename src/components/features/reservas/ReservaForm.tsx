"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format, setHours, setMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { Calendar } from "@/components/ui/Calendar"
import { Textarea } from "@/components/ui/Textarea"
import { useToast } from "@/components/ui/use-toast"
import { reservaSchema } from "@/lib/zod"
import api from "@/lib/api"
import { EquipoSimple } from "@/types/api"
import { cn } from "@/lib/utils"

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
   const hour = Math.floor(i / 2);
   const minute = (i % 2) * 30;
   return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

interface ReservaFormProps {
   equipos: EquipoSimple[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof reservaSchema>;

interface ApiError {
   detail: string;
}

export function ReservaForm({ equipos, onSuccess }: ReservaFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(reservaSchema),
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const [startHour, startMinute] = data.hora_inicio.split(':').map(Number);
         const [endHour, endMinute] = data.hora_fin.split(':').map(Number);

         const fecha_hora_inicio = setMinutes(setHours(data.fecha_inicio, startHour), startMinute);
         const fecha_hora_fin = setMinutes(setHours(data.fecha_fin, endHour), endMinute);

         const payload = {
            equipo_id: data.equipo_id,
            proposito: data.proposito,
            notas: data.notas,
            fecha_hora_inicio: fecha_hora_inicio.toISOString(),
            fecha_hora_fin: fecha_hora_fin.toISOString(),
         };

         await api.post('/reservas/', payload);
         toast({ title: "Éxito", description: "Reserva solicitada correctamente." });
         router.refresh();
         onSuccess();
      } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || "No se pudo crear la reserva. Verifique la disponibilidad.";
         toast({ variant: "destructive", title: "Error", description: msg });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="equipo_id" render={({ field }) => (
               <FormItem><FormLabel>Equipo a Reservar</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un equipo..." /></SelectTrigger></FormControl>
                     <SelectContent>{equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre} ({e.numero_serie})</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
               </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="fecha_inicio" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Inicio</FormLabel>
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
               <FormField control={form.control} name="hora_inicio" render={({ field }) => (
                  <FormItem><FormLabel>Hora de Inicio</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger></FormControl>
                        <SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                     </Select><FormMessage />
                  </FormItem>
               )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="fecha_fin" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Fin</FormLabel>
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
               <FormField control={form.control} name="hora_fin" render={({ field }) => (
                  <FormItem><FormLabel>Hora de Fin</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger></FormControl>
                        <SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                     </Select><FormMessage />
                  </FormItem>
               )} />
            </div>
            <FormField control={form.control} name="proposito" render={({ field }) => (
               <FormItem><FormLabel>Propósito de la Reserva</FormLabel><FormControl><Textarea placeholder="Ej: Evento de marketing en..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Solicitar Reserva
               </Button>
            </div>
         </form>
      </Form>
   )
}
