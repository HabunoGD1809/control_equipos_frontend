"use client";

import { useRouter } from "next/navigation";
import {
   Plus,
   Wrench,
   ArrowRightLeft,
   FileText,
   PieChart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function QuickActions() {
   const router = useRouter();

   const actions = [
      {
         label: "Nuevo Equipo",
         icon: <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />,
         onClick: () => router.push("/equipos/nuevo"),
         description: "Registrar activo",
         bgHover: "hover:border-emerald-500/30 hover:bg-emerald-500/5",
         iconBg: "bg-emerald-500/10"
      },
      {
         label: "Asignar Equipo",
         icon: <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
         onClick: () => router.push("/movimientos?action=new"),
         description: "Entrega/Devolución",
         bgHover: "hover:border-blue-500/30 hover:bg-blue-500/5",
         iconBg: "bg-blue-500/10"
      },
      {
         label: "Mantenimiento",
         icon: <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-500" />,
         onClick: () => router.push("/mantenimientos"),
         description: "Programar tarea",
         bgHover: "hover:border-amber-500/30 hover:bg-amber-500/5",
         iconBg: "bg-amber-500/10"
      },
      {
         label: "Reportes",
         icon: <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-500" />,
         onClick: () => router.push("/reportes"),
         description: "Métricas y exportación",
         bgHover: "hover:border-indigo-500/30 hover:bg-indigo-500/5",
         iconBg: "bg-indigo-500/10"
      },
      {
         label: "Subir Doc",
         icon: <FileText className="h-5 w-5 text-purple-600 dark:text-purple-500" />,
         onClick: () => router.push("/documentacion"),
         description: "Adjuntar archivo",
         bgHover: "hover:border-purple-500/30 hover:bg-purple-500/5",
         iconBg: "bg-purple-500/10"
      },
   ];

   return (
      < div className = "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4" >
      {
         actions.map((action, idx) => (
            <Card
               key={idx}
               className={cn(
                  "group cursor-pointer transition-all duration-300 border border-muted/60 shadow-sm hover:shadow-md",
                  action.bgHover
               )}
               onClick={action.onClick}
               role="button"
               tabIndex={0}
            >
               <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div className={cn(
                     "p-3 rounded-full transition-transform duration-300 group-hover:scale-110 group-active:scale-95",
                     action.iconBg
                  )}>
                     {action.icon}
                  </div>
                  <div className="space-y-0.5">
                     <h3 className="font-semibold text-sm text-foreground">{action.label}</h3>
                     <p className="text-xs text-muted-foreground font-medium">{action.description}</p>
                  </div>
               </CardContent>
            </Card>
         ))
      }
      </div >
   );
}
