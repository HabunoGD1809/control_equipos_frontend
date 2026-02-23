"use client";
import { Documentacion, TipoDocumento } from "@/types/api";
import { DocumentacionTable } from "./DocumentacionTable";

interface EquipoDocumentacionTabProps {
   equipoId: string;
   documentos: Documentacion[];
   tiposDocumento: TipoDocumento[];
}

export function EquipoDocumentacionTab({ equipoId, documentos, tiposDocumento }: EquipoDocumentacionTabProps) {
   return (
      <div className="mt-4">
         <DocumentacionTable
            documentos={documentos}
            tiposDocumento={tiposDocumento}
            equipoId={equipoId}
            showEquipoColumn={false}
         />
      </div>
   );
}
