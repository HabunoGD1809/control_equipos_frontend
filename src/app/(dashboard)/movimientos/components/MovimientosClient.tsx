"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
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

import type {
   Movimiento,
   EquipoRead,
   UsuarioSimple,
   PaginatedResponse,
} from "@/types/api";
import { MovimientoForm } from "@/components/features/movimientos/MovimientoForm";
import { api } from "@/lib/http";

interface MovimientosClientProps {
   initialData: Movimiento[];
   equipos: EquipoRead[];
   usuarios: UsuarioSimple[];
}

function getItems<T>(data: PaginatedResponse<T> | T[]): T[] {
   if (Array.isArray(data)) return data;
   if (data && Array.isArray((data as any).items)) return (data as any).items;
   return [];
}

export const MovimientosClient: React.FC<MovimientosClientProps> = ({
   initialData,
   equipos,
   usuarios,
}) => {
   const [movimientos, setMovimientos] = useState(initialData);
   const [isModalOpen, setIsModalOpen] = useState(false);

   const handleSuccess = async () => {
      try {
         const data = await api.get<PaginatedResponse<Movimiento> | Movimiento[]>(
            "/movimientos/?limit=200",
         );
         setMovimientos(getItems(data));
         setIsModalOpen(false);
      } catch (error) {
         console.error("Error al refrescar los movimientos", error);
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
         cell: ({ row }) => (
            <Badge variant="outline">{row.getValue("estado")}</Badge>
         ),
      },
      {
         id: "actions",
         cell: () => (
            <Button variant="ghost" className="h-8 w-8 p-0">
               <span className="sr-only">Abrir menú</span>
               <MoreHorizontal className="h-4 w-4" />
            </Button>
         ),
      },
   ];

   return (
      <>
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl">
               <DialogHeader>
                  <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
                  <DialogDescription>
                     Completa el formulario para registrar una nueva asignación, salida
                     o transferencia.
                  </DialogDescription>
               </DialogHeader>

               <MovimientoForm
                  equipos={equipos}
                  usuarios={usuarios}
                  onSuccess={handleSuccess}
                  onCancel={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            <Button onClick={() => setIsModalOpen(true)}>
               <PlusCircle className="mr-2 h-4 w-4" />
               Registrar Movimiento
            </Button>
         </div>

         <DataTable columns={columns} data={movimientos} filterColumn="destino" />
      </>
   );
};
