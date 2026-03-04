"use client"

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import 'moment/locale/es';
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar';

import { ReservaEquipo, EquipoSimple } from '@/types/api';
import { EstadoReservaEnum } from '@/types/api';
import { useAuthStore } from '@/store/authStore';
import { useHasPermission } from '@/hooks/useHasPermission';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/use-toast';
import { reservasService } from '@/app/services/reservasService';
import { ReservaForm } from '@/components/features/reservas/ReservaForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { CheckSquare, Truck, X, Undo2, RefreshCw, PlusCircle } from 'lucide-react';

import { CheckInModal } from './CheckInModal';
import { CheckOutModal } from './CheckOutModal';
import { ValidarReservaModal } from '@/components/features/reservas/ValidarReservaModal';

moment.locale('es');
const localizer = momentLocalizer(moment);

const estadoColores: Record<string, string> = {
   [EstadoReservaEnum.Confirmada]: 'bg-green-600 border-green-700',
   [EstadoReservaEnum.PendienteAprobacion]: 'bg-yellow-500 border-yellow-600 text-yellow-950',
   [EstadoReservaEnum.EnCurso]: 'bg-blue-500 border-blue-600',
   [EstadoReservaEnum.Finalizada]: 'bg-slate-500 border-slate-600',
   [EstadoReservaEnum.Rechazada]: 'bg-red-500 border-red-600',
   [EstadoReservaEnum.Cancelada]: 'bg-red-700 border-red-800',
   [EstadoReservaEnum.CanceladaPorUsuario]: 'bg-red-700 border-red-800',
   [EstadoReservaEnum.CanceladaPorGestor]: 'bg-red-700 border-red-800',
};

const CustomEvent = ({ event }: { event: ReservaEquipo }) => (
   <div className={cn("px-1.5 py-0.5 text-white rounded-sm text-xs border border-transparent h-full", estadoColores[event.estado] || 'bg-gray-400')}>
      <strong className="block truncate">{event.equipo.nombre}</strong>
      <span className="truncate opacity-90">{event.proposito}</span>
   </div>
);

