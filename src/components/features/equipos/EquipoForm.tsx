"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter } from "next/navigation";
import { format, isBefore, startOfDay } from "date-fns";
import { Loader2, Save, Eraser } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useToast } from "@/components/ui/use-toast";

import { equipoSchema } from "@/lib/zod";
import { equiposService } from "@/app/services/equiposService";
import type { EquipoCreate, EquipoRead, EstadoEquipo, ProveedorSimple } from "@/types/api";

interface EquipoFormProps {
   estados: EstadoEquipo[];
   proveedores: ProveedorSimple[];
   initialData?: EquipoRead;
   isEditing?: boolean;
   onSuccess?: () => void;
   onCancel?: () => void;
}

type EquipoFormValues = z.infer<typeof equipoSchema>;

const formatToDateString = (d?: Date | null) => (d ? format(d, "yyyy-MM-dd") : null);
const cleanString = (str?: string | null) => (str && str.trim() !== "" ? str.trim() : null);

export function EquipoForm({ estados, proveedores, initialData, isEditing = false, onSuccess, onCancel }: EquipoFormProps) {
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
         fecha_adquisicion: initialData?.fecha_adquisicion ? new Date(initialData.fecha_adquisicion) : null,
         fecha_puesta_marcha: initialData?.fecha_puesta_marcha ? new Date(initialData.fecha_puesta_marcha) : null,
         fecha_garantia_expiracion: initialData?.fecha_garantia_expiracion ? new Date(initialData.fecha_garantia_expiracion) : null,
         valor_adquisicion: initialData?.valor_adquisicion ? Number(initialData.valor_adquisicion) : null,
         centro_costo: initialData?.centro_costo ?? "",
         notas: initialData?.notas ?? "",
      },
   });

   const fechaAdquisicion = form.watch("fecha_adquisicion");
   const today = startOfDay(new Date());

   const handleNumeroSerieChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (val: string) => void) => {
      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
      fieldChange(value);
   };

   const onSubmit: SubmitHandler<EquipoFormValues> = async (data) => {
      setIsLoading(true);
      try {
         const payload: EquipoCreate = {
            ...data,
            codigo_interno: cleanString(data.codigo_interno),
            marca: cleanString(data.marca),
            modelo: cleanString(data.modelo),
            ubicacion_actual: cleanString(data.ubicacion_actual),
            centro_costo: cleanString(data.centro_costo),
            notas: cleanString(data.notas),
            proveedor_id: data.proveedor_id || null,
            fecha_adquisicion: formatToDateString(data.fecha_adquisicion),
            fecha_puesta_marcha: formatToDateString(data.fecha_puesta_marcha),
            fecha_garantia_expiracion: formatToDateString(data.fecha_garantia_expiracion),
            valor_adquisicion: data.valor_adquisicion ?? null,
         };

         if (isEditing && initialData) {
            await equiposService.update(initialData.id, payload);
            toast({ title: "Equipo actualizado", description: `El equipo ${data.nombre} ha sido guardado correctamente.` });
            router.refresh();
            if (onSuccess) onSuccess();
            return;
         }

         await equiposService.create(payload);
         toast({ title: "Equipo creado", description: "El nuevo equipo se ha registrado exitosamente." });
         router.refresh();
         if (onSuccess) onSuccess();
      } catch (error: unknown) {
         const err = error as { detail?: string; message?: string; response?: { data?: { detail?: string } } };
         const detail = err?.response?.data?.detail || err?.detail || err?.message || "";

         if (detail.includes("uq_equipos_numero_serie")) {
            form.setError("numero_serie", { type: "manual", message: "Este número de serie ya existe en el sistema." });
         } else if (detail.includes("uq_equipos_codigo_interno")) {
            form.setError("codigo_interno", { type: "manual", message: "Este código interno ya está asignado." });
         } else {
            toast({ variant: "destructive", title: "Error al guardar", description: detail || "Ocurrió un error inesperado." });
         }
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-xl border p-6 shadow-sm bg-card/50 transition-all">
               <h3 className="mb-6 text-lg font-semibold tracking-tight border-b pb-2">Identificación del Equipo</h3>
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <FormField control={form.control} name="nombre" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Nombre del Equipo <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="Ej: Laptop Dell XPS 15" {...field} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="numero_serie" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Número de Serie <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                           <Input placeholder="EJ: AB-123-XYZ" {...field} className="font-mono uppercase" onChange={(e) => handleNumeroSerieChange(e, field.onChange)} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="codigo_interno" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Código Interno <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl><Input placeholder="Ej: AF-2024-001" {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="estado_id" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Estado Inicial <span className="text-destructive">*</span></FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                           <SelectContent>
                              {estados.map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="marca" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Marca <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl><Input placeholder="Ej: Dell" {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="modelo" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Modelo <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl><Input placeholder="Ej: XPS 15" {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="ubicacion_actual" render={({ field }) => (
                     <FormItem className="md:col-span-2 lg:col-span-3">
                        <FormLabel>Ubicación Actual <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl><Input placeholder="Ej: Almacén Principal, Oficina 102..." {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
               </div>
            </div>

            <div className="rounded-xl border p-6 shadow-sm bg-card/50 transition-all">
               <h3 className="mb-6 text-lg font-semibold tracking-tight border-b pb-2">Detalles Financieros y Ciclo de Vida</h3>
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <FormField control={form.control} name="fecha_adquisicion" render={({ field }) => (
                     <DatePickerField label="Fecha Adquisición (Opcional)" value={field.value} onChange={field.onChange} disabled={(date) => date > today || date < new Date("1900-01-01")} />
                  )} />
                  <FormField control={form.control} name="fecha_puesta_marcha" render={({ field }) => (
                     <DatePickerField label="Puesta en Marcha (Opcional)" value={field.value} onChange={field.onChange} description="Debe ser posterior a la adquisición." disabled={(date) => {
                        if (date > today || date < new Date("1900-01-01")) return true;
                        if (fechaAdquisicion && isBefore(date, startOfDay(fechaAdquisicion))) return true;
                        return false;
                     }} />
                  )} />
                  <FormField control={form.control} name="fecha_garantia_expiracion" render={({ field }) => (
                     <DatePickerField label="Expira Garantía (Opcional)" value={field.value} onChange={field.onChange} disabled={(date) => {
                        if (date < new Date("1900-01-01")) return true;
                        if (fechaAdquisicion && isBefore(date, startOfDay(fechaAdquisicion))) return true;
                        return false;
                     }} />
                  )} />
                  <FormField control={form.control} name="proveedor_id" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Proveedor <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Seleccione proveedor" /></SelectTrigger></FormControl>
                           <SelectContent>
                              <SelectItem value="none">-- Ninguno --</SelectItem>
                              {proveedores.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="valor_adquisicion" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Valor Adquisición <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl>
                           <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">$</span>
                              <Input type="number" step="0.01" className="pl-7" value={field.value ?? ""} onChange={(e) => {
                                 const v = e.target.value;
                                 field.onChange(v === "" ? null : Number(v));
                              }} />
                           </div>
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="centro_costo" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Centro de Costo <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl><Input placeholder="Ej: IT-001" {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="notas" render={({ field }) => (
                     <FormItem className="md:col-span-2 lg:col-span-3">
                        <FormLabel>Notas / Observaciones <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl><Textarea placeholder="Detalles adicionales sobre el equipo..." className="resize-none min-h-25" {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
               </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t mt-4">
               {!isEditing ? (
                  <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={isLoading} className="text-muted-foreground hover:text-foreground">
                     <Eraser className="mr-2 h-4 w-4" /> Limpiar Formulario
                  </Button>
               ) : <div />}

               <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
                  <Button type="submit" disabled={isLoading} className="min-w-37.5">
                     {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                     {isEditing ? "Guardar Cambios" : "Registrar Equipo"}
                  </Button>
               </div>
            </div>
         </form>
      </Form>
   );
}
