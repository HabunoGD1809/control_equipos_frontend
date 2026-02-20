"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useToast } from "@/components/ui/use-toast";
import { tipoItemSchema } from "@/lib/zod";
import { api } from "@/lib/http";
import type { TipoItemInventario, Proveedor } from "@/types/api";

interface TipoItemFormProps {
   initialData?: TipoItemInventario | null;
   proveedores: Proveedor[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof tipoItemSchema>;

function getApiErrorMessage(err: unknown, fallback = "No se pudo guardar el ítem.") {
   if (typeof err === "object" && err) {
      const anyErr = err as any;
      const detail = anyErr?.data?.detail || anyErr?.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      if (typeof anyErr?.message === "string" && anyErr.message.trim()) return anyErr.message;
   }
   return fallback;
}

export function TipoItemForm({ initialData, proveedores, onSuccess }: TipoItemFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(tipoItemSchema),
      defaultValues: initialData || {
         nombre: "",
         categoria: "Consumible",
         unidad_medida: "Unidad",
         stock_minimo: 0,
         proveedor_preferido_id: null,
         sku: null,
         marca: null,
         modelo: null,
         codigo_barras: null,
         descripcion: null,
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const emptyToNull = (val?: string | null) => (val?.trim() === "" ? null : val);

         const payload = {
            ...data,
            sku: emptyToNull(data.sku),
            marca: emptyToNull(data.marca),
            modelo: emptyToNull(data.modelo),
            codigo_barras: emptyToNull(data.codigo_barras),
            descripcion: emptyToNull(data.descripcion),
            proveedor_preferido_id:
               !data.proveedor_preferido_id || data.proveedor_preferido_id === "none"
                  ? null
                  : data.proveedor_preferido_id,
         };

         if (isEditing) {
            await api.put(`/inventario/tipos/${initialData!.id}`, payload);
            toast({ title: "Éxito", description: "Tipo de ítem actualizado correctamente." });
         } else {
            await api.post("/inventario/tipos/", payload);
            toast({ title: "Éxito", description: "Nuevo Tipo de ítem creado exitosamente." });
         }

         router.refresh();
         onSuccess();
      } catch (error) {
         console.error(error);
         toast({
            variant: "destructive",
            title: "Error",
            description: getApiErrorMessage(error),
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto px-1">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                     <FormItem className="md:col-span-2">
                        <FormLabel>Nombre del Ítem <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                           <Input placeholder="Ej. Cartucho Toner Negro" {...field} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Categoría <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione una categoría" />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              <SelectItem value="Consumible">Consumible</SelectItem>
                              <SelectItem value="Parte Repuesto">Parte/Repuesto</SelectItem>
                              <SelectItem value="Accesorio">Accesorio</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="unidad_medida"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Unidad de Medida <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione una unidad" />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              <SelectItem value="Unidad">Unidad</SelectItem>
                              <SelectItem value="Metro">Metro</SelectItem>
                              <SelectItem value="Kg">Kg</SelectItem>
                              <SelectItem value="Litro">Litro</SelectItem>
                              <SelectItem value="Caja">Caja</SelectItem>
                              <SelectItem value="Paquete">Paquete</SelectItem>
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>SKU (Opcional)</FormLabel>
                        <FormControl>
                           <Input placeholder="Ej. TNR-HP-12A" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="codigo_barras"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Código de Barras (Opcional)</FormLabel>
                        <FormControl>
                           <Input placeholder="EAN/UPC..." {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Marca (Opcional)</FormLabel>
                        <FormControl>
                           <Input placeholder="Ej. HP" {...field} value={field.value ?? ""} />
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
                        <FormLabel>Modelo (Opcional)</FormLabel>
                        <FormControl>
                           <Input placeholder="Ej. LaserJet 12A" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="stock_minimo"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Stock Mínimo (Alerta)</FormLabel>
                        <FormControl>
                           <Input
                              type="number"
                              min="0"
                              value={field.value ?? 0}
                              onChange={(e) => {
                                 const n = e.target.valueAsNumber;
                                 field.onChange(Number.isFinite(n) ? n : 0);
                              }}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="proveedor_preferido_id"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Proveedor Preferido (Opcional)</FormLabel>
                        <Select
                           value={field.value ?? "none"}
                           onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                        >
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione un proveedor" />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              <SelectItem value="none">-- Ninguno --</SelectItem>
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
            </div>

            <FormField
               control={form.control}
               name="descripcion"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Descripción / Detalles Adicionales</FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder="Especificaciones técnicas o detalles..."
                           className="resize-none"
                           {...field}
                           value={field.value ?? ""}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Crear Ítem"}
               </Button>
            </div>
         </form>
      </Form>
   );
}
