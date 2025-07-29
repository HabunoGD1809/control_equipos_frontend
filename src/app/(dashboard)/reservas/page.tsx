import { cookies } from 'next/headers';
import { ReservasClient } from "./components/ReservasClient";
import { ReservaEquipo, EquipoSimple } from "@/types/api";

async function getReservasData() {
   const accessToken = cookies().get('access_token')?.value;
   if (!accessToken) return null;

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [reservasRes, equiposRes] = await Promise.all([
         fetch(`${baseUrl}/reservas/?limit=1000`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/equipos/?limit=1000`, { headers, cache: 'no-store' }), // Idealmente, filtrar por equipos 'reservables'
      ]);

      if (!reservasRes.ok) return null;

      return {
         reservas: await reservasRes.json() as ReservaEquipo[],
         equipos: equiposRes.ok ? await equiposRes.json() as EquipoSimple[] : [],
      };
   } catch (error) {
      console.error("[GET_RESERVAS_DATA_ERROR]", error);
      return null;
   }
}

export default async function ReservasPage() {
   const data = await getReservasData();

   if (!data) {
      return <div className="p-8">Error al cargar los datos de reservas.</div>;
   }

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Reservas de Equipos</h1>
            <p className="text-muted-foreground">
               Visualice el calendario de disponibilidad y gestione las reservas.
            </p>
         </div>
         <ReservasClient
            initialReservas={data.reservas}
            equiposDisponibles={data.equipos}
         />
      </div>
   );
}
