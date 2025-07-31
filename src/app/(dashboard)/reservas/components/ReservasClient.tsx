"use client"

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import 'moment/locale/es';
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { ReservaEquipo, EquipoSimple, EstadoReservaEnum } from '@/types/api';
import { useAuthStore } from '@/store/authStore';
import { useHasPermission } from '@/hooks/useHasPermission';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { ReservaForm } from '@/components/features/reservas/ReservaForm';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Check, Truck, X, Undo2 } from 'lucide-react';

// Configuración de localización del calendario
moment.locale('es');
const localizer = momentLocalizer(moment);

const estadoColores: Record<string, string> = {
   Confirmada: 'bg-green-500',
   'Pendiente Aprobacion': 'bg-yellow-500',
   'En Curso': 'bg-blue-500',
   Finalizada: 'bg-gray-500',
   Rechazada: 'bg-red-500',
   'Cancelada': 'bg-red-700',
   'Cancelada por Usuario': 'bg-red-700',
   'Cancelada por Gestor': 'bg-red-700',
};

const CustomEvent = ({ event }: { event: ReservaEquipo }) => (
   <div className={cn("p-1 text-white rounded-md text-xs", estadoColores[event.estado] || 'bg-gray-400')}>
      <strong className="block truncate">{event.equipo.nombre}</strong>
      <span className="truncate">{event.proposito}</span>
   </div>
);

export function ReservasClient({ initialEvents, equipos }: {
   initialEvents: ReservaEquipo[];
   equipos: EquipoSimple[];
}) {
   const [events, setEvents] = useState<ReservaEquipo[]>(initialEvents);
   const [selectedReserva, setSelectedReserva] = useState<ReservaEquipo | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isAlertOpen, setIsAlertOpen] = useState(false);
   const [alertConfig, setAlertConfig] = useState<{ title: string; description: string; onConfirm: () => void }>({
      title: '', description: '', onConfirm: () => { }
   });
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

   const onNavigate = useCallback((newDate: Date) => {
      setDate(newDate);
   }, []);
   const onView = useCallback((newView: View) => {
      setView(newView);
   }, []);

   const handleSelectEvent = (event: ReservaEquipo) => {
      setSelectedReserva(event);
      setIsModalOpen(true);
   };
   const handleSelectSlot = () => {
      setSelectedReserva(null);
      setIsModalOpen(true);
   };

   const handleSuccess = () => {
      setIsModalOpen(false);
      setSelectedReserva(null);
      router.refresh();
   };

   const updateEstado = async (resId: string, estado: EstadoReservaEnum, notas?: string) => {
      setIsLoading(true);
      try {
         await api.patch(`/reservas/${resId}/estado`, { estado, notas_administrador: notas });
         toast({ title: 'Éxito', description: `Reserva ${estado.toLowerCase()}.` });
         handleSuccess();
      } catch {
         toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
      } finally {
         setIsLoading(false);
      }
   };

   const handleCheckInOut = async (resId: string, action: 'check-in' | 'check-out') => {
      setIsLoading(true);
      const payload = action === 'check-in'
         ? { check_in_time: new Date().toISOString() }
         : { check_out_time: new Date().toISOString() };
      try {
         await api.patch(`/reservas/${resId}/check-in-out`, payload);
         toast({ title: 'Éxito', description: `Check-${action} realizado correctamente.` });
         handleSuccess();
      } catch {
         toast({ variant: 'destructive', title: 'Error', description: `No se pudo realizar el check-${action}.` });
      } finally {
         setIsLoading(false);
      }
   };

   const handleCancel = async (resId: string) => {
      setIsLoading(true);
      try {
         await api.post(`/reservas/${resId}/cancelar`);
         toast({ title: 'Éxito', description: 'Reserva cancelada.' });
         handleSuccess();
      } catch {
         toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cancelar la reserva.' });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <>
         {/* AlertDialog */}
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
                  <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Volver</AlertDialogCancel>
                  <AlertDialogAction onClick={alertConfig.onConfirm} disabled={isLoading}>
                     {isLoading ? 'Procesando...' : 'Confirmar'}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         {/* Modal Reserva */}
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-2xl">
               <DialogHeader>
                  <DialogTitle>{selectedReserva ? 'Detalles de la Reserva' : 'Crear Nueva Reserva'}</DialogTitle>
                  {selectedReserva && (
                     <p className="text-sm text-muted-foreground">
                        Solicitado por: {selectedReserva.solicitante.nombre_usuario}
                     </p>
                  )}
               </DialogHeader>

               <ReservaForm initialData={selectedReserva} equipos={equipos} onSuccess={handleSuccess} />

               {selectedReserva && (
                  <div className="pt-6 border-t mt-6">
                     <h3 className="text-lg font-semibold mb-2">Acciones</h3>
                     <div className="flex flex-wrap gap-2">
                        {canManage && selectedReserva.estado === 'Pendiente Aprobacion' && (
                           <>
                              <Button size="sm" onClick={() => updateEstado(selectedReserva.id, 'Confirmada')} disabled={isLoading}>
                                 <Check className="mr-2 h-4 w-4" /> Aprobar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => updateEstado(selectedReserva.id, 'Rechazada')} disabled={isLoading}>
                                 <X className="mr-2 h-4 w-4" /> Rechazar
                              </Button>
                           </>
                        )}
                        {canManage && selectedReserva.estado === 'Confirmada' && (
                           <Button size="sm" onClick={() => handleCheckInOut(selectedReserva.id, 'check-in')} disabled={isLoading}>
                              <Truck className="mr-2 h-4 w-4" /> Realizar Check-in
                           </Button>
                        )}
                        {canManage && selectedReserva.estado === 'En Curso' && (
                           <Button size="sm" onClick={() => handleCheckInOut(selectedReserva.id, 'check-out')} disabled={isLoading}>
                              <Undo2 className="mr-2 h-4 w-4" /> Realizar Check-out
                           </Button>
                        )}
                        {user?.id === selectedReserva.usuario_solicitante_id &&
                           (selectedReserva.estado === 'Pendiente Aprobacion' || selectedReserva.estado === 'Confirmada') && (
                              <Button size="sm" variant="outline" onClick={() => handleCancel(selectedReserva.id)} disabled={isLoading}>
                                 <X className="mr-2 h-4 w-4" /> Cancelar mi Reserva
                              </Button>
                           )}
                     </div>
                  </div>
               )}
            </DialogContent>
         </Dialog>

         {/* Calendario */}
         <div className="p-4 bg-card rounded-lg shadow-sm" style={{ height: '75vh' }}>
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
                  noEventsInRange: "No hay eventos en este rango."
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
            />
         </div>
      </>
   );
}
