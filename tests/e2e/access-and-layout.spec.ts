import { test, expect } from "@playwright/test";
import { data, login, boundedLayout, screenshot } from "./fixtures";
import { expectStaleSessionCleared } from "./session-recovery";

test.beforeAll(async ({ request }) => {
   const response = await request.get("/api/health");
   expect(response.ok()).toBeTruthy();
   expect((await response.json()).test_database).toBe(data.database);
});

test("Una sesión de un usuario eliminado vuelve al login y elimina sus cookies", async ({ page, baseURL }) => {
   expect(data.orphan_access_token, "Prepare nuevamente los datos E2E para incluir la sesión eliminada").toBeTruthy();
   await expectStaleSessionCleared(page, baseURL!, data.orphan_access_token);
});

test("El primer acceso exige cambiar la contraseña y mantiene visible el formulario", async ({ page }, testInfo) => {
   const account = data.first_login[testInfo.project.name];
   await login(page, account);
   const dialog = page.getByRole("dialog");
   await expect(dialog.getByRole("heading", { name: "Acción Requerida" })).toBeVisible();
   await boundedLayout(page, dialog);
   await dialog.getByLabel("Contraseña Actual Temporal").fill(account.password);
   await dialog.getByLabel("Nueva Contraseña Segura").fill(account.final_password!);
   await dialog.getByLabel("Confirmar Nueva Contraseña").fill(account.final_password!);
   await dialog.getByRole("button", { name: "Actualizar y Continuar" }).click();
   await expect(page).toHaveURL(/\/dashboard$/);
   await expect(page.getByRole("heading", { name: "Acción Requerida" })).toHaveCount(0);
   await boundedLayout(page);
});

const pages: Array<[string, string[]]> = [
   ["/dashboard", ["ver_dashboard"]], ["/equipos", ["ver_equipos"]], ["/movimientos", ["ver_movimientos"]],
   ["/inventario", ["ver_inventario"]], ["/mantenimientos", ["ver_mantenimientos"]], ["/reservas", ["ver_reservas"]],
   ["/licencias", ["ver_licencias"]], ["/documentacion", ["ver_documentos"]], ["/reportes", ["generar_reportes"]],
   ["/proveedores", ["ver_proveedores"]], ["/administracion/auditoria", ["ver_auditoria"]], ["/administracion/catalogos", ["administrar_catalogos"]],
   ["/administracion/usuarios", ["administrar_usuarios"]], ["/administracion/roles", ["administrar_roles"]],
   ["/administracion/empresa", ["administrar_sistema", "configurar_sistema"]], ["/administracion/backups", ["administrar_sistema"]], ["/perfil", []],
];

for (const label of ["admin", "supervisor", "tecnico", "auditor", "inventario", "sin_acceso"]) {
   test(`Pantallas y permisos del perfil ${label}`, async ({ page }, testInfo) => {
      test.setTimeout(180000);
      const account = label === "admin" ? data.admin : data.roles[label];
      await login(page, account);
      for (const [path, permissions] of pages) {
         await test.step(path, async () => {
            await page.goto(path);
            const allowed = label === "admin" || permissions.length === 0 || permissions.some(permission => account.permissions!.includes(permission));
            await expect(page.getByRole("heading", { name: "404", exact: true })).toHaveCount(0);
            const denied = page.getByText(/No tienes permiso|No tiene permiso|No tienes acceso|Acceso restringido|Acceso denegado/i).first();
            if (allowed) {
               await expect(denied).toHaveCount(0);
               await expect(page.getByText("No se pudo cargar esta pantalla")).toHaveCount(0);
               await expect(page.getByRole("heading", { name: "Servicio No Disponible", exact: true })).toHaveCount(0);
               await expect(page.getByRole("heading").first()).toBeVisible();
               if (["/licencias", "/mantenimientos", "/movimientos"].includes(path)) {
                  await expect(page.getByRole("region", { name: "Tabla de datos", exact: true }).getByText(new RegExp(data.prefix)).first()).toBeVisible();
               }
               if (path === "/licencias") {
                  await expect(page.getByRole("button", { name: "Registrar Licencia", exact: true })).toHaveCount(label === "admin" || account.permissions!.includes("administrar_licencias") ? 1 : 0);
                  await page.getByRole("tab", { name: "Catálogo", exact: true }).click();
                  await expect(page.getByRole("button", { name: "Añadir Software", exact: true })).toHaveCount(label === "admin" || account.permissions!.includes("administrar_software_catalogo") ? 1 : 0);
               }
            } else {
               await expect(denied).toBeVisible();
            }
            await boundedLayout(page);
         });
      }
      await screenshot(page, testInfo, "perfil-" + label);
   });
}

test("Roles: el diálogo permite crear y editar sin recortar los controles", async ({ page }, testInfo) => {
   await login(page); await page.goto("/administracion/roles");
   await page.getByRole("button", { name: "Nuevo Rol" }).click();
   const dialog = page.getByRole("dialog");
   await boundedLayout(page, dialog);
   const name = `E2E Rol ${testInfo.project.name} ${Date.now()}`;
   await dialog.getByLabel(/Nombre del Rol/).fill(name);
   await dialog.getByLabel("Descripción").fill("Rol de consulta creado desde el navegador");
   await dialog.getByRole("checkbox", { name: "Ver inventario", exact: true }).check();
   await screenshot(page, testInfo, "rol-creacion");
   await dialog.getByRole("button", { name: /Crear Rol|Guardar Rol/ }).click();
   await expect(dialog).toHaveCount(0);
   await page.getByRole("searchbox", { name: "Filtrar resultados de la tabla", exact: true }).fill(name);
   const row = page.getByRole("row").filter({ hasText: name });
   await expect(row).toBeVisible();
   await row.getByRole("button", { name: /Editar Rol/ }).click();
   await boundedLayout(page, page.getByRole("dialog"));
   await page.getByRole("dialog").getByLabel("Descripción").fill("Descripción editada desde el navegador");
   await page.getByRole("dialog").getByRole("button", { name: /Guardar Cambios|Guardar Rol/ }).click();
   await expect(page.getByRole("dialog")).toHaveCount(0);
   await expect(row).toContainText("Descripción editada");
});

test("La recuperación conserva el estilo de acceso y permite regresar al login", async ({ page }, testInfo) => {
   await page.goto("/reset-password");
   await expect(page.getByRole("heading", { name: "Restablecer contraseña" })).toBeVisible();
   await boundedLayout(page);
   await screenshot(page, testInfo, "restablecer-password");
   await page.getByRole("link", { name: /volver|regresar|atrás/i }).click();
   await expect(page).toHaveURL(/\/login$/);
   await expect(page.getByRole("button", { name: /iniciar sesión|ingresar/i })).toBeVisible();
});

test("Cerrar sesión vuelve al login y bloquea las descargas protegidas", async ({ page }) => {
   await login(page); await page.goto("/administracion/empresa");
   await page.getByRole("button", { name: /usuario|perfil|admin/i }).last().click();
   await page.getByRole("menuitem", { name: /Cerrar Sesión/i }).click();
   await page.getByRole("alertdialog").getByRole("button", { name: "Sí, cerrar sesión" }).click();
   await expect(page).toHaveURL(/\/login$/);
   await expect(page.getByText("No tienes permiso para configurar la empresa.")).toHaveCount(0);
   const asset = data.steps["equipment-0"];
   expect((await page.request.get(`/api/proxy/equipos/${asset.id}/ficha`)).status()).toBe(401);
});
