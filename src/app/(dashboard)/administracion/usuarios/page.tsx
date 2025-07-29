import { cookies } from 'next/headers';
import { UsuariosClient } from "./components/UsuariosClient";
import { Usuario, Rol } from '@/types/api';

async function getUsersData() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('access_token')?.value;

   if (!accessToken) return { usuarios: [], roles: [] };

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [usersRes, rolesRes] = await Promise.all([
         fetch(`${baseUrl}/usuarios/?limit=1000`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/gestion/roles/`, { headers, cache: 'no-store' }),
      ]);

      const usuarios: Usuario[] = usersRes.ok ? await usersRes.json() : [];
      const roles: Rol[] = rolesRes.ok ? await rolesRes.json() : [];

      return { usuarios, roles };
   } catch (error) {
      console.error("[GET_USERS_DATA_ERROR]", error);
      return { usuarios: [], roles: [] };
   }
}

export default async function UsuariosPage() {
   const { usuarios, roles } = await getUsersData();

   return (
      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
               <p className="text-muted-foreground">
                  Crea, edita y administra las cuentas de usuario y sus roles.
               </p>
            </div>
         </div>
         <UsuariosClient initialData={usuarios} roles={roles} />
      </div>
   );
}
