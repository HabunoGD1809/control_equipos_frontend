"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BackupLog } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";


const columns: ColumnDef<BackupLog>[] = [
   {
      accessorKey: "backup_timestamp",
      header: "Fecha y Hora",
      cell: ({ row }) => {
         const date = new Date(row.getValue("backup_timestamp"));
         return format(date, "PPp", { locale: es });
      },
   },
   {
      accessorKey: "backup_type",
      header: "Tipo",
   },
   {
      accessorKey: "backup_status",
      header: "Estado",
      cell: ({ row }) => {
         const status = row.getValue("backup_status") as string;
         let variant: "default" | "secondary" | "destructive" = "secondary";
         if (status === "Completado" || status === "Completed") variant = "default";
         if (status === "Fallido" || status === "Failed") variant = "destructive";
         return <Badge variant={variant}>{status}</Badge>;
      },
   },
   {
      accessorKey: "duration",
      header: "Duración",
      cell: ({ row }) => {
         const duration = row.original.duration;
         return duration ? duration.split('.')[0] : "N/A";
      },
   },
   {
      accessorKey: "file_path",
      header: "Archivo",
      cell: ({ row }) => (
         <span className="truncate font-mono text-sm">
            {row.original.file_path || "N/A"}
         </span>
      ),
   },
   {
      accessorKey: "error_message",
      header: "Detalles",
      cell: ({ row }) => (
         <span className="text-destructive text-xs">
            {row.original.error_message || ""}
         </span>
      ),
   },
];

const filterSchema = z.object({
   backup_status: z.string().optional(),
   backup_type: z.string().optional(),
});

interface BackupsClientProps {
   data: BackupLog[];
}

export const BackupsClient: React.FC<BackupsClientProps> = ({ data }) => {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();

   const form = useForm<z.infer<typeof filterSchema>>({
      resolver: zodResolver(filterSchema),
      defaultValues: {
         backup_status: searchParams.get('backup_status') || '',
         backup_type: searchParams.get('backup_type') || '',
      }
   });

   function onSubmit(values: z.infer<typeof filterSchema>) {
      const params = new URLSearchParams(searchParams);
      Object.entries(values).forEach(([key, value]) => {
         if (value) {
            params.set(key, value);
         } else {
            params.delete(key);
         }
      });
      router.push(`${pathname}?${params.toString()}`);
   }

   const handleReset = () => {
      form.reset({ backup_status: '', backup_type: '' });
      router.push(pathname);
   }

   return (
      <div className="space-y-6">
         <Card>
            <CardHeader><CardTitle>Filtros de Backups</CardTitle></CardHeader>
            <CardContent>
               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                     <FormField control={form.control} name="backup_status" render={({ field }) => (
                        <FormItem><FormLabel>Estado</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger></FormControl>
                              <SelectContent>
                                 <SelectItem value="Completado">Completado</SelectItem>
                                 <SelectItem value="Fallido">Fallido</SelectItem>
                                 <SelectItem value="Iniciado">Iniciado</SelectItem>
                              </SelectContent>
                           </Select>
                        </FormItem>
                     )} />
                     <FormField control={form.control} name="backup_type" render={({ field }) => (
                        <FormItem><FormLabel>Tipo</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger></FormControl>
                              <SelectContent>
                                 <SelectItem value="Full">Full</SelectItem>
                                 <SelectItem value="Incremental">Incremental</SelectItem>
                                 <SelectItem value="BD">Base de Datos</SelectItem>
                                 <SelectItem value="Archivos">Archivos</SelectItem>
                              </SelectContent>
                           </Select>
                        </FormItem>
                     )} />
                     <div className="flex gap-2">
                        <Button type="submit">Filtrar</Button>
                        <Button type="button" variant="ghost" onClick={handleReset}><X className="h-4 w-4 mr-2" />Limpiar</Button>
                     </div>
                  </form>
               </Form>
            </CardContent>
         </Card>
         <DataTable columns={columns} data={data} />
      </div>
   );
};
