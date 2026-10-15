"use client";
import { AuthCard } from "@/components/features/usuarios/AuthCard";
import { landingPage } from "@/lib/permissions";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";
import { loginSchema } from "@/lib/zod";
import { loginAction } from "@/actions/auth-actions";

type FormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
   const router = useRouter();
   const { toast } = useToast();
   const [error, setError] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(loginSchema),
      defaultValues: { username: "", password: "" },
   });

   async function onSubmit(values: FormValues) {
      setError(null);

      startTransition(async () => {
         const result = await loginAction(values);

         if (result.error) {
            setError(result.error);
            form.setValue("password", "");
            return;
         }

         if (result.success) {
            toast({
               title: "¡Bienvenido!",
               description: "Has iniciado sesión correctamente.",
            });

            router.push(result.user?.requiere_cambio_contrasena ? "/cambiar-contrasena" : landingPage(result.user));
         }
      });
   }

   return <AuthCard title="Iniciar Sesión" description="Accede a tu cuenta para gestionar el sistema.">
                  <Form {...form}>
                     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                           control={form.control}
                           name="username"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Nombre de Usuario</FormLabel>
                                 <FormControl>
                                    <Input placeholder="usuario" {...field} disabled={isPending} />
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
                                    <Input type="password" placeholder="••••••••" {...field} disabled={isPending} />
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
                        <Button type="submit" className="w-full" disabled={isPending}>
                           {isPending ? (
                              <>
                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                 Ingresando...
                              </>
                           ) : (
                              "Ingresar"
                           )}
                        </Button>
                     </form>
                  </Form>
                  <div className="mt-4 text-center text-sm">
                     <Link href="/forgot-password">
                        <span className="text-muted-foreground hover:text-primary cursor-pointer">
                           ¿Olvidaste tu contraseña?
                        </span>
                     </Link>
                  </div>
   </AuthCard>;
}
