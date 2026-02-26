import { cookies } from "next/headers";
import { AuditoriaClient } from "./components/AuditoriaClient";
import { AuditLog } from "@/types/api";
import { format, subDays } from "date-fns";

interface AuditoriaPageProps {
   searchParams: Promise<{
      table_name?: string;
      operation?: string;
      username?: string;
      app_user_id?: string;
      start_date?: string;
      end_date?: string;
      page?: string;
   }>;
}

async function getAuditLogs(params: URLSearchParams): Promise<AuditLog[]> {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get("access_token")?.value;

   if (!accessToken) return [];

   const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auditoria/?${params.toString()}`;

   try {
      const response = await fetch(url, {
         headers: { Authorization: `Bearer ${accessToken}` },
         cache: "no-store",
      });

      if (!response.ok) {
         console.error(`[GET_AUDIT_LOGS_ERROR] Status: ${response.status}`);
         return [];
      }

      return response.json();
   } catch (error) {
      console.error("[GET_AUDIT_LOGS_ERROR]", error);
      return [];
   }
}

export default async function AuditoriaPage(props: AuditoriaPageProps) {
   const searchParams = await props.searchParams;
   const params = new URLSearchParams();

   if (searchParams.table_name) params.append("table_name", searchParams.table_name);
   if (searchParams.operation && searchParams.operation !== "none") params.append("operation", searchParams.operation);
   if (searchParams.username) params.append("username", searchParams.username);
   if (searchParams.app_user_id) params.append("app_user_id", searchParams.app_user_id);

   // 1. Tomamos las fechas limpias de la URL o generamos las por defecto
   const defaultStartDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
   const defaultEndDate = format(new Date(), "yyyy-MM-dd");

   const startDateStr = searchParams.start_date || defaultStartDate;
   const endDateStr = searchParams.end_date || defaultEndDate;

   try {
      // 2. Traducción para FastAPI: Convertimos "YYYY-MM-DD" a "YYYY-MM-DDTHH:mm:ss.sssZ" ($date-time)
      const startTime = new Date(`${startDateStr}T00:00:00`).toISOString();
      const endTime = new Date(`${endDateStr}T23:59:59.999`).toISOString();

      // 3. Enviamos usando los nombres exactos que exige el contrato OpenAPI
      params.append("start_time", startTime);
      params.append("end_time", endTime);
   } catch (error) {
      console.error("Error parseando fechas a ISO:", error);
   }

   const limit = 100;
   const page = Number(searchParams.page) || 1;
   const skip = (page - 1) * limit;

   params.append("limit", limit.toString());
   params.append("skip", skip.toString());

   const logs = await getAuditLogs(params);

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Log de Auditoría</h1>
            <p className="text-muted-foreground">
               Rastree todos los cambios y operaciones realizadas en el sistema.
            </p>
         </div>

         <AuditoriaClient initialData={logs} pageSize={limit} />
      </div>
   );
}
