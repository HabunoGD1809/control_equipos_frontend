"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { InventarioStock, TipoItemInventario, EquipoSimple, Proveedor } from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { RegistrarMovimientoForm } from "@/components/features/inventario/RegistrarMovimientoForm";
import { TipoItemForm } from "./TipoItemForm";

// Columnas para la tabla de Stock
const stockColumns: ColumnDef<InventarioStock>[] = [
   // ✅ CORRECCIÓN: Se usa un id simple y una función `accessorFn` para datos anidados.
   {
      accessorFn: (row) => row.tipo_item.nombre,
      id: "item_nombre",
      header: "Ítem"
   },
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
   initialStockData: InventarioStock[];
   initialTiposData: TipoItemInventario[];
   equipos: EquipoSimple[];
   proveedores: Proveedor[];
}

export const InventarioClient: React.FC<InventarioClientProps> = ({ initialStockData, initialTiposData, equipos, proveedores }) => {
   const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
   const [isTipoItemModalOpen, setIsTipoItemModalOpen] = useState(false);
   const canManageTipos = useHasPermission(['administrar_inventario_tipos']);
   const canRegisterMoves = useHasPermission(['administrar_inventario_stock']);

   return (
      <>
         <Dialog open={isMovimientoModalOpen} onOpenChange={setIsMovimientoModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
                  <DialogDescription>
                     Complete los detalles para registrar una nueva transacción de inventario.
                  </DialogDescription>
               </DialogHeader>
               <RegistrarMovimientoForm
                  tiposItem={initialTiposData}
                  equipos={equipos}
                  onSuccess={() => setIsMovimientoModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         <Dialog open={isTipoItemModalOpen} onOpenChange={setIsTipoItemModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Crear Nuevo Tipo de Ítem</DialogTitle>
                  <DialogDescription>
                     Complete los detalles para crear un nuevo tipo de ítem en el inventario.
                  </DialogDescription>
               </DialogHeader>
               <TipoItemForm
                  proveedores={proveedores}
                  onSuccess={() => setIsTipoItemModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         <Tabs defaultValue="stock">
            <div className="flex justify-between items-center">
               <TabsList>
                  <TabsTrigger value="stock">Stock Actual</TabsTrigger>
                  {canManageTipos && <TabsTrigger value="tipos">Tipos de Ítem</TabsTrigger>}
               </TabsList>
               <div className="flex gap-2">
                  {canRegisterMoves && (
                     <Button onClick={() => setIsMovimientoModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Registrar Movimiento
                     </Button>
                  )}
                  {canManageTipos && (
                     <Button variant="outline" onClick={() => setIsTipoItemModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Tipo
                     </Button>
                  )}
               </div>
            </div>

            <TabsContent value="stock" className="mt-4">
               {/* ✅ CORRECCIÓN: Se usa el nuevo `id` de la columna para el filtrado. */}
               <DataTable columns={stockColumns} data={initialStockData} filterColumn="item_nombre" />
            </TabsContent>

            {canManageTipos && (
               <TabsContent value="tipos" className="mt-4">
                  <DataTable columns={tiposColumns} data={initialTiposData} filterColumn="nombre" />
               </TabsContent>
            )}
         </Tabs>
      </>
   );
}
