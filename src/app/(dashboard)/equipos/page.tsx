import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EquiposClient } from "./components/EquiposClient";
import { equiposServerService } from "@/app/services/equiposService.server";
import type { EquipoRead } from "@/types/api";

export const metadata: Metadata = {
   title: "Gestión de Equipos | Control de Activos",
   description: "Inventario y gestión de equipos físicos.",
};

interface PageProps {
   searchParams: Promise<{ page?: string; q?: string; estado?: string }>;
}

export default async function EquiposPage({ searchParams }: PageProps) {
   const params = await searchParams;

   const page = Number(params?.page) || 1;
   const limit = 10;
   const skip = (page - 1) * limit;

   let initialData: EquipoRead[] = [];

   try {
      initialData = await equiposServerService.getAll({
         skip,
         limit,
         q: params?.q || "",
         estado_id: params?.estado || "",
      });
   } catch (e: unknown) {
      const err = e as Error & { status?: number };
      if (err.status === 401) redirect("/login");
      // En producción deberíamos manejar otros errores (ej. 500) con un Error Boundary
      throw e;
   }

   return (
      <div className="flex-1 space-y-4 p-8 pt-6">
         <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Equipos</h2>
         </div>

         <Suspense
            fallback={
               <div className="flex justify-center p-10">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
               </div>
            }
         >
            <EquiposClient
               initialData={initialData}
               initialParams={{
                  page,
                  limit,
                  q: params?.q || "",
                  estado: params?.estado || "",
               }}
            />
         </Suspense>
      </div>
   );
}
