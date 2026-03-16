"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { TipoMantenimiento, Tecnico } from "@/types/api";
import { mantenimientosService } from "@/app/services/mantenimientosService";
import { mantenimientoSchema } from "@/lib/zod";
import { getFriendlyErrorMessage } from "@/lib/error-handling";

interface ScheduleMantenimientoFormProps {
   equipoId: string;
   tiposMantenimiento: TipoMantenimiento[];
   tecnicos: Tecnico[];
   onSuccess: () => void;
}

type MantenimientoFormValues = z.infer<typeof mantenimientoSchema>;

export function ScheduleMantenimientoForm({
   equipoId,
   tiposMantenimiento,
   tecnicos,
   onSuccess,
}: ScheduleMantenimientoFormProps) {
   const { toast } = useToast();

   const form = useForm<MantenimientoFormValues>({
      resolver: standardSchemaResolver(mantenimientoSchema),
      defaultValues: {
         equipo_id: equipoId,
         tipo_mantenimiento_id: "",
         tecnico_id: "",
         prioridad: 1,
         observaciones: "",
         costo_estimado: null,
         fecha_programada: new Date(new Date().setDate(new Date().getDate() + 1)),
      },
   });

   const onSubmit = async (values: MantenimientoFormValues) => {
      try {
         await mantenimientosService.create({
            equipo_id: values.equipo_id,
            tipo_mantenimiento_id: values.tipo_mantenimiento_id,
            tecnico_id: values.tecnico_id,
            prioridad: values.prioridad,
            observaciones: values.observaciones || null,
            fecha_programada: values.fecha_programada ? values.fecha_programada.toISOString() : undefined,
            costo_estimado: values.costo_estimado ?? null,
         });

         toast({
            title: "Mantenimiento Programado",
            description: "La orden de trabajo ha sido creada exitosamente.",
         });
         form.reset();
         onSuccess();
      } catch (err) {
         const { message, field } = getFriendlyErrorMessage(err);
         if (field) {
            form.setError(field as keyof MantenimientoFormValues, { type: "manual", message });
         } else {
            toast({ variant: "destructive", title: "Error", description: message });
         }
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
               control={form.control}
               name="tipo_mantenimiento_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Servicio <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Seleccione el tipo..." />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {tiposMantenimiento.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                 {tipo.nombre} ({tipo.es_preventivo ? "Preventivo" : "Correctivo"})
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="fecha_programada"
                  render={({ field }) => (
                     <FormItem className="flex flex-col mt-2">
                        <FormLabel>Fecha Programada <span className="text-destructive">*</span></FormLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <FormControl>
                                 <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                              </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                 mode="single"
                                 selected={field.value}
                                 onSelect={field.onChange}
                                 disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                 autoFocus
                              />
                           </PopoverContent>
                        </Popover>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="prioridad"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
                           <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              <SelectItem value="0">Baja</SelectItem>
                              <SelectItem value="1">Normal</SelectItem>
                              <SelectItem value="2">Alta</SelectItem>
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            {/* --- SELECT DE TÉCNICOS --- */}
            <FormField
               control={form.control}
               name="tecnico_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Técnico Responsable <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Seleccione el técnico o empresa..." />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {tecnicos.filter(t => t.is_active).map((tecnico) => (
                              <SelectItem key={tecnico.id} value={tecnico.id}>
                                 {tecnico.nombre_completo} {tecnico.es_externo ? '(Externo)' : '(Interno)'}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="costo_estimado"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Costo Estimado (Opcional)</FormLabel>
                     <FormControl>
                        <div className="relative">
                           <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                           <Input
                              type="number"
                              step="0.01"
                              className="pl-7"
                              placeholder="0.00"
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                           />
                        </div>
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="observaciones"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Observaciones / Diagnóstico</FormLabel>
                     <FormControl>
                        <Textarea placeholder="Detalles de la intervención..." className="resize-none" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-2">
               <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Agendar Mantenimiento
               </Button>
            </div>
         </form>
      </Form>
   );
}
