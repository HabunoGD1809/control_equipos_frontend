"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
   FormDescription,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";

import { TipoDocumento } from "@/types/api";
import { createDocumentoSchema, MIME_TYPE_MAP } from "@/lib/zod";
import { documentosService } from "@/app/services/documentosService";

interface UploadDocumentoFormProps {
   equipoId: string;
   tiposDocumento: TipoDocumento[];
   onSuccess: () => void;
}

type UploadDocumentoValues = z.infer<ReturnType<typeof createDocumentoSchema>>;

export function UploadDocumentoForm({
   equipoId,
   tiposDocumento,
   onSuccess,
}: UploadDocumentoFormProps) {
   const { toast } = useToast();

   const dynamicSchema = useMemo(
      () => createDocumentoSchema(tiposDocumento),
      [tiposDocumento]
   );

   const form = useForm<UploadDocumentoValues>({
      resolver: standardSchemaResolver(dynamicSchema),
      defaultValues: {
         titulo: "",
         tipo_documento_id: "",
         descripcion: "",
         file: undefined,
      },
   });

   // ✅ Reemplazo de watch() (evita warning del React Compiler)
   const selectedTipoId = useWatch({
      control: form.control,
      name: "tipo_documento_id",
   });

   const acceptedExtensions = useMemo(() => {
      if (!selectedTipoId) return undefined;

      const tipo = tiposDocumento.find((t) => t.id === selectedTipoId);
      if (!tipo?.formato_permitido || tipo.formato_permitido.length === 0)
         return undefined;

      const mimes = tipo.formato_permitido.flatMap(
         (ext) => MIME_TYPE_MAP[ext.toLowerCase()] || []
      );
      const exts = tipo.formato_permitido.map((ext) => `.${ext.toLowerCase()}`);

      return [...mimes, ...exts].join(",");
   }, [selectedTipoId, tiposDocumento]);

   const onSubmit = async (values: UploadDocumentoValues) => {
      try {
         await documentosService.upload({
            equipo_id: equipoId,
            titulo: values.titulo,
            tipo_documento_id: values.tipo_documento_id,
            descripcion: values.descripcion || null,
            file: values.file,
         });

         toast({
            title: "Documento subido",
            description: "El archivo se ha almacenado correctamente.",
         });

         form.reset();
         onSuccess();
      } catch (err) {
         const e = err as Error & { status?: number };
         toast({
            variant: "destructive",
            title: "Error de subida",
            description:
               e.message ||
               "Verifique que el formato coincida con el Tipo de Documento seleccionado.",
         });
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
               control={form.control}
               name="titulo"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Título del Documento</FormLabel>
                     <FormControl>
                        <Input placeholder="Ej: Factura de Compra #123" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="tipo_documento_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Documento</FormLabel>

                     <Select
                        value={field.value ?? ""}
                        onValueChange={(val) => {
                           field.onChange(val);
                           form.setValue("file", undefined);
                        }}
                     >
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Seleccione categoría..." />
                           </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                           {tiposDocumento.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                 {tipo.nombre}{" "}
                                 {tipo.requiere_verificacion ? "(Req. Verificación)" : ""}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>

                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="file"
               render={({ field: { onChange, ...fieldProps } }) => (
                  <FormItem>
                     <FormLabel>Archivo</FormLabel>
                     <FormControl>
                        <Input
                           {...fieldProps}
                           type="file"
                           accept={acceptedExtensions}
                           disabled={!selectedTipoId}
                           onChange={(event) => onChange(event.target.files?.[0])}
                        />
                     </FormControl>

                     <FormDescription>
                        {selectedTipoId
                           ? `Formatos permitidos: ${tiposDocumento
                              .find((t) => t.id === selectedTipoId)
                              ?.formato_permitido?.join(", ") || "Todos"
                           }`
                           : "Seleccione un tipo de documento primero."}{" "}
                        (Máx 10 MB)
                     </FormDescription>

                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="descripcion"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Descripción (Opcional)</FormLabel>
                     <FormControl>
                        <Textarea
                           {...field}
                           value={field.value || ""}
                           placeholder="Detalles adicionales..."
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end">
               <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                     <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  Subir Archivo
               </Button>
            </div>
         </form>
      </Form>
   );
}
