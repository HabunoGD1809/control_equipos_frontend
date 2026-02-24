"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, AlertCircle, Loader2 } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/use-toast";

import { mantenimientosService } from "@/app/services/mantenimientosService";
import { Mantenimiento, Proveedor, EstadoMantenimientoEnum, MantenimientoUpdate, EstadoMantenimiento } from "@/types/api";
import { cn } from "@/lib/utils";

import { mantenimientoUpdateSchema } from "@/lib/zod";

const formSchema = mantenimientoUpdateSchema.extend({
   estado: z.enum(Object.values(EstadoMantenimientoEnum) as [string, ...string[]]),
   tecnico_responsable: z.string().min(3, "El técnico es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditarMantenimientoFormProps {
   mantenimiento: Mantenimiento;
   proveedores: Proveedor[];
   tieneDocumentosAdjuntos: boolean;
   onSuccess: () => void;
}

export function EditarMantenimientoForm({
   mantenimiento,
   proveedores,
   tieneDocumentosAdjuntos,
   onSuccess,
}: EditarMantenimientoFormProps) {
   const { toast } = useToast();

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(formSchema),
      defaultValues: {
         estado: mantenimiento.estado,
         tecnico_responsable: mantenimiento.tecnico_responsable,
         proveedor_servicio_id: mantenimiento.proveedor_servicio_id || null,
         costo_estimado: mantenimiento.costo_estimado ? Number(mantenimiento.costo_estimado) : undefined,
         costo_real: mantenimiento.costo_real ? Number(mantenimiento.costo_real) : undefined,
         fecha_programada: mantenimiento.fecha_programada ? new Date(mantenimiento.fecha_programada) : undefined,
         fecha_inicio: mantenimiento.fecha_inicio ? new Date(mantenimiento.fecha_inicio) : undefined,
         fecha_finalizacion: mantenimiento.fecha_finalizacion ? new Date(mantenimiento.fecha_finalizacion) : undefined,
         observaciones: mantenimiento.observaciones || "",
         prioridad: mantenimiento.prioridad,
      },
   });

   const watchEstado = form.watch("estado");
   const reqDocs = mantenimiento.tipo_mantenimiento.requiere_documentacion;

   const isCierreBloqueado = watchEstado === EstadoMantenimientoEnum.Completado && reqDocs && !tieneDocumentosAdjuntos;

   const mutation = useMutation({
      mutationFn: async (data: FormValues) => {
         const payload: MantenimientoUpdate = {
            estado: data.estado as EstadoMantenimiento,
            tecnico_responsable: data.tecnico_responsable,
            proveedor_servicio_id: data.proveedor_servicio_id || null,
            costo_estimado: data.costo_estimado ?? null,
            costo_real: data.costo_real ?? null,
            fecha_programada: data.fecha_programada ? data.fecha_programada.toISOString() : undefined,
            fecha_inicio: data.fecha_inicio ? data.fecha_inicio.toISOString() : null,
            fecha_finalizacion: data.fecha_finalizacion ? data.fecha_finalizacion.toISOString() : null,
            observaciones: data.observaciones || null,
            prioridad: data.prioridad,
         };
         return mantenimientosService.update(mantenimiento.id, payload);
      },
      onSuccess: () => {
         toast({ title: "Mantenimiento actualizado exitosamente." });
         onSuccess();
      },
      onError: (err: any) => {
         toast({ variant: "destructive", title: "Error", description: err.message || "Ocurrió un error inesperado." });
      },
   });

   const onSubmit = (data: FormValues) => {
      if (data.estado === EstadoMantenimientoEnum.Completado) {
         if (!data.fecha_inicio || !data.fecha_finalizacion) {
            form.setError("fecha_finalizacion", { message: "Las fechas de inicio y fin son obligatorias para completar." });
            return;
         }
         if (data.fecha_finalizacion < data.fecha_inicio) {
            form.setError("fecha_finalizacion", { message: "La finalización no puede ser antes del inicio." });
            return;
         }
      }
      mutation.mutate(data);
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {isCierreBloqueado && (
               <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Cierre Bloqueado</AlertTitle>
                  <AlertDescription>
                     El tipo <b>{mantenimiento.tipo_mantenimiento.nombre}</b> requiere que subas documentación (ej. Informe de Servicio, Acta) antes de poder marcarlo como Completado. Por favor, cancela, ve a la pestaña de Documentación y adjunta el archivo.
                  </AlertDescription>
               </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Estado Operativo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione estado" />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {Object.values(EstadoMantenimientoEnum).map((est) => (
                                 <SelectItem key={est} value={est}>
                                    {est}
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
                  name="tecnico_responsable"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Técnico Responsable</FormLabel>
                        <FormControl>
                           <Input {...field} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="costo_estimado"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Costo Estimado</FormLabel>
                        <FormControl>
                           <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="costo_real"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Costo Real (Final)</FormLabel>
                        <FormControl>
                           <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field }) => (
                     <FormItem className="flex flex-col mt-2">
                        <FormLabel>Fecha Inicio Real</FormLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <FormControl>
                                 <Button
                                    variant={"outline"}
                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                 >
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                              </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                 mode="single"
                                 selected={field.value || undefined}
                                 onSelect={field.onChange}
                                 initialFocus
                              />
                           </PopoverContent>
                        </Popover>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="fecha_finalizacion"
                  render={({ field }) => (
                     <FormItem className="flex flex-col mt-2">
                        <FormLabel>Fecha Finalización</FormLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <FormControl>
                                 <Button
                                    variant={"outline"}
                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                 >
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                              </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                 mode="single"
                                 selected={field.value || undefined}
                                 onSelect={field.onChange}
                                 initialFocus
                              />
                           </PopoverContent>
                        </Popover>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="proveedor_servicio_id"
                  render={({ field }) => (
                     <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Proveedor de Servicio Externo (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione proveedor" />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              <SelectItem value="none" className="text-muted-foreground">-- Ninguno / Interno --</SelectItem>
                              {proveedores.map((p) => (
                                 <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
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
               name="observaciones"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Observaciones / Diagnóstico</FormLabel>
                     <FormControl>
                        <Textarea placeholder="Detalles de la intervención..." {...field} value={field.value || ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end gap-2 pt-4">
               <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                  Ver Documentación
               </Button>
               <Button type="submit" disabled={mutation.isPending || isCierreBloqueado}>
                  {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar Cambios
               </Button>
            </div>
         </form>
      </Form>
   );
}
