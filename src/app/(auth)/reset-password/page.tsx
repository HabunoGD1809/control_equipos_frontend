"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { motion } from "framer-motion"
import { KeyRound, AlertCircle, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import api from "@/lib/api"
import Link from "next/link"
import { AxiosError } from "axios"

const formSchema = z.object({
   username: z.string().min(1, "El nombre de usuario es requerido."),
   token: z.string().uuid("El token no es válido."),
   new_password: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
});

interface ApiError {
   detail: string;
}

export default function ResetPasswordPage() {
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState(false);

   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: { username: "", token: "", new_password: "" },
   });

   async function onSubmit(values: z.infer<typeof formSchema>) {
      setError(null);
      try {
         await api.post('/auth/password-recovery/confirm-reset', values);
         setSuccess(true);
      } catch (err) {
         const axiosError = err as AxiosError<ApiError>;
         setError(axiosError.response?.data?.detail || "No se pudo cambiar la contraseña. Verifique los datos.");
      }
   }

   return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="w-[420px]">
               <CardHeader className="text-center">
                  <div className="flex justify-center items-center mb-4"><KeyRound className="h-10 w-10 text-primary" /></div>
                  <CardTitle>Establecer Nueva Contraseña</CardTitle>
                  <CardDescription>Ingrese los datos proporcionados por el administrador.</CardDescription>
               </CardHeader>
               <CardContent>
                  {success ? (
                     <div className="text-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        <p className="font-medium">¡Contraseña actualizada con éxito!</p>
                        <p className="text-muted-foreground text-sm">Ahora puede iniciar sesión con su nueva contraseña.</p>
                        <Link href="/login" passHref>
                           <Button className="w-full">Ir a Iniciar Sesión</Button>
                        </Link>
                     </div>
                  ) : (
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                           <FormField control={form.control} name="username" render={({ field }) => (
                              <FormItem><FormLabel>Nombre de Usuario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           <FormField control={form.control} name="token" render={({ field }) => (
                              <FormItem><FormLabel>Token de Reseteo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           <FormField control={form.control} name="new_password" render={({ field }) => (
                              <FormItem><FormLabel>Nueva Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           {error && <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 rounded-md"><AlertCircle className="h-4 w-4 mr-2" /><p>{error}</p></div>}
                           <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                              {form.formState.isSubmitting ? "Actualizando..." : "Establecer Contraseña"}
                           </Button>
                        </form>
                     </Form>
                  )}
               </CardContent>
            </Card>
         </motion.div>
      </div>
   )
}
