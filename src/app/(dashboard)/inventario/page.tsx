import { cookies } from 'next/headers';
import { InventarioStock, TipoItemInventario, Proveedor, EquipoSimple } from '@/types/api';
import { InventarioClient } from './components/InventarioClient';

async function fetchData(endpoint: string) {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return [];

   try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!res.ok) {
         console.error(`Error fetching ${endpoint}: ${res.status} ${res.statusText}`);
         return [];
      }
      return res.json();
   } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
   }
}

export default async function InventarioPage() {
   const [stockData, tiposData, proveedores, equipos] = await Promise.all([
      fetchData('/inventario/stock/?limit=200') as Promise<InventarioStock[]>,
      fetchData('/inventario/tipos/?limit=200') as Promise<TipoItemInventario[]>,
      fetchData('/proveedores/?limit=500') as Promise<Proveedor[]>,
      fetchData('/equipos/?limit=500') as Promise<EquipoSimple[]>,
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
            initialStockData={Array.isArray(stockData) ? stockData : []}
            initialTiposData={Array.isArray(tiposData) ? tiposData : []}
            proveedores={Array.isArray(proveedores) ? proveedores : []}
            equipos={Array.isArray(equipos) ? equipos : []}
         />
      </div>
   );
}
