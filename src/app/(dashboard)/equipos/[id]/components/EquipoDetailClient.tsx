"use client"

import {
   EquipoRead, Mantenimiento, Documentacion, Movimiento,
   TipoMantenimiento, TipoDocumento, EquipoSimple, ComponenteInfo, PadreInfo, LicenciaSoftware, Proveedor
} from "@/types/api";
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EquipoDetailTab } from "@/components/features/equipos/EquipoDetailTab";
import { EquipoComponentesTab } from "@/components/features/equipos/EquipoComponentesTab";
import { EquipoMantenimientoTab } from "@/components/features/mantenimientos/EquipoMantenimientoTab";
import { EquipoDocumentacionTab } from "@/components/features/documentos/EquipoDocumentacionTab";
import { EquipoHistorialTab } from "@/components/features/movimientos/EquipoHistorialTab";
import { EquipoLicenciasTab } from "@/components/features/licencias/EquipoLicenciasTab";

interface EquipoDetailClientProps {
   equipo: EquipoRead;
   componentes: ComponenteInfo[];
   padres: PadreInfo[];
   mantenimientos: Mantenimiento[];
   documentos: Documentacion[];
   movimientos: Movimiento[];
   licencias: LicenciaSoftware[];
   equiposDisponibles: EquipoSimple[];
   tiposMantenimiento: TipoMantenimiento[];
   tiposDocumento: TipoDocumento[];
   proveedores: Proveedor[];
}

export function EquipoDetailClient({
   equipo,
   componentes,
   padres,
   mantenimientos,
   documentos,
   movimientos,
   licencias,
   equiposDisponibles,
   tiposMantenimiento,
   tiposDocumento,
   proveedores
}: EquipoDetailClientProps) {

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-3xl font-bold">{equipo.nombre}</h1>
            <div className="flex items-center gap-2 mt-2">
               <p className="text-muted-foreground">S/N: {equipo.numero_serie}</p>
               <Badge style={{ backgroundColor: equipo.estado?.color_hex || '#cccccc' }} className="border-none text-primary-foreground">
                  {equipo.estado?.nombre || "N/A"}
               </Badge>
            </div>
         </div>

         <Tabs defaultValue="detalles" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
               <TabsTrigger value="detalles">Detalles</TabsTrigger>
               <TabsTrigger value="componentes">Componentes</TabsTrigger>
               <TabsTrigger value="padres">Parte De</TabsTrigger>
               <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
               <TabsTrigger value="documentacion">Documentación</TabsTrigger>
               <TabsTrigger value="licencias">Licencias</TabsTrigger>
               <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="detalles"><EquipoDetailTab equipo={equipo} /></TabsContent>
            <TabsContent value="componentes"><EquipoComponentesTab equipoId={equipo.id} componentes={componentes} equiposDisponibles={equiposDisponibles.filter(e => e.id !== equipo.id)} /></TabsContent>

            <TabsContent value="padres">
               <Card className="mt-4">
                  <CardHeader><CardTitle>{equipo.nombre} es Componente De</CardTitle></CardHeader>
                  <CardContent>
                     {padres.length > 0 ? (
                        <ul className="space-y-2">
                           {padres.map(p => (
                              <li key={p.id} className="flex justify-between items-center p-2 rounded-md border">
                                 <div>
                                    <p className="font-semibold">{p.padre.nombre}</p>
                                    <p className="text-sm text-muted-foreground">{p.padre.numero_serie}</p>
                                 </div>
                                 <Badge variant="secondary">{p.tipo_relacion}</Badge>
                              </li>
                           ))}
                        </ul>
                     ) : <p className="text-sm text-muted-foreground">Este equipo no es componente de ningún otro activo.</p>}
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="mantenimiento">
               <EquipoMantenimientoTab
                  equipoId={equipo.id}
                  mantenimientos={mantenimientos}
                  tiposMantenimiento={tiposMantenimiento}
                  proveedores={proveedores}
               />
            </TabsContent>
            <TabsContent value="documentacion"><EquipoDocumentacionTab equipoId={equipo.id} documentos={documentos} tiposDocumento={tiposDocumento} /></TabsContent>

            <TabsContent value="licencias">
               <Card className="mt-4">
                  <CardHeader><CardTitle>Licencias Asignadas</CardTitle></CardHeader>
                  <CardContent>
                     <EquipoLicenciasTab licenciasAsignadas={licencias} />
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="historial">
               <Card className="mt-4">
                  <CardHeader><CardTitle>Historial de Movimientos</CardTitle></CardHeader>
                  <CardContent>
                     <EquipoHistorialTab movimientos={movimientos} />
                  </CardContent>
               </Card>
            </TabsContent>
         </Tabs>
      </div>
   );
}
