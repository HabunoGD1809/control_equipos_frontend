"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { api } from "@/lib/http";
import type { AsignacionLicencia } from "@/types/api";

interface EquipoLicenciasTabProps {
   asignaciones: AsignacionLicencia[];
   equipoId: string;
}

export function EquipoLicenciasTab({ asignaciones, equipoId }: EquipoLicenciasTabProps) {
   const queryClient = useQueryClient();
   const { toast } = useToast();

   // ESTADO PARA CONTROLAR EL MODAL
   const [asignacionToDelete, setAsignacionToDelete] = useState<AsignacionLicencia | null>(null);

   const deleteMutation = useMutation({
      mutationFn: async (asignacionId: string) => {
         return api.delete(`/licencias/asignaciones/${asignacionId}`);
      },
      onSuccess: () => {
         toast({ title: "Licencia desasignada", description: "El software fue desvinculado del equipo." });

         // Invalida las cachés para refrescar la UI y respetar los Triggers
         queryClient.invalidateQueries({ queryKey: ["equipos", equipoId] });
         queryClient.invalidateQueries({ queryKey: ["asignaciones"] });
         queryClient.invalidateQueries({ queryKey: ["licencias"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard"] });

         // Cerramos el modal
         setAsignacionToDelete(null);
      },
      onError: (err: any) => {
         toast({ variant: "destructive", title: "Error", description: err.message });
         setAsignacionToDelete(null);
      }
   });

   const columns: ColumnDef<AsignacionLicencia>[] = [
      {
         accessorFn: (row) => `${row.licencia.software_nombre} ${row.licencia.software_version || ''}`,
         id: "software",
         header: "Software",
      },
      {
         accessorKey: "fecha_asignacion",
         header: "Fecha Asignación",
         cell: ({ row }) => format(new Date(row.original.fecha_asignacion), "P", { locale: es })
      },
      {
         accessorFn: (row) => row.licencia.clave_producto || "N/A",
         id: "clave",
         header: "Clave de Producto",
      },
      {
         id: "acciones",
         cell: ({ row }) => {
            const asignacion = row.original;
            return (
               <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setAsignacionToDelete(asignacion)}
               >
                  <Trash2 className="h-4 w-4" />
               </Button>
            );
         }
      }
   ];

   return (
      <>
         <DataTable
            columns={columns}
            data={asignaciones}
            filterColumn="software"
            className="mt-4"
         />

         {/* COMPONENTE CONTROLADO */}
         <ConfirmDeleteDialog
            isOpen={!!asignacionToDelete}
            isDeleting={deleteMutation.isPending}
            onClose={() => setAsignacionToDelete(null)}
            onConfirm={() => {
               if (asignacionToDelete) {
                  deleteMutation.mutate(asignacionToDelete.id);
               }
            }}
            title="Desasignar Licencia"
            description={`¿Estás seguro de que deseas quitar ${asignacionToDelete?.licencia.software_nombre} de este equipo? Esta acción devolverá la licencia al inventario disponible.`}
         />
      </>
   );
}
