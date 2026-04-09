"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { AsyncCombobox, type Option } from "@/components/ui/AsyncCombobox";
import { useToast } from "@/components/ui/use-toast";

import { tipoItemSchema } from "@/lib/zod";
import { api } from "@/lib/http";
import { catalogosService } from "@/app/services/catalogosService";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import type { TipoItemInventario, Proveedor } from "@/types/api";

interface TipoItemFormProps {
   initialData?: TipoItemInventario | null;
   proveedores: Proveedor[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof tipoItemSchema>;

export function TipoItemForm({ initialData, proveedores, onSuccess }: TipoItemFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   // ESTADO ROBUSTO PARA PRECARGA
   const [marcas, setMarcas] = useState<Option[]>([]);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(tipoItemSchema),
      defaultValues: initialData ? {
         ...initialData,
         marca_id: initialData.marca_id || null,
      } : {
         nombre: "",
         categoria: "Consumible",
         unidad_medida: "Unidad",
         stock_minimo: 0,
         proveedor_preferido_id: null,
         sku: null,
         marca_id: null,
         modelo: null,
         codigo_barras: null,
         descripcion: null,
      },
   });

   // DESCARGA INICIAL DE CATÁLOGOS (Una sola vez)
   useEffect(() => {
      let isMounted = true;
      catalogosService.getMarcas({ include_inactive: false })
         .then(data => {
            if (isMounted && Array.isArray(data)) {
               setMarcas(data.map(m => ({ value: m.id, label: m.nombre })));
            }
         }).catch(console.error);
      return () => { isMounted = false; };
   }, []);

   // OPCIONES POR DEFECTO DINÁMICAS
   const defaultMarcaOptions = useMemo<Option[]>(() => {
      if (marcas.length > 0) return marcas;
      if (initialData?.marca_rel) return [{ value: initialData.marca_rel.id, label: initialData.marca_rel.nombre }];
      return [];
   }, [marcas, initialData]);

   // FETCHER LOCAL SÚPER RÁPIDO
   const fetchMarcas = useCallback(async (search: string): Promise<Option[]> => {
      const searchLower = search.toLowerCase();
      return marcas.filter(m => m.label.toLowerCase().includes(searchLower));
   }, [marcas]);

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const emptyToNull = (val?: string | null) => (val?.trim() === "" ? null : val);

         const payload = {
            ...data,
            sku: emptyToNull(data.sku),
            marca_id: data.marca_id || null,
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
      } catch (error: unknown) {
         const { message, field } = getFriendlyErrorMessage(error);
         if (field) {
            form.setError(field as keyof FormValues, { type: "manual", message });
         } else {
            toast({ variant: "destructive", title: "Error", description: message });
         }
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                     <FormLabel>Nombre del Ítem <span className="text-destructive">*</span></FormLabel>
                     <FormControl><Input placeholder="Ej. Cartucho Toner Negro" {...field} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="categoria" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Categoría <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una categoría" /></SelectTrigger></FormControl>
                        <SelectContent>
                           <SelectItem value="Consumible">Consumible</SelectItem>
                           <SelectItem value="Parte Repuesto">Parte/Repuesto</SelectItem>
                           <SelectItem value="Accesorio">Accesorio</SelectItem>
                           <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="unidad_medida" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Unidad de Medida <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una unidad" /></SelectTrigger></FormControl>
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
               )} />

               <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                     <FormLabel>SKU (Opcional)</FormLabel>
                     <FormControl><Input placeholder="Ej. TNR-HP-12A" {...field} value={field.value ?? ""} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="codigo_barras" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Código de Barras (Opcional)</FormLabel>
                     <FormControl><Input placeholder="EAN/UPC..." {...field} value={field.value ?? ""} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="marca_id" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Marca <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <AsyncCombobox
                           value={field.value}
                           onChange={field.onChange}
                           fetcher={fetchMarcas}
                           defaultOptions={defaultMarcaOptions}
                           placeholder="Buscar marca..."
                           emptyMessage="No se encontraron marcas activas."
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="modelo" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Modelo (Opcional)</FormLabel>
                     <FormControl><Input placeholder="Ej. LaserJet 12A" {...field} value={field.value ?? ""} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="stock_minimo" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Stock Mínimo (Alerta)</FormLabel>
                     <FormControl>
                        <Input type="number" min="0" value={field.value ?? 0} onChange={(e) => {
                           const n = e.target.valueAsNumber;
                           field.onChange(Number.isFinite(n) ? n : 0);
                        }} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="proveedor_preferido_id" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Proveedor Preferido (Opcional)</FormLabel>
                     <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un proveedor" /></SelectTrigger></FormControl>
                        <SelectContent>
                           <SelectItem value="none">-- Ninguno --</SelectItem>
                           {proveedores.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )} />
            </div>

            <FormField control={form.control} name="descripcion" render={({ field }) => (
               <FormItem>
                  <FormLabel>Descripción / Detalles Adicionales</FormLabel>
                  <FormControl><Textarea placeholder="Especificaciones técnicas o detalles..." className="resize-none" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
               </FormItem>
            )} />

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
