"use client"

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Mantenimiento } from "@/types/api";
import { Button } from "@/components/ui/Button";

interface ProximosMantenimientosListProps {
   mantenimientos: Mantenimiento[];
}

export function ProximosMantenimientosList({ mantenimientos }: ProximosMantenimientosListProps) {
   const router = useRouter();

   if (!mantenimientos || mantenimientos.length === 0) {
      return <p className="text-sm text-muted-foreground italic">No hay mantenimientos programados próximamente.</p>;
   }

   return (
      <div className="space-y-4">
         {mantenimientos.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                     {m.equipo.nombre}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                     {m.tipo_mantenimiento.nombre}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-sm font-medium">
                     {m.fecha_programada ? format(new Date(m.fecha_programada), "P", { locale: es }) : 'N/A'}
                  </p>
                  <Button
                     variant="link"
                     size="sm"
                     className="h-auto p-0 text-xs"
                     onClick={() => router.push(`/equipos/${m.equipo_id}`)}
                  >
                     Ver Equipo
                  </Button>
               </div>
            </div>
         ))}
      </div>
   );
}
