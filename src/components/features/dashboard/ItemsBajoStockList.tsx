"use client"

import { useRouter } from "next/navigation";
import { InventarioStock } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ItemBajoStock extends InventarioStock {
   tipo_item: {
      nombre: string;
      stock_minimo: number;
   };
   cantidad_actual: number;
}


interface ItemsBajoStockListProps {
   items: ItemBajoStock[];
}

export function ItemsBajoStockList({ items }: ItemsBajoStockListProps) {
   const router = useRouter();

   if (!items || items.length === 0) {
      return <p className="text-sm text-muted-foreground italic">No hay ítems con bajo stock actualmente.</p>;
   }

   return (
      <div className="space-y-4">
         {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
               <div>
                  <p className="text-sm font-medium leading-none truncate">
                     {item.tipo_item.nombre}
                  </p>
                  <p className="text-sm text-muted-foreground">
                     Ubicación: {item.ubicacion}
                  </p>
               </div>
               <div className="text-right">
                  <Badge variant="destructive" className="mb-1">
                     {item.cantidad_actual} / {item.tipo_item.stock_minimo}
                  </Badge>
                  <Button
                     variant="link"
                     size="sm"
                     className="h-auto p-0 text-xs"
                     onClick={() => router.push(`/inventario`)}
                  >
                     Gestionar
                  </Button>
               </div>
            </div>
         ))}
      </div>
   );
}
