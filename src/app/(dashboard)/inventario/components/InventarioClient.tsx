"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { collectPages } from "@/lib/collection-pages";

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
import { ColorSwatch } from "@/components/features/inventario/ConsumableColorPicker";

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
   const queryClient = useQueryClient();

   // ── Stock (viene del servidor) ───────────────────────────────────────────
   const [stockData, setStockData] = useState<InventarioStock[]>(initialStockData);
   const [previousStock, setPreviousStock] = useState(initialStockData);
   if (previousStock !== initialStockData) { setPreviousStock(initialStockData); setStockData(initialStockData); }

   // ── Lazy tab data ────────────────────────────────────────────────────────
   const [tabData, setTabData] = useState<LazyTabData>({});
   const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["stock"]));
   const [loadingTab, setLoadingTab] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState("stock");
   const [catalogError, setCatalogError] = useState<string | null>(null);
   const [hasOlderMovements, setHasOlderMovements] = useState(false);
   const [loadingOlderMovements, setLoadingOlderMovements] = useState(false);
   const [historyError, setHistoryError] = useState<string | null>(null);

   // ── Modal de movimiento ──────────────────────────────────────────────────
   const [manualMovimientoOpen, setIsMovimientoModalOpen] = useState(false);
   const [preselectedItemId, setPreselectedItemId] = useState<string | undefined>(undefined);

   // ── Modal de tipo ítem ───────────────────────────────────────────────────
   const [isTipoItemModalOpen, setIsTipoItemModalOpen] = useState(false);
   const [selectedTipoItem, setSelectedTipoItem] = useState<TipoItemInventario | null>(null);

   // ── Tipos inactivos ──────────────────────────────────────────────────────
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [showInactiveTipos, setShowInactiveTipos] = useState(false);

   const canManageTipos = useHasPermission(["administrar_inventario_tipos"]);
   const canRegisterMoves = useHasPermission(["administrar_inventario_stock"]);
   const canReadEquipos = useHasPermission(["ver_equipos"]);
   const canReadProveedores = useHasPermission(["ver_proveedores"]);

   const urlItemId = canRegisterMoves && searchParams.get("action") === "reponer" ? searchParams.get("item_id") : null;
   const isMovimientoModalOpen = manualMovimientoOpen || Boolean(urlItemId);
   const closeMovimientoModal = (open: boolean) => {
      setIsMovimientoModalOpen(open);
      if (!open && urlItemId) {
         const next = new URLSearchParams(searchParams);
         next.delete("action"); next.delete("item_id");
         router.replace(`/inventario${next.size ? `?${next}` : ""}`);
      }
   };

   // ── Fetch lazy por tab ───────────────────────────────────────────────────
   const fetchTabData = useCallback(async (tab: string, force = false, includeInactive = showInactiveTipos) => {
      if (tab === "movimientos" && (force || !tabData.movimientos)) {
         setLoadingTab("movimientos");
         setHistoryError(null);
         try {
            const data = await api.get<InventarioMovimiento[]>("/inventario/movimientos", {
               params: { limit: 200 },
            });
            setTabData((prev) => ({ ...prev, movimientos: data }));
            setHasOlderMovements(data.length === 200);
         } catch (err) {
            console.error("[InventarioClient] Error fetching movimientos:", err);
            setHistoryError("No se pudo cargar el historial. Vuelva a intentarlo.");
         } finally {
            setLoadingTab(null);
         }
      }

      if (tab === "tipos" && (force || !tabData.tipos)) {
         setLoadingTab("tipos");
         setCatalogError(null);
         try {
            const data = await collectPages((skip, limit) => api.get<TipoItemInventario[]>("/inventario/tipos", { params: { skip, limit, include_inactive: includeInactive } }));
            setTabData((prev) => ({ ...prev, tipos: data }));
         } catch (err) {
            console.error("[InventarioClient] Error fetching tipos:", err);
            setCatalogError("No se pudo cargar el catálogo. Puede volver a intentarlo.");
         } finally {
            setLoadingTab(null);
         }
      }
   }, [tabData, showInactiveTipos]);

   const handleTabChange = useCallback((value: string) => {
      setActiveTab(value);
      setMountedTabs((prev) => new Set(prev).add(value));
      fetchTabData(value);
   }, [fetchTabData]);

   const loadOlderMovements = async () => {
      if (loadingOlderMovements) return;
      setLoadingOlderMovements(true);
      setHistoryError(null);
      try {
         const page = await api.get<InventarioMovimiento[]>("/inventario/movimientos", { params: { skip: tabData.movimientos?.length ?? 0, limit: 200 } });
         setTabData(previous => ({ ...previous, movimientos: Array.from(new Map([...(previous.movimientos ?? []), ...page].map(movement => [movement.id, movement])).values()) }));
         setHasOlderMovements(page.length === 200);
      } catch { setHistoryError("No se pudo cargar la siguiente página. Puede volver a intentarlo."); }
      finally { setLoadingOlderMovements(false); }
   };

   // ── Fetch lazy de datos del modal de movimiento ──────────────────────────
   const { data: modalData, isPending: isLoadingModalData, error: modalError, refetch: refetchModalData } = useQuery<ModalData>({
      queryKey: ["inventario", "opciones-movimiento", { canReadEquipos, canReadProveedores }],
      enabled: isMovimientoModalOpen || isTipoItemModalOpen,
      queryFn: async () => {
         const [equipos, proveedores, ubicaciones, tipos] = await Promise.all([
            canReadEquipos ? collectPages((skip, limit) => api.get<EquipoSimple[]>("/equipos", { params: { skip, limit } })) : Promise.resolve([] as EquipoSimple[]),
            canReadProveedores ? collectPages((skip, limit) => api.get<Proveedor[]>("/proveedores", { params: { skip, limit } })) : Promise.resolve([] as Proveedor[]),
            collectPages((skip, limit) => api.get<Ubicacion[]>("/ubicaciones", { params: { skip, limit } })),
            collectPages((skip, limit) => api.get<TipoItemInventario[]>("/inventario/tipos", { params: { skip, limit } })),
         ]);
         return { equipos, proveedores, ubicaciones, tipos: tipos.filter(item => item.is_active !== false) };
      },
      staleTime: 30000,
   });

   const openMovimientoModal = useCallback((itemId?: string) => {
      setPreselectedItemId(itemId);
      setIsMovimientoModalOpen(true);
   }, []);

   const handleOpenMovimientoModal = () => openMovimientoModal(undefined);

   // ── Refresh general ──────────────────────────────────────────────────────
   const handleRefresh = async () => {
      setIsRefreshing(true);
      setTabData({});
      try {
         await Promise.all([fetchTabData(activeTab, true), queryClient.invalidateQueries({ queryKey: ["inventario", "opciones-movimiento"] })]);
         router.refresh();
      } finally { setIsRefreshing(false); }
   };

   const refreshCatalog = () => {
      void fetchTabData("tipos", true);
      void queryClient.invalidateQueries({ queryKey: ["inventario", "opciones-movimiento"] });
      router.refresh();
   };

   // ── Delete tipo ítem ─────────────────────────────────────────────────────
   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => api.delete(`/inventario/tipos/${id}`),
      onSuccess: refreshCatalog,
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
            <div className="min-w-48 max-w-80">
               <span className="font-semibold break-words">{row.original.nombre}</span>
               {row.original.is_active === false && (
                  <Badge variant="outline" className="text-destructive border-destructive text-[10px]">Inactivo</Badge>
               )}
               {(row.original.tecnologia || row.original.color) && (
                  <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
                     <Badge variant="outline" className="gap-1.5"><ColorSwatch color={row.original.color} />{[row.original.tecnologia, row.original.color].filter(Boolean).join(" · ")}</Badge>
                     {row.original.rendimiento_paginas && <span>{row.original.rendimiento_paginas.toLocaleString()} páginas</span>}
                     <span>{row.original.es_original ? "Original" : "Compatible"}</span>
                  </div>
               )}
               {!!row.original.modelos_equipo_compatibles?.length && <p className="text-xs text-muted-foreground mt-1 break-words">Compatible con: {row.original.modelos_equipo_compatibles.join(", ")}</p>}
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
               closeMovimientoModal(open);
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
               ) : modalError ? (
                  <div role="alert" className="space-y-3 py-6 text-sm"><p>No se pudieron cargar los datos. Compruebe su conexión y sus permisos.</p><Button variant="outline" onClick={() => refetchModalData()}>Reintentar</Button></div>
               ) : modalData && isMovimientoModalOpen ? (
                  <RegistrarMovimientoForm
                     tiposItem={modalData.tipos.filter((t) => t.is_active !== false)}
                     equipos={modalData.equipos}
                     stockData={stockData}
                     ubicaciones={modalData.ubicaciones}
                     initialTipoItemId={urlItemId ?? preselectedItemId}
                     onSuccess={() => {
                        closeMovimientoModal(false);
                        setPreselectedItemId(undefined);
                        // Invalidar stock y movimientos para re-fetch lazy
                        setTabData((prev) => ({ ...prev, movimientos: undefined }));
                        if (activeTab === "movimientos") void fetchTabData("movimientos", true);
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
               {isLoadingModalData ? <Loader2 className="mx-auto h-6 w-6 animate-spin my-8" /> : modalError ? <div role="alert" className="space-y-3 py-6 text-sm"><p>No se pudieron cargar los datos del catálogo.</p><Button variant="outline" onClick={() => refetchModalData()}>Reintentar</Button></div> : isTipoItemModalOpen && (
                  <TipoItemForm
                     initialData={selectedTipoItem}
                     proveedores={modalData?.proveedores ?? []}
                     onSuccess={() => {
                        setIsTipoItemModalOpen(false);
                        refreshCatalog();
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

         <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
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

               <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                     <div className="space-y-4">
                        {historyError && <p role="alert" className="text-sm text-destructive">{historyError}</p>}
                        <MovimientosInventarioClient data={tabData.movimientos ?? []} />
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                           <span>{tabData.movimientos?.length ?? 0} movimientos cargados</span>
                           {(hasOlderMovements || historyError) && <Button variant="outline" disabled={loadingOlderMovements} onClick={() => tabData.movimientos ? loadOlderMovements() : fetchTabData("movimientos")}>{loadingOlderMovements ? "Cargando…" : tabData.movimientos ? "Cargar movimientos anteriores" : "Reintentar"}</Button>}
                        </div>
                     </div>
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
                        {catalogError && <div role="alert" className="mb-3 flex flex-wrap items-center gap-3 text-sm text-destructive"><p>{catalogError}</p><Button variant="outline" onClick={() => fetchTabData("tipos", true)}>Reintentar</Button></div>}
                        <div className="flex justify-end mb-3">
                           <div className="flex items-center space-x-2">
                              <Switch
                                 id="show-inactive-tipos"
                                 checked={showInactiveTipos}
                                 onCheckedChange={value => { setShowInactiveTipos(value); void fetchTabData("tipos", true, value); }}
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
