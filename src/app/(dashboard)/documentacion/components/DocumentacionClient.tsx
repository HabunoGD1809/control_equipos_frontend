"use client";
import { Documentacion, TipoDocumento } from "@/types/api";
import { DocumentacionTable } from "@/components/features/documentos/DocumentacionTable";

interface DocumentacionClientProps {
   initialData: Documentacion[];
   tiposDocumento: TipoDocumento[];
}

export function DocumentacionClient({ initialData, tiposDocumento }: DocumentacionClientProps) {
   return (
      <DocumentacionTable
         documentos={initialData}
         tiposDocumento={tiposDocumento}
         showEquipoColumn={true}
      />
   );
}
