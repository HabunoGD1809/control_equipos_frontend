import { cookies } from 'next/headers';
import { LicenciasClient } from "./components/LicenciasClient";
import { LicenciaSoftware, SoftwareCatalogo, Proveedor, EquipoSimple, UsuarioSimple, AsignacionLicencia } from "@/types/api";

async function fetchData(endpoint: string, options: RequestInit = { cache: 'no-store' }) {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('access_token')?.value;

   if (!accessToken) return [];

   try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         ...options
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
   // 2. Separamos las estrategias de caché
   // Estas opciones mantendrán los datos pesados en memoria por 5 minutos (300 segundos)
   const cachedOptions: RequestInit = { next: { revalidate: 300 } };

   const [licencias, catalogo, asignaciones, proveedores, equipos, usuarios] = await Promise.all([
      // --- DATOS DINÁMICOS (no-store por defecto): Siempre frescos al hacer router.refresh() ---
      fetchData('/licencias/?limit=200') as Promise<LicenciaSoftware[]>,
      fetchData('/licencias/catalogo/?limit=200') as Promise<SoftwareCatalogo[]>,
      fetchData('/licencias/asignaciones/?limit=200') as Promise<AsignacionLicencia[]>,

      // --- DATOS DE REFERENCIA (Cacheados): No saturan la BD en cada recarga ---
      fetchData('/proveedores/?limit=500', cachedOptions) as Promise<Proveedor[]>,
      fetchData('/equipos/?limit=500', cachedOptions) as Promise<EquipoSimple[]>,
      fetchData('/usuarios/?limit=200', cachedOptions) as Promise<UsuarioSimple[]>,
   ]);

   // 3. Validación segura de arrays
   const safeLicencias = Array.isArray(licencias) ? licencias : [];
   const safeCatalogo = Array.isArray(catalogo) ? catalogo : [];
   const safeAsignaciones = Array.isArray(asignaciones) ? asignaciones : [];
   const safeProveedores = Array.isArray(proveedores) ? proveedores : [];
   const safeEquipos = Array.isArray(equipos) ? equipos : [];
   const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];

   return (
      <div className="flex-1 space-y-6">
         <LicenciasClient
            initialLicencias={safeLicencias}
            initialCatalogo={safeCatalogo}
            initialAsignaciones={safeAsignaciones}
            proveedores={safeProveedores}
            equipos={safeEquipos}
            usuarios={safeUsuarios}
         />
      </div>
   );
}
