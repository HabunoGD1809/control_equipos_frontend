"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, FileDown, Loader2, Eraser, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
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

         // Enviamos la petición al servidor (Celery en backend)
         await reportesService.generarReporte(apiPayload);

         toast({
            title: "Reporte en proceso",
            description: "La tarea se ha enviado al servidor. Recibirás una notificación o correo cuando esté listo.",
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
         });

      } catch (error: unknown) {
         const err = error as { message?: string };
         console.error("Error generating report:", err);
         toast({
            variant: "destructive",
            title: "Error al solicitar reporte",
            description: err.message || "No se pudo comunicar con el servidor de reportes.",
         });
      } finally {
         setIsLoading(false);
      }
   };

   const handleClear = () => {
      form.reset({
         tipo_reporte: "equipos",
         formato: "pdf",
         fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
         fecha_fin: new Date(),
      });
   };

   return (
      <div className="container mx-auto py-8 animate-in fade-in duration-300">
         <Card className="max-w-3xl mx-auto shadow-sm border border-muted">
            <CardHeader className="bg-muted/10 border-b pb-6">
               <CardTitle className="flex items-center gap-2 text-xl text-primary">
                  <FileDown className="h-6 w-6" />
                  Centro de Reportes
               </CardTitle>
               <CardDescription className="text-sm mt-1">
                  Exporte el consolidado de datos históricos. La generación se realiza en segundo plano y estará disponible en breve tras su solicitud.
               </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                     <div className="p-4 bg-card border rounded-lg shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField control={form.control} name="tipo_reporte" render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Módulo a Exportar</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                       <SelectTrigger className="bg-background">
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
                           )} />

                           <FormField control={form.control} name="formato" render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Formato de Salida</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                       <SelectTrigger className="bg-background">
                                          <SelectValue placeholder="Seleccione formato" />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value="pdf">Documento PDF (Impresión)</SelectItem>
                                       <SelectItem value="excel">Excel .xlsx (Análisis de datos)</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormMessage />
                              </FormItem>
                           )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField control={form.control} name="fecha_inicio" render={({ field }) => (
                              <FormItem className="flex flex-col">
                                 <FormLabel>Desde la Fecha</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <FormControl>
                                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}>
                                             {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                       </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                       <Calendar mode="single" selected={field.value} onSelect={field.onChange} autoFocus />
                                    </PopoverContent>
                                 </Popover>
                                 <FormMessage />
                              </FormItem>
                           )} />

                           <FormField control={form.control} name="fecha_fin" render={({ field }) => (
                              <FormItem className="flex flex-col">
                                 <FormLabel>Hasta la Fecha</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <FormControl>
                                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}>
                                             {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                       </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                       <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) => form.getValues("fecha_inicio") && date < form.getValues("fecha_inicio")}
                                          autoFocus
                                       />
                                    </PopoverContent>
                                 </Popover>
                                 <FormMessage />
                              </FormItem>
                           )} />
                        </div>
                     </div>

                     <div className="flex flex-col-reverse md:flex-row justify-between items-center pt-2 gap-4">
                        <Button type="button" variant="ghost" onClick={handleClear} disabled={isLoading} className="text-muted-foreground w-full md:w-auto">
                           <Eraser className="mr-2 h-4 w-4" /> Limpiar Filtros
                        </Button>
                        <Button type="submit" disabled={isLoading} className="w-full md:w-auto min-w-50 shadow-sm">
                           {isLoading ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                           ) : (
                              <><FileDown className="mr-2 h-4 w-4" /> Solicitar Reporte</>
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
