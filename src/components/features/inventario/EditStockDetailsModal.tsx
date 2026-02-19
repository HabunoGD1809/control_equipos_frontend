"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
   DialogFooter,
} from "@/components/ui/Dialog";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { useToast } from "@/components/ui/use-toast";
import { inventarioService } from "@/app/services/inventarioService";
import { InventarioStock } from "@/types/api";
import { cn } from "@/lib/utils";

const editStockSchema = z.object({
   lote: z.string().min(1, "El lote es requerido (use N/A si no aplica)."),
   fecha_caducidad: z.date().optional().nullable(),
});

type EditStockFormValues = z.infer<typeof editStockSchema>;

interface EditStockDetailsModalProps {
   stock: InventarioStock | null;
   isOpen: boolean;
   onClose: () => void;
}

export function EditStockDetailsModal({ stock, isOpen, onClose }: EditStockDetailsModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<EditStockFormValues>({
      resolver: standardSchemaResolver(editStockSchema),
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
      mutationFn: (values: EditStockFormValues) => {
         if (!stock) throw new Error("No hay stock seleccionado");
         return inventarioService.updateStockDetails(stock.id, {
            lote: values.lote,
            fecha_caducidad: values.fecha_caducidad ? values.fecha_caducidad.toISOString() : null,
         });
      },
      onSuccess: () => {
         toast({ title: "Actualizado", description: "Los detalles del lote han sido corregidos." });
         queryClient.invalidateQueries({ queryKey: ["inventario-stock"] });
         onClose();
      },
      onError: () => {
         toast({ variant: "destructive", title: "Error", description: "No se pudieron actualizar los detalles." });
      },
   });

   const onSubmit = (data: EditStockFormValues) => {
      mutation.mutate(data);
   };

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="sm:max-w-106.25">
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
                  <FormField
                     control={form.control}
                     name="lote"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Código de Lote / Serie</FormLabel>
                           <FormControl>
                              <Input {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="fecha_caducidad"
                     render={({ field }) => (
                        <FormItem className="flex flex-col">
                           <FormLabel>Fecha de Caducidad</FormLabel>
                           <Popover>
                              <PopoverTrigger asChild>
                                 <FormControl>
                                    <Button
                                       variant={"outline"}
                                       className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                       )}
                                    >
                                       {field.value ? (
                                          format(field.value, "PPP", { locale: es })
                                       ) : (
                                          <span>Sin vencimiento</span>
                                       )}
                                       <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                 </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                 <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
                                    onSelect={field.onChange}
                                    initialFocus
                                 />
                              </PopoverContent>
                           </Popover>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <DialogFooter className="pt-4">
                     <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                     </Button>
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
