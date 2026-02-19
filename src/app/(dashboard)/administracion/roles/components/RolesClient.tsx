"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Shield, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/use-toast";
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
         console.error(error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Error al cargar roles.",
         });
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

   const handleEdit = (rol: Rol) => {
      setSelectedRole(rol);
      setIsModalOpen(true);
   };

   const handleCreate = () => {
      setSelectedRole(undefined);
      setIsModalOpen(true);
   };

   const handleSuccess = () => {
      setIsModalOpen(false);
      fetchRoles();
   };

   const columns = [
      {
         accessorKey: "nombre",
         header: "Rol",
         cell: ({ row }: any) => (
            <div className="flex items-center gap-2">
               <Shield className="h-4 w-4 text-muted-foreground" />
               <span className="font-medium capitalize">{row.original.nombre}</span>
            </div>
         ),
      },
      {
         accessorKey: "descripcion",
         header: "Descripción",
      },
      {
         accessorKey: "permisos",
         header: "Permisos",
         cell: ({ row }: any) => (
            <span className="text-muted-foreground text-sm">
               {row.original.permisos?.length || 0} permisos asignados
            </span>
         ),
      },
      {
         id: "actions",
         cell: ({ row }: any) => (
            <div className="flex justify-end">
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(row.original)}
               >
                  <Pencil className="h-4 w-4" />
               </Button>
            </div>
         ),
      },
   ];

   if (!isInitialized || loading) {
      return (
         <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
         </div>
      );
   }

   return (
      <div className="space-y-4">
         <div className="flex justify-end">
            <Button onClick={handleCreate}>
               <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
            </Button>
         </div>

         <DataTable columns={columns} data={data} />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>{selectedRole ? "Editar Rol" : "Crear Rol"}</DialogTitle>
                  <DialogDescription>
                     Configure los detalles y permisos del rol a continuación.
                  </DialogDescription>
               </DialogHeader>

               <RoleForm
                  initialData={selectedRole}
                  onSuccess={handleSuccess}
                  onCancel={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>
      </div>
   );
}
