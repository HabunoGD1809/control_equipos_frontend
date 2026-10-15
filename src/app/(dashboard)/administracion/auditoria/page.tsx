import { guardPage } from "@/lib/page-access";
import { serverApi } from "@/lib/http-server";
import { auditDateRange } from "@/lib/audit";
import { AuditoriaClient } from "./components/AuditoriaClient";
import type { AuditLog } from "@/types/api";
import { format, subDays } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
   const pageAccessDenied = await guardPage("/administracion/auditoria");
   if (pageAccessDenied) return pageAccessDenied;
   const values = await searchParams;
   const start = values.start_date || format(subDays(new Date(), 30), "yyyy-MM-dd");
   const end = values.end_date || format(new Date(), "yyyy-MM-dd");
   let range;
   try { range = auditDateRange(start, end, values.tz_offset === undefined ? new Date().getTimezoneOffset() : Number(values.tz_offset)); }
   catch { return <p role="alert" className="rounded-lg border p-4">El rango de fechas no es válido. Vuelve a Auditoría para seleccionar otro rango.</p>; }
   const page = Math.max(1, Math.floor(Number(values.page) || 1));
   const limit = 25;
   const rows = await serverApi.get<AuditLog[]>("/auditoria/", { params: { ...range, table_name: values.table_name || undefined, operation: values.operation && values.operation !== "none" ? values.operation : undefined, username: values.username || undefined, app_user_id: values.app_user_id || undefined, skip: (page - 1) * limit, limit: limit + 1 } });
   return <div className="min-w-0 space-y-6"><PageHeader title="Auditoría" description="Consulta quién cambió cada registro y revisa los valores anteriores y nuevos." /><AuditoriaClient initialData={rows.slice(0, limit)} hasNextPage={rows.length > limit} /></div>;
}
