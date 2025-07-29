import { cookies } from 'next/headers';
import { CatalogosClient } from "./components/CatalogosClient";
import { EstadoEquipo, TipoDocumento, TipoMantenimiento, Proveedor } from "@/types/api";

async function getCatalogosData() {
   const accessToken = cookies().get('access_token')?.value;
   if (!accessToken) return null;

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [estadosRes, tiposDocRes, tiposMantRes, proveedoresRes] = await Promise.all([
         fetch(`${baseUrl}/catalogos/estados-equipo/`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/catalogos/tipos-documento/`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/catalogos/tipos-mantenimiento/`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/proveedores/`, { headers, cache: 'no-store' }),
      ]);

      return {
         estados: estadosRes.ok ? await estadosRes.json() as EstadoEquipo[] : [],
         tiposDocumento: tiposDocRes.ok ? await tiposDocRes.json() as TipoDocumento[] : [],
         tiposMantenimiento: tiposMantRes.ok ? await tiposMantRes.json() as TipoMantenimiento[] : [],
         proveedores: proveedoresRes.ok ? await proveedoresRes.json() as Proveedor[] : [],
      };
   } catch (error) {
      console.error("[GET_CATALOGOS_DATA_ERROR]", error);
      return null;
   }
}

export default async function CatalogosPage() {
   const data = await getCatalogosData();

   if (!data) {
      return <div className="p-8">Error al cargar los catálogos.</div>;
   }

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Administración de Catálogos</h1>
            <p className="text-muted-foreground">
               Gestione las listas maestras que alimentan los formularios del sistema.
            </p>
         </div>
         <CatalogosClient
            initialEstados={data.estados}
            initialTiposDocumento={data.tiposDocumento}
            initialTiposMantenimiento={data.tiposMantenimiento}
            initialProveedores={data.proveedores}
         />
      </div>
   );
}
