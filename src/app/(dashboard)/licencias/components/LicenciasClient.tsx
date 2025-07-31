"use client"

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, PlusCircle, Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/DropdownMenu";
import { LicenciaSoftware, SoftwareCatalogo, Proveedor, EquipoSimple, UsuarioSimple } from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { SoftwareCatalogoForm } from "@/components/features/licencias/SoftwareCatalogoForm";
import { LicenciaSoftwareForm } from "@/components/features/licencias/LicenciaSoftwareForm";
import { AsignarLicenciaForm } from "@/components/features/licencias/AsignarLicenciaForm";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

interface LicenciasClientProps {
   initialLicencias: LicenciaSoftware[];
   initialCatalogo: SoftwareCatalogo[];
   proveedores: Proveedor[];
   equipos: EquipoSimple[];
   usuarios: UsuarioSimple[];
}

interface ApiError {
   detail: string;
}

type ModalType = 'catalogo' | 'licencia' | 'asignar' | null;

export function LicenciasClient({ initialLicencias, initialCatalogo, proveedores, equipos, usuarios }: LicenciasClientProps) {
   const [activeTab, setActiveTab] = useState("licencias");
   const [modal, setModal] = useState<{ type: ModalType; data?: LicenciaSoftware | SoftwareCatalogo }>({ type: null });
   const { toast } = useToast();
   const router = useRouter();

   const canManageCatalogo = useHasPermission(['administrar_software_catalogo']);
   const canManageLicencias = useHasPermission(['administrar_licencias']);
   const canAssignLicencias = useHasPermission(['asignar_licencias']);

   const handleOpenModal = (type: ModalType, data: LicenciaSoftware | SoftwareCatalogo | null = null) => {
      setModal({ type, data: data || undefined });
   };

   const handleCloseModal = () => {
      setModal({ type: null });
   };

   const handleDelete = async (type: 'licencia' | 'catalogo', id: string) => {
      if (!confirm(`¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.`)) {
         return;
      }

      try {
         const url = type === 'licencia' ? `/licencias/${id}` : `/licencias/catalogo/${id}`;
         await api.delete(url);
         toast({ title: "Éxito", description: `${type.charAt(0).toUpperCase() + type.slice(1)} eliminada correctamente.` });
         router.refresh();
      } catch (error: unknown) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || `No se pudo eliminar el elemento.`;
         toast({ variant: "destructive", title: "Error", description: msg });
      }
   };

   const licenciasColumns: ColumnDef<LicenciaSoftware>[] = [
      {
         accessorFn: (row) => `${row.software_info.nombre} ${row.software_info.version || ''}`,
         id: "software",
         header: "Software",
      },
      {
         id: "disponibilidad",
         header: "Disponibles / Total",
         cell: ({ row }) => `${row.original.cantidad_disponible} / ${row.original.cantidad_total}`
      },
      {
         accessorKey: "fecha_expiracion",
         header: "Expira",
         cell: ({ row }) => row.original.fecha_expiracion ? format(new Date(row.original.fecha_expiracion), "P", { locale: es }) : 'Perpetua'
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  {canAssignLicencias && row.original.cantidad_disponible > 0 && (
                     <DropdownMenuItem onClick={() => handleOpenModal('asignar', row.original)}>
                        <Users className="mr-2 h-4 w-4" />Asignar Licencia
                     </DropdownMenuItem>
                  )}
                  {canManageLicencias && (
                     <>
                        <DropdownMenuItem onClick={() => handleOpenModal('licencia', row.original)}>
                           <Pencil className="mr-2 h-4 w-4" />Editar Licencia
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete('licencia', row.original.id)}>
                           <Trash2 className="mr-2 h-4 w-4" />Eliminar Licencia
                        </DropdownMenuItem>
                     </>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   const catalogoColumns: ColumnDef<SoftwareCatalogo>[] = [
      { accessorKey: "nombre", header: "Nombre" },
      { accessorKey: "version", header: "Versión" },
      { accessorKey: "fabricante", header: "Fabricante" },
      { accessorKey: "tipo_licencia", header: "Tipo" },
      { accessorKey: "metrica_licenciamiento", header: "Métrica" },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  {canManageLicencias && <DropdownMenuItem onClick={() => handleOpenModal('catalogo', row.original)}>Editar</DropdownMenuItem>}
                  {canManageLicencias && <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete('catalogo', row.original.id)}>Eliminar</DropdownMenuItem>}
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   return (
      <>
         <Dialog open={!!modal.type} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
            <DialogContent className="sm:max-w-md">
               <DialogHeader>
                  <DialogTitle>
                     {modal.type === 'catalogo' ? (modal.data ? 'Editar Software' : 'Añadir Software al Catálogo') :
                        modal.type === 'licencia' ? (modal.data ? 'Editar Licencia' : 'Añadir Licencia') :
                           'Asignar Licencia'}
                  </DialogTitle>
                  <DialogDescription>
                     {modal.type === 'catalogo' ? 'Gestiona los tipos de software disponibles.' :
                        modal.type === 'licencia' ? 'Gestiona las licencias adquiridas.' :
                           'Asigna esta licencia a un usuario o equipo.'}
                  </DialogDescription>
               </DialogHeader>
               {modal.type === 'catalogo' && <SoftwareCatalogoForm initialData={modal.data as SoftwareCatalogo} onSuccess={handleCloseModal} />}
               {modal.type === 'licencia' && <LicenciaSoftwareForm initialData={modal.data as LicenciaSoftware} catalogo={initialCatalogo} proveedores={proveedores} onSuccess={handleCloseModal} />}
               {modal.type === 'asignar' && <AsignarLicenciaForm licenciaId={(modal.data as LicenciaSoftware).id} equipos={equipos} usuarios={usuarios} onSuccess={handleCloseModal} />}
            </DialogContent>
         </Dialog>

         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
               <TabsList>
                  <TabsTrigger value="licencias">Licencias Adquiridas</TabsTrigger>
                  {canManageCatalogo && <TabsTrigger value="catalogo">Catálogo de Software</TabsTrigger>}
               </TabsList>
               <div className="flex gap-2">
                  {activeTab === 'licencias' && canManageLicencias && (
                     <Button onClick={() => handleOpenModal('licencia')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Registrar Licencia
                     </Button>
                  )}
                  {activeTab === 'catalogo' && canManageCatalogo && (
                     <Button onClick={() => handleOpenModal('catalogo')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Software
                     </Button>
                  )}
               </div>
            </div>

            <TabsContent value="licencias">
               <DataTable columns={licenciasColumns} data={initialLicencias} filterColumn="software" />
            </TabsContent>
            <TabsContent value="catalogo">
               {canManageCatalogo && <DataTable columns={catalogoColumns} data={initialCatalogo} />}
            </TabsContent>
         </Tabs>
      </>
   );
}
