import { cookies } from 'next/headers';
import { Usuario, Rol } from "@/types/api";
import { UsuariosClient } from "./components/UsuariosClient";

// Helper genérico para obtener datos en el servidor
async function fetchData(endpoint: string) {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return [];

   try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!res.ok) {
         console.error(`Error fetching ${endpoint}: ${res.status} ${res.statusText}`);
         return [];
      }
      return res.json();
   } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
   }
}

export default async function UsuariosPage() {
   // ✅ CORRECCIÓN: Se ajusta el límite de usuarios a 200
   const [usuarios, roles] = await Promise.all([
      fetchData('/usuarios/?limit=200') as Promise<Usuario[]>,
      fetchData('/gestion/roles/') as Promise<Rol[]>,
   ]);

   return (
      <div className="container mx-auto py-10">
         <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
               Crea, edita y administra los usuarios y sus roles en el sistema.
            </p>
         </div>
         <UsuariosClient initialData={usuarios} roles={roles} />
      </div>
   );
}
