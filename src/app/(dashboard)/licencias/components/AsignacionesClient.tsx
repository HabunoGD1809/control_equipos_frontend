"use client"

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/ui/DataTable";
import { AsignacionLicencia } from "@/types/api";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { Button } from "@/components/ui/Button";
import { useHasPermission } from "@/hooks/useHasPermission";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";

interface AsignacionesClientProps {
   data: AsignacionLicencia[];
}

export function AsignacionesClient({ data }: AsignacionesClientProps) {
   const router = useRouter();
   const canUnassign = useHasPermission(['desasignar_licencias']);

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Asignación", () => router.refresh());

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
               return <Link href={`/equipos/${item.equipo.id}`} className="hover:underline text-primary">Equipo: {item.equipo.nombre}</Link>
            }
            if (item.usuario) {
               return `Usuario: ${item.usuario.nombre_usuario}`;
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
                     className="text-destructive hover:text-destructive/80"
                     onClick={() => openAlert(row.original.id)}
                  >
                     <Trash2 className="h-4 w-4" />
                  </Button>
               )}
            </div>
         )
      },
   ];

   return (
      <>
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Desasignar licencia?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción liberará la licencia para que pueda ser utilizada por otro equipo o usuario.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(`/licencias/asignaciones/${itemToDelete}`)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                     {isDeleting ? "Desasignando..." : "Sí, desasignar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <DataTable columns={columns} data={data} filterColumn="software" />
      </>
   )
}
