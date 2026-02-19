"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import * as z from "zod";

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";

import { reservaCheckOutSchema } from "@/lib/zod";
import { reservasService } from "@/app/services/reservasService";
import { ReservaEquipo } from "@/types/api";

interface CheckOutModalProps {
   reserva: ReservaEquipo | null;
   isOpen: boolean;
   onClose: () => void;
   onSuccess?: () => void;
}

type CheckOutFormValues = z.infer<typeof reservaCheckOutSchema>;

export function CheckOutModal({
   reserva,
   isOpen,
   onClose,
   onSuccess,
}: CheckOutModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<CheckOutFormValues>({
      resolver: standardSchemaResolver(reservaCheckOutSchema),
      defaultValues: {
         notas_entrega: "",
      },
   });

   const mutation = useMutation({
      mutationFn: (values: CheckOutFormValues) => {
         if (!reserva) throw new Error("No hay reserva seleccionada");

         return reservasService.registrarCheckInOut(reserva.id, {
            check_out_time: new Date().toISOString(),
         });
      },
      onSuccess: () => {
         toast({
            title: "Entrega Registrada",
            description: "El equipo ha sido marcado como entregado (Check-Out).",
         });
         queryClient.invalidateQueries({ queryKey: ["reservas"] });
         onClose();
         onSuccess?.();
         form.reset();
      },
      onError: (error: any) => {
         toast({
            variant: "destructive",
            title: "Error en Check-Out",
            description: error.message || "No se pudo registrar la entrega.",
         });
      },
   });

   const onSubmit = (data: CheckOutFormValues) => {
      mutation.mutate(data);
   };

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-blue-600" />
                  Registrar Entrega (Check-Out)
               </DialogTitle>
               <DialogDescription>
                  Confirme la entrega del equipo{" "}
                  <strong>{reserva?.equipo.nombre}</strong> al usuario. Esto cambiará
                  el estado a &quot;En Curso&quot;.
               </DialogDescription>
            </DialogHeader>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                     control={form.control}
                     name="notas_entrega"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Notas de Entrega (Opcional)</FormLabel>
                           <FormControl>
                              <Textarea
                                 placeholder="Estado del equipo al entregar, accesorios incluidos..."
                                 className="resize-none"
                                 {...field}
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                     <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={mutation.isPending}
                     >
                        Cancelar
                     </Button>
                     <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Confirmar Entrega
                     </Button>
                  </div>
               </form>
            </Form>
         </DialogContent>
      </Dialog>
   );
}
