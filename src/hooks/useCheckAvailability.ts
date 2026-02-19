import { useState } from 'react';
import api from '@/lib/api';
import { isWithinInterval, areIntervalsOverlapping } from 'date-fns';
import { ReservaEquipo } from '@/types/api';

interface CheckAvailabilityParams {
   equipoId: string;
   startDate: Date;
   endDate: Date;
   excludeReservaId?: string; // Para ignorarse a sí misma al editar
}

export function useCheckAvailability() {
   const [isChecking, setIsChecking] = useState(false);

   /**
    * Verifica si el rango seleccionado solapa con reservas existentes CONFIRMADAS.
    * Retorna true si hay conflicto, false si está libre.
    */
   const checkOverlap = async ({ equipoId, startDate, endDate, excludeReservaId }: CheckAvailabilityParams): Promise<boolean> => {
      setIsChecking(true);
      try {
         // 1. Obtenemos las reservas del equipo (idealmente la API debería soportar filtros de rango)
         // Por ahora traemos las activas del equipo y filtramos en cliente (Gap de API a tener en cuenta)
         const { data: reservas } = await api.get<ReservaEquipo[]>(`/reservas/`, {
            params: {
               equipo_id: equipoId,
               // Optimizacion futura: enviar start_date_gte y end_date_lte si la API lo soporta
            }
         });

         // 2. Filtramos solo las que "ocupan" el equipo
         const reservasActivas = reservas.filter(r =>
            ['Confirmada', 'En Curso', 'Pendiente Aprobacion'].includes(r.estado) &&
            r.id !== excludeReservaId
         );

         // 3. Chequeo de cruce de fechas (Lógica de Negocio en Cliente para UX Inmediata)
         const hasConflict = reservasActivas.some(reserva => {
            const resStart = new Date(reserva.fecha_hora_inicio);
            const resEnd = new Date(reserva.fecha_hora_fin);

            return areIntervalsOverlapping(
               { start: startDate, end: endDate },
               { start: resStart, end: resEnd }
            );
         });

         return hasConflict;

      } catch (error) {
         console.error("Error checking availability", error);
         // Fail-open: Si falla la red, permitimos intentar enviar (el backend validará en última instancia)
         return false;
      } finally {
         setIsChecking(false);
      }
   };

   return { checkOverlap, isChecking };
}
