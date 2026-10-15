import test from "node:test";
import assert from "node:assert/strict";
import { prepareFetchPayload } from "../src/lib/http-utils";

test("La carga CSV conserva el archivo y fetch genera un boundary válido", async () => {
   const form = new FormData();
   form.append("file", new Blob(["nombre,numero_serie\nSwitch,NET-001\n"], { type: "text/csv" }), "inventario.CSV");
   const payload = prepareFetchPayload(form, { headers: new Headers({ "Content-Type": "multipart/form-data", "X-Request-ID": "import-001" }) });
   const request = new Request("https://control.example/api/proxy/equipos/bulk-upload", { method: "POST", ...payload });
   const contentType = request.headers.get("content-type") ?? "";
   assert.match(contentType, /^multipart\/form-data; boundary=.+/);
   assert.equal(request.headers.get("x-request-id"), "import-001");
   const boundary = contentType.split("boundary=")[1];
   const body = await request.text();
   assert.ok(body.startsWith(`--${boundary}\r\n`));
   assert.ok(body.includes('filename="inventario.CSV"'));
   assert.ok(body.includes("Switch,NET-001"));
   assert.ok(body.trimEnd().endsWith(`--${boundary}--`));
});
