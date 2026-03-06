import { CalendarDays, CreditCard, MapPin, Tag, Building2, Hash, Info, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import type { EquipoRead } from "@/types/api";

interface EquipoDetailTabProps {
   equipo: EquipoRead;
}

export function EquipoDetailTab({ equipo }: EquipoDetailTabProps) {

   const formatCurrency = (amount?: string | number | null) => {
      if (amount === null || amount === undefined || amount === "") return "No registrado";
      return new Intl.NumberFormat("es-DO", {
         style: "currency",
         currency: "DOP",
      }).format(Number(amount));
   };

   const formatDate = (dateString?: string | null) => {
      if (!dateString) return "No registrada";
      return format(new Date(dateString), "PPP", { locale: es });
   };

   const estadoNombre = equipo.estado?.nombre || "Desconocido";
   const estadoMetadatos = equipo.estado as Record<string, any> | undefined | null;

   const permiteMovimientos = estadoMetadatos?.permite_movimientos ?? ["Disponible", "En Uso"].includes(estadoNombre);
   const requiereAutorizacion = estadoMetadatos?.requiere_autorizacion ?? ["Averiado", "En Cuarentena", "Reservado", "Extraviado", "Dado de Baja"].includes(estadoNombre);
   const movimientosBloqueados = !permiteMovimientos;

   return (
      <div className="space-y-6 animate-in fade-in duration-300">

         {/* 🚨 ALERTA DE RESTRICCIÓN DE NEGOCIO 🚨 */}
         {movimientosBloqueados && (
            <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/30 shadow-sm">
               <ShieldAlert className="h-5 w-5" />
               <AlertTitle className="font-bold tracking-wide uppercase text-xs mb-1">Movimientos Bloqueados por el Sistema</AlertTitle>
               <AlertDescription className="text-sm">
                  Este equipo se encuentra en estado <strong>&quot;{estadoNombre}&quot;</strong>.
                  Por reglas de negocio dictadas por el sistema, no es posible registrar traslados ni asignaciones hasta que cambie a un estado que permita movimientos.
               </AlertDescription>
            </Alert>
         )}

         {/* ── Encabezado de Métricas Rápidas ── */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-muted">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estado Actual</CardTitle>
                  <Tag className="h-4 w-4 text-primary" />
               </CardHeader>
               <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                     <Badge
                        variant="outline"
                        style={{
                           borderColor: equipo.estado?.color_hex || "#ccc",
                           backgroundColor: `${equipo.estado?.color_hex}15` || "transparent",
                           color: equipo.estado?.color_hex || "inherit"
                        }}
                        className="text-sm font-bold tracking-wide shadow-sm"
                     >
                        {estadoNombre}
                     </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                     {permiteMovimientos ? "✓ Permite traslados" : "✕ Movimientos bloqueados"}
                     {requiereAutorizacion && " • Requiere Auth."}
                  </p>
               </CardContent>
            </Card>

            <Card className="shadow-sm border-muted">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ubicación</CardTitle>
                  <MapPin className="h-4 w-4 text-primary" />
               </CardHeader>
               <CardContent className="pt-4">
                  <div className="text-lg font-bold text-foreground truncate" title={equipo.ubicacion_actual || "N/A"}>
                     {equipo.ubicacion_actual || "Sin ubicación"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Locación actual registrada</p>
               </CardContent>
            </Card>

            <Card className="shadow-sm border-muted">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Valor Libro</CardTitle>
                  <CreditCard className="h-4 w-4 text-primary" />
               </CardHeader>
               <CardContent className="pt-4">
                  <div className="text-lg font-bold text-foreground">{formatCurrency(equipo.valor_adquisicion)}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Costo de adquisición</p>
               </CardContent>
            </Card>

            <Card className="shadow-sm border-muted">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Serie / Service Tag</CardTitle>
                  <Hash className="h-4 w-4 text-primary" />
               </CardHeader>
               <CardContent className="pt-4">
                  <div className="text-lg font-bold font-mono text-foreground uppercase">{equipo.numero_serie}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Identificador único global</p>
               </CardContent>
            </Card>
         </div>

         {/* ── Detalles Técnicos y Financieros ── */}
         <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
               <CardHeader className="border-b bg-muted/10 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                     <Info className="h-5 w-5 text-primary" />
                     Ficha Técnica
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                     <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marca</span>
                        <p className="font-medium text-foreground">{equipo.marca || "--"}</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modelo</span>
                        <p className="font-medium text-foreground">{equipo.modelo || "--"}</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código Interno</span>
                        <p className="font-medium text-foreground font-mono">{equipo.codigo_interno || "--"}</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Centro de Costo</span>
                        <p className="font-medium text-foreground">{equipo.centro_costo || "--"}</p>
                     </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 bg-muted/20 p-4 rounded-lg border">
                     <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas / Observaciones</span>
                     <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {equipo.notas || <span className="italic opacity-60">Sin observaciones adicionales.</span>}
                     </p>
                  </div>
               </CardContent>
            </Card>

            <Card className="shadow-sm">
               <CardHeader className="border-b bg-muted/10 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                     <CalendarDays className="h-5 w-5 text-primary" />
                     Ciclo de Vida y Garantía
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                        <span className="text-sm font-medium text-muted-foreground">Fecha Adquisición</span>
                        <span className="font-semibold text-foreground">{formatDate(equipo.fecha_adquisicion)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                        <span className="text-sm font-medium text-muted-foreground">Puesta en Marcha</span>
                        <span className="font-semibold text-foreground">{formatDate(equipo.fecha_puesta_marcha)}</span>
                     </div>

                     <div className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${equipo.fecha_garantia_expiracion && new Date(equipo.fecha_garantia_expiracion) < new Date() ? 'bg-destructive/5 border-destructive/20' : 'bg-green-500/5 border-green-500/20 dark:bg-green-500/10'}`}>
                        <span className="text-sm font-medium text-muted-foreground">Vencimiento Garantía</span>
                        <span className={`font-semibold flex items-center gap-2 ${equipo.fecha_garantia_expiracion && new Date(equipo.fecha_garantia_expiracion) < new Date() ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                           {formatDate(equipo.fecha_garantia_expiracion)}
                           {equipo.fecha_garantia_expiracion && new Date(equipo.fecha_garantia_expiracion) < new Date() && (
                              <Badge variant="destructive" className="uppercase text-[10px] px-1.5 py-0">Expirada</Badge>
                           )}
                        </span>
                     </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proveedor Asociado</span>
                     </div>
                     {equipo.proveedor ? (
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-center justify-between">
                           <div>
                              <p className="font-bold text-primary">{equipo.proveedor.nombre}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Gestor de hardware/servicios</p>
                           </div>
                        </div>
                     ) : (
                        <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-center">
                           <p className="text-sm text-muted-foreground italic">Ningún proveedor asignado al equipo.</p>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
