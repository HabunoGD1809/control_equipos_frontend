"use client";

import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowRightLeft, PackageMinus, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";
import { inventarioMovimientoSchema } from "@/lib/zod";
import {
   TipoItemInventarioSimple,
   TipoMovimientoInvEnum,
   EquipoSimple,
   InventarioStock,
   InventarioMovimientoCreate
} from "@/types/api";
import { inventarioService } from "@/app/services/inventarioService";

interface RegistrarMovimientoFormProps {
   tiposItem: TipoItemInventarioSimple[];
   equipos: EquipoSimple[];
   stockData: InventarioStock[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof inventarioMovimientoSchema>;

export function RegistrarMovimientoForm({ tiposItem, equipos, stockData, onSuccess }: RegistrarMovimientoFormProps) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(inventarioMovimientoSchema),
      defaultValues: {
         tipo_item_id: undefined as any,
         tipo_movimiento: TipoMovimientoInvEnum.EntradaCompra,
         cantidad: 1,
         lote_origen: "N/A",
         lote_destino: "N/A",
         costo_unitario: 0,
         notas: "",
         ubicacion_origen: "",
         ubicacion_destino: "",
         motivo_ajuste: "",
         equipo_asociado_id: undefined,
      },
   });

   const tipoMovimiento = useWatch({ control: form.control, name: "tipo_movimiento" });
   const tipoItemId = useWatch({ control: form.control, name: "tipo_item_id" });
   const ubicacionOrigenSel = useWatch({ control: form.control, name: "ubicacion_origen" });

   const tipoStr = tipoMovimiento as string;

   const reqOrigen = ([
      TipoMovimientoInvEnum.SalidaUso,
      TipoMovimientoInvEnum.SalidaDescarte,
      TipoMovimientoInvEnum.AjusteNegativo,
      TipoMovimientoInvEnum.TransferenciaSalida,
      TipoMovimientoInvEnum.TransferenciaEntrada,
      TipoMovimientoInvEnum.DevolucionProveedor,
   ] as string[]).includes(tipoStr);

   const reqDestino = ([
      TipoMovimientoInvEnum.EntradaCompra,
      TipoMovimientoInvEnum.DevolucionInterna,
      TipoMovimientoInvEnum.AjustePositivo,
      TipoMovimientoInvEnum.TransferenciaSalida,
      TipoMovimientoInvEnum.TransferenciaEntrada,
   ] as string[]).includes(tipoStr);

   const isAjuste = tipoStr.includes("Ajuste");
   const showCosto = tipoStr === TipoMovimientoInvEnum.EntradaCompra;
   const showEquipoAsociado = tipoStr === TipoMovimientoInvEnum.SalidaUso;

   const stockDisponibleDelItem = useMemo(() => {
      return stockData.filter(s => s.tipo_item_id === tipoItemId && s.cantidad_actual > 0);
   }, [stockData, tipoItemId]);

   const ubicacionesOrigenDisponibles = useMemo(() => {
      return Array.from(new Set(stockDisponibleDelItem.map(s => s.ubicacion)));
   }, [stockDisponibleDelItem]);

   const lotesOrigenDisponibles = useMemo(() => {
      return stockDisponibleDelItem
         .filter(s => s.ubicacion === ubicacionOrigenSel)
         .map(s => s.lote || "N/A");
   }, [stockDisponibleDelItem, ubicacionOrigenSel]);

   const mutation = useMutation({
      mutationFn: inventarioService.registrarMovimiento,
      onSuccess: () => {
         toast({
            title: "Movimiento Registrado",
            description: "El stock ha sido actualizado correctamente.",
         });

         queryClient.invalidateQueries({ queryKey: ["stock"] });
         queryClient.invalidateQueries({ queryKey: ["inventario-movimientos"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard"] });

         form.reset();
         onSuccess();
      },
      onError: (err: unknown) => {
         const e = err as Error & { status?: number };
         const msg = e.message || "Error al registrar movimiento.";

         toast({
            variant: "destructive",
            title: "Error de Validación",
            description: msg.includes("Stock insuficiente")
               ? "No hay suficiente stock en la ubicación de origen seleccionada."
               : msg,
         });
      }
   });

   const onSubmit = (values: FormValues) => {
      const payload: Partial<InventarioMovimientoCreate> = { ...values };

      // Limpiamos la basura del payload antes de mandarlo al backend
      if (!reqOrigen) {
         delete payload.ubicacion_origen;
         delete payload.lote_origen;
      }
      if (!reqDestino) {
         delete payload.ubicacion_destino;
         delete payload.lote_destino;
      }
      if (!isAjuste) {
         delete payload.motivo_ajuste;
      }
      if (!showCosto) {
         delete payload.costo_unitario;
      }
      if (!showEquipoAsociado) {
         delete payload.equipo_asociado_id;
      }

      mutation.mutate(payload as InventarioMovimientoCreate);
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
            <FormField
               control={form.control}
               name="tipo_item_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Item de Inventario <span className="text-destructive">*</span></FormLabel>
                     <Select
                        onValueChange={(val) => {
                           field.onChange(val);
                           form.setValue("ubicacion_origen", "");
                           form.setValue("lote_origen", "N/A");
                        }}
                        value={field.value ?? undefined}
                     >
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Seleccione Item..." />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {tiposItem.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                 {item.nombre} ({item.unidad_medida})
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="tipo_movimiento"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Movimiento <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Tipo..." />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {Object.values(TipoMovimientoInvEnum).map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                 {tipo}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Cantidad <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                           <Input
                              type="number"
                              min="1"
                              value={field.value ?? 1}
                              onChange={(e) => {
                                 const n = e.target.valueAsNumber;
                                 field.onChange(Number.isFinite(n) ? n : 1);
                              }}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               {showCosto && (
                  <FormField
                     control={form.control}
                     name="costo_unitario"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Costo Unitario</FormLabel>
                           <FormControl>
                              <div className="relative">
                                 <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                 <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="pl-7"
                                    value={field.value ?? 0}
                                    onChange={(e) => {
                                       const n = e.target.valueAsNumber;
                                       field.onChange(Number.isFinite(n) ? n : 0);
                                    }}
                                 />
                              </div>
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {reqOrigen && (
                  <div className="space-y-4 bg-muted/30 p-3 rounded-md border">
                     <FormField
                        control={form.control}
                        name="ubicacion_origen"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Ubicación Origen <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined} disabled={!tipoItemId || ubicacionesOrigenDisponibles.length === 0}>
                                 <FormControl>
                                    <SelectTrigger>
                                       <SelectValue placeholder="Seleccione origen..." />
                                    </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                    {ubicacionesOrigenDisponibles.map((ub) => (
                                       <SelectItem key={ub} value={ub}>{ub}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <FormDescription className="text-xs">Solo muestra ubicaciones con stock.</FormDescription>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="lote_origen"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Lote Origen</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined} disabled={!ubicacionOrigenSel}>
                                 <FormControl>
                                    <SelectTrigger>
                                       <SelectValue placeholder="Seleccione lote..." />
                                    </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                    {lotesOrigenDisponibles.map((lote) => (
                                       <SelectItem key={lote} value={lote}>{lote}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </div>
               )}

               {reqDestino && (
                  <div className="space-y-4 bg-primary/5 p-3 rounded-md border border-primary/20">
                     <FormField
                        control={form.control}
                        name="ubicacion_destino"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Ubicación Destino <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                 <Input placeholder="Ej: Almacén Principal" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="lote_destino"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Lote Destino</FormLabel>
                              <FormControl>
                                 <Input placeholder="N/A" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </div>
               )}
            </div>

            {showEquipoAsociado && (
               <FormField
                  control={form.control}
                  name="equipo_asociado_id"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Equipo Asociado (Opcional)</FormLabel>
                        <Select
                           onValueChange={field.onChange}
                           value={field.value ?? undefined}
                        >
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione equipo..." />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {equipos.map((eq) => (
                                 <SelectItem key={eq.id} value={eq.id}>
                                    {eq.nombre} ({eq.numero_serie})
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FormDescription>Si la pieza se usó para reparar un equipo.</FormDescription>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {isAjuste && (
               <FormField
                  control={form.control}
                  name="motivo_ajuste"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Motivo del Ajuste <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                           <Textarea
                              placeholder="Justifique la diferencia de inventario (mín. 5 caracteres)..."
                              {...field}
                              value={field.value || ""}
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            <FormField
               control={form.control}
               name="notas"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Notas Generales</FormLabel>
                     <FormControl>
                        <Textarea placeholder="Observaciones adicionales..." {...field} value={field.value || ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-2">
               <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!reqOrigen ? (
                     <PackagePlus className="mr-2 h-4 w-4" />
                  ) : !reqDestino ? (
                     <PackageMinus className="mr-2 h-4 w-4" />
                  ) : (
                     <ArrowRightLeft className="mr-2 h-4 w-4" />
                  )}
                  Registrar Movimiento
               </Button>
            </div>
         </form>
      </Form>
   );
}
