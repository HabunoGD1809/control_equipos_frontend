import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { data, login, select, boundedLayout, screenshot } from "./fixtures";

test("Catálogo: crear un tóner con color, rendimiento y modelos compatibles", async ({ page }, info) => {
   await login(page); await page.goto("/inventario");
   await page.getByRole("tab", { name: "Catálogo", exact: true }).click();
   await page.getByRole("button", { name: "Nuevo Ítem", exact: true }).click();
   const dialog = page.getByRole("dialog"); await boundedLayout(page, dialog);
   const name = `Tóner E2E ${info.project.name} ${Date.now()}`;
   await dialog.getByLabel(/Nombre del Ítem/).fill(name);
   await select(page, dialog.getByLabel(/Categoría/), "Consumible");
   await select(page, dialog.getByLabel(/Unidad de Medida/), "Unidad");
   await select(page, dialog.getByLabel("Tecnología", { exact: true }), "Tóner");
   await dialog.getByRole("radiogroup", { name: "Color del consumible" }).getByText("Cian", { exact: true }).click();
   await dialog.getByLabel("Rendimiento en páginas").fill("3000");
   await dialog.getByLabel("Impresoras compatibles").fill("LaserJet M404, M428");
   await screenshot(page, info, "toner");
   const saved = page.waitForResponse(response => response.url().includes("/api/proxy/inventario/tipos") && response.request().method() === "POST" && !(response.status() >= 300 && response.status() < 400));
   await dialog.getByRole("button", { name: "Crear Ítem" }).click();
   const response = await saved; expect(response.status()).toBe(201);
   expect(await response.json()).toMatchObject({ nombre: name, color: "Cian", rendimiento_paginas: 3000, modelos_equipo_compatibles: ["LaserJet M404", "M428"] });
   await expect(dialog).toHaveCount(0); await boundedLayout(page);
});

test("Documentación: subir y descargar conserva el archivo original", async ({ page }, info) => {
   await login(page); await page.goto("/documentacion");
   await page.getByRole("button", { name: "Subir Documento" }).click();
   const dialog = page.getByRole("dialog"); await boundedLayout(page, dialog);
   const title = `Documento E2E ${info.project.name} ${Date.now()}`;
   await dialog.getByLabel(/Título del Documento/).fill(title);
   await dialog.getByLabel(/Vincular documento/).click();
   await page.getByPlaceholder("Escriba para buscar...").fill(data.steps["equipment-0"].numero_serie);
   await page.getByRole("option").filter({ hasText: data.steps["equipment-0"].numero_serie }).click();
   await select(page, dialog.getByLabel(/Tipo de Documento/), /^Factura Compra\b/);
   await dialog.locator('input[type="file"]').setInputFiles(data.sample_pdf);
   await dialog.getByRole("button", { name: "Subir Archivo" }).click();
   await expect(dialog).toHaveCount(0);
   await page.getByRole("searchbox").fill(title);
   const row = page.getByRole("row").filter({ hasText: title }); await expect(row).toBeVisible();
   const download = page.waitForEvent("download");
   await row.getByRole("button", { name: "Descargar", exact: true }).click();
   const file = await download; expect(await file.failure()).toBeNull();
   expect(readFileSync((await file.path())!)).toEqual(readFileSync(data.sample_pdf));
   await boundedLayout(page);
});

test("Inventario: recibir abastecimiento conserva procedencia, documento y saldo", async ({ page }, info) => {
   await login(page); await page.goto("/inventario");
   const item = data.steps["item-0"], place = data.steps["place-0"];
   const before = await page.request.get(`/api/proxy/inventario/stock?tipo_item_id=${item.id}`);
   const totalBefore = (await before.json()).reduce((total: number, row: { cantidad_actual: number }) => total + Number(row.cantidad_actual), 0);
   await page.getByRole("button", { name: "Movimiento", exact: true }).click();
   const dialog = page.getByRole("dialog"); await boundedLayout(page, dialog);
   await dialog.getByLabel(/Item de Inventario/).click();
   await page.getByRole("option").filter({ hasText: item.nombre }).click();
   await select(page, dialog.getByLabel(/Tipo de Movimiento/), "Entrada Abastecimiento");
   await dialog.getByLabel(/Cantidad/).fill("5");
   await dialog.getByLabel(/Ubicación Destino/).click();
   await page.getByRole("option").filter({ hasText: place.nombre }).click();
   await dialog.getByLabel(/Procedencia/).fill("Departamento de Suministro QA");
   await dialog.getByLabel("Entregado por").fill("Proveedor de pruebas");
   const reference = `SUM-E2E-${info.project.name}-${Date.now()}`;
   await dialog.getByLabel(/Acta, remisión, orden o factura/).fill(reference);
   const saved = page.waitForResponse(response => response.url().includes("/api/proxy/inventario/movimientos") && response.request().method() === "POST" && !(response.status() >= 300 && response.status() < 400));
   await dialog.getByRole("button", { name: "Registrar Movimiento", exact: true }).click();
   const response = await saved; expect(response.status()).toBe(201);
   expect(await response.json()).toMatchObject({ procedencia: "Departamento de Suministro QA", referencia_externa: reference, cantidad: 5 });
   await expect(dialog).toHaveCount(0);
   const after = await page.request.get(`/api/proxy/inventario/stock?tipo_item_id=${item.id}`);
   expect((await after.json()).reduce((total: number, row: { cantidad_actual: number }) => total + Number(row.cantidad_actual), 0)).toBe(totalBefore + 5);
   await boundedLayout(page);
});

