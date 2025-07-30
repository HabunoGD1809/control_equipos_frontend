import { cookies } from 'next/headers';
import { InventarioClient } from "./components/InventarioClient";
import { InventarioStock, TipoItemInventario, EquipoSimple, Proveedor } from "@/types/api";

async function getInventarioData() {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return { stock: [], tipos: [], equipos: [], proveedores: [] };

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [stockRes, tiposRes, equiposRes, proveedoresRes] = await Promise.all([
         fetch(`${baseUrl}/inventario/stock/?limit=500`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/inventario/tipos/?limit=500`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/equipos/?limit=1000`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/proveedores/?limit=1000`, { headers, cache: 'no-store' })
      ]);

      const stock: InventarioStock[] = stockRes.ok ? await stockRes.json() : [];
      const tipos: TipoItemInventario[] = tiposRes.ok ? await tiposRes.json() : [];
      const equipos: EquipoSimple[] = equiposRes.ok ? await equiposRes.json() : [];
      const proveedores: Proveedor[] = proveedoresRes.ok ? await proveedoresRes.json() : [];

      return { stock, tipos, equipos, proveedores };
   } catch (error) {
      console.error("[GET_INVENTARIO_DATA_ERROR]", error);
      return { stock: [], tipos: [], equipos: [], proveedores: [] };
   }
}

export default async function InventarioPage() {
   const { stock, tipos, equipos, proveedores } = await getInventarioData();

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
            <p className="text-muted-foreground">
               Consulta el stock actual, gestiona tipos de ítems y registra movimientos.
            </p>
         </div>
         <InventarioClient
            initialStockData={stock}
            initialTiposData={tipos}
            equipos={equipos}
            proveedores={proveedores}
         />
      </div>
   );
}
