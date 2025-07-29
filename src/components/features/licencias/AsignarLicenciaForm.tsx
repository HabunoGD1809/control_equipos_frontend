"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import { useToast } from "@/components/ui/use-toast"
import { asignarLicenciaSchema } from "@/lib/zod"
import api from "@/lib/api"
import { EquipoSimple, UsuarioSimple } from "@/types/api"

interface AsignarLicenciaFormProps {
   licenciaId: string;
   equipos: EquipoSimple[];
   usuarios: UsuarioSimple[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof asignarLicenciaSchema>;

interface ApiError {
   detail: string;
}

export function AsignarLicenciaForm({ licenciaId, equipos, usuarios, onSuccess }: AsignarLicenciaFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(asignarLicenciaSchema),
   });

   const asignarA = form.watch("asignar_a");

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const payload = {
            licencia_id: licenciaId,
            equipo_id: data.asignar_a === 'equipo' ? data.equipo_id : null,
            usuario_id: data.asignar_a === 'usuario' ? data.usuario_id : null,
            notas: data.notas,
         };
         await api.post('/licencias/asignaciones/', payload);
         toast({ title: "Éxito", description: "Licencia asignada correctamente." });
         router.refresh();
         onSuccess();
      } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || "No se pudo asignar la licencia. Verifique la disponibilidad.";
         toast({ variant: "destructive", title: "Error", description: msg });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
               control={form.control}
               name="asignar_a"
               render={({ field }) => (
                  <FormItem className="space-y-3">
                     <FormLabel>Asignar A:</FormLabel>
                     <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                           <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="equipo" /></FormControl><FormLabel className="font-normal">Equipo</FormLabel></FormItem>
                           <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="usuario" /></FormControl><FormLabel className="font-normal">Usuario</FormLabel></FormItem>
                        </RadioGroup>
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            {asignarA === 'equipo' && (
               <FormField control={form.control} name="equipo_id" render={({ field }) => (
                  <FormItem><FormLabel>Equipo</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un equipo..." /></SelectTrigger></FormControl>
                        <SelectContent>{equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre} ({e.numero_serie})</SelectItem>)}</SelectContent>
                     </Select><FormMessage />
                  </FormItem>
               )} />
            )}

            {asignarA === 'usuario' && (
               <FormField control={form.control} name="usuario_id" render={({ field }) => (
                  <FormItem><FormLabel>Usuario</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un usuario..." /></SelectTrigger></FormControl>
                        <SelectContent>{usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.nombre_usuario}</SelectItem>)}</SelectContent>
                     </Select><FormMessage />
                  </FormItem>
               )} />
            )}

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Asignar Licencia
               </Button>
            </div>
         </form>
      </Form>
   )
}
