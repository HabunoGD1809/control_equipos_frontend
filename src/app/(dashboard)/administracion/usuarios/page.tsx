import { UsuariosClient } from "./components/UsuariosClient";
import { usuariosServerService } from "@/app/services/usuariosService.server";
import { rolesServerService } from "@/app/services/rolesService.server";
import { catalogosServerService } from "@/app/services/catalogosService.server";
import { empleadosServerService } from "@/app/services/empleadosService.server";

export default async function UsuariosPage() {
   const [users, roles, deptos, emps] = await Promise.all([
      usuariosServerService.getAll(),
      rolesServerService.getAll(),
      catalogosServerService.getDepartamentos({ limit: 50, include_inactive: false }),
      empleadosServerService.getAll(0, 50)
   ]);

   const initialOptions = {
      roles,
      departamentos: deptos.map(d => ({ value: d.id, label: d.nombre })),
      empleados: emps.map(e => ({ value: e.id, label: e.nombre_completo }))
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administre las cuentas de acceso y sus roles asociados.</p>
         </div>

         <UsuariosClient
            initialData={users}
            initialOptions={initialOptions}
         />
      </div>
   );
}
