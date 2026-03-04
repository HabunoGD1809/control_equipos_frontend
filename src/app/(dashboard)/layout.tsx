import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "@/contexts/SessionProvider";
import { ReactQueryProvider } from "@/contexts/ReactQueryProvider";
import { serverApi } from "@/lib/http-server";
import type { Usuario } from "@/types/api";

function isNextRedirect(err: unknown) {
   return (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as any).digest === "string" &&
      (err as any).digest.startsWith("NEXT_REDIRECT")
   );
}

export default async function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   let user: Usuario | null = null;

   try {
      user = await serverApi.get<Usuario>("/usuarios/me");
   } catch (error) {
      if (isNextRedirect(error)) throw error;

      console.error("Error validando sesión en servidor:", error);
      redirect("/login");
   }

   return (
      <ReactQueryProvider>
         <SessionProvider user={user}>
            {/* Contenedor principal: Ocupa toda la pantalla, sin scroll global. 
                Usamos bg-muted/20 o bg-background para dar un contraste limpio a las tarjetas */}
            <div className="flex h-screen w-full overflow-hidden bg-muted/20 dark:bg-background">

               {/* Sidebar */}
               <Sidebar />

               {/* Contenedor derecho: Toma el espacio restante */}
               <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                  {/* Header: Se mantiene fijo arriba sin usar position absolute/fixed */}
                  <Header />

                  {/* Área de contenido: Esta es la ÚNICA parte que hace scroll */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 scroll-smooth">
                     <div className="max-w-7xl mx-auto">
                        {children}
                     </div>
                  </div>

               </main>
            </div>
         </SessionProvider>
      </ReactQueryProvider>
   );
}
