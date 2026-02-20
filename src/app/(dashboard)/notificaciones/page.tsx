"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check, Loader2, Trash2, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Notificacion, TipoNotificacionEnum } from '@/types/api';
import { notificacionesService } from '@/app/services/notificacionesService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const TypeIcon = ({ type }: { type: string }) => {
   switch (type) {
      case TipoNotificacionEnum.Error:
      case TipoNotificacionEnum.Alerta:
         return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case TipoNotificacionEnum.Info:
      case TipoNotificacionEnum.Sistema:
         return <Info className="h-5 w-5 text-blue-500" />;
      default:
         return <Bell className="h-5 w-5 text-primary" />;
   }
};

export default function NotificacionesPage() {
   const qc = useQueryClient();
   const { toast } = useToast();
   const router = useRouter();

   const [notifications, setNotifications] = useState<Notificacion[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [page, setPage] = useState(0);
   const limit = 20;

   const fetchNotifications = async (pageNum: number) => {
      setIsLoading(true);
      try {
         const data = await notificacionesService.getAll({ limit, skip: pageNum * limit } as any);
         setNotifications(prev => pageNum === 0 ? data : [...prev, ...data]);
      } catch (error) {
         toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las notificaciones." });
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchNotifications(0);
   }, []);

   const markAsReadMutation = useMutation({
      mutationFn: (id: string) => notificacionesService.marcarComoLeida(id),
      onSuccess: (_, id) => {
         // Actualiza la lista local
         setNotifications(notifs => notifs.map(n => n.id === id ? { ...n, leido: true } : n));
         // Avisa a la campanita que actualice su conteo
         qc.invalidateQueries({ queryKey: ["notificaciones", "unreadCount"] });
         qc.invalidateQueries({ queryKey: ["notificaciones", "latest"] });
      }
   });

   const deleteMutation = useMutation({
      mutationFn: (id: string) => notificacionesService.delete(id),
      onSuccess: (_, id) => {
         setNotifications(notifs => notifs.filter(n => n.id !== id));
         toast({ description: "Notificación eliminada." });
         qc.invalidateQueries({ queryKey: ["notificaciones"] });
      }
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

   return (
      <div className="space-y-6 max-w-4xl mx-auto">
         <div>
            <h1 className="text-3xl font-bold">Notificaciones</h1>
            <p className="text-muted-foreground">
               Historial completo de alertas, mantenimientos y eventos del sistema.
            </p>
         </div>

         <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20">
               <CardTitle className="text-lg flex justify-between items-center">
                  Bandeja de Entrada
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                        notificacionesService.marcarTodasComoLeidas().then(() => {
                           setNotifications(n => n.map(x => ({ ...x, leido: true })));
                           qc.invalidateQueries({ queryKey: ["notificaciones"] });
                        });
                     }}
                  >
                     Marcar todas como leídas
                  </Button>
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y">
                  {notifications.map(notif => {
                     const url = getUrlReferencia(notif);
                     return (
                        <div key={notif.id} className={cn("flex flex-col sm:flex-row items-start gap-4 p-5 transition-colors", !notif.leido && "bg-primary/5")}>
                           <div className="shrink-0 mt-1">
                              <TypeIcon type={notif.tipo} />
                           </div>

                           <div className="grow space-y-1">
                              <p className={cn("text-sm", !notif.leido ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                                 {notif.mensaje}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                 {format(new Date(notif.created_at), "PPP 'a las' p", { locale: es })}
                              </p>
                              {url && (
                                 <Button
                                    variant="link"
                                    className="p-0 h-auto text-xs mt-1 text-primary"
                                    onClick={() => router.push(url)}
                                 >
                                    Ver detalle del registro <ArrowRight className="h-3 w-3 ml-1" />
                                 </Button>
                              )}
                           </div>

                           <div className="flex shrink-0 gap-2 w-full sm:w-auto justify-end sm:justify-start pt-2 sm:pt-0">
                              {!notif.leido && (
                                 <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => markAsReadMutation.mutate(notif.id)}
                                    disabled={markAsReadMutation.isPending}
                                 >
                                    <Check className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Marcar leída</span>
                                 </Button>
                              )}
                              <Button
                                 size="sm"
                                 variant="ghost"
                                 className="text-destructive hover:bg-destructive/10"
                                 onClick={() => deleteMutation.mutate(notif.id)}
                                 disabled={deleteMutation.isPending}
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        </div>
                     );
                  })}

                  {notifications.length === 0 && !isLoading && (
                     <div className="p-8 text-center text-muted-foreground">
                        <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>No tienes notificaciones en tu historial.</p>
                     </div>
                  )}
               </div>

               {isLoading && (
                  <div className="flex justify-center p-6 border-t">
                     <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
               )}
            </CardContent>

            {notifications.length > 0 && (
               <CardFooter className="bg-muted/20 border-t p-4 flex justify-center">
                  <Button variant="outline" onClick={() => { setPage(p => p + 1); fetchNotifications(page + 1); }} disabled={isLoading}>
                     Cargar notificaciones anteriores
                  </Button>
               </CardFooter>
            )}
         </Card>
      </div>
   );
}
