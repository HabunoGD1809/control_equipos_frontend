"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/use-toast";
import { genericCatalogSchema } from "@/lib/zod";
import { api } from "@/lib/http";

type FormValues = {
   nombre: string;
   descripcion?: string | null;
   color_hex?: string | null;
   periodicidad_dias?: number | null;
   es_preventivo?: boolean;
   requiere_documentacion?: boolean;
};

interface GenericCatalogFormProps {
   initialData?: any;
   apiEndpoint: string;
   formFields: string[];
   onSuccess: () => void;
}

export function GenericCatalogForm({ initialData, apiEndpoint, formFields, onSuccess }: GenericCatalogFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const isEditing = !!initialData;

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(genericCatalogSchema),
      defaultValues: {
         nombre: initialData?.nombre ?? "",
         descripcion: initialData?.descripcion ?? "",
         color_hex: initialData?.color_hex ?? "",
         periodicidad_dias: initialData?.periodicidad_dias ?? null,
         es_preventivo: initialData?.es_preventivo ?? false,
         requiere_documentacion: initialData?.requiere_documentacion ?? false,
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         if (isEditing) {
            await api.put(`${apiEndpoint}/${initialData.id}`, data);
            toast({ title: "Éxito", description: "Ítem actualizado correctamente." });
         } else {
            await api.post(apiEndpoint, data);
            toast({ title: "Éxito", description: "Ítem creado correctamente." });
         }
         router.refresh();
         onSuccess();
      } catch (err) {
         const e = err as Error & { status?: number };
         toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "No se pudo guardar el ítem.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {formFields.includes("nombre") && (
               <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                           <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {formFields.includes("descripcion") && (
               <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                           <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {formFields.includes("color_hex") && (
               <FormField
                  control={form.control}
                  name="color_hex"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Color (Hex)</FormLabel>
                        <div className="flex gap-2">
                           <FormControl>
                              <Input placeholder="#4CAF50" {...field} value={field.value ?? ""} />
                           </FormControl>
                           <div className="w-10 h-10 rounded border" style={{ backgroundColor: field.value || "#ffffff" }} />
                        </div>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {formFields.includes("periodicidad_dias") && (
               <FormField
                  control={form.control}
                  name="periodicidad_dias"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Periodicidad (días)</FormLabel>
                        <FormControl>
                           <Input
                              type="number"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                 const n = e.target.valueAsNumber;
                                 field.onChange(Number.isFinite(n) ? n : null);
                              }}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {formFields.includes("requiere_documentacion") && (
               <FormField
                  control={form.control}
                  name="requiere_documentacion"
                  render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                           <FormLabel className="text-base">Requiere Documentación</FormLabel>
                        </div>
                        <FormControl>
                           <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        </FormControl>
                     </FormItem>
                  )}
               />
            )}

            {formFields.includes("es_preventivo") && (
               <FormField
                  control={form.control}
                  name="es_preventivo"
                  render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                           <FormLabel className="text-base">Es Preventivo</FormLabel>
                        </div>
                        <FormControl>
                           <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        </FormControl>
                     </FormItem>
                  )}
               />
            )}

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
