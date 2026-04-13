"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Building2, Mail, Globe, Loader2 } from "lucide-react";

import { Proveedor } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

import { ProveedorForm } from "./ProveedorForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { api } from "@/lib/http";

interface ProveedoresTabProps {
   data: Proveedor[];
   isLoading?: boolean;
}

export const ProveedoresTab: React.FC<ProveedoresTabProps> = ({ data, isLoading = false }) => {
   const router = useRouter();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
   const [showInactive, setShowInactive] = useState(false);

   const [localData, setLocalData] = useState<Proveedor[]>(data || []);
   const isInitialMount = useRef(true);

   useEffect(() => {
      setLocalData(data || []);
   }, [data]);

   useEffect(() => {
      if (isInitialMount.current) {
         isInitialMount.current = false;
         return;
      }

      if (showInactive) {
         api.get<Proveedor[]>("/proveedores/", { params: { include_inactive: true, limit: 200 } })
            .then(setLocalData)
            .catch(console.error);
      } else {
         setLocalData(data || []);
      }
   }, [showInactive, data]);

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => api.delete(`/proveedores/${id}`),
      onSuccess: () => router.refresh(),
      successMessage: "El proveedor ha sido ocultado (eliminado lógicamente) correctamente."
   });

   const filteredData = useMemo(() => {
      return localData.filter((p) => showInactive || p.is_active !== false);
   }, [localData, showInactive]);

   const handleEdit = (proveedor: Proveedor) => {
      setSelectedProveedor(proveedor);
      setIsModalOpen(true);
   };

   const handleCreate = () => {
      setSelectedProveedor(null);
      setIsModalOpen(true);
   };

   const handleSuccess = () => {
      setIsModalOpen(false);
      router.refresh();
   };

   const columns: ColumnDef<Proveedor>[] = [
      {
         accessorKey: "nombre",
         header: "Empresa",
         cell: ({ row }) => (
            <div className="flex items-center gap-2 font-medium">
               <Building2 className="h-4 w-4 text-muted-foreground" />
               {row.getValue("nombre")}
               {row.original.is_active === false && (
                  <Badge variant="outline" className="text-destructive border-destructive text-[10px] ml-2">Inactivo</Badge>
               )}
            </div>
         )
      },
      {
         accessorKey: "rnc",
         header: "RNC / ID Fiscal",
         cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("rnc") || "N/A"}</span>
      },
      {
         accessorKey: "contacto",
         header: "Contacto",
         cell: ({ row }) => {
            const email = row.getValue("contacto") as string;
            return email ? (
               <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" /> {email}
               </div>
            ) : <span className="text-muted-foreground">-</span>;
         }
      },
      {
         accessorKey: "sitio_web",
         header: "Sitio Web",
         cell: ({ row }) => {
            const url = row.getValue("sitio_web") as string;
            return url ? (
               <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                  <Globe className="h-3 w-3" /> Link
               </a>
            ) : <span className="text-muted-foreground">-</span>;
         }
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     <span className="sr-only">Abrir menú</span>
                     <MoreHorizontal className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)} className="cursor-pointer">
                     <Edit className="mr-2 h-4 w-4 text-primary" /> Editar
                  </DropdownMenuItem>
                  {row.original.is_active !== false && (
                     <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        onClick={() => openAlert(row.original.id)}
                     >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                     </DropdownMenuItem>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   if (isLoading) {
      return (
         <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Cargando proveedores...</span>
         </div>
      );
   }

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
               <Switch id="show-inactive-proveedores" checked={showInactive} onCheckedChange={setShowInactive} />
               <Label htmlFor="show-inactive-proveedores" className="text-sm text-muted-foreground cursor-pointer">
                  Mostrar inactivos
               </Label>
            </div>
            <Button onClick={handleCreate} className="shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" /> Registrar Proveedor
            </Button>
         </div>

         <DataTable
            columns={columns}
            data={filteredData}
            filterColumn="nombre"
            tableContainerClassName="shadow-sm border rounded-lg bg-card"
         />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-150">
               <DialogHeader>
                  <DialogTitle>{selectedProveedor ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}</DialogTitle>
                  <DialogDescription>
                     Gestione la información de contacto y fiscal de sus suplidores.
                  </DialogDescription>
               </DialogHeader>
               {isModalOpen && (
                  <ProveedorForm
                     initialData={selectedProveedor ?? undefined}
                     onSuccess={handleSuccess}
                  />
               )}
            </DialogContent>
         </Dialog>

         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Está seguro de eliminar este proveedor?"
            description="Esta acción no se puede deshacer. Los datos del proveedor se ocultarán del sistema. La operación podría ser rechazada si el proveedor tiene equipos activos asociados."
         />
      </div>
   );
};
