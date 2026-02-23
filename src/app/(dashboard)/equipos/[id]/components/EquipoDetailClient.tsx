"use client";

import { useRouter } from "next/navigation";
import {
   ArrowLeft,
   Printer,
   Edit,
   Trash2,
   Box,
   FileText,
   Activity,
   History,
   Share2
} from "lucide-react";

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
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useHasPermission } from "@/hooks/useHasPermission";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";

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
   movimientos: Movimiento[];
   mantenimientos: Mantenimiento[];
   documentos: Documentacion[];
   licencias: LicenciaSoftware[];
   equiposDisponibles: EquipoSimple[];
   tiposMantenimiento: TipoMantenimiento[];
   tiposDocumento: TipoDocumento[];
   proveedores: Proveedor[];
}

export const EquipoDetailClient: React.FC<EquipoDetailClientProps> = ({
   equipo,
   componentes,
   padres,
   movimientos,
   mantenimientos,
   documentos,
   licencias,
   equiposDisponibles,
   tiposMantenimiento,
   tiposDocumento,
   proveedores
}) => {
   const router = useRouter();
   const canEdit = useHasPermission(['editar_equipos']);
   const canDelete = useHasPermission(['eliminar_equipos']);
   const canAudit = useHasPermission(['ver_auditoria']);

   const {
      isAlertOpen,
      isDeleting,
      openAlert,
      setIsAlertOpen,
      handleDelete
   } = useDeleteConfirmation("Equipo", () => router.push("/equipos"));

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-5 w-5" />
               </Button>
               <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                     {equipo.nombre}
                     <Badge variant="outline" className="ml-2" style={{ borderColor: equipo.estado?.color_hex || '#ccc', color: equipo.estado?.color_hex || '#000' }}>
                        {equipo.estado?.nombre}
                     </Badge>
                  </h1>
                  <p className="text-muted-foreground text-sm">Serie: {equipo.numero_serie} | Código: {equipo.codigo_interno || 'N/A'}</p>
               </div>
            </div>

            <div className="flex gap-2">
               {canEdit && (
                  <Button variant="outline" onClick={() => router.push(`/equipos/${equipo.id}/editar`)}>
                     <Edit className="mr-2 h-4 w-4" /> Editar
                  </Button>
               )}

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="secondary">Acciones</Button>
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
         <Tabs defaultValue="detalles" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-8 h-auto">
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

            <div className="mt-6">
               <TabsContent value="detalles">
                  <EquipoDetailTab equipo={equipo} />
               </TabsContent>

               <TabsContent value="componentes">
                  <EquipoComponentesTab
                     equipoId={equipo.id}
                     componentes={componentes}
                     padres={padres}
                     equiposDisponibles={equiposDisponibles}
                     onRefresh={() => router.refresh()}
                  />
               </TabsContent>

               <TabsContent value="jerarquia">
                  <EquipoPadreTab equipoId={equipo.id} />
               </TabsContent>

               <TabsContent value="movimientos">
                  <EquipoHistorialTab movimientos={movimientos} />
               </TabsContent>

               <TabsContent value="mantenimiento">
                  <EquipoMantenimientoTab
                     equipoId={equipo.id}
                     mantenimientos={mantenimientos}
                     tiposMantenimiento={tiposMantenimiento}
                     proveedores={proveedores}
                  />
               </TabsContent>

               <TabsContent value="documentacion">
                  <EquipoDocumentacionTab
                     equipoId={equipo.id}
                     documentos={documentos}
                     tiposDocumento={tiposDocumento}
                  />
               </TabsContent>

               <TabsContent value="licencias">
                  <EquipoLicenciasTab
                     licenciasAsignadas={licencias}
                  />
               </TabsContent>

               {canAudit && (
                  <TabsContent value="auditoria">
                     <Card>
                        <CardHeader>
                           <CardTitle>Historial de Auditoría</CardTitle>
                           <CardDescription>Registro inmutable de cambios realizados a este registro.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <AuditTimeline tableName="equipos" entityId={equipo.id} />
                        </CardContent>
                     </Card>
                  </TabsContent>
               )}
            </div>
         </Tabs>

         {/* Alerta Eliminación */}
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no se puede deshacer. Esto eliminará permanentemente el equipo
                     <strong> {equipo.nombre}</strong> y desconectará sus relaciones.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(`/equipos/${equipo.id}`)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
};
