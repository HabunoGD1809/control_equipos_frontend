"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
   PlusCircle,
   MoreHorizontal,
   CheckCircle,
   Ban,
   PackageCheck,
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

import type {
   Movimiento,
   EquipoRead,
   UsuarioSimple,
   Ubicacion,
} from "@/types/api";
import { EstadoMovimientoEquipoEnum } from "@/types/api";
import { MovimientoForm } from "@/components/features/movimientos/MovimientoForm";
import { movimientosService } from "@/app/services/movimientosService";
import { AutorizarMovimientoModal } from "@/components/features/movimientos/AutorizarMovimientoModal";

interface MovimientosClientProps {
   initialData: Movimiento[];
   equipos: EquipoRead[];
   usuarios: UsuarioSimple[];
   ubicaciones: Ubicacion[];
}

export const MovimientosClient: React.FC<MovimientosClientProps> = ({
   initialData,
   equipos,
   usuarios,
   ubicaciones,
}) => {
   const [movimientos, setMovimientos] = useState<Movimiento[]>(initialData);
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [movimientoToAuthorize, setMovimientoToAuthorize] =
      useState<Movimiento | null>(null);
   const { toast } = useToast();
   const router = useRouter();

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
      router.refresh();
   };

   const handleCancelar = async (id: string) => {
      if (!confirm("¿Estás seguro de que deseas cancelar este movimiento?"))
         return;
      try {
         await movimientosService.cancelar(id);
         toast({
            title: "Cancelado",
            description: "El movimiento ha sido cancelado exitosamente.",
         });
         refreshData();
      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "No se pudo cancelar.",
         });
      }
   };

   const handleRecibir = async (id: string) => {
      if (
         !confirm(
            "Al confirmar, asumes la responsabilidad y custodia de este equipo. ¿Continuar?",
         )
      )
         return;
      try {
         await movimientosService.recibir(id);
         toast({
            title: "Equipo Recibido",
            description: "La cadena de custodia ha sido actualizada.",
         });
         refreshData();
      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error al recibir",
            description: error.message || "No se pudo completar la entrega.",
         });
      }
   };

   const columns: ColumnDef<Movimiento>[] = [
      { accessorFn: (row) => row.equipo.nombre, header: "Equipo" },
      { accessorKey: "tipo_movimiento", header: "Tipo" },
      {
         accessorKey: "ubicacion_destino_nombre",
         header: "Destino",
         cell: ({ row }) =>
            row.original.ubicacion_destino_nombre || (
               <span className="text-muted-foreground">N/A</span>
            ),
      },
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
            let variant:
               | "default"
               | "secondary"
               | "destructive"
               | "outline"
               | "warning" = "outline";
            if (estado === EstadoMovimientoEquipoEnum.Completado)
               variant = "default";
            if (
               estado === EstadoMovimientoEquipoEnum.Cancelado ||
               estado === EstadoMovimientoEquipoEnum.Rechazado
            )
               variant = "destructive";
            if (estado === EstadoMovimientoEquipoEnum.Pendiente)
               variant = "secondary";
            if (estado === EstadoMovimientoEquipoEnum.EnProceso)
               variant = "default";
            return <Badge variant={variant as any}>{estado}</Badge>;
         },
      },
      {
         id: "actions",
         cell: ({ row }) => {
            const mov = row.original;
            const isPendiente = mov.estado === EstadoMovimientoEquipoEnum.Pendiente;
            const isEnProceso = mov.estado === EstadoMovimientoEquipoEnum.EnProceso;
            const isCancelable =
               isPendiente || mov.estado === EstadoMovimientoEquipoEnum.Autorizado;

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
                     {isPendiente && (
                        <DropdownMenuItem onClick={() => setMovimientoToAuthorize(mov)}>
                           <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                           <span>Validar Movimiento</span>
                        </DropdownMenuItem>
                     )}
                     {isEnProceso && (
                        <DropdownMenuItem onClick={() => handleRecibir(mov.id)}>
                           <PackageCheck className="mr-2 h-4 w-4 text-blue-600" />
                           <span className="font-semibold text-blue-600">
                              Recibir Equipo
                           </span>
                        </DropdownMenuItem>
                     )}
                     {isCancelable && (
                        <DropdownMenuItem onClick={() => handleCancelar(mov.id)}>
                           <Ban className="mr-2 h-4 w-4 text-red-600" />
                           <span>Cancelar Movimiento</span>
                        </DropdownMenuItem>
                     )}

                     {!isPendiente && !isEnProceso && !isCancelable && (
                        <DropdownMenuItem
                           disabled
                           className="text-muted-foreground italic"
                        >
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
                     Completa el formulario para registrar una nueva asignación o
                     salida.
                  </DialogDescription>
               </DialogHeader>
               <MovimientoForm
                  equipos={equipos}
                  usuarios={usuarios}
                  ubicaciones={ubicaciones}
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
            <Button
               onClick={() => setIsCreateModalOpen(true)}
               className="shadow-sm"
            >
               <PlusCircle className="mr-2 h-4 w-4" /> Registrar Movimiento
            </Button>
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
