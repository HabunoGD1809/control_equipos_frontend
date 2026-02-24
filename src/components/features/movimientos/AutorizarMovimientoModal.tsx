"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { autorizarMovimientoSchema } from "@/lib/zod";
import { movimientosService } from "@/app/services/movimientosService";
import { Movimiento } from "@/types/api";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
   DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { useToast } from "@/components/ui/use-toast";
import * as z from "zod";

interface AutorizarMovimientoModalProps {
   movimiento: Movimiento | null;
   isOpen: boolean;
   onClose: () => void;
}

type AutorizarFormValues = z.infer<typeof autorizarMovimientoSchema>;

export function AutorizarMovimientoModal({ movimiento, isOpen, onClose }: AutorizarMovimientoModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<AutorizarFormValues>({
      resolver: standardSchemaResolver(autorizarMovimientoSchema),
      defaultValues: {
         accion: undefined,
         observaciones: "",
      },
   });

   const mutation = useMutation({
      mutationFn: (data: AutorizarFormValues) => {
         // NOTA ARQUITECTÓNICA: El OpenAPI actual no permite cambiar el 'estado' 
         // directamente en un PUT ni expone un endpoint de Autorizar.
         // Como solución estrictamente apegada al contrato, guardamos la decisión
         // en las 'observaciones' que es el único campo de texto libre que el DTO acepta.
         const accionPrefix = data.accion === "Aprobar" ? "[AUTORIZADO]" : "[RECHAZADO]";
         const observacionesModificadas = `${accionPrefix} ${data.observaciones || ""}`.trim();

         return movimientosService.update(movimiento!.id, {
            observaciones: observacionesModificadas,
         });
      },
      onSuccess: () => {
         toast({ title: "Procesado", description: "La acción ha sido registrada en las observaciones." });
         queryClient.invalidateQueries({ queryKey: ["movimientos"] });
         onClose();
         form.reset();
      },
      onError: (err: any) => {
         toast({ variant: "destructive", title: "Error", description: err.message });
      },
   });

   const onSubmit = (data: AutorizarFormValues) => {
      if (!movimiento) return;
      mutation.mutate(data);
   };

   if (!movimiento) return null;

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Validar Movimiento</DialogTitle>
               <DialogDescription>
                  Equipo: {movimiento.equipo.nombre} ({movimiento.equipo.numero_serie})<br />
                  Solicitante: {movimiento.usuario_registrador?.nombre_usuario || "Sistema"}<br />
                  Tipo: {movimiento.tipo_movimiento}
               </DialogDescription>
            </DialogHeader>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                     control={form.control}
                     name="accion"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Decisión</FormLabel>
                           <FormControl>
                              <RadioGroup
                                 onValueChange={field.onChange}
                                 defaultValue={field.value}
                                 className="flex gap-4"
                              >
                                 <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                       <RadioGroupItem value="Aprobar" />
                                    </FormControl>
                                    <FormLabel className="font-normal text-green-600">
                                       Aprobar
                                    </FormLabel>
                                 </FormItem>
                                 <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                       <RadioGroupItem value="Rechazar" />
                                    </FormControl>
                                    <FormLabel className="font-normal text-red-600">
                                       Rechazar
                                    </FormLabel>
                                 </FormItem>
                              </RadioGroup>
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="observaciones"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Observaciones (Obligatorio si rechaza)</FormLabel>
                           <FormControl>
                              <Textarea placeholder="Motivo de la decisión..." {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <DialogFooter>
                     <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                     <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Procesando..." : "Confirmar"}
                     </Button>
                  </DialogFooter>
               </form>
            </Form>
         </DialogContent>
      </Dialog>
   );
}
