import { guardPage } from "@/lib/page-access";
import { Metadata } from "next";
import { ReportesClient } from "./components/ReportesClient";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
   title: "Reportes y Exportación | Control de Equipos",
   description: "Generación y descarga de reportes del sistema.",
};

export default async function ReportesPage() {
   const pageAccessDenied = await guardPage("/reportes");
   if (pageAccessDenied) return pageAccessDenied;

   return (
      <div className="min-w-0 space-y-6">
         <PageHeader title="Reportes y Exportación" description="Genera reportes operativos y de auditoría en formato PDF, Excel o CSV." />
         <ReportesClient />
      </div>
   );
}
