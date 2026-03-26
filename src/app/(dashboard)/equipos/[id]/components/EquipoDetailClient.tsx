"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Edit, Trash2, Box, FileText, Activity, History, Share2, Loader2, QrCode } from "lucide-react";
import QRCode from "react-qr-code";

import {
   EquipoRead,
   ComponenteInfo,
   PadreInfo,
   Mantenimiento,
   Documentacion,
   AsignacionLicencia,
   EquipoSimple,
   TipoMantenimiento,
   TipoDocumento,
   ProveedorSimple,
   Tecnico,
   EstadoEquipo
} from "@/types/api";

import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/use-toast";

import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useHasPermission } from "@/hooks/useHasPermission";
import { equiposService } from "@/app/services/equiposService";
import { licenciasService } from "@/app/services/licenciasService";
import { documentosService } from "@/app/services/documentosService";
import { mantenimientosService } from "@/app/services/mantenimientosService";
import { catalogosService } from "@/app/services/catalogosService";
import { proveedoresService } from "@/app/services/proveedoresService";
import { tecnicosService } from "@/app/services/tecnicosService";

import { EquipoDetailTab } from "@/components/features/equipos/EquipoDetailTab";
import { EquipoComponentesTab } from "@/components/features/equipos/EquipoComponentesTab";
import { EquipoPadreTab } from "@/components/features/equipos/EquipoPadreTab";
import { EquipoHistorialTab } from "@/components/features/movimientos/EquipoHistorialTab";
import { EquipoMantenimientoTab } from "@/components/features/mantenimientos/EquipoMantenimientoTab";
import { EquipoDocumentacionTab } from "@/components/features/documentos/EquipoDocumentacionTab";
import { EquipoLicenciasTab } from "@/components/features/licencias/EquipoLicenciasTab";
import { AuditTimeline } from "@/components/features/auditoria/AuditTimeline";
import { EquipoForm } from "@/components/features/equipos/EquipoForm";

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
   const { toast } = useToast();

   const canEdit = useHasPermission(['editar_equipos']);
   const canDelete = useHasPermission(['eliminar_equipos']);
   const canAudit = useHasPermission(['ver_auditoria']);

   const [activeTab, setActiveTab] = useState("detalles");
   const [isLoadingTab, setIsLoadingTab] = useState(false);

   const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
   const [documentos, setDocumentos] = useState<Documentacion[]>([]);
   const [asignaciones, setAsignaciones] = useState<AsignacionLicencia[]>([]);
   const [equiposDisponibles, setEquiposDisponibles] = useState<EquipoSimple[]>([]);
   const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([]);
   const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
   const [proveedores, setProveedores] = useState<ProveedorSimple[]>([]);
   const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

   // Estados para Modal de Edición
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [estadosEquipo, setEstadosEquipo] = useState<EstadoEquipo[]>([]);
   const [isOpeningEdit, setIsOpeningEdit] = useState(false);

   // Estado para Modal de Código QR
   const [isQrModalOpen, setIsQrModalOpen] = useState(false);

   const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({
      detalles: true,
      componentes: true,
      jerarquia: true,
      movimientos: true,
   });

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => equiposService.delete(id),
      onSuccess: () => router.push("/equipos"),
      successMessage: "El equipo ha sido eliminado correctamente.",
   });

   const handleOpenEdit = async () => {
      setIsOpeningEdit(true);
      try {
         const [estadosData, provData] = await Promise.all([
            catalogosService.getEstadosEquipo(),
            proveedoresService.getOptions()
         ]);
         setEstadosEquipo(estadosData);
         setProveedores(provData);
         setIsEditModalOpen(true);
      } catch (error) {
         toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los catálogos para editar." });
      } finally {
         setIsOpeningEdit(false);
      }
   };

   const equipoUrl = typeof window !== 'undefined' ? `${window.location.origin}/equipos/${equipo.id}` : '';

   useEffect(() => {
      const loadTabData = async () => {
         if (loadedTabs[activeTab]) return;

         setIsLoadingTab(true);
         try {
            if (activeTab === "mantenimiento") {
               const [mtoRes, tiposMtoRes, tecnicosRes] = await Promise.all([
                  mantenimientosService.getAll({ equipo_id: equipo.id }),
                  catalogosService.getTiposMantenimiento(),
                  tecnicosService.getAll({ limit: 500 }),
               ]);
               setMantenimientos(unwrapClient(mtoRes));
               setTiposMantenimiento(unwrapClient(tiposMtoRes));
               setTecnicos(unwrapClient(tecnicosRes));
            }
            else if (activeTab === "documentacion") {
               const [docsRes, tiposDocRes] = await Promise.all([
                  documentosService.getByEquipo(equipo.id),
                  catalogosService.getTiposDocumento(),
               ]);
               setDocumentos(unwrapClient(docsRes));
               setTiposDocumento(unwrapClient(tiposDocRes));
            }
            else if (activeTab === "licencias") {
               const asigRes = await licenciasService.getAsignaciones({ equipo_id: equipo.id });
               setAsignaciones(unwrapClient(asigRes));
            }
            else if (activeTab === "componentes") {
               const res = await equiposService.getAll({ limit: 500 });
               setEquiposDisponibles(unwrapClient(res));
            }

            setLoadedTabs(prev => ({ ...prev, [activeTab]: true }));
         } catch (error) {
            console.error(`Error cargando datos de la pestaña ${activeTab}:`, error);
         } finally {
            setIsLoadingTab(false);
         }
      };

      loadTabData();
   }, [activeTab, equipo.id, loadedTabs]);

   return (
      <div className="space-y-6 animate-in fade-in duration-300">
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
                  <p className="text-muted-foreground text-sm">
                     Serie: {equipo.numero_serie}
                     {equipo.codigo_interno && ` | Código: ${equipo.codigo_interno}`}
                     {equipo.ubicacion?.nombre && ` | Ubicación: ${equipo.ubicacion.nombre}`}
                  </p>
               </div>
            </div>

            <div className="flex gap-2">
               {canEdit && (
                  <Button variant="outline" className="shadow-sm" onClick={handleOpenEdit} disabled={isOpeningEdit}>
                     {isOpeningEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                     Editar
                  </Button>
               )}
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="secondary" className="shadow-sm">Acciones</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => setIsQrModalOpen(true)}>
                        <QrCode className="mr-2 h-4 w-4" /> Ver Código QR
                     </DropdownMenuItem>
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
               <TabsTrigger value="componentes" className="gap-2"><Box className="h-4 w-4" /><span className="hidden md:inline">Componentes</span></TabsTrigger>
               <TabsTrigger value="jerarquia" className="gap-2"><Share2 className="h-4 w-4" /><span className="hidden md:inline">Jerarquía</span></TabsTrigger>
               <TabsTrigger value="movimientos" className="gap-2"><Activity className="h-4 w-4" /><span className="hidden md:inline">Historial</span></TabsTrigger>
               <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
               <TabsTrigger value="documentacion" className="gap-2"><FileText className="h-4 w-4" /><span className="hidden md:inline">Docs</span></TabsTrigger>
               <TabsTrigger value="licencias">Licencias</TabsTrigger>
               {canAudit && (
                  <TabsTrigger value="auditoria" className="gap-2"><History className="h-4 w-4" /><span className="hidden md:inline">Auditoría</span></TabsTrigger>
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
                  <EquipoHistorialTab equipoId={equipo.id} />
               </TabsContent>

               <TabsContent value="mantenimiento" className="mt-0 animate-in fade-in duration-300">
                  <EquipoMantenimientoTab
                     equipoId={equipo.id}
                     mantenimientos={mantenimientos}
                     tiposMantenimiento={tiposMantenimiento}
                     tecnicos={tecnicos}
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
                     asignaciones={asignaciones}
                     equipoId={equipo.id}
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

         {/* --- MODAL DE CÓDIGO QR --- */}
         <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
            <DialogContent className="sm:max-w-sm text-center">
               <DialogHeader>
                  <DialogTitle className="text-center">Etiqueta de Activo</DialogTitle>
                  <DialogDescription className="text-center">
                     Escanea este código para acceder al perfil del equipo.
                  </DialogDescription>
               </DialogHeader>
               <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-white rounded-xl border">
                  <QRCode
                     value={equipoUrl}
                     size={200}
                     level="H"
                  />
                  <div className="text-center text-black">
                     <p className="font-bold text-lg">{equipo.codigo_interno || equipo.numero_serie}</p>
                     <p className="text-xs text-gray-500 uppercase tracking-widest">{equipo.nombre}</p>
                  </div>
               </div>
               <div className="flex justify-center mt-2">
                  <Button variant="outline" onClick={() => window.print()} className="w-full">
                     <Printer className="mr-2 h-4 w-4" /> Imprimir Etiqueta
                  </Button>
               </div>
            </DialogContent>
         </Dialog>

         {/* Modal de Edición Inyectado */}
         <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-primary text-xl">Editar Equipo</DialogTitle>
                  <DialogDescription>Modifique los detalles del activo seleccionado.</DialogDescription>
               </DialogHeader>
               <EquipoForm
                  estados={estadosEquipo}
                  proveedores={proveedores}
                  initialData={equipo}
                  isEditing={true}
                  onSuccess={() => {
                     setIsEditModalOpen(false);
                     router.refresh();
                  }}
                  onCancel={() => setIsEditModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         {/* Diálogo de Confirmación de Borrado */}
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
