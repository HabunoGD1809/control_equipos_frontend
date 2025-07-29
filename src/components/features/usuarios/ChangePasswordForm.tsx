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
import { changePasswordSchema } from "@/lib/zod"
import api from "@/lib/api"

type FormValues = z.infer<typeof changePasswordSchema>;

interface ApiError {
   detail: string;
}

export function ChangePasswordForm() {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: { current_password: "", new_password: "", confirm_password: "" },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         await api.put('/usuarios/me/password', {
            current_password: data.current_password,
            new_password: data.new_password
         });
         toast({ title: "Éxito", description: "Contraseña actualizada correctamente." });
         form.reset();
      } catch (error: unknown) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || "No se pudo cambiar la contraseña. Verifique su contraseña actual.";
         toast({ variant: "destructive", title: "Error", description: msg });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="current_password" render={({ field }) => (
               <FormItem><FormLabel>Contraseña Actual</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="new_password" render={({ field }) => (
               <FormItem><FormLabel>Nueva Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="confirm_password" render={({ field }) => (
               <FormItem><FormLabel>Confirmar Nueva Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end pt-2">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cambiar Contraseña
               </Button>
            </div>
         </form>
      </Form>
   )
}
