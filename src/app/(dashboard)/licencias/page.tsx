import { cookies } from 'next/headers';
import { LicenciasClient } from "./components/LicenciasClient";
import { LicenciaSoftware, SoftwareCatalogo, Proveedor, EquipoSimple, UsuarioSimple } from "@/types/api";

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

export default async function LicenciasPage() {
   const [licencias, catalogo, proveedores, equipos, usuarios] = await Promise.all([
      fetchData('/licencias/?limit=200') as Promise<LicenciaSoftware[]>,
      fetchData('/licencias/catalogo/?limit=200') as Promise<SoftwareCatalogo[]>,
      fetchData('/proveedores/?limit=500') as Promise<Proveedor[]>,
      fetchData('/equipos/?limit=500') as Promise<EquipoSimple[]>,
      fetchData('/usuarios/?limit=200') as Promise<UsuarioSimple[]>,
   ]);

   const safeLicencias = Array.isArray(licencias) ? licencias : [];
   const safeCatalogo = Array.isArray(catalogo) ? catalogo : [];
   const safeProveedores = Array.isArray(proveedores) ? proveedores : [];
   const safeEquipos = Array.isArray(equipos) ? equipos : [];
   const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Licencias de Software</h1>
            <p className="text-muted-foreground">
               Administre el catálogo de software, licencias adquiridas y sus asignaciones.
            </p>
         </div>
         <LicenciasClient
            initialLicencias={safeLicencias}
            initialCatalogo={safeCatalogo}
            proveedores={safeProveedores}
            equipos={safeEquipos}
            usuarios={safeUsuarios}
         />
      </div>
   );
}
