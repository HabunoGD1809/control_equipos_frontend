import { cookies } from 'next/headers';
import { Proveedor } from "@/types/api";
import { ProveedoresClient } from "./components/ProveedoresClient";

async function getProveedores(): Promise<Proveedor[]> {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return [];

   try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/proveedores/?limit=500`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!res.ok) {
         console.error(`Error fetching proveedores: ${res.status} ${res.statusText}`);
         return [];
      }
      return res.json();
   } catch (error) {
      console.error(`Error fetching proveedores:`, error);
      return [];
   }
}

export default async function ProveedoresPage() {
   const proveedores = await getProveedores();
   const safeProveedores = Array.isArray(proveedores) ? proveedores : [];

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Proveedores</h1>
            <p className="text-muted-foreground">
               Cree, edite y administre todos los proveedores de su organización.
            </p>
         </div>
         <ProveedoresClient initialData={safeProveedores} />
      </div>
   );
}
