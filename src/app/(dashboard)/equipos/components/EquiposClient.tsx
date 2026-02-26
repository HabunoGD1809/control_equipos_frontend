"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Eye, Edit, Trash2, Search, X, Inbox } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useUrlFilters } from "@/hooks/useUrlFilters";

import { equiposService } from "@/app/services/equiposService";
import type { EquipoRead } from "@/types/api";

interface EquiposClientProps {
   initialData: EquipoRead[];
   initialParams: {
      page: number;
      limit: number;
      q: string;
      estado: string;
   };
}

export function EquiposClient({ initialData, initialParams }: EquiposClientProps) {
   const router = useRouter();
   const { setFilters } = useUrlFilters();

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => equiposService.delete(id),
      onSuccess: () => router.refresh(),
      successMessage: "El equipo ha sido eliminado permanentemente.",
   });

   const { searchTerm, setSearchTerm } = useDebouncedSearch(
      initialParams.q,
      (term) => setFilters({ q: term, page: 1 })
   );

   const columns: ColumnDef<EquipoRead>[] = [
      {
         accessorKey: "nombre",
         header: "Nombre",
         cell: ({ row }) => <span className="font-medium">{row.getValue("nombre")}</span>,
      },
      {
         accessorKey: "numero_serie",
         header: "Serie / Código",
         cell: ({ row }) => (
            <div className="flex flex-col text-sm">
               <span className="font-mono uppercase">{row.original.numero_serie}</span>
               {row.original.codigo_interno && (
                  <span className="text-xs text-muted-foreground italic">{row.original.codigo_interno}</span>
               )}
            </div>
         ),
      },
      {
         accessorKey: "estado",
         header: "Estado",
         cell: ({ row }) => {
            const estado = row.original.estado;
            return (
               <Badge style={{ backgroundColor: estado?.color_hex || "#6b7280", color: "#fff" }} className="border-none shadow-sm">
                  {estado?.nombre || "Sin Estado"}
               </Badge>
            );
         },
      },
      {
         accessorKey: "ubicacion_actual",
         header: "Ubicación",
         cell: ({ row }) => row.original.ubicacion_actual || "No asignada",
      },
      {
         accessorKey: "marca",
         header: "Marca / Modelo",
         cell: ({ row }) => (
            <span className="text-sm">
               {row.original.marca || "-"} / {row.original.modelo || "-"}
            </span>
         ),
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     <span className="sr-only">Abrir menú</span>
                     <MoreHorizontal className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => router.push(`/equipos/${row.original.id}`)}>
                     <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/equipos/${row.original.id}/editar`)}>
                     <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => openAlert(row.original.id)}>
                     <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         ),
      },
   ];

   const hasNextPage = initialData.length === initialParams.limit;
   const isEmpty = initialData.length === 0;

   return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                  placeholder="Buscar por nombre, serie, marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-9 bg-background shadow-sm"
               />
               {searchTerm && (
                  <button
                     onClick={() => setSearchTerm("")}
                     className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                     <X className="h-4 w-4" />
                  </button>
               )}
            </div>
            <Button onClick={() => router.push("/equipos/nuevo")} className="w-full sm:w-auto shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Equipo
            </Button>
         </div>

         {isEmpty ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-xl bg-muted/5">
               <div className="p-4 bg-muted/20 rounded-full mb-4">
                  <Inbox className="h-10 w-10 text-muted-foreground/60" />
               </div>
               <h3 className="text-lg font-semibold text-foreground">No se encontraron equipos</h3>
               <p className="text-sm text-muted-foreground mb-6 max-w-75">
                  {searchTerm ? "No hay resultados para esta búsqueda." : "La base de datos está vacía."}
               </p>
            </div>
         ) : (
            <div className="space-y-4">
               <DataTable
                  columns={columns}
                  data={initialData}
                  showFilter={false}
                  showPagination={false}
                  tableContainerClassName="shadow-sm"
               />

               <div className="flex items-center justify-between px-2 text-sm">
                  <div className="text-muted-foreground">
                     Página <span className="font-medium text-foreground">{initialParams.page}</span>
                     <span className="hidden sm:inline opacity-70"> — Mostrando {initialData.length} registros</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => setFilters({ page: initialParams.page - 1 })} disabled={initialParams.page <= 1}>
                        Anterior
                     </Button>
                     <Button variant="outline" size="sm" onClick={() => setFilters({ page: initialParams.page + 1 })} disabled={!hasNextPage}>
                        Siguiente
                     </Button>
                  </div>
               </div>
            </div>
         )}

         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Eliminar este equipo?"
         />
      </div>
   );
}
