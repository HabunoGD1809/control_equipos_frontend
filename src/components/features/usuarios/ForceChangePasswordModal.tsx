"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { ShieldAlert, Loader2, KeyRound } from "lucide-react";
import { changePasswordSchema } from "@/lib/zod";
import { changePasswordAction } from "@/actions/auth-actions";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type FormValues = z.infer<typeof changePasswordSchema>;

export function ForceChangePasswordModal() {
   const [isSubmitting, setIsSubmitting] = useState(false);
   const { toast } = useToast();

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(changePasswordSchema),
      defaultValues: { current_password: "", new_password: "", confirm_password: "" }
   });

   const onSubmit = async (data: FormValues) => {
      try {
         setIsSubmitting(true);
         const result = await changePasswordAction(data);
         if (result.error) throw new Error(result.error);
         if (result.loginRequired) { window.location.assign(new URL("/login", window.location.origin).href); return; }
         toast({ title: "Contraseña Actualizada", description: "Tu sesión ha sido asegurada. Redirigiendo..." });

         window.location.assign(new URL("/dashboard", window.location.origin).href);
      } catch (error: unknown) {
         const { message } = getFriendlyErrorMessage(error);
         toast({ variant: "destructive", title: "Error de Seguridad", description: message });
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={true}>
         <DialogContent
            className="sm:max-w-106.25 [&>button.absolute]:hidden outline-none pointer-events-auto"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
         >
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-5 w-5" /> Acción Requerida
               </DialogTitle>
               <DialogDescription>
                  Por políticas de seguridad, debes actualizar la contraseña generada por el administrador antes de utilizar el sistema.
               </DialogDescription>
            </DialogHeader>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                  <FormField control={form.control} name="current_password" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Contraseña Actual Temporal</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="new_password" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Nueva Contraseña Segura</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <FormField control={form.control} name="confirm_password" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
                  <div className="pt-4 flex justify-end">
                     <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                        Actualizar y Continuar
                     </Button>
                  </div>
               </form>
            </Form>
         </DialogContent>
      </Dialog>
   );
}
