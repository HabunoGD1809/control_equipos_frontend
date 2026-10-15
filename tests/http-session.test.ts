import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/lib/http";
import { HttpError } from "../src/lib/http-utils";

test("Las peticiones simultáneas renuevan la sesión una sola vez y recuperan sus respuestas", async () => {
   const original = globalThis.fetch;
   let refreshed = false;
   let release: () => void = () => {};
   const gate = new Promise<void>(resolve => { release = resolve; });
   const calls: string[] = [];
   globalThis.fetch = async path => {
      const url = String(path); calls.push(url);
      if (url === "/api/auth/refresh") { await gate; refreshed = true; return Response.json({ ok: true }); }
      if (!refreshed) return Response.json({ detail: "Sesión expirada" }, { status: 401 });
      return Response.json({ path: url });
   };
   try {
      const first = api.get("/equipos/");
      const second = api.get("/inventario/stock/");
      await new Promise(resolve => setImmediate(resolve));
      release();
      assert.deepEqual(await Promise.all([first, second]), [{ path: "/api/proxy/equipos/" }, { path: "/api/proxy/inventario/stock/" }]);
      assert.equal(calls.filter(path => path === "/api/auth/refresh").length, 1);
   } finally { globalThis.fetch = original; }
});

test("Una renovación fallida libera todas las peticiones pendientes", async () => {
   const original = globalThis.fetch;
   let release: () => void = () => {};
   const gate = new Promise<void>(resolve => { release = resolve; });
   let refreshCount = 0;
   globalThis.fetch = async path => {
      if (String(path) === "/api/auth/refresh") { refreshCount++; await gate; }
      return Response.json({ detail: "Sesión expirada" }, { status: 401 });
   };
   try {
      const responses = Promise.allSettled([api.get("/equipos/"), api.get("/movimientos/")]);
      await new Promise(resolve => setImmediate(resolve)); release();
      assert.ok((await responses).every(value => value.status === "rejected"));
      assert.equal(refreshCount, 1);
   } finally { globalThis.fetch = original; }
});

test("Un permiso denegado no renueva la sesión ni oculta el error del servidor", async () => {
   const original = globalThis.fetch; const calls: string[] = [];
   globalThis.fetch = async path => { calls.push(String(path)); return Response.json({ detail: "No tiene permiso para esta operación" }, { status: 403 }); };
   try {
      await assert.rejects(api.delete("/usuarios/another"), error => error instanceof HttpError && error.status === 403 && error.message.includes("permiso"));
      assert.deepEqual(calls, ["/api/proxy/usuarios/another"]);
   } finally { globalThis.fetch = original; }
});

test("Las descargas conservan los bytes y una eliminación sin contenido devuelve null", async () => {
   const original = globalThis.fetch;
   const bytes = new Uint8Array([37, 80, 68, 70, 45, 255, 0, 128]);
   globalThis.fetch = async (_path, options) => options?.method === "DELETE" ? new Response(null, { status: 204 }) : new Response(bytes, { headers: { "content-type": "application/pdf" } });
   try {
      const file = await api.get<Blob>("/equipos/asset/ficha", { responseType: "blob" });
      assert.deepEqual(new Uint8Array(await file.arrayBuffer()), bytes);
      assert.equal(await api.delete("/documentacion/document"), null);
   } finally { globalThis.fetch = original; }
});
