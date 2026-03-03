"use client"

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { motion } from "framer-motion"
import { KeyRound, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { resetPasswordConfirmSchema } from "@/lib/zod"
import { confirmPasswordResetAction } from "@/actions/auth-actions"
import Link from "next/link"

type ResetFormValues = z.infer<typeof resetPasswordConfirmSchema>;

export default function ResetPasswordPage() {
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState(false);
   const [isPending, setIsPending] = useState(false);

   const form = useForm<ResetFormValues>({
      resolver: standardSchemaResolver(resetPasswordConfirmSchema),
      defaultValues: {
         username: "",
         token: "",
         new_password: "",
         confirm_password: ""
      },
   });

   async function onSubmit(values: ResetFormValues) {
      setError(null);
      setIsPending(true);

      try {
         const result = await confirmPasswordResetAction(values);

         if (result.error) {
            setError(result.error);
         } else if (result.success) {
            setSuccess(true);
         }
      } catch (err) {
         setError("Ocurrió un error inesperado al procesar la solicitud.");
      } finally {
         setIsPending(false);
      }
   }

   return (
      <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="w-full max-w-105 shadow-lg">
               <CardHeader className="text-center space-y-2">
                  <div className="flex justify-center items-center mb-2">
                     <div className="p-3 bg-primary/10 rounded-full">
                        <KeyRound className="h-8 w-8 text-primary" />
                     </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">Establecer Contraseña</CardTitle>
                  <CardDescription>
                     {success ? "Proceso completado" : "Ingrese los datos proporcionados por el administrador"}
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  {success ? (
                     <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <div className="space-y-2">
                           <h3 className="font-semibold text-lg">¡Contraseña Actualizada!</h3>
                           <p className="text-muted-foreground text-sm">
                              Su clave de acceso ha sido modificada exitosamente.
                           </p>
                        </div>
                        <Link href="/login" passHref>
                           <Button className="w-full size-lg">Iniciar Sesión Ahora</Button>
                        </Link>
                     </div>
                  ) : (
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                           <FormField control={form.control} name="username" render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Usuario</FormLabel>
                                 <FormControl><Input placeholder="Su nombre de usuario" {...field} /></FormControl>
                                 <FormMessage />
                              </FormItem>
                           )} />

                           <FormField control={form.control} name="token" render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Token de Reseteo</FormLabel>
                                 <FormControl><Input placeholder="Pegue el token aquí" {...field} /></FormControl>
                                 <FormMessage />
                              </FormItem>
                           )} />

                           <div className="grid gap-4 sm:grid-cols-2">
                              <FormField control={form.control} name="new_password" render={({ field }) => (
                                 <FormItem>
                                    <FormLabel>Nueva Clave</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                 </FormItem>
                              )} />

                              <FormField control={form.control} name="confirm_password" render={({ field }) => (
                                 <FormItem>
                                    <FormLabel>Confirmar</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                 </FormItem>
                              )} />
                           </div>

                           {error && (
                              <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                 <AlertCircle className="h-4 w-4 mr-2" /><p>{error}</p>
                              </div>
                           )}

                           <Button type="submit" className="w-full" disabled={isPending}>
                              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cambiar Contraseña"}
                           </Button>

                           <div className="text-center text-sm pt-2">
                              <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                                 Cancelar
                              </Link>
                           </div>
                        </form>
                     </Form>
                  )}
               </CardContent>
            </Card>
         </motion.div>
      </div>
   )
}
