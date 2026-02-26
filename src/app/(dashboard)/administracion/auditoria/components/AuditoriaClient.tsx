"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { X, ArrowRight } from "lucide-react";

import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

import { AuditLog } from "@/types/api";
import { auditFilterSchema } from "@/lib/zod";
import { useUrlFilters } from "@/hooks/useUrlFilters";

const DataDiffViewer = ({ oldData, newData }: { oldData: any; newData: any }) => {
  if (!oldData && !newData) return <span className="text-muted-foreground text-xs">-</span>;

  if (!oldData && newData) {
    return (
      <div className="space-y-1">
        <div className="text-[10px] font-bold text-emerald-500 mb-1 uppercase tracking-wider">Nuevo Registro</div>
        {Object.entries(newData).map(([key, value]) => (
          <div key={key} className="grid grid-cols-[minmax(140px,auto)_1fr] gap-2 text-xs border-b border-border last:border-0 pb-0.5">
            <span className="font-medium text-muted-foreground">{key}:</span>
            <span className="text-foreground break-all">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (oldData && !newData) {
    return (
      <div className="space-y-1 opacity-80">
        <div className="text-[10px] font-bold text-red-500 mb-1 uppercase tracking-wider">Registro Eliminado</div>
        <div className="text-xs text-muted-foreground">ID: {oldData.id || "N/A"}</div>
      </div>
    );
  }

  const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]));
  const changes = allKeys.filter((key) => JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key]) && key !== "updated_at");

  if (changes.length === 0) return <span className="text-muted-foreground text-xs italic">Actualización técnica</span>;

  return (
    <div className="space-y-1.5">
      {changes.map((key) => (
        <div key={key} className="text-xs bg-muted/40 p-2 rounded border border-border">
          <span className="block font-semibold text-muted-foreground mb-1 text-[10px] uppercase">{key}</span>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <span className="text-red-500 bg-red-500/10 px-1 rounded truncate line-through decoration-red-400/50" title={String(oldData?.[key])}>
              {String(oldData?.[key])}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded font-medium break-all" title={String(newData?.[key])}>
              {String(newData?.[key])}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "audit_timestamp",
    header: "Fecha",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-xs font-semibold">{format(new Date(row.getValue("audit_timestamp")), "dd/MM/yy")}</span>
        <span className="text-[10px] text-muted-foreground">{format(new Date(row.getValue("audit_timestamp")), "HH:mm:ss")}</span>
      </div>
    ),
  },
  {
    accessorKey: "table_name",
    header: "Entidad",
    cell: ({ row }) => <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">{row.getValue("table_name")}</span>,
  },
  {
    accessorKey: "operation",
    header: "Acción",
    cell: ({ row }) => {
      const op = row.getValue("operation") as string;
      const colors: Record<string, string> = {
        INSERT: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        UPDATE: "text-sky-500 bg-sky-500/10 border-sky-500/20",
        DELETE: "text-red-500 bg-red-500/10 border-red-500/20",
      };
      return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[op] || "text-muted-foreground bg-muted/40 border-border"}`}>{op}</span>;
    },
  },
  {
    accessorKey: "username",
    header: "Usuario",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs">
        <span className="font-medium">{row.original.username}</span>
        {row.original.app_user_id && <span className="text-[10px] text-muted-foreground font-mono">APP-ID: {row.original.app_user_id.toString().substring(0, 6)}...</span>}
      </div>
    ),
  },
  {
    id: "diff",
    header: "Detalles del Cambio",
    cell: ({ row }) => <div className="min-w-88 max-w-2xl"><DataDiffViewer oldData={row.original.old_data} newData={row.original.new_data} /></div>,
  },
];

interface AuditoriaClientProps {
  initialData: AuditLog[];
}

export function AuditoriaClient({ initialData }: AuditoriaClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setFilters } = useUrlFilters();

  const currentPage = Number(searchParams.get("page")) || 1;
  const limit = 20;
  const hasNextPage = initialData.length === limit;

  const form = useForm<z.infer<typeof auditFilterSchema>>({
    resolver: standardSchemaResolver(auditFilterSchema),
    defaultValues: {
      table_name: searchParams.get("table_name") || "",
      operation: searchParams.get("operation") || "",
      username: searchParams.get("username") || "",
    },
  });

  function onSubmit(values: z.infer<typeof auditFilterSchema>) {
    setFilters({ ...values, page: 1 });
  }

  const handleReset = () => {
    form.reset({ table_name: "", operation: "", username: "" });
    router.push(pathname);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-4 rounded-md border shadow-sm bg-muted/20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <FormField control={form.control} name="table_name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Entidad / Tabla</FormLabel>
                <FormControl><Input placeholder="Ej: equipos" className="h-9 text-sm bg-background" {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="operation" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Operación</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl><SelectTrigger className="h-9 text-sm bg-background"><SelectValue placeholder="Todas" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Todas</SelectItem>
                    <SelectItem value="INSERT">Creación</SelectItem>
                    <SelectItem value="UPDATE">Edición</SelectItem>
                    <SelectItem value="DELETE">Eliminación</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Usuario DB</FormLabel>
                <FormControl><Input placeholder="postgres" className="h-9 text-sm bg-background" {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )} />

            <div className="flex gap-2">
              <Button type="submit" className="h-9 flex-1 shadow-sm">Filtrar</Button>
              <Button type="button" variant="outline" onClick={handleReset} className="h-9 px-3 bg-background shadow-sm" aria-label="Limpiar filtros">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={initialData}
          showPagination={false}
          showFilter={false}
          showColumnToggle={false}
          tableContainerClassName="shadow-sm"
        />

        <div className="flex items-center justify-between px-2 text-sm">
          <div className="text-muted-foreground">
            Página <span className="font-medium text-foreground">{currentPage}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilters({ page: currentPage - 1 })} disabled={currentPage <= 1}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFilters({ page: currentPage + 1 })} disabled={!hasNextPage}>
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
