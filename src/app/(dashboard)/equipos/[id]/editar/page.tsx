import { notFound, redirect } from "next/navigation";
import { EditarEquipoClient } from "./components/EditarEquipoClient";

import { equiposServerService } from "@/app/services/equiposService.server";
import { catalogosService } from "@/app/services/catalogosService";
import { proveedoresService } from "@/app/services/proveedoresService";

interface PageProps {
   params: Promise<{ id: string }>;
}

export default async function EditarEquipoPage({ params }: PageProps) {
   const { id } = await params;

   try {
      const [equipo, estadosList, proveedoresList] = await Promise.all([
         equiposServerService.getById(id),
         catalogosService.getEstadosEquipo(),
         proveedoresService.getAll()
      ]);

      if (!equipo) notFound();

      return (
         <EditarEquipoClient
            equipo={equipo}
            estados={estadosList}
            proveedores={proveedoresList}
         />
      );
   } catch (error: any) {
      if (error?.status === 401) {
         redirect("/api/auth/logout");
      }

      if (error?.status === 404) {
         notFound();
      }

      throw error;
   }
}
