"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
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
import { AsyncCombobox } from "@/components/ui/AsyncCombobox";

import { addComponenteSchema } from "@/lib/zod";
import { equiposService } from "@/app/services/equiposService";
import { TipoRelacionComponenteEnum } from "@/types/api";

type AddComponenteValues = z.infer<typeof addComponenteSchema>;

interface AddComponenteFormProps {
   padreId: string;
   onSuccess: () => void;
}

export function AddComponenteForm({ padreId, onSuccess }: AddComponenteFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<AddComponenteValues>({
      resolver: standardSchemaResolver(addComponenteSchema),
      defaultValues: {
         equipo_componente_id: "",
         cantidad: 1,
         tipo_relacion: TipoRelacionComponenteEnum.Componente,
         notas: "",
      },
   });

   const onSubmit = async (data: AddComponenteValues) => {
      setIsLoading(true);
      try {
         await equiposService.addComponente(padreId, {
            equipo_componente_id: data.equipo_componente_id,
            cantidad: data.cantidad,
            tipo_relacion: data.tipo_relacion,
            notas: data.notas || undefined,
         });
         toast({ title: "Componente vinculado exitosamente." });
         onSuccess();
      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: error.response?.data?.detail || error.message || "No se pudo agregar el componente.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

            <FormField
               control={form.control}
               name="equipo_componente_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Buscar y Seleccionar Componente</FormLabel>
                     <FormControl>
                        <AsyncCombobox
                           value={field.value}
                           onChange={field.onChange}
                           placeholder="Escriba nombre o número de serie..."
                           emptyMessage="No hay resultados. Pruebe otro término."
                           fetcher={async (query) => {
                              const res = await equiposService.search(query);
                              return res
                                 .filter((eq) => eq.id !== padreId)
                                 .map((eq) => ({
                                    value: eq.id,
                                    label: `${eq.nombre} (${eq.numero_serie})`
                                 }));
                           }}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                              {Object.values(TipoRelacionComponenteEnum).map((tipo) => (
                                 <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Cantidad a Vincular</FormLabel>
                        <FormControl>
                           <Input type="number" min={1} {...field} />
                        </FormControl>
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
                     <FormLabel>Notas / Observaciones</FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder="Detalles sobre cómo se instala o vincula..."
                           {...field}
                           value={field.value ?? ""}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end gap-3 pt-4">
               <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
                  Cancelar
               </Button>
               <Button type="submit" disabled={isLoading || !form.getValues("equipo_componente_id")}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vincular Componente
               </Button>
            </div>
         </form>
      </Form>
   );
}
