// [Mismos imports y variables iniciales]
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, Download, Trash2, CheckCircle, XCircle, Clock, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

import { Documentacion, TipoDocumento, EstadoDocumentoEnum } from "@/types/api";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useHasPermission } from "@/hooks/useHasPermission";
import { api } from "@/lib/http";

import { VerifyDocumentoForm } from "./VerifyDocumentoForm";
import { UploadDocumentoForm } from "./UploadDocumentoForm";

// ... [Mismas props e interfaces] ...
interface DocumentacionTableProps {
   documentos: Documentacion[];
   tiposDocumento: TipoDocumento[];
   equipoId?: string;
   showEquipoColumn?: boolean;
}

const EstadoIcon = ({ estado }: { estado: string }) => {
   switch (estado) {
      case EstadoDocumentoEnum.Verificado: return <CheckCircle className="h-4 w-4 text-green-500" />;
      case EstadoDocumentoEnum.Rechazado: return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
   }
};

export function DocumentacionTable({
   documentos,
   tiposDocumento,
   equipoId,
   showEquipoColumn = false,
}: DocumentacionTableProps) {
   // ... [Mismos Hooks y Columnas, los he conservado intactos en tu código original, omitiendo repetición aquí por brevedad, asumiendo que insertas el código anterior de React y `columns` aquí] ...
   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
   const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
   const [selectedDocumento, setSelectedDocumento] = useState<Documentacion | null>(null);

   const router = useRouter();
   const canVerify = useHasPermission(["verificar_documentacion"]);
   const canUpload = useHasPermission(["gestionar_documentacion"]);

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => api.delete(`/documentacion/${id}`),
      onSuccess: () => router.refresh(),
      successMessage: "Documento eliminado permanentemente.",
   });

   const columns: ColumnDef<Documentacion>[] = [
      { accessorKey: "titulo", header: "Título", cell: ({ row }) => <span className="font-medium">{row.getValue("titulo")}</span> },
      {
         accessorFn: (row) => row.tipo_documento?.nombre || "N/A",
         id: "tipo_documento",
         header: "Tipo",
      },
      ...(showEquipoColumn ? [{
         accessorFn: (row: Documentacion) => row.equipo?.nombre || "N/A",
         id: "equipo",
         header: "Equipo Asociado",
         cell: ({ row }: { row: { original: Documentacion } }) =>
            row.original.equipo ? (
               <Link href={`/equipos/${row.original.equipo.id}`} className="hover:underline text-primary font-medium">
                  {row.original.equipo.nombre}
               </Link>
            ) : <span className="text-muted-foreground text-sm">N/A</span>,
      } as ColumnDef<Documentacion>] : []),
      {
         accessorKey: "fecha_subida",
         header: "Fecha de Subida",
         cell: ({ row }) => format(new Date(row.original.fecha_subida), "PPp", { locale: es }),
      },
      {
         accessorKey: "estado",
         header: "Estado",
         cell: ({ row }) => (
            <div className="flex items-center gap-2">
               <EstadoIcon estado={row.getValue("estado")} />
               <span className="font-medium text-sm">{row.getValue("estado")}</span>
            </div>
         ),
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <div className="flex gap-2 justify-end">
               <Button variant="outline" size="icon" title="Descargar / Ver" asChild>
                  <a href={row.original.enlace} target="_blank" rel="noopener noreferrer">
                     <Download className="h-4 w-4 text-blue-600" />
                  </a>
               </Button>
               {canVerify && row.original.estado === EstadoDocumentoEnum.Pendiente && (
                  <Button variant="outline" size="icon" title="Verificar Documento" onClick={() => { setSelectedDocumento(row.original); setIsVerifyModalOpen(true); }}>
                     <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  </Button>
               )}
               <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Eliminar" onClick={() => openAlert(row.original.id)}>
                  <Trash2 className="h-4 w-4" />
               </Button>
            </div>
         ),
      },
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Eliminar Documento?"
            description="Esta acción no se puede deshacer. Se eliminará permanentemente el documento y su archivo físico del almacenamiento."
         />

         <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            {/* Modal content intacto */}
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Subir Nuevo Documento</DialogTitle>
                  <DialogDescription>Adjunte un archivo. Tamaño máximo: 10 MB.</DialogDescription>
               </DialogHeader>
               <UploadDocumentoForm
                  equipoId={equipoId}
                  tiposDocumento={tiposDocumento}
                  onSuccess={() => { setIsUploadModalOpen(false); router.refresh(); }}
               />
            </DialogContent>
         </Dialog>

         {selectedDocumento && (
            <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
               {/* Modal content intacto */}
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Verificar Documento</DialogTitle>
                     <DialogDescription>Actualice el estado del documento a Verificado o Rechazado.</DialogDescription>
                  </DialogHeader>
                  <VerifyDocumentoForm
                     documento={selectedDocumento}
                     onSuccess={() => { setIsVerifyModalOpen(false); setSelectedDocumento(null); router.refresh(); }}
                  />
               </DialogContent>
            </Dialog>
         )}

         {canUpload && (
            <div className="flex justify-end mb-4">
               <Button onClick={() => setIsUploadModalOpen(true)} className="shadow-sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Subir Documento
               </Button>
            </div>
         )}

         {/* Refactorizado */}
         <DataTable
            columns={columns}
            data={documentos}
            filterColumn="titulo"
            tableContainerClassName="shadow-sm"
         />
      </div>
   );
}
