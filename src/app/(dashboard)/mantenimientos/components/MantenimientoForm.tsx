"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { startOfDay } from "date-fns";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useToast } from "@/components/ui/use-toast";

import type { EquipoSimple, TipoMantenimiento, Proveedor, MantenimientoCreate } from "@/types/api";
import { mantenimientoSchema } from "@/lib/zod";
import { api } from "@/lib/http";

interface MantenimientoFormProps {
   equipos: EquipoSimple[];
   tiposMantenimiento: TipoMantenimiento[];
   proveedores: Proveedor[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof mantenimientoSchema>;

function getErrorMessage(err: unknown, fallback = "No se pudo programar el mantenimiento.") {
   if (typeof err === "object" && err) {
      const anyErr = err as any;
      const detail = anyErr?.data?.detail || anyErr?.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      if (typeof anyErr?.message === "string" && anyErr.message.trim()) return anyErr.message;
   }
   return fallback;
}

export function MantenimientoForm({ equipos, tiposMantenimiento, proveedores, onSuccess }: MantenimientoFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(mantenimientoSchema),
      defaultValues: {
         tecnico_responsable: "",
         prioridad: 0,
         observaciones: null,
         proveedor_servicio_id: null,
         costo_estimado: null,
         fecha_programada: undefined as any,
      },
   });

   async function onSubmit(values: FormValues) {
      setIsLoading(true);
      try {
         const dataToSubmit: MantenimientoCreate = {
            ...values,
            fecha_programada: values.fecha_programada ? values.fecha_programada.toISOString() : undefined,
            // ✅ convertir "none" de vuelta a null
            proveedor_servicio_id:
               !values.proveedor_servicio_id || values.proveedor_servicio_id === "none"
                  ? null
                  : values.proveedor_servicio_id,
            costo_estimado:
               values.costo_estimado !== undefined && values.costo_estimado !== null
                  ? String(values.costo_estimado)
                  : null,
         };

         await api.post("/mantenimientos/", dataToSubmit);

         toast({ title: "Éxito", description: "Mantenimiento programado correctamente." });
         onSuccess();
      } catch (error) {
         console.error(error);
         toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
      } finally {
         setIsLoading(false);
      }
   }

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Equipo */}
            <FormField
               control={form.control}
               name="equipo_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Equipo</FormLabel>
                     <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                     >
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un equipo" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {equipos.map((equipo) => (
                              <SelectItem key={equipo.id} value={equipo.id}>
                                 {equipo.nombre} ({equipo.numero_serie})
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {/* Tipo de Mantenimiento */}
            <FormField
               control={form.control}
               name="tipo_mantenimiento_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Mantenimiento</FormLabel>
                     <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                     >
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {tiposMantenimiento.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                 {tipo.nombre}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {/* Fecha Programada — reutilizamos DatePickerField con type="button" ya incluido */}
            <FormField
               control={form.control}
               name="fecha_programada"
               render={({ field }) => (
                  <DatePickerField
                     label="Fecha Programada"
                     value={field.value}
                     onChange={field.onChange}
                     disabled={(date) => date < startOfDay(new Date())}
                  />
               )}
            />

            {/* Técnico */}
            <FormField
               control={form.control}
               name="tecnico_responsable"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Técnico Responsable</FormLabel>
                     <FormControl>
                        <Input placeholder="Nombre del técnico o empresa" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {/* Proveedor — ✅ "none" en lugar de "" */}
            <FormField
               control={form.control}
               name="proveedor_servicio_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Proveedor Externo (Opcional)</FormLabel>
                     <Select
                        value={field.value ?? "none"}
                        onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                     >
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un proveedor si aplica" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="none">-- Ninguno --</SelectItem>
                           {proveedores.map((proveedor) => (
                              <SelectItem key={proveedor.id} value={proveedor.id}>
                                 {proveedor.nombre}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {/* Observaciones */}
            <FormField
               control={form.control}
               name="observaciones"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Observaciones</FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder="Añade notas o comentarios sobre el mantenimiento"
                           {...field}
                           value={field.value ?? ""}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Programar Mantenimiento
            </Button>
         </form>
      </Form>
   );
}
