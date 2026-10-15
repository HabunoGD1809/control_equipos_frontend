"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
   PlusCircle,
   MoreHorizontal,
   CheckCircle,
   Ban,
   PackageCheck,
   Printer,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useToast } from "@/components/ui/use-toast";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSession } from "@/contexts/SessionProvider";
import { collectPages } from "@/lib/collection-pages";

import type {
   Movimiento,
   EquipoRead,
   Ubicacion,
} from "@/types/api";
import { EstadoMovimientoEquipoEnum } from "@/types/api";
import { MovimientoForm } from "@/components/features/movimientos/MovimientoForm";
import { movimientosService } from "@/app/services/movimientosService";
import { AutorizarMovimientoModal } from "@/components/features/movimientos/AutorizarMovimientoModal";
import { RecibirMovimientoModal } from "@/components/features/movimientos/RecibirMovimientoModal";

interface MovimientosClientProps {
   initialData: Movimiento[];
   equipos: EquipoRead[];
   ubicaciones: Ubicacion[];
}

export const MovimientosClient: React.FC<MovimientosClientProps> = ({
   initialData,
   equipos,
   ubicaciones,
}) => {
   const [movimientos, setMovimientos] = useState<Movimiento[]>(initialData);
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

   const [movimientoToAuthorize, setMovimientoToAuthorize] = useState<Movimiento | null>(null);
   const [movimientoToRecibir, setMovimientoToRecibir] = useState<Movimiento | null>(null);

   const { toast } = useToast();
   const router = useRouter();
   const canRegister = useHasPermission(["registrar_movimientos"]);
   const canAuthorize = useHasPermission(["autorizar_movimientos"]);
   const { user } = useSession();
   const canCancel = useHasPermission(["cancelar_movimientos"]);

   const refreshData = async () => {
      try {
         const data = await collectPages((skip, limit) => movimientosService.getAll({ skip, limit }));
         setMovimientos(data);
      } catch (error) {
         console.error("Error al refrescar los movimientos", error);
      }
   };

   const handleSuccessCreate = () => {
      setIsCreateModalOpen(false);
      refreshData();
      router.refresh();
   };

   const handleCancelar = async (id: string) => {
      if (!confirm("¿Estás seguro de que deseas cancelar este movimiento?"))
         return;
      try {
         await movimientosService.cancelar(id);
         toast({ title: "Cancelado", description: "El movimiento ha sido cancelado exitosamente." });
         refreshData();
      } catch (error: any) {
         toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo cancelar." });
      }
   };

   const columns: ColumnDef<Movimiento>[] = [
      { accessorFn: (row) => row.equipo.nombre, header: "Equipo", cell: ({ row }) => <div>{row.original.equipo.nombre}{row.original.equipos_incluidos > 1 && <p className="text-xs text-muted-foreground">Conjunto: {row.original.equipos_incluidos} activos</p>}</div> },
      { accessorKey: "tipo_movimiento", header: "Tipo" },
      {
         accessorKey: "ubicacion_destino_nombre",
         header: "Destino",
         cell: ({ row }) => row.original.ubicacion_destino_nombre || <span className="text-muted-foreground">N/A</span>,
      },
      { accessorKey: "proposito", header: "Propósito" },
      { id: "custodio", accessorFn: row => row.empleado_destino?.nombre_completo || "Sin asignación", header: "Custodio" },
      { id: "registrador", accessorFn: row => row.usuario_registrador?.nombre_usuario || "Sistema", header: "Registrado por" },
      { id: "autorizador", accessorFn: row => row.usuario_autorizador?.nombre_usuario || "—", header: "Autorizado por" },
      { id: "receptor", accessorFn: row => row.recibido_por || "Sin confirmar", header: "Receptor registrado" },
      { id: "confirmador", accessorFn: row => row.usuario_confirmador?.nombre_usuario || "—", header: "Registró acuse" },
      {
         accessorKey: "fecha_hora",
         header: "Fecha",
         cell: ({ row }) => format(new Date(row.getValue("fecha_hora")), "Pp", { locale: es }),
      },
      {
         accessorKey: "estado",
         header: "Estado",
         cell: ({ row }) => {
            const estado = row.getValue("estado") as string;
            let variant: "default" | "secondary" | "destructive" | "outline" | "warning" = "outline";
            if (estado === EstadoMovimientoEquipoEnum.Completado) variant = "default";
            if (estado === EstadoMovimientoEquipoEnum.Cancelado || estado === EstadoMovimientoEquipoEnum.Rechazado) variant = "destructive";
            if (estado === EstadoMovimientoEquipoEnum.Pendiente) variant = "secondary";
            if (estado === EstadoMovimientoEquipoEnum.EnProceso) variant = "default";

            return <Badge variant={variant as any}>{estado}</Badge>;
         },
      },
      {
         id: "actions",
         cell: ({ row }) => {
            const mov = row.original;
            const isPendiente = mov.estado === EstadoMovimientoEquipoEnum.Pendiente;
            const isEnProceso = mov.estado === EstadoMovimientoEquipoEnum.EnProceso || mov.estado === EstadoMovimientoEquipoEnum.Autorizado;
            const canReceive = canRegister || (!!user?.empleado_id && user.empleado_id === mov.empleado_destino_id);
            const isCancelable = isPendiente || isEnProceso;

            return (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem asChild><a href={`/api/proxy/movimientos/${mov.id}/acuse`} target="_blank" rel="noopener noreferrer"><Printer className="mr-2 h-4 w-4" />{mov.estado === EstadoMovimientoEquipoEnum.Completado ? "Imprimir acuse" : "Imprimir constancia"}</a></DropdownMenuItem>
                     {isPendiente && canAuthorize && (
                        <DropdownMenuItem onClick={() => setMovimientoToAuthorize(mov)} className="cursor-pointer">
                           <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                           <span>Validar Movimiento</span>
                        </DropdownMenuItem>
                     )}
                     {isEnProceso && canReceive && (
                        <DropdownMenuItem onClick={() => setMovimientoToRecibir(mov)} className="cursor-pointer">
                           <PackageCheck className="mr-2 h-4 w-4 text-blue-600" />
                           <span className="font-semibold text-blue-600">Recibir Equipo</span>
                        </DropdownMenuItem>
                     )}
                     {isCancelable && canCancel && (
                        <DropdownMenuItem onClick={() => handleCancelar(mov.id)} className="cursor-pointer text-destructive focus:text-destructive">
                           <Ban className="mr-2 h-4 w-4" />
                           <span>Cancelar Movimiento</span>
                        </DropdownMenuItem>
                     )}
                  </DropdownMenuContent>
               </DropdownMenu>
            );
         },
      },
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
                  <DialogDescription>
                     Completa el formulario para registrar una nueva asignación o salida.
                  </DialogDescription>
               </DialogHeader>
               <MovimientoForm
                  equipos={equipos}
                  ubicaciones={ubicaciones}
                  onSuccess={handleSuccessCreate}
                  onCancel={() => setIsCreateModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         <AutorizarMovimientoModal
            movimiento={movimientoToAuthorize}
            isOpen={!!movimientoToAuthorize}
            onClose={() => { setMovimientoToAuthorize(null); refreshData(); }}
         />

         <RecibirMovimientoModal
            movimiento={movimientoToRecibir}
            isOpen={!!movimientoToRecibir}
            onClose={() => { setMovimientoToRecibir(null); refreshData(); }}
         />

         <div className="flex justify-end">
            {canRegister && <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" /> Registrar Movimiento
            </Button>}
         </div>

         <DataTable
            columns={columns}
            data={movimientos}
            filterColumn="ubicacion_destino_nombre"
            tableContainerClassName="shadow-sm"
         />
      </div>
   );
};
