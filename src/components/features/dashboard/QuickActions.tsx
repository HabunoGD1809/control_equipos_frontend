"use client";

import { useRouter } from "next/navigation";
import {
   Plus,
   Wrench,
   ArrowRightLeft,
   FileText,
   UserPlus,
   Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function QuickActions() {
   const router = useRouter();

   const actions = [
      {
         label: "Nuevo Equipo",
         icon: <Plus className="h-5 w-5 text-green-600" />,
         onClick: () => router.push("/equipos/nuevo"),
         description: "Registrar activo"
      },
      {
         label: "Asignar Equipo",
         icon: <ArrowRightLeft className="h-5 w-5 text-blue-600" />,
         onClick: () => router.push("/movimientos?action=new"),
         description: "Entrega/Devolución"
      },
      {
         label: "Mantenimiento",
         icon: <Wrench className="h-5 w-5 text-orange-600" />,
         onClick: () => router.push("/mantenimientos"),
         description: "Programar tarea"
      },
      {
         label: "Subir Doc",
         icon: <FileText className="h-5 w-5 text-purple-600" />,
         onClick: () => router.push("/documentacion"),
         description: "Adjuntar archivo"
      },
   ];

   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {actions.map((action, idx) => (
            <Card key={idx} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={action.onClick}>
               <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-background border shadow-sm">
                     {action.icon}
                  </div>
                  <div>
                     <h3 className="font-semibold text-sm">{action.label}</h3>
                     <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>
   );
}
