"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useToast } from "@/components/ui/use-toast";
import { editComponenteSchema } from "@/lib/zod";
import { api } from "@/lib/http";
import { ComponenteInfo } from "@/types/api";

interface EditComponenteFormProps {
   componente: ComponenteInfo;
   onSuccess: () => void;
}

type FormValues = z.infer<typeof editComponenteSchema>;

export function EditComponenteForm({ componente, onSuccess }: EditComponenteFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(editComponenteSchema),
      defaultValues: {
         cantidad: componente.cantidad,
         tipo_relacion: componente.tipo_relacion,
         notas: componente.notas || "",
      },
   });

   const onSubmit: SubmitHandler<FormValues> = async (data) => {
      setIsLoading(true);
      try {
         await api.put(`/equipos/componentes/${componente.id}`, data);
         toast({ title: "Éxito", description: "Componente actualizado correctamente." });
         router.refresh();
         onSuccess();
      } catch (err) {
         const e = err as Error & { status?: number };
         toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "No se pudo actualizar el componente.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                           <Input
                              type="number"
                              value={field.value ?? 0}
                              onChange={(e) => {
                                 const n = e.target.valueAsNumber;
                                 field.onChange(Number.isFinite(n) ? n : 0);
                              }}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="tipo_relacion"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Tipo de Relación</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              <SelectItem value="componente">Componente</SelectItem>
                              <SelectItem value="conectado_a">Conectado A</SelectItem>
                              <SelectItem value="parte_de">Parte De</SelectItem>
                              <SelectItem value="accesorio">Accesorio</SelectItem>
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <FormField
               control={form.control}
               name="notas"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Notas (Opcional)</FormLabel>
                     <FormControl>
                        <Input
                           placeholder="Ej: Módulo de memoria RAM principal"
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
                  Guardar Cambios
               </Button>
            </div>
         </form>
      </Form>
   );
}
