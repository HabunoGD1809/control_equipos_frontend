"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { motion } from "framer-motion"
import { KeyRound, AlertCircle, Copy } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { AxiosError } from "axios"

const formSchema = z.object({
   username: z.string().min(1, { message: "El nombre de usuario es requerido." }),
})

interface ResetResponse {
   username: string;
   reset_token: string;
   expires_at: string;
}

interface ApiError {
   detail: string;
}

export default function ForgotPasswordPage() {
   const [error, setError] = useState<string | null>(null)
   const [resetInfo, setResetInfo] = useState<ResetResponse | null>(null);
   const { toast } = useToast();

   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: { username: "" },
   })

   async function onSubmit(values: z.infer<typeof formSchema>) {
      setError(null);
      setResetInfo(null);
      try {
         const response = await api.post<ResetResponse>('/auth/password-recovery/request-reset', { username: values.username });
         setResetInfo(response.data);
         toast({ title: "Éxito", description: "Token de reseteo generado. Por favor, entréguelo al usuario de forma segura." });
      } catch (err) {
         const axiosError = err as AxiosError<ApiError>;
         setError(axiosError.response?.data?.detail || "No se pudo iniciar el reseteo de contraseña.");
      }
   }

   const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast({ description: "Token copiado al portapapeles." });
   }

   return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="w-[420px]">
               <CardHeader className="text-center">
                  <div className="flex justify-center items-center mb-4"><KeyRound className="h-10 w-10 text-primary" /></div>
                  <CardTitle>Reseteo de Contraseña (Admin)</CardTitle>
                  <CardDescription>Genere un token de un solo uso para un usuario.</CardDescription>
               </CardHeader>
               <CardContent>
                  {!resetInfo ? (
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                           <FormField control={form.control} name="username" render={({ field }) => (
                              <FormItem><FormLabel>Nombre de Usuario</FormLabel><FormControl><Input placeholder="usuario.a.resetear" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           {error && <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 rounded-md"><AlertCircle className="h-4 w-4 mr-2" /><p>{error}</p></div>}
                           <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                              {form.formState.isSubmitting ? "Generando..." : "Generar Token"}
                           </Button>
                        </form>
                     </Form>
                  ) : (
                     <div className="space-y-4 text-center">
                        <p>Token para <strong>{resetInfo.username}</strong>:</p>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                           <span className="truncate flex-1">{resetInfo.reset_token}</span>
                           <Button variant="ghost" size="icon" onClick={() => copyToClipboard(resetInfo.reset_token)}><Copy className="h-4 w-4" /></Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Este token expira en 15 minutos. Entréguelo al usuario.</p>
                        <Button variant="outline" onClick={() => setResetInfo(null)}>Generar otro token</Button>
                     </div>
                  )}
               </CardContent>
            </Card>
         </motion.div>
      </div>
   )
}
