"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { useState } from "react";
import { Loader2, ArrowRightLeft, PackageMinus, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";
import { inventarioMovimientoSchema } from "@/lib/zod";
import { TipoItemInventarioSimple, TipoMovimientoInvEnum, EquipoSimple, InventarioStock } from "@/types/api";
import { inventarioService } from "@/app/services/inventarioService";

interface RegistrarMovimientoFormProps {
   tiposItem: TipoItemInventarioSimple[];
   equipos: EquipoSimple[];
   stockData: InventarioStock[]; // ✅ agregado
   onSuccess: () => void;
}

type FormValues = z.infer<typeof inventarioMovimientoSchema>;

export function RegistrarMovimientoForm({ tiposItem, equipos, stockData, onSuccess }: RegistrarMovimientoFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(inventarioMovimientoSchema),
      defaultValues: {
         tipo_item_id: undefined, // ✅ undefined en vez de "" para evitar el error de Radix
         tipo_movimiento: TipoMovimientoInvEnum.EntradaCompra,
         cantidad: 1,
         lote_origen: "N/A",
         lote_destino: "N/A",
         costo_unitario: 0,
         notas: "",
      },
   });

   const tipoMovimiento = form.watch("tipo_movimiento");
   const tipoStr = tipoMovimiento as string;

   const isEntrada = (
      [TipoMovimientoInvEnum.EntradaCompra, TipoMovimientoInvEnum.DevolucionInterna] as string[]
   ).includes(tipoStr);

   const isSalida = (
      [TipoMovimientoInvEnum.SalidaUso, TipoMovimientoInvEnum.SalidaDescarte] as string[]
   ).includes(tipoStr);

   const isTransferencia = (
      [TipoMovimientoInvEnum.TransferenciaSalida, TipoMovimientoInvEnum.TransferenciaEntrada] as string[]
   ).includes(tipoStr);

   const isAjuste = tipoStr.includes("Ajuste");

   const onSubmit = async (values: FormValues) => {
      setIsLoading(true);
      try {
         const payload: any = { ...values };

         if (isEntrada) delete payload.ubicacion_origen;
         if (isSalida) delete payload.ubicacion_destino;

         await inventarioService.registrarMovimiento(payload);

         toast({
            title: "Movimiento Registrado",
            description: "El stock ha sido actualizado correctamente.",
         });

         form.reset();
         onSuccess();
      } catch (err) {
         const e = err as Error & { status?: number };
         const msg = e.message || "Error al registrar movimiento.";

         toast({
            variant: "destructive",
            title: "Error de Validación",
            description: msg.includes("Stock insuficiente")
               ? "No hay suficiente stock en la ubicación de origen."
               : msg,
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">

            <FormField
               control={form.control}
               name="tipo_item_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Item de Inventario</FormLabel>
                     <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined} // ✅ nunca string vacío
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
                     <FormLabel>Tipo de Movimiento</FormLabel>
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
                        <FormLabel>Cantidad</FormLabel>
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

               {isEntrada && (
                  <FormField
                     control={form.control}
                     name="costo_unitario"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Costo Unitario</FormLabel>
                           <FormControl>
                              <Input
                                 type="number"
                                 min="0"
                                 step="0.01"
                                 value={field.value ?? 0}
                                 onChange={(e) => {
                                    const n = e.target.valueAsNumber;
                                    field.onChange(Number.isFinite(n) ? n : 0);
                                 }}
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
               )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               {(isSalida || isTransferencia || isAjuste) && (
                  <div className="space-y-2">
                     <FormField
                        control={form.control}
                        name="ubicacion_origen"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Ubicación Origen</FormLabel>
                              <FormControl>
                                 <Input placeholder="Ej: Almacén A1" {...field} value={field.value || ""} />
                              </FormControl>
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
                              <FormControl>
                                 <Input placeholder="N/A" {...field} />
                              </FormControl>
                              <FormDescription className="text-xs">Deje N/A si no aplica</FormDescription>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </div>
               )}

               {(isEntrada || isTransferencia || isAjuste) && (
                  <div className="space-y-2">
                     <FormField
                        control={form.control}
                        name="ubicacion_destino"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Ubicación Destino</FormLabel>
                              <FormControl>
                                 <Input placeholder="Ej: Estante 3" {...field} value={field.value || ""} />
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

            {tipoStr === TipoMovimientoInvEnum.SalidaUso && (
               <FormField
                  control={form.control}
                  name="equipo_asociado_id"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Equipo Asociado (Opcional)</FormLabel>
                        <Select
                           onValueChange={field.onChange}
                           value={field.value ?? undefined} // ✅ nunca string vacío
                        >
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione equipo..." />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {equipos.map((eq) => (
                                 <SelectItem key={eq.id} value={eq.id}>
                                    {eq.nombre}
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
                        <FormLabel>Motivo del Ajuste</FormLabel>
                        <FormControl>
                           <Textarea
                              placeholder="Justifique la diferencia de inventario..."
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
                     <FormLabel>Notas</FormLabel>
                     <FormControl>
                        <Textarea {...field} value={field.value || ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-2">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEntrada ? (
                     <PackagePlus className="mr-2 h-4 w-4" />
                  ) : isSalida ? (
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
