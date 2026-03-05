"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
   History,
   ArrowRightLeft,
   LogOut,
   LogIn,
   RefreshCw,
   Box
} from "lucide-react";
import { MovimientoReciente } from "@/types/api";

interface RecentActivityListProps {
   actividades: MovimientoReciente[];
}

export function RecentActivityList({ actividades }: RecentActivityListProps) {
   if (!actividades || actividades.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-75 text-muted-foreground">
            <History className="h-10 w-10 mb-2 opacity-20" />
            <p>No hay movimientos recientes registrados.</p>
         </div>
      );
   }

   const getIcon = (tipo: string) => {
      if (tipo.includes("Salida")) return <LogOut className="h-4 w-4 text-orange-500" />;
      if (tipo.includes("Entrada")) return <LogIn className="h-4 w-4 text-green-500" />;
      if (tipo.includes("Asignacion")) return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      if (tipo.includes("Transferencia")) return <RefreshCw className="h-4 w-4 text-purple-500" />;
      return <Box className="h-4 w-4 text-gray-500" />;
   };

   return (
      <div className="space-y-6">
         {actividades.map((movimiento, index) => (
            <div key={movimiento.id} className="flex gap-4 relative">
               {/* Línea conectora */}
               {index !== actividades.length - 1 && (
                  <div className="absolute left-4.75 top-8 -bottom-6 w-px bg-border" />
               )}

               <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border shadow-sm">
                  {getIcon(movimiento.tipo_movimiento)}
               </div>

               <div className="flex-1 space-y-1 py-1">
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-medium leading-none flex flex-col gap-1">
                        <span className="font-semibold">{movimiento.equipo_nombre}</span>
                        <span className="text-muted-foreground font-normal text-xs">
                           {movimiento.tipo_movimiento}
                        </span>
                     </p>
                     <span className="text-xs text-muted-foreground whitespace-nowrap text-right">
                        {format(new Date(movimiento.fecha_hora), "PP", { locale: es })}
                        <br />
                        {format(new Date(movimiento.fecha_hora), "p", { locale: es })}
                     </span>
                  </div>

                  <div className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded border border-border/50">
                     Registrado por: <span className="font-medium capitalize">{movimiento.usuario_nombre || "Sistema"}</span>
                  </div>
               </div>
            </div>
         ))}
      </div>
   );
}
