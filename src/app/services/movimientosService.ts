import { api } from "@/lib/http";
import type {
   Movimiento,
   MovimientoCreate,
   MovimientoUpdate,
   TipoMovimientoEquipo,
} from "@/types/api";
import { TipoMovimientoEquipoEnum } from "@/types/api";

type MovimientosQuery = {
   skip?: number;
   limit?: number;
   equipo_id?: string;
};

export const movimientosService = {
   getAll: async (params?: MovimientosQuery): Promise<Movimiento[]> => {
      return api.get<Movimiento[]>("/movimientos/", { params });
   },

   getById: (id: string): Promise<Movimiento> =>
      api.get<Movimiento>(`/movimientos/${id}`),

   create: (payload: MovimientoCreate): Promise<Movimiento> =>
      api.post<Movimiento>("/movimientos/", payload),

   update: (id: string, payload: MovimientoUpdate): Promise<Movimiento> =>
      api.put<Movimiento>(`/movimientos/${id}`, payload),

   cancelar: (id: string): Promise<Movimiento> =>
      api.post<Movimiento>(`/movimientos/${id}/cancelar`, {}),

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
