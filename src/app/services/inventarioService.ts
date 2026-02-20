import { api } from "@/lib/http";
import type {
   TipoItemInventario,
   InventarioStock,
   InventarioMovimiento,
   PaginatedResponse,
   InventarioMovimientoCreate,
   TipoItemInventarioSimple,
} from "@/types/api";

export interface StockDetailsUpdate {
   lote?: string;
   fecha_caducidad?: string | null;
   notas?: string;
}

export interface ItemBajoStock extends Omit<InventarioStock, "tipo_item"> {
   tipo_item: TipoItemInventarioSimple & { stock_minimo: number };
}

type TipoItemCreate = Omit<
   TipoItemInventario,
   "id" | "proveedor_preferido" | "created_at" | "updated_at"
> & {
   proveedor_preferido_id?: string | null;
};

export const inventarioService = {
   // --- Tipos ---
   getTipos(): Promise<TipoItemInventario[]> {
      return api.get<TipoItemInventario[]>("/inventario/tipos/");
   },

   getTipoById(id: string): Promise<TipoItemInventario> {
      return api.get<TipoItemInventario>(`/inventario/tipos/${id}`);
   },

   createTipo(payload: TipoItemCreate): Promise<TipoItemInventario> {
      return api.post<TipoItemInventario>("/inventario/tipos/", payload);
   },

   updateTipo(id: string, payload: Partial<TipoItemCreate>): Promise<TipoItemInventario> {
      return api.put<TipoItemInventario>(`/inventario/tipos/${id}`, payload);
   },

   // --- Stock ---
   getStock(params?: { tipo_item_id?: string; ubicacion?: string }): Promise<InventarioStock[]> {
      return api.get<InventarioStock[]>("/inventario/stock/", { params });
   },

   getStockTotal(tipoItemId: string): Promise<{ total: number }> {
      return api.get<{ total: number }>(`/inventario/stock/item/${tipoItemId}/total`);
   },

   getItemsBajoStock(): Promise<ItemBajoStock[]> {
      return api.get<ItemBajoStock[]>("/inventario/tipos/bajo-stock/");
   },

   updateStockDetails(stockId: string, payload: StockDetailsUpdate): Promise<InventarioStock> {
      return api.put<InventarioStock>(`/inventario/stock/${stockId}/details`, payload);
   },

   // --- Movimientos ---
   getMovimientos(page = 1, limit = 50): Promise<PaginatedResponse<InventarioMovimiento>> {
      const skip = (page - 1) * limit;
      return api.get<PaginatedResponse<InventarioMovimiento>>("/inventario/movimientos/", {
         params: { skip, limit },
      });
   },

   registrarMovimiento(payload: InventarioMovimientoCreate): Promise<InventarioMovimiento> {
      return api.post<InventarioMovimiento>("/inventario/movimientos/", payload);
   },
};
