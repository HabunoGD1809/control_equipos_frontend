"use client";

import { useTransition } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";

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

const cleanString = (str?: string | null) => (str && str.trim() !== "" ? str.trim() : null);

export function UpdateProfileForm({ currentUser }: UpdateProfileFormProps) {
   const { toast } = useToast();
   const [isPending, startTransition] = useTransition();

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(updateProfileSchema),
      defaultValues: {
         nombre_usuario: currentUser.nombre_usuario,
         email: currentUser.email || "",
      },
   });

   const onSubmit = (data: FormValues) => {
      startTransition(async () => {
         // Sanitizamos el payload antes de enviarlo al Server Action
         // TypeScript Fix: Asegurarse de que data.nombre_usuario exista antes de hacer trim()
         const cleanPayload = {
            nombre_usuario: data.nombre_usuario ? data.nombre_usuario.trim() : "",
            email: cleanString(data.email),
         };

         const result = await updateProfileAction(cleanPayload as any);

         if (result.error) {
            toast({
               variant: "destructive",
               title: "Error al actualizar",
               description: result.error,
            });
         } else {
            toast({
               title: "Perfil actualizado",
               description: "Tus datos han sido guardados correctamente.",
            });
         }
      });
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                  control={form.control}
                  name="nombre_usuario"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Nombre de Usuario</FormLabel>
                        <FormControl>
                           <Input
                              {...field}
                              disabled={isPending}
                              value={field.value ?? ""}
                              className="bg-background"
                           />
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
                        <FormLabel>Correo Electrónico <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                        <FormControl>
                           <Input
                              type="email"
                              {...field}
                              value={field.value ?? ""}
                              disabled={isPending}
                              placeholder="tucorreo@empresa.com"
                              className="bg-background"
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isPending} className="min-w-32 shadow-sm">
                  {isPending ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                     <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Cambios
               </Button>
            </div>
         </form>
      </Form>
   );
}
