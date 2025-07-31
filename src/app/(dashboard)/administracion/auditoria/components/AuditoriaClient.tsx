"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from 'date-fns';
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/ui/DataTable";
import { AuditLog } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

const columns: ColumnDef<AuditLog>[] = [
    {
        accessorKey: "audit_timestamp",
        header: "Fecha y Hora",
        cell: ({ row }) => format(new Date(row.getValue("audit_timestamp")), 'dd/MM/yyyy HH:mm:ss'),
    },
    {
        accessorKey: "table_name",
        header: "Tabla Afectada",
    },
    {
        accessorKey: "operation",
        header: "Operación",
    },
    {
        accessorKey: "username",
        header: "Usuario DB",
    },
    {
        accessorKey: "app_user_id",
        header: "Usuario App (ID)",
    },
    {
        accessorKey: "old_data",
        header: "Datos Antiguos",
        cell: ({ row }) => <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">{JSON.stringify(row.original.old_data, null, 2)}</pre>
    },
    {
        accessorKey: "new_data",
        header: "Datos Nuevos",
        cell: ({ row }) => <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">{JSON.stringify(row.original.new_data, null, 2)}</pre>
    }
];

const filterSchema = z.object({
    table_name: z.string().optional(),
    operation: z.string().optional(),
    username: z.string().optional(),
});

interface AuditoriaClientProps {
    initialData: AuditLog[];
}

export function AuditoriaClient({ initialData }: AuditoriaClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const form = useForm<z.infer<typeof filterSchema>>({
        resolver: zodResolver(filterSchema),
        defaultValues: {
            table_name: searchParams.get('table_name') || '',
            operation: searchParams.get('operation') || '',
            username: searchParams.get('username') || '',
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
        form.reset({ table_name: '', operation: '', username: '' });
        router.push(pathname);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filtros de Auditoría</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <FormField control={form.control} name="table_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de la Tabla</FormLabel>
                                    <FormControl><Input placeholder="Ej: equipos" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="operation" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Operación</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="INSERT">INSERT</SelectItem>
                                            <SelectItem value="UPDATE">UPDATE</SelectItem>
                                            <SelectItem value="DELETE">DELETE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usuario DB</FormLabel>
                                    <FormControl><Input placeholder="Ej: postgres" {...field} /></FormControl>
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
            <DataTable columns={columns} data={initialData} />
        </div>
    );
}
