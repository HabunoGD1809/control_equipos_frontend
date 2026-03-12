"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { modalAutorizacionSchema } from "@/lib/zod";
import { movimientosService } from "@/app/services/movimientosService";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
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

type AutorizarFormValues = z.infer<typeof modalAutorizacionSchema>;

export function AutorizarMovimientoModal({ movimiento, isOpen, onClose }: AutorizarMovimientoModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<AutorizarFormValues>({
      resolver: standardSchemaResolver(modalAutorizacionSchema),
      defaultValues: {
         accion: undefined as any,
         observaciones: "",
      },
   });

   const mutation = useMutation({
      mutationFn: async (data: AutorizarFormValues) => {
         if (!movimiento) throw new Error("No hay movimiento seleccionado");

         const payload = { observaciones: data.observaciones };

         if (data.accion === "Aprobar") {
            return movimientosService.aprobar(movimiento.id, payload);
         } else {
            return movimientosService.rechazar(movimiento.id, payload);
         }
      },
      onSuccess: (data) => {
         toast({
            title: "Procesado",
            description: `El movimiento ha sido ${data.estado.toLowerCase()} exitosamente.`
         });
         queryClient.invalidateQueries({ queryKey: ["movimientos"] });
         onClose();
         form.reset();
      },
      onError: (error: unknown) => {
         const { message } = getFriendlyErrorMessage(error);
         toast({ variant: "destructive", title: "Error", description: message });
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
                     <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Cancelar
                     </Button>
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
