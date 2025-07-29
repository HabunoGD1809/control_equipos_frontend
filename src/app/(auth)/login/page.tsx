"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { HardDrive, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/Button"
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { useAuthStore } from "@/store/authStore"

const formSchema = z.object({
   username: z.string().min(1, { message: "El nombre de usuario es requerido." }),
   password: z.string().min(1, { message: "La contraseña es requerida." }),
})

interface LoginError {
   detail: string;
}

export default function LoginPage() {
   const router = useRouter()
   const [error, setError] = useState<string | null>(null)

   const setTokens = useAuthStore((state) => state.setTokens);
   const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: { username: "", password: "" },
   })

   async function onSubmit(values: z.infer<typeof formSchema>) {
      setError(null)

      try {
         const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
         });

         if (!response.ok) {
            const errorData: LoginError = await response.json();
            throw new Error(errorData.detail || 'Credenciales incorrectas');
         }

         const { access_token, refresh_token } = await response.json();
         setTokens({ accessToken: access_token, refreshToken: refresh_token });

         await checkAuthStatus();
         router.push('/dashboard');

      } catch (err) {
         const loginError = err as Error;
         setError(loginError.message || "No se pudo conectar al servidor.");
         console.error("Login failed:", loginError);
      }
   }


   return (
      <Card className="w-full max-w-md mx-auto">
         <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
               <HardDrive className="h-10 w-10 text-primary" />
            </div>
            <CardTitle>Control de Equipos</CardTitle>
            <CardDescription>Inicia sesión para acceder al sistema</CardDescription>
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
                              <Input placeholder="Usuario" {...field} autoComplete="username" />
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
                              <Input type="password" placeholder="••••••••" {...field} autoComplete="current-password" />
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
                  <Button
                     type="submit"
                     className="w-full"
                     disabled={form.formState.isSubmitting}
                  >
                     {form.formState.isSubmitting ? "Ingresando..." : "Ingresar"}
                  </Button>
               </form>
            </Form>
         </CardContent>
      </Card>
   )
}
