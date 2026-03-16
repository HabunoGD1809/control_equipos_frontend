import { MovimientosClient } from "./components/MovimientosClient";
import { movimientosServerService } from "@/app/services/movimientosService.server";
import { equiposServerService } from "@/app/services/equiposService.server";
import { usuariosServerService } from "@/app/services/usuariosService.server";
import { ubicacionesServerService } from "@/app/services/ubicacionesService.server";
import { PageHeader } from "@/components/layout/PageHeader";

async function getMovimientosPageData() {
   try {
      const [movimientos, equiposData, usuarios, ubicaciones] = await Promise.all([
         movimientosServerService.getAll({ limit: 200 }),
         equiposServerService.getAll({ limit: 500 }),
         usuariosServerService.getAll({ limit: 200 }),
         ubicacionesServerService.getAll({ limit: 200 }),
      ]);

      return {
         movimientos,
         equipos: equiposData,
         usuarios,
         ubicaciones,
      };
   } catch (error) {
      console.error("[GET_MOVIMIENTOS_PAGE_DATA_ERROR]", error);
      return { movimientos: [], equipos: [], usuarios: [], ubicaciones: [] };
   }
}

export default async function MovimientosPage() {
   const { movimientos, equipos, usuarios, ubicaciones } = await getMovimientosPageData();

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
            ubicaciones={ubicaciones}
         />
      </div>
   );
}
