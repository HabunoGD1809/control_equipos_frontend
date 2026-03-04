"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Shield, Loader2, RefreshCw } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleForm } from "@/components/features/roles/RoleForm";
import { rolesService } from "@/app/services/rolesService";
import { useAuthStore } from "@/store/authStore";
import type { Rol } from "@/types/api";

export function RolesClient() {
   const { toast } = useToast();
   const { isInitialized, isAuthenticated } = useAuthStore();

   const [data, setData] = useState<Rol[]>([]);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedRole, setSelectedRole] = useState<Rol | undefined>(undefined);

   const fetchRoles = useCallback(async () => {
      if (!isInitialized || !isAuthenticated) return;
      setLoading(true);
      try {
         const roles = await rolesService.getAll();
         setData(roles);
      } catch (error) {
         toast({ variant: "destructive", title: "Error", description: "Error al cargar roles." });
      } finally {
         setLoading(false);
      }
   }, [isInitialized, isAuthenticated, toast]);

   useEffect(() => {
      if (isInitialized && isAuthenticated) {
         fetchRoles();
      } else if (isInitialized && !isAuthenticated) {
         setLoading(false);
      }
   }, [isInitialized, isAuthenticated, fetchRoles]);

   const columns: ColumnDef<Rol>[] = [
      {
         accessorKey: "nombre",
         header: "Rol",
         cell: ({ row }) => (
            <div className="flex items-center gap-2">
               <Shield className="h-4 w-4 text-primary/70" />
               <span className="font-semibold capitalize text-foreground">{row.original.nombre}</span>
            </div>
         ),
      },
      {
         accessorKey: "descripcion",
         header: "Descripción",
         cell: ({ row }) => <span className="text-muted-foreground">{row.original.descripcion || "--"}</span>
      },
      {
         accessorKey: "permisos",
         header: "Permisos",
         cell: ({ row }) => (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
               {row.original.permisos?.length || 0} asignados
            </span>
         ),
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <div className="flex justify-end">
               <Button variant="ghost" size="sm" onClick={() => { setSelectedRole(row.original); setIsModalOpen(true); }} title="Editar Rol">
                  <Pencil className="h-4 w-4" />
               </Button>
            </div>
         ),
      },
   ];

   if (!isInitialized || (loading && data.length === 0)) {
      return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
   }

   return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <PageHeader
            title="Roles y Permisos"
            description="Defina los perfiles de acceso y asigne capacidades específicas a cada rol."
            actions={
               <>
                  <Button variant="outline" onClick={fetchRoles} disabled={loading} title="Actualizar lista">
                     <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button onClick={() => { setSelectedRole(undefined); setIsModalOpen(true); }} className="shadow-sm">
                     <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                  </Button>
               </>
            }
         />

         <DataTable columns={columns} data={data} tableContainerClassName="shadow-sm border rounded-md" />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>{selectedRole ? "Editar Rol" : "Crear Nuevo Rol"}</DialogTitle>
                  <DialogDescription>Configure los detalles y permisos granulares del rol a continuación.</DialogDescription>
               </DialogHeader>
               <RoleForm
                  initialData={selectedRole}
                  onSuccess={() => { setIsModalOpen(false); fetchRoles(); }}
                  onCancel={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>
      </div>
   );
}
