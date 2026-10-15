import { guardPage, getPageUser } from "@/lib/page-access";
import { hasPermission } from "@/lib/permissions";
import { serverCollection } from "@/lib/server-collections";
import { MovimientosClient } from "./components/MovimientosClient";
import type { Movimiento, EquipoRead, Ubicacion } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function MovimientosPage() {
   const pageAccessDenied = await guardPage("/movimientos");
   if (pageAccessDenied) return pageAccessDenied;

   const user = await getPageUser();
   const canRegister = hasPermission(user, ['registrar_movimientos']);
   const [movimientos, equipos, ubicaciones] = await Promise.all([
      serverCollection<Movimiento>('/movimientos/'),
      canRegister && hasPermission(user, ['ver_equipos']) ? serverCollection<EquipoRead>('/equipos/') : [],
      canRegister ? serverCollection<Ubicacion>('/ubicaciones/') : [],
   ]);

   return (
      <div className="flex-1 space-y-6">
         <PageHeader
            title="Historial de Movimientos"
            description="Consulta y registra todos los movimientos y asignaciones de equipos."
         />
         <MovimientosClient
            initialData={movimientos}
            equipos={equipos}
            ubicaciones={ubicaciones}
         />
      </div>
   );
}
