"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, SubmitHandler } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { useToast } from "@/components/ui/use-toast"
import { addComponenteSchema } from "@/lib/zod"
import api from "@/lib/api"
import { EquipoSimple } from "@/types/api"

interface AddComponenteFormProps {
   equipoPadreId: string;
   equiposDisponibles: EquipoSimple[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof addComponenteSchema>;

interface ApiError {
   detail: string;
}

export function AddComponenteForm({ equipoPadreId, equiposDisponibles, onSuccess }: AddComponenteFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(addComponenteSchema),
      defaultValues: {
         cantidad: 1,
         tipo_relacion: "componente",
      },
   });

   const onSubmit: SubmitHandler<FormValues> = async (data) => {
      setIsLoading(true);
      try {
         await api.post(`/equipos/${equipoPadreId}/componentes`, data);
         toast({ title: "Éxito", description: "Componente añadido correctamente." });
         router.refresh();
         onSuccess();
      } catch (error: unknown) {
         const axiosError = error as AxiosError<ApiError>;
         const errorMessage = axiosError.response?.data?.detail || "No se pudo añadir el componente.";
         toast({ variant: "destructive", title: "Error", description: errorMessage });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
               control={form.control}
               name="equipo_componente_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Equipo a Añadir</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                           <SelectTrigger><SelectValue placeholder="Seleccione un equipo..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {equiposDisponibles.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.nombre} ({e.numero_serie})</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="cantidad" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Cantidad</FormLabel>
                     {/* ✅ SOLUCIÓN: Convertir el valor a número en el onChange */}
                     <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                     <FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="tipo_relacion" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Tipo de Relación</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                           <SelectItem value="componente">Componente</SelectItem>
                           <SelectItem value="conectado_a">Conectado A</SelectItem>
                           <SelectItem value="parte_de">Parte De</SelectItem>
                           <SelectItem value="accesorio">Accesorio</SelectItem>
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )} />
            </div>
            <FormField control={form.control} name="notas" render={({ field }) => (
               <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Ej: Módulo de memoria RAM principal" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
               </FormItem>
            )} />
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Añadir Componente
               </Button>
            </div>
         </form>
      </Form>
   )
}
