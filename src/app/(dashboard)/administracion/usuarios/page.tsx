import { UsuariosClient } from "./components/UsuariosClient";

export default function UsuariosPage() {
   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
               Administre las cuentas de acceso y sus roles asociados.
            </p>
         </div>

         <UsuariosClient />
      </div>
   );
}
