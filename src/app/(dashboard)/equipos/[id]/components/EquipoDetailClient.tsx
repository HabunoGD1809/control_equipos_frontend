"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Edit, Trash2, Box, FileText, Activity, History, Share2, Loader2 } from "lucide-react";

import {
   EquipoRead,
   ComponenteInfo,
   PadreInfo,
   Movimiento,
   Mantenimiento,
   Documentacion,
   LicenciaSoftware,
   EquipoSimple,
   TipoMantenimiento,
   TipoDocumento,
   Proveedor
} from "@/types/api";

import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";

import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useHasPermission } from "@/hooks/useHasPermission";
import { equiposService } from "@/app/services/equiposService";
import { api } from "@/lib/http";

// Imports de Tabs
import { EquipoDetailTab } from "@/components/features/equipos/EquipoDetailTab";
import { EquipoComponentesTab } from "@/components/features/equipos/EquipoComponentesTab";
import { EquipoPadreTab } from "@/components/features/equipos/EquipoPadreTab";
import { EquipoHistorialTab } from "@/components/features/movimientos/EquipoHistorialTab";
import { EquipoMantenimientoTab } from "@/components/features/mantenimientos/EquipoMantenimientoTab";
import { EquipoDocumentacionTab } from "@/components/features/documentos/EquipoDocumentacionTab";
import { EquipoLicenciasTab } from "@/components/features/licencias/EquipoLicenciasTab";
import { AuditTimeline } from "@/components/features/auditoria/AuditTimeline";

interface EquipoDetailClientProps {
   equipo: EquipoRead;
   componentes: ComponenteInfo[];
   padres: PadreInfo[];
}

function unwrapClient<T>(data: any): T[] {
   if (!data) return [];
   if (Array.isArray(data)) return data;
   if (typeof data === "object" && "items" in data && Array.isArray(data.items)) return data.items;
   return [];
}

