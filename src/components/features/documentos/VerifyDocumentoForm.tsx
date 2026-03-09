"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { Documentacion, EstadoDocumentoEnum, DocumentacionVerify } from "@/types/api";
import { documentosService } from "@/app/services/documentosService";
import { documentacionVerifySchema } from "@/lib/zod";

interface VerifyDocumentoFormProps {
   documento: Documentacion;
   onSuccess: () => void;
}

type FormValues = z.infer<typeof documentacionVerifySchema>;

const cleanString = (str?: string | null) => (str && str.trim() !== "" ? str.trim() : null);

export function VerifyDocumentoForm({ documento, onSuccess }: VerifyDocumentoFormProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(documentacionVerifySchema),
      defaultValues: {
         estado: EstadoDocumentoEnum.Verificado,
         notas_verificacion: documento.notas_verificacion || "",
      },
   });

   const estadoActual = useWatch({ control: form.control, name: "estado" });

   const mutation = useMutation({
      mutationFn: (payload: DocumentacionVerify) =>
         documentosService.verificar(documento.id, payload),
      onSuccess: () => {
         toast({ title: "Éxito", description: "El estado del documento ha sido actualizado." });

         queryClient.invalidateQueries({ queryKey: ["documentos"] });
         if (documento.equipo?.id) queryClient.invalidateQueries({ queryKey: ["equipo", documento.equipo.id] });
         if (documento.mantenimiento?.id) queryClient.invalidateQueries({ queryKey: ["mantenimiento", documento.mantenimiento.id] });
         if (documento.licencia?.id) queryClient.invalidateQueries({ queryKey: ["licencia", documento.licencia.id] });

         onSuccess();
      },
      onError: (error: unknown) => {
         const { message } = getFriendlyErrorMessage(error);
         toast({
            variant: "destructive",
            title: "Error",
            description: message,
         });
      }
   });

   const onSubmit = (data: FormValues) => {
      mutation.mutate({
         estado: data.estado as typeof EstadoDocumentoEnum.Verificado | typeof EstadoDocumentoEnum.Rechazado,
         notas_verificacion: cleanString(data.notas_verificacion),
      });
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
                        {estadoActual === EstadoDocumentoEnum.Rechazado ? (
                           <span className="text-destructive ml-1">*</span>
                        ) : (
                           <span className="text-muted-foreground font-normal text-xs ml-1">(Opcional)</span>
                        )}
                     </FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder={estadoActual === EstadoDocumentoEnum.Rechazado ? "Obligatorio: Indique por qué se rechaza el documento..." : "Ej: Documento validado y conforme."}
                           className="resize-none"
                           {...field}
                           value={field.value ?? ""}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-4 border-t">
               <Button type="submit" disabled={mutation.isPending} className="min-w-37.5">
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualizar Estado
               </Button>
            </div>
         </form>
      </Form>
   );
}
