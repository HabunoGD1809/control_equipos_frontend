import { readFileSync } from "node:fs";
import { expect, type Page, type Locator } from "@playwright/test";

export interface Account { username: string; password: string; permissions?: string[]; final_password?: string; }
interface FixtureData {
   database: string; backend_url: string; run_id: string; prefix: string; orphan_access_token: string;
   admin: Account; roles: Record<string, Account>; first_login: Record<string, Account>;
   steps: Record<string, any>; sample_pdf: string; profile_photo: string;
}
if (!process.env.E2E_DATA_FILE) throw new Error("Prepare los datos aislados con scripts/prepare_e2e.py y configure E2E_DATA_FILE.");
export const data = JSON.parse(readFileSync(process.env.E2E_DATA_FILE, "utf8")) as FixtureData;
if (!data.database.includes("_test")) throw new Error("Se rechazó una base operativa para las pruebas E2E.");

export async function login(page: Page, account: Account = data.admin) {
   await page.goto("/login");
   await page.getByLabel(/usuario/i).fill(account.username);
   await page.getByLabel(/^contraseña$/i).fill(account.password);
   await page.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
   await expect(page).not.toHaveURL(/\/login$/);
   await expect(page.getByText(/Error de conexión con el servidor/)).toHaveCount(0);
}

export async function boundedLayout(page: Page, dialog?: Locator) {
   const viewport = page.viewportSize()!;
   expect(await page.evaluate(() => document.documentElement.scrollWidth), "La página no debe desbordarse horizontalmente").toBeLessThanOrEqual(viewport.width + 2);
   if (dialog) {
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox(); expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1); expect(box!.y).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
   }
}

export async function select(page: Page, control: Locator, label: string | RegExp) {
   await control.click();
   await page.getByRole("option", { name: label, exact: typeof label === "string" }).click();
}

export async function screenshot(page: Page, testInfo: { outputPath: (name: string) => string }, name: string) {
   await page.screenshot({ path: testInfo.outputPath(name + ".png"), fullPage: true });
}
