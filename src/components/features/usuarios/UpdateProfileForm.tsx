"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { Usuario } from "@/types/api"
import { useAuthStore } from "@/store/authStore"

const profileSchema = z.object({
   nombre_usuario: z.string().min(3, "Mínimo 3 caracteres").max(50),
   email: z.string().email("Debe ser un email válido.").optional().nullable(),
});

type FormValues = z.infer<typeof profileSchema>;

interface ApiError {
   detail: string;
}

interface UpdateProfileFormProps {
   currentUser: Usuario;
}

export function UpdateProfileForm({ currentUser }: UpdateProfileFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);

   const form = useForm<FormValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
         nombre_usuario: currentUser.nombre_usuario,
         email: currentUser.email,
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         await api.put('/usuarios/me', data);
         await checkAuthStatus(); // Actualiza el estado global del usuario
         toast({ title: "Éxito", description: "Perfil actualizado correctamente." });
      } catch (error: unknown) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || "No se pudo actualizar el perfil.";
         toast({ variant: "destructive", title: "Error", description: msg });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nombre_usuario" render={({ field }) => (
               <FormItem><FormLabel>Nombre de Usuario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
               <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end pt-2">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
               </Button>
            </div>
         </form>
      </Form>
   )
}
