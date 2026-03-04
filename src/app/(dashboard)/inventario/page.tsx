import { serverApi } from '@/lib/http-server';
import { InventarioStock, TipoItemInventario, Proveedor, EquipoSimple, InventarioMovimiento } from '@/types/api';
import { InventarioClient } from './components/InventarioClient';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function InventarioPage() {
   const [stockData, tiposData, proveedores, equipos, movimientosData] = await Promise.all([
      serverApi.get<InventarioStock[]>("/inventario/stock", { params: { limit: 200 } }),
      serverApi.get<TipoItemInventario[]>("/inventario/tipos", { params: { limit: 200 } }),
      serverApi.get<Proveedor[]>("/proveedores", { params: { limit: 500 } }),
      serverApi.get<EquipoSimple[]>("/equipos", { params: { limit: 500 } }),
      serverApi.get<InventarioMovimiento[]>("/inventario/movimientos", { params: { limit: 200 } }),
   ]);

   return (
      <div className="flex-1 space-y-6">
         <PageHeader
            title="Gestión de Inventario"
            description="Administre el stock y los tipos de ítems de inventario (consumibles, partes, etc.)."
         />
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
