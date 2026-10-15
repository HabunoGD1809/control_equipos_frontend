import { request, type FullConfig } from "@playwright/test";
import { data } from "./fixtures";

export default async function guard(config: FullConfig) {
   const client = await request.newContext({ baseURL: config.projects[0].use.baseURL });
   try {
      const build = process.env.E2E_BUILD_ID;
      if (build) {
         if (!/^[A-Za-z0-9_-]+$/.test(build) || !(await client.get(`/_next/static/${build}/_buildManifest.js`)).ok()) {
            throw new Error("E2E se detuvo: la instancia está ejecutando otra compilación. Reinicia el frontend con el directorio preparado.");
         }
      }
      const response = await client.get("/api/health");
      if (!response.ok() || (await response.json()).test_database !== data.database) {
         throw new Error("E2E se detuvo: el frontend no apunta a la base aislada preparada. No se realizaron operaciones de prueba.");
      }
   } finally { await client.dispose(); }
}
