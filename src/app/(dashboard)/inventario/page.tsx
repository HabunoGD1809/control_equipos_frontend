import { guardPage } from "@/lib/page-access";
import { serverApi } from '@/lib/http-server';
import { InventarioStock } from '@/types/api';
import { InventarioClient } from './components/InventarioClient';
import { PageHeader } from '@/components/layout/PageHeader';
import { collectPages } from '@/lib/collection-pages';


export default async function InventarioPage() {
   const pageAccessDenied = await guardPage("/inventario");
   if (pageAccessDenied) return pageAccessDenied;

   const stockData = await collectPages((skip, limit) => serverApi.get<InventarioStock[]>("/inventario/stock/", { params: { skip, limit } }));

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
