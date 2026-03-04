import { cookies } from 'next/headers';
import { ReservaEquipo, EquipoSimple } from "@/types/api";
import { ReservasClient } from "./components/ReservasClient";

async function fetchData(endpoint: string, cache: RequestCache = 'no-store') {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return [];

   try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache,
      });
      if (!res.ok) {
         console.error(`Error fetching ${endpoint}: ${res.status} ${res.statusText}`);
         return [];
      }
      return res.json();
   } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
   }
}

export default async function ReservasPage() {
   const [reservas, equipos] = await Promise.all([
      fetchData('/reservas/?limit=200') as Promise<ReservaEquipo[]>,
      fetchData('/equipos/?limit=500') as Promise<EquipoSimple[]>,
   ]);

   const safeReservas = Array.isArray(reservas) ? reservas : [];
   const safeEquipos = Array.isArray(equipos) ? equipos : [];

   return (
      <div className="flex-1 space-y-6">
         <ReservasClient initialEvents={safeReservas} equipos={safeEquipos} />
      </div>
   );
}
