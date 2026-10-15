import { redirect, unstable_rethrow } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "@/contexts/SessionProvider";
import { ReactQueryProvider } from "@/contexts/ReactQueryProvider";
import { getPageUser } from "@/lib/page-access";
import type { Usuario } from "@/types/api";
import { CompanyBrand } from "@/components/features/empresa/CompanyBrand";

import { ForceChangePasswordModal } from "@/components/features/usuarios/ForceChangePasswordModal";

export default async function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   let user: Usuario | null = null;

   try {
      user = await getPageUser();
   } catch (error) {
      unstable_rethrow(error);

      console.error("Error validando sesión en servidor:", error);
      redirect("/api/auth/logout?callbackUrl=/login");
   }

   if (user.requiere_cambio_contrasena) {
      return (
         <ReactQueryProvider>
            <SessionProvider user={user}>
               <main className="flex min-h-dvh items-center justify-center p-4"><CompanyBrand /></main>
               <ForceChangePasswordModal />
            </SessionProvider>
         </ReactQueryProvider>
      );
   }
   return (
      <ReactQueryProvider>
         <SessionProvider user={user}>

            {/* ESCUDO DE SEGURIDAD: Fuerza el cambio si la BD lo exige */}
            {user?.requiere_cambio_contrasena && <ForceChangePasswordModal />}

            {/* Contenedor principal: Ocupa toda la pantalla, sin scroll global. 
                Usamos bg-muted/20 o bg-background para dar un contraste limpio a las tarjetas */}
            <div className="flex h-dvh w-full overflow-hidden bg-muted/20 dark:bg-background">

               {/* Sidebar */}
               <Sidebar />

               {/* Contenedor derecho: Toma el espacio restante */}
               <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                  {/* Header: Se mantiene fijo arriba sin usar position absolute/fixed */}
                  <Header />

                  {/* Área de contenido: Esta es la ÚNICA parte que hace scroll */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 scroll-smooth">
                     <div className="min-w-0 w-full max-w-7xl mx-auto">
                        {children}
                     </div>
                  </div>

               </main>
            </div>
         </SessionProvider>
      </ReactQueryProvider>
   );
}