export const EquipoDetailClient: React.FC<EquipoDetailClientProps> = ({
   equipo,
   componentes,
   padres,
}) => {
   const router = useRouter();
   const canEdit = useHasPermission(['editar_equipos']);
   const canDelete = useHasPermission(['eliminar_equipos']);
   const canAudit = useHasPermission(['ver_auditoria']);

   const [activeTab, setActiveTab] = useState("detalles");
   const [isLoadingTab, setIsLoadingTab] = useState(false);

   const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
   const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
   const [documentos, setDocumentos] = useState<Documentacion[]>([]);
   const [licencias, setLicencias] = useState<LicenciaSoftware[]>([]);

   const [equiposDisponibles, setEquiposDisponibles] = useState<EquipoSimple[]>([]);
   const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([]);
   const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
   const [proveedores, setProveedores] = useState<Proveedor[]>([]);

   const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({
      detalles: true,
      componentes: true,
      jerarquia: true
   });

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => equiposService.delete(id),
      onSuccess: () => router.push("/equipos"),
      successMessage: "El equipo ha sido eliminado correctamente.",
   });

   useEffect(() => {
      const loadTabData = async () => {
         if (loadedTabs[activeTab]) return;

         setIsLoadingTab(true);
         try {
            // CORRECCIÓN: Quitamos las barras finales (/) para evitar 
            // discrepancias de ruta y errores 422 en la validación de query params de FastAPI.

            if (activeTab === "movimientos") {
               const res = await api.get<any>("/movimientos", {
                  params: { equipo_id: equipo.id, limit: 100 }
               });
               setMovimientos(unwrapClient(res));
            }
            else if (activeTab === "mantenimiento") {
               const [mtoRes, tiposMtoRes, provRes] = await Promise.all([
                  api.get<any>("/mantenimientos", { params: { equipo_id: equipo.id, limit: 100 } }),
                  api.get<any>("/catalogos/tipos-mantenimiento"),
                  api.get<any>("/proveedores", { params: { limit: 500 } })
               ]);
               setMantenimientos(unwrapClient(mtoRes));
               setTiposMantenimiento(unwrapClient(tiposMtoRes));
               setProveedores(unwrapClient(provRes));
            }
            else if (activeTab === "documentacion") {
               const [docsRes, tiposDocRes] = await Promise.all([
                  api.get<any>(`/documentacion/equipo/${equipo.id}`, { params: { limit: 100 } }),
                  api.get<any>("/catalogos/tipos-documento")
               ]);
               setDocumentos(unwrapClient(docsRes));
               setTiposDocumento(unwrapClient(tiposDocRes));
            }
            else if (activeTab === "licencias") {
               const res = await api.get<any>("/licencias/asignaciones", {
                  params: { equipo_id: equipo.id, limit: 100 }
               });
               const asignaciones = unwrapClient<{ licencia: LicenciaSoftware }>(res);
               setLicencias(asignaciones.map(a => a.licencia));
            }
            else if (activeTab === "componentes") {
               const res = await api.get<any>("/equipos", { params: { limit: 500 } });
               setEquiposDisponibles(unwrapClient(res));
            }

            setLoadedTabs(prev => ({ ...prev, [activeTab]: true }));
         } catch (error) {
            console.error("Error cargando datos de la pestaña:", error);
         } finally {
            setIsLoadingTab(false);
         }
      };

      loadTabData();
   }, [activeTab, equipo.id, loadedTabs]);

   return (
      <div className="space-y-6 animate-in fade-in duration-300">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-5 w-5" />
               </Button>
               <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                     {equipo.nombre}
                     <Badge variant="outline" className="ml-2 shadow-sm" style={{ borderColor: equipo.estado?.color_hex || '#ccc', color: equipo.estado?.color_hex || '#000' }}>
                        {equipo.estado?.nombre}
                     </Badge>
                  </h1>
                  <p className="text-muted-foreground text-sm">Serie: {equipo.numero_serie} | Código: {equipo.codigo_interno || 'N/A'}</p>
               </div>
            </div>

            <div className="flex gap-2">
               {canEdit && (
                  <Button variant="outline" className="shadow-sm" onClick={() => router.push(`/equipos/${equipo.id}/editar`)}>
                     <Edit className="mr-2 h-4 w-4" /> Editar
                  </Button>
               )}

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="secondary" className="shadow-sm">Acciones</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir Ficha
                     </DropdownMenuItem>
                     {canDelete && (
                        <DropdownMenuItem
                           className="text-destructive focus:text-destructive"
                           onClick={() => openAlert(equipo.id)}
                        >
                           <Trash2 className="mr-2 h-4 w-4" /> Eliminar Equipo
                        </DropdownMenuItem>
                     )}
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </div>

         {/* Tabs */}
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-8 h-auto shadow-sm">
               <TabsTrigger value="detalles">Detalles</TabsTrigger>
               <TabsTrigger value="componentes" className="gap-2"><Box className="h-4 w-4" /> <span className="hidden md:inline">Componentes</span></TabsTrigger>
               <TabsTrigger value="jerarquia" className="gap-2"><Share2 className="h-4 w-4" /> <span className="hidden md:inline">Jerarquía</span></TabsTrigger>
               <TabsTrigger value="movimientos" className="gap-2"><Activity className="h-4 w-4" /> <span className="hidden md:inline">Movimientos</span></TabsTrigger>
               <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
               <TabsTrigger value="documentacion" className="gap-2"><FileText className="h-4 w-4" /> <span className="hidden md:inline">Docs</span></TabsTrigger>
               <TabsTrigger value="licencias">Licencias</TabsTrigger>
               {canAudit && (
                  <TabsTrigger value="auditoria" className="gap-2"><History className="h-4 w-4" /> <span className="hidden md:inline">Auditoría</span></TabsTrigger>
               )}
            </TabsList>

            <div className="mt-6 relative min-h-50">
               {isLoadingTab && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
               )}

               <TabsContent value="detalles" className="mt-0 animate-in fade-in duration-300">
                  <EquipoDetailTab equipo={equipo} />
               </TabsContent>

               <TabsContent value="componentes" className="mt-0 animate-in fade-in duration-300">
                  <EquipoComponentesTab
                     equipoId={equipo.id}
                     componentes={componentes}
                     padres={padres}
                     equiposDisponibles={equiposDisponibles}
                     onRefresh={() => router.refresh()}
                  />
               </TabsContent>

               <TabsContent value="jerarquia" className="mt-0 animate-in fade-in duration-300">
                  <EquipoPadreTab equipoId={equipo.id} />
               </TabsContent>

               <TabsContent value="movimientos" className="mt-0 animate-in fade-in duration-300">
                  <EquipoHistorialTab movimientos={movimientos} />
               </TabsContent>

               <TabsContent value="mantenimiento" className="mt-0 animate-in fade-in duration-300">
                  <EquipoMantenimientoTab
                     equipoId={equipo.id}
                     mantenimientos={mantenimientos}
                     tiposMantenimiento={tiposMantenimiento}
                     proveedores={proveedores}
                  />
               </TabsContent>

               <TabsContent value="documentacion" className="mt-0 animate-in fade-in duration-300">
                  <EquipoDocumentacionTab
                     equipoId={equipo.id}
                     documentos={documentos}
                     tiposDocumento={tiposDocumento}
                  />
               </TabsContent>

               <TabsContent value="licencias" className="mt-0 animate-in fade-in duration-300">
                  <EquipoLicenciasTab
                     licenciasAsignadas={licencias}
                  />
               </TabsContent>

               {canAudit && (
                  <TabsContent value="auditoria" className="mt-0 animate-in fade-in duration-300">
                     <Card className="shadow-sm border">
                        <CardHeader className="bg-muted/20">
                           <CardTitle>Historial de Auditoría</CardTitle>
                           <CardDescription>Registro inmutable de cambios realizados a este registro.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                           <AuditTimeline tableName="equipos" entityId={equipo.id} />
                        </CardContent>
                     </Card>
                  </TabsContent>
               )}
            </div>
         </Tabs>

         <AlertDialog open={isAlertOpen} onOpenChange={(isOpen) => { if (!isOpen) closeAlert(); }}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no se puede deshacer. Esto eliminará permanentemente el equipo
                     <strong> {equipo.nombre}</strong> y desconectará sus relaciones.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel onClick={closeAlert}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={confirmDelete}
                     disabled={isDeleting}
                     className="bg-destructive hover:bg-destructive/90"
                  >
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
};
