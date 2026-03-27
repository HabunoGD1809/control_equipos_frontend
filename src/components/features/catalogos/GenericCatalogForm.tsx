"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { AsyncCombobox, type Option } from "@/components/ui/AsyncCombobox";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/http";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { catalogosService } from "@/app/services/catalogosService";

type FormValues = {
   nombre: string;
   [key: string]: any;
};

interface GenericCatalogFormProps {
   initialData?: any;
   apiEndpoint: string;
   formFields: string[];
   isUbicacion?: boolean; // <-- PROPIEDAD AÑADIDA
   onSuccess: () => void;
}

// Función auxiliar para humanizar los nombres de los campos
const humanizeFieldName = (field: string) => {
   if (field === "color_hex") return "Color (Hex)";
   if (field === "periodicidad_dias") return "Periodicidad (días)";
   if (field === "requiere_documentacion") return "Requiere Documentación";
   if (field === "es_preventivo") return "Es Preventivo";
   if (field === "departamento_id") return "Departamento"; // <-- AÑADIDO

   // Capitalizar la primera letra y reemplazar guiones bajos por espacios
   return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
};

export function GenericCatalogForm({ initialData, apiEndpoint, formFields, isUbicacion = false, onSuccess }: GenericCatalogFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const defaultValues: Record<string, any> = {};
   formFields.forEach(field => {
      if (field === "es_preventivo" || field === "requiere_documentacion") {
         defaultValues[field] = initialData?.[field] ?? false;
      } else {
         defaultValues[field] = initialData?.[field] ?? "";
      }
   });

   const form = useForm<FormValues>({
      defaultValues,
   });

   // ─── FETCHER DE DEPARTAMENTOS (Solo si es Ubicación) ───
   const fetchDepartamentos = useCallback(async (search: string): Promise<Option[]> => {
      if (!isUbicacion) return [];
      try {
         const data = await catalogosService.getDepartamentos({ include_inactive: false });
         const searchLower = search.toLowerCase();
         const filtered = search
            ? data.filter(d => d.nombre.toLowerCase().includes(searchLower))
            : data;

         return filtered.slice(0, 50).map((d) => ({
            value: d.id,
            label: d.nombre
         }));
      } catch (error) {
         console.error("Error al buscar departamentos:", error);
         return [];
      }
   }, [isUbicacion]);

   const defaultDepartamentoOptions = useMemo<Option[]>(() => {
      if (isUbicacion && initialData?.departamento_rel) {
         return [{
            value: initialData.departamento_rel.id,
            label: initialData.departamento_rel.nombre
         }];
      }
      return [];
   }, [initialData, isUbicacion]);
   // ────────────────────────────────────────────────────────

   const onSubmit = async (data: FormValues) => {
      if (!data.nombre || data.nombre.trim().length < 2) {
         form.setError("nombre", { type: "manual", message: "El nombre debe tener al menos 2 caracteres." });
         return;
      }

      setIsLoading(true);
      try {
         const payload: Record<string, any> = {};

         formFields.forEach((field) => {
            const val = data[field];
            if (val === "" || val === undefined) {
               payload[field] = null;
            } else if (typeof val === "string") {
               payload[field] = val.trim();
            } else {
               payload[field] = val;
            }
         });

         // Casos especiales de validación
         if (payload.color_hex && !/^#[0-9A-F]{6}$/i.test(payload.color_hex)) {
            form.setError("color_hex", { type: "manual", message: "Formato Hex inválido." });
            setIsLoading(false);
            return;
         }

         if (payload.periodicidad_dias !== undefined && payload.periodicidad_dias !== null && payload.periodicidad_dias <= 0) {
            payload.periodicidad_dias = null;
         }

         if (isEditing) {
            await api.put(`${apiEndpoint}/${initialData.id}`, payload);
            toast({ title: "Éxito", description: "Ítem actualizado correctamente." });
         } else {
            await api.post(apiEndpoint, payload);
            toast({ title: "Éxito", description: "Ítem creado correctamente." });
         }
         router.refresh();
         onSuccess();
      } catch (err: any) {
         const { message, field } = getFriendlyErrorMessage(err);

         if (field || message.includes("ya existe")) {
            form.setError("nombre", { type: "manual", message });
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

            {formFields.map((field) => {

               // 1. Caso especial: Color Hex
               if (field === "color_hex") {
                  return (
                     <FormField key={field} control={form.control} name={field} render={({ field: formField }) => (
                        <FormItem>
                           <FormLabel>{humanizeFieldName(field)} <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                           <div className="flex gap-2 items-center">
                              <FormControl>
                                 <Input placeholder="#4CAF50" {...formField} value={formField.value ?? ""} onChange={(e) => formField.onChange(e.target.value)} />
                              </FormControl>
                              <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden border cursor-pointer">
                                 <input type="color" value={formField.value || "#000000"} onChange={(e) => formField.onChange(e.target.value)} className="absolute -inset-2.5 w-12.5 h-12.5 cursor-pointer" />
                              </div>
                           </div>
                           <FormMessage />
                        </FormItem>
                     )} />
                  );
               }

               // 2. Caso especial: Periodicidad (Número)
               if (field === "periodicidad_dias") {
                  return (
                     <FormField key={field} control={form.control} name={field} render={({ field: formField }) => (
                        <FormItem>
                           <FormLabel>{humanizeFieldName(field)} <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                           <FormControl>
                              <Input type="number" min="1" placeholder="Ej: 90" value={formField.value ?? ""} onChange={(e) => {
                                 const n = e.target.valueAsNumber;
                                 formField.onChange(Number.isFinite(n) ? n : null);
                              }} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )} />
                  );
               }

               // 3. Caso especial: Booleanos (Switch)
               if (field === "es_preventivo" || field === "requiere_documentacion") {
                  return (
                     <FormField key={field} control={form.control} name={field} render={({ field: formField }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                           <div className="space-y-0.5"><FormLabel className="text-base">{humanizeFieldName(field)}</FormLabel></div>
                           <FormControl><Switch checked={formField.value ?? false} onCheckedChange={formField.onChange} /></FormControl>
                        </FormItem>
                     )} />
                  );
               }

               // 4. NUEVO CASO: Selector de Departamento (AsyncCombobox)
               if (field === "departamento_id") {
                  return (
                     <FormField key={field} control={form.control} name={field} render={({ field: formField }) => (
                        <FormItem>
                           <FormLabel>{humanizeFieldName(field)} <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                           <FormControl>
                              <AsyncCombobox
                                 value={formField.value}
                                 onChange={formField.onChange}
                                 fetcher={fetchDepartamentos}
                                 defaultOptions={defaultDepartamentoOptions}
                                 placeholder="Buscar departamento..."
                                 emptyMessage="No se encontraron departamentos."
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )} />
                  );
               }

               const isRequired = field === "nombre";

               return (
                  <FormField key={field} control={form.control} name={field} render={({ field: formField }) => (
                     <FormItem>
                        <FormLabel>
                           {humanizeFieldName(field)}
                           {isRequired ? <span className="text-destructive ml-1">*</span> : <span className="text-muted-foreground font-normal text-xs ml-1">(Opcional)</span>}
                        </FormLabel>
                        <FormControl>
                           <Input
                              {...formField}
                              value={formField.value ?? ""}
                              placeholder={field === "nombre" ? "Ej: Sede Principal..." : ""}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
               );
            })}

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
