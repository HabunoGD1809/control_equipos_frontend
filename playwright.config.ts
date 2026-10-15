import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3100";
const address = new URL(baseURL);
if (!["localhost", "127.0.0.1"].includes(address.hostname)) throw new Error("E2E requiere una instancia local de prueba.");

export default defineConfig({
   testDir: "./tests/e2e",
   globalSetup: "./tests/e2e/guard.ts",
   timeout: 90000,
   expect: { timeout: 12000 },
   fullyParallel: false,
   workers: 1,
   retries: 0,
   reporter: [["list"], ["json", { outputFile: "test-results/e2e-results.json" }]],
   use: { baseURL, locale: "es-DO", timezoneId: "America/Caracas", trace: "off", video: "off", screenshot: "only-on-failure", acceptDownloads: true,
      launchOptions: process.env.E2E_DOWNLOADS_DIR ? { downloadsPath: process.env.E2E_DOWNLOADS_DIR } : undefined },
   projects: [
      { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } },
      { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } } },
   ],
});
