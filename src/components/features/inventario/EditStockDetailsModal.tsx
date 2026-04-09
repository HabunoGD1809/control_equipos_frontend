"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import {
   Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/Dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { DatePickerField } from "@/components/ui/DatePickerField";

import { inventarioService } from "@/app/services/inventarioService";
import { InventarioStock, InventarioStockUpdate } from "@/types/api";
import { inventarioStockUpdateSchema } from "@/lib/zod";

type EditStockFormValues = z.infer<typeof inventarioStockUpdateSchema>;

interface EditStockDetailsModalProps {
   stock: InventarioStock | null;
   isOpen: boolean;
   onClose: () => void;
}

export function EditStockDetailsModal({ stock, isOpen, onClose }: EditStockDetailsModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<EditStockFormValues>({
      resolver: standardSchemaResolver(inventarioStockUpdateSchema) as any,
      defaultValues: {
         lote: "",
         fecha_caducidad: null,
      },
   });

   useEffect(() => {
      if (stock) {
         form.reset({
            lote: stock.lote || "",
            fecha_caducidad: stock.fecha_caducidad ? new Date(stock.fecha_caducidad) : null,
         });
      }
   }, [stock, form]);

   const mutation = useMutation({
      mutationFn: (payload: InventarioStockUpdate) =>
         inventarioService.updateStockDetails(stock!.id, payload),
      onSuccess: () => {
         toast({ title: "Actualizado", description: "Los detalles del lote han sido corregidos." });
         queryClient.invalidateQueries({ queryKey: ["stock"] });
         onClose();
      },
      onError: () => {
         toast({ variant: "destructive", title: "Error", description: "No se pudieron actualizar los detalles." });
      }
   });

   const onSubmit = (values: EditStockFormValues) => {
      if (!stock) return;

      mutation.mutate({
         lote: values.lote || undefined,
         fecha_caducidad: values.fecha_caducidad ? format(values.fecha_caducidad, "yyyy-MM-dd") : undefined,
      });
   };

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle>Editar Detalles de Lote</DialogTitle>
               <DialogDescription>
                  Corrija el número de lote o la fecha de vencimiento.
                  <br />
                  <span className="text-amber-600 font-medium text-xs">Nota: Esto no modifica la cantidad de inventario.</span>
               </DialogDescription>
            </DialogHeader>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="lote" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Código de Lote / Serie (Opcional)</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="Ej: LOTE-2026-X" /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />

                  <FormField control={form.control} name="fecha_caducidad" render={({ field }) => (
                     <DatePickerField
                        label="Fecha de Caducidad"
                        value={field.value}
                        onChange={field.onChange}
                     />
                  )} />

                  <DialogFooter className="pt-4">
                     <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                     <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                     </Button>
                  </DialogFooter>
               </form>
            </Form>
         </DialogContent>
      </Dialog>
   );
}
