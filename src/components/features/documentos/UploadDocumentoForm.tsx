"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { useToast } from "@/components/ui/use-toast"
import { documentoSchema } from "@/lib/zod"
import api from "@/lib/api"
import { TipoDocumento } from "@/types/api"

interface UploadDocumentoFormProps {
   equipoId: string;
   tiposDocumento: TipoDocumento[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof documentoSchema>;

export function UploadDocumentoForm({ equipoId, tiposDocumento, onSuccess }: UploadDocumentoFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(documentoSchema),
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('titulo', data.titulo);
      formData.append('tipo_documento_id', data.tipo_documento_id);
      if (data.descripcion) formData.append('descripcion', data.descripcion);
      formData.append('file', data.file);
      formData.append('equipo_id', equipoId);

      try {
         await api.post('/documentacion/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
         });
         toast({ title: "Éxito", description: "Documento subido correctamente." });
         router.refresh();
         onSuccess();
      } catch (error) {
         console.error("Error al subir documento:", error);
         toast({ variant: "destructive", title: "Error", description: "No se pudo subir el documento." });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField control={form.control} name="titulo" render={({ field }) => (
               <FormItem><FormLabel>Título del Documento</FormLabel><FormControl><Input placeholder="Ej: Factura de compra" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="tipo_documento_id" render={({ field }) => (
               <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo..." /></SelectTrigger></FormControl>
                     <SelectContent>{tiposDocumento.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="file" render={({ field: { onChange, ...props } }) => (
               <FormItem>
                  <FormLabel>Archivo</FormLabel>
                  <FormControl>
                     <Input type="file" {...props} onChange={(e) => onChange(e.target.files?.[0])} />
                  </FormControl>
                  <FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="descripcion" render={({ field }) => (
               <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Añada una breve descripción del contenido del archivo..." {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
               </FormItem>
            )} />
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Subir Archivo
               </Button>
            </div>
         </form>
      </Form>
   )
}
