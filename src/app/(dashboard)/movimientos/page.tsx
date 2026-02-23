import { MovimientosClient } from "./components/MovimientosClient";
import { movimientosServerService } from "@/app/services/movimientosService.server";
import { equiposServerService } from "@/app/services/equiposService.server";
import { usuariosServerService } from "@/app/services/usuariosService.server";

async function getMovimientosPageData() {
   try {
      const [movimientos, equiposData, usuarios] = await Promise.all([
         movimientosServerService.getAll({ limit: 200 }),
         equiposServerService.getAll({ limit: 500 }),
         usuariosServerService.getAll({ limit: 200 }),
      ]);

      return {
         movimientos,
         equipos: equiposData.items,
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
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Historial de Movimientos</h1>
            <p className="text-muted-foreground">
               Consulta y registra todos los movimientos y asignaciones de equipos.
            </p>
         </div>
         <MovimientosClient
            initialData={movimientos}
            equipos={equipos}
            usuarios={usuarios}
         />
      </div>
   );
}