test("Equipos: crear, consultar y obtener la ficha PDF protegida", async ({ page }, info) => {
   await login(page); await page.goto("/equipos");
   await page.getByRole("button", { name: "Nuevo Equipo" }).click();
   const dialog = page.getByRole("dialog"); await boundedLayout(page, dialog);
   const name = `Equipo E2E ${info.project.name} ${Date.now()}`;
   await dialog.getByLabel(/Nombre del Equipo/).fill(name);
   await dialog.getByLabel(/Número de Serie/).fill(`E2E-${info.project.name}-${Date.now()}`);
   await select(page, dialog.getByLabel(/Estado Inicial/), "Disponible");
   const saved = page.waitForResponse(response => response.url().includes("/api/proxy/equipos") && response.request().method() === "POST" && !(response.status() >= 300 && response.status() < 400));
   await dialog.getByRole("button", { name: "Registrar Equipo" }).click();
   const response = await saved; expect(response.status()).toBe(201);
   const equipment = await response.json(); await expect(dialog).toHaveCount(0);
   await page.goto("/equipos/" + equipment.id);
   await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
   const pdf = await page.request.get(`/api/proxy/equipos/${equipment.id}/ficha`);
   expect(pdf.ok()).toBeTruthy(); expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
   await boundedLayout(page);
});

for (const [format, label, signature] of [["pdf", "Documento PDF", "%PDF-"], ["excel", "Excel (.xlsx)", "PK"], ["csv", "Archivo Plano (CSV)", ""]]) {
   test(`Reportes: generar y descargar ${format} desde el formulario`, async ({ page }) => {
      await login(page); await page.goto("/reportes");
      const countResponse = await page.request.get("/api/proxy/notificaciones/count/unread");
      const unread = (await countResponse.json()).unread_count as number;
      const bell = page.getByRole("button", { name: /^Notificaciones \(/ });
      await expect(bell).toHaveAttribute("aria-label", `Notificaciones (${unread} sin leer)`);
      await select(page, page.getByLabel("Módulo de Datos"), "Catálogo de Equipos");
      await select(page, page.getByLabel("Formato de Exportación"), label);
      const saved = page.waitForResponse(response => response.url().includes("/api/proxy/reportes") && response.request().method() === "POST" && !(response.status() >= 300 && response.status() < 400));
      await page.getByRole("button", { name: "Solicitar Reporte", exact: true }).click();
      const response = await saved; expect(response.status()).toBe(200);
      const report = await response.json();
      await expect(async () => {
         const downloaded = await page.request.get(`/api/proxy/reportes/${report.reporte_id}/download`);
         expect(downloaded.status()).toBe(200);
         const bytes = await downloaded.body(); expect(bytes.length).toBeGreaterThan(10);
         if (signature) expect(bytes.subarray(0, signature.length).toString()).toBe(signature);
      }).toPass({ timeout: 45000, intervals: [1000, 2000] });
      await expect.poll(async () => Number((await bell.getAttribute("aria-label"))!.match(/\((\d+) sin leer\)/)![1]), { timeout: 8000, intervals: [200] }).toBeGreaterThan(unread);
      await boundedLayout(page);
   });
}

test("Perfil: la foto aparece en la cabecera y en el menú, con acceso privado", async ({ page }, info) => {
   await login(page); await page.goto("/perfil");
   await page.locator('input[type="file"]').setInputFiles(data.profile_photo);
   const dialog = page.getByRole("dialog");
   await expect(dialog.getByRole("heading", { name: "Ajustar foto de perfil" })).toBeVisible();
   await boundedLayout(page, dialog);
   await dialog.getByRole("button", { name: "Aplicar", exact: true }).click();
   await expect(dialog).toHaveCount(0);
   const header = page.locator('main').getByRole("img", { name: "Foto de admin", exact: true });
   await expect(header).toBeVisible();
   if (info.project.name === "desktop") {
      await expect(page.getByRole("complementary").getByRole("img", { name: "Foto de admin", exact: true })).toBeVisible();
   }
   const src = await header.getAttribute("src"); expect(src).toMatch(/^\/api\/avatar\/user_[a-f0-9-]+\.jpg\?v=/);
   const anonymous = await page.context().browser()!.newContext();
   try { expect((await anonymous.request.get(new URL(src!, page.url()).toString())).status()).toBe(401); }
   finally { await anonymous.close(); }
   await boundedLayout(page);
});

test("Empresa: guardar identidad y logo actualiza el acceso público", async ({ page }, info) => {
   await login(page); await page.goto("/administracion/empresa");
   const name = `Informática E2E ${info.project.name} ${Date.now()}`;
   await page.getByLabel(/Nombre de la empresa/).fill(name);
   await page.getByRole("button", { name: "Guardar datos", exact: true }).click();
   await expect(page.getByRole("button", { name: "Guardar datos", exact: true })).toBeDisabled();
   await page.getByLabel("Imagen del logo", { exact: true }).setInputFiles(data.profile_photo);
   await page.getByRole("button", { name: "Guardar logo", exact: true }).click();
   await expect(page.getByRole("button", { name: "Quitar logo", exact: true })).toBeVisible();
   await boundedLayout(page);
   const anonymous = await page.context().browser()!.newContext({ viewport: page.viewportSize()! });
   try {
      const access = await anonymous.newPage(); await access.goto(new URL("/login", page.url()).toString());
      await expect(access.getByText(name, { exact: true })).toBeVisible();
      const logo = access.getByRole("img", { name: `Logo de ${name}`, exact: true });
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await boundedLayout(access);
   } finally { await anonymous.close(); }
});
