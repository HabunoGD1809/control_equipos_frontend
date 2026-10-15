import { guardPage, getPageUser } from "@/lib/page-access";
import { hasPermission } from "@/lib/permissions";
import { serverCollection } from "@/lib/server-collections";
import { Mantenimiento, EquipoSimple, TipoMantenimiento, Tecnico } from "@/types/api";
import { MantenimientosClient } from "./components/MantenimientosClient";

export default async function MantenimientosPage() {
   const pageAccessDenied = await guardPage("/mantenimientos");
   if (pageAccessDenied) return pageAccessDenied;
   const user = await getPageUser();

   const [mantenimientos, equipos, tiposMantenimiento, tecnicos] = await Promise.all([
      serverCollection<Mantenimiento>('/mantenimientos/'),
      hasPermission(user, ['ver_equipos']) ? serverCollection<EquipoSimple>('/equipos/') : [],
      serverCollection<TipoMantenimiento>('/catalogos/tipos-mantenimiento/'),
      serverCollection<Tecnico>('/tecnicos/'),
   ]);

   return (
      <div className="flex-1 space-y-6">
         <MantenimientosClient
            initialData={mantenimientos}
            equipos={equipos}
            tiposMantenimiento={tiposMantenimiento}
            tecnicos={tecnicos}
         />
      </div>
   );
}
