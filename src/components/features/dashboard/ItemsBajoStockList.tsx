"use client";

import { PackageX, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/Button";

// Usamos el adaptador que definiste en page.tsx
interface TipoItemInventarioConStock {
   id: string;
   nombre: string;
   categoria?: string;
   unidad_medida?: string;
   stock_minimo?: number;
   stock_total_actual?: number;
   cantidad_actual?: number;
   tipo_item?: {
      nombre: string;
      unidad_medida: string;
   };
}

interface ItemsBajoStockListProps {
   items: TipoItemInventarioConStock[];
}

export function ItemsBajoStockList({ items }: ItemsBajoStockListProps) {
   if (!items || items.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <PackageX className="h-10 w-10 mb-2 opacity-20" />
            <p>El inventario está estable.</p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         {items.map((item) => (
            <div
               key={item.id}
               className="flex items-center justify-between p-3 rounded-md border border-red-500/20 bg-red-500/5 shadow-sm"
            >
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-full shrink-0">
                     <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                     <p className="font-medium text-sm">
                        {item.tipo_item?.nombre || item.nombre}
                     </p>
                     <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Stock actual:{" "}
                        <span className="font-bold text-red-600">
                           {item.cantidad_actual ?? item.stock_total_actual}
                        </span>{" "}
                        {item.tipo_item?.unidad_medida || item.unidad_medida || "unidades"}
                     </p>
                  </div>
               </div>
               <Button variant="ghost" size="icon" asChild className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-500/10">
                  <Link href={`/inventario/nuevo?tipo_item_id=${item.id}`}>
                     <ArrowRight className="h-4 w-4" />
                  </Link>
               </Button>
            </div>
         ))}
      </div>
   );
}
