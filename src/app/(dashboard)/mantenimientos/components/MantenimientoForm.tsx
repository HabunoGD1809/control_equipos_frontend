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
import { AsyncCombobox } from "@/components/ui/AsyncCombobox";
import { useToast } from "@/components/ui/use-toast";

import type { EquipoSimple, TipoMantenimiento, Tecnico, MantenimientoCreate } from "@/types/api";
import { mantenimientoSchema } from "@/lib/zod";
import { api } from "@/lib/http";
import { equiposService } from "@/app/services/equiposService";

interface MantenimientoFormProps {
   equipos: EquipoSimple[]; // Usado solo para inicializar defaults rápidos
   tiposMantenimiento: TipoMantenimiento[];
   tecnicos: Tecnico[];
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

export function MantenimientoForm({ equipos, tiposMantenimiento, tecnicos, onSuccess }: MantenimientoFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(mantenimientoSchema),
      defaultValues: {
         equipo_id: "",
         tipo_mantenimiento_id: "",
         tecnico_id: "",
         prioridad: 0,
         observaciones: null,
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

            {/* Equipo - ACTUALIZADO A ASYNC COMBOBOX */}
            <FormField
               control={form.control}
               name="equipo_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Equipo a Mantener <span className="text-destructive">*</span></FormLabel>
                     <FormControl>
                        <AsyncCombobox
                           value={field.value}
                           onChange={field.onChange}
                           placeholder="Buscar por nombre, serie o código..."
                           emptyMessage="No se encontraron equipos."
                           defaultOptions={equipos.slice(0, 50).map(e => ({ value: e.id, label: `${e.nombre} (${e.numero_serie})` }))}
                           fetcher={async (query) => {
                              const res = await equiposService.search(query);
                              return res.map(eq => ({ value: eq.id, label: `${eq.nombre} (${eq.numero_serie})` }));
                           }}
                        />
                     </FormControl>
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
                     <FormLabel>Tipo de Mantenimiento <span className="text-destructive">*</span></FormLabel>
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

            {/* Fecha Programada */}
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

            {/* Técnico - Filtrando solo activos */}
            <FormField
               control={form.control}
               name="tecnico_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Técnico o Empresa Responsable <span className="text-destructive">*</span></FormLabel>
                     <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                     >
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Seleccione el responsable..." />
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

            {/* Costo Estimado */}
            <FormField
               control={form.control}
               name="costo_estimado"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Costo Estimado <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
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

            {/* Observaciones */}
            <FormField
               control={form.control}
               name="observaciones"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Observaciones <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder="Añade notas o comentarios sobre el mantenimiento"
                           {...field}
                           value={field.value ?? ""}
                           className="resize-none"
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Programar Mantenimiento
            </Button>
         </form>
      </Form>
   );
}
