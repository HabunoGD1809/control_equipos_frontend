import { cookies } from 'next/headers';
import { RolesClient } from "./components/RolesClient";
import { Rol, Permiso } from "@/types/api";

async function getRolesData() {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return { roles: [], permisos: [] };

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [rolesRes, permisosRes] = await Promise.all([
         fetch(`${baseUrl}/gestion/roles/`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/gestion/permisos/`, { headers, cache: 'no-store' }),
      ]);

      const roles: Rol[] = rolesRes.ok ? await rolesRes.json() : [];
      const permisos: Permiso[] = permisosRes.ok ? await permisosRes.json() : [];

      return { roles, permisos };
   } catch (error) {
      console.error("[GET_ROLES_DATA_ERROR]", error);
      return { roles: [], permisos: [] };
   }
}

export default async function RolesPage() {
   const { roles, permisos } = await getRolesData();

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Roles y Permisos</h1>
            <p className="text-muted-foreground">
               Defina los roles de su organización y asigne permisos específicos a cada uno.
            </p>
         </div>
         <RolesClient initialData={roles} allPermissions={permisos} />
      </div>
   );
}
