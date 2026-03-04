"use client"

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";

import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { licenciasService } from "@/app/services/licenciasService";
import type { AsignacionLicencia } from "@/types/api";

interface AsignacionesClientProps {
   data: AsignacionLicencia[];
}

export function AsignacionesClient({ data }: AsignacionesClientProps) {
   const router = useRouter();
   const canUnassign = useHasPermission(['desasignar_licencias']);

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => licenciasService.revocarAsignacion(id as string),
      onSuccess: () => router.refresh(),
      successMessage: "Licencia desasignada correctamente.",
   });

   const columns: ColumnDef<AsignacionLicencia>[] = [
      {
         accessorFn: (row) => row.licencia.software_nombre || 'N/A',
         id: "software",
         header: "Software",
      },
      {
         header: "Asignado a",
         cell: ({ row }) => {
            const item = row.original;
            if (item.equipo) {
               return <Link href={`/equipos/${item.equipo.id}`} className="hover:underline text-primary font-medium">Equipo: {item.equipo.nombre}</Link>
            }
            if (item.usuario) {
               return <span className="font-medium">Usuario: {item.usuario.nombre_usuario}</span>;
            }
            return 'N/A';
         }
      },
      {
         accessorKey: "fecha_asignacion",
         header: "Fecha de Asignación",
         cell: ({ row }) => format(new Date(row.original.fecha_asignacion), "P", { locale: es })
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <div className="flex justify-end">
               {canUnassign && (
                  <Button
                     variant="ghost"
                     size="icon"
                     className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                     onClick={() => openAlert(row.original.id)}
                     title="Desasignar"
                  >
                     <Trash2 className="h-4 w-4" />
                  </Button>
               )}
            </div>
         )
      },
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Desasignar licencia?"
            description="Esta acción liberará la licencia para que pueda ser utilizada por otro equipo o usuario en el futuro."
         />

         <DataTable
            columns={columns}
            data={data}
            filterColumn="software"
            tableContainerClassName="shadow-sm border rounded-lg bg-card"
         />
      </div>
   )
}
