import { RolesClient } from "./components/RolesClient";

export default function RolesPage() {
   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
            <p className="text-muted-foreground">
               Defina los perfiles de acceso y asigne capacidades específicas a cada rol.
            </p>
         </div>

         <RolesClient />
      </div>
   );
}
