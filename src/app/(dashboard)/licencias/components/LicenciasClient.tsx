"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, PlusCircle, Users, Pencil, Trash2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/DropdownMenu";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { PageHeader } from "@/components/layout/PageHeader";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { licenciasService } from "@/app/services/licenciasService";
import type { LicenciaSoftware, SoftwareCatalogo, Proveedor, EquipoSimple, UsuarioSimple, AsignacionLicencia } from "@/types/api";

import { SoftwareCatalogoForm } from "@/components/features/licencias/SoftwareCatalogoForm";
import { LicenciaSoftwareForm } from "@/components/features/licencias/LicenciaSoftwareForm";
import { AsignarLicenciaForm } from "@/components/features/licencias/AsignarLicenciaForm";
import { AsignacionesClient } from "./AsignacionesClient";

interface LicenciasClientProps {
   initialLicencias: LicenciaSoftware[];
   initialCatalogo: SoftwareCatalogo[];
   initialAsignaciones: AsignacionLicencia[];
   proveedores: Proveedor[];
   equipos: EquipoSimple[];
   usuarios: UsuarioSimple[];
}

type ModalType = 'catalogo' | 'licencia' | 'asignar' | null;

export function LicenciasClient({
   initialLicencias,
   initialCatalogo,
   initialAsignaciones,
   proveedores,
   equipos,
   usuarios
}: LicenciasClientProps) {
   const router = useRouter();
   const [activeTab, setActiveTab] = useState("licencias");
   const [modal, setModal] = useState<{ type: ModalType; data?: LicenciaSoftware | SoftwareCatalogo }>({ type: null });
   const [isRefreshing, setIsRefreshing] = useState(false);

   const canManageCatalogo = useHasPermission(['administrar_software_catalogo']);
   const canManageLicencias = useHasPermission(['administrar_licencias']);
   const canAssignLicencias = useHasPermission(['asignar_licencias']);

   const licenciaDelete = useDeleteConfirmation({
      onDelete: (id) => licenciasService.delete(id as string),
      onSuccess: () => router.refresh(),
      successMessage: "Licencia eliminada correctamente."
   });

   const catalogoDelete = useDeleteConfirmation({
      onDelete: (id) => licenciasService.deleteSoftware(id as string),
      onSuccess: () => router.refresh(),
      successMessage: "Software eliminado del catálogo."
   });

   const handleOpenModal = (type: ModalType, data: LicenciaSoftware | SoftwareCatalogo | null = null) => {
      setModal({ type, data: data || undefined });
   };

   const handleCloseModal = () => {
      setModal({ type: null });
      router.refresh();
   };

   const handleRefresh = () => {
      setIsRefreshing(true);
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 800);
   };

   const licenciasColumns: ColumnDef<LicenciaSoftware>[] = [
      {
         accessorFn: (row) => `${row.software_info.nombre} ${row.software_info.version || ''}`,
         id: "software",
         header: "Software",
         cell: ({ row }) => <span className="font-semibold text-foreground">{row.getValue("software")}</span>
      },
      {
         id: "disponibilidad",
         header: "Disponibles / Total",
         cell: ({ row }) => (
            <div className="flex items-center gap-2">
               <span className="font-bold text-foreground">{row.original.cantidad_disponible}</span>
               <span className="text-muted-foreground">/ {row.original.cantidad_total}</span>
            </div>
         )
      },
      {
         accessorKey: "fecha_expiracion",
         header: "Expira",
         cell: ({ row }) => row.original.fecha_expiracion
            ? format(new Date(row.original.fecha_expiracion), "P", { locale: es })
            : <span className="text-muted-foreground italic">Perpetua</span>
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48 shadow-md">
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</DropdownMenuLabel>
                  {canAssignLicencias && row.original.cantidad_disponible > 0 && (
                     <DropdownMenuItem onClick={() => handleOpenModal('asignar', row.original)} className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4 text-primary" /> Asignar Licencia
                     </DropdownMenuItem>
                  )}
                  {canManageLicencias && (
                     <>
                        <DropdownMenuItem onClick={() => handleOpenModal('licencia', row.original)} className="cursor-pointer">
                           <Pencil className="mr-2 h-4 w-4" /> Editar Licencia
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => licenciaDelete.openAlert(row.original.id)}>
                           <Trash2 className="mr-2 h-4 w-4" /> Eliminar Licencia
                        </DropdownMenuItem>
                     </>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   const catalogoColumns: ColumnDef<SoftwareCatalogo>[] = [
      { accessorKey: "nombre", header: "Nombre", cell: ({ row }) => <span className="font-medium text-foreground">{row.original.nombre}</span> },
      { accessorKey: "version", header: "Versión", cell: ({ row }) => <span className="text-muted-foreground">{row.original.version || "N/A"}</span> },
      { accessorKey: "fabricante", header: "Fabricante" },
      { accessorKey: "tipo_licencia", header: "Tipo Licencia", cell: ({ row }) => <span className="capitalize">{row.original.tipo_licencia}</span> },
      { accessorKey: "metrica_licenciamiento", header: "Métrica", cell: ({ row }) => <span className="bg-muted px-2 py-1 rounded-md text-xs">{row.original.metrica_licenciamiento}</span> },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-40 shadow-md">
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</DropdownMenuLabel>
                  {canManageCatalogo && (
                     <>
                        <DropdownMenuItem onClick={() => handleOpenModal('catalogo', row.original)} className="cursor-pointer">
                           <Pencil className="mr-2 h-4 w-4 text-primary" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => catalogoDelete.openAlert(row.original.id)}>
                           <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                     </>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <PageHeader
            title="Gestión de Licencias de Software"
            description="Administre el catálogo de software, licencias adquiridas y sus asignaciones."
         />

         <Dialog open={!!modal.type} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-primary">
                     {modal.type === 'catalogo' ? (modal.data ? 'Editar Software' : 'Añadir Software al Catálogo') :
                        modal.type === 'licencia' ? (modal.data ? 'Editar Licencia' : 'Añadir Licencia') :
                           'Asignar Licencia'}
                  </DialogTitle>
                  <DialogDescription>
                     {modal.type === 'catalogo' ? 'Gestiona los tipos de software disponibles y sus métricas.' :
                        modal.type === 'licencia' ? 'Registre las licencias adquiridas y sus vencimientos.' :
                           'Asigna una unidad de esta licencia a un empleado o estación de trabajo.'}
                  </DialogDescription>
               </DialogHeader>
               {modal.type === 'catalogo' && <SoftwareCatalogoForm initialData={modal.data as SoftwareCatalogo} onSuccess={handleCloseModal} />}
               {modal.type === 'licencia' && <LicenciaSoftwareForm initialData={modal.data as LicenciaSoftware} catalogo={initialCatalogo} proveedores={proveedores} onSuccess={handleCloseModal} />}
               {modal.type === 'asignar' && <AsignarLicenciaForm licenciaId={(modal.data as LicenciaSoftware).id} equipos={equipos} usuarios={usuarios} onSuccess={handleCloseModal} />}
            </DialogContent>
         </Dialog>

         <ConfirmDeleteDialog
            isOpen={licenciaDelete.isAlertOpen}
            isDeleting={licenciaDelete.isDeleting}
            onClose={licenciaDelete.closeAlert}
            onConfirm={licenciaDelete.confirmDelete}
            title="¿Eliminar Licencia?"
            description="Esta acción eliminará el registro de adquisición. Las asignaciones vinculadas deben ser liberadas previamente."
         />

         <ConfirmDeleteDialog
            isOpen={catalogoDelete.isAlertOpen}
            isDeleting={catalogoDelete.isDeleting}
            onClose={catalogoDelete.closeAlert}
            onConfirm={catalogoDelete.confirmDelete}
            title="¿Eliminar del Catálogo?"
            description="Esta acción removerá el software de las opciones disponibles. No se puede deshacer."
         />

         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
               <TabsList className="bg-card border shadow-sm">
                  <TabsTrigger value="licencias" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Adquiridas</TabsTrigger>
                  <TabsTrigger value="asignaciones" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Asignaciones</TabsTrigger>
                  {canManageCatalogo && <TabsTrigger value="catalogo" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Catálogo</TabsTrigger>}
               </TabsList>

               <div className="flex gap-2 w-full sm:w-auto items-center">
                  <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} title="Sincronizar datos" className="shadow-sm">
                     <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  {activeTab === 'licencias' && canManageLicencias && (
                     <Button onClick={() => handleOpenModal('licencia')} className="w-full sm:w-auto shadow-sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Registrar Licencia
                     </Button>
                  )}
                  {activeTab === 'catalogo' && canManageCatalogo && (
                     <Button variant="secondary" onClick={() => handleOpenModal('catalogo')} className="w-full sm:w-auto shadow-sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Software
                     </Button>
                  )}
               </div>
            </div>

            <TabsContent value="licencias" className="mt-0 outline-none">
               <DataTable
                  columns={licenciasColumns}
                  data={initialLicencias}
                  filterColumn="software"
                  tableContainerClassName="shadow-sm border rounded-lg bg-card"
               />
            </TabsContent>

            <TabsContent value="asignaciones" className="mt-0 outline-none">
               <AsignacionesClient data={initialAsignaciones} />
            </TabsContent>

            {canManageCatalogo && (
               <TabsContent value="catalogo" className="mt-0 outline-none">
                  <DataTable
                     columns={catalogoColumns}
                     data={initialCatalogo}
                     filterColumn="nombre"
                     tableContainerClassName="shadow-sm border rounded-lg bg-card"
                  />
               </TabsContent>
            )}
         </Tabs>
      </div>
   );
}
