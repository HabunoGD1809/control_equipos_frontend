"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
   History,
   PlusCircle,
   Trash2,
   Edit,
   ShieldAlert,
   User,
   Box,
   FileText
} from "lucide-react";
import { AuditLog } from "@/types/api";

interface RecentActivityListProps {
   logs: AuditLog[];
}

export function RecentActivityList({ logs }: RecentActivityListProps) {
   if (!logs || logs.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <History className="h-10 w-10 mb-2 opacity-20" />
            <p>No hay actividad reciente registrada.</p>
         </div>
      );
   }

   const getIcon = (operation: string) => {
      switch (operation) {
         case "INSERT": return <PlusCircle className="h-4 w-4 text-green-500" />;
         case "DELETE": return <Trash2 className="h-4 w-4 text-red-500" />;
         case "UPDATE": return <Edit className="h-4 w-4 text-blue-500" />;
         default: return <ShieldAlert className="h-4 w-4 text-gray-500" />;
      }
   };

   const formatTableName = (tableName: string) => {
      return tableName.replace(/_/g, " ").replace("control_equipos.", "");
   };

   return (
      <div className="space-y-6">
         {logs.map((log, index) => (
            <div key={log.id} className="flex gap-4 relative">
               {/* Línea conectora */}
               {index !== logs.length - 1 && (
                  <div className="absolute left-[19px] top-8 bottom-[-24px] w-px bg-border" />
               )}

               <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border">
                  {getIcon(log.operation)}
               </div>

               <div className="flex-1 space-y-1 py-1">
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-medium leading-none flex items-center gap-2">
                        <span className="capitalize">{log.username || "Sistema"}</span>
                        <span className="text-muted-foreground font-normal text-xs">
                           {log.operation === "INSERT" ? "creó un registro en" :
                              log.operation === "DELETE" ? "eliminó un registro de" :
                                 "actualizó"}
                        </span>
                        <span className="font-semibold text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
                           {formatTableName(log.table_name)}
                        </span>
                     </p>
                     <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.audit_timestamp), "PP p", { locale: es })}
                     </span>
                  </div>

                  {/* Detalles rápidos del cambio (si es update) */}
                  {log.operation === "UPDATE" && log.new_data && (
                     <div className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded border border-border/50">
                        Se modificaron {Object.keys(log.new_data).length - 1} campos.
                     </div>
                  )}
               </div>
            </div>
         ))}
      </div>
   );
}
