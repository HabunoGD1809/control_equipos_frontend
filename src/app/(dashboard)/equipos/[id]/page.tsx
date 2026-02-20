import { notFound, redirect } from "next/navigation";
import { EquipoDetailClient } from "./components/EquipoDetailClient";
import { serverApi } from "@/lib/http-server";
import type {
   EquipoRead,
   Mantenimiento,
   Documentacion,
   Movimiento,
   TipoMantenimiento,
   TipoDocumento,
   EquipoSimple,
   ComponenteInfo,
   PadreInfo,
   LicenciaSoftware,
   Proveedor,
} from "@/types/api";

interface PageProps {
   params: Promise<{ id: string }>;
}

type LicenciaAsignacion = { licencia: LicenciaSoftware };

function unwrap<T>(data: any): T[] {
   if (!data) return [];
   if (Array.isArray(data)) return data;
   if (typeof data === "object" && "items" in data && Array.isArray(data.items)) {
      return data.items;
   }
   return [];
}

async function getData(id: string) {
   try {
      const [
         equipo,
         compRes,
         padresRes,
         mtoRes,
         docsRes,
         movRes,
         asigRes,
         equiposRes,
         tiposMtoRes,
         tiposDocRes,
         provRes,
      ] = await Promise.all([
         serverApi.get<EquipoRead>(`/equipos/${id}`),

         serverApi.get<any>(`/equipos/${id}/componentes`).catch(() => []),
         serverApi.get<any>(`/equipos/${id}/parte_de`).catch(() => []),

         serverApi.get<any>(`/mantenimientos/?equipo_id=${id}&limit=100`).catch(() => []),

         serverApi.get<any>(`/documentacion/equipo/${id}?limit=100`).catch(() => []),
         serverApi.get<any>(`/movimientos/?equipo_id=${id}&limit=100`).catch(() => []),

         serverApi.get<any>(`/licencias/asignaciones/?equipo_id=${id}&limit=100`).catch(() => []),

         serverApi.get<any>(`/equipos/?limit=500`).catch(() => []),
         serverApi.get<any>(`/catalogos/tipos-mantenimiento/`).catch(() => []),
         serverApi.get<any>(`/catalogos/tipos-documento/`).catch(() => []),
         serverApi.get<any>(`/proveedores/?limit=500`).catch(() => []),
      ]);

      const asignaciones = unwrap<LicenciaAsignacion>(asigRes);
      const licencias = asignaciones.map((a) => a.licencia);

      return {
         equipo,
         componentes: unwrap<ComponenteInfo>(compRes),
         padres: unwrap<PadreInfo>(padresRes),
         mantenimientos: unwrap<Mantenimiento>(mtoRes),
         documentos: unwrap<Documentacion>(docsRes),
         movimientos: unwrap<Movimiento>(movRes),
         licencias,
         equiposDisponibles: unwrap<EquipoSimple>(equiposRes),
         tiposMantenimiento: unwrap<TipoMantenimiento>(tiposMtoRes),
         tiposDocumento: unwrap<TipoDocumento>(tiposDocRes),
         proveedores: unwrap<Proveedor>(provRes),
      };
   } catch (e: unknown) {
      const err = e as Error & { status?: number };
      if (err.status === 401) redirect("/login");
      return null;
   }
}

export default async function EquipoDetailPage({ params }: PageProps) {
   const { id } = await params;
   const data = await getData(id);

   if (!data) notFound();
   return <EquipoDetailClient {...data} />;
}
