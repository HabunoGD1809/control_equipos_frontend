import test from "node:test";
import assert from "node:assert/strict";
import { suggestedTechnicalFields, technicalSheetSchema } from "../src/lib/technical-sheet";
import { createInventarioMovimientoSchema } from "../src/lib/zod";
import { userUpdatePayload } from "../src/lib/user-update";

test("La ficha valida IPv4, IPv6 y MAC sin impedir campos técnicos propios", () => {
   for (const direccion_ip of ["10.20.30.40", "2001:db8::20"]) assert.equal(technicalSheetSchema.safeParse({ direccion_ip, direccion_mac: "AA:BB:CC:DD:EE:01", "Circuito": "UPS A" }).success, true);
   for (const value of [{ direccion_ip: "999.2.3.4" }, { direccion_mac: "XX" }, { contraseña: "secret" }, Object.fromEntries(Array.from({length:21},(_,i)=>[String(i),"value"]))]) assert.equal(technicalSheetSchema.safeParse(value).success, false);
});
test("Los campos sugeridos conservan la ficha y permiten cambiar el tipo de activo", () => {
   const source = { ram: "64 GB", "Circuito": "UPS A" };
   const server = suggestedTechnicalFields("Servidor", source);
   assert.equal(server.ram, "64 GB"); assert.equal(server.Circuito, "UPS A"); assert.ok(Object.hasOwn(server,"rack"));
   const network = suggestedTechnicalFields("Red", server);
   assert.equal(network.ram, "64 GB"); assert.ok(Object.hasOwn(network,"vlan")); assert.ok(Object.keys(network).length <= 20);
   assert.deepEqual(source, {ram:"64 GB",Circuito:"UPS A"});
});
test("Abastecimiento exige procedencia, documento y almacén, sin exigir un proveedor comercial", () => {
   const schema = createInventarioMovimientoSchema([]);
   const valid = { tipo_item_id:"11111111-1111-4111-8111-111111111111", tipo_movimiento:"Entrada Abastecimiento", cantidad:10, ubicacion_destino_id:"22222222-2222-4222-8222-222222222222", procedencia:"Suministro", referencia_externa:"ACTA-001" };
   assert.equal(schema.safeParse(valid).success,true);
   for (const field of ["procedencia","referencia_externa","ubicacion_destino_id"]) assert.equal(schema.safeParse({...valid,[field]:""}).success,false);
   assert.equal(schema.safeParse({...valid,cantidad:0}).success,false);
});
test("Editar el propio usuario solo envía datos personales permitidos", () => {
   const data = { email:" user@example.com ", nombre_usuario:"user", rol_id:"role", bloqueado:true, requiere_cambio_contrasena:true, password:"TestOnly123!" };
   assert.deepEqual(userUpdatePayload(data,true), {email:"user@example.com"});
   const managed = userUpdatePayload(data,false);
   assert.equal(managed.rol_id,"role"); assert.equal(managed.bloqueado,true); assert.equal(managed.password,"TestOnly123!");
});
