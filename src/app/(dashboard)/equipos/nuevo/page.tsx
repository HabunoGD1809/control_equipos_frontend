import { cookies } from 'next/headers';
import { EquipoForm } from "@/components/features/equipos/EquipoForm";
import { EstadoEquipo, Proveedor } from "@/types/api";

// Helper genérico para obtener catálogos
async function fetchCatalog<T>(endpoint: string): Promise<T[]> {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return [];
   try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!res.ok) return [];
      return res.json();
   } catch (error: unknown) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
   }
}

export default async function NuevoEquipoPage() {
   const [estados, proveedores] = await Promise.all([
      fetchCatalog<EstadoEquipo>('/catalogos/estados-equipo/'),
      fetchCatalog<Proveedor>('/proveedores/'),
   ]);

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Registrar Nuevo Equipo</h1>
            <p className="text-muted-foreground">
               Complete los detalles del nuevo activo.
            </p>
         </div>
         <EquipoForm estados={estados} proveedores={proveedores} />
      </div>
   );
}
