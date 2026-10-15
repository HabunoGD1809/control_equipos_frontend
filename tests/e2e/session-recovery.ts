import { expect, type Page } from "@playwright/test";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "../../src/lib/constants";

/** Exercise a separate browser context containing a signed token for a removed user. */
export async function expectStaleSessionCleared(page: Page, baseURL: string, accessToken: string) {
   const context = page.context();
   await context.clearCookies();
   await context.addCookies([
      { name: AUTH_COOKIE_NAME, value: accessToken, url: baseURL, httpOnly: true, sameSite: "Lax" },
      { name: REFRESH_COOKIE_NAME, value: "removed-user-regression", url: baseURL, httpOnly: true, sameSite: "Lax" },
   ]);
   await page.goto(new URL("/dashboard", baseURL).href);
   await expect(page).toHaveURL(new URL("/login", baseURL).href);
   await expect(page.getByRole("button", { name: /iniciar sesión|ingresar/i })).toBeVisible();
   await expect.poll(async () => (await context.cookies(baseURL)).filter(cookie => [AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME].includes(cookie.name)).length).toBe(0);
   await page.reload();
   await expect(page).toHaveURL(new URL("/login", baseURL).href);
   expect((await page.request.get(new URL("/api/auth/me", baseURL).href)).status()).toBe(401);
}
