"use client";
import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { format, subDays } from "date-fns";
import { X } from "lucide-react";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { auditChanges, auditValue } from "@/lib/audit";
import type { AuditLog } from "@/types/api";

const schema = z.object({ table_name: z.string().optional(), operation: z.string().optional(), username: z.string().optional(), start_date: z.date(), end_date: z.date() })
   .refine(value => value.end_date >= value.start_date, { path: ["end_date"], message: "Hasta debe ser igual o posterior a Desde." });
const operationNames = { INSERT: "Creación", UPDATE: "Edición", DELETE: "Eliminación" };
const actorName = (log: AuditLog) => log.app_username || (log.username ? `Sistema (${log.username})` : "Sistema");
const parseDate = (value: string | null, fallback: Date) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T00:00:00") : fallback;
function Operation({ value }: { value: AuditLog["operation"] }) {
   const colors = { INSERT: "bg-emerald-500/10 text-emerald-600", UPDATE: "bg-sky-500/10 text-sky-600", DELETE: "bg-red-500/10 text-red-600" };
   return <span className={`rounded px-2 py-1 text-xs font-medium ${colors[value] ?? "bg-muted"}`}>{operationNames[value] ?? value}</span>;
}
export function AuditoriaClient({ initialData, hasNextPage }: { initialData: AuditLog[]; hasNextPage: boolean }) {
   const router = useRouter();
   const pathname = usePathname();
   const params = useSearchParams();
   const { setFilters } = useUrlFilters();
   const [selected, setSelected] = useState<AuditLog | null>(null);
   const currentPage = Math.max(1, Number(params.get("page")) || 1);
   const form = useForm<z.infer<typeof schema>>({ resolver: standardSchemaResolver(schema), defaultValues: {
      table_name: params.get("table_name") || "", operation: params.get("operation") || "none", username: params.get("username") || "",
      start_date: parseDate(params.get("start_date"), subDays(new Date(), 30)), end_date: parseDate(params.get("end_date"), new Date()),
   } });
   function submit(value: z.infer<typeof schema>) {
      setFilters({ table_name: value.table_name?.trim() || undefined, operation: value.operation === "none" ? undefined : value.operation,
         username: value.username?.trim() || undefined, start_date: format(value.start_date, "yyyy-MM-dd"), end_date: format(value.end_date, "yyyy-MM-dd"), tz_offset: new Date().getTimezoneOffset(), page: 1 });
   }
   const detailsButton = (log: AuditLog) => <Button type="button" variant="outline" size="sm" onClick={() => setSelected(log)}>Ver cambios</Button>;
   const columns: ColumnDef<AuditLog>[] = [
      { accessorKey: "audit_timestamp", header: "Fecha", cell: ({ row }) => <time dateTime={row.original.audit_timestamp} className="text-xs">{format(new Date(row.original.audit_timestamp), "dd/MM/yyyy HH:mm:ss")}</time> },
      { accessorKey: "table_name", header: "Entidad", cell: ({ row }) => <span className="text-sm [overflow-wrap:anywhere]">{row.original.table_name}</span> },
      { accessorKey: "operation", header: "Acción", cell: ({ row }) => <Operation value={row.original.operation} /> },
      { id: "actor", header: "Usuario", accessorFn: actorName },
      { id: "details", header: "Detalle", cell: ({ row }) => detailsButton(row.original) },
   ];
   const changes = selected ? auditChanges(selected.old_data, selected.new_data) : [];
   return <div className="min-w-0 space-y-6">
      <div className="rounded-lg border bg-card p-4"><Form {...form}><form onSubmit={form.handleSubmit(submit)} className="grid min-w-0 grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
         <FormField control={form.control} name="start_date" render={({ field }) => <FormItem><DatePickerField label="Desde" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>} />
         <FormField control={form.control} name="end_date" render={({ field }) => <FormItem><DatePickerField label="Hasta" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>} />
         <FormField control={form.control} name="table_name" render={({ field }) => <FormItem><FormLabel>Entidad</FormLabel><FormControl><Input placeholder="Ej: equipos" {...field} /></FormControl></FormItem>} />
         <FormField control={form.control} name="operation" render={({ field }) => <FormItem><FormLabel>Operación</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Todas</SelectItem><SelectItem value="INSERT">Creación</SelectItem><SelectItem value="UPDATE">Edición</SelectItem><SelectItem value="DELETE">Eliminación</SelectItem></SelectContent></Select></FormItem>} />
         <FormField control={form.control} name="username" render={({ field }) => <FormItem><FormLabel>Usuario</FormLabel><FormControl><Input placeholder="Nombre del usuario" {...field} /></FormControl></FormItem>} />
         <div className="flex flex-wrap gap-2"><Button type="submit" className="flex-1">Filtrar</Button><Button type="button" variant="outline" aria-label="Limpiar filtros" onClick={() => { form.reset({ table_name: "", username: "", operation: "none", start_date: subDays(new Date(), 30), end_date: new Date() }); router.push(pathname); }}><X className="h-4 w-4" /></Button></div>
      </form></Form></div>
      <div className="hidden md:block"><DataTable columns={columns} data={initialData} showPagination={false} showFilter={false} showColumnToggle={false} /></div>
      <div className="space-y-3 md:hidden">
         {initialData.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No hay cambios para los filtros seleccionados.</p>}
         {initialData.map(log => <article key={log.id + log.audit_timestamp} className="min-w-0 space-y-3 rounded-lg border bg-card p-4 [overflow-wrap:anywhere]">
            <div className="flex flex-wrap items-center justify-between gap-2"><Operation value={log.operation} /><time className="text-xs text-muted-foreground" dateTime={log.audit_timestamp}>{format(new Date(log.audit_timestamp), "dd/MM/yyyy HH:mm:ss")}</time></div>
            <p className="font-medium">{log.table_name}</p><p className="text-sm text-muted-foreground">Usuario: {actorName(log)}</p>{detailsButton(log)}
         </article>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-muted-foreground">Página {currentPage} · {initialData.length} registros</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setFilters({ page: currentPage - 1 })}>Anterior</Button><Button variant="outline" size="sm" disabled={!hasNextPage} onClick={() => setFilters({ page: currentPage + 1 })}>Siguiente</Button></div></div>
      <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Detalle del cambio</DialogTitle><DialogDescription>{selected && `${operationNames[selected.operation]} en ${selected.table_name} · ${actorName(selected)}`}</DialogDescription></DialogHeader>
         {selected && <div className="min-w-0 space-y-4">
            <p className="text-xs text-muted-foreground">{format(new Date(selected.audit_timestamp), "dd/MM/yyyy HH:mm:ss")}</p>
            {changes.length === 0 && <p className="text-sm">No hay cambios de contenido; se actualizó información de control.</p>}
            {changes.map(change => <section key={change.key} className="min-w-0 space-y-2 rounded-lg border p-3"><h3 className="font-medium [overflow-wrap:anywhere]">{change.key.replaceAll("_", " ")}</h3><div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
               <div className="min-w-0 rounded bg-red-500/5 p-3"><p className="mb-2 text-xs font-medium text-muted-foreground">Antes</p><pre className="whitespace-pre-wrap text-xs [overflow-wrap:anywhere]">{auditValue(change.before)}</pre></div>
               <div className="min-w-0 rounded bg-emerald-500/5 p-3"><p className="mb-2 text-xs font-medium text-muted-foreground">Después</p><pre className="whitespace-pre-wrap text-xs [overflow-wrap:anywhere]">{auditValue(change.after)}</pre></div>
            </div></section>)}
         </div>}
      </DialogContent></Dialog>
   </div>;
}
