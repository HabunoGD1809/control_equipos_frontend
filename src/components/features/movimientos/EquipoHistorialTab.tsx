"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, Laptop, ArrowRightLeft, Wrench, FileText, Loader2, AlertCircle, History } from "lucide-react";

import { TimelineEvent } from "@/types/api";
import { equiposService } from "@/app/services/equiposService";

interface EquipoHistorialTabProps {
   equipoId: string;
}

const IconMap: Record<string, React.ReactNode> = {
   "activity": <Activity className="h-4 w-4" />,
   "laptop": <Laptop className="h-4 w-4" />,
   "edit": <History className="h-4 w-4" />,
   "arrow-right-left": <ArrowRightLeft className="h-4 w-4" />,
   "wrench": <Wrench className="h-4 w-4" />,
   "file-text": <FileText className="h-4 w-4" />,
};

export function EquipoHistorialTab({ equipoId }: EquipoHistorialTabProps) {
   const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      let alive = true;

      const fetchTimeline = async () => {
         try {
            setLoading(true);
            const data = await equiposService.getTimeline(equipoId);
            if (alive) setTimeline(data);
         } catch (err: any) {
            console.error("Error cargando timeline:", err);
            if (alive) setError("No se pudo cargar la historia del equipo.");
         } finally {
            if (alive) setLoading(false);
         }
      };

      fetchTimeline();
      return () => { alive = false; };
   }, [equipoId]);

   if (loading) {
      return (
         <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </div>
      );
   }

   if (error) {
      return (
         <div className="flex flex-col items-center justify-center py-8 text-destructive/80 bg-destructive/10 rounded-md mt-4">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>{error}</p>
         </div>
      );
   }

   if (timeline.length === 0) {
      return (
         <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg mt-4">
            <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No hay eventos registrados en la vida de este equipo.</p>
         </div>
      );
   }

   return (
      <div className="mt-6 pl-2 pr-4 space-y-6">
         {timeline.map((event, idx) => (
            <div key={idx} className="flex gap-4 relative">
               {/* Línea conectora vertical */}
               <div className="absolute left-4.5 top-8 -bottom-6 w-px bg-border last:hidden" />

               <div className="mt-1 relative z-10 shrink-0">
                  <div className="p-2 rounded-full bg-accent text-accent-foreground border border-border shadow-sm">
                     {IconMap[event.icono] || <Activity className="h-4 w-4" />}
                  </div>
               </div>

               <div className="flex-1 pb-6">
                  <div className="flex justify-between items-start mb-1.5">
                     <div>
                        <p className="font-semibold text-sm text-foreground">
                           {event.titulo}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-2">
                           <span className="font-medium text-primary/80">{event.usuario || "Sistema"}</span>
                           <span>•</span>
                           <span className="uppercase text-[10px] tracking-wider font-bold">{event.modulo}</span>
                        </div>
                     </div>
                     <div className="text-right shrink-0 ml-4">
                        <span className="text-xs font-mono text-muted-foreground">
                           {format(new Date(event.fecha), "dd MMM, HH:mm", { locale: es })}
                        </span>
                     </div>
                  </div>

                  {/* Detalles de la acción */}
                  {event.detalles.length > 0 && (
                     <div className="mt-2 bg-muted/30 rounded-lg p-3 border border-border/50 text-sm">
                        <ul className="space-y-1 text-muted-foreground">
                           {event.detalles.map((detalle, dIdx) => (
                              <li key={dIdx} className="flex items-start">
                                 <span className="mr-2 text-primary/50">•</span>
                                 <span
                                    className="wrap-break-word"
                                    dangerouslySetInnerHTML={{ __html: detalle }}
                                 />
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}
               </div>
            </div>
         ))}
      </div>
   );
}
