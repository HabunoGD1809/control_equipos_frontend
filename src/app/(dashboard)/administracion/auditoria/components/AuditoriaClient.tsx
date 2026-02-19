"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";

import { DataTable } from "@/components/ui/DataTable";
import { AuditLog } from "@/types/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { X, ArrowRight } from "lucide-react";

const DataDiffViewer = ({
  oldData,
  newData,
}: {
  oldData: any;
  newData: any;
}) => {
  if (!oldData && !newData) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  // INSERT
  if (!oldData && newData) {
    return (
      <div className="space-y-1">
        <div className="text-[10px] font-bold text-emerald-500 mb-1 uppercase tracking-wider">
          Nuevo Registro
        </div>

        {Object.entries(newData).map(([key, value]) => (
          <div
            key={key}
            className="grid grid-cols-[minmax(140px,auto)_1fr] gap-2 text-xs border-b border-border last:border-0 pb-0.5"
          >
            <span className="font-medium text-muted-foreground">{key}:</span>
            <span className="text-foreground break-all">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  }

  // DELETE
  if (oldData && !newData) {
    return (
      <div className="space-y-1 opacity-80">
        <div className="text-[10px] font-bold text-red-500 mb-1 uppercase tracking-wider">
          Registro Eliminado
        </div>
        <div className="text-xs text-muted-foreground">
          ID: {oldData.id || "N/A"}
        </div>
      </div>
    );
  }

  // UPDATE - solo cambios
  const allKeys = Array.from(
    new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]),
  );

  const changes = allKeys.filter(
    (key) =>
      JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key]) &&
      key !== "updated_at",
  );

  if (changes.length === 0) {
    return (
      <span className="text-muted-foreground text-xs italic">
        Actualización técnica (timestamp)
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      {changes.map((key) => (
        <div
          key={key}
          className="text-xs bg-muted/40 p-2 rounded border border-border"
        >
          <span className="block font-semibold text-muted-foreground mb-1 text-[10px] uppercase">
            {key}
          </span>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <span
              className="text-red-500 bg-red-500/10 px-1 rounded truncate line-through decoration-red-400/50"
              title={String(oldData?.[key])}
            >
              {String(oldData?.[key])}
            </span>

            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

            <span
              className="text-emerald-500 bg-emerald-500/10 px-1 rounded font-medium break-all"
              title={String(newData?.[key])}
            >
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
        <span className="text-xs font-semibold">
          {format(new Date(row.getValue("audit_timestamp")), "dd/MM/yy")}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(row.getValue("audit_timestamp")), "HH:mm:ss")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "table_name",
    header: "Entidad",
    cell: ({ row }) => (
      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">
        {row.getValue("table_name")}
      </span>
    ),
  },
  {
    accessorKey: "operation",
    header: "Acción",
    cell: ({ row }) => {
      const op = row.getValue("operation") as string;

      const colors =
        {
          INSERT: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          UPDATE: "text-sky-500 bg-sky-500/10 border-sky-500/20",
          DELETE: "text-red-500 bg-red-500/10 border-red-500/20",
        }[op] || "text-muted-foreground bg-muted/40 border-border";

      return (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors}`}
        >
          {op}
        </span>
      );
    },
  },
  {
    accessorKey: "username",
    header: "Usuario",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs">
        <span className="font-medium">{row.original.username}</span>
        {row.original.app_user_id && (
          <span className="text-[10px] text-muted-foreground font-mono">
            APP-ID: {row.original.app_user_id.toString().substring(0, 6)}...
          </span>
        )}
      </div>
    ),
  },
  {
    id: "diff",
    header: "Detalles del Cambio",
    cell: ({ row }) => (
      <div className="min-w-88 max-w-2xl">
        <DataDiffViewer
          oldData={row.original.old_data}
          newData={row.original.new_data}
        />
      </div>
    ),
  },
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
    resolver: standardSchemaResolver(filterSchema),
    defaultValues: {
      table_name: searchParams.get("table_name") || "",
      operation: searchParams.get("operation") || "",
      username: searchParams.get("username") || "",
    },
  });

  function onSubmit(values: z.infer<typeof filterSchema>) {
    const params = new URLSearchParams(searchParams);

    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    router.push(`${pathname}?${params.toString()}`);
  }

  const handleReset = () => {
    form.reset({ table_name: "", operation: "", username: "" });
    router.push(pathname);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col sm:flex-row gap-4 items-end"
            >
              <FormField
                control={form.control}
                name="table_name"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel className="text-xs">Entidad / Tabla</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: equipos"
                        className="h-8 text-sm"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operation"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-40">
                    <FormLabel className="text-xs">Operación</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="INSERT">Creación</SelectItem>
                        <SelectItem value="UPDATE">Edición</SelectItem>
                        <SelectItem value="DELETE">Eliminación</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel className="text-xs">Usuario DB</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="postgres"
                        className="h-8 text-sm"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="submit" size="sm" className="h-8">
                  Filtrar
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-2"
                  aria-label="Reset filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-base font-semibold">Resultados</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto border-t border-border">
            <DataTable columns={columns} data={initialData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
