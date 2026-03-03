"use client"

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { motion } from "framer-motion"
import { KeyRound, AlertCircle, Copy, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card"
import { useToast } from "@/components/ui/use-toast"
import { resetPasswordRequestSchema } from "@/lib/zod"
import { requestPasswordResetAction } from "@/actions/auth-actions"
import type { ResetTokenResponse, PasswordResetRequest } from "@/types/api"
import Link from "next/link"

export default function ForgotPasswordPage() {
   const [error, setError] = useState<string | null>(null)
   const [resetInfo, setResetInfo] = useState<ResetTokenResponse | null>(null)
   const [isPending, setIsPending] = useState(false)
   const { toast } = useToast()

   const form = useForm<PasswordResetRequest>({
      resolver: standardSchemaResolver(resetPasswordRequestSchema),
      defaultValues: { username: "" },
   })

   async function onSubmit(values: PasswordResetRequest) {
      setError(null)
      setResetInfo(null)
      setIsPending(true)

      try {
         const result = await requestPasswordResetAction(values)

         if (!result.success) {
            setError(result.error)
            toast({ variant: "destructive", title: "Acceso Denegado", description: result.error })
         } else {
            setResetInfo(result.data)
            toast({ title: "Éxito", description: "Token generado correctamente." })
         }
      } catch {
         setError("Ocurrió un error inesperado al contactar con el servidor.")
      } finally {
         setIsPending(false)
      }
   }

   const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text)
      toast({ description: "Token copiado al portapapeles." })
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
                  <CardTitle className="text-2xl font-bold">Generador de Acceso</CardTitle>
                  <CardDescription>Módulo administrativo para restablecimiento de contraseñas.</CardDescription>
               </CardHeader>
               <CardContent>
                  {!resetInfo ? (
                     <>
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-3 rounded-md flex items-start gap-2 mb-6 text-xs">
                           <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                           <p>
                              Esta acción requiere privilegios de <strong>Administrador</strong>.
                              Si usted es un usuario estándar, por favor contacte a soporte técnico para solicitar su token.
                           </p>
                        </div>
                        <Form {...form}>
                           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField control={form.control} name="username" render={({ field }) => (
                                 <FormItem>
                                    <FormLabel>Usuario a restablecer</FormLabel>
                                    <FormControl><Input placeholder="ej: jdoe" {...field} /></FormControl>
                                    <FormMessage />
                                 </FormItem>
                              )} />
                              {error && (
                                 <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                    <AlertCircle className="h-4 w-4 shrink-0 mr-2" /><p>{error}</p>
                                 </div>
                              )}
                              <Button type="submit" className="w-full" disabled={isPending}>
                                 {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generar Token Seguro"}
                              </Button>
                           </form>
                        </Form>
                     </>
                  ) : (
                     <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-muted p-4 rounded-lg border space-y-2">
                           <p className="text-sm font-medium text-muted-foreground">
                              Token generado para: <span className="text-foreground">{resetInfo.username}</span>
                           </p>
                           <div className="flex items-center gap-2">
                              <code className="flex-1 bg-background p-2 rounded border font-mono text-sm break-all text-left">
                                 {resetInfo.reset_token}
                              </code>
                              <Button variant="outline" size="icon" onClick={() => copyToClipboard(resetInfo.reset_token)}>
                                 <Copy className="h-4 w-4" />
                              </Button>
                           </div>
                           <p className="text-xs text-muted-foreground">
                              Expira a las: {new Date(resetInfo.expires_at).toLocaleTimeString()}
                           </p>
                        </div>
                        <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-md">
                           Entregue este token al usuario y diríjalo a:
                           <Link href="/reset-password" className="block mt-1 text-primary hover:underline font-medium break-all">
                              {typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '/reset-password'}
                           </Link>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setResetInfo(null)}>
                           Generar token para otro usuario
                        </Button>
                     </div>
                  )}
               </CardContent>
               <CardFooter className="flex justify-center border-t pt-6">
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                     Volver a la pantalla de Login
                  </Link>
               </CardFooter>
            </Card>
         </motion.div>
      </div>
   )
}
