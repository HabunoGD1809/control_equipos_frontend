import { cookies } from "next/headers";
import { Movimiento, EquipoRead } from "@/types/api";
import { MovimientosClient } from "./components/MovimientosClient";

async function getMovimientosPageData() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('access_token')?.value;

   if (!accessToken) {
      return { movimientos: [], equipos: [] };
   }

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [movimientosRes, equiposRes] = await Promise.all([
         fetch(`${baseUrl}/movimientos/?limit=200`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/equipos/?limit=1000`, { headers, cache: 'no-store' }) // Traemos todos los equipos para el formulario
      ]);

      const movimientos = movimientosRes.ok ? await movimientosRes.json() : [];
      const equipos = equiposRes.ok ? await equiposRes.json() : [];

      return { movimientos, equipos };

   } catch (error) {
      console.error("[GET_MOVIMIENTOS_PAGE_DATA_ERROR]", error);
      return { movimientos: [], equipos: [] };
   }
}

export default async function MovimientosPage() {
   const { movimientos, equipos } = await getMovimientosPageData();

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Historial de Movimientos</h1>
            <p className="text-muted-foreground">
               Consulta y registra todos los movimientos y asignaciones de equipos.
            </p>
         </div>
         <MovimientosClient initialData={movimientos} equipos={equipos} />
      </div>
   );
}
