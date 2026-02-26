"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { format, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";

import { reservaSchema } from "@/lib/zod";
import { useCheckAvailability } from "@/hooks/useCheckAvailability";
import type {
   EquipoSimple,
   ReservaEquipo,
   ReservaEquipoCreate,
   ReservaEquipoUpdate
} from "@/types/api";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { Textarea } from "@/components/ui/Textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";

import { reservasService } from "@/app/services/reservasService";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
   const h = String(Math.floor(i / 2)).padStart(2, "0");
   const m = i % 2 === 0 ? "00" : "30";
   return `${h}:${m}`;
});

type FormValues = z.infer<typeof reservaSchema>;

interface ReservaFormProps {
   equipos: EquipoSimple[];
   initialData?: ReservaEquipo | null;
   onSuccess: (newReserva?: ReservaEquipo) => void;
}

export function ReservaForm({ equipos, initialData, onSuccess }: ReservaFormProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const { checkOverlap, isChecking } = useCheckAvailability();
   const [availabilityError, setAvailabilityError] = useState<string | null>(null);

   const defaultValues = useMemo<FormValues>(() => {
      const formatTimeOption = (date: Date) => {
         const m = date.getMinutes();
         const h = date.getHours();
         const mRound = m >= 15 && m < 45 ? 30 : 0;
         const hRound = m >= 45 ? (h + 1) % 24 : h;
         return `${String(hRound).padStart(2, "0")}:${String(mRound).padStart(2, "0")}`;
      };

      if (initialData) {
         const start = new Date(initialData.fecha_hora_inicio);
         const end = new Date(initialData.fecha_hora_fin);
         return {
            equipo_id: initialData.equipo_id,
            proposito: initialData.proposito ?? "",
            notas: initialData.notas ?? "",
            fecha_inicio: start,
            hora_inicio: formatTimeOption(start),
            fecha_fin: end,
            hora_fin: formatTimeOption(end),
         };
      }
      return {
         equipo_id: "",
         proposito: "",
         notas: "",
         fecha_inicio: new Date(),
         hora_inicio: "09:00",
         fecha_fin: new Date(),
         hora_fin: "10:00",
      };
   }, [initialData]);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(reservaSchema),
      defaultValues,
   });

   const mutation = useMutation({
      mutationFn: async (payload: ReservaEquipoCreate | ReservaEquipoUpdate) => {
         if (initialData) {
            return await reservasService.update(initialData.id, payload as ReservaEquipoUpdate);
         }
         return await reservasService.create(payload as ReservaEquipoCreate);
      },
      onSuccess: (data) => {
         toast({
            title: initialData ? "Reserva Actualizada" : "Reserva Creada",
            description: "La operación se completó correctamente."
         });
         queryClient.invalidateQueries({ queryKey: ["reservas"] });
         onSuccess(data);
      },
      onError: (err: any) => {
         const status = err?.status || err?.response?.status;
         const msg = err?.message?.toLowerCase() || "";

         if (status === 409 || msg.includes("overlap") || msg.includes("solapamiento") || msg.includes("excl")) {
            setAvailabilityError("El sistema ha detectado un conflicto de horario (El equipo fue reservado en este instante).");
            return;
         }
         toast({
            variant: "destructive",
            title: "Error",
            description: err.message || "No se pudo procesar la solicitud."
         });
      },
   });

   const onSubmit = async (data: FormValues) => {
      setAvailabilityError(null);

      const [sh, sm] = data.hora_inicio.split(":").map(Number);
      const [eh, em] = data.hora_fin.split(":").map(Number);

      const fecha_hora_inicio = setMinutes(setHours(data.fecha_inicio, sh), sm);
      const fecha_hora_fin = setMinutes(setHours(data.fecha_fin, eh), em);

      const hasConflict = await checkOverlap({
         equipoId: data.equipo_id,
         startDate: fecha_hora_inicio,
         endDate: fecha_hora_fin,
         excludeReservaId: initialData?.id,
      });

      if (hasConflict) {
         setAvailabilityError("El equipo ya tiene una reserva confirmada en este horario. Seleccione otro rango.");
         return;
      }

      const isoStart = format(fecha_hora_inicio, "yyyy-MM-dd'T'HH:mm:ssXXX");
      const isoEnd = format(fecha_hora_fin, "yyyy-MM-dd'T'HH:mm:ssXXX");

      if (initialData) {
         const updatePayload: ReservaEquipoUpdate = {
            fecha_hora_inicio: isoStart,
            fecha_hora_fin: isoEnd,
            proposito: data.proposito,
            notas: data.notas ? data.notas : null,
         };
         mutation.mutate(updatePayload);
      } else {
         const createPayload: ReservaEquipoCreate = {
            equipo_id: data.equipo_id,
            proposito: data.proposito,
            notas: data.notas ? data.notas : null,
            fecha_hora_inicio: isoStart,
            fecha_hora_fin: isoEnd,
         };
         mutation.mutate(createPayload);
      }
   };

   const isSubmitting = mutation.isPending || isChecking;

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {availabilityError && (
               <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Horario no disponible</AlertTitle>
                  <AlertDescription>{availabilityError}</AlertDescription>
               </Alert>
            )}

            <FormField
               control={form.control}
               name="equipo_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Equipo a Reservar <span className="text-destructive">*</span></FormLabel>
                     <Select
                        onValueChange={(val) => {
                           field.onChange(val);
                           setAvailabilityError(null);
                        }}
                        value={field.value}
                        disabled={!!initialData}
                     >
                        <FormControl>
                           <SelectTrigger><SelectValue placeholder="Seleccione un equipo..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {equipos.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                 {e.nombre} ({e.numero_serie})
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field }) => (
                     <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Inicio <span className="text-destructive">*</span></FormLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <FormControl>
                                 <Button
                                    variant="outline"
                                    className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                 >
                                    {field.value ? format(field.value, "PPP", { locale: es }) : "Seleccione fecha"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                              </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} autoFocus />
                           </PopoverContent>
                        </Popover>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="hora_inicio"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Hora de Inicio <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl>
                              <SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {TIME_OPTIONS.map((t) => (
                                 <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="fecha_fin"
                  render={({ field }) => (
                     <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Fin <span className="text-destructive">*</span></FormLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <FormControl>
                                 <Button
                                    variant="outline"
                                    className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                 >
                                    {field.value ? format(field.value, "PPP", { locale: es }) : "Seleccione fecha"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                              </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} autoFocus />
                           </PopoverContent>
                        </Popover>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="hora_fin"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Hora de Fin <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl>
                              <SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {TIME_OPTIONS.map((t) => (
                                 <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <FormField
               control={form.control}
               name="proposito"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Propósito de la Reserva <span className="text-destructive">*</span></FormLabel>
                     <FormControl>
                        <Textarea placeholder="Ej: Evento de marketing..." {...field} value={field.value ?? ""} className="resize-none" />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="notas"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                     <FormControl>
                        <Textarea placeholder="Requerimientos especiales..." {...field} value={field.value ?? ""} className="resize-none" />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isChecking ? "Verificando..." : initialData ? "Actualizar Reserva" : "Solicitar Reserva"}
               </Button>
            </div>
         </form>
      </Form>
   );
}
