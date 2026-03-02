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
      // Si serverApi ya llamó redirect(), Next lanza NEXT_REDIRECT.
      // No lo loguees; re-lánzalo para que Next lo maneje.
      if (isNextRedirect(error)) throw error;

      console.error("Error validando sesión en servidor:", error);
      redirect("/login");
   }

   return (
      <ReactQueryProvider>
         <SessionProvider user={user}>
            <div className="flex h-screen bg-secondary/20">
               <Sidebar />
               <main className="flex-1 flex flex-col md:ml-64">
                  <Header />
                  <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
               </main>
            </div>
         </SessionProvider>
      </ReactQueryProvider>
   );
}
