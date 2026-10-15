import { guardPage } from "@/lib/page-access";
import { serverApi } from "@/lib/http-server";
import { collectPages } from "@/lib/collection-pages";
import { CatalogosClient } from "./components/CatalogosClient";
import { Empleado } from "@/types/api";

async function getInitialTabData() {
   const empleados = await collectPages<Empleado>((skip, limit) => serverApi.get('/empleados/', { params: { skip, limit } }));
   return { empleados };
}

export default async function CatalogosPage() {
   const pageAccessDenied = await guardPage("/administracion/catalogos");
   if (pageAccessDenied) return pageAccessDenied;

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
