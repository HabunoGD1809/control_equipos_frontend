import test from "node:test";
import assert from "node:assert/strict";
import { isSystemState } from "../src/lib/catalogs";
import { movimientosService } from "../src/app/services/movimientosService";
import { TipoMovimientoEquipoEnum } from "../src/types/api";

test("Las reglas protegidas utilizan el código del catálogo, independiente de su etiqueta", () => {
   assert.equal(isSystemState("/catalogos/estados-equipo/", "disponible"), true);
   assert.equal(isSystemState("/catalogos/estados-equipo/", "Disponible"), false);
   assert.equal(isSystemState("/catalogos/tipos-documento/", "disponible"), false);
   assert.equal(isSystemState("/catalogos/estados-equipo/", null), false);
});

test("La vista previa de un movimiento muestra el nombre personalizado del estado", () => {
   const states = [{ id: "1", codigo: "prestado", nombre: "Entregado temporalmente" }, { id: "2", codigo: "disponible", nombre: "Listo para entregar" }];
   assert.equal(movimientosService.predecirEstadoFinal(TipoMovimientoEquipoEnum.SalidaTemporal, "Actual", states), "Entregado temporalmente");
   assert.equal(movimientosService.predecirEstadoFinal(TipoMovimientoEquipoEnum.Entrada, "Actual", states), "Listo para entregar");
   assert.equal(movimientosService.predecirEstadoFinal(TipoMovimientoEquipoEnum.TransferenciaBodega, "Bajo custodia", states), "Bajo custodia");
   assert.equal(movimientosService.predecirEstadoFinal(TipoMovimientoEquipoEnum.AsignacionInterna, "Actual", states), "Pendiente de confirmar");
});
