"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
   EstadoEquipo,
   TipoDocumento,
   TipoMantenimiento,
   Proveedor,
   Ubicacion,
   Tecnico,
   Departamento,
   Marca,
   Empleado,
} from "@/types/api";
import { GenericCatalogTab } from "@/components/features/catalogos/GenericCatalogTab";
import { ProveedoresTab } from "@/components/features/proveedores/ProveedoresTab";
import { TecnicosTab } from "@/components/features/catalogos/TecnicosTab";
import { api } from "@/lib/http";

// Qué tabs ya fueron activados (para montarlos solo una vez)
type TabKey =
   | "empleados"
   | "estados"
   | "departamentos"
   | "ubicaciones"
   | "marcas"
   | "tipos-documento"
   | "tipos-mantenimiento"
   | "proveedores"
   | "tecnicos";

// Datos que cada tab necesita
type TabData = {
   empleados: Empleado[];
   estados: EstadoEquipo[];
   departamentos: Departamento[];
   ubicaciones: Ubicacion[];
   marcas: Marca[];
   tiposDocumento: TipoDocumento[];
   tiposMantenimiento: TipoMantenimiento[];
   proveedores: Proveedor[];
   tecnicos: Tecnico[];
};

// Qué endpoint y key de TabData corresponde a cada tab
const TAB_CONFIG: Record<TabKey, { endpoint: string; dataKey: keyof TabData } | null> = {
   empleados: { endpoint: "/empleados/", dataKey: "empleados" },
   estados: { endpoint: "/catalogos/estados-equipo/", dataKey: "estados" },
   departamentos: { endpoint: "/catalogos/departamentos/", dataKey: "departamentos" },
   ubicaciones: { endpoint: "/ubicaciones/", dataKey: "ubicaciones" },
   marcas: { endpoint: "/catalogos/marcas/", dataKey: "marcas" },
   "tipos-documento": { endpoint: "/catalogos/tipos-documento/", dataKey: "tiposDocumento" },
   "tipos-mantenimiento": { endpoint: "/catalogos/tipos-mantenimiento/", dataKey: "tiposMantenimiento" },
   proveedores: { endpoint: "/proveedores/", dataKey: "proveedores" },
   tecnicos: { endpoint: "/tecnicos/", dataKey: "tecnicos" },
};

interface CatalogosClientProps {
   /** Solo los empleados vienen del servidor (tab por defecto). */
   initialEmpleados: Empleado[];
}

