"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter } from "next/navigation";
import { format, isBefore, startOfDay } from "date-fns";
import { Loader2, Save } from "lucide-react";
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
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/Select";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useToast } from "@/components/ui/use-toast";

import { equipoSchema } from "@/lib/zod";
import { equiposService } from "@/app/services/equiposService";
import type {
   EquipoCreate,
   EquipoRead,
   EstadoEquipo,
   ProveedorSimple,
} from "@/types/api";

interface EquipoFormProps {
   estados: EstadoEquipo[];
   proveedores: ProveedorSimple[];
   initialData?: EquipoRead;
   isEditing?: boolean;
}

type EquipoFormValues = z.infer<typeof equipoSchema>;

export function EquipoForm({
   estados,
   proveedores,
   initialData,
   isEditing = false,
}: EquipoFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<EquipoFormValues>({
      resolver: standardSchemaResolver(equipoSchema),
      defaultValues: {
         nombre: initialData?.nombre ?? "",
         numero_serie: initialData?.numero_serie ?? "",
         codigo_interno: initialData?.codigo_interno ?? "",
         estado_id: initialData?.estado_id ?? "",
         proveedor_id: initialData?.proveedor_id ?? null,
         ubicacion_actual: initialData?.ubicacion_actual ?? "",
         marca: initialData?.marca ?? "",
         modelo: initialData?.modelo ?? "",
         fecha_adquisicion: initialData?.fecha_adquisicion
            ? new Date(initialData.fecha_adquisicion)
            : null,
         fecha_puesta_marcha: initialData?.fecha_puesta_marcha
            ? new Date(initialData.fecha_puesta_marcha)
            : null,
         fecha_garantia_expiracion: initialData?.fecha_garantia_expiracion
            ? new Date(initialData.fecha_garantia_expiracion)
            : null,
         valor_adquisicion:
            initialData?.valor_adquisicion !== undefined &&
               initialData?.valor_adquisicion !== null &&
               String(initialData.valor_adquisicion).trim() !== ""
               ? Number(initialData.valor_adquisicion)
               : null,
         centro_costo: initialData?.centro_costo ?? "",
         notas: initialData?.notas ?? "",
      },
   });

   const fechaAdquisicion = form.watch("fecha_adquisicion");

   // Fecha de hoy normalizada a inicio del día — evita bugs al navegar meses
   const today = startOfDay(new Date());

   const handleNumeroSerieChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      fieldChange: (val: string) => void
   ) => {
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (value.length > 3) value = value.slice(0, 3) + "-" + value.slice(3);
      if (value.length > 7) value = value.slice(0, 7) + "-" + value.slice(7);
      fieldChange(value.slice(0, 11));
   };

   const onSubmit: SubmitHandler<EquipoFormValues> = async (data) => {
      setIsLoading(true);
      try {
         const formatDate = (d?: Date | null) => (d ? format(d, "yyyy-MM-dd") : null);

         const payload: EquipoCreate = {
            ...data,
            proveedor_id:
               !data.proveedor_id || data.proveedor_id === ("none" as any)
                  ? null
                  : data.proveedor_id,
            fecha_adquisicion: formatDate(data.fecha_adquisicion),
            fecha_puesta_marcha: formatDate(data.fecha_puesta_marcha),
            fecha_garantia_expiracion: formatDate(data.fecha_garantia_expiracion),
            valor_adquisicion: data.valor_adquisicion ?? null,
         };

         if (isEditing && initialData) {
            await equiposService.update(initialData.id, payload);
            toast({
               title: "Equipo actualizado",
               description: `El equipo ${data.nombre} ha sido guardado correctamente.`,
            });
            router.refresh();
            router.back();
            return;
         }

         await equiposService.create(payload);
         toast({
            title: "Equipo creado",
            description: "El nuevo equipo se ha registrado exitosamente.",
         });
         router.push("/equipos");
         router.refresh();
      } catch (error: any) {
         const detail = error?.message || "";

         if (detail.includes("uq_equipos_numero_serie")) {
            form.setError("numero_serie", {
               type: "manual",
               message: "Este número de serie ya existe en el sistema.",
            });
         } else if (detail.includes("uq_equipos_codigo_interno")) {
            form.setError("codigo_interno", {
               type: "manual",
               message: "Este código interno ya está asignado.",
            });
         } else {
            toast({
               variant: "destructive",
               title: "Error al guardar",
               description: detail || "Ocurrió un error inesperado.",
            });
         }
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* ── Identificación ─────────────────────────────────────── */}
            <div className="rounded-lg border p-4 shadow-sm bg-card">
               <h3 className="mb-4 text-lg font-medium">Identificación del Equipo</h3>
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

                  <FormField
                     control={form.control}
                     name="nombre"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Nombre del Equipo <span className="text-destructive">*</span></FormLabel>
                           <FormControl>
                              <Input placeholder="Ej: Laptop Dell XPS 15" {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="numero_serie"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Número de Serie <span className="text-destructive">*</span></FormLabel>
                           <FormControl>
                              <Input
                                 placeholder="XXX-XXX-XXX"
                                 {...field}
                                 className="font-mono uppercase"
                                 onChange={(e) => handleNumeroSerieChange(e, field.onChange)}
                                 maxLength={11}
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="codigo_interno"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Código Interno</FormLabel>
                           <FormControl>
                              <Input placeholder="Ej: AF-2024-001" {...field} value={field.value ?? ""} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="estado_id"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Estado Inicial <span className="text-destructive">*</span></FormLabel>
                           <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                 <SelectTrigger>
                                    <SelectValue placeholder="Seleccione" />
                                 </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                 {estados.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="marca"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Marca</FormLabel>
                           <FormControl>
                              <Input placeholder="Ej: Dell" {...field} value={field.value ?? ""} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="modelo"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Modelo</FormLabel>
                           <FormControl>
                              <Input placeholder="Ej: XPS 15" {...field} value={field.value ?? ""} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
               </div>
            </div>

            {/* ── Financiero y ciclo de vida ──────────────────────────── */}
            <div className="rounded-lg border p-4 shadow-sm bg-card">
               <h3 className="mb-4 text-lg font-medium">Detalles Financieros y Ciclo de Vida</h3>
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

                  <FormField
                     control={form.control}
                     name="fecha_adquisicion"
                     render={({ field }) => (
                        <DatePickerField
                           label="Fecha Adquisición"
                           value={field.value}
                           onChange={field.onChange}
                           disabled={(date) =>
                              date > today || date < new Date("1900-01-01")
                           }
                        />
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="fecha_puesta_marcha"
                     render={({ field }) => (
                        <DatePickerField
                           label="Puesta en Marcha"
                           value={field.value}
                           onChange={field.onChange}
                           description="Debe ser posterior a la adquisición."
                           disabled={(date) => {
                              if (date > today || date < new Date("1900-01-01")) return true;
                              if (fechaAdquisicion && isBefore(date, startOfDay(fechaAdquisicion))) return true;
                              return false;
                           }}
                        />
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="fecha_garantia_expiracion"
                     render={({ field }) => (
                        <DatePickerField
                           label="Expira Garantía"
                           value={field.value}
                           onChange={field.onChange}
                           disabled={(date) => {
                              if (date < new Date("1900-01-01")) return true;
                              if (fechaAdquisicion && isBefore(date, startOfDay(fechaAdquisicion))) return true;
                              return false;
                           }}
                        />
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="proveedor_id"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Proveedor</FormLabel>
                           <Select
                              value={field.value ?? "none"}
                              onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                           >
                              <FormControl>
                                 <SelectTrigger>
                                    <SelectValue placeholder="Seleccione" />
                                 </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                 <SelectItem value="none">-- Ninguno --</SelectItem>
                                 {proveedores.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="valor_adquisicion"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Valor Adquisición</FormLabel>
                           <FormControl>
                              <div className="relative">
                                 <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                 <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-7"
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                       const v = e.target.value;
                                       field.onChange(v === "" ? null : Number(v));
                                    }}
                                 />
                              </div>
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="centro_costo"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Centro de Costo</FormLabel>
                           <FormControl>
                              <Input placeholder="Ej: IT-001" {...field} value={field.value ?? ""} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
               </div>
            </div>

            {/* ── Acciones ───────────────────────────────────────────── */}
            <div className="flex justify-end space-x-4">
               <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
               >
                  Cancelar
               </Button>
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Registrar Equipo"}
                  {!isLoading && <Save className="ml-2 h-4 w-4" />}
               </Button>
            </div>

         </form>
      </Form>
   );
}
