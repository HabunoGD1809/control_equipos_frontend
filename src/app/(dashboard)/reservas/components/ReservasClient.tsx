"use client"

import * as React from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarCheck2, PlusCircle, Check, X, MoreVertical } from "lucide-react";

import { Calendar } from "@/components/ui/Calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { ReservaEquipo, EquipoSimple } from "@/types/api";
import { ReservaForm } from "@/components/features/reservas/ReservaForm";
import { useHasPermission } from "@/hooks/useHasPermission";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

interface ReservasClientProps {
   initialReservas: ReservaEquipo[];
   equiposDisponibles: EquipoSimple[];
}

interface ApiError {
   detail: string;
}

export function ReservasClient({ initialReservas, equiposDisponibles }: ReservasClientProps) {
   const [date, setDate] = React.useState<Date | undefined>(new Date());
   const [isModalOpen, setIsModalOpen] = React.useState(false);
   const [reservas, setReservas] = React.useState(initialReservas);
   const canApprove = useHasPermission(['aprobar_reservas']);
   const { toast } = useToast();
   const router = useRouter();

   const reservedDays = React.useMemo(() => {
      return reservas.map(r => new Date(r.fecha_hora_inicio));
   }, [reservas]);

   const reservationsForSelectedDay = React.useMemo(() => {
      if (!date) return [];
      return reservas
         .filter(r => isSameDay(new Date(r.fecha_hora_inicio), date))
         .sort((a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime());
   }, [date, reservas]);

   const handleUpdateState = async (id: string, estado: string) => {
      try {
         await api.patch(`/reservas/${id}/estado`, { estado });
         toast({ title: "Éxito", description: `Reserva ${estado.toLowerCase()}.` });
         const updatedReservas = await api.get<ReservaEquipo[]>('/reservas/?limit=1000');
         setReservas(updatedReservas.data);
         router.refresh();
      } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
         toast({ variant: "destructive", title: "Error", description: axiosError.response?.data?.detail || "No se pudo actualizar la reserva." });
      }
   };

   return (
      <>
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Solicitar una Reserva</DialogTitle></DialogHeader>
               <ReservaForm equipos={equiposDisponibles} onSuccess={() => setIsModalOpen(false)} /></DialogContent>
         </Dialog>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
               <Button onClick={() => setIsModalOpen(true)} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Reserva</Button>
               <Card><CardContent className="p-0"><Calendar mode="single" selected={date} onSelect={setDate} className="p-3" locale={es} modifiers={{ reserved: reservedDays }} modifiersStyles={{ reserved: { fontWeight: 'bold', color: 'hsl(var(--primary))' } }} /></CardContent></Card>
            </div>
            <div className="lg:col-span-2">
               <Card>
                  <CardHeader><CardTitle>Reservas para {date ? format(date, "PPP", { locale: es }) : "..."}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     {reservationsForSelectedDay.length > 0 ? (
                        reservationsForSelectedDay.map(reserva => (
                           <div key={reserva.id} className="flex items-center justify-between p-3 border rounded-md">
                              <div>
                                 <p className="font-semibold">{reserva.equipo.nombre}</p>
                                 <p className="text-sm text-muted-foreground">{format(new Date(reserva.fecha_hora_inicio), 'HH:mm')} - {format(new Date(reserva.fecha_hora_fin), 'HH:mm')}</p>
                                 <p className="text-xs text-muted-foreground">Solicitado por: {reserva.solicitante.nombre_usuario}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Badge variant="outline">{reserva.estado}</Badge>
                                 {canApprove && reserva.estado === 'Pendiente Aprobacion' && (
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                       <DropdownMenuContent>
                                          <DropdownMenuItem onClick={() => handleUpdateState(reserva.id, 'Confirmada')}><Check className="mr-2 h-4 w-4 text-green-500" />Aprobar</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleUpdateState(reserva.id, 'Rechazada')}><X className="mr-2 h-4 w-4 text-red-500" />Rechazar</DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 )}
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="text-center text-muted-foreground py-12"><CalendarCheck2 className="mx-auto h-12 w-12" /><p className="mt-4">No hay reservas para el día seleccionado.</p></div>
                     )}
                  </CardContent>
               </Card>
            </div>
         </div>
      </>
   );
}