export const CatalogosClient: React.FC<CatalogosClientProps> = ({
   initialEmpleados,
}) => {
   // Tabs que ya han sido activados al menos una vez (para no desmontar su contenido)
   const [mountedTabs, setMountedTabs] = useState<Set<TabKey>>(
      new Set(["empleados"])
   );

   // Estado de datos por tab. Solo empleados viene pre-cargado del servidor.
   const [tabData, setTabData] = useState<Partial<TabData>>({
      empleados: initialEmpleados,
   });

   // Estado de carga por tab (para mostrar skeleton si es necesario)
   const [loadingTabs, setLoadingTabs] = useState<Set<TabKey>>(new Set());

   const fetchTabData = useCallback(
      async (tab: TabKey) => {
         // Si ya tenemos datos, no volvemos a fetchar
         const config = TAB_CONFIG[tab];
         if (!config) return;
         if (tabData[config.dataKey] !== undefined) return;

         setLoadingTabs((prev) => new Set(prev).add(tab));
         try {
            const data = await api.get<any[]>(config.endpoint, {
               params: { limit: 500 },
            });
            setTabData((prev) => ({ ...prev, [config.dataKey]: data }));
         } catch (err) {
            console.error(`[CatalogosClient] Error fetching ${tab}:`, err);
            // Guardamos array vacío para no reintentar en loops
            setTabData((prev) => ({ ...prev, [config.dataKey]: [] }));
         } finally {
            setLoadingTabs((prev) => {
               const next = new Set(prev);
               next.delete(tab);
               return next;
            });
         }
      },
      [tabData]
   );

   const handleTabChange = useCallback(
      (value: string) => {
         const tab = value as TabKey;
         // Marcar como montado (no desmontar al cambiar)
         setMountedTabs((prev) => new Set(prev).add(tab));
         // Disparar fetch lazy si es la primera activación
         fetchTabData(tab);
      },
      [fetchTabData]
   );

   // Helper para saber si un tab está cargando
   const isLoading = (tab: TabKey) => loadingTabs.has(tab);

   // Función que refresca los datos de un tab concreto
   const refreshTab = useCallback(async (tab: TabKey) => {
      const config = TAB_CONFIG[tab];
      if (!config) return;
      try {
         const data = await api.get<any[]>(config.endpoint, { params: { limit: 500 } });
         setTabData((prev) => ({ ...prev, [config.dataKey]: data }));
      } catch (err) {
         console.error(`[CatalogosClient] Error refreshing ${tab}:`, err);
      }
   }, []);

   // Proveedores los necesita TecnicosTab también
   const proveedores = (tabData.proveedores ?? []) as Proveedor[];

   return (
      <Tabs
         defaultValue="empleados"
         className="w-full"
         onValueChange={handleTabChange}
      >
         <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
            <TabsTrigger value="empleados">Empleados</TabsTrigger>
            <TabsTrigger value="estados">Estados de Equipo</TabsTrigger>
            <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
            <TabsTrigger value="ubicaciones">Ubicaciones Físicas</TabsTrigger>
            <TabsTrigger value="marcas">Marcas</TabsTrigger>
            <TabsTrigger value="tipos-documento">Tipos de Doc.</TabsTrigger>
            <TabsTrigger value="tipos-mantenimiento">Tipos de Mant.</TabsTrigger>
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
            <TabsTrigger value="tecnicos">Técnicos</TabsTrigger>
         </TabsList>

         {/* ── EMPLEADOS (pre-cargado desde servidor) ── */}
         <TabsContent value="empleados" className="mt-0 animate-in fade-in duration-300">
            <GenericCatalogTab
               data={(tabData.empleados ?? []) as any[]}
               title="Empleado"
               apiEndpoint="/empleados"
               formFields={["nombre_completo", "cargo", "email_corporativo", "departamento_id"]}
            />
         </TabsContent>

         {/* ── ESTADOS ── */}
         {mountedTabs.has("estados") && (
            <TabsContent value="estados" className="mt-0 animate-in fade-in duration-300">
               <GenericCatalogTab
                  data={(tabData.estados ?? []) as any[]}
                  title="Estado de Equipo"
                  apiEndpoint="/catalogos/estados-equipo"
                  formFields={["nombre", "descripcion", "color_hex"]}
                  isLoading={isLoading("estados")}
               />
            </TabsContent>
         )}

         {/* ── DEPARTAMENTOS ── */}
         {mountedTabs.has("departamentos") && (
            <TabsContent value="departamentos" className="mt-0 animate-in fade-in duration-300">
               <GenericCatalogTab
                  data={(tabData.departamentos ?? []) as any[]}
                  title="Departamento"
                  apiEndpoint="/catalogos/departamentos"
                  formFields={["nombre", "descripcion"]}
                  isLoading={isLoading("departamentos")}
               />
            </TabsContent>
         )}

         {/* ── MARCAS ── */}
         {mountedTabs.has("marcas") && (
            <TabsContent value="marcas" className="mt-0 animate-in fade-in duration-300">
               <GenericCatalogTab
                  data={(tabData.marcas ?? []) as any[]}
                  title="Marca"
                  apiEndpoint="/catalogos/marcas"
                  formFields={["nombre"]}
                  isLoading={isLoading("marcas")}
               />
            </TabsContent>
         )}

         {/* ── TIPOS DE DOCUMENTO ── */}
         {mountedTabs.has("tipos-documento") && (
            <TabsContent value="tipos-documento" className="mt-0 animate-in fade-in duration-300">
               <GenericCatalogTab
                  data={(tabData.tiposDocumento ?? []) as any[]}
                  title="Tipo de Documento"
                  apiEndpoint="/catalogos/tipos-documento"
                  formFields={["nombre", "descripcion"]}
                  isLoading={isLoading("tipos-documento")}
               />
            </TabsContent>
         )}

         {/* ── TIPOS DE MANTENIMIENTO ── */}
         {mountedTabs.has("tipos-mantenimiento") && (
            <TabsContent value="tipos-mantenimiento" className="mt-0 animate-in fade-in duration-300">
               <GenericCatalogTab
                  data={(tabData.tiposMantenimiento ?? []) as any[]}
                  title="Tipo de Mantenimiento"
                  apiEndpoint="/catalogos/tipos-mantenimiento"
                  formFields={["nombre", "descripcion", "es_preventivo", "periodicidad_dias"]}
                  isLoading={isLoading("tipos-mantenimiento")}
               />
            </TabsContent>
         )}

         {/* ── PROVEEDORES ── */}
         {mountedTabs.has("proveedores") && (
            <TabsContent value="proveedores" className="mt-0 animate-in fade-in duration-300">
               <ProveedoresTab
                  data={(tabData.proveedores ?? []) as Proveedor[]}
                  isLoading={isLoading("proveedores")}
               />
            </TabsContent>
         )}

         {/* ── TÉCNICOS (necesita proveedores también) ── */}
         {mountedTabs.has("tecnicos") && (
            <TabsContent value="tecnicos" className="mt-0 animate-in fade-in duration-300">
               <TecnicosTab
                  initialData={(tabData.tecnicos ?? []) as Tecnico[]}
                  proveedores={proveedores}
                  isLoading={isLoading("tecnicos")}
               />
            </TabsContent>
         )}

         {/* ── UBICACIONES ── */}
         {mountedTabs.has("ubicaciones") && (
            <TabsContent value="ubicaciones" className="mt-0 animate-in fade-in duration-300">
               <GenericCatalogTab
                  data={(tabData.ubicaciones ?? []) as any[]}
                  title="Ubicación Física"
                  apiEndpoint="/ubicaciones"
                  formFields={["nombre", "edificio", "departamento_id"]}
                  isUbicacion={true}
                  isLoading={isLoading("ubicaciones")}
               />
            </TabsContent>
         )}
      </Tabs>
   );
};
