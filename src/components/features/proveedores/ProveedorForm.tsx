"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";
import { proveedorSchema } from "@/lib/zod";
import { Proveedor } from "@/types/api";
import { proveedoresService } from "@/app/services/proveedoresService";

interface ProveedorFormProps {
   initialData?: Proveedor;
   onSuccess: () => void;
}

type FormValues = z.infer<typeof proveedorSchema>;

export function ProveedorForm({ initialData, onSuccess }: ProveedorFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(proveedorSchema),
      defaultValues: {
         nombre: initialData?.nombre ?? "",
         descripcion: initialData?.descripcion ?? "",
         rnc: initialData?.rnc ?? "",
         contacto: initialData?.contacto ?? "",
         direccion: initialData?.direccion ?? "",
         sitio_web: initialData?.sitio_web ?? "",
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const cleanPayload = {
            nombre: data.nombre,
            descripcion: data.descripcion?.trim() || null,
            rnc: data.rnc?.trim() || null,
            contacto: data.contacto?.trim() || null,
            direccion: data.direccion?.trim() || null,
            sitio_web: data.sitio_web?.trim() || null,
         };

         if (initialData) {
            await proveedoresService.update(initialData.id, cleanPayload as any);
            toast({ title: "Proveedor actualizado" });
         } else {
            await proveedoresService.create(cleanPayload as any);
            toast({ title: "Proveedor registrado" });
         }
         onSuccess();
      } catch (err) {
         const e = err as Error & { status?: number };
         toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "Error al procesar la solicitud.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
               control={form.control}
               name="nombre"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nombre de la Empresa <span className="text-destructive">*</span></FormLabel>
                     <FormControl>
                        <Input placeholder="Ej: Tech Solutions SRL" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="rnc"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>RNC / Identificación <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl>
                           <Input placeholder="101-xxxxx-x" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="contacto"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Email de Contacto <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl>
                           <Input placeholder="ventas@empresa.com" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <FormField
               control={form.control}
               name="sitio_web"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Sitio Web <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="direccion"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Dirección Física <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <Textarea className="resize-none" placeholder="Av. Principal #123..." {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="descripcion"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Notas / Descripción <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <Input placeholder="Proveedor de hardware..." {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-2">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? "Guardar Cambios" : "Registrar Proveedor"}
               </Button>
            </div>
         </form>
      </Form>
   );
}
