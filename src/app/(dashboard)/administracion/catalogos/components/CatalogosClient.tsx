"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { EstadoEquipo, TipoDocumento, TipoMantenimiento, Proveedor } from "@/types/api";
import { GenericCatalogTab } from "@/components/features/catalogos/GenericCatalogTab";
import { ProveedoresTab } from "@/components/features/proveedores/ProveedoresTab";

interface CatalogosClientProps {
   initialEstados: EstadoEquipo[];
   initialTiposDocumento: TipoDocumento[];
   initialTiposMantenimiento: TipoMantenimiento[];
   initialProveedores: Proveedor[];
}

export const CatalogosClient: React.FC<CatalogosClientProps> = ({
   initialEstados,
   initialTiposDocumento,
   initialTiposMantenimiento,
   initialProveedores
}) => {
   return (
      <Tabs defaultValue="estados">
         <TabsList>
            <TabsTrigger value="estados">Estados de Equipo</TabsTrigger>
            <TabsTrigger value="tipos-documento">Tipos de Documento</TabsTrigger>
            <TabsTrigger value="tipos-mantenimiento">Tipos de Mantenimiento</TabsTrigger>
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
         </TabsList>

         <TabsContent value="estados" className="mt-4">
            <GenericCatalogTab
               data={initialEstados}
               title="Estado de Equipo"
               apiEndpoint="/catalogos/estados-equipo"
               formFields={['nombre', 'descripcion', 'color_hex']}
            />
         </TabsContent>

         <TabsContent value="tipos-documento" className="mt-4">
            <GenericCatalogTab
               data={initialTiposDocumento}
               title="Tipo de Documento"
               apiEndpoint="/catalogos/tipos-documento"
               formFields={['nombre', 'descripcion']}
            />
         </TabsContent>

         <TabsContent value="tipos-mantenimiento" className="mt-4">
            <GenericCatalogTab
               data={initialTiposMantenimiento}
               title="Tipo de Mantenimiento"
               apiEndpoint="/catalogos/tipos-mantenimiento"
               formFields={['nombre', 'descripcion', 'es_preventivo', 'periodicidad_dias']}
            />
         </TabsContent>

         <TabsContent value="proveedores" className="mt-4">
            <ProveedoresTab data={initialProveedores} />
         </TabsContent>
      </Tabs>
   );
}
