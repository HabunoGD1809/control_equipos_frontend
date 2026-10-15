import { guardPage } from "@/lib/page-access";
import { serverApi } from "@/lib/http-server";
import { collectPages } from "@/lib/collection-pages";
import { Documentacion, TipoDocumento } from "@/types/api";
import { DocumentacionClient } from './components/DocumentacionClient';

async function getDocumentacionPageData() {
   const [documentos, tiposDocumento] = await Promise.all([
      collectPages<Documentacion>((skip, limit) => serverApi.get('/documentacion/', { params: { skip, limit } })),
      collectPages<TipoDocumento>((skip, limit) => serverApi.get('/catalogos/tipos-documento/', { params: { skip, limit } })),
   ]);
   return { documentos, tiposDocumento };
}

export default async function DocumentacionPage() {
   const pageAccessDenied = await guardPage("/documentacion");
   if (pageAccessDenied) return pageAccessDenied;

   const { documentos, tiposDocumento } = await getDocumentacionPageData();

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Gestión de Documentación</h1>
            <p className="text-muted-foreground">
               Conserve actas, facturas, garantías y evidencias vinculadas a equipos, mantenimientos y licencias.
            </p>
         </div>
         <DocumentacionClient
            initialData={documentos}
            tiposDocumento={tiposDocumento}
         />
      </div>
   );
}
