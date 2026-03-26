"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
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
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";

import { recibirMovimientoSchema } from "@/lib/zod";
import { movimientosService } from "@/app/services/movimientosService";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { EstadoMovimientoEquipoEnum, Movimiento, MovimientoUpdate } from "@/types/api";

interface RecibirMovimientoModalProps {
   isOpen: boolean;
   onClose: () => void;
   movimiento: Movimiento | null;
   currentUsername?: string;
}

type RecibirFormValues = z.infer<typeof recibirMovimientoSchema>;

export function RecibirMovimientoModal({ isOpen, onClose, movimiento, currentUsername }: RecibirMovimientoModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<RecibirFormValues>({
      resolver: standardSchemaResolver(recibirMovimientoSchema),
      defaultValues: {
         estado: EstadoMovimientoEquipoEnum.Completado,
         recibido_por: currentUsername || "",
         observaciones: "",
      },
   });

   const estadoSeleccionado = useWatch({ control: form.control, name: "estado" });

   useEffect(() => {
      if (isOpen && movimiento) {
         form.reset({
            estado: EstadoMovimientoEquipoEnum.Completado,
            recibido_por: currentUsername || "",
            observaciones: "",
         });
      }
   }, [isOpen, movimiento, form, currentUsername]);

   const mutation = useMutation({
      mutationFn: (data: MovimientoUpdate) => movimientosService.update(movimiento!.id, data),
      onSuccess: () => {
         toast({
            title: "Cadena de custodia cerrada",
            description: "El movimiento ha sido actualizado exitosamente.",
         });
         queryClient.invalidateQueries({ queryKey: ["movimientos"] });
         queryClient.invalidateQueries({ queryKey: ["equipos"] });
         onClose();
      },
      onError: (error) => {
         const { message, field } = getFriendlyErrorMessage(error);
         if (field) {
            form.setError(field as keyof RecibirFormValues, { type: "manual", message });
         } else {
            toast({ variant: "destructive", title: "Error al procesar", description: message });
         }
      }
   });

   const onSubmit = (data: RecibirFormValues) => {
      if (!movimiento) return;

      const payload: MovimientoUpdate = {
         estado: data.estado,
         recibido_por: data.recibido_por,
         observaciones: data.observaciones || null,
         fecha_retorno: new Date().toISOString(),
      };

      mutation.mutate(payload);
   };

   if (!movimiento) return null;

   return (
      <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
         <DialogContent className="sm:max-w-125">
            <DialogHeader>
               <DialogTitle>Acuse de Recibo</DialogTitle>
               <DialogDescription>
                  Confirme la recepción del equipo <strong>{movimiento.equipo.nombre}</strong> (Serie: {movimiento.equipo.numero_serie}).
               </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 p-3 rounded-md text-sm mb-4 space-y-1 border">
               <p><span className="font-semibold text-muted-foreground">Movimiento:</span> {movimiento.tipo_movimiento}</p>
               <p><span className="font-semibold text-muted-foreground">Origen:</span> {movimiento.ubicacion_origen_nombre || "N/A"}</p>
               <p><span className="font-semibold text-muted-foreground">Destino Esperado:</span> {movimiento.ubicacion_destino_nombre || "N/A"}</p>
            </div>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="estado" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Estado de la Recepción</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione el estado" />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              <SelectItem value={EstadoMovimientoEquipoEnum.Completado}>
                                 <div className="flex items-center text-green-600">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Recibido Conforme (Completar)
                                 </div>
                              </SelectItem>
                              <SelectItem value={EstadoMovimientoEquipoEnum.Rechazado}>
                                 <div className="flex items-center text-red-600">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Rechazar Recepción
                                 </div>
                              </SelectItem>
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )} />

                  <FormField control={form.control} name="recibido_por" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Nombre de quien recibe</FormLabel>
                        <FormControl>
                           <Input {...field} placeholder="Ej: Juan Pérez" value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />

                  <FormField control={form.control} name="observaciones" render={({ field }) => (
                     <FormItem>
                        <FormLabel>
                           Observaciones
                           {estadoSeleccionado === EstadoMovimientoEquipoEnum.Rechazado && <span className="text-destructive"> *</span>}
                        </FormLabel>
                        <FormControl>
                           <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder={estadoSeleccionado === EstadoMovimientoEquipoEnum.Rechazado
                                 ? "Debe justificar obligatoriamente por qué rechaza el equipo..."
                                 : "Notas sobre el estado físico en el que llega el equipo (Opcional)"}
                              className="resize-none"
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />

                  <div className="flex justify-end gap-3 pt-4 border-t">
                     <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Cancelar
                     </Button>
                     <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Acción
                     </Button>
                  </div>
               </form>
            </Form>
         </DialogContent>
      </Dialog>
   );
}
