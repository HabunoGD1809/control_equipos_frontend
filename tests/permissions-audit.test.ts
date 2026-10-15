import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission, canVisitPage, landingPage } from "../src/lib/permissions";
import { auditChanges, auditValue, auditDateRange } from "../src/lib/audit";
import { updateProfileSchema } from "../src/lib/zod";

test("Un lector de inventario ve su grupo y no accede a otras pantallas", () => {
   const reader = { rol: { nombre: "Consulta", permisos: [{ nombre: "ver_inventario" }] } };
   assert.equal(hasPermission(reader, ["ver_equipos", "ver_movimientos", "ver_inventario"]), true);
   assert.equal(hasPermission(reader, ["ver_equipos", "ver_inventario"], "all"), false);
   assert.equal(canVisitPage(reader, "/inventario"), true);
   assert.equal(canVisitPage(reader, "/administracion/catalogos"), false);
   assert.equal(canVisitPage(reader, "/equipos/123"), false);
   assert.equal(landingPage(reader), "/inventario");
   assert.equal(landingPage({ rol: { nombre: "Sin acceso", permisos: [] } }), "/perfil");
   assert.equal(canVisitPage(null, "/perfil"), false);
});
test("Empresa acepta cualquiera de sus permisos y las rutas desconocidas se deniegan", () => {
   const user = { rol: { nombre: "Configuración", permisos: [{ nombre: "configurar_sistema" }] } };
   assert.equal(canVisitPage(user, "/administracion/empresa"), true);
   assert.equal(canVisitPage(user, "/administracion/backups"), false);
   assert.equal(canVisitPage(user, "/ruta-inesperada"), false);
});
test("La auditoría conserva valores anidados y calcula altas, cambios y bajas", () => {
   const before = { id: "1", updated_at: "old", ficha: { ram: "8 GB", puertos: ["P1"] } };
   const after = { ...before, updated_at: "new", ficha: { ram: "16 GB", puertos: ["P1", "P2"] } };
   const changes = auditChanges(before, after);
   assert.deepEqual(changes.map(row => row.key), ["ficha"]);
   assert.ok(auditValue(changes[0].after).includes('"P2"'));
   assert.equal(auditChanges(null, after).length, 2);
   assert.equal(auditChanges(before, null).length, 2);
   assert.equal(auditValue(null), "Sin valor");
});
test("Los filtros de fecha incluyen todo el día en la zona del usuario", () => {
   assert.deepEqual(auditDateRange("2026-10-13", "2026-10-13", 240), { start_time: "2026-10-13T04:00:00.000Z", end_time: "2026-10-14T03:59:59.999Z" });
   assert.throws(() => auditDateRange("2026-02-30", "2026-03-01", 0));
   assert.throws(() => auditDateRange("2026-10-14", "2026-10-13", 0));
});
test("La actualización de perfil no envía campos de acceso ni URLs de avatar", () => {
   assert.deepEqual(updateProfileSchema.parse({ email: "perfil@example.com", nombre_usuario: "otro", avatar_url: "https://external.example/photo", rol_id: "otro" }), { email: "perfil@example.com" });
});
