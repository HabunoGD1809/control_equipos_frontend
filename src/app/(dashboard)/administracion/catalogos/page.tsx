import { cookies } from 'next/headers';
import { CatalogosClient } from "./components/CatalogosClient";
import { Empleado } from "@/types/api";

async function getInitialTabData() {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return null;

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const res = await fetch(`${baseUrl}/empleados/`, {
         headers,
         cache: 'no-store',
      });

      return {
         empleados: res.ok ? (await res.json() as Empleado[]) : [],
      };
   } catch (error) {
      console.error("[GET_CATALOGOS_DATA_ERROR]", error);
      return null;
   }
}

export default async function CatalogosPage() {
   const data = await getInitialTabData();

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
         <CatalogosClient initialEmpleados={data.empleados} />
      </div>
   );
}
