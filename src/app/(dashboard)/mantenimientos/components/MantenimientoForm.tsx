"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/Calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { EquipoSimple, TipoMantenimiento, Proveedor, MantenimientoCreate } from "@/types/api";

const formSchema = z.object({
   equipo_id: z.string().uuid("Selecciona un equipo válido."),
   tipo_mantenimiento_id: z.string().uuid("Selecciona un tipo de mantenimiento."),
   fecha_programada: z.date({ required_error: "La fecha programada es obligatoria." }),
   tecnico_responsable: z.string().min(3, "El nombre del técnico es obligatorio."),
   proveedor_servicio_id: z.string().uuid().optional().nullable(),
   observaciones: z.string().optional().nullable(),
});

interface MantenimientoFormProps {
   equipos: EquipoSimple[];
   tiposMantenimiento: TipoMantenimiento[];
   proveedores: Proveedor[];
   onSuccess: () => void;
}

export function MantenimientoForm({ equipos, tiposMantenimiento, proveedores, onSuccess }: MantenimientoFormProps) {
   const { toast } = useToast();
   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         tecnico_responsable: "",
      },
   });

   async function onSubmit(values: z.infer<typeof formSchema>) {
      try {
         const dataToSubmit: MantenimientoCreate = {
            ...values,
            fecha_programada: values.fecha_programada.toISOString(),
         };
         await api.post("/mantenimientos", dataToSubmit);
         toast({
            title: "Éxito",
            description: "Mantenimiento programado correctamente.",
         });
         onSuccess();
      } catch (error) {
         toast({
            title: "Error",
            description: "No se pudo programar el mantenimiento.",
            variant: "destructive",
         });
      }
   }

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
               control={form.control}
               name="equipo_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Equipo</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un equipo" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {equipos.map(equipo => (
                              <SelectItem key={equipo.id} value={equipo.id}>
                                 {equipo.nombre} ({equipo.numero_serie})
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
               name="tipo_mantenimiento_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Mantenimiento</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {tiposMantenimiento.map(tipo => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                 {tipo.nombre}
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
               name="fecha_programada"
               render={({ field }) => (
                  <FormItem className="flex flex-col">
                     <FormLabel>Fecha Programada</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                              <Button
                                 variant={"outline"}
                                 className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                 )}
                              >
                                 {field.value ? (
                                    format(field.value, "PPP")
                                 ) : (
                                    <span>Selecciona una fecha</span>
                                 )}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                           </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                           />
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
               name="proveedor_servicio_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Proveedor Externo (Opcional)</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un proveedor si aplica" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {proveedores.map(proveedor => (
                              <SelectItem key={proveedor.id} value={proveedor.id}>
                                 {proveedor.nombre}
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
               name="observaciones"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Observaciones</FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder="Añade notas o comentarios sobre el mantenimiento"
                           {...field}
                           value={field.value ?? ''}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <Button type="submit" className="w-full">Programar Mantenimiento</Button>
         </form>
      </Form>
   );
}
