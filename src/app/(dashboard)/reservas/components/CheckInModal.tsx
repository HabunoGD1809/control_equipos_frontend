"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn } from "lucide-react";
import * as z from "zod";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";

import { reservaCheckInSchema } from "@/lib/zod";
import { reservasService } from "@/app/services/reservasService";
import { ReservaEquipo } from "@/types/api";

interface CheckInModalProps {
   reserva: ReservaEquipo | null;
   isOpen: boolean;
   onClose: () => void;
   onSuccess?: () => void;
}

type CheckInFormValues = z.infer<typeof reservaCheckInSchema>;

export function CheckInModal({ reserva, isOpen, onClose, onSuccess }: CheckInModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<CheckInFormValues>({
      resolver: standardSchemaResolver(reservaCheckInSchema),
      defaultValues: {
         notas_devolucion: "",
      },
   });

   const mutation = useMutation({
      mutationFn: (values: CheckInFormValues) => {
         if (!reserva) throw new Error("No hay reserva seleccionada");

         return reservasService.registrarCheckInOut(reserva.id, {
            check_in_time: new Date().toISOString(),
            notas_devolucion: values.notas_devolucion || null
         });
      },
      onSuccess: () => {
         toast({
            title: "Devolución Registrada",
            description: "El equipo ha sido marcado como devuelto (Check-In)."
         });
         queryClient.invalidateQueries({ queryKey: ["reservas"] });
         form.reset();
         onClose();
         onSuccess?.();
      },
      onError: (error: any) => {
         toast({
            variant: "destructive",
            title: "Error en Check-In",
            description: error.message || "No se pudo registrar la devolución.",
         });
      },
   });

   const onSubmit = (data: CheckInFormValues) => {
      mutation.mutate(data);
   };

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-emerald-600" />
                  Registrar Devolución (Check-In)
               </DialogTitle>
               <DialogDescription>
                  Confirme la recepción del equipo <strong className="text-foreground">{reserva?.equipo.nombre}</strong>.
                  Esto finalizará la reserva y liberará el equipo para otros usuarios.
               </DialogDescription>
            </DialogHeader>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                  <FormField
                     control={form.control}
                     name="notas_devolucion"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Notas de Devolución / Estado Final (Opcional)</FormLabel>
                           <FormControl>
                              <Textarea
                                 placeholder="¿El equipo regresó en buen estado? Especifique si faltan cables o hay daños."
                                 className="resize-none min-h-25"
                                 {...field}
                                 value={field.value ?? ""}
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                     <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Cancelar
                     </Button>
                     <Button type="submit" disabled={mutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Devolución
                     </Button>
                  </div>
               </form>
            </Form>
         </DialogContent>
      </Dialog>
   );
}
