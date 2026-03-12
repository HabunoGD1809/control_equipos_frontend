"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
   Download, FileText, FileSpreadsheet, FileBarChart, Loader2, Calendar as CalendarIcon, Filter,
   RefreshCw, FileDown, CheckCircle2, Clock, AlertTriangle, XCircle
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { reporteSchema } from "@/lib/zod";
import { reportesService } from "@/app/services/reportesService";
import { ReporteParams } from "@/types/api";

type FormValues = z.infer<typeof reporteSchema>;

// FIX: Interfaz alineada exactamente con el Backend (ReporteResponse)
interface ReporteGenerado {
   id: string;
   tipo_reporte: string;
   formato: string;
   estado: "completado" | "pendiente" | "procesando" | "error" | "expirado";
   fecha_solicitud: string;
   fecha_completado?: string;
   error_msg?: string;
}

const EstadoBadge = ({ estado }: { estado: ReporteGenerado["estado"] }) => {
   const config = {
      completado: { label: "Disponible", icon: CheckCircle2, className: "bg-green-100 text-green-700 border-green-200" },
      pendiente: { label: "En Cola", icon: Clock, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      procesando: { label: "Procesando", icon: Loader2, className: "bg-blue-100 text-blue-700 border-blue-200" },
      error: { label: "Error", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
      expirado: { label: "Expirado", icon: AlertTriangle, className: "bg-muted text-muted-foreground border-muted" },
   }[estado] ?? { label: estado, icon: Clock, className: "bg-muted text-muted-foreground" };

   const Icon = config.icon;
   return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border", config.className)}>
         <Icon className={cn("h-3 w-3", estado === "procesando" && "animate-spin")} />
         {config.label}
      </span>
   );
};

const FormatoIcon = ({ formato }: { formato: string }) => {
   const f = formato.toLowerCase();
   if (f === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
   if (f === "xlsx" || f === "xls" || f === "excel") return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
   if (f === "csv") return <FileBarChart className="h-4 w-4 text-blue-500" />;
   return <FileText className="h-4 w-4 text-muted-foreground" />;
};

export const ReportesClient = () => {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [downloadingId, setDownloadingId] = useState<string | null>(null);

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(reporteSchema),
      defaultValues: {
         tipo_reporte: "equipos",
         formato: "pdf",
         fecha_inicio: subDays(new Date(), 30),
         fecha_fin: new Date(),
      },
   });

   // Historial conectado al backend
   const { data: historialReportes = [], isLoading: isLoadingHistory, refetch: refetchHistorial } = useQuery({
      queryKey: ["reportes_historial"],
      queryFn: () => reportesService.getHistorial() as Promise<ReporteGenerado[]>,
      staleTime: 30_000,
   });

   const generarReporteMutation = useMutation({
      mutationFn: async (data: FormValues) => {
         const apiPayload: ReporteParams = {
            tipo_reporte: data.tipo_reporte as ReporteParams["tipo_reporte"],
            formato: data.formato as ReporteParams["formato"],
            fecha_inicio: format(data.fecha_inicio, "yyyy-MM-dd"),
            fecha_fin: format(data.fecha_fin, "yyyy-MM-dd"),
         };
         return reportesService.generarReporte(apiPayload);
      },
      onSuccess: () => {
         toast({
            title: "Reporte Solicitado",
            description: "La generación ha comenzado en segundo plano. Recibirás una notificación cuando esté listo.",
         });
         // Refrescar el historial inmediatamente para ver el estado "Pendiente"
         refetchHistorial();
      },
      onError: (err: any) => {
         toast({
            variant: "destructive",
            title: "Error al solicitar reporte",
            description: err?.message || "No se pudo comunicar con el servidor de reportes.",
         });
      },
   });

   const handleDescargar = async (reporte: ReporteGenerado) => {
      if (reporte.estado !== "completado") return;
      setDownloadingId(reporte.id);
      try {
         const blob = await reportesService.descargarReporte(reporte.id);
         const ext = reporte.formato.toLowerCase();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `Reporte_${reporte.tipo_reporte}_${format(new Date(reporte.fecha_solicitud), "yyyy-MM-dd")}.${ext}`;
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(url);
         a.remove();
         toast({ title: "Descarga completada", description: `El reporte se descargó exitosamente.` });
      } catch {
         toast({ variant: "destructive", title: "Error de descarga", description: "El reporte no se pudo descargar o expiró." });
      } finally {
         setDownloadingId(null);
      }
   };

   const onSubmit = (data: FormValues) => generarReporteMutation.mutate(data);

   const handleClear = () => {
      form.reset({
         tipo_reporte: "equipos",
         formato: "pdf",
         fecha_inicio: subDays(new Date(), 30),
         fecha_fin: new Date(),
      });
   };

   return (
      <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-300">

         {/* COLUMNA IZQUIERDA: GENERADOR */}
         <div className="lg:col-span-7 space-y-6">
            <Card className="border shadow-sm">
               <CardHeader className="bg-muted/30 border-b pb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-primary/10 rounded-lg">
                        <Filter className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <CardTitle className="text-xl">Generador Analítico</CardTitle>
                        <CardDescription className="mt-1.5">
                           Configure los parámetros para extraer un consolidado de datos del sistema.
                        </CardDescription>
                     </div>
                  </div>
               </CardHeader>

               <CardContent className="pt-6">
                  <Form {...form}>
                     <form id="report-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField control={form.control} name="tipo_reporte" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" /> Módulo de Datos
                                 </FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                       <SelectTrigger className="h-11 bg-background">
                                          <SelectValue placeholder="Seleccione módulo" />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value="equipos">Catálogo de Equipos</SelectItem>
                                       <SelectItem value="movimientos">Registro de Movimientos</SelectItem>
                                       <SelectItem value="mantenimiento">Historial de Mantenimientos</SelectItem>
                                       <SelectItem value="inventario">Estado de Inventario</SelectItem>
                                       <SelectItem value="licencias">Asignaciones de Software</SelectItem>
                                       <SelectItem value="auditoria">Logs de Auditoría</SelectItem>
                                       <SelectItem value="kardex">Kardex de Inventario</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormMessage />
                              </FormItem>
                           )} />

                           <FormField control={form.control} name="formato" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="flex items-center gap-2">
                                    <Download className="h-4 w-4 text-muted-foreground" /> Formato de Exportación
                                 </FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                       <SelectTrigger className="h-11 bg-background">
                                          <SelectValue placeholder="Seleccione formato" />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value="pdf">
                                          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-red-500" /> Documento PDF</div>
                                       </SelectItem>
                                       <SelectItem value="excel">
                                          <div className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (.xlsx)</div>
                                       </SelectItem>
                                       <SelectItem value="csv">
                                          <div className="flex items-center gap-2"><FileBarChart className="h-4 w-4 text-blue-500" /> Archivo Plano (CSV)</div>
                                       </SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormMessage />
                              </FormItem>
                           )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-xl border border-muted/50">
                           <FormField control={form.control} name="fecha_inicio" render={({ field }) => (
                              <FormItem className="flex flex-col">
                                 <FormLabel>Desde la Fecha</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <FormControl>
                                          <Button type="button" variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background h-11", !field.value && "text-muted-foreground")}>
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
                                          <Button type="button" variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background h-11", !field.value && "text-muted-foreground")}>
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
                     </form>
                  </Form>
               </CardContent>

               <CardFooter className="bg-muted/20 border-t px-6 py-4 flex items-center justify-between">
                  <Button type="button" variant="ghost" onClick={handleClear} disabled={generarReporteMutation.isPending} className="text-muted-foreground hover:text-foreground">
                     <RefreshCw className="mr-2 h-4 w-4" /> Restaurar Filtros
                  </Button>
                  <Button type="submit" form="report-form" disabled={generarReporteMutation.isPending} className="min-w-40 shadow-md">
                     {generarReporteMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                     ) : (
                        <><FileDown className="mr-2 h-4 w-4" /> Solicitar Reporte</>
                     )}
                  </Button>
               </CardFooter>
            </Card>
         </div>

         {/* COLUMNA DERECHA: HISTORIAL */}
         <div className="lg:col-span-5">
            <Card className="h-full border shadow-sm flex flex-col">
               <CardHeader className="pb-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-lg">Historial Reciente</CardTitle>
                     <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal text-xs">Últimos 10</Badge>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7"
                           onClick={() => refetchHistorial()}
                           disabled={isLoadingHistory}
                           title="Actualizar historial"
                        >
                           <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isLoadingHistory && "animate-spin")} />
                        </Button>
                     </div>
                  </div>
               </CardHeader>

               <CardContent className="flex-1 flex flex-col p-0">
                  {isLoadingHistory ? (
                     <div className="flex-1 flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                     </div>
                  ) : historialReportes.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="p-3 bg-muted/30 rounded-full mb-3 border">
                           <FileText className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <h4 className="font-medium text-foreground mb-1">Sin reportes recientes</h4>
                        <p className="text-sm text-muted-foreground max-w-xs">
                           Los reportes que generes aparecerán aquí cuando estén listos.
                        </p>
                     </div>
                  ) : (
                     <div className="divide-y overflow-y-auto max-h-125">
                        {historialReportes.map((reporte) => {
                           const isDownloading = downloadingId === reporte.id;
                           const isDescargable = reporte.estado === "completado";

                           return (
                              <div
                                 key={reporte.id}
                                 className={cn(
                                    "flex items-start gap-3 px-4 py-3.5 transition-colors",
                                    isDescargable && "hover:bg-muted/30 cursor-pointer group",
                                    !isDescargable && "opacity-80"
                                 )}
                                 onClick={() => isDescargable && handleDescargar(reporte)}
                              >
                                 {/* Icono de formato */}
                                 <div className="mt-0.5 p-1.5 bg-background rounded-md border shadow-xs shrink-0">
                                    <FormatoIcon formato={reporte.formato} />
                                 </div>

                                 {/* Info */}
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium capitalize truncate">Reporte de {reporte.tipo_reporte.replace('_', ' ')}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                       {format(new Date(reporte.fecha_solicitud), "dd MMM yyyy, HH:mm", { locale: es })}
                                       <span className="mx-1.5">·</span>
                                       <span className="font-mono uppercase">{reporte.formato}</span>
                                    </p>
                                 </div>

                                 {/* Estado + acción */}
                                 <div className="shrink-0 flex flex-col items-end gap-1.5">
                                    <EstadoBadge estado={reporte.estado} />
                                    {isDescargable && (
                                       <span className="text-[10px] text-primary font-medium flex items-center gap-1 group-hover:underline">
                                          {isDownloading
                                             ? <><Loader2 className="h-3 w-3 animate-spin" /> Descargando</>
                                             : <><Download className="h-3 w-3" /> Descargar</>
                                          }
                                       </span>
                                    )}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
   );
};
