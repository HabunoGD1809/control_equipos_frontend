"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, Save, CheckCircle2, Circle } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { ChangePasswordSchema } from "@/lib/zod";
import { authService } from "@/app/services/authService";
import { cn } from "@/lib/utils";

type FormValues = z.infer<typeof ChangePasswordSchema>;

export function ChangePasswordForm() {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(ChangePasswordSchema),
      defaultValues: {
         current_password: "",
         new_password: "",
         confirm_password: "",
      },
   });

   // Obtenemos el valor en tiempo real
   const newPass = form.watch("new_password") || "";

   const validations = [
      { id: 'length', text: 'Mínimo 8 caracteres', isValid: newPass.length >= 8 },
      { id: 'uppercase', text: 'Al menos una letra mayúscula', isValid: /[A-Z]/.test(newPass) },
      { id: 'number', text: 'Al menos un número', isValid: /[0-9]/.test(newPass) },
      { id: 'symbol', text: 'Al menos un símbolo (ej. !@#$%)', isValid: /[^A-Za-z0-9]/.test(newPass) },
   ];

   const strengthScore = validations.filter(v => v.isValid).length;

   // Colores de la barra principal
   const getStrengthColor = () => {
      if (strengthScore === 0) return "bg-muted";
      if (strengthScore <= 2) return "bg-red-500";
      if (strengthScore === 3) return "bg-amber-500";
      return "bg-emerald-500";
   };

   const onSubmit = async (values: FormValues) => {
      setIsLoading(true);
      try {
         await authService.changePassword(values);
         toast({ title: "Contraseña actualizada", description: "Su contraseña ha sido cambiada exitosamente." });
         form.reset();
      } catch (error: unknown) {
         const { message } = getFriendlyErrorMessage(error);
         toast({ variant: "destructive", title: "Error de seguridad", description: message });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <FormField control={form.control} name="current_password" render={({ field }) => (
               <FormItem>
                  <FormLabel>Contraseña Actual</FormLabel>
                  <FormControl>
                     {/* INPUTS REDUCIDOS (max-w-sm) */}
                     <Input type="password" {...field} value={field.value ?? ""} className="max-w-sm bg-background" />
                  </FormControl>
                  <FormMessage />
               </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <FormField control={form.control} name="new_password" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                           <Input type="password" {...field} value={field.value ?? ""} className="max-w-sm bg-background" />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />

                  <FormField control={form.control} name="confirm_password" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                           <Input type="password" {...field} value={field.value ?? ""} className="max-w-sm bg-background" />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )} />
               </div>

               {/* PANEL DE VALIDACIÓN EN TIEMPO REAL */}
               <div className="bg-muted/30 border border-border/50 rounded-xl p-4 max-w-sm h-fit">
                  <h4 className="text-sm font-semibold mb-3 text-foreground">Requisitos de seguridad</h4>

                  {/* Barra de progreso global */}
                  <div className="flex h-1.5 w-full gap-1 mb-4">
                     {[1, 2, 3, 4].map((index) => (
                        <div
                           key={index}
                           className={cn(
                              "h-full flex-1 rounded-full transition-colors duration-300",
                              index <= strengthScore ? getStrengthColor() : "bg-muted"
                           )}
                        />
                     ))}
                  </div>

                  {/* Lista de validaciones con iconos */}
                  <ul className="space-y-2.5">
                     {validations.map((val) => (
                        <li key={val.id} className="flex items-center text-sm transition-colors duration-300">
                           {val.isValid ? (
                              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500 shrink-0" />
                           ) : (
                              <Circle className="h-4 w-4 mr-2 text-muted-foreground/40 shrink-0" />
                           )}
                           <span className={val.isValid ? "text-foreground font-medium" : "text-muted-foreground"}>
                              {val.text}
                           </span>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

            <div className="pt-4 flex justify-start">
               <Button
                  type="submit"
                  disabled={isLoading || strengthScore < 4}
                  size="sm"
                  variant="destructive"
                  className="shadow-sm min-w-32"
               >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Actualizar Contraseña
               </Button>
            </div>

         </form>
      </Form>
   );
}
