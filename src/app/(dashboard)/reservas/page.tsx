import { guardPage, getPageUser } from "@/lib/page-access";
import { hasPermission } from "@/lib/permissions";
import { serverCollection } from "@/lib/server-collections";
import { ReservaEquipo, EquipoSimple } from "@/types/api";
import { ReservasClient } from "./components/ReservasClient";

export default async function ReservasPage() {
   const pageAccessDenied = await guardPage("/reservas");
   if (pageAccessDenied) return pageAccessDenied;
   const user = await getPageUser();

   const [reservas, equipos] = await Promise.all([
      serverCollection<ReservaEquipo>('/reservas/'),
      hasPermission(user, ['ver_equipos']) ? serverCollection<EquipoSimple>('/equipos/') : [],
   ]);

   const safeReservas = Array.isArray(reservas) ? reservas : [];
   const safeEquipos = Array.isArray(equipos) ? equipos : [];

   return (
      <div className="flex-1 space-y-6">
         <ReservasClient initialEvents={safeReservas} equipos={safeEquipos} />
      </div>
   );
}
