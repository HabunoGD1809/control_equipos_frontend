import { serverApi } from '@/lib/http-server';
import { InventarioStock } from '@/types/api';
import { InventarioClient } from './components/InventarioClient';
import { PageHeader } from '@/components/layout/PageHeader';


export default async function InventarioPage() {
   const stockData = await serverApi.get<InventarioStock[]>("/inventario/stock", {
      params: { limit: 200 },
   });

   return (
      <div className="flex-1 space-y-6">
         <PageHeader
            title="Gestión de Inventario"
            description="Administre el stock y los tipos de ítems de inventario (consumibles, partes, etc.)."
         />
         <InventarioClient initialStockData={stockData || []} />
      </div>
   );
}
