import { api } from "@/lib/http";
import type {
   Movimiento,
   MovimientoCreate,
   MovimientoUpdate,
   TipoMovimientoEquipo,
   MovimientoAccion,
   EstadoEquipoSimple,
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

   aprobar: (id: string, payload: MovimientoAccion = {}): Promise<Movimiento> =>
      api.patch<Movimiento>(`/movimientos/${id}/estado`, { ...payload, estado: "Autorizado" }),

   rechazar: (id: string, payload: MovimientoAccion): Promise<Movimiento> =>
      api.patch<Movimiento>(`/movimientos/${id}/estado`, { ...payload, estado: "Rechazado" }),

   recibir: (id: string, payload: MovimientoAccion = {}): Promise<Movimiento> =>
      api.patch<Movimiento>(`/movimientos/${id}/estado`, { ...payload, estado: "Completado" }),

   predecirEstadoFinal: (tipo: TipoMovimientoEquipo, estadoNombreActual: string, catalogo: EstadoEquipoSimple[]): string => {
      let code: string;
      switch (tipo) {
         case TipoMovimientoEquipoEnum.SalidaTemporal:
            code = "prestado"; break;
         case TipoMovimientoEquipoEnum.SalidaDefinitiva:
            code = "dado_de_baja"; break;
         case TipoMovimientoEquipoEnum.Entrada:
            code = "disponible"; break;
         case TipoMovimientoEquipoEnum.AsignacionInterna:
            code = "en_uso"; break;
         case TipoMovimientoEquipoEnum.TransferenciaBodega:
            return estadoNombreActual;
         default:
            return estadoNombreActual;
      }
      return catalogo.find(state => state.codigo === code)?.nombre ?? "Pendiente de confirmar";
   },
};
