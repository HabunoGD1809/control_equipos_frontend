import { api } from "@/lib/http";
import {
   Movimiento,
   MovimientoCreate,
   MovimientoUpdate,
   TipoMovimientoEquipo,
   TipoMovimientoEquipoEnum,
} from "@/types/api";

// Tipo local — si lo mueves a types/api.ts mejor
export interface AutorizarMovimientoPayload {
   accion: "Aprobar" | "Rechazar";
   observaciones?: string;
}

export const movimientosService = {
   getByEquipo: (equipoId: string): Promise<Movimiento[]> =>
      api.get<Movimiento[]>(`/equipos/${equipoId}/movimientos`),

   getPendientes: (): Promise<Movimiento[]> =>
      api.get<Movimiento[]>("/movimientos/pendientes"),

   create: (payload: MovimientoCreate): Promise<Movimiento> =>
      api.post<Movimiento>("/movimientos", payload),

   update: (id: string, payload: MovimientoUpdate): Promise<Movimiento> =>
      api.patch<Movimiento>(`/movimientos/${id}`, payload),

   autorizar: (id: string, payload: AutorizarMovimientoPayload): Promise<void> =>
      api.post<void>(`/movimientos/${id}/autorizar`, payload),

   predecirEstadoFinal: (tipo: TipoMovimientoEquipo): string => {
      switch (tipo) {
         case TipoMovimientoEquipoEnum.SalidaTemporal:
            return "Prestado";
         case TipoMovimientoEquipoEnum.SalidaDefinitiva:
            return "Dado de Baja";
         case TipoMovimientoEquipoEnum.Entrada:
            return "Disponible";
         case TipoMovimientoEquipoEnum.AsignacionInterna:
            return "En Uso";
         case TipoMovimientoEquipoEnum.TransferenciaBodega:
            return "Disponible";
         default:
            return "Desconocido";
      }
   },
};
