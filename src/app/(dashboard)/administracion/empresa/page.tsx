import { guardPage } from "@/lib/page-access";
import { EmpresaClient } from "./EmpresaClient";

export default async function EmpresaPage() {
   const pageAccessDenied = await guardPage("/administracion/empresa");
   if (pageAccessDenied) return pageAccessDenied;

   return <EmpresaClient />;
}
