"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckSquare } from "lucide-react";
import * as z from "zod";

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Textarea } from "@/components/ui/Textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { useToast } from "@/components/ui/use-toast";

import { aprobarReservaSchema } from "@/lib/zod";
import { reservasService } from "@/app/services/reservasService";
import { ReservaEquipo, EstadoReservaEnum } from "@/types/api";

interface ValidarReservaModalProps {
   reserva: ReservaEquipo | null;
   isOpen: boolean;
   onClose: () => void;
   onSuccess?: () => void;
}

type ValidarFormValues = z.infer<typeof aprobarReservaSchema>;

export function ValidarReservaModal({ reserva, isOpen, onClose, onSuccess }: ValidarReservaModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<ValidarFormValues>({
      resolver: standardSchemaResolver(aprobarReservaSchema),
      defaultValues: {
         estado: undefined as any,
         notas_administrador: "",
      },
   });

   const mutation = useMutation({
      mutationFn: (values: ValidarFormValues) => {
         if (!reserva) throw new Error("No hay reserva seleccionada");

         return reservasService.cambiarEstado(reserva.id, {
            estado: values.estado,
            notas_administrador: values.notas_administrador || null,
         });
      },
      onSuccess: (_, variables) => {
         toast({
            title: variables.estado === EstadoReservaEnum.Confirmada ? "Reserva Aprobada" : "Reserva Rechazada",
            description: "El estado de la reserva se ha actualizado correctamente."
         });
         queryClient.invalidateQueries({ queryKey: ["reservas"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard"] });
         form.reset();
         onClose();
         onSuccess?.();
      },
      onError: (error: any) => {
         toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "No se pudo actualizar el estado.",
         });
      },
   });

   const onSubmit = (data: ValidarFormValues) => {
      mutation.mutate(data);
   };

   if (!reserva) return null;

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Validar Reserva
               </DialogTitle>
               <DialogDescription>
                  Revisando solicitud de <strong>{reserva.solicitante.nombre_usuario}</strong> para el equipo <strong>{reserva.equipo.nombre}</strong>.
               </DialogDescription>
            </DialogHeader>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                  <FormField
                     control={form.control}
                     name="estado"
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
                                       <RadioGroupItem value={EstadoReservaEnum.Confirmada} />
                                    </FormControl>
                                    <FormLabel className="font-normal text-green-600">Aprobar</FormLabel>
                                 </FormItem>
                                 <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                       <RadioGroupItem value={EstadoReservaEnum.Rechazada} />
                                    </FormControl>
                                    <FormLabel className="font-normal text-red-600">Rechazar</FormLabel>
                                 </FormItem>
                              </RadioGroup>
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="notas_administrador"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Notas del Administrador (Obligatorio si rechaza)</FormLabel>
                           <FormControl>
                              <Textarea
                                 placeholder="Justifique su decisión..."
                                 {...field}
                                 value={field.value ?? ""}
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <DialogFooter className="pt-4">
                     <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Cancelar
                     </Button>
                     <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar
                     </Button>
                  </DialogFooter>
               </form>
            </Form>
         </DialogContent>
      </Dialog>
   );
}
