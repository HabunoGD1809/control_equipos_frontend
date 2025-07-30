"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, Download, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";
import { Documentacion, TipoDocumento } from "@/types/api";
import { UploadDocumentoForm } from "./UploadDocumentoForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";

interface EquipoDocumentacionTabProps {
   equipoId: string;
   documentos: Documentacion[];
   tiposDocumento: TipoDocumento[];
}

const EstadoIcon = ({ estado }: { estado: string }) => {
   switch (estado) {
      case 'Verificado': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Rechazado': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
   }
}

export function EquipoDocumentacionTab({ equipoId, documentos, tiposDocumento }: EquipoDocumentacionTabProps) {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const router = useRouter();

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Documento", () => router.refresh());

   const columns: ColumnDef<Documentacion>[] = [
      { accessorKey: "titulo", header: "Título" },
      { accessorKey: "tipo_documento.nombre", header: "Tipo", cell: ({ row }) => row.original.tipo_documento.nombre },
      {
         accessorKey: "fecha_subida",
         header: "Fecha de Subida",
         cell: ({ row }) => format(new Date(row.original.fecha_subida), "PPp", { locale: es })
      },
      {
         accessorKey: "estado",
         header: "Estado",
         cell: ({ row }) => (
            <div className="flex items-center gap-2">
               <EstadoIcon estado={row.getValue("estado")} />
               <span>{row.getValue("estado")}</span>
            </div>
         )
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <div className="flex gap-2 justify-end">
               <a href={row.original.enlace} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
               </a>
               <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => openAlert(row.original.id)}>
                  <Trash2 className="h-4 w-4" />
               </Button>
            </div>
         ),
      },
   ];

   return (
      <div className="mt-4 space-y-4">
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no se puede deshacer. Se eliminará permanentemente el documento y su archivo asociado.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(`/documentacion/${itemToDelete}`)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <div className="flex justify-end">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
               <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Subir Documento</Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Subir Nuevo Documento</DialogTitle>
                     <DialogDescription>
                        Adjunte un archivo relacionado con este equipo. Tamaño máximo: 10 MB.
                     </DialogDescription>
                  </DialogHeader>
                  <UploadDocumentoForm
                     equipoId={equipoId}
                     tiposDocumento={tiposDocumento}
                     onSuccess={() => setIsModalOpen(false)}
                  />
               </DialogContent>
            </Dialog>
         </div>
         <DataTable columns={columns} data={documentos} />
      </div>
   );
}
