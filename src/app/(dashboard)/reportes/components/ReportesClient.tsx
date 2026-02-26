"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, FileDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/Form";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/Select";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/Card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { reporteSchema } from "@/lib/zod";
import { reportesService } from "@/app/services/reportesService";
import { ReporteParams } from "@/types/api";

type FormValues = z.infer<typeof reporteSchema>;

export const ReportesClient = () => {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(reporteSchema),
      defaultValues: {
         tipo_reporte: "equipos",
         formato: "pdf",
         fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
         fecha_fin: new Date(),
      },
   });

   const onSubmit = async (data: FormValues) => {
      setIsLoading(true);
      try {
         const apiPayload: ReporteParams = {
            tipo_reporte: data.tipo_reporte as ReporteParams["tipo_reporte"],
            formato: data.formato as ReporteParams["formato"],
            fecha_inicio: format(data.fecha_inicio, "yyyy-MM-dd"),
            fecha_fin: format(data.fecha_fin, "yyyy-MM-dd"),
         };

         await reportesService.generarReporte(apiPayload);

         toast({
            title: "Descarga iniciada",
            description: "El reporte se está generando y se descargará en breve.",
         });
      } catch (error: any) {
         console.error("Error generating report:", error);
         toast({
            variant: "destructive",
            title: "Error de generación",
            description: error.message || "No se pudo generar el reporte.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="container mx-auto py-10 animate-in fade-in duration-300">
         <Card className="max-w-2xl mx-auto shadow-sm border">
            <CardHeader className="bg-muted/20">
               <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-6 w-6 text-primary" />
                  Centro de Reportes
               </CardTitle>
               <CardDescription>
                  Exporte datos históricos o proyecciones futuras en formato PDF o Excel.
               </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                           control={form.control}
                           name="tipo_reporte"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Módulo</FormLabel>
                                 <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                 >
                                    <FormControl>
                                       <SelectTrigger>
                                          <SelectValue placeholder="Seleccione módulo" />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value="equipos">Inventario de Equipos</SelectItem>
                                       <SelectItem value="mantenimientos">Mantenimientos (Realizados/Prog)</SelectItem>
                                       <SelectItem value="inventario">Kardex de Inventario</SelectItem>
                                       <SelectItem value="movimientos">Movimientos de Activos</SelectItem>
                                       <SelectItem value="auditoria">Logs de Auditoría</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name="formato"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Formato</FormLabel>
                                 <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                 >
                                    <FormControl>
                                       <SelectTrigger>
                                          <SelectValue placeholder="Seleccione formato" />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value="pdf">Documento PDF (Impresión)</SelectItem>
                                       <SelectItem value="excel">Excel .xlsx (Análisis)</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                           control={form.control}
                           name="fecha_inicio"
                           render={({ field }) => (
                              <FormItem className="flex flex-col">
                                 <FormLabel>Desde</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <FormControl>
                                          <Button
                                             variant={"outline"}
                                             className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground",
                                             )}
                                          >
                                             {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                             ) : (
                                                <span>Seleccione fecha</span>
                                             )}
                                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                       </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                       <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          autoFocus
                                       />
                                    </PopoverContent>
                                 </Popover>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name="fecha_fin"
                           render={({ field }) => (
                              <FormItem className="flex flex-col">
                                 <FormLabel>Hasta</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <FormControl>
                                          <Button
                                             variant={"outline"}
                                             className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground",
                                             )}
                                          >
                                             {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                             ) : (
                                                <span>Seleccione fecha</span>
                                             )}
                                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                       </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                       <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) =>
                                             form.getValues("fecha_inicio") &&
                                             date < form.getValues("fecha_inicio")
                                          }
                                          autoFocus
                                       />
                                    </PopoverContent>
                                 </Popover>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <div className="flex justify-end pt-4">
                        <Button
                           type="submit"
                           disabled={isLoading}
                           className="w-full md:w-auto min-w-50 shadow-sm"
                        >
                           {isLoading ? (
                              <>
                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                 Procesando...
                              </>
                           ) : (
                              <>
                                 <FileDown className="mr-2 h-4 w-4" />
                                 Generar Reporte
                              </>
                           )}
                        </Button>
                     </div>
                  </form>
               </Form>
            </CardContent>
         </Card>
      </div>
   );
};
