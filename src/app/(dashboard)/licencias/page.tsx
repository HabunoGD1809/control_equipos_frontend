import { guardPage, getPageUser } from "@/lib/page-access";
import { hasPermission } from "@/lib/permissions";
import { serverCollection } from "@/lib/server-collections";
import { LicenciasClient } from "./components/LicenciasClient";
import { LicenciaSoftware, SoftwareCatalogo, Proveedor, EquipoSimple, UsuarioSimple, AsignacionLicencia } from "@/types/api";

export default async function LicenciasPage() {
   const pageAccessDenied = await guardPage("/licencias");
   if (pageAccessDenied) return pageAccessDenied;

   const user = await getPageUser();

   const [licencias, catalogo, asignaciones, proveedores, equipos, usuarios] = await Promise.all([
      serverCollection<LicenciaSoftware>('/licencias/'),
      serverCollection<SoftwareCatalogo>('/licencias/catalogo'),
      serverCollection<AsignacionLicencia>('/licencias/asignaciones'),
      hasPermission(user, ['ver_proveedores']) ? serverCollection<Proveedor>('/proveedores/') : [],
      hasPermission(user, ['ver_equipos']) ? serverCollection<EquipoSimple>('/equipos/') : [],
      hasPermission(user, ['asignar_licencias']) ? serverCollection<UsuarioSimple>('/licencias/destinatarios') : [],
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
