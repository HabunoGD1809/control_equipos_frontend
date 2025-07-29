"use client"

import {
   EquipoRead, Mantenimiento, Documentacion, Movimiento,
   TipoMantenimiento, TipoDocumento, EquipoSimple
} from "@/types/api";
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { EquipoDetailTab } from "@/components/features/equipos/EquipoDetailTab";
import { EquipoComponentesTab } from "@/components/features/equipos/EquipoComponentesTab";
import { EquipoMantenimientoTab } from "@/components/features/mantenimientos/EquipoMantenimientoTab";
import { EquipoDocumentacionTab } from "@/components/features/documentos/EquipoDocumentacionTab";
import { EquipoHistorialTab } from "@/components/features/movimientos/EquipoHistorialTab";

interface ComponenteData {
   id: string;
   componente: EquipoSimple;
   cantidad: number;
   tipo_relacion: string;
}

interface EquipoDetailClientProps {
   equipo: EquipoRead;
   componentes: ComponenteData[];
   mantenimientos: Mantenimiento[];
   documentos: Documentacion[];
   movimientos: Movimiento[];
   equiposDisponibles: EquipoSimple[];
   tiposMantenimiento: TipoMantenimiento[];
   tiposDocumento: TipoDocumento[];
}

export function EquipoDetailClient({
   equipo,
   componentes,
   mantenimientos,
   documentos,
   movimientos,
   equiposDisponibles,
   tiposMantenimiento,
   tiposDocumento
}: EquipoDetailClientProps) {

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-3xl font-bold">{equipo.nombre}</h1>
            <div className="flex items-center gap-2 mt-2">
               <p className="text-muted-foreground">{equipo.numero_serie}</p>
               <Badge style={{ backgroundColor: equipo.estado?.color_hex || '#cccccc', color: '#ffffff' }} className="text-white border-none">
                  {equipo.estado?.nombre || "N/A"}
               </Badge>
            </div>
         </div>

         <Tabs defaultValue="detalles" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
               <TabsTrigger value="detalles">Detalles</TabsTrigger>
               <TabsTrigger value="componentes">Componentes</TabsTrigger>
               <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
               <TabsTrigger value="documentacion">Documentación</TabsTrigger>
               <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="detalles">
               <EquipoDetailTab equipo={equipo} />
            </TabsContent>
            <TabsContent value="componentes">
               <EquipoComponentesTab
                  equipoId={equipo.id}
                  componentes={componentes}
                  equiposDisponibles={equiposDisponibles.filter(e => e.id !== equipo.id)}
               />
            </TabsContent>
            <TabsContent value="mantenimiento">
               <EquipoMantenimientoTab
                  equipoId={equipo.id}
                  mantenimientos={mantenimientos}
                  tiposMantenimiento={tiposMantenimiento}
               />
            </TabsContent>
            <TabsContent value="documentacion">
               <EquipoDocumentacionTab
                  equipoId={equipo.id}
                  documentos={documentos}
                  tiposDocumento={tiposDocumento}
               />
            </TabsContent>
            <TabsContent value="historial">
               <EquipoHistorialTab movimientos={movimientos} />
            </TabsContent>
         </Tabs>
      </div>
   );
}
