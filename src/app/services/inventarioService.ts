import { api } from "@/lib/http";
import type {
   TipoItemInventario,
   InventarioStock,
   InventarioMovimiento,
   InventarioMovimientoCreate,
   TipoItemInventarioCreate,
   TipoItemInventarioUpdate,
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

export const inventarioService = {
   // --- Tipos ---
   getTipos(params?: {
      skip?: number;
      limit?: number;
   }): Promise<TipoItemInventario[]> {
      return api.get<TipoItemInventario[]>("/inventario/tipos/", { params });
   },

   getTipoById(id: string): Promise<TipoItemInventario> {
      return api.get<TipoItemInventario>(`/inventario/tipos/${id}`);
   },

   createTipo(payload: TipoItemInventarioCreate): Promise<TipoItemInventario> {
      return api.post<TipoItemInventario>("/inventario/tipos/", payload);
   },

   updateTipo(
      id: string,
      payload: TipoItemInventarioUpdate,
   ): Promise<TipoItemInventario> {
      return api.put<TipoItemInventario>(`/inventario/tipos/${id}`, payload);
   },

   deleteTipo(id: string): Promise<void> {
      return api.delete<void>(`/inventario/tipos/${id}`);
   },

   // --- Stock ---
   getStock(params?: {
      tipo_item_id?: string;
      ubicacion?: string;
      lote?: string;
      skip?: number;
      limit?: number;
   }): Promise<InventarioStock[]> {
      return api.get<InventarioStock[]>("/inventario/stock/", { params });
   },

   getStockTotal(tipoItemId: string): Promise<{ total: number }> {
      // El backend devuelve { tipo_item_id: "...", cantidad_total: number }.
      // Por compatibilidad con tu UI lo mapeamos a { total: number }
      return api
         .get<any>(`/inventario/stock/item/${tipoItemId}/total`)
         .then((res) => ({ total: res.cantidad_total || 0 }));
   },

   getItemsBajoStock(): Promise<ItemBajoStock[]> {
      return api.get<ItemBajoStock[]>("/inventario/tipos/bajo-stock/");
   },

   updateStockDetails(
      stockId: string,
      payload: StockDetailsUpdate,
   ): Promise<InventarioStock> {
      return api.put<InventarioStock>(
         `/inventario/stock/${stockId}/details`,
         payload,
      );
   },

   // --- Movimientos ---
   getMovimientos(params?: {
      skip?: number;
      limit?: number;
      tipo_item_id?: string;
      tipo_movimiento?: string;
      start_date?: string;
      end_date?: string;
   }): Promise<InventarioMovimiento[]> {
      return api.get<InventarioMovimiento[]>("/inventario/movimientos/", {
         params,
      });
   },

   getMovimientoById(id: string): Promise<InventarioMovimiento> {
      return api.get<InventarioMovimiento>(`/inventario/movimientos/${id}`);
   },

   registrarMovimiento(
      payload: InventarioMovimientoCreate,
   ): Promise<InventarioMovimiento> {
      return api.post<InventarioMovimiento>("/inventario/movimientos/", payload);
   },
};
