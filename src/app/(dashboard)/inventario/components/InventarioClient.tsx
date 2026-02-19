"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/Dialog";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle
} from "@/components/ui/AlertDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
   InventarioStock,
   TipoItemInventario,
   EquipoSimple,
   Proveedor,
   InventarioMovimiento,
} from "@/types/api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

// Componentes del Módulo
import { RegistrarMovimientoForm } from "@/components/features/inventario/RegistrarMovimientoForm";
import { TipoItemForm } from "./TipoItemForm";
import { MovimientosInventarioClient } from "./MovimientosInventarioClient";
import { StockGroupedTable } from "@/components/features/inventario/StockGroupedTable"; // FASE 3: Tabla Jerárquica

interface InventarioClientProps {
   initialStockData: InventarioStock[];
   initialTiposData: TipoItemInventario[];
   initialMovimientosData: InventarioMovimiento[];
   equipos: EquipoSimple[];
   proveedores: Proveedor[];
}

export const InventarioClient: React.FC<InventarioClientProps> = ({
   initialStockData,
   initialTiposData,
   initialMovimientosData,
   equipos,
   proveedores,
}) => {
   const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
   const [isTipoItemModalOpen, setIsTipoItemModalOpen] = useState(false);
   const [selectedTipoItem, setSelectedTipoItem] = useState<TipoItemInventario | null>(null);

   const canManageTipos = useHasPermission(["administrar_inventario_tipos"]);
   const canRegisterMoves = useHasPermission(["administrar_inventario_stock"]);

   const {
      isAlertOpen,
      isDeleting,
      openAlert,
      setIsAlertOpen,
      handleDelete,
      itemToDelete,
   } = useDeleteConfirmation("Tipo de Ítem");

   const handleOpenTipoModal = (item: TipoItemInventario | null = null) => {
      setSelectedTipoItem(item);
      setIsTipoItemModalOpen(true);
   };

   // Columnas para la tabla de Gestión de Tipos (Catálogo)
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
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     <MoreHorizontal className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleOpenTipoModal(row.original)}>
                     <Pencil className="mr-2 h-4 w-4" />
                     Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="text-destructive focus:text-destructive"
                     onClick={() => openAlert(row.original.id)}
                  >
                     <Trash2 className="mr-2 h-4 w-4" />
                     Eliminar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         ),
      },
   ];

   return (
      <>
         {/* --- MODALES --- */}

         {/* Modal: Registrar Movimiento */}
         <Dialog open={isMovimientoModalOpen} onOpenChange={setIsMovimientoModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
                  <DialogDescription>
                     Transacción de stock (entrada, salida, ajuste) y cálculo de costos ponderados.
                  </DialogDescription>
               </DialogHeader>
               <RegistrarMovimientoForm
                  tiposItem={initialTiposData}
                  equipos={equipos}
                  stockData={initialStockData}
                  onSuccess={() => setIsMovimientoModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         {/* Modal: Gestión de Tipos (Crear/Editar) */}
         <Dialog open={isTipoItemModalOpen} onOpenChange={setIsTipoItemModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>
                     {selectedTipoItem ? "Editar" : "Crear"} Tipo de Ítem
                  </DialogTitle>
                  <DialogDescription>
                     Complete los detalles técnicos del consumible o repuesto.
                  </DialogDescription>
               </DialogHeader>
               <TipoItemForm
                  initialData={selectedTipoItem}
                  proveedores={proveedores}
                  onSuccess={() => setIsTipoItemModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         {/* Alerta de Confirmación de Eliminación (Agregada para que funcione el hook useDeleteConfirmation) */}
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción eliminará el tipo de ítem del catálogo. No se puede deshacer si existen registros históricos asociados.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => handleDelete(`/inventario/tipos/${itemToDelete}`)}
                     disabled={isDeleting}
                     className="bg-destructive hover:bg-destructive/90"
                  >
                     {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>


         {/* --- CONTENIDO PRINCIPAL (TABS) --- */}
         <Tabs defaultValue="stock" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
               <TabsList>
                  <TabsTrigger value="stock">Stock Actual</TabsTrigger>
                  <TabsTrigger value="movimientos">Historial de Movimientos</TabsTrigger>
                  {canManageTipos && (
                     <TabsTrigger value="tipos">Catálogo de Ítems</TabsTrigger>
                  )}
               </TabsList>

               <div className="flex gap-2 w-full sm:w-auto">
                  {canRegisterMoves && (
                     <Button onClick={() => setIsMovimientoModalOpen(true)} className="flex-1 sm:flex-none">
                        <PlusCircle className="mr-2 h-4 w-4" /> Movimiento
                     </Button>
                  )}
                  {canManageTipos && (
                     <Button variant="outline" onClick={() => handleOpenTipoModal()} className="flex-1 sm:flex-none">
                        <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Ítem
                     </Button>
                  )}
               </div>
            </div>

            {/* TAB 1: Stock (Fase 3: Vista Agrupada Multi-Lote) */}
            <TabsContent value="stock" className="mt-0 space-y-4">
               <div className="bg-card rounded-md border p-1">
                  <StockGroupedTable data={initialStockData} />
               </div>
            </TabsContent>

            {/* TAB 2: Historial de Movimientos */}
            <TabsContent value="movimientos" className="mt-0">
               <MovimientosInventarioClient data={initialMovimientosData} />
            </TabsContent>

            {/* TAB 3: Catálogo de Tipos */}
            {canManageTipos && (
               <TabsContent value="tipos" className="mt-0">
                  <DataTable
                     columns={tiposColumns}
                     data={initialTiposData}
                     filterColumn="nombre"
                  />
               </TabsContent>
            )}
         </Tabs>
      </>
   );
};
