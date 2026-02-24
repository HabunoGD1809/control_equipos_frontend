"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, Search } from "lucide-react";
import * as z from "zod";

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
import { Label } from "@/components/ui/Label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";

import { addComponenteSchema } from "@/lib/zod";
import { equiposService } from "@/app/services/equiposService";
import { useDebounce } from "@/hooks/useDebounce";

import { TipoRelacionComponenteEnum } from "@/types/api";
import type { EquipoSearchResult } from "@/types/api";

type AddComponenteValues = z.infer<typeof addComponenteSchema>;

interface AddComponenteFormProps {
   padreId: string;
   onSuccess: () => void;
}

export function AddComponenteForm({ padreId, onSuccess }: AddComponenteFormProps) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const [searchTerm, setSearchTerm] = useState("");
   const debouncedSearch = useDebounce(searchTerm, 500);
   const [searchResults, setSearchResults] = useState<EquipoSearchResult[]>([]);
   const [isSearching, setIsSearching] = useState(false);

   const form = useForm<AddComponenteValues>({
      resolver: standardSchemaResolver(addComponenteSchema),
      defaultValues: {
         equipo_componente_id: "",
         cantidad: 1,
         tipo_relacion: TipoRelacionComponenteEnum.Componente,
         notas: "",
      },
   });

   useEffect(() => {
      const search = async () => {
         if (!debouncedSearch || debouncedSearch.length < 2) {
            setSearchResults([]);
            return;
         }
         setIsSearching(true);
         try {
            const results = await equiposService.search(debouncedSearch);
            setSearchResults(results.filter(r => r.id !== padreId));
         } catch (error) {
            console.error("Error buscando equipos:", error);
         } finally {
            setIsSearching(false);
         }
      };
      search();
   }, [debouncedSearch, padreId]);

   const onSubmit = async (data: AddComponenteValues) => {
      setIsLoading(true);
      try {
         await equiposService.addComponente(padreId, {
            equipo_componente_id: data.equipo_componente_id,
            cantidad: data.cantidad,
            tipo_relacion: data.tipo_relacion,
            notas: data.notas || undefined,
         });
         toast({ title: "Componente vinculado exitosamente." });
         onSuccess();
      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: error.response?.data?.detail || error.message || "No se pudo agregar el componente.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

            {/* Búsqueda Independiente (No atada al react-hook-form) */}
            <div className="space-y-2 bg-muted/30 p-3 rounded-md border">
               <Label>1. Buscar Equipo para Vincular</Label>
               <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                     placeholder="Escriba nombre o número de serie..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 bg-background"
                  />
               </div>
               {isSearching && <p className="text-xs text-muted-foreground ml-1">Buscando en la base de datos...</p>}
            </div>

            {/* Campo conectado a react-hook-form */}
            <FormField
               control={form.control}
               name="equipo_componente_id"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>2. Seleccione el Equipo Encontrado</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                           <SelectTrigger>
                              <SelectValue placeholder="Seleccione un resultado de la búsqueda..." />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {searchResults.length === 0 && !isSearching && (
                              <SelectItem value="none" disabled>No hay resultados. Use la barra de búsqueda.</SelectItem>
                           )}
                           {searchResults.map((equipo) => (
                              <SelectItem key={equipo.id} value={equipo.id}>
                                 {equipo.nombre} ({equipo.numero_serie})
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="tipo_relacion"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Tipo de Relación</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                           </FormControl>
                           <SelectContent>
                              {Object.values(TipoRelacionComponenteEnum).map((tipo) => (
                                 <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Cantidad a Vincular</FormLabel>
                        <FormControl>
                           <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>

            <FormField
               control={form.control}
               name="notas"
               render={({ field }) => (
                  <FormItem>
                     <FormLabel>Notas / Observaciones</FormLabel>
                     <FormControl>
                        <Textarea
                           placeholder="Detalles sobre cómo se instala o vincula..."
                           {...field}
                           value={field.value ?? ""}
                        />
                     </FormControl>
                     <FormMessage />
                  </FormItem>
               )}
            />

            <div className="flex justify-end gap-3 pt-4">
               <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
                  Cancelar
               </Button>
               <Button type="submit" disabled={isLoading || !form.getValues("equipo_componente_id")}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vincular Componente
               </Button>
            </div>
         </form>
      </Form>
   );
}
