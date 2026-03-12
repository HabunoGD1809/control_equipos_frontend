"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { Badge } from "@/components/ui/Badge";

import { GenericCatalogForm } from "./GenericCatalogForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { api } from "@/lib/http";

type GenericItem = {
   id: string;
   nombre: string;
   [key: string]: any;
};

interface GenericCatalogTabProps {
   data: GenericItem[];
   title: string;
   apiEndpoint: string;
   formFields: string[];
}

// Reutilizamos la lógica de humanizar nombres para las cabeceras de la tabla
const humanizeFieldName = (field: string) => {
   if (field === "color_hex") return "Color";
   if (field === "periodicidad_dias") return "Periodicidad";
   if (field === "requiere_documentacion") return "Req. Doc.";
   if (field === "es_preventivo") return "Preventivo";

   return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
};

export const GenericCatalogTab: React.FC<GenericCatalogTabProps> = ({
   data = [],
   title,
   apiEndpoint,
   formFields
}) => {
   const [items, setItems] = useState(data || []);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<GenericItem | null>(null);

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => api.delete(`${apiEndpoint}/${id}`),
      onSuccess: async () => {
         const fresh = await api.get<GenericItem[]>(apiEndpoint);
         setItems(fresh);
      },
      successMessage: `El ítem ha sido eliminado correctamente del catálogo.`,
   });

   const handleEdit = (item: GenericItem) => {
      setSelectedItem(item);
      setIsModalOpen(true);
   };

   const handleNew = () => {
      setSelectedItem(null);
      setIsModalOpen(true);
   };

   const dynamicColumns: ColumnDef<GenericItem>[] = formFields.map((field) => {
      // Caso Especial 1: Color Hex
      if (field === "color_hex") {
         return {
            accessorKey: field,
            header: humanizeFieldName(field),
            cell: ({ row }) => {
               const color = row.getValue(field) as string;
               if (!color) return <span className="text-muted-foreground">-</span>;
               return (
                  <div className="flex items-center gap-2">
                     <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: color }} />
                     <span className="font-mono text-xs text-muted-foreground uppercase">{color}</span>
                  </div>
               );
            }
         };
      }

      // Caso Especial 2: Booleanos
      if (field === "es_preventivo" || field === "requiere_documentacion") {
         return {
            accessorKey: field,
            header: humanizeFieldName(field),
            cell: ({ row }) => {
               const isTrue = row.getValue(field) as boolean;
               return isTrue ? <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Sí</Badge> : <Badge variant="secondary">No</Badge>;
            }
         };
      }

      // Caso Especial 3: Periodicidad
      if (field === "periodicidad_dias") {
         return {
            accessorKey: field,
            header: humanizeFieldName(field),
            cell: ({ row }) => {
               const dias = row.getValue(field) as number;
               return <span className="text-muted-foreground">{dias ? `${dias} días` : "-"}</span>;
            }
         };
      }

      // Caso por defecto (Textos: Nombre, Descripción, Edificio, Departamento)
      return {
         accessorKey: field,
         header: humanizeFieldName(field),
         cell: ({ row }) => {
            const val = row.getValue(field) as string;
            const isNombre = field === "nombre";
            return (
               <span className={isNombre ? "font-semibold text-foreground" : "text-muted-foreground"}>
                  {val || "-"}
               </span>
            );
         }
      };
   });

   // Añadimos la columna de acciones al final
   const columns: ColumnDef<GenericItem>[] = [
      ...dynamicColumns,
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     <MoreHorizontal className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)} className="cursor-pointer">
                     <Pencil className="mr-2 h-4 w-4 text-primary" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                     onClick={() => openAlert(row.original.id)}
                  >
                     <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         ),
      },
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-300">
         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title={`¿Eliminar ${title}?`}
            description="Esta acción no se puede deshacer. Eliminar este ítem puede causar errores si está siendo utilizado en otros registros."
         />

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{selectedItem ? `Editar ${title}` : `Crear Nuevo ${title}`}</DialogTitle>
               </DialogHeader>
               <GenericCatalogForm
                  initialData={selectedItem ?? undefined}
                  apiEndpoint={apiEndpoint}
                  formFields={formFields}
                  onSuccess={async () => {
                     setIsModalOpen(false);
                     const fresh = await api.get<GenericItem[]>(apiEndpoint);
                     setItems(fresh);
                  }}
               />
            </DialogContent>
         </Dialog>

         <div className="flex justify-end mb-4">
            <Button onClick={handleNew} className="shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo {title}
            </Button>
         </div>

         <DataTable
            columns={columns}
            data={items}
            filterColumn="nombre"
            tableContainerClassName="shadow-sm border rounded-lg bg-card"
         />
      </div>
   );
};
