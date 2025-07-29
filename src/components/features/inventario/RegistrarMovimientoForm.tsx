"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/button"
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { inventarioMovimientoSchema } from "@/lib/zod"
import api from "@/lib/api"
import { TipoItemInventario, EquipoSimple } from "@/types/api"

interface RegistrarMovimientoFormProps {
   tiposItem: TipoItemInventario[];
   equipos: EquipoSimple[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof inventarioMovimientoSchema>;

interface ApiError {
   detail: string;
}

export function RegistrarMovimientoForm({ tiposItem, equipos, onSuccess }: RegistrarMovimientoFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(inventarioMovimientoSchema),
      defaultValues: {
         cantidad: 1,
         ubicacion_origen: 'Almacén Principal',
         ubicacion_destino: 'Almacén Principal',
      },
   });

   const tipoMovimiento = form.watch("tipo_movimiento");

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         await api.post('/inventario/movimientos/', data);
         toast({
            title: "Éxito",
            description: "Movimiento de inventario registrado correctamente.",
         });
         router.refresh();
         onSuccess();
      } catch (error: unknown) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || "No se pudo registrar el movimiento.";
         toast({
            variant: "destructive",
            title: "Error",
            description: msg,
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">

            <FormField
               control={form.control}
               name="tipo_item_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Ítem de Inventario</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                           <SelectTrigger><SelectValue placeholder="Seleccione un ítem..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {tiposItem.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo..." /></SelectTrigger></FormControl>
                        <SelectContent>
                           <SelectItem value="Entrada Compra">Entrada por Compra</SelectItem>
                           <SelectItem value="Salida Uso">Salida por Uso</SelectItem>
                           <SelectItem value="Ajuste Positivo">Ajuste Positivo</SelectItem>
                           <SelectItem value="Ajuste Negativo">Ajuste Negativo</SelectItem>
                           <SelectItem value="Salida Descarte">Salida por Descarte</SelectItem>
                           <SelectItem value="Transferencia Salida">Transferencia (Salida)</SelectItem>
                           <SelectItem value="Transferencia Entrada">Transferencia (Entrada)</SelectItem>
                           <SelectItem value="Devolucion Proveedor">Devolución a Proveedor</SelectItem>
                           <SelectItem value="Devolucion Interna">Devolución Interna</SelectItem>
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="cantidad"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Cantidad</FormLabel>
                     <FormControl><Input type="number" {...field} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {(tipoMovimiento?.includes("Salida") || tipoMovimiento?.includes("Transferencia")) && (
               <FormField
                  control={form.control}
                  name="ubicacion_origen"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Ubicación Origen</FormLabel>
                        <FormControl><Input placeholder="Ej: Almacén Principal" {...field} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {(tipoMovimiento?.includes("Entrada") || tipoMovimiento?.includes("Transferencia")) && (
               <FormField
                  control={form.control}
                  name="ubicacion_destino"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Ubicación Destino</FormLabel>
                        <FormControl><Input placeholder="Ej: Taller" {...field} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {tipoMovimiento === "Salida Uso" && (
               <FormField
                  control={form.control}
                  name="equipo_asociado_id"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Asociar a Equipo (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un equipo..." /></SelectTrigger></FormControl>
                           <SelectContent>
                              {equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {tipoMovimiento?.includes("Ajuste") && (
               <FormField
                  control={form.control}
                  name="motivo_ajuste"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Motivo del Ajuste</FormLabel>
                        <FormControl><Textarea placeholder="Describa el motivo del ajuste de inventario..." {...field} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Movimiento
               </Button>
            </div>
         </form>
      </Form>
   )
}
