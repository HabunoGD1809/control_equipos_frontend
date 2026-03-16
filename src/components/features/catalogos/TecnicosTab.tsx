"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { Tecnico, Proveedor } from "@/types/api";
import { tecnicosService } from "@/app/services/tecnicosService";
import { TecnicoForm } from "./TecnicoForm";

interface TecnicosTabProps {
   initialData: Tecnico[];
   proveedores: Proveedor[];
}

export const TecnicosTab: React.FC<TecnicosTabProps> = ({ initialData, proveedores }) => {
   const [items, setItems] = useState<Tecnico[]>(initialData || []);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<Tecnico | null>(null);

   const handleEdit = (item: Tecnico) => {
      setSelectedItem(item);
      setIsModalOpen(true);
   };

   const handleNew = () => {
      setSelectedItem(null);
      setIsModalOpen(true);
   };

   const columns: ColumnDef<Tecnico>[] = [
      {
         accessorKey: "nombre_completo",
         header: "Nombre del Técnico",
         cell: ({ row }) => <span className="font-semibold">{row.original.nombre_completo}</span>,
      },
      {
         accessorKey: "es_externo",
         header: "Tipo",
         cell: ({ row }) => {
            return row.original.es_externo ? (
               <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">Externo</Badge>
            ) : (
               <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Interno</Badge>
            );
         },
      },
      {
         accessorKey: "proveedor",
         header: "Empresa / Proveedor",
         cell: ({ row }) => row.original.proveedor?.nombre || <span className="text-muted-foreground">-</span>,
      },
      {
         accessorKey: "telefono_contacto",
         header: "Teléfono",
         cell: ({ row }) => row.original.telefono_contacto || <span className="text-muted-foreground">-</span>,
      },
      {
         accessorKey: "is_active",
         header: "Estado",
         cell: ({ row }) => (
            <Badge variant={row.original.is_active ? "default" : "destructive"}>
               {row.original.is_active ? "Activo" : "Inactivo"}
            </Badge>
         ),
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)} className="cursor-pointer">
                     <Pencil className="mr-2 h-4 w-4 text-primary" /> Editar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         ),
      },
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedItem ? "Editar Técnico" : "Registrar Nuevo Técnico"}</DialogTitle>
               </DialogHeader>
               <TecnicoForm
                  initialData={selectedItem ?? undefined}
                  proveedores={proveedores}
                  onSuccess={async () => {
                     setIsModalOpen(false);
                     const fresh = await tecnicosService.getAll();
                     setItems(fresh);
                  }}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            <Button onClick={handleNew} className="shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" /> Registrar Técnico
            </Button>
         </div>

         <DataTable
            columns={columns}
            data={items}
            filterColumn="nombre_completo"
            tableContainerClassName="shadow-sm border rounded-lg bg-card"
         />
      </div>
   );
};
