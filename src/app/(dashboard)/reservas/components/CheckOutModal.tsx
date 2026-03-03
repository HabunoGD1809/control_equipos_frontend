"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";

import { reservasService } from "@/app/services/reservasService";
import { ReservaEquipo, ReservaEquipoCheckInOut } from "@/types/api";

interface CheckOutModalProps {
   reserva: ReservaEquipo | null;
   isOpen: boolean;
   onClose: () => void;
   onSuccess?: () => void;
}

export function CheckOutModal({ reserva, isOpen, onClose, onSuccess }: CheckOutModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const mutation = useMutation({
      mutationFn: () => {
         if (!reserva) throw new Error("No hay reserva seleccionada");

         const payload: ReservaEquipoCheckInOut = {
            check_out_time: new Date().toISOString(),
         };
         return reservasService.registrarCheckInOut(reserva.id, payload);
      },
      onSuccess: () => {
         toast({ title: "Entrega Registrada", description: "El equipo ha sido marcado como entregado (Check-Out)." });
         queryClient.invalidateQueries({ queryKey: ["reservas"] });
         onClose();
         onSuccess?.();
      },
      onError: (error: any) => {
         toast({ variant: "destructive", title: "Error en Check-Out", description: error.message || "No se pudo registrar la entrega." });
      },
   });

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2"><LogOut className="h-5 w-5 text-blue-600" />Registrar Entrega (Check-Out)</DialogTitle>
               <DialogDescription className="pt-2">
                  ¿Confirma la entrega física del equipo <strong className="text-foreground">{reserva?.equipo.nombre}</strong> al usuario <strong className="text-foreground">{reserva?.solicitante.nombre_usuario}</strong>?
                  <br /><br />
                  Esta acción cambiará el estado de la reserva a &quot;En Curso&quot; y registrará la hora exacta de salida.
               </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-3 pt-4 sm:justify-end">
               <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
               <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Entrega
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
