"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useToast } from "@/components/ui/use-toast"; // <-- CAMBIO: Importar el hook de toast del proyecto
import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { MovimientoCreate, EquipoRead, TipoMovimientoEquipoEnum } from "@/types/api";
import api from "@/lib/api";

const formSchema = z.object({
   equipo_id: z.string().uuid("Por favor, selecciona un equipo."),
   tipo_movimiento: z.nativeEnum({
      "Salida Temporal": "Salida Temporal",
      "Salida Definitiva": "Salida Definitiva",
      "Entrada": "Entrada",
      "Asignacion Interna": "Asignacion Interna",
      "Transferencia Bodega": "Transferencia Bodega",
   }),
   destino: z.string().min(3, "El destino debe tener al menos 3 caracteres.").optional().or(z.literal('')),
   proposito: z.string().min(3, "El propósito es requerido.").optional().or(z.literal('')),
   observaciones: z.string().optional(),
});

type MovimientoFormValues = z.infer<typeof formSchema>;

interface MovimientoFormProps {
   equipos: EquipoRead[];
   onSuccess: () => void;
}

export const MovimientoForm: React.FC<MovimientoFormProps> = ({ equipos, onSuccess }) => {
   const { toast } = useToast(); // <-- CAMBIO: Usar el hook del proyecto

   const form = useForm<MovimientoFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         equipo_id: "",
         tipo_movimiento: "Asignacion Interna",
         destino: "",
         proposito: "",
         observaciones: "",
      },
   });

   const onSubmit = async (data: MovimientoFormValues) => {
      try {
         const selectedEquipo = equipos.find(e => e.id === data.equipo_id);

         const payload: MovimientoCreate = {
            ...data,
            tipo_movimiento: data.tipo_movimiento as TipoMovimientoEquipoEnum,
            origen: selectedEquipo?.ubicacion_actual || "N/A",
         };

         await api.post("/movimientos/", payload);

         // <-- CAMBIO: Usar el toast del proyecto
         toast({
            title: "Éxito",
            description: "Movimiento registrado correctamente.",
         });
         onSuccess();
      } catch (error) {
         console.error("[MOVIMIENTO_FORM_SUBMIT]", error);
         // <-- CAMBIO: Usar el toast del proyecto para errores
         toast({
            variant: "destructive",
            title: "Error",
            description: "Error al registrar el movimiento. Revisa los datos.",
         });
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
               control={form.control}
               name="equipo_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Equipo</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un equipo..." />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {equipos.map((equipo) => (
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
               name="tipo_movimiento"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Movimiento</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo..." />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="Asignacion Interna">Asignación Interna</SelectItem>
                           <SelectItem value="Salida Temporal">Salida Temporal</SelectItem>
                           <SelectItem value="Transferencia Bodega">Transferencia a Bodega</SelectItem>
                           <SelectItem value="Entrada">Entrada</SelectItem>
                           <SelectItem value="Salida Definitiva">Salida Definitiva</SelectItem>
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="destino"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Destino</FormLabel>
                     <FormControl>
                        <Input placeholder="Ej: 'Juan Pérez', 'Almacén B', 'Reparación externa'" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="proposito"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Propósito</FormLabel>
                     <FormControl>
                        <Input placeholder="Ej: 'Uso en proyecto X', 'Préstamo', 'Revisión técnica'" {...field} />
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
                        <Input placeholder="Añade notas adicionales si es necesario" {...field} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end">
               <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Registrando..." : "Registrar Movimiento"}
               </Button>
            </div>
         </form>
      </Form>
   );
};
