"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LogIn, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/store/authStore"
import { loginSchema } from "@/lib/zod"
import { Token } from "@/types/api"

type FormValues = z.infer<typeof loginSchema>

interface ApiError {
   detail: string
}

export default function LoginPage() {
   const router = useRouter()
   const { toast } = useToast()
   const [error, setError] = useState<string | null>(null)
   const { setTokens, checkAuthStatus } = useAuthStore.getState();

   const form = useForm<FormValues>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
         username: "",
         password: "",
      },
   })

   async function onSubmit(values: FormValues) {
      setError(null)
      try {
         const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values)
         });

         if (!response.ok) {
            const errorData: ApiError = await response.json();
            throw new Error(errorData.detail || 'Credenciales incorrectas.');
         }

         const tokens: Token = await response.json();

         setTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });

         await checkAuthStatus();

         toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
         })

         router.push("/dashboard")
         router.refresh()

      } catch (err: any) {
         const errorMessage = err.message || "Ocurrió un error inesperado."
         setError(errorMessage)
         form.setValue("password", "")
      }
   }

   return (
      <div className="flex items-center justify-center min-h-screen">
         <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
         >
            <Card className="w-[400px]">
               <CardHeader className="text-center">
                  <div className="flex justify-center items-center mb-4">
                     <LogIn className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Iniciar Sesión</CardTitle>
                  <CardDescription>Accede a tu cuenta para gestionar el sistema.</CardDescription>
               </CardHeader>
               <CardContent>
                  <Form {...form}>
                     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                           control={form.control}
                           name="username"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Nombre de Usuario</FormLabel>
                                 <FormControl>
                                    <Input placeholder="usuario" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                        <FormField
                           control={form.control}
                           name="password"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Contraseña</FormLabel>
                                 <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                        {error && (
                           <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              <p>{error}</p>
                           </div>
                        )}
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                           {form.formState.isSubmitting ? "Ingresando..." : "Ingresar"}
                        </Button>
                     </form>
                  </Form>
                  <div className="mt-4 text-center text-sm">
                     <Link href="/reset-password" passHref>
                        <span className="text-muted-foreground hover:text-primary cursor-pointer">
                           ¿Olvidaste tu contraseña?
                        </span>
                     </Link>
                  </div>
               </CardContent>
            </Card>
         </motion.div>
      </div>
   )
}
