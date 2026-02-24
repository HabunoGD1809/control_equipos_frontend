"use client";

import { useTransition } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";
import { Usuario } from "@/types/api";
import { updateProfileAction } from "@/actions/user-actions";
import { updateProfileSchema } from "@/lib/zod";

type FormValues = z.infer<typeof updateProfileSchema>;

interface UpdateProfileFormProps {
   currentUser: Usuario;
}

export function UpdateProfileForm({ currentUser }: UpdateProfileFormProps) {
   const { toast } = useToast();
   const [isPending, startTransition] = useTransition();

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(updateProfileSchema),
      defaultValues: {
         nombre_usuario: currentUser.nombre_usuario,
         email: currentUser.email,
      },
   });

   const onSubmit = (data: FormValues) => {
      startTransition(async () => {
         const result = await updateProfileAction(data);

         if (result.error) {
            toast({
               variant: "destructive",
               title: "Error al actualizar",
               description: result.error,
            });
         } else {
            toast({
               title: "Éxito",
               description: "Perfil actualizado correctamente.",
            });
         }
      });
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
               control={form.control}
               name="nombre_usuario"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nombre de Usuario</FormLabel>
                     <FormControl>
                        <Input {...field} disabled={isPending} value={field.value ?? ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <FormField
               control={form.control}
               name="email"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Email</FormLabel>
                     <FormControl>
                        <Input type="email" {...field} value={field.value ?? ""} disabled={isPending} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />
            <div className="flex justify-end pt-2">
               <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
               </Button>
            </div>
         </form>
      </Form>
   );
}
