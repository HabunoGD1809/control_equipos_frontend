"use client";

import { Bell, Check, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { notificacionesService } from "@/app/services/notificacionesService";
import { useSession } from "@/contexts/SessionProvider";
import { Notificacion } from "@/types/api";

export function Notifications() {
   const router = useRouter();
   const qc = useQueryClient();
   const { user } = useSession();
   const enabled = !!user;

   const { data: notifications = [], isFetching } = useQuery({
      queryKey: ["notificaciones", "latest"],
      queryFn: () => notificacionesService.getAll({ limit: 5 }),
      enabled,
      refetchInterval: 60_000,
      staleTime: 30_000,
   });

   const { data: unreadCount = 0 } = useQuery({
      queryKey: ["notificaciones", "unreadCount"],
      queryFn: () => notificacionesService.getUnreadCount(),
      enabled,
      refetchInterval: 60_000,
      staleTime: 30_000,
   });

   const markAllMutation = useMutation({
      mutationFn: () => notificacionesService.marcarTodasComoLeidas(),
      onSuccess: async () => {
         await Promise.all([
            qc.invalidateQueries({ queryKey: ["notificaciones"] }),
         ]);
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

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
               <Bell className="h-[1.2rem] w-[1.2rem]" />
               {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm">
                     {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
               )}
            </Button>
         </DropdownMenuTrigger>

         <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
               <span>Notificaciones</span>

               {unreadCount > 0 && (
                  <Button
                     variant="ghost"
                     size="sm"
                     className="text-xs text-muted-foreground hover:text-primary p-0 h-auto"
                     onClick={(e) => {
                        e.stopPropagation();
                        markAllMutation.mutate();
                     }}
                     disabled={markAllMutation.isPending}
                  >
                     <Check className="h-3 w-3 mr-1" />
                     Marcar todas leídas
                  </Button>
               )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {notifications.length > 0 ? (
               <div className="max-h-75 overflow-y-auto">
                  {notifications.map((notif) => {
                     const url = getUrlReferencia(notif);
                     return (
                        <DropdownMenuItem
                           key={notif.id}
                           className={`flex flex-col items-start gap-1 cursor-pointer border-b last:border-0 ${!notif.leido ? "bg-primary/5" : ""}`}
                           onClick={() => url ? router.push(url) : null}
                        >
                           <div className="flex justify-between w-full items-start">
                              <p className={`text-sm ${!notif.leido ? "font-semibold" : "font-medium"}`}>
                                 {notif.mensaje}
                              </p>
                              {url && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />}
                           </div>
                           <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                           </p>
                        </DropdownMenuItem>
                     );
                  })}
               </div>
            ) : (
               <p className="p-4 text-sm text-center text-muted-foreground">No hay notificaciones recientes.</p>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/notificaciones")} className="justify-center font-medium cursor-pointer">
               Ver historial completo
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
