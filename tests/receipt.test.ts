import test from "node:test";
import assert from "node:assert/strict";
import { recibirMovimientoSchema } from "../src/lib/zod";
import { movimientosService } from "../src/app/services/movimientosService";

test("Una recepción interna requiere empleado; el rechazo requiere un motivo", () => {
   const receipt = { estado: "Completado", tipo_receptor: "empleado", empleado_receptor_id: "11111111-1111-4111-8111-111111111111" };
   assert.equal(recibirMovimientoSchema.safeParse(receipt).success, true);
   assert.equal(recibirMovimientoSchema.safeParse({ ...receipt, empleado_receptor_id: null }).success, false);
   assert.equal(recibirMovimientoSchema.safeParse({ estado: "Rechazado", tipo_receptor: "empleado", observaciones: "Equipo con daños" }).success, true);
   assert.equal(recibirMovimientoSchema.safeParse({ estado: "Rechazado", tipo_receptor: "empleado", observaciones: "   " }).success, false);
});

test("La recepción externa requiere persona y entidad", () => {
   const receipt = { estado: "Completado", tipo_receptor: "externo", recibido_por: "Juan Pérez", entidad_receptora: "Servicio técnico" };
   assert.equal(recibirMovimientoSchema.safeParse(receipt).success, true);
   for (const field of ["recibido_por", "entidad_receptora"]) assert.equal(recibirMovimientoSchema.safeParse({ ...receipt, [field]: " " }).success, false);
});

test("El cliente completa y rechaza por la máquina de estados con el receptor identificado", async () => {
   const previous = globalThis.fetch;
   const calls: Array<{ path: string; method: string; body: Record<string, unknown> }> = [];
   globalThis.fetch = async (path, options) => {
      calls.push({ path: String(path), method: options!.method!, body: JSON.parse(String(options!.body)) });
      return Response.json({ estado: "Completado" });
   };
   try {
      await movimientosService.recibir("test-movement", { empleado_receptor_id: "employee" });
      await movimientosService.rechazar("test-movement", { observaciones: "Equipo dañado" });
      assert.deepEqual(calls, [
         { path: "/api/proxy/movimientos/test-movement/estado", method: "PATCH", body: { empleado_receptor_id: "employee", estado: "Completado" } },
         { path: "/api/proxy/movimientos/test-movement/estado", method: "PATCH", body: { observaciones: "Equipo dañado", estado: "Rechazado" } },
      ]);
   } finally { globalThis.fetch = previous; }
});
