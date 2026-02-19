import { EquipoForm } from "@/components/features/equipos/EquipoForm";
import type { EstadoEquipo, ProveedorSimple } from "@/types/api";
import { catalogosService } from "@/app/services/catalogosService";
import { proveedoresService } from "@/app/services/proveedoresService";

export default async function NuevoEquipoPage() {
   const [estados, proveedores] = await Promise.all([
      catalogosService.getEstadosEquipo(),
      proveedoresService.getOptions(),
   ]);

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Registrar Nuevo Equipo</h1>
            <p className="text-muted-foreground">
               Complete los detalles del nuevo activo.
            </p>
         </div>

         <EquipoForm
            estados={estados as EstadoEquipo[]}
            proveedores={proveedores as ProveedorSimple[]}
         />
      </div>
   );
}
