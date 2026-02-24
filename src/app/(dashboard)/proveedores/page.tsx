import { serverApi } from "@/lib/http-server";
import { Proveedor } from "@/types/api";
import { ProveedoresClient } from "./components/ProveedoresClient";

export default async function ProveedoresPage() {
   const proveedores = await serverApi.get<Proveedor[]>("/proveedores", { params: { limit: 500 } });

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Proveedores</h1>
            <p className="text-muted-foreground">
               Cree, edite y administre todos los proveedores de su organización.
            </p>
         </div>
         <ProveedoresClient initialData={proveedores || []} />
      </div>
   );
}
