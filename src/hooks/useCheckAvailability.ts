import { useState } from 'react';
import { api } from '@/lib/http';
import { areIntervalsOverlapping } from 'date-fns';
import { ReservaEquipo } from '@/types/api';

interface CheckAvailabilityParams {
   equipoId: string;
   startDate: Date;
   endDate: Date;
   excludeReservaId?: string;
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
         const reservas = await api.get<ReservaEquipo[]>('/reservas/', {
            params: { equipo_id: equipoId }
         });

         const reservasActivas = reservas.filter(r =>
            ['Confirmada', 'En Curso', 'Pendiente Aprobacion'].includes(r.estado) &&
            r.id !== excludeReservaId
         );

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
         return false;
      } finally {
         setIsChecking(false);
      }
   };

   return { checkOverlap, isChecking };
}
