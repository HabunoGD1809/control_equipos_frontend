import test from "node:test";
import assert from "node:assert/strict";
import { getAvatarSrc } from "../src/lib/avatar-url";
import { companySchema, companyPayload, validateCompanyLogo } from "../src/lib/company";
import { CONSUMABLE_COLORS } from "../src/lib/consumable-colors";
import { tipoItemSchema } from "../src/lib/zod";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormProvider, useForm } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "../src/components/ui/Form";
import { Input } from "../src/components/ui/Input";

test("El avatar usa la misma ruta privada en cabecera y barra lateral", () => {
   const expected = "/api/avatar/abc-123.jpg?v=42";
   assert.equal(getAvatarSrc("/static/uploads/avatars/abc-123.jpg?v=42"), expected);
   assert.equal(getAvatarSrc("http://127.0.0.1:8086/static/uploads/avatars/abc-123.jpg?v=42"), expected);
   assert.equal(getAvatarSrc(expected), expected);
});
test("El avatar rechaza rutas ajenas, archivos y esquemas inesperados", () => {
   for (const value of [null, "javascript:alert(1)", "https://example.com/photo.jpg", "/static/uploads/avatars/../../secret.txt", "/api/avatar/private.pdf"]) assert.equal(getAvatarSrc(value), null);
});
test("Empresa valida el nombre y envía contactos vacíos como null", () => {
   const input = { nombre: "  Informática  ", identificacion: " ", direccion: "", telefono: "", email: "" };
   assert.equal(companySchema.safeParse({ ...input, nombre: "   " }).success, false);
   assert.equal(companySchema.safeParse({ ...input, email: "correo inválido" }).success, false);
   assert.deepEqual(companyPayload(input), { nombre: "Informática", identificacion: null, direccion: null, telefono: null, email: null });
});
test("El logo respeta los formatos admitidos y el límite real de 2 MB", () => {
   assert.equal(validateCompanyLogo({ type: "image/png", size: 2 * 1024 * 1024 }), null);
   assert.ok(validateCompanyLogo({ type: "image/png", size: 2 * 1024 * 1024 + 1 }));
   assert.ok(validateCompanyLogo({ type: "image/svg+xml", size: 100 }));
   assert.ok(validateCompanyLogo({ type: "image/jpeg", size: 0 }));
});
test("Todos los colores de la paleta son válidos para guardar un tóner", () => {
   const base = { nombre: "Tóner de prueba", categoria: "Consumible", unidad_medida: "Unidad", tecnologia: "Tóner", es_original: true, perecedero: false, stock_minimo: 0 };
   assert.equal(new Set(CONSUMABLE_COLORS.map(color => color.name)).size, 6);
   for (const color of CONSUMABLE_COLORS) assert.equal(tipoItemSchema.safeParse({ ...base, color: color.name }).success, true, color.name);
   assert.equal(tipoItemSchema.safeParse({ ...base, color: "#00FF00" }).success, false);
});

test("Las etiquetas y ayudas del formulario están asociadas al campo editable", () => {
   function ExampleForm() {
      const form = useForm<{ nombre: string }>({ defaultValues: { nombre: "" } });
      const field = createElement(FormField<{ nombre: string }>, {
         control: form.control, name: "nombre",
         render: ({ field }) => createElement(FormItem, null,
            createElement(FormLabel, null, "Nombre"),
            createElement(FormControl, null, createElement(Input, field)),
            createElement(FormDescription, null, "Nombre visible")),
      });
      return createElement(FormProvider<{ nombre: string }>, form as Parameters<typeof FormProvider<{ nombre: string }>>[0], field);
   }
   const html = renderToStaticMarkup(createElement(ExampleForm));
   const labelTarget = html.match(/<label[^>]*for="([^"]+)"/)?.[1];
   assert.ok(labelTarget);
   const input = html.match(/<input[^>]*>/)?.[0];
   assert.ok(input);
   assert.ok(input.includes(`id="${labelTarget}"`));
   const description = input.match(/aria-describedby="([^"]+)"/)?.[1];
   assert.ok(description && html.includes(`id="${description}"`));
});
