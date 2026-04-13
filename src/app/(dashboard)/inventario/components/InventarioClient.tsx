"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { api } from "@/lib/http";

import type {
   InventarioStock,
   TipoItemInventario,
   EquipoSimple,
   Proveedor,
   InventarioMovimiento,
   Ubicacion,
} from "@/types/api";

import { RegistrarMovimientoForm } from "@/components/features/inventario/RegistrarMovimientoForm";
import { TipoItemForm } from "./TipoItemForm";
import { MovimientosInventarioClient } from "./MovimientosInventarioClient";
import { StockGroupedTable } from "@/components/features/inventario/StockGroupedTable";

interface InventarioClientProps {
   initialStockData: InventarioStock[];
}

// Datos que se cargan lazy por tab
type LazyTabData = {
   movimientos?: InventarioMovimiento[];
   tipos?: TipoItemInventario[];
};

// Datos que se cargan lazy al abrir el modal de movimiento
type ModalData = {
   equipos: EquipoSimple[];
   proveedores: Proveedor[];
   ubicaciones: Ubicacion[];
   tipos: TipoItemInventario[]; // tipos activos para el select del form
};

export const InventarioClient: React.FC<InventarioClientProps> = ({
   initialStockData,
}) => {
   const router = useRouter();
   const searchParams = useSearchParams();

   // ── Stock (viene del servidor) ───────────────────────────────────────────
   const [stockData, setStockData] = useState<InventarioStock[]>(initialStockData);

   // ── Lazy tab data ────────────────────────────────────────────────────────
   const [tabData, setTabData] = useState<LazyTabData>({});
   const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["stock"]));
   const [loadingTab, setLoadingTab] = useState<string | null>(null);

   // ── Modal de movimiento ──────────────────────────────────────────────────
   const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
   const [preselectedItemId, setPreselectedItemId] = useState<string | undefined>(undefined);
   const [modalData, setModalData] = useState<ModalData | null>(null);
   const [isLoadingModalData, setIsLoadingModalData] = useState(false);

   // ── Modal de tipo ítem ───────────────────────────────────────────────────
   const [isTipoItemModalOpen, setIsTipoItemModalOpen] = useState(false);
   const [selectedTipoItem, setSelectedTipoItem] = useState<TipoItemInventario | null>(null);

   // ── Tipos inactivos ──────────────────────────────────────────────────────
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [showInactiveTipos, setShowInactiveTipos] = useState(false);
   const [hasFetchedAllTipos, setHasFetchedAllTipos] = useState(false);

   const canManageTipos = useHasPermission(["administrar_inventario_tipos"]);
   const canRegisterMoves = useHasPermission(["administrar_inventario_stock"]);

   // ── Leer URL params (acción desde notificaciones) ────────────────────────
   useEffect(() => {
      const action = searchParams.get("action");
      const itemId = searchParams.get("item_id");

      if (action === "reponer" && itemId && canRegisterMoves) {
         setPreselectedItemId(itemId);
         openMovimientoModal(itemId);

         const currentUrl = new URL(window.location.href);
         currentUrl.searchParams.delete("action");
         currentUrl.searchParams.delete("item_id");
         window.history.replaceState({}, "", currentUrl.toString());
      }
   }, [searchParams, canRegisterMoves]);

   // ── Fetch lazy por tab ───────────────────────────────────────────────────
   const fetchTabData = useCallback(async (tab: string) => {
      if (tab === "movimientos" && !tabData.movimientos) {
         setLoadingTab("movimientos");
         try {
            const data = await api.get<InventarioMovimiento[]>("/inventario/movimientos", {
               params: { limit: 200 },
            });
            setTabData((prev) => ({ ...prev, movimientos: data }));
         } catch (err) {
            console.error("[InventarioClient] Error fetching movimientos:", err);
            setTabData((prev) => ({ ...prev, movimientos: [] }));
         } finally {
            setLoadingTab(null);
         }
      }

      if (tab === "tipos" && !tabData.tipos) {
         setLoadingTab("tipos");
         try {
            const data = await api.get<TipoItemInventario[]>("/inventario/tipos", {
               params: { limit: 200 },
            });
            setTabData((prev) => ({ ...prev, tipos: data }));
         } catch (err) {
            console.error("[InventarioClient] Error fetching tipos:", err);
            setTabData((prev) => ({ ...prev, tipos: [] }));
         } finally {
            setLoadingTab(null);
         }
      }
   }, [tabData]);

   const handleTabChange = useCallback((value: string) => {
      setMountedTabs((prev) => new Set(prev).add(value));
      fetchTabData(value);
   }, [fetchTabData]);

   // ── Fetch inactivos en tab tipos ─────────────────────────────────────────
   const isFirstInactivosRender = useRef(true);
   useEffect(() => {
      if (isFirstInactivosRender.current) {
         isFirstInactivosRender.current = false;
         return;
      }
      if (showInactiveTipos && !hasFetchedAllTipos) {
         api.get<TipoItemInventario[]>("/inventario/tipos/", { params: { include_inactive: true, limit: 200 } })
            .then((res) => {
               setTabData((prev) => ({ ...prev, tipos: res }));
               setHasFetchedAllTipos(true);
            })
            .catch(console.error);
      }
   }, [showInactiveTipos, hasFetchedAllTipos]);

   // ── Fetch lazy de datos del modal de movimiento ──────────────────────────
   const fetchModalData = useCallback(async () => {
      if (modalData) return; // ya cargados, no repetir
      setIsLoadingModalData(true);
      try {
         const [equipos, proveedores, ubicaciones, tipos] = await Promise.all([
            api.get<EquipoSimple[]>("/equipos", { params: { limit: 500 } }),
            api.get<Proveedor[]>("/proveedores", { params: { limit: 500 } }),
            api.get<Ubicacion[]>("/ubicaciones", { params: { limit: 200 } }),
            api.get<TipoItemInventario[]>("/inventario/tipos", { params: { limit: 200 } }),
         ]);
         setModalData({ equipos, proveedores, ubicaciones, tipos });
      } catch (err) {
         console.error("[InventarioClient] Error fetching modal data:", err);
      } finally {
         setIsLoadingModalData(false);
      }
   }, [modalData]);

   const openMovimientoModal = useCallback((itemId?: string) => {
      setPreselectedItemId(itemId);
      setIsMovimientoModalOpen(true);
      fetchModalData();
   }, [fetchModalData]);

   const handleOpenMovimientoModal = () => openMovimientoModal(undefined);

   // ── Refresh general ──────────────────────────────────────────────────────
   const handleRefresh = () => {
      setIsRefreshing(true);
      // Invalidamos cache lazy para que recarguen al volver a los tabs
      setTabData({});
      setHasFetchedAllTipos(false);
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 800);
   };

   // ── Delete tipo ítem ─────────────────────────────────────────────────────
   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => api.delete(`/inventario/tipos/${id}`),
      onSuccess: () => {
         setTabData((prev) => ({ ...prev, tipos: undefined })); // forzar re-fetch
         setHasFetchedAllTipos(false);
         router.refresh();
      },
      successMessage: "El tipo de ítem ha sido eliminado (ocultado) del catálogo.",
   });

   const filteredTipos = useMemo(() => {
      const tipos = tabData.tipos ?? [];
      return tipos.filter((t) => showInactiveTipos || t.is_active !== false);
   }, [tabData.tipos, showInactiveTipos]);

   const handleOpenTipoModal = (item: TipoItemInventario | null = null) => {
      setSelectedTipoItem(item);
      setIsTipoItemModalOpen(true);
   };

   // ── Columnas de tipos ────────────────────────────────────────────────────
   const tiposColumns: ColumnDef<TipoItemInventario>[] = [
      {
         accessorKey: "nombre",
         header: "Nombre",
         cell: ({ row }) => (
            <div className="flex items-center gap-2">
               <span className="font-semibold">{row.original.nombre}</span>
               {row.original.is_active === false && (
                  <Badge variant="outline" className="text-destructive border-destructive text-[10px]">Inactivo</Badge>
               )}
            </div>
         ),
      },
      {
         accessorKey: "categoria",
         header: "Categoría",
         cell: ({ row }) => <span className="capitalize">{row.original.categoria}</span>,
      },
      {
         accessorKey: "marca",
         header: "Marca",
         cell: ({ row }) => <span className="text-muted-foreground">{row.original.marca_rel?.nombre || "--"}</span>,
      },
      {
         accessorKey: "modelo",
         header: "Modelo",
         cell: ({ row }) => <span className="text-muted-foreground">{row.original.modelo || "--"}</span>,
      },
      {
         accessorKey: "unidad_medida",
         header: "Unidad",
         cell: ({ row }) => (
            <span className="bg-muted px-2 py-1 rounded-md text-xs font-medium">{row.original.unidad_medida}</span>
         ),
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     <MoreHorizontal className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                     Acciones
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleOpenTipoModal(row.original)} className="cursor-pointer">
                     <Pencil className="mr-2 h-4 w-4 text-primary" /> Editar
                  </DropdownMenuItem>
                  {row.original.is_active !== false && (
                     <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        onClick={() => openAlert(row.original.id)}
                     >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                     </DropdownMenuItem>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         ),
      },
   ];

   return (
      <div className="space-y-6 animate-in fade-in duration-300">

         {/* ── Modal: Registrar Movimiento ── */}
         <Dialog
            open={isMovimientoModalOpen}
            onOpenChange={(open) => {
               setIsMovimientoModalOpen(open);
               if (!open) setPreselectedItemId(undefined);
            }}
         >
            <DialogContent className="sm:max-w-150">
               <DialogHeader>
                  <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
                  <DialogDescription>
                     Transacción de stock (entrada, salida, ajuste) y cálculo de costos ponderados.
                  </DialogDescription>
               </DialogHeader>

               {/* Spinner mientras cargan equipos/proveedores/ubicaciones */}
               {isLoadingModalData ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                     <Loader2 className="h-6 w-6 animate-spin mr-2" />
                     <span className="text-sm">Cargando datos del formulario...</span>
                  </div>
               ) : modalData && isMovimientoModalOpen ? (
                  <RegistrarMovimientoForm
                     tiposItem={modalData.tipos.filter((t) => t.is_active !== false)}
                     equipos={modalData.equipos}
                     stockData={stockData}
                     ubicaciones={modalData.ubicaciones}
                     initialTipoItemId={preselectedItemId}
                     onSuccess={() => {
                        setIsMovimientoModalOpen(false);
                        setPreselectedItemId(undefined);
                        // Invalidar stock y movimientos para re-fetch lazy
                        setTabData((prev) => ({ ...prev, movimientos: undefined }));
                        router.refresh();
                     }}
                  />
               ) : null}
            </DialogContent>
         </Dialog>

         {/* ── Modal: Tipo Ítem ── */}
         <Dialog open={isTipoItemModalOpen} onOpenChange={setIsTipoItemModalOpen}>
            <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>{selectedTipoItem ? "Editar Ítem" : "Nuevo Ítem de Catálogo"}</DialogTitle>
                  <DialogDescription>
                     Complete los detalles técnicos del consumible, repuesto o accesorio.
                  </DialogDescription>
               </DialogHeader>
               {isTipoItemModalOpen && (
                  <TipoItemForm
                     initialData={selectedTipoItem}
                     proveedores={modalData?.proveedores ?? []}
                     onSuccess={() => {
                        setIsTipoItemModalOpen(false);
                        setTabData((prev) => ({ ...prev, tipos: undefined }));
                        setHasFetchedAllTipos(false);
                        router.refresh();
                     }}
                  />
               )}
            </DialogContent>
         </Dialog>

         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Eliminar Tipo de Ítem?"
            description="Esta acción eliminará lógicamente el tipo de ítem del catálogo."
         />

         <Tabs defaultValue="stock" className="w-full" onValueChange={handleTabChange}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
               <TabsList className="bg-card border shadow-sm">
                  <TabsTrigger value="stock" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                     Stock Actual
                  </TabsTrigger>
                  <TabsTrigger value="movimientos" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                     Historial
                  </TabsTrigger>
                  {canManageTipos && (
                     <TabsTrigger value="tipos" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        Catálogo
                     </TabsTrigger>
                  )}
               </TabsList>

               <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} title="Sincronizar datos" className="shadow-sm">
                     <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                  {canRegisterMoves && (
                     <Button onClick={handleOpenMovimientoModal} className="flex-1 sm:flex-none shadow-sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Movimiento
                     </Button>
                  )}
                  {canManageTipos && (
                     <Button variant="secondary" onClick={() => handleOpenTipoModal()} className="flex-1 sm:flex-none shadow-sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Ítem
                     </Button>
                  )}
               </div>
            </div>

            {/* ── Tab: Stock (siempre montado, viene del servidor) ── */}
            <TabsContent value="stock" className="mt-0 outline-none">
               <StockGroupedTable data={stockData} />
            </TabsContent>

            {/* ── Tab: Movimientos (lazy) ── */}
            {mountedTabs.has("movimientos") && (
               <TabsContent value="movimientos" className="mt-0 outline-none">
                  {loadingTab === "movimientos" ? (
                     <div className="flex items-center justify-center py-24 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-sm">Cargando historial...</span>
                     </div>
                  ) : (
                     <MovimientosInventarioClient data={tabData.movimientos ?? []} />
                  )}
               </TabsContent>
            )}

            {/* ── Tab: Catálogo de Tipos (lazy, solo admins) ── */}
            {canManageTipos && mountedTabs.has("tipos") && (
               <TabsContent value="tipos" className="mt-0 outline-none">
                  {loadingTab === "tipos" ? (
                     <div className="flex items-center justify-center py-24 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-sm">Cargando catálogo...</span>
                     </div>
                  ) : (
                     <>
                        <div className="flex justify-end mb-3">
                           <div className="flex items-center space-x-2">
                              <Switch
                                 id="show-inactive-tipos"
                                 checked={showInactiveTipos}
                                 onCheckedChange={setShowInactiveTipos}
                              />
                              <Label htmlFor="show-inactive-tipos" className="text-sm text-muted-foreground cursor-pointer">
                                 Mostrar inactivos
                              </Label>
                           </div>
                        </div>
                        <DataTable
                           columns={tiposColumns}
                           data={filteredTipos}
                           filterColumn="nombre"
                           tableContainerClassName="shadow-sm border rounded-lg bg-card"
                        />
                     </>
                  )}
               </TabsContent>
            )}
         </Tabs>
      </div>
   );
};
