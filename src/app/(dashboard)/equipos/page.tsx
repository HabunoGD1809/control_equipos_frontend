import { cookies } from 'next/headers';
import { EquipoRead, EstadoEquipo, Proveedor } from "@/types/api";
import { EquiposClient } from "./components/EquiposClient";

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

export default async function EquiposPage() {
   const [equipos, estados, proveedores] = await Promise.all([
      fetchData('/equipos/?limit=200') as Promise<EquipoRead[]>,
      fetchData('/catalogos/estados-equipo/') as Promise<EstadoEquipo[]>,
      fetchData('/proveedores/') as Promise<Proveedor[]>,
   ]);

   const safeEquipos = Array.isArray(equipos) ? equipos : [];
   const safeEstados = Array.isArray(estados) ? estados : [];
   const safeProveedores = Array.isArray(proveedores) ? proveedores : [];

   return (
      <div className="space-y-8">
         <EquiposClient
            initialData={safeEquipos}
            estados={safeEstados}
            proveedores={safeProveedores}
         />
      </div>
   );
}
