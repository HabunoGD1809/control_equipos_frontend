"use client";

import { Bell, Check, ArrowRight, Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useToast } from "@/components/ui/use-toast";
import { notificacionesService } from "@/app/services/notificacionesService";
import { reportesService } from "@/app/services/reportesService";
import { useSession } from "@/contexts/SessionProvider";
import { Notificacion } from "@/types/api";

export function Notifications() {
   const router = useRouter();
   const qc = useQueryClient();
   const { user } = useSession();
   const { toast } = useToast();
   const enabled = !!user;

   const [realtimeUnreadCount, setRealtimeUnreadCount] = useState<number | null>(null);
   const prevCountRef = useRef<number | null>(null);
   const eventSourceRef = useRef<EventSource | null>(null);

   // 1. Polling del contador cada 3 segundos
   const { data: polledCount = 0 } = useQuery({
      queryKey: ["notificaciones", "unreadCount"],
      queryFn: () => notificacionesService.getUnreadCount(),
      enabled,
      staleTime: 0,
      refetchInterval: 3_000,
      refetchIntervalInBackground: false,
   });

   useEffect(() => {
      if (!enabled) return;

      const prev = prevCountRef.current;

      if (prev !== null && polledCount > prev) {
         toast({
            title: "Nueva Notificación",
            description: "Tienes una nueva alerta o reporte generado.",
            duration: 4000,
         });
         qc.invalidateQueries({ queryKey: ["notificaciones", "latest"] });
      }

      prevCountRef.current = polledCount;
      setRealtimeUnreadCount(polledCount);
   }, [polledCount, enabled, toast, qc]);

   // 2. Conexión SSE — ahora solo como disparador adicional para invalidar la lista
   useEffect(() => {
      if (!enabled) return;

      eventSourceRef.current?.close();
      const source = new EventSource("/api/sse/notificaciones");
      eventSourceRef.current = source;

      source.addEventListener("update", (event) => {
         const newCount = parseInt(event.data, 10);
         if (!isNaN(newCount)) {
            // Invalidar el query para que el polling tome el valor fresco de inmediato
            qc.invalidateQueries({ queryKey: ["notificaciones", "unreadCount"] });
            qc.invalidateQueries({ queryKey: ["notificaciones", "latest"] });
         }
      });

      source.onerror = () => {
         console.warn("[SSE] Conexión perdida, el navegador reintentará...");
      };

      return () => {
         source.close();
      };
   }, [enabled, qc]);

   // 3. Query de la Lista de Notificaciones
   const { data: notifications = [] } = useQuery({
      queryKey: ["notificaciones", "latest"],
      queryFn: () => notificacionesService.getAll({ limit: 5 }),
      enabled,
      staleTime: 0,
   });

   // 4. Mutaciones
   const markAllMutation = useMutation({
      mutationFn: () => notificacionesService.marcarTodasComoLeidas(),
      onSuccess: async () => {
         setRealtimeUnreadCount(0);
         prevCountRef.current = 0;
         await qc.invalidateQueries({ queryKey: ["notificaciones"] });
      },
   });

   const downloadReportMutation = useMutation({
      mutationFn: (reportId: string) => reportesService.descargarReporte(reportId),
      onSuccess: (blob) => {
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `Reporte_Sistema_${new Date().getTime()}`;
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(url);
         a.remove();
         toast({ title: "Descarga completada", description: "El reporte se ha descargado exitosamente." });
      },
      onError: () => {
         toast({ variant: "destructive", title: "Error de descarga", description: "El reporte no se pudo descargar o expiró." });
      },
   });

   const getUrlReferencia = (notif: Notificacion) => {
      if (!notif.referencia_tabla || !notif.referencia_id) return null;
      switch (notif.referencia_tabla) {
         case "equipos": return `/equipos/${notif.referencia_id}`;
         case "reservas_equipo": return `/reservas`;
         case "mantenimiento": return `/mantenimientos`;
         default: return null;
      }
   };

   if (!enabled) {
      return (
         <Button variant="outline" size="icon" className="relative opacity-50" disabled>
            <Bell className="h-[1.2rem] w-[1.2rem]" />
         </Button>
      );
   }

   const displayCount = realtimeUnreadCount !== null ? realtimeUnreadCount : polledCount;

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative transition-all duration-300 hover:bg-accent">
               <Bell className="h-[1.2rem] w-[1.2rem]" />
               {displayCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md animate-in zoom-in duration-300">
                     {displayCount > 99 ? "99+" : displayCount}
                  </span>
               )}
            </Button>
         </DropdownMenuTrigger>

         <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden shadow-xl border-muted/60">
            <div className="bg-muted/30 px-4 py-3 border-b flex justify-between items-center">
               <span className="font-semibold text-sm">Notificaciones</span>
               {displayCount > 0 && (
                  <Button
                     variant="ghost"
                     size="sm"
                     className="text-xs text-muted-foreground hover:text-primary p-0 h-auto font-medium"
                     onClick={(e) => {
                        e.stopPropagation();
                        markAllMutation.mutate();
                     }}
                     disabled={markAllMutation.isPending}
                  >
                     <Check className="h-3.5 w-3.5 mr-1" />
                     Marcar todas leídas
                  </Button>
               )}
            </div>

            {notifications.length > 0 ? (
               <div className="max-h-87.5 overflow-y-auto no-scrollbar flex flex-col">
                  {notifications.map((notif) => {
                     const isReport = notif.referencia_tabla === "reporte_generado";
                     const url = getUrlReferencia(notif);
                     const isDownloading = downloadReportMutation.isPending && downloadReportMutation.variables === notif.referencia_id;

                     return (
                        <div
                           key={notif.id}
                           className={`group flex flex-col items-start gap-1 p-4 cursor-pointer border-b last:border-0 transition-colors ${!notif.leido ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/50"}`}
                           onClick={(e) => {
                              e.preventDefault();
                              if (isReport && notif.referencia_id) {
                                 downloadReportMutation.mutate(notif.referencia_id);
                              } else if (url) {
                                 router.push(url);
                              }
                           }}
                        >
                           <div className="flex justify-between w-full items-start gap-2">
                              <p className={`text-sm leading-snug ${!notif.leido ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                                 {notif.mensaje}
                              </p>
                              <div className="shrink-0 mt-0.5 bg-background p-1.5 rounded-full shadow-xs border group-hover:scale-110 transition-transform">
                                 {isReport ? (
                                    isDownloading ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                                       : <Download className="h-3.5 w-3.5 text-primary" />
                                 ) : (
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                 )}
                              </div>
                           </div>
                           <p className="text-[11px] text-muted-foreground/70 font-medium">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                           </p>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                     <Check className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Todo al día</p>
                  <p className="text-xs text-muted-foreground">No tienes notificaciones pendientes.</p>
               </div>
            )}

            <div className="bg-muted/10 p-2 border-t">
               <Button
                  variant="ghost"
                  className="w-full text-xs font-semibold justify-center h-8"
                  onClick={() => router.push("/notificaciones")}
               >
                  Ver historial completo
               </Button>
            </div>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
