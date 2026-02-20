"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DatabaseBackup, Download, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import type { BackupLog } from "@/types/api";
import { api } from "@/lib/http";

interface BackupsClientProps {
   initialData: BackupLog[];
}

// Helper mínimo para extraer mensaje del error del nuevo api()
function getErrorMessage(err: unknown, fallback = "Ocurrió un error inesperado.") {
   if (typeof err === "object" && err && "message" in err) return String((err as any).message);
   if (typeof err === "string") return err;
   return fallback;
}

export function BackupsClient({ initialData }: BackupsClientProps) {
   const router = useRouter();
   const { toast } = useToast();
   const [isBackingUp, setIsBackingUp] = useState(false);

   const handleCreateBackup = async () => {
      setIsBackingUp(true);
      try {
         await api.post("/system/backup/trigger", undefined);

         toast({
            title: "Proceso Iniciado",
            description: "El respaldo de la base de datos ha comenzado en segundo plano.",
         });

         // refrescar para ver el nuevo log
         setTimeout(() => router.refresh(), 2000);
      } catch (error) {
         console.error(error);
         toast({
            variant: "destructive",
            title: "Error",
            description: getErrorMessage(error, "No se pudo iniciar el respaldo. Revise los logs del servidor."),
         });
      } finally {
         setIsBackingUp(false);
      }
   };

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
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
               {String(row.getValue("backup_type") ?? "")}
            </span>
         ),
      },
      {
         accessorKey: "backup_status",
         header: "Estado",
         cell: ({ row }) => {
            const status = String(row.getValue("backup_status") ?? "");
            if (status === "Success") {
               return (
                  <div className="flex items-center text-green-600">
                     <CheckCircle2 className="mr-1 h-4 w-4" /> Exitoso
                  </div>
               );
            }
            if (status === "Error") {
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
                  <span className="text-xs text-red-500 max-w-50 truncate" title={error}>
                     {error}
                  </span>
               );
            }

            const filename = path?.split("/").pop();
            return (
               <span className="text-xs font-mono text-muted-foreground max-w-50 truncate" title={path || ""}>
                  {filename || "--"}
               </span>
            );
         },
      },
      {
         id: "actions",
         cell: ({ row }) => {
            const status = row.original.backup_status;

            if (status === "Success" && row.original.file_path) {
               return (
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => window.open(`/api/proxy/system/backup/download/${row.original.id}`, "_blank")}
                  >
                     <Download className="h-4 w-4" />
                  </Button>
               );
            }

            return null;
         },
      },
   ];

   return (
      <div className="space-y-6">
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Último Respaldo</CardTitle>
                  <DatabaseBackup className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold">
                     {initialData[0] ? format(new Date(initialData[0].backup_timestamp), "dd/MM") : "--"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                     {initialData[0]?.backup_status === "Success" ? "Completado exitosamente" : "Estado desconocido"}
                  </p>
               </CardContent>
            </Card>
         </div>

         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle>Historial de Respaldos</CardTitle>
                  <CardDescription>Registro de copias de seguridad automáticas y manuales.</CardDescription>
               </div>

               <Button onClick={handleCreateBackup} disabled={isBackingUp}>
                  {isBackingUp ? (
                     <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                     </>
                  ) : (
                     <>
                        <DatabaseBackup className="mr-2 h-4 w-4" /> Crear Respaldo Ahora
                     </>
                  )}
               </Button>
            </CardHeader>

            <CardContent>
               {!initialData.length && (
                  <Alert className="mb-4">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Sin Registros</AlertTitle>
                     <AlertDescription>No se han encontrado registros de respaldos en el sistema.</AlertDescription>
                  </Alert>
               )}

               <DataTable columns={columns} data={initialData} />
            </CardContent>
         </Card>
      </div>
   );
}
