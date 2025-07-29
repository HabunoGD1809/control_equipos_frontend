import { cookies } from 'next/headers';
import {
   EquipoRead, Mantenimiento, Documentacion, Movimiento,
   TipoMantenimiento, TipoDocumento, EquipoSimple
} from "@/types/api";
import { EquipoDetailClient } from './components/EquipoDetailClient';

async function getData(id: string) {
   const accessToken = cookies().get('access_token')?.value;
   if (!accessToken) return null;

   const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   const promises = [
      fetch(`${baseUrl}/equipos/${id}`, { headers, cache: 'no-store' }),
      fetch(`${baseUrl}/equipos/${id}/componentes`, { headers, cache: 'no-store' }),
      fetch(`${baseUrl}/equipos/${id}/parte_de`, { headers, cache: 'no-store' }),
      fetch(`${baseUrl}/mantenimientos/?equipo_id=${id}&limit=100`, { headers, cache: 'no-store' }),
      fetch(`${baseUrl}/documentacion/equipo/${id}?limit=100`, { headers, cache: 'no-store' }),
      fetch(`${baseUrl}/movimientos/?equipo_id=${id}&limit=100`, { headers, cache: 'no-store' }),
      // Catálogos para los formularios en modales
      fetch(`${baseUrl}/equipos/?limit=1000`, { headers, cache: 'no-store' }), // Para selector de componentes
      fetch(`${baseUrl}/catalogos/tipos-mantenimiento/`, { headers, cache: 'no-store' }),
      fetch(`${baseUrl}/catalogos/tipos-documento/`, { headers, cache: 'no-store' }),
   ];

   try {
      const responses = await Promise.all(promises);
      const [
         equipoRes, componentesRes, parteDeRes, mantenimientosRes,
         documentosRes, movimientosRes, equiposDisponiblesRes,
         tiposMantenimientoRes, tiposDocumentoRes
      ] = responses;

      if (!equipoRes.ok) return null;

      // Parse all successful responses
      const data = {
         equipo: await equipoRes.json() as EquipoRead,
         componentes: componentesRes.ok ? await componentesRes.json() : [],
         parteDe: parteDeRes.ok ? await parteDeRes.json() : [],
         mantenimientos: mantenimientosRes.ok ? await mantenimientosRes.json() : [] as Mantenimiento[],
         documentos: documentosRes.ok ? await documentosRes.json() : [] as Documentacion[],
         movimientos: movimientosRes.ok ? await movimientosRes.json() : [] as Movimiento[],
         equiposDisponibles: equiposDisponiblesRes.ok ? await equiposDisponiblesRes.json() : [] as EquipoSimple[],
         tiposMantenimiento: tiposMantenimientoRes.ok ? await tiposMantenimientoRes.json() : [] as TipoMantenimiento[],
         tiposDocumento: tiposDocumentoRes.ok ? await tiposDocumentoRes.json() : [] as TipoDocumento[],
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
      return <div className="p-8">Equipo no encontrado o error al cargar los datos.</div>;
   }

   return <EquipoDetailClient {...data} />;
}
