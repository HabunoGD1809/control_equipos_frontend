import { Metadata } from "next";
import { ReportesClient } from "./components/ReportesClient";

export const metadata: Metadata = {
   title: "Reportes y Exportación | Control de Equipos",
   description: "Generación y descarga de reportes del sistema.",
};

export default function ReportesPage() {
   return (
      <div className="flex-1 space-y-4 p-8 pt-6">
         <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Reportes y Exportación</h2>
            <p className="text-muted-foreground">
               Genera reportes operativos y de auditoría en formato PDF o Excel.
            </p>
         </div>
         <ReportesClient />
      </div>
   );
}
