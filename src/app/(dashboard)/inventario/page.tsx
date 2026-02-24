import { serverApi } from '@/lib/http-server';
import { InventarioStock, TipoItemInventario, Proveedor, EquipoSimple, InventarioMovimiento } from '@/types/api';
import { InventarioClient } from './components/InventarioClient';

export default async function InventarioPage() {
   const [stockData, tiposData, proveedores, equipos, movimientosData] = await Promise.all([
      serverApi.get<InventarioStock[]>("/inventario/stock", { params: { limit: 200 } }),
      serverApi.get<TipoItemInventario[]>("/inventario/tipos", { params: { limit: 200 } }),
      serverApi.get<Proveedor[]>("/proveedores", { params: { limit: 500 } }),
      serverApi.get<EquipoSimple[]>("/equipos", { params: { limit: 500 } }),
      serverApi.get<InventarioMovimiento[]>("/inventario/movimientos", { params: { limit: 200 } }),
   ]);

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
            <p className="text-muted-foreground">
               Administre el stock y los tipos de ítems de inventario (consumibles, partes, etc.).
            </p>
         </div>
         <InventarioClient
            initialStockData={stockData || []}
            initialTiposData={tiposData || []}
            proveedores={proveedores || []}
            equipos={equipos || []}
            initialMovimientosData={movimientosData || []}
         />
      </div>
   );
}
