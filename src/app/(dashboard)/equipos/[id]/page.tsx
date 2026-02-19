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

async function getData(id: string) {
   try {
      const [
         equipo,
         componentes,
         padres,
         mantenimientos,
         documentos,
         movimientos,
         asignaciones,
         equiposDisponibles,
         tiposMantenimiento,
         tiposDocumento,
         proveedores,
      ] = await Promise.all([
         serverApi.get<EquipoRead>(`/equipos/${id}`),

         serverApi.get<ComponenteInfo[]>(`/equipos/${id}/componentes`).catch(() => []),
         serverApi.get<PadreInfo[]>(`/equipos/${id}/parte_de`).catch(() => []),

         serverApi.get<Mantenimiento[]>(`/mantenimientos/?equipo_id=${id}&limit=100`).catch(() => []),
         serverApi.get<Documentacion[]>(`/documentacion/equipo/${id}?limit=100`).catch(() => []),
         serverApi.get<Movimiento[]>(`/movimientos/?equipo_id=${id}&limit=100`).catch(() => []),

         serverApi.get<LicenciaAsignacion[]>(`/licencias/asignaciones/?equipo_id=${id}&limit=100`).catch(() => []),

         serverApi.get<EquipoSimple[]>(`/equipos/?limit=500`).catch(() => []),
         serverApi.get<TipoMantenimiento[]>(`/catalogos/tipos-mantenimiento/`).catch(() => []),
         serverApi.get<TipoDocumento[]>(`/catalogos/tipos-documento/`).catch(() => []),
         serverApi.get<Proveedor[]>(`/proveedores/?limit=500`).catch(() => []),
      ]);

      const licencias = (asignaciones ?? []).map((a) => a.licencia);

      return {
         equipo,
         componentes,
         padres,
         mantenimientos,
         documentos,
         movimientos,
         licencias,
         equiposDisponibles,
         tiposMantenimiento,
         tiposDocumento,
         proveedores,
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
