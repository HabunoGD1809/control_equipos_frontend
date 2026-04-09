"use client";

import { PackageX, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

import type { ItemBajoStock } from "@/app/services/inventarioService";

interface ItemsBajoStockListProps {
   items: ItemBajoStock[];
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
                        {item.tipo_item.nombre}
                     </p>
                     <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Stock actual:{" "}
                        <span className="font-bold text-red-600">
                           {item.cantidad_actual}
                        </span>{" "}
                        <span className="lowercase">{item.tipo_item.unidad_medida}</span>
                     </p>
                  </div>
               </div>

               {/* SOLUCIÓN: Agregamos parámetros a la URL (action=reponer e item_id) */}
               <Button variant="ghost" size="icon" asChild className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-500/10">
                  <Link href={`/inventario?action=reponer&item_id=${item.tipo_item.id}`}>
                     <ArrowRight className="h-4 w-4" />
                  </Link>
               </Button>
            </div>
         ))}
      </div>
   );
}
