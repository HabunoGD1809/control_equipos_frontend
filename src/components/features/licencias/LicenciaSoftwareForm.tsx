"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useToast } from "@/components/ui/use-toast";
import { licenciaSoftwareSchema } from "@/lib/zod";
import { LicenciaSoftware, SoftwareCatalogo, Proveedor } from "@/types/api";
import { licenciasService } from "@/app/services/licenciasService";

interface LicenciaSoftwareFormProps {
   initialData: LicenciaSoftware | null;
   catalogo: SoftwareCatalogo[];
   proveedores: Proveedor[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof licenciaSoftwareSchema>;

export function LicenciaSoftwareForm({ initialData, catalogo, proveedores, onSuccess }: LicenciaSoftwareFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(licenciaSoftwareSchema),
      defaultValues: {
         software_catalogo_id: initialData?.software_catalogo_id || undefined,
         clave_producto: initialData?.clave_producto || "",
         fecha_adquisicion: initialData?.fecha_adquisicion ? new Date(initialData.fecha_adquisicion) : undefined,
         fecha_expiracion: initialData?.fecha_expiracion ? new Date(initialData.fecha_expiracion) : undefined,
         proveedor_id: initialData?.proveedor_id ?? null,
         costo_adquisicion:
            initialData?.costo_adquisicion == null ? undefined : Number(initialData.costo_adquisicion),
         numero_orden_compra: initialData?.numero_orden_compra || "",
         cantidad_total: initialData?.cantidad_total || 1,
         notas: initialData?.notas || "",
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const payload = {
            ...data,
            // ✅ convertir "none" de vuelta a null
            proveedor_id:
               !data.proveedor_id || data.proveedor_id === "none"
                  ? null
                  : data.proveedor_id,
            costo_adquisicion: data.costo_adquisicion ?? null,
            fecha_adquisicion: format(data.fecha_adquisicion, "yyyy-MM-dd"),
            fecha_expiracion: data.fecha_expiracion ? format(data.fecha_expiracion, "yyyy-MM-dd") : null,
         };

         if (initialData) {
            await licenciasService.update(initialData.id, payload as any);
            toast({ title: "Éxito", description: "Licencia actualizada correctamente." });
         } else {
            await licenciasService.create(payload as any);
            toast({ title: "Éxito", description: "Licencia registrada correctamente." });
         }

         router.refresh();
         onSuccess();
      } catch (err) {
         const e = err as Error & { status?: number };
         toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "No se pudo guardar la licencia.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-4">

            {/* Software */}
            <FormField
               control={form.control}
               name="software_catalogo_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Software (del Catálogo)</FormLabel>
                     <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                     >
                        <FormControl>
                           <SelectTrigger><SelectValue placeholder="Seleccione un software..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {catalogo.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                 {item.nombre} {item.version || ""}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {/* Clave */}
            <FormField
               control={form.control}
               name="clave_producto"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Clave del Producto</FormLabel>
                     <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="fecha_adquisicion"
                  render={({ field }) => (
                     <DatePickerField
                        label="Fecha de Adquisición"
                        value={field.value}
                        onChange={field.onChange}
                     />
                  )}
               />

               <FormField
                  control={form.control}
                  name="fecha_expiracion"
                  render={({ field }) => (
                     <DatePickerField
                        label="Fecha de Expiración"
                        value={field.value ?? null}
                        onChange={field.onChange}
                        description="Opcional"
                     />
                  )}
               />
            </div>

            {/* Cantidad y Costo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="cantidad_total"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Cantidad de Puestos</FormLabel>
                        <FormControl>
                           <Input
                              type="number"
                              min={1}
                              value={field.value ?? 1}
                              onChange={(e) => {
                                 const n = e.target.valueAsNumber;
                                 field.onChange(Number.isFinite(n) ? n : 1);
                              }}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="costo_adquisicion"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Costo de Adquisición</FormLabel>
                        <FormControl>
                           <Input
                              type="number"
                              step="0.01"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                 const n = e.target.valueAsNumber;
                                 field.onChange(Number.isFinite(n) ? n : undefined);
                              }}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            {/* Proveedor — ✅ "none" en lugar de "" */}
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
                           <SelectTrigger><SelectValue placeholder="Seleccione un proveedor..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="none">-- Sin proveedor --</SelectItem>
                           {proveedores.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                 {p.nombre}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? "Guardar Cambios" : "Registrar Licencia"}
               </Button>
            </div>
         </form>
      </Form>
   );
}
