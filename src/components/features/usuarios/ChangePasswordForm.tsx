"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, KeyRound } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";

import { ChangePasswordSchema } from "@/lib/zod";
import { authService } from "@/app/services/authService";

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

   const onSubmit = async (values: FormValues) => {
      setIsLoading(true);
      try {
         await authService.changePassword(values);

         toast({
            title: "Contraseña actualizada",
            description: "Su contraseña ha sido cambiada exitosamente.",
         });

         form.reset();
      } catch (error) {
         // ✅ Tipado genérico — sin dependencia directa de axios en el componente
         const detail =
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            (error instanceof Error ? error.message : null) ||
            "No se pudo cambiar la contraseña.";

         toast({
            variant: "destructive",
            title: "Error",
            description: detail,
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-md"
         >
            <FormField
               control={form.control}
               name="current_password"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Contraseña Actual</FormLabel>
                     <FormControl>
                        <Input type="password" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="new_password"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nueva Contraseña</FormLabel>
                     <FormControl>
                        <Input type="password" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <FormField
               control={form.control}
               name="confirm_password"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                     <FormControl>
                        <Input type="password" {...field} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
               {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
               )}
               Actualizar Contraseña
            </Button>
         </form>
      </Form>
   );
}
