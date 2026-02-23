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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";
import { Documentacion, TipoDocumento, EstadoDocumentoEnum } from "@/types/api";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useHasPermission } from "@/hooks/useHasPermission";
import { VerifyDocumentoForm } from "./VerifyDocumentoForm";
import { UploadDocumentoForm } from "./UploadDocumentoForm";

interface DocumentacionTableProps {
   documentos: Documentacion[];
   tiposDocumento: TipoDocumento[];
   /** Si se pasa, el botón Subir vincula el doc a ese equipo automáticamente */
   equipoId?: string;
   /** Muestra la columna "Equipo Asociado" (útil en la vista global) */
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
   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
   const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
   const [selectedDocumento, setSelectedDocumento] = useState<Documentacion | null>(null);

   const router = useRouter();
   const canVerify = useHasPermission(["verificar_documentacion"]);
   const canUpload = useHasPermission(["gestionar_documentacion"]);

   const { isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete } =
      useDeleteConfirmation("Documento", () => router.refresh());

   const columns: ColumnDef<Documentacion>[] = [
      { accessorKey: "titulo", header: "Título" },
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
               <Link href={`/equipos/${row.original.equipo.id}`} className="hover:underline text-primary">
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
               <span>{row.getValue("estado")}</span>
            </div>
         ),
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <div className="flex gap-2 justify-end">
               <a href={row.original.enlace} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" title="Descargar / Ver">
                     <Download className="h-4 w-4" />
                  </Button>
               </a>
               {canVerify && row.original.estado === EstadoDocumentoEnum.Pendiente && (
                  <Button variant="outline" size="icon" title="Verificar" onClick={() => { setSelectedDocumento(row.original); setIsVerifyModalOpen(true); }}>
                     <ShieldCheck className="h-4 w-4" />
                  </Button>
               )}
               <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" title="Eliminar" onClick={() => openAlert(row.original.id)}>
                  <Trash2 className="h-4 w-4" />
               </Button>
            </div>
         ),
      },
   ];

   return (
      <>
         {/* Modal: Subir */}
         <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Subir Nuevo Documento</DialogTitle>
                  <DialogDescription>
                     Adjunte un archivo. Tamaño máximo: 10 MB.
                  </DialogDescription>
               </DialogHeader>
               <UploadDocumentoForm
                  equipoId={equipoId}
                  tiposDocumento={tiposDocumento}
                  onSuccess={() => { setIsUploadModalOpen(false); router.refresh(); }}
               />
            </DialogContent>
         </Dialog>

         {/* Modal: Verificar */}
         {selectedDocumento && (
            <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Verificar Documento</DialogTitle>
                     <DialogDescription>Actualice el estado a "Verificado" o "Rechazado".</DialogDescription>
                  </DialogHeader>
                  <VerifyDocumentoForm
                     documento={selectedDocumento}
                     onSuccess={() => { setIsVerifyModalOpen(false); setSelectedDocumento(null); }}
                  />
               </DialogContent>
            </Dialog>
         )}

         {/* Alerta: Eliminar */}
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción no se puede deshacer. Se eliminará permanentemente el documento y su archivo.
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

         {/* Botón subir + tabla */}
         {canUpload && (
            <div className="flex justify-end mb-4">
               <Button onClick={() => setIsUploadModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Subir Documento
               </Button>
            </div>
         )}

         <DataTable columns={columns} data={documentos} filterColumn="titulo" />
      </>
   );
}
