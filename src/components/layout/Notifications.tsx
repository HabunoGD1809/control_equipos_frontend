"use client";

import { Bell, Check } from "lucide-react";
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
            qc.invalidateQueries({ queryKey: ["notificaciones", "latest"] }),
            qc.invalidateQueries({ queryKey: ["notificaciones", "unreadCount"] }),
         ]);
      },
   });

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
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                     {unreadCount}
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
                     onClick={() => markAllMutation.mutate()}
                     disabled={markAllMutation.isPending}
                  >
                     <Check className="h-4 w-4 mr-1" />
                     Marcar todas leídas
                  </Button>
               )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {notifications.length > 0 ? (
               notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1">
                     <p className="text-sm font-medium">{notif.mensaje}</p>
                     <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                        {isFetching ? " · actualizando..." : ""}
                     </p>
                  </DropdownMenuItem>
               ))
            ) : (
               <p className="p-4 text-sm text-center text-muted-foreground">No hay notificaciones nuevas.</p>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/notificaciones")} className="justify-center">
               Ver todas las notificaciones
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
