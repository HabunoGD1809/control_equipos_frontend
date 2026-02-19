"use client";

import { useEffect, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
   History,
   ArrowRight,
   PlusCircle,
   Trash2,
   Edit,
   Loader2,
   AlertCircle,
} from "lucide-react";

import { auditService } from "@/app/services/auditService";
import type { AuditLog } from "@/types/api";
import { Badge } from "@/components/ui/Badge";

interface AuditTimelineProps {
   tableName: string;
   entityId: string;
}

// Normaliza: AuditLog[] | {items: AuditLog[]} | unknown => AuditLog[]
function unwrapArray<T>(data: unknown): T[] {
   if (Array.isArray(data)) return data as T[];
   if (data && typeof data === "object" && "items" in (data as any)) {
      const items = (data as any).items;
      return Array.isArray(items) ? (items as T[]) : [];
   }
   return [];
}

// Función auxiliar para formatear valores brutos
const formatAuditValue = (value: any): string => {
   if (value === null || value === undefined) return "N/A";
   if (typeof value === "boolean") return value ? "Sí" : "No";

   // Detección básica de fechas ISO
   if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = parseISO(value);
      if (isValid(date)) {
         return format(date, "PP p", { locale: es });
      }
   }
   return String(value);
};

export function AuditTimeline({ tableName, entityId }: AuditTimelineProps) {
   const [logs, setLogs] = useState<AuditLog[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      let alive = true;

      const fetchLogs = async () => {
         if (!entityId) return;

         try {
            setLoading(true);
            setError(null);

            // Puede venir AuditLog[] o { items: AuditLog[] }
            const raw = await auditService.getByEntity(tableName, entityId);
            if (!alive) return;

            const normalized = unwrapArray<AuditLog>(raw as unknown);
            setLogs(normalized);
         } catch (err) {
            console.error("Error fetching audit logs:", err);
            if (!alive) return;
            setError("No se pudo cargar el historial. Intente más tarde.");
            setLogs([]);
         } finally {
            if (alive) setLoading(false);
         }
      };

      fetchLogs();
      return () => {
         alive = false;
      };
   }, [tableName, entityId]);

   if (loading) {
      return (
         <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </div>
      );
   }

   if (error) {
      return (
         <div className="flex flex-col items-center justify-center py-8 text-destructive/80 bg-destructive/10 rounded-md">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>{error}</p>
         </div>
      );
   }

   if (!Array.isArray(logs) || logs.length === 0) {
      return (
         <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No hay historial de cambios registrado para este ítem.</p>
         </div>
      );
   }

   return (
      <div className="h-125 overflow-y-auto pr-4 space-y-6 pl-2">
         {logs.map((log) => (
            <AuditLogItem key={log.id} log={log} />
         ))}
      </div>
   );
}

function AuditLogItem({ log }: { log: AuditLog }) {
   const isCreate = log.operation === "INSERT";
   const isDelete = log.operation === "DELETE";
   const isUpdate = log.operation === "UPDATE";

   return (
      <div className="flex gap-4 relative">
         {/* Línea conectora */}
         <div className="absolute left-4.75 top-8 -bottom-6 w-0.5 bg-muted-foreground/20 last:hidden" />

         <div className="mt-1 relative z-10">
            <div
               className={`p-2 rounded-full border shadow-sm ${isCreate
                     ? "bg-green-100 text-green-700 border-green-200"
                     : isDelete
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}
            >
               {isCreate && <PlusCircle className="h-4 w-4" />}
               {isDelete && <Trash2 className="h-4 w-4" />}
               {isUpdate && <Edit className="h-4 w-4" />}
            </div>
         </div>

         <div className="flex-1 pb-6 border-b border-border/40 last:border-0">
            <div className="flex justify-between items-start mb-2">
               <div>
                  <p className="font-semibold text-sm text-foreground">
                     {log.username || "Sistema"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                     {isCreate
                        ? "Creó el registro original"
                        : isDelete
                           ? "Eliminó este registro"
                           : "Modificó la información"}
                  </p>
               </div>
               <BadgeVariant operation={log.operation} timestamp={log.audit_timestamp} />
            </div>

            {isUpdate && log.old_data && log.new_data && (
               <div className="mt-3 bg-muted/30 rounded-lg p-3 space-y-2 border">
                  {Object.keys(log.new_data).map((key) => {
                     if (["updated_at", "texto_busqueda", "id", "created_at"].includes(key))
                        return null;

                     const oldVal = (log.old_data as any)[key];
                     const newVal = (log.new_data as any)[key];

                     if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                        return (
                           <div
                              key={key}
                              className="text-sm grid grid-cols-[1fr,auto,1fr] gap-3 items-center py-1 border-b border-border/50 last:border-0"
                           >
                              <div className="flex flex-col overflow-hidden">
                                 <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">
                                    {key.replace(/_/g, " ")}
                                 </span>
                                 <span
                                    className="font-mono text-xs text-red-600/80 line-through truncate"
                                    title={String(oldVal)}
                                 >
                                    {formatAuditValue(oldVal)}
                                 </span>
                              </div>

                              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />

                              <div className="font-medium text-xs text-blue-700 wrap-break-word">
                                 {formatAuditValue(newVal)}
                              </div>
                           </div>
                        );
                     }
                     return null;
                  })}
               </div>
            )}
         </div>
      </div>
   );
}

const BadgeVariant = ({
   operation,
   timestamp,
}: {
   operation: string;
   timestamp: string;
}) => {
   const dateStr = format(new Date(timestamp), "dd MMM, HH:mm", { locale: es });

   // si quieres, aquí puedes renderizar Badge también
   return (
      <div className="text-right">
         <span className="text-xs font-mono text-muted-foreground">{dateStr}</span>
      </div>
   );
};
