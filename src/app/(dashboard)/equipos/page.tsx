import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";

import { EquiposClient } from "./components/EquiposClient";
import { equiposServerService } from "@/app/services/equiposService.server";
import { PageHeader } from "@/components/layout/PageHeader";

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

   const initialData = await equiposServerService.getAll({
      skip,
      limit,
      q: params?.q || "",
      estado_id: params?.estado || "",
   });

   return (
      <div className="flex-1 space-y-6">
         <PageHeader
            title="Equipos"
            description="Gestión e inventario centralizado de todos los activos físicos y tecnológicos."
         />

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
