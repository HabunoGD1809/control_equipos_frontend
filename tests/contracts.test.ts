import test from "node:test";
import assert from "node:assert/strict";
import { safeReturnPath, isSameOrigin } from "../src/lib/request-security";
import { boundedBody, BodyTooLargeError } from "../src/lib/request-body";
import { reportExtension } from "../src/lib/report-download";
import { collectPages } from "../src/lib/collection-pages";

test("La redirección posterior al login conserva solo rutas locales", () => {
   assert.equal(safeReturnPath("/equipos?estado=Disponible"), "/equipos?estado=Disponible");
   for (const path of ["https://example.com", "//example.com", "/\\example.com", "javascript:alert(1)"]) {
      assert.equal(safeReturnPath(path), "/dashboard");
   }
});

test("El proxy rechaza mutaciones de otro origen", () => {
   assert.equal(isSameOrigin(new Request("https://control.example/api", { headers: { origin: "https://control.example" } })), true);
   assert.equal(isSameOrigin(new Request("https://control.example/api", { headers: { origin: "https://other.example" } })), false);
   assert.equal(isSameOrigin(new Request("https://control.example/api", { headers: { "sec-fetch-site": "cross-site" } })), false);
});

test("Los reportes Excel descargan con extensión xlsx", () => {
   assert.equal(reportExtension("Excel"), "xlsx");
   assert.equal(reportExtension("PDF"), "pdf");
   assert.equal(reportExtension("CSV"), "csv");
});

test("El inventario conserva registros de todas las páginas y detecta una paginación que no avanza", async () => {
   const records = Array.from({ length: 405 }, (_, index) => ({ id: String(index) }));
   const fetched = await collectPages(async (skip, limit) => records.slice(skip, skip + limit));
   assert.equal(fetched.length, 405);
   await assert.rejects(collectPages(async () => records.slice(0, 200)), /no avanzó/);
});

test("El origen conserva la dirección real detrás de Next y del proxy TLS", () => {
   assert.equal(isSameOrigin(new Request("http://localhost:3000/api", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } })), true);
   assert.equal(isSameOrigin(new Request("http://localhost:3000/api", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3001" } })), false);
   assert.equal(isSameOrigin(new Request("http://localhost:3000/api", { headers: { host: "control.example", "x-forwarded-proto": "https", origin: "https://control.example" } })), true);
   assert.equal(isSameOrigin(new Request("http://localhost:3000/api", { headers: { host: "control.example", "x-forwarded-proto": "https", origin: "https://evil.example" } })), false);
});

test("La subida rechaza Content-Length excesivo antes de leer", async () => {
   const request = new Request("https://control.example/api", { method: "POST", body: "ok", headers: { "content-length": "100" } });
   await assert.rejects(boundedBody(request, 10), BodyTooLargeError);
});

test("La subida limita cuerpos sin Content-Length y cancela el flujo", async () => {
   let cancelled = false;
   const stream = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new Uint8Array(6)); },
      cancel() { cancelled = true; },
   });
   const request = new Request("https://control.example/api", { method: "POST", body: stream, duplex: "half" } as RequestInit);
   await assert.rejects(boundedBody(request, 10), BodyTooLargeError);
   assert.equal(cancelled, true);
});

test("El proxy conserva los bytes de cuerpos dentro del límite", async () => {
   const request = new Request("https://control.example/api", { method: "POST", body: "ábc" });
   const result = await boundedBody(request, 10);
   assert.equal(new TextDecoder().decode(result), "ábc");
});
