"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Switch } from "@/components/ui/Switch"
import { useToast } from "@/components/ui/use-toast"
import { usuarioCreateSchema, usuarioUpdateSchema } from "@/lib/zod"
import api from "@/lib/api"
import { Usuario, Rol } from "@/types/api"

interface UsuarioFormProps {
   initialData?: Usuario | null;
   roles: Rol[];
   onSuccess: () => void;
}

interface ApiError {
   detail: string;
}

export function UsuarioForm({ initialData, roles, onSuccess }: UsuarioFormProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const isEditing = !!initialData;
   const formSchema = isEditing ? usuarioUpdateSchema : usuarioCreateSchema;
   type FormValues = z.infer<typeof formSchema>;

   const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: isEditing ? {
         nombre_usuario: initialData.nombre_usuario,
         email: initialData.email,
         rol_id: initialData.rol_id,
         bloqueado: initialData.bloqueado
      } : { bloqueado: false },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const payload: Partial<FormValues> = { ...data };
         if (isEditing && 'password' in payload && !payload.password) {
            delete payload.password; // No enviar la contraseña si está vacía
         }

         if (isEditing) {
            await api.put(`/usuarios/${initialData.id}`, payload);
            toast({ title: "Éxito", description: "Usuario actualizado." });
         } else {
            await api.post('/usuarios/', payload);
            toast({ title: "Éxito", description: "Usuario creado." });
         }
         router.refresh();
         onSuccess();
      } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || "No se pudo guardar el usuario.";
         toast({ variant: "destructive", title: "Error", description: msg });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="nombre_usuario" render={({ field }) => (
               <FormItem><FormLabel>Nombre de Usuario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
               <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
               <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder={isEditing ? "Dejar en blanco para no cambiar" : ""} {...field} /></FormControl>
                  <FormMessage />
               </FormItem>
            )} />
            <FormField control={form.control} name="rol_id" render={({ field }) => (
               <FormItem><FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un rol" /></SelectTrigger></FormControl>
                     <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
               </FormItem>
            )} />
            {isEditing && (
               <FormField control={form.control} name="bloqueado" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                     <div className="space-y-0.5">
                        <FormLabel>Cuenta Bloqueada</FormLabel>
                        <FormDescription>Si se activa, el usuario no podrá iniciar sesión.</FormDescription>
                     </div>
                     <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
               )} />
            )}
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar Cambios" : "Crear Usuario"}
               </Button>
            </div>
         </form>
      </Form>
   )
}
