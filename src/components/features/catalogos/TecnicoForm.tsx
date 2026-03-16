"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useToast } from "@/components/ui/use-toast";

import { Tecnico, TecnicoCreate, TecnicoUpdate, Proveedor } from "@/types/api";
import { tecnicoSchema } from "@/lib/zod";
import { tecnicosService } from "@/app/services/tecnicosService";

interface TecnicoFormProps {
   initialData?: Tecnico;
   proveedores: Proveedor[];
   onSuccess: () => void;
}

export const TecnicoForm: React.FC<TecnicoFormProps> = ({ initialData, proveedores, onSuccess }) => {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<TecnicoCreate | TecnicoUpdate>({
      resolver: zodResolver(tecnicoSchema),
      defaultValues: initialData || {
         nombre_completo: "",
         es_externo: false,
         proveedor_id: null,
         telefono_contacto: "",
         email_contacto: "",
         is_active: true,
      },
   });

   // Escuchar si el switch de "Externo" cambia
   const esExterno = form.watch("es_externo");

   const onSubmit = async (data: TecnicoCreate | TecnicoUpdate) => {
      setIsLoading(true);
      try {
         if (initialData) {
            await tecnicosService.update(initialData.id, data as TecnicoUpdate);
            toast({ title: "Éxito", description: "Técnico actualizado correctamente." });
         } else {
            await tecnicosService.create(data as TecnicoCreate);
            toast({ title: "Éxito", description: "Técnico registrado correctamente." });
         }
         onSuccess();
      } catch (error: any) {
         toast({
            title: "Error",
            description: error.response?.data?.detail || "Ocurrió un error al guardar.",
            variant: "destructive",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField
               control={form.control}
               name="nombre_completo"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Nombre del Técnico o Empresa</FormLabel>
                     <FormControl>
                        <Input placeholder="Ej. Juan Pérez o Soporte Dell" {...field} value={field.value || ""} />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="telefono_contacto"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Teléfono (Opcional)</FormLabel>
                        <FormControl>
                           <Input placeholder="809-555-5555" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="email_contacto"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Email (Opcional)</FormLabel>
                        <FormControl>
                           <Input placeholder="correo@empresa.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <FormField
               control={form.control}
               name="es_externo"
               render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                     <div className="space-y-0.5">
                        <FormLabel className="text-base">¿Es un contratista externo?</FormLabel>
                        <div className="text-sm text-muted-foreground">
                           Actívalo si pertenece a una empresa proveedora.
                        </div>
                     </div>
                     <FormControl>
                        <Switch
                           checked={field.value}
                           onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) form.setValue("proveedor_id", null);
                           }}
                        />
                     </FormControl>
                  </FormItem>
               )}
            />

            {esExterno && (
               <FormField
                  control={form.control}
                  name="proveedor_id"
                  render={({ field }) => (
                     <FormItem className="animate-in slide-in-from-top-2">
                        <FormLabel>Empresa Proveedora</FormLabel>
                        <Select
                           onValueChange={field.onChange}
                           defaultValue={field.value || undefined}
                           value={field.value || undefined}
                        >
                           <FormControl>
                              <SelectTrigger>
                                 <SelectValue placeholder="Seleccione la empresa contratista..." />
                              </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {proveedores.map((prov) => (
                                 <SelectItem key={prov.id} value={prov.id}>{prov.nombre}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            )}

            {initialData && (
               <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 border-destructive/20 bg-destructive/5">
                        <div className="space-y-0.5">
                           <FormLabel className="text-base text-destructive">Estado del Técnico</FormLabel>
                           <div className="text-sm text-muted-foreground">
                              Si lo desactivas, no podrá ser seleccionado para nuevos mantenimientos.
                           </div>
                        </div>
                        <FormControl>
                           <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                     </FormItem>
                  )}
               />
            )}

            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? "Guardar Cambios" : "Registrar Técnico"}
               </Button>
            </div>
         </form>
      </Form>
   );
};
