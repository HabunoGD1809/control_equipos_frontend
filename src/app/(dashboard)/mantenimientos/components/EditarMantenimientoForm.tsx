"use client";

import { useMemo, useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
   FormDescription,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

import type {
   Mantenimiento,
   MantenimientoUpdate,
   Proveedor,
   EstadoMantenimiento,
} from "@/types/api";
import { EstadoMantenimientoEnum } from "@/types/api";
import { api } from "@/lib/http";

// ─── SCHEMA LOCAL ─────────────────────────────────────────────────────────────
//
// Definimos el schema aquí en lugar de extender mantenimientoUpdateSchema con
// .superRefine(), porque Zod v4 convierte los campos z.coerce.number() en
// `unknown` al aplicar .superRefine() sobre un schema externo, rompiendo la
// inferencia de tipos que useForm<FormValues> necesita.

const editarMantenimientoSchema = z.object({
   fecha_programada: z.date().optional(),
   fecha_inicio: z.date().optional(),
   fecha_finalizacion: z.date().optional(),
   costo_estimado: z.coerce.number().min(0).optional(),
   costo_real: z.coerce.number().min(0).optional(),
   tecnico_responsable: z.string().optional(),
   proveedor_servicio_id: z.guid().optional().nullable(),
   prioridad: z.coerce.number().int().min(0).max(2).optional(),
   estado: z.enum(
      Object.values(EstadoMantenimientoEnum) as [EstadoMantenimiento, ...EstadoMantenimiento[]]
   ).optional(),
   observaciones: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof editarMantenimientoSchema>;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function toNumberOrUndefined(v: unknown): number | undefined {
   if (v === null || v === undefined) return undefined;
   if (typeof v === "number" && Number.isFinite(v)) return v;
   if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
   }
   return undefined;
}

function getErrorMessage(
   err: unknown,
   fallback = "No se pudo actualizar el mantenimiento."
) {
   if (typeof err === "object" && err) {
      const anyErr = err as Record<string, unknown>;
      const data = anyErr?.data as Record<string, unknown> | undefined;
      const detail = data?.detail ?? anyErr?.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      if (typeof anyErr?.message === "string" && anyErr.message.trim())
         return anyErr.message as string;
   }
   return fallback;
}

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface EditarMantenimientoFormProps {
   mantenimiento: Mantenimiento;
   proveedores: Proveedor[];
   onSuccess: () => void;
   tieneDocumentosAdjuntos: boolean;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function EditarMantenimientoForm({
   mantenimiento,
   proveedores,
   onSuccess,
   tieneDocumentosAdjuntos,
}: EditarMantenimientoFormProps) {
   const { toast } = useToast();
   const router = useRouter();
   const [isLoading, setIsLoading] = useState(false);

   // El schema dinámico cierra sobre los valores de props para las validaciones
   // condicionales. Se recalcula solo cuando cambian las dependencias relevantes.
   const formSchema = useMemo(
      () =>
         editarMantenimientoSchema.check((ctx) => {
            const data = ctx.value;

            if (data.estado === EstadoMantenimientoEnum.Completado) {
               if (
                  mantenimiento.tipo_mantenimiento.requiere_documentacion &&
                  !tieneDocumentosAdjuntos
               ) {
                  ctx.issues.push({
                     code: "custom",
                     message:
                        "Este tipo de mantenimiento requiere evidencia documental adjunta antes de completarse.",
                     path: ["estado"],
                     input: data.estado,
                  });
               }

               if (data.costo_real === undefined || data.costo_real === null) {
                  ctx.issues.push({
                     code: "custom",
                     message: "Debe registrar el costo real para completar la orden.",
                     path: ["costo_real"],
                     input: data.costo_real,
                  });
               }

               if (!data.fecha_inicio) {
                  ctx.issues.push({
                     code: "custom",
                     message: "Fecha inicio requerida.",
                     path: ["fecha_inicio"],
                     input: data.fecha_inicio,
                  });
               }

               if (!data.fecha_finalizacion) {
                  ctx.issues.push({
                     code: "custom",
                     message: "Fecha finalización requerida.",
                     path: ["fecha_finalizacion"],
                     input: data.fecha_finalizacion,
                  });
               } else if (
                  data.fecha_inicio &&
                  isAfter(data.fecha_inicio, data.fecha_finalizacion)
               ) {
                  ctx.issues.push({
                     code: "custom",
                     message: "La finalización no puede ser antes del inicio.",
                     path: ["fecha_finalizacion"],
                     input: data.fecha_finalizacion,
                  });
               }
            }
         }),
      [mantenimiento.tipo_mantenimiento.requiere_documentacion, tieneDocumentosAdjuntos]
   );

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(formSchema),
      defaultValues: {
         tecnico_responsable: mantenimiento.tecnico_responsable ?? "",
         observaciones: mantenimiento.observaciones ?? undefined,
         estado: mantenimiento.estado as EstadoMantenimiento,
         prioridad: mantenimiento.prioridad,
         proveedor_servicio_id: mantenimiento.proveedor_servicio_id ?? null,
         fecha_programada: mantenimiento.fecha_programada
            ? new Date(mantenimiento.fecha_programada)
            : undefined,
         fecha_inicio: mantenimiento.fecha_inicio
            ? new Date(mantenimiento.fecha_inicio)
            : undefined,
         fecha_finalizacion: mantenimiento.fecha_finalizacion
            ? new Date(mantenimiento.fecha_finalizacion)
            : undefined,
         costo_real: toNumberOrUndefined(mantenimiento.costo_real),
         costo_estimado: toNumberOrUndefined(mantenimiento.costo_estimado),
      },
   });

   const currentEstado = form.watch("estado");

   async function onSubmit(values: FormValues) {
      setIsLoading(true);
      try {
         const dataToSubmit: MantenimientoUpdate = {
            ...values,
            fecha_programada: values.fecha_programada
               ? values.fecha_programada.toISOString()
               : undefined,
            fecha_inicio: values.fecha_inicio
               ? values.fecha_inicio.toISOString()
               : undefined,
            fecha_finalizacion: values.fecha_finalizacion
               ? values.fecha_finalizacion.toISOString()
               : undefined,
            costo_real:
               values.costo_real !== undefined && values.costo_real !== null
                  ? String(values.costo_real)
                  : undefined,
            costo_estimado:
               values.costo_estimado !== undefined && values.costo_estimado !== null
                  ? String(values.costo_estimado)
                  : undefined,
            // observaciones: null → undefined para no enviar null al backend
            observaciones: values.observaciones ?? undefined,
         };

         await api.put(`/mantenimientos/${mantenimiento.id}`, dataToSubmit);

         toast({
            title: "Mantenimiento actualizado",
            description:
               values.estado === EstadoMantenimientoEnum.Completado
                  ? "La orden ha sido cerrada exitosamente."
                  : "Cambios guardados.",
         });

         router.refresh();
         onSuccess();
      } catch (error) {
         console.error(error);
         toast({
            title: "Error",
            description: getErrorMessage(error),
            variant: "destructive",
         });
      } finally {
         setIsLoading(false);
      }
   }

   return (
      <Form {...form}>
         <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-h-[75vh] overflow-y-auto pr-2"
         >
            {/* Aviso documentación pendiente */}
            {mantenimiento.tipo_mantenimiento.requiere_documentacion &&
               !tieneDocumentosAdjuntos &&
               currentEstado !== EstadoMantenimientoEnum.Completado && (
                  <Alert
                     variant="default"
                     className="bg-yellow-50 border-yellow-200 text-yellow-800"
                  >
                     <AlertTriangle className="h-4 w-4 text-yellow-600" />
                     <AlertTitle>Documentación Pendiente</AlertTitle>
                     <AlertDescription>
                        Este tipo de mantenimiento requiere adjuntar documentos antes de
                        poder marcarse como <strong>Completado</strong>.
                     </AlertDescription>
                  </Alert>
               )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                           onValueChange={field.onChange}
                           defaultValue={field.value ?? ""}
                        >
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Selecciona un estado" />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {Object.values(EstadoMantenimientoEnum).map((estado) => (
                                 <SelectItem key={estado} value={estado}>
                                    {estado}
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
                           <Input
                              placeholder="Nombre del técnico"
                              {...field}
                              value={field.value ?? ""}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field }) => (
                     <FormItem className="flex flex-col">
                        <FormLabel>Fecha Inicio Real</FormLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <FormControl>
                                 <Button
                                    variant={"outline"}
                                    className={cn(
                                       "w-full pl-3 text-left font-normal",
                                       !field.value && "text-muted-foreground"
                                    )}
                                 >
                                    {field.value ? (
                                       format(field.value, "PPP", { locale: es })
                                    ) : (
                                       <span>Sin iniciar</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                              </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                 mode="single"
                                 selected={field.value ?? undefined}
                                 onSelect={field.onChange}
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
                  name="fecha_finalizacion"
                  render={({ field }) => (
                     <FormItem className="flex flex-col">
                        <FormLabel>Fecha Finalización Real</FormLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <FormControl>
                                 <Button
                                    variant={"outline"}
                                    className={cn(
                                       "w-full pl-3 text-left font-normal",
                                       !field.value && "text-muted-foreground"
                                    )}
                                 >
                                    {field.value ? (
                                       format(field.value, "PPP", { locale: es })
                                    ) : (
                                       <span>Sin finalizar</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                              </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                 mode="single"
                                 selected={field.value ?? undefined}
                                 onSelect={field.onChange}
                                 autoFocus
                              />
                           </PopoverContent>
                        </Popover>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="costo_estimado"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Costo Estimado</FormLabel>
                        <FormControl>
                           <Input
                              type="number"
                              step="0.01"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                 field.onChange(
                                    e.target.value === "" ? undefined : e.target.valueAsNumber
                                 )
                              }
                           />
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
                        <FormLabel>
                           Costo Real{" "}
                           {currentEstado === EstadoMantenimientoEnum.Completado && (
                              <span className="text-red-500">*</span>
                           )}
                        </FormLabel>
                        <FormControl>
                           <Input
                              type="number"
                              step="0.01"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                 field.onChange(
                                    e.target.value === "" ? undefined : e.target.valueAsNumber
                                 )
                              }
                           />
                        </FormControl>
                        <FormDescription>Requerido para completar.</FormDescription>
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
                     <FormLabel>Observaciones / Informe Técnico</FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder="Detalles del trabajo realizado..."
                           className="min-h-25"
                           {...field}
                           value={field.value ?? ""}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-4 border-t">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentEstado === EstadoMantenimientoEnum.Completado
                     ? "Cerrar Mantenimiento"
                     : "Guardar Cambios"}
               </Button>
            </div>
         </form>
      </Form>
   );
}
