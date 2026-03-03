"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DatabaseBackup, Download, AlertCircle, CheckCircle2, Clock, Loader2, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/use-toast";
import { backupsService } from "@/app/services/backupsService";
import type { BackupLog } from "@/types/api";

interface BackupsClientProps {
   initialData: BackupLog[];
}

export function BackupsClient({ initialData }: BackupsClientProps) {
   const { toast } = useToast();
   const router = useRouter();

   // Mutación para disparar el backup manual centralizada usando tu servicio
   const backupMutation = useMutation({
      mutationFn: async () => {
         return backupsService.triggerBackup();
      },
      onSuccess: () => {
         toast({
            title: "Backup Iniciado",
            description: "El proceso de respaldo se está ejecutando en segundo plano.",
         });
         // Refrescamos la ruta para que Next.js vuelva a ejecutar el Server Component 
         // y nos traiga el nuevo registro de backup a la tabla.
         router.refresh();
      },
      onError: (err: any) => {
         toast({
            variant: "destructive",
            title: "Error",
            description: err.message || "No se pudo iniciar el respaldo.",
         });
      }
   });

   const columns: ColumnDef<BackupLog>[] = [
      {
         accessorKey: "backup_timestamp",
         header: "Fecha y Hora",
         cell: ({ row }) => (
            <div className="flex flex-col">
               <span className="font-medium">
                  {format(new Date(row.getValue("backup_timestamp")), "dd MMM yyyy", { locale: es })}
               </span>
               <span className="text-xs text-muted-foreground">
                  {format(new Date(row.getValue("backup_timestamp")), "HH:mm:ss")}
               </span>
            </div>
         ),
      },
      {
         accessorKey: "backup_type",
         header: "Tipo",
         cell: ({ row }) => (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
               {String(row.getValue("backup_type") ?? "")}
            </span>
         ),
      },
      {
         accessorKey: "backup_status",
         header: "Estado",
         cell: ({ row }) => {
            const status = String(row.getValue("backup_status") ?? "");
            if (status === "Success" || status === "Completado") {
               return (
                  <div className="flex items-center text-green-600">
                     <CheckCircle2 className="mr-1 h-4 w-4" /> Exitoso
                  </div>
               );
            }
            if (status === "Error" || status === "Fallido") {
               return (
                  <div className="flex items-center text-red-600">
                     <AlertCircle className="mr-1 h-4 w-4" /> Fallido
                  </div>
               );
            }
            return (
               <div className="flex items-center text-blue-600">
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> En Proceso
               </div>
            );
         },
      },
      {
         accessorKey: "duration",
         header: "Duración",
         cell: ({ row }) => (
            <div className="flex items-center text-muted-foreground text-sm">
               <Clock className="mr-1 h-3 w-3" />
               {String(row.getValue("duration") ?? "--")}
            </div>
         ),
      },
      {
         accessorKey: "file_path",
         header: "Archivo / Notas",
         cell: ({ row }) => {
            const path = row.original.file_path;
            const error = row.original.error_message;

            if (error) {
               return (
                  <span className="text-xs text-red-500 max-w-50 truncate block" title={error}>
                     {error}
                  </span>
               );
            }

            const filename = path?.split("/").pop();
            return (
               <span className="text-xs font-mono text-muted-foreground max-w-50 truncate block" title={path || ""}>
                  {filename || "--"}
               </span>
            );
         },
      },
      {
         id: "actions",
         cell: ({ row }) => {
            const status = row.original.backup_status;
            // Habilitamos descarga solo si fue exitoso y existe un path de archivo
            if ((status === "Success" || status === "Completado") && row.original.file_path) {
               return (
                  <div className="flex justify-end">
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/proxy/system/backup/download/${row.original.id}`, "_blank")}
                     >
                        <Download className="h-4 w-4" />
                     </Button>
                  </div>
               );
            }
            return null;
         },
      },
   ];

   return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Último Respaldo</CardTitle>
                  <DatabaseBackup className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold">
                     {initialData[0] ? format(new Date(initialData[0].backup_timestamp), "dd/MM") : "--"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                     {(initialData[0]?.backup_status === "Success" || initialData[0]?.backup_status === "Completado") ? "Completado exitosamente" : "Estado desconocido"}
                  </p>
               </CardContent>
            </Card>
         </div>

         <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h3 className="text-lg font-medium leading-6 text-foreground">Historial de Respaldos</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Registro de copias de seguridad automáticas y manuales.</p>
               </div>

               {/* BOTÓN DE BACKUP MANUAL AÑADIDO Y CONECTADO */}
               <Button onClick={() => backupMutation.mutate()} disabled={backupMutation.isPending}>
                  {backupMutation.isPending ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                     <PlayCircle className="mr-2 h-4 w-4" />
                  )}
                  Generar Backup Manual
               </Button>
            </div>

            {!initialData.length && (
               <Alert className="mb-4 shadow-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sin Registros</AlertTitle>
                  <AlertDescription>No se han encontrado registros de respaldos en el sistema.</AlertDescription>
               </Alert>
            )}

            <DataTable
               columns={columns}
               data={initialData}
               tableContainerClassName="shadow-sm"
            />
         </div>
      </div>
   );
}
