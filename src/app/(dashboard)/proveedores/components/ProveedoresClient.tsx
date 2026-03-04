"use client";

import type { Proveedor } from "@/types/api";
import { ProveedoresTab } from "@/components/features/proveedores/ProveedoresTab";

interface ProveedoresClientProps {
   initialData: Proveedor[];
}

export const ProveedoresClient: React.FC<ProveedoresClientProps> = ({ initialData }) => {
   return (
      <div className="w-full animate-in fade-in duration-300">
         <ProveedoresTab data={initialData} />
      </div>
   );
};
