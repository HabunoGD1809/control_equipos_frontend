"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2, Pencil, RefreshCw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";

import { GenericCatalogForm } from "./GenericCatalogForm";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { api } from "@/lib/http";
import { useToast } from "@/components/ui/use-toast";

type GenericItem = {
   id: string;
   is_active?: boolean;
   [key: string]: any;
};

interface GenericCatalogTabProps {
   data: GenericItem[];
   title: string;
   apiEndpoint: string;
   formFields: string[];
   isUbicacion?: boolean;
   isLoading?: boolean;
}

const humanizeFieldName = (field: string) => {
   if (field === "color_hex") return "Color";
   if (field === "periodicidad_dias") return "Periodicidad";
   if (field === "requiere_documentacion") return "Req. Doc.";
   if (field === "es_preventivo") return "Preventivo";
   if (field === "departamento_id") return "Departamento";
   if (field === "nombre_completo") return "Nombre Completo";
   return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
};

export const GenericCatalogTab: React.FC<GenericCatalogTabProps> = ({
   data = [],
   title,
   apiEndpoint,
   formFields,
   isUbicacion = false,
   isLoading: isLoadingProp = false,
}) => {
   const { toast } = useToast();
   const [items, setItems] = useState<GenericItem[]>(data);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<GenericItem | null>(null);
   const [showInactive, setShowInactive] = useState(false);
   const [isRefreshing, setIsRefreshing] = useState(false);

   // Sincronizar cuando el padre entrega nuevos datos
   useEffect(() => {
      setItems(data);
   }, [data]);

   // ─── fetchItems estabilizado con useRef ──────────────────────────────────
   const showInactiveRef = useRef(showInactive);
   showInactiveRef.current = showInactive;

   const fetchItems = useCallback(async () => {
      setIsRefreshing(true);
      try {
         const freshData = await api.get<GenericItem[]>(apiEndpoint, {
            params: { include_inactive: showInactiveRef.current },
         });
         setItems(freshData);
      } catch {
         toast({ variant: "destructive", title: "Error", description: "No se pudieron actualizar los datos." });
      } finally {
         setIsRefreshing(false);
      }
   }, [apiEndpoint, toast]);

   const isFirstRender = useRef(true);
   useEffect(() => {
      if (isFirstRender.current) {
         isFirstRender.current = false;
         return;
      }
      fetchItems();
   }, [showInactive]);

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } =
      useDeleteConfirmation({
         onDelete: (id) => api.delete(`${apiEndpoint}/${id}`),
         onSuccess: fetchItems,
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

   // ─── Columnas dinámicas ──────────────────────────────────────────────────
   const dynamicColumns: ColumnDef<GenericItem>[] = formFields.map((field) => {
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
            },
         };
      }

      if (field === "es_preventivo" || field === "requiere_documentacion") {
         return {
            accessorKey: field,
            header: humanizeFieldName(field),
            cell: ({ row }) => {
               const isTrue = row.getValue(field) as boolean;
               return isTrue ? (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Sí</Badge>
               ) : (
                  <Badge variant="secondary">No</Badge>
               );
            },
         };
      }

      if (field === "periodicidad_dias") {
         return {
            accessorKey: field,
            header: humanizeFieldName(field),
            cell: ({ row }) => {
               const dias = row.getValue(field) as number;
               return <span className="text-muted-foreground">{dias ? `${dias} días` : "-"}</span>;
            },
         };
      }

      if (field === "departamento_id") {
         return {
            accessorKey: "departamento_rel.nombre",
            header: humanizeFieldName(field),
            cell: ({ row }) => {
               const depRel = row.original.departamento_rel;
               return <span className="text-muted-foreground">{depRel?.nombre || "-"}</span>;
            },
         };
      }

      return {
         accessorKey: field,
         header: humanizeFieldName(field),
         cell: ({ row }) => {
            const val = row.getValue(field) as string;
            const isNombre = field === "nombre" || field === "nombre_completo";
            return (
               <div className="flex items-center gap-2">
                  <span className={isNombre ? "font-semibold text-foreground" : "text-muted-foreground"}>
                     {val || "-"}
                  </span>
                  {isNombre && row.original.is_active === false && (
                     <Badge variant="outline" className="text-[10px] text-destructive border-destructive px-1 py-0 h-4">
                        Inactivo
                     </Badge>
                  )}
               </div>
            );
         },
      };
   });

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

   const filterColumnName = formFields.includes("nombre_completo") ? "nombre_completo" : "nombre";

   // ─── Loading state: spinner centrado, sin romper el layout ───────────────
   if (isLoadingProp) {
      return (
         <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Cargando {title.toLowerCase()}s...</span>
         </div>
      );
   }

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
               {isModalOpen && (
                  <GenericCatalogForm
                     initialData={selectedItem ?? undefined}
                     apiEndpoint={apiEndpoint}
                     formFields={formFields}
                     isUbicacion={isUbicacion}
                     onSuccess={async () => {
                        setIsModalOpen(false);
                        await fetchItems();
                     }}
                  />
               )}
            </DialogContent>
         </Dialog>

         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
               <Switch
                  id={`show-inactive-${title}`}
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
               />
               <Label htmlFor={`show-inactive-${title}`} className="text-sm text-muted-foreground cursor-pointer">
                  Mostrar inactivos
               </Label>
            </div>

            <div className="flex gap-2">
               <Button variant="outline" onClick={fetchItems} disabled={isRefreshing} title="Actualizar lista">
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
               </Button>
               <Button onClick={handleNew} className="shadow-sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo {title}
               </Button>
            </div>
         </div>

         <DataTable
            columns={columns}
            data={items}
            filterColumn={filterColumnName}
            tableContainerClassName="shadow-sm border rounded-lg bg-card"
         />
      </div>
   );
};
