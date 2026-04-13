import { RolesClient } from "./components/RolesClient";
import { rolesServerService } from "@/app/services/rolesService.server";

export default async function RolesPage() {
   const [initialRoles, initialPermisos] = await Promise.all([
      rolesServerService.getAll(),
      rolesServerService.getAllPermisos(),
   ]);

   return (
      <div className="flex-1 space-y-6">
         <RolesClient
            initialRoles={initialRoles}
            initialPermisos={initialPermisos}
         />
      </div>
   );
}
