"use client"

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check, Loader2 } from 'lucide-react';

import { Notificacion } from '@/types/api';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function NotificacionesPage() {
   const [notifications, setNotifications] = useState<Notificacion[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [page, setPage] = useState(0);
   const limit = 20;

   const fetchNotifications = async (pageNum: number) => {
      setIsLoading(true);
      try {
         const response = await api.get<Notificacion[]>(`/notificaciones/?skip=${pageNum * limit}&limit=${limit}`);
         setNotifications(prev => pageNum === 0 ? response.data : [...prev, ...response.data]);
      } catch (error) {
         console.error("Failed to fetch notifications", error);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchNotifications(0);
   }, []);

   const handleMarkAsRead = async (id: string) => {
      setNotifications(notifs => notifs.map(n => n.id === id ? { ...n, leido: true } : n));
      try {
         await api.put(`/notificaciones/${id}/marcar`, { leido: true });
      } catch (error) {
         // Revertir en caso de error
         setNotifications(notifs => notifs.map(n => n.id === id ? { ...n, leido: false } : n));
      }
   };

   return (
      <div className="space-y-8 max-w-4xl mx-auto">
         <div>
            <h1 className="text-3xl font-bold">Notificaciones</h1>
            <p className="text-muted-foreground">
               Historial de todas tus alertas y notificaciones del sistema.
            </p>
         </div>
         <Card>
            <CardHeader>
               <CardTitle>Bandeja de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {notifications.map(notif => (
                  <div key={notif.id} className={cn("flex items-start gap-4 p-4 border rounded-lg", !notif.leido && "bg-accent")}>
                     <div className="flex-shrink-0 pt-1">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                     </div>
                     <div className="flex-grow">
                        <p className="text-sm font-medium">{notif.mensaje}</p>
                        <p className="text-xs text-muted-foreground">
                           {format(new Date(notif.created_at), "PPP 'a las' p", { locale: es })}
                        </p>
                     </div>
                     {!notif.leido && (
                        <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(notif.id)}>
                           <Check className="h-4 w-4 mr-1" /> Marcar como leída
                        </Button>
                     )}
                  </div>
               ))}
               {isLoading && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            </CardContent>
            <CardFooter>
               <Button onClick={() => setPage(p => p + 1)} disabled={isLoading} className="w-full">
                  Cargar más
               </Button>
            </CardFooter>
         </Card>
      </div>
   );
}
