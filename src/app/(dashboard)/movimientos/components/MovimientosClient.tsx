"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, CheckCircle, Ban } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

import type { Movimiento, EquipoRead, UsuarioSimple } from "@/types/api";
import { EstadoMovimientoEquipoEnum } from "@/types/api";
import { MovimientoForm } from "@/components/features/movimientos/MovimientoForm";
import { movimientosService } from "@/app/services/movimientosService";
import { AutorizarMovimientoModal } from "@/components/features/movimientos/AutorizarMovimientoModal";

interface MovimientosClientProps {
   initialData: Movimiento[];
   equipos: EquipoRead[];
   usuarios: UsuarioSimple[];
}

export const MovimientosClient: React.FC<MovimientosClientProps> = ({
   initialData,
   equipos,
   usuarios,
}) => {
   const [movimientos, setMovimientos] = useState<Movimiento[]>(initialData);
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [movimientoToAuthorize, setMovimientoToAuthorize] = useState<Movimiento | null>(null);
   const { toast } = useToast();

   const refreshData = async () => {
      try {
         const data = await movimientosService.getAll({ limit: 200 });
         setMovimientos(data);
      } catch (error) {
         console.error("Error al refrescar los movimientos", error);
      }
   };

   const handleSuccessCreate = () => {
      setIsCreateModalOpen(false);
      refreshData();
   };

   const handleCancelar = async (id: string) => {
      if (!confirm("¿Estás seguro de que deseas cancelar este movimiento?")) return;

      try {
         await movimientosService.cancelar(id);
         toast({ title: "Cancelado", description: "El movimiento ha sido cancelado exitosamente." });
         refreshData();
      } catch (error: any) {
         toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo cancelar." });
      }
   };

   const columns: ColumnDef<Movimiento>[] = [
      { accessorFn: (row) => row.equipo.nombre, header: "Equipo" },
      { accessorKey: "tipo_movimiento", header: "Tipo" },
      { accessorKey: "destino", header: "Destino" },
      { accessorKey: "proposito", header: "Propósito" },
      {
         accessorKey: "fecha_hora",
         header: "Fecha",
         cell: ({ row }) =>
            format(new Date(row.getValue("fecha_hora")), "Pp", { locale: es }),
      },
      {
         accessorKey: "estado",
         header: "Estado",
         cell: ({ row }) => {
            const estado = row.getValue("estado") as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
            if (estado === EstadoMovimientoEquipoEnum.Completado) variant = "default";
            if (estado === EstadoMovimientoEquipoEnum.Cancelado || estado === EstadoMovimientoEquipoEnum.Rechazado) variant = "destructive";
            if (estado === EstadoMovimientoEquipoEnum.Pendiente) variant = "secondary";

            return <Badge variant={variant}>{estado}</Badge>;
         },
      },
      {
         id: "actions",
         cell: ({ row }) => {
            const mov = row.original;
            const isPendiente = mov.estado === EstadoMovimientoEquipoEnum.Pendiente;
            const isCancelable = isPendiente || mov.estado === EstadoMovimientoEquipoEnum.Autorizado;

            return (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {isPendiente && (
                        <DropdownMenuItem onClick={() => setMovimientoToAuthorize(mov)}>
                           <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                           <span>Validar Movimiento</span>
                        </DropdownMenuItem>
                     )}
                     {isCancelable && (
                        <DropdownMenuItem onClick={() => handleCancelar(mov.id)}>
                           <Ban className="mr-2 h-4 w-4 text-red-600" />
                           <span>Cancelar Movimiento</span>
                        </DropdownMenuItem>
                     )}
                     {!isPendiente && !isCancelable && (
                        <DropdownMenuItem disabled>
                           Sin acciones disponibles
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
            <DialogContent className="max-w-2xl">
               <DialogHeader>
                  <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
                  <DialogDescription>
                     Completa el formulario para registrar una nueva asignación, salida o transferencia.
                  </DialogDescription>
               </DialogHeader>
               <MovimientoForm
                  equipos={equipos}
                  usuarios={usuarios}
                  onSuccess={handleSuccessCreate}
                  onCancel={() => setIsCreateModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         <AutorizarMovimientoModal
            movimiento={movimientoToAuthorize}
            isOpen={!!movimientoToAuthorize}
            onClose={() => {
               setMovimientoToAuthorize(null);
               refreshData();
            }}
         />

         <div className="flex justify-end">
            <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" />
               Registrar Movimiento
            </Button>
         </div>

         <DataTable
            columns={columns}
            data={movimientos}
            filterColumn="destino"
            tableContainerClassName="shadow-sm"
         />
      </div>
   );
};
