"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";
import { Documentacion, EstadoDocumentoEnum } from "@/types/api";
import { documentosService } from "@/app/services/documentosService";
import { documentacionVerifySchema } from "@/lib/zod";

interface VerifyDocumentoFormProps {
   documento: Documentacion;
   onSuccess: () => void;
}

type FormValues = z.infer<typeof documentacionVerifySchema>;

export function VerifyDocumentoForm({ documento, onSuccess }: VerifyDocumentoFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(documentacionVerifySchema),
      defaultValues: {
         estado: EstadoDocumentoEnum.Verificado,
         notas_verificacion: documento.notas_verificacion || "",
      },
   });

   const estadoActual = useWatch({ control: form.control, name: "estado" });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         await documentosService.verificar(documento.id, {
            estado: data.estado,
            notas_verificacion: data.notas_verificacion ?? null,
         });

         toast({ title: "Éxito", description: "El estado del documento ha sido actualizado." });
         router.refresh();
         onSuccess();
      } catch (err) {
         const e = err as Error & { status?: number };
         toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "No se pudo actualizar el estado del documento.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
               control={form.control}
               name="estado"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nuevo Estado <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value={EstadoDocumentoEnum.Verificado}>Verificado</SelectItem>
                           <SelectItem value={EstadoDocumentoEnum.Rechazado}>Rechazado</SelectItem>
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="notas_verificacion"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>
                        Notas de Verificación
                        {estadoActual === EstadoDocumentoEnum.Rechazado && <span className="text-destructive ml-1">*</span>}
                     </FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder={estadoActual === EstadoDocumentoEnum.Rechazado ? "Obligatorio: Indique por qué se rechaza el documento..." : "Ej: Documento validado y conforme."}
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
                  Actualizar Estado
               </Button>
            </div>
         </form>
      </Form>
   );
}
