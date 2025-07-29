"use client"

import { Bell, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Notificacion } from "@/types/api"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function Notifications() {
   const [notifications, setNotifications] = useState<Notificacion[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const router = useRouter();

   const fetchNotifications = async () => {
      try {
         const [notifRes, countRes] = await Promise.all([
            api.get<Notificacion[]>('/notificaciones/?limit=5'),
            api.get<{ unread_count: number }>('/notificaciones/count/unread')
         ]);
         setNotifications(notifRes.data);
         setUnreadCount(countRes.data.unread_count);
      } catch (error) {
         console.error("Failed to fetch notifications", error);
      }
   };

   useEffect(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Actualiza cada minuto
      return () => clearInterval(interval);
   }, []);

   const handleMarkAllAsRead = async () => {
      try {
         await api.post('/notificaciones/marcar-todas-leidas');
         fetchNotifications();
      } catch (error) {
         console.error("Failed to mark all as read", error);
      }
   };

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
               <Bell className="h-[1.2rem] w-[1.2rem]" />
               {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                     {unreadCount}
                  </span>
               )}
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
               <span>Notificaciones</span>
               {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}><Check className="h-4 w-4 mr-1" />Marcar todas leídas</Button>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
               notifications.map(notif => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1">
                     <p className="text-sm font-medium">{notif.mensaje}</p>
                     <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                     </p>
                  </DropdownMenuItem>
               ))
            ) : (
               <p className="p-4 text-sm text-center text-muted-foreground">No hay notificaciones nuevas.</p>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/notificaciones')} className="justify-center">
               Ver todas las notificaciones
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   )
}