export function ReservasClient({ initialEvents, equipos }: { initialEvents: ReservaEquipo[]; equipos: EquipoSimple[]; }) {
   const [events] = useState<ReservaEquipo[]>(initialEvents);
   const [selectedReserva, setSelectedReserva] = useState<ReservaEquipo | null>(null);

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isCheckInOpen, setIsCheckInOpen] = useState(false);
   const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
   const [isValidarOpen, setIsValidarOpen] = useState(false);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [isLoading, setIsLoading] = useState(false);

   const router = useRouter();
   const { toast } = useToast();
   const user = useAuthStore(state => state.user);
   const canManage = useHasPermission(['aprobar_reservas']);

   const calendarEvents = useMemo(() => events.map(reserva => ({
      ...reserva,
      title: `${reserva.equipo.nombre} - ${reserva.solicitante.nombre_usuario}`,
      start: new Date(reserva.fecha_hora_inicio),
      end: new Date(reserva.fecha_hora_fin),
   })), [events]);

   const [date, setDate] = useState(new Date());
   const [view, setView] = useState<View>('month');

   const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
   const onView = useCallback((newView: View) => setView(newView), []);

   const handleSelectEvent = (event: ReservaEquipo) => {
      setSelectedReserva(event);
      setIsModalOpen(true);
   };

   const handleSelectSlot = () => {
      setSelectedReserva(null);
      setIsModalOpen(true);
   };

   const handleRefresh = () => {
      setIsRefreshing(true);
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 800);
   };

   const handleSuccess = () => {
      setIsModalOpen(false);
      setIsCheckInOpen(false);
      setIsCheckOutOpen(false);
      setIsValidarOpen(false);
      setSelectedReserva(null);
      router.refresh();
   };

   const handleCancel = async (resId: string) => {
      if (!confirm("¿Desea cancelar esta reserva de forma irreversible?")) return;
      setIsLoading(true);
      try {
         await reservasService.cancelar(resId);
         toast({ title: 'Éxito', description: 'Reserva cancelada correctamente.' });
         handleSuccess();
      } catch (error: unknown) {
         const err = error as { message?: string };
         toast({ variant: 'destructive', title: 'Error', description: err.message || 'No se pudo cancelar la reserva.' });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <PageHeader
            title="Calendario de Reservas"
            description="Visualice, cree y gestione las reservas de equipos."
            actions={
               <>
                  <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} title="Sincronizar calendario">
                     <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button onClick={handleSelectSlot}>
                     <PlusCircle className="mr-2 h-4 w-4" /> Nueva Reserva
                  </Button>
               </>
            }
         />

         <ValidarReservaModal isOpen={isValidarOpen} onClose={() => setIsValidarOpen(false)} reserva={selectedReserva} onSuccess={handleSuccess} />
         <CheckInModal isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} reserva={selectedReserva} onSuccess={handleSuccess} />
         <CheckOutModal isOpen={isCheckOutOpen} onClose={() => setIsCheckOutOpen(false)} reserva={selectedReserva} onSuccess={handleSuccess} />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>{selectedReserva ? 'Detalles de la Reserva' : 'Solicitar Nueva Reserva'}</DialogTitle>
                  {selectedReserva && (
                     <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md inline-block">
                        Solicitado por: <strong className="text-foreground">{selectedReserva.solicitante.nombre_usuario}</strong>
                     </p>
                  )}
               </DialogHeader>

               <ReservaForm initialData={selectedReserva || undefined} equipos={equipos} onSuccess={handleSuccess} />

               {selectedReserva && (
                  <div className="pt-6 border-t mt-2">
                     <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Acciones de Flujo</h3>
                     <div className="flex flex-wrap gap-2">
                        {canManage && selectedReserva.estado === EstadoReservaEnum.PendienteAprobacion && (
                           <Button size="sm" onClick={() => { setIsModalOpen(false); setIsValidarOpen(true); }} disabled={isLoading}>
                              <CheckSquare className="mr-2 h-4 w-4" /> Validar Solicitud
                           </Button>
                        )}
                        {canManage && selectedReserva.estado === EstadoReservaEnum.Confirmada && (
                           <Button size="sm" onClick={() => { setIsModalOpen(false); setIsCheckOutOpen(true); }} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                              <Truck className="mr-2 h-4 w-4" /> Registrar Check-out (Entrega)
                           </Button>
                        )}
                        {canManage && selectedReserva.estado === EstadoReservaEnum.EnCurso && (
                           <Button size="sm" onClick={() => { setIsModalOpen(false); setIsCheckInOpen(true); }} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                              <Undo2 className="mr-2 h-4 w-4" /> Registrar Check-in (Devolución)
                           </Button>
                        )}
                        {user?.id === selectedReserva.usuario_solicitante_id &&
                           (selectedReserva.estado === EstadoReservaEnum.PendienteAprobacion || selectedReserva.estado === EstadoReservaEnum.Confirmada) && (
                              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleCancel(selectedReserva.id)} disabled={isLoading}>
                                 <X className="mr-2 h-4 w-4" /> Cancelar mi Reserva
                              </Button>
                           )}
                     </div>
                  </div>
               )}
            </DialogContent>
         </Dialog>

         <div className="p-4 bg-card rounded-xl shadow-sm border border-muted h-[75vh]">
            <BigCalendar
               localizer={localizer}
               events={calendarEvents}
               startAccessor="start"
               endAccessor="end"
               style={{ height: '100%' }}
               messages={{
                  next: "Siguiente", previous: "Anterior", today: "Hoy",
                  month: "Mes", week: "Semana", day: "Día", agenda: "Agenda",
                  date: "Fecha", time: "Hora", event: "Evento",
                  noEventsInRange: "No hay reservas en este rango de fechas."
               }}
               view={view}
               onView={onView}
               date={date}
               onNavigate={onNavigate}
               views={['month', 'week', 'day', 'agenda']}
               selectable
               components={{ event: CustomEvent }}
               onSelectEvent={handleSelectEvent}
               onSelectSlot={handleSelectSlot}
               className="custom-big-calendar"
            />
         </div>
      </div>
   );
}
