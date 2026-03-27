"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { EstadoEquipo, TipoDocumento, TipoMantenimiento, Proveedor, Ubicacion, Tecnico, Departamento, Marca } from "@/types/api";
import { GenericCatalogTab } from "@/components/features/catalogos/GenericCatalogTab";
import { ProveedoresTab } from "@/components/features/proveedores/ProveedoresTab";
import { TecnicosTab } from "@/components/features/catalogos/TecnicosTab";

interface CatalogosClientProps {
   initialEstados: EstadoEquipo[];
   initialTiposDocumento: TipoDocumento[];
   initialTiposMantenimiento: TipoMantenimiento[];
   initialProveedores: Proveedor[];
   initialUbicaciones: Ubicacion[];
   initialTecnicos: Tecnico[];
   initialDepartamentos: Departamento[];
   initialMarcas: Marca[];
}

export const CatalogosClient: React.FC<CatalogosClientProps> = ({
   initialEstados,
   initialTiposDocumento,
   initialTiposMantenimiento,
   initialProveedores,
   initialUbicaciones,
   initialTecnicos,
   initialDepartamentos,
   initialMarcas
}) => {
   return (
      <Tabs defaultValue="estados" className="w-full">
         <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
            <TabsTrigger value="estados">Estados de Equipo</TabsTrigger>
            <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
            <TabsTrigger value="ubicaciones">Ubicaciones Físicas</TabsTrigger>
            <TabsTrigger value="marcas">Marcas</TabsTrigger>
            <TabsTrigger value="tipos-documento">Tipos de Doc.</TabsTrigger>
            <TabsTrigger value="tipos-mantenimiento">Tipos de Mant.</TabsTrigger>
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
            <TabsTrigger value="tecnicos">Técnicos</TabsTrigger>
         </TabsList>

         <TabsContent value="estados" className="mt-0 animate-in fade-in duration-300">
            <GenericCatalogTab
               data={initialEstados as any[]}
               title="Estado de Equipo"
               apiEndpoint="/catalogos/estados-equipo"
               formFields={['nombre', 'descripcion', 'color_hex']}
            />
         </TabsContent>

         <TabsContent value="departamentos" className="mt-0 animate-in fade-in duration-300">
            <GenericCatalogTab
               data={initialDepartamentos as any[]}
               title="Departamento"
               apiEndpoint="/catalogos/departamentos"
               formFields={['nombre', 'descripcion']}
            />
         </TabsContent>

         <TabsContent value="marcas" className="mt-0 animate-in fade-in duration-300">
            <GenericCatalogTab
               data={initialMarcas as any[]}
               title="Marca"
               apiEndpoint="/catalogos/marcas"
               formFields={['nombre']}
            />
         </TabsContent>

         <TabsContent value="tipos-documento" className="mt-0 animate-in fade-in duration-300">
            <GenericCatalogTab
               data={initialTiposDocumento as any[]}
               title="Tipo de Documento"
               apiEndpoint="/catalogos/tipos-documento"
               formFields={['nombre', 'descripcion']}
            />
         </TabsContent>

         <TabsContent value="tipos-mantenimiento" className="mt-0 animate-in fade-in duration-300">
            <GenericCatalogTab
               data={initialTiposMantenimiento as any[]}
               title="Tipo de Mantenimiento"
               apiEndpoint="/catalogos/tipos-mantenimiento"
               formFields={['nombre', 'descripcion', 'es_preventivo', 'periodicidad_dias']}
            />
         </TabsContent>

         <TabsContent value="proveedores" className="mt-0 animate-in fade-in duration-300">
            <ProveedoresTab data={initialProveedores} />
         </TabsContent>

         <TabsContent value="tecnicos" className="mt-0 animate-in fade-in duration-300">
            <TecnicosTab initialData={initialTecnicos} proveedores={initialProveedores} />
         </TabsContent>

         <TabsContent value="ubicaciones" className="mt-0 animate-in fade-in duration-300">
            <GenericCatalogTab
               data={initialUbicaciones as any[]}
               title="Ubicación Física"
               apiEndpoint="/ubicaciones"
               formFields={['nombre', 'edificio', 'departamento_id']}
               isUbicacion={true}
            />
         </TabsContent>
      </Tabs>
   );
}
