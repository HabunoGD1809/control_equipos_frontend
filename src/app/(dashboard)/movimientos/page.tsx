import { MovimientosClient } from "./components/MovimientosClient";
import { movimientosServerService } from "@/app/services/movimientosService.server";
import { equiposServerService } from "@/app/services/equiposService.server";
import { usuariosServerService } from "@/app/services/usuariosService.server";
import { PageHeader } from "@/components/layout/PageHeader";

async function getMovimientosPageData() {
   try {
      const [movimientos, equiposData, usuarios] = await Promise.all([
         movimientosServerService.getAll({ limit: 200 }),
         equiposServerService.getAll({ limit: 500 }),
         usuariosServerService.getAll({ limit: 200 }),
      ]);

      return {
         movimientos,
         equipos: equiposData,
         usuarios,
      };
   } catch (error) {
      console.error("[GET_MOVIMIENTOS_PAGE_DATA_ERROR]", error);
      return { movimientos: [], equipos: [], usuarios: [] };
   }
}

export default async function MovimientosPage() {
   const { movimientos, equipos, usuarios } = await getMovimientosPageData();

   return (
      <div className="flex-1 space-y-6">
         <PageHeader
            title="Historial de Movimientos"
            description="Consulta y registra todos los movimientos y asignaciones de equipos."
         />
         <MovimientosClient
            initialData={movimientos}
            equipos={equipos}
            usuarios={usuarios}
         />
      </div>
   );
}
