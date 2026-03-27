"use client";

import { useState, useCallback, useMemo } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { AsyncCombobox, type Option } from "@/components/ui/AsyncCombobox";
import { useToast } from "@/components/ui/use-toast";

import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { softwareCatalogoSchema } from "@/lib/zod";
import { SoftwareCatalogo, TipoLicenciaSoftwareEnum, MetricaLicenciamientoEnum } from "@/types/api";
import { licenciasService } from "@/app/services/licenciasService";
import { catalogosService } from "@/app/services/catalogosService";

interface SoftwareCatalogoFormProps {
   initialData?: SoftwareCatalogo | null;
   onSuccess: () => void;
}

type FormValues = z.infer<typeof softwareCatalogoSchema>;

export function SoftwareCatalogoForm({ initialData, onSuccess }: SoftwareCatalogoFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(softwareCatalogoSchema),
      defaultValues: {
         nombre: initialData?.nombre ?? "",
         version: initialData?.version ?? "",
         marca_id: initialData?.marca_id ?? null,
         tipo_licencia: initialData?.tipo_licencia ?? undefined,
         metrica_licenciamiento: initialData?.metrica_licenciamiento ?? undefined,
         descripcion: initialData?.descripcion ?? "",
      },
   });

   // ─── FETCHER DE MARCAS (FABRICANTES) ───
   const fetchMarcas = useCallback(async (search: string): Promise<Option[]> => {
      try {
         const data = await catalogosService.getMarcas({ include_inactive: false });
         const searchLower = search.toLowerCase();
         const filtered = search
            ? data.filter(m => m.nombre.toLowerCase().includes(searchLower))
            : data;

         return filtered.slice(0, 50).map((m) => ({
            value: m.id,
            label: m.nombre
         }));
      } catch (error) {
         console.error("Error al buscar marcas:", error);
         return [];
      }
   }, []);

   const defaultMarcaOptions = useMemo<Option[]>(() => {
      if (initialData?.marca_rel) {
         return [{
            value: initialData.marca_rel.id,
            label: initialData.marca_rel.nombre
         }];
      }
      return [];
   }, [initialData]);

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const payload = {
            ...data,
            marca_id: data.marca_id || null,
         };

         if (isEditing) {
            await licenciasService.updateSoftware(initialData!.id, payload as any);
            toast({ title: "Éxito", description: "Software actualizado en el catálogo." });
         } else {
            await licenciasService.createSoftware(payload as any);
            toast({ title: "Éxito", description: "Software añadido al catálogo." });
         }

         router.refresh();
         onSuccess();
      } catch (err: unknown) {
         const { message, field } = getFriendlyErrorMessage(err);
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
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nombre del Software <span className="text-destructive">*</span></FormLabel>
                     <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="version" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Versión</FormLabel>
                     <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />
            </div>

            <FormField control={form.control} name="marca_id" render={({ field }) => (
               <FormItem>
                  <FormLabel>Fabricante / Marca <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                  <FormControl>
                     <AsyncCombobox
                        value={field.value}
                        onChange={field.onChange}
                        fetcher={fetchMarcas}
                        defaultOptions={defaultMarcaOptions}
                        placeholder="Buscar fabricante..."
                        emptyMessage="No se encontraron fabricantes activos."
                     />
                  </FormControl>
                  <FormMessage />
               </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="tipo_licencia" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Licencia <span className="text-destructive">*</span></FormLabel>
                     <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo..." /></SelectTrigger></FormControl>
                        <SelectContent>
                           {Object.values(TipoLicenciaSoftwareEnum).map((v) => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )} />

               <FormField control={form.control} name="metrica_licenciamiento" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Métrica <span className="text-destructive">*</span></FormLabel>
                     <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una métrica..." /></SelectTrigger></FormControl>
                        <SelectContent>
                           {Object.values(MetricaLicenciamientoEnum).map((v) => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )} />
            </div>

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Añadir al Catálogo"}
               </Button>
            </div>
         </form>
      </Form>
   );
}
