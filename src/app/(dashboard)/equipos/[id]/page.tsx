import { guardPage } from "@/lib/page-access";
import { notFound, redirect } from "next/navigation";
import { EquipoDetailClient } from "./components/EquipoDetailClient";
import { equiposServerService } from "@/app/services/equiposService.server";

interface PageProps {
   params: Promise<{ id: string }>;
}

export default async function EquipoDetailPage({ params }: PageProps) {
   const pageAccessDenied = await guardPage("/equipos");
   if (pageAccessDenied) return pageAccessDenied;

   const { id } = await params;
   
   let data;
   try {
      data = await equiposServerService.getEquipoDetailBasics(id);

      if (!data || !data.equipo) {
         notFound();
      }
      

      
   } catch (error: any) {
      if (error?.status === 401) {
         redirect("/login");
      }
      if (error?.status === 404) notFound();
      throw error;
   }
   return <EquipoDetailClient {...data} />;
}
