"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { InventarioStock, TipoItemInventario } from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
// Importaremos los formularios que crearemos a continuación
// import { RegistrarMovimientoForm } from "@/components/features/inventario/RegistrarMovimientoForm";
// import { TipoItemForm } from "@/components/features/inventario/TipoItemForm";

// Columnas para la tabla de Stock
const stockColumns: ColumnDef<InventarioStock>[] = [
   { accessorKey: "tipo_item.nombre", header: "Ítem" },
   { accessorKey: "tipo_item.sku", header: "SKU" },
   { accessorKey: "ubicacion", header: "Ubicación" },
   { accessorKey: "cantidad_actual", header: "Cantidad Actual", cell: ({ row }) => <div className="text-center font-bold">{row.getValue("cantidad_actual")}</div> },
   { accessorKey: "tipo_item.stock_minimo", header: "Stock Mínimo", cell: ({ row }) => <div className="text-center">{row.original.tipo_item.stock_minimo}</div> },
   { accessorKey: "lote", header: "Lote" },
];

// Columnas para la tabla de Tipos de Ítem
const tiposColumns: ColumnDef<TipoItemInventario>[] = [
   { accessorKey: "nombre", header: "Nombre" },
   { accessorKey: "categoria", header: "Categoría" },
   { accessorKey: "marca", header: "Marca" },
   { accessorKey: "modelo", header: "Modelo" },
   { accessorKey: "unidad_medida", header: "Unidad" },
];

interface InventarioClientProps {
   stockData: InventarioStock[];
   tiposData: TipoItemInventario[];
}

export const InventarioClient: React.FC<InventarioClientProps> = ({ stockData, tiposData }) => {
   const canManageTipos = useHasPermission(['administrar_inventario_tipos']);
   const canRegisterMoves = useHasPermission(['administrar_inventario_stock']);

   return (
      <Tabs defaultValue="stock">
         <div className="flex justify-between items-center">
            <TabsList>
               <TabsTrigger value="stock">Stock Actual</TabsTrigger>
               {canManageTipos && <TabsTrigger value="tipos">Tipos de Ítem</TabsTrigger>}
            </TabsList>
            <div className="flex gap-2">
               {canRegisterMoves && (
                  <Button>
                     <PlusCircle className="mr-2 h-4 w-4" /> Registrar Movimiento
                  </Button>
               )}
               {canManageTipos && (
                  <Button variant="outline">
                     <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Tipo
                  </Button>
               )}
            </div>
         </div>

         <TabsContent value="stock" className="mt-4">
            <DataTable columns={stockColumns} data={stockData} />
         </TabsContent>

         {canManageTipos && (
            <TabsContent value="tipos" className="mt-4">
               <DataTable columns={tiposColumns} data={tiposData} />
            </TabsContent>
         )}
      </Tabs>
   );
}
