"use client";

import { useEffect, useCallback } from "react";
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
   FormDescription,
   FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";

import { recibirMovimientoSchema } from "@/lib/zod";
import { movimientosService } from "@/app/services/movimientosService";
import { empleadosService } from "@/app/services/empleadosService";
import { AsyncCombobox, type Option } from "@/components/ui/AsyncCombobox";
import { useSession } from "@/contexts/SessionProvider";
import { useHasPermission } from "@/hooks/useHasPermission";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { EstadoMovimientoEquipoEnum, TipoMovimientoEquipoEnum, Movimiento } from "@/types/api";

interface RecibirMovimientoModalProps {
   isOpen: boolean;
   onClose: () => void;
   movimiento: Movimiento | null;
}

type RecibirFormValues = z.infer<typeof recibirMovimientoSchema>;

export function RecibirMovimientoModal({ isOpen, onClose, movimiento }: RecibirMovimientoModalProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const { user } = useSession();
   const canRegister = useHasPermission(["registrar_movimientos"]);
   const permitsExternal = !!movimiento && !movimiento.empleado_destino_id && (movimiento.tipo_movimiento === TipoMovimientoEquipoEnum.SalidaTemporal || movimiento.tipo_movimiento === TipoMovimientoEquipoEnum.SalidaDefinitiva);
   const defaultReceiver = movimiento?.empleado_destino_id || user?.empleado_id || null;
   const employeeOptions: Option[] = movimiento?.empleado_destino ? [{ value: movimiento.empleado_destino.id, label: movimiento.empleado_destino.nombre_completo }] : user?.empleado_id ? [{ value: user.empleado_id, label: user.empleado_rel?.nombre_completo || "Empleado asociado a mi cuenta" }] : [];
   const fetchEmployees = useCallback(async (search: string): Promise<Option[]> => {
      if (search.trim().length < 2) return [];
      const employees = await empleadosService.search(search);
      return employees.map(employee => ({ value: employee.id, label: employee.nombre_completo }));
   }, []);

   const form = useForm<RecibirFormValues>({
      resolver: standardSchemaResolver(recibirMovimientoSchema),
      defaultValues: {
         estado: EstadoMovimientoEquipoEnum.Completado,
         tipo_receptor: "empleado",
         empleado_receptor_id: defaultReceiver,
         recibido_por: "",
         entidad_receptora: "",
         observaciones: "",
      },
   });

   const estadoSeleccionado = useWatch({ control: form.control, name: "estado" });
   const tipoReceptor = useWatch({ control: form.control, name: "tipo_receptor" });

   useEffect(() => {
      if (isOpen && movimiento) {
         form.reset({
            estado: EstadoMovimientoEquipoEnum.Completado,
            tipo_receptor: "empleado",
            empleado_receptor_id: defaultReceiver,
            recibido_por: "",
            entidad_receptora: "",
            observaciones: "",
         });
      }
   }, [isOpen, movimiento, form, defaultReceiver]);

   const mutation = useMutation({
      mutationFn: (data: RecibirFormValues) => {
         if (!movimiento) throw new Error("Seleccione un movimiento.");
         if (data.estado === EstadoMovimientoEquipoEnum.Rechazado) return movimientosService.rechazar(movimiento.id, { observaciones: data.observaciones });
         return movimientosService.recibir(movimiento.id, {
            observaciones: data.observaciones || null,
            ...(data.tipo_receptor === "empleado" ? { empleado_receptor_id: data.empleado_receptor_id } : { recibido_por: data.recibido_por, entidad_receptora: data.entidad_receptora }),
         });
      },
      onSuccess: () => {
         toast({
            title: "Cadena de custodia cerrada",
            description: "El movimiento ha sido actualizado exitosamente.",
         });
         queryClient.invalidateQueries({ queryKey: ["movimientos"] });
         queryClient.invalidateQueries({ queryKey: ["equipos"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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

      mutation.mutate(data);
   };

   if (!movimiento) return null;

   return (
      <Dialog open={isOpen} onOpenChange={(val) => !val && !mutation.isPending && onClose()}>
         <DialogContent className="sm:max-w-125">
            <DialogHeader>
               <DialogTitle>Acuse de Recibo</DialogTitle>
               <DialogDescription>
                  Confirme la recepción del equipo <strong>{movimiento.equipo.nombre}</strong> (Serie: {movimiento.equipo.numero_serie}).
                  {movimiento.equipos_incluidos > 1 && <span className="block mt-2">Esta entrega incluye {movimiento.equipos_incluidos} activos del conjunto. Compruebe sus componentes antes de confirmar.</span>}
               </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 p-3 rounded-md text-sm mb-4 space-y-1 border">
               <p><span className="font-semibold text-muted-foreground">Movimiento:</span> {movimiento.tipo_movimiento}</p>
               <p><span className="font-semibold text-muted-foreground">Origen:</span> {movimiento.ubicacion_origen_nombre || "N/A"}</p>
               <p><span className="font-semibold text-muted-foreground">Destino Esperado:</span> {movimiento.ubicacion_destino_nombre || "N/A"}</p>
               <p><span className="font-semibold text-muted-foreground">Custodio asignado:</span> {movimiento.empleado_destino?.nombre_completo || "Sin asignación personal"}</p>
               <p><span className="font-semibold text-muted-foreground">Confirmación registrada por:</span> {user?.nombre_usuario}</p>
            </div>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="estado" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Estado de la Recepción</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
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

                  {estadoSeleccionado === EstadoMovimientoEquipoEnum.Completado && permitsExternal && <FormField control={form.control} name="tipo_receptor" render={({ field }) => (
                     <FormItem><FormLabel>Quién recibe</FormLabel><Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="empleado">Empleado registrado</SelectItem><SelectItem value="externo">Persona de una entidad externa</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />}
                  {estadoSeleccionado === EstadoMovimientoEquipoEnum.Completado && tipoReceptor === "empleado" && <FormField control={form.control} name="empleado_receptor_id" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Empleado que recibe físicamente</FormLabel>
                        <FormControl><AsyncCombobox {...field} fetcher={fetchEmployees} defaultOptions={employeeOptions} disabled={!canRegister || mutation.isPending} placeholder="Busque un empleado por nombre..." /></FormControl>
                        <FormDescription>Se utiliza el catálogo de empleados; no requiere una cuenta de acceso. Confirme la entrega a esta persona. Si recibe en representación del custodio, la asignación sigue perteneciendo al custodio indicado arriba.</FormDescription>
                        <FormMessage />
                     </FormItem>
                  )} />}
                  {estadoSeleccionado === EstadoMovimientoEquipoEnum.Completado && tipoReceptor === "externo" && permitsExternal && <><FormField control={form.control} name="recibido_por" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Nombre del receptor externo</FormLabel>
                        <FormControl>
                           <Input {...field} placeholder="Ej: Juan Pérez" value={field.value ?? ""} disabled={mutation.isPending} maxLength={255} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} /><FormField control={form.control} name="entidad_receptora" render={({ field }) => (
                     <FormItem><FormLabel>Entidad o empresa receptora</FormLabel><FormControl><Input {...field} value={field.value ?? ""} disabled={mutation.isPending} maxLength={255} placeholder="Ej: Servicio técnico del proveedor" /></FormControl><FormMessage /></FormItem>
                  )} /></>}

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
                              disabled={mutation.isPending}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
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
