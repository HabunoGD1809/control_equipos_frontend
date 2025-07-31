"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { InventarioStock, TipoItemInventario, EquipoSimple, Proveedor } from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { RegistrarMovimientoForm } from "@/components/features/inventario/RegistrarMovimientoForm";
import { TipoItemForm } from "./TipoItemForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";

// Columnas para la tabla de Stock
const stockColumns: ColumnDef<InventarioStock>[] = [
   {
      accessorFn: (row) => row.tipo_item.nombre,
      id: "item_nombre",
      header: "Ítem"
   },
   { accessorKey: "ubicacion", header: "Ubicación" },
   { accessorKey: "cantidad_actual", header: "Cantidad Actual", cell: ({ row }) => <div className="text-center font-bold">{row.getValue("cantidad_actual")}</div> },
   { accessorFn: (row) => row.tipo_item.stock_minimo, id: "stock_minimo", header: "Stock Mínimo", cell: ({ row }) => <div className="text-center">{row.original.tipo_item.stock_minimo}</div> },
   { accessorKey: "lote", header: "Lote" },
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
   const [selectedTipoItem, setSelectedTipoItem] = useState<TipoItemInventario | null>(null);

   const canManageTipos = useHasPermission(['administrar_inventario_tipos']);
   const canRegisterMoves = useHasPermission(['administrar_inventario_stock']);

   const {
      isAlertOpen, isDeleting, openAlert, setIsAlertOpen, handleDelete, itemToDelete
   } = useDeleteConfirmation("Tipo de Ítem");


   const handleOpenTipoModal = (item: TipoItemInventario | null = null) => {
      setSelectedTipoItem(item);
      setIsTipoItemModalOpen(true);
   }

   // Columnas para la tabla de Tipos de Ítem
   const tiposColumns: ColumnDef<TipoItemInventario>[] = [
      { accessorKey: "nombre", header: "Nombre" },
      { accessorKey: "categoria", header: "Categoría" },
      { accessorKey: "marca", header: "Marca" },
      { accessorKey: "modelo", header: "Modelo" },
      { accessorKey: "unidad_medida", header: "Unidad" },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleOpenTipoModal(row.original)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openAlert(row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   ];

   return (
      <>
         <Dialog open={isMovimientoModalOpen} onOpenChange={setIsMovimientoModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
                  <DialogDescription>Complete los detalles para registrar una nueva transacción de inventario.</DialogDescription>
               </DialogHeader>
               <RegistrarMovimientoForm tiposItem={initialTiposData} equipos={equipos} onSuccess={() => setIsMovimientoModalOpen(false)} />
            </DialogContent>
         </Dialog>

         <Dialog open={isTipoItemModalOpen} onOpenChange={setIsTipoItemModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedTipoItem ? 'Editar' : 'Crear'} Tipo de Ítem</DialogTitle>
                  <DialogDescription>Complete los detalles para gestionar los tipos de ítems en el inventario.</DialogDescription>
               </DialogHeader>
               <TipoItemForm initialData={selectedTipoItem} proveedores={proveedores} onSuccess={() => setIsTipoItemModalOpen(false)} />
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
                     <Button variant="outline" onClick={() => handleOpenTipoModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Tipo
                     </Button>
                  )}
               </div>
            </div>

            <TabsContent value="stock" className="mt-4">
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
