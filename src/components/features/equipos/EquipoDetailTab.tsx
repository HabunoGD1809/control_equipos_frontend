import {
   CalendarDays,
   CreditCard,
   MapPin,
   Tag,
   Building2,
   Hash,
   Info
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import type { EquipoRead } from "@/types/api";

interface EquipoDetailTabProps {
   equipo: EquipoRead;
}

// CORRECCIÓN: 'export function' para permitir import { EquipoDetailTab }
export function EquipoDetailTab({ equipo }: EquipoDetailTabProps) {

   const formatCurrency = (amount?: string | number | null) => {
      if (amount === null || amount === undefined) return "N/A";
      return new Intl.NumberFormat("es-DO", {
         style: "currency",
         currency: "DOP",
      }).format(Number(amount));
   };

   const formatDate = (dateString?: string | null) => {
      if (!dateString) return "No registrada";
      return format(new Date(dateString), "PPP", { locale: es });
   };

   return (
      <div className="space-y-6">
         {/* Encabezado Rápido */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estado Actual</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="flex items-center gap-2">
                     <Badge
                        variant="outline"
                        style={{
                           borderColor: equipo.estado?.color_hex || "#ccc",
                           backgroundColor: `${equipo.estado?.color_hex}10` || "transparent",
                           color: equipo.estado?.color_hex || "inherit"
                        }}
                        className="text-sm font-bold"
                     >
                        {equipo.estado?.nombre || "Desconocido"}
                     </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     {equipo.estado?.nombre === "Disponible"
                        ? "Listo para asignación"
                        : "Requiere autorización para mover"}
                  </p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ubicación</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-lg font-bold truncate" title={equipo.ubicacion_actual || "N/A"}>
                     {equipo.ubicacion_actual || "Sin ubicación"}
                  </div>
                  <p className="text-xs text-muted-foreground">Última actualización</p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Libro</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-lg font-bold">{formatCurrency(equipo.valor_adquisicion)}</div>
                  <p className="text-xs text-muted-foreground">Costo de adquisición</p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Serie</CardTitle>
                  <Hash className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-lg font-bold font-mono">{equipo.numero_serie}</div>
                  <p className="text-xs text-muted-foreground">ID Único Global</p>
               </CardContent>
            </Card>
         </div>

         <div className="grid gap-6 md:grid-cols-2">
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Info className="h-5 w-5" />
                     Información Técnica
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <span className="text-sm font-medium text-muted-foreground">Marca</span>
                        <p>{equipo.marca || "N/A"}</p>
                     </div>
                     <div>
                        <span className="text-sm font-medium text-muted-foreground">Modelo</span>
                        <p>{equipo.modelo || "N/A"}</p>
                     </div>
                     <div>
                        <span className="text-sm font-medium text-muted-foreground">Código Interno</span>
                        <p>{equipo.codigo_interno || "N/A"}</p>
                     </div>
                     <div>
                        <span className="text-sm font-medium text-muted-foreground">Centro de Costo</span>
                        <p>{equipo.centro_costo || "N/A"}</p>
                     </div>
                  </div>
                  <Separator />
                  <div>
                     <span className="text-sm font-medium text-muted-foreground">Notas / Observaciones</span>
                     <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                        {equipo.notas || "Sin observaciones adicionales."}
                     </p>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <CalendarDays className="h-5 w-5" />
                     Ciclo de Vida y Garantía
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Fecha Adquisición:</span>
                        <span className="font-medium">{formatDate(equipo.fecha_adquisicion)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Puesta en Marcha:</span>
                        <span className="font-medium">{formatDate(equipo.fecha_puesta_marcha)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Vencimiento Garantía:</span>
                        <span className={`font-medium ${equipo.fecha_garantia_expiracion && new Date(equipo.fecha_garantia_expiracion) < new Date()
                           ? "text-destructive"
                           : "text-green-600"
                           }`}>
                           {formatDate(equipo.fecha_garantia_expiracion)}
                           {equipo.fecha_garantia_expiracion && new Date(equipo.fecha_garantia_expiracion) < new Date() && " (Expirada)"}
                        </span>
                     </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Proveedor</span>
                     </div>
                     {equipo.proveedor ? (
                        <div className="bg-muted p-3 rounded-md text-sm">
                           <p className="font-bold">{equipo.proveedor.nombre}</p>
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground italic">No asignado</p>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
