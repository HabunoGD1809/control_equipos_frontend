"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { LogIn, AlertCircle } from "lucide-react"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"
import { Usuario } from "@/types/api"

// Esquema de validación con Zod
const loginSchema = z.object({
   username: z.string().min(1, { message: "El nombre de usuario es requerido." }),
   password: z.string().min(1, { message: "La contraseña es requerida." }),
});


type FormValues = z.infer<typeof loginSchema>

interface ApiError {
   detail: string
}

export default function LoginPage() {
   const router = useRouter()
   // Llama a las acciones y estados desde tu store de Zustand
   const { setTokens, setUser } = useAuthStore();
   const { toast } = useToast()
   const [error, setError] = useState<string | null>(null)

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
         // 1. Pide los tokens
         const tokenResponse = await api.post('/auth/login/access-token', new URLSearchParams({
            username: values.username,
            password: values.password
         }));

         const { access_token, refresh_token } = tokenResponse.data;

         // 2. Guarda los tokens en el store de Zustand
         setTokens({ accessToken: access_token, refreshToken: refresh_token });

         // 3. Pide la información del usuario
         const userResponse = await api.get<Usuario>('/usuarios/me');

         // 4. Guarda la información del usuario en el store
         setUser(userResponse.data);

         toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
         })
         router.push("/dashboard")
      } catch (err) {
         const axiosError = err as AxiosError<ApiError>
         const errorMessage = axiosError.response?.data?.detail || "Ocurrió un error inesperado."
         setError(errorMessage)
         form.setValue("password", "")
      }
   }

   return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
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
                                    <Input placeholder="tu.usuario" {...field} />
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
                     <Link href="/forgot-password" passHref>
                        <span className="underline text-muted-foreground hover:text-primary cursor-pointer">
                           ¿Olvidó su contraseña?
                        </span>
                     </Link>
                  </div>
               </CardContent>
            </Card>
         </motion.div>
      </div>
   )
}
