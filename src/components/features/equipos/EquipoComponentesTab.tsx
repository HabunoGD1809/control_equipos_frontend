"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { EquipoSimple } from "@/types/api";
import { AddComponenteForm } from "./AddComponenteForm";

// Definimos un tipo local para los datos de la tabla de componentes
type ComponenteData = {
   id: string;
   componente: EquipoSimple;
   cantidad: number;
   tipo_relacion: string;
};

interface EquipoComponentesTabProps {
   equipoId: string;
   componentes: ComponenteData[];
   equiposDisponibles: EquipoSimple[]; // Equipos que pueden ser añadidos como componentes
}

export function EquipoComponentesTab({ equipoId, componentes, equiposDisponibles }: EquipoComponentesTabProps) {
   const [isModalOpen, setIsModalOpen] = useState(false);

   const columns: ColumnDef<ComponenteData>[] = [
      { accessorKey: "componente.nombre", header: "Nombre" },
      { accessorKey: "componente.numero_serie", header: "Número de Serie" },
      { accessorKey: "cantidad", header: "Cantidad" },
      { accessorKey: "tipo_relacion", header: "Relación" },
      {
         id: "actions",
         cell: () => (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
               <Trash2 className="h-4 w-4" />
            </Button>
         ),
      },
   ];

   return (
      <div className="mt-4 space-y-4">
         <div className="flex justify-end">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
               <DialogTrigger asChild>
                  <Button>
                     <PlusCircle className="mr-2 h-4 w-4" />
                     Añadir Componente
                  </Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Añadir Nuevo Componente</DialogTitle>
                     <DialogDescription>
                        Seleccione un equipo de la lista para añadirlo como componente de este activo.
                     </DialogDescription>
                  </DialogHeader>
                  <AddComponenteForm
                     equipoPadreId={equipoId}
                     equiposDisponibles={equiposDisponibles}
                     onSuccess={() => setIsModalOpen(false)}
                  />
               </DialogContent>
            </Dialog>
         </div>
         <DataTable columns={columns} data={componentes} />
      </div>
   );
}
