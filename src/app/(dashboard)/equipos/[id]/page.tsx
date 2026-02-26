import { notFound, redirect } from "next/navigation";
import { EquipoDetailClient } from "./components/EquipoDetailClient";
import { equiposServerService } from "@/app/services/equiposService.server";

interface PageProps {
   params: Promise<{ id: string }>;
}

export default async function EquipoDetailPage({ params }: PageProps) {
   const { id } = await params;
   
   try {
      // 🚀 Solo carga el Equipo, Componentes y Jerarquía. ¡Carga instantánea!
      const data = await equiposServerService.getEquipoDetailBasics(id);

      if (!data || !data.equipo) {
         notFound();
      }
      
      return <EquipoDetailClient {...data} />;
      
   } catch (error: any) {
      if (error?.status === 401) {
         redirect("/login");
      }
      notFound();
   }
}
