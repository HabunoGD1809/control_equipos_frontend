import { cookies } from 'next/headers';
import { Documentacion, TipoDocumento } from "@/types/api";
import { DocumentacionClient } from './components/DocumentacionClient';

async function getDocumentacionPageData() {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return { documentos: [], tiposDocumento: [] };

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [documentosRes, tiposDocRes] = await Promise.all([
         fetch(`${baseUrl}/documentacion/?limit=200`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/catalogos/tipos-documento/`, { headers, cache: 'no-store' }),
      ]);

      const documentos = documentosRes.ok ? await documentosRes.json() : [];
      const tiposDocumento = tiposDocRes.ok ? await tiposDocRes.json() : [];

      return { documentos, tiposDocumento };

   } catch (error) {
      console.error("[GET_DOCUMENTACION_PAGE_DATA_ERROR]", error);
      return { documentos: [], tiposDocumento: [] };
   }
}

export default async function DocumentacionPage() {
   const { documentos, tiposDocumento } = await getDocumentacionPageData();

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Documentación</h1>
            <p className="text-muted-foreground">
               Consulte, verifique y gestione todos los documentos del sistema.
            </p>
         </div>
         <DocumentacionClient
            initialData={documentos}
            tiposDocumento={tiposDocumento}
         />
      </div>
   );
}
