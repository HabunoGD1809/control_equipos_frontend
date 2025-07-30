import { cookies } from 'next/headers';
import { LicenciasClient } from "./components/LicenciasClient";
import { LicenciaSoftware, SoftwareCatalogo, Proveedor, EquipoSimple, UsuarioSimple } from "@/types/api";

async function getLicenciasData() {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return null;

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [licenciasRes, catalogoRes, proveedoresRes, equiposRes, usuariosRes] = await Promise.all([
         fetch(`${baseUrl}/licencias/?limit=200`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/licencias/catalogo/?limit=200`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/proveedores/?limit=500`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/equipos/?limit=1000`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/usuarios/?limit=1000`, { headers, cache: 'no-store' })
      ]);

      if (!licenciasRes.ok || !catalogoRes.ok) {
         console.error("Failed to fetch licencias or catalogo", licenciasRes.status, catalogoRes.status);
         return null;
      }

      return {
         licencias: await licenciasRes.json() as LicenciaSoftware[],
         catalogo: await catalogoRes.json() as SoftwareCatalogo[],
         proveedores: proveedoresRes.ok ? await proveedoresRes.json() as Proveedor[] : [],
         equipos: equiposRes.ok ? await equiposRes.json() as EquipoSimple[] : [],
         usuarios: usuariosRes.ok ? await usuariosRes.json() as UsuarioSimple[] : [],
      };
   } catch (error) {
      console.error("[GET_LICENCIAS_DATA_ERROR]", error);
      return null;
   }
}

export default async function LicenciasPage() {
   const data = await getLicenciasData();

   if (!data) {
      return <div className="p-8">Error al cargar los datos de licencias.</div>;
   }

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Licencias de Software</h1>
            <p className="text-muted-foreground">
               Administre el catálogo de software, licencias adquiridas y sus asignaciones.
            </p>
         </div>
         <LicenciasClient
            initialLicencias={data.licencias}
            initialCatalogo={data.catalogo}
            proveedores={data.proveedores}
            equipos={data.equipos}
            usuarios={data.usuarios}
         />
      </div>
   );
}
