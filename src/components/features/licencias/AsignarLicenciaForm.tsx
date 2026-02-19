"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { useState } from "react";
import { Loader2, Link as LinkIcon, Laptop, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/use-toast";
import { asignarLicenciaSchema } from "@/lib/zod";
import { EquipoSimple, UsuarioSimple } from "@/types/api";
import { licenciasService } from "@/app/services/licenciasService";

interface AsignarLicenciaFormProps {
   licenciaId: string;
   equipos: EquipoSimple[];
   usuarios: UsuarioSimple[];
   onSuccess: () => void;
}

type FormValues = z.infer<typeof asignarLicenciaSchema>;

export function AsignarLicenciaForm({ licenciaId, equipos, usuarios, onSuccess }: AsignarLicenciaFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const [activeTab, setActiveTab] = useState<"equipo" | "usuario">("equipo");

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(asignarLicenciaSchema),
      defaultValues: {
         asignar_a: "equipo",
         equipo_id: null,
         usuario_id: null,
         notas: "",
      },
   });

   const handleTabChange = (val: string) => {
      const newVal = val as "equipo" | "usuario";
      setActiveTab(newVal);
      form.setValue("asignar_a", newVal);

      if (newVal === "equipo") form.setValue("usuario_id", null);
      else form.setValue("equipo_id", null);

      form.clearErrors();
   };

   const onSubmit = async (values: FormValues) => {
      setIsLoading(true);
      try {
         await licenciasService.asignar({
            licencia_id: licenciaId,
            equipo_id: values.asignar_a === "equipo" ? values.equipo_id ?? null : null,
            usuario_id: values.asignar_a === "usuario" ? values.usuario_id ?? null : null,
            notas: values.notas ?? null,
         });

         toast({
            title: "Licencia Asignada",
            description: `Se ha vinculado correctamente al ${values.asignar_a}.`,
         });

         onSuccess();
      } catch (err) {
         const e = err as Error & { status?: number };
         toast({
            variant: "destructive",
            title: "Error",
            description:
               e.message ||
               "No se pudo realizar la asignación. Verifique si ya existe una asignación para este destino.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
               <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="equipo" className="gap-2">
                     <Laptop className="h-4 w-4" /> A Equipo
                  </TabsTrigger>
                  <TabsTrigger value="usuario" className="gap-2">
                     <User className="h-4 w-4" /> A Usuario
                  </TabsTrigger>
               </TabsList>

               <div className="mt-4 p-4 border rounded-md bg-muted/20">
                  <TabsContent value="equipo" className="mt-0">
                     <FormField
                        control={form.control}
                        name="equipo_id"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Seleccionar Equipo</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                 <FormControl>
                                    <SelectTrigger>
                                       <SelectValue placeholder="Buscar equipo..." />
                                    </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                    {equipos.map((eq) => (
                                       <SelectItem key={eq.id} value={eq.id}>
                                          {eq.nombre} - {eq.numero_serie}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </TabsContent>

                  <TabsContent value="usuario" className="mt-0">
                     <FormField
                        control={form.control}
                        name="usuario_id"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Seleccionar Usuario</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                 <FormControl>
                                    <SelectTrigger>
                                       <SelectValue placeholder="Buscar usuario..." />
                                    </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                    {usuarios.map((u) => (
                                       <SelectItem key={u.id} value={u.id}>
                                          {u.nombre_usuario}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </TabsContent>
               </div>
            </Tabs>

            <FormField
               control={form.control}
               name="notas"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Notas de Asignación</FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder="Ej: Instalado remotamente, Ticket #555"
                           {...field}
                           value={field.value || ""}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end pt-2">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Confirmar Asignación
               </Button>
            </div>
         </form>
      </Form>
   );
}
