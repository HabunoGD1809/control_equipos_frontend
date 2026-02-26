"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { Loader2, UploadCloud } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

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

import { TipoDocumento, EquipoSimple } from "@/types/api";
import { createDocumentoSchema, MIME_TYPE_MAP } from "@/lib/zod";
import { documentosService } from "@/app/services/documentosService";
import { api } from "@/lib/http";

interface UploadDocumentoFormProps {
   equipoId?: string;
   mantenimientoId?: string;
   licenciaId?: string;
   tiposDocumento: TipoDocumento[];
   onSuccess: () => void;
}

type UploadDocumentoValues = z.infer<ReturnType<typeof createDocumentoSchema>>;

const cleanString = (str?: string | null) => (str && str.trim() !== "" ? str.trim() : null);

export function UploadDocumentoForm({
   equipoId,
   mantenimientoId,
   licenciaId,
   tiposDocumento,
   onSuccess,
}: UploadDocumentoFormProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   // FASE UX: Detectamos si el formulario se abrió en la página global (sin dependencias previas)
   const isStandalone = !equipoId && !mantenimientoId && !licenciaId;

   // Si es global, el propio formulario consulta los equipos para no forzar "Prop Drilling" desde arriba
   const { data: equiposDisponibles = [], isLoading: isLoadingEquipos } = useQuery({
      queryKey: ["equipos-dropdown"],
      queryFn: async () => {
         const res = await api.get<any>("/equipos", { params: { limit: 1000 } });
         return (Array.isArray(res) ? res : res.items || []) as EquipoSimple[];
      },
      enabled: isStandalone, // Solo se ejecuta si estamos en la vista independiente
   });

   const dynamicSchema = useMemo(
      () => createDocumentoSchema(tiposDocumento),
      [tiposDocumento]
   );

   const form = useForm<UploadDocumentoValues>({
      resolver: standardSchemaResolver(dynamicSchema),
      defaultValues: {
         titulo: "",
         tipo_documento_id: undefined as any,
         descripcion: "",
         file: undefined,
         equipo_id: equipoId || null,
         mantenimiento_id: mantenimientoId || null,
         licencia_id: licenciaId || null,
      },
   });

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

   const uploadMutation = useMutation({
      mutationFn: (values: UploadDocumentoValues) => {
         return documentosService.upload({
            equipo_id: values.equipo_id,
            mantenimiento_id: values.mantenimiento_id,
            licencia_id: values.licencia_id,
            titulo: values.titulo.trim(),
            tipo_documento_id: values.tipo_documento_id,
            descripcion: cleanString(values.descripcion),
            file: values.file as File,
         });
      },
      onSuccess: (_, values) => {
         toast({
            title: "Documento subido",
            description: "El archivo se ha almacenado correctamente.",
         });

         queryClient.invalidateQueries({ queryKey: ["documentos"] });
         if (values.equipo_id) queryClient.invalidateQueries({ queryKey: ["equipo", values.equipo_id] });
         if (values.mantenimiento_id) queryClient.invalidateQueries({ queryKey: ["mantenimiento", values.mantenimiento_id] });
         if (values.licencia_id) queryClient.invalidateQueries({ queryKey: ["licencia", values.licencia_id] });

         form.reset();
         onSuccess();
      },
      onError: (err: unknown) => {
         const e = err as Error & { status?: number };
         toast({
            variant: "destructive",
            title: "Error de subida",
            description:
               e.message ||
               "Verifique que el formato coincida con el Tipo de Documento seleccionado y no supere los 10MB.",
         });
      }
   });

   const onSubmit = (values: UploadDocumentoValues) => {
      // Bloqueamos nativamente si intentan subir un doc suelto en la vista global
      if (isStandalone && !values.equipo_id) {
         form.setError("equipo_id", {
            type: "manual",
            message: "Debe seleccionar un equipo para vincular este documento."
         });
         return;
      }
      uploadMutation.mutate(values);
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
               control={form.control}
               name="titulo"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Título del Documento <span className="text-destructive">*</span></FormLabel>
                     <FormControl>
                        <Input placeholder="Ej: Factura de Compra #123" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {/* SECCIÓN INTELIGENTE: Selector de Equipo (Solo visible en vista Global) */}
            {isStandalone && (
               <FormField
                  control={form.control}
                  name="equipo_id"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Vincular a un Equipo <span className="text-destructive">*</span></FormLabel>
                        <Select
                           value={field.value || undefined}
                           onValueChange={field.onChange}
                           disabled={isLoadingEquipos}
                        >
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder={isLoadingEquipos ? "Cargando equipos..." : "Seleccione un equipo..."} />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {equiposDisponibles.map((e) => (
                                 <SelectItem key={e.id} value={e.id}>
                                    {e.nombre} ({e.numero_serie})
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            <FormField
               control={form.control}
               name="tipo_documento_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Documento <span className="text-destructive">*</span></FormLabel>
                     <Select
                        value={field.value || undefined}
                        onValueChange={(val) => {
                           field.onChange(val);
                           form.setValue("file", undefined as any);
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
               render={({ field: { onChange, value, ...fieldProps } }) => (
                  <FormItem>
                     <FormLabel>Archivo <span className="text-destructive">*</span></FormLabel>
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
                     <FormLabel>Descripción <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                     <FormControl>
                        <Textarea
                           {...field}
                           value={field.value || ""}
                           placeholder="Detalles adicionales sobre el archivo..."
                           className="resize-none"
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-2 border-t mt-4">
               <Button type="submit" disabled={uploadMutation.isPending} className="min-w-37.5">
                  {uploadMutation.isPending ? (
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
