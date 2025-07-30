import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import {
   EquipoRead, Mantenimiento, Documentacion, Movimiento,
   TipoMantenimiento, TipoDocumento, EquipoSimple, ComponenteInfo, PadreInfo, LicenciaSoftware
} from "@/types/api";
import { EquipoDetailClient } from './components/EquipoDetailClient';

async function getData(id: string) {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return null;

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   const endpoints = [
      `/equipos/${id}`,
      `/equipos/${id}/componentes`,
      `/equipos/${id}/parte_de`,
      `/mantenimientos/?equipo_id=${id}&limit=100`,
      `/documentacion/equipo/${id}?limit=100`,
      `/movimientos/?equipo_id=${id}&limit=100`,
      `/licencias/asignaciones/?equipo_id=${id}&limit=100`,
      `/equipos/?limit=1000`,
      `/catalogos/tipos-mantenimiento/`,
      `/catalogos/tipos-documento/`,
   ];

   try {
      const responses = await Promise.all(
         endpoints.map(endpoint => fetch(`${baseUrl}${endpoint}`, { headers, cache: 'no-store' }))
      );

      const [
         equipoRes, componentesRes, parteDeRes, mantenimientosRes,
         documentosRes, movimientosRes, licenciasRes, equiposDisponiblesRes,
         tiposMantenimientoRes, tiposDocumentoRes
      ] = responses;

      if (!equipoRes.ok) return null;

      // ✅ Procesamos la respuesta de asignaciones para obtener solo las licencias
      const asignaciones = licenciasRes.ok ? await licenciasRes.json() as { licencia: LicenciaSoftware }[] : [];
      const licencias = asignaciones.map(a => a.licencia);

      const data = {
         equipo: await equipoRes.json() as EquipoRead,
         componentes: componentesRes.ok ? await componentesRes.json() as ComponenteInfo[] : [],
         padres: parteDeRes.ok ? await parteDeRes.json() as PadreInfo[] : [],
         mantenimientos: mantenimientosRes.ok ? await mantenimientosRes.json() as Mantenimiento[] : [],
         documentos: documentosRes.ok ? await documentosRes.json() as Documentacion[] : [],
         movimientos: movimientosRes.ok ? await movimientosRes.json() as Movimiento[] : [],
         licencias: licencias,
         equiposDisponibles: equiposDisponiblesRes.ok ? await equiposDisponiblesRes.json() as EquipoSimple[] : [],
         tiposMantenimiento: tiposMantenimientoRes.ok ? await tiposMantenimientoRes.json() as TipoMantenimiento[] : [],
         tiposDocumento: tiposDocumentoRes.ok ? await tiposDocumentoRes.json() as TipoDocumento[] : [],
      };

      return data;

   } catch (error) {
      console.error("[GET_EQUIPO_FULL_DETAILS_ERROR]", error);
      return null;
   }
}

export default async function EquipoDetailPage({ params }: { params: { id: string } }) {
   const data = await getData(params.id);

   if (!data) {
      notFound();
   }

   return <EquipoDetailClient {...data} />;
}
