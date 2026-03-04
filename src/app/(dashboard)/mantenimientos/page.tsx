import { cookies } from 'next/headers';
import { Mantenimiento, EquipoSimple, TipoMantenimiento, Proveedor } from "@/types/api";
import { MantenimientosClient } from "./components/MantenimientosClient";

// Helper genérico para obtener datos en el servidor
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

export default async function MantenimientosPage() {
   const [mantenimientos, equipos, tiposMantenimiento, proveedores] = await Promise.all([
      fetchData('/mantenimientos/?limit=200') as Promise<Mantenimiento[]>,
      fetchData('/equipos/?limit=500') as Promise<EquipoSimple[]>,
      fetchData('/catalogos/tipos-mantenimiento/') as Promise<TipoMantenimiento[]>,
      fetchData('/proveedores/?limit=500') as Promise<Proveedor[]>,
   ]);

   return (
      <div className="flex-1 space-y-6">
         <MantenimientosClient
            initialData={mantenimientos}
            equipos={equipos}
            tiposMantenimiento={tiposMantenimiento}
            proveedores={proveedores}
         />
      </div>
   );
}
