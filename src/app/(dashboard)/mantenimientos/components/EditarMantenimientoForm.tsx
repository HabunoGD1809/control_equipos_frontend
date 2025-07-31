"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/Calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Mantenimiento, MantenimientoUpdate, Proveedor, EstadoMantenimientoEnum } from "@/types/api";
import { useRouter } from "next/navigation";

const updateMantenimientoSchema = z.object({
   fecha_programada: z.date().optional(),
   fecha_inicio: z.date().optional().nullable(),
   fecha_finalizacion: z.date().optional().nullable(),
   costo_real: z.coerce.number().min(0).optional().nullable(),
   tecnico_responsable: z.string().min(3, "El nombre del técnico es obligatorio."),
   proveedor_servicio_id: z.string().uuid().optional().nullable(),
   estado: z.nativeEnum(EstadoMantenimientoEnum),
   observaciones: z.string().optional().nullable(),
});

interface EditarMantenimientoFormProps {
   mantenimiento: Mantenimiento;
   proveedores: Proveedor[];
   onSuccess: () => void;
}

export function EditarMantenimientoForm({ mantenimiento, proveedores, onSuccess }: EditarMantenimientoFormProps) {
   const { toast } = useToast();
   const router = useRouter();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<z.infer<typeof updateMantenimientoSchema>>({
      resolver: zodResolver(updateMantenimientoSchema),
      defaultValues: {
         ...mantenimiento,
         fecha_programada: mantenimiento.fecha_programada ? new Date(mantenimiento.fecha_programada) : undefined,
         fecha_inicio: mantenimiento.fecha_inicio ? new Date(mantenimiento.fecha_inicio) : null,
         fecha_finalizacion: mantenimiento.fecha_finalizacion ? new Date(mantenimiento.fecha_finalizacion) : null,
         costo_real: mantenimiento.costo_real ? parseFloat(mantenimiento.costo_real) : undefined,
      },
   });

   async function onSubmit(values: z.infer<typeof updateMantenimientoSchema>) {
      setIsLoading(true);
      try {
         const dataToSubmit: MantenimientoUpdate = {
            ...values,
            fecha_programada: values.fecha_programada?.toISOString(),
            fecha_inicio: values.fecha_inicio?.toISOString(),
            fecha_finalizacion: values.fecha_finalizacion?.toISOString(),
            costo_real: values.costo_real?.toString(),
         };

         await api.put(`/mantenimientos/${mantenimiento.id}`, dataToSubmit);
         toast({
            title: "Éxito",
            description: "Mantenimiento actualizado correctamente.",
         });
         router.refresh();
         onSuccess();
      } catch (error) {
         toast({
            title: "Error",
            description: "No se pudo actualizar el mantenimiento.",
            variant: "destructive",
         });
      } finally {
         setIsLoading(false);
      }
   }

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
               control={form.control}
               name="estado"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Estado</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un estado" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {Object.values(EstadoMantenimientoEnum).map(estado => (
                              <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={form.control}
               name="fecha_programada"
               render={({ field }) => (
                  <FormItem className="flex flex-col">
                     <FormLabel>Fecha Programada</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                              <Button
                                 variant={"outline"}
                                 className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                 {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                           </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                     </Popover>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={form.control}
               name="tecnico_responsable"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Técnico Responsable</FormLabel>
                     <FormControl>
                        <Input placeholder="Nombre del técnico o empresa" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={form.control}
               name="costo_real"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Costo Real</FormLabel>
                     <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ""} />
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
                     <FormLabel>Observaciones</FormLabel>
                     <FormControl>
                        <Textarea placeholder="Añade notas o comentarios sobre el mantenimiento" {...field} value={field.value ?? ''} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
               </Button>
            </div>
         </form>
      </Form>
   );
}
