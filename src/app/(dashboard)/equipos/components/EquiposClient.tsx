"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Eye, Edit, Trash2, Search, X, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { EquipoForm } from "@/components/features/equipos/EquipoForm";

import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useUrlFilters } from "@/hooks/useUrlFilters";

import { equiposService } from "@/app/services/equiposService";
import { catalogosService } from "@/app/services/catalogosService";
import { proveedoresService } from "@/app/services/proveedoresService";
import type { EquipoRead, EstadoEquipo, ProveedorSimple } from "@/types/api";

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
   const [isRefreshing, setIsRefreshing] = useState(false);

   // Estados del Modal
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedEquipo, setSelectedEquipo] = useState<EquipoRead | undefined>(undefined);
   const [estados, setEstados] = useState<EstadoEquipo[]>([]);
   const [proveedores, setProveedores] = useState<ProveedorSimple[]>([]);

   useEffect(() => {
      // Cargamos silenciosamente los catálogos en el cliente usando los servicios oficiales
      Promise.all([
         catalogosService.getEstadosEquipo(),
         proveedoresService.getOptions()
      ]).then(([estadosData, proveedoresData]) => {
         setEstados(estadosData);
         setProveedores(proveedoresData);
      }).catch(err => console.error("Error cargando catálogos del form:", err));
   }, []);

   const { isAlertOpen, isDeleting, openAlert, closeAlert, confirmDelete } = useDeleteConfirmation({
      onDelete: (id) => equiposService.delete(id),
      onSuccess: () => router.refresh(),
      successMessage: "El equipo ha sido eliminado permanentemente.",
   });

   const { searchTerm, setSearchTerm } = useDebouncedSearch(
      initialParams.q,
      (term) => setFilters({ q: term, page: 1 })
   );

   const handleRefresh = () => {
      setIsRefreshing(true);
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 800);
   };

   const handleCreate = () => {
      setSelectedEquipo(undefined);
      setIsModalOpen(true);
   };

   const handleEdit = (equipo: EquipoRead) => {
      setSelectedEquipo(equipo);
      setIsModalOpen(true);
   };

   const columns: ColumnDef<EquipoRead>[] = [
      {
         accessorKey: "nombre",
         header: "Nombre",
         cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.nombre}</span>,
      },
      {
         accessorKey: "numero_serie",
         header: "Serie / Código",
         cell: ({ row }) => (
            <div className="flex flex-col text-sm">
               <span className="font-mono font-medium uppercase">{row.original.numero_serie}</span>
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
               <Badge
                  style={{ backgroundColor: estado?.color_hex || "#6b7280", color: "#fff" }}
                  className="border-none shadow-sm font-medium tracking-wide"
               >
                  {estado?.nombre || "Sin Estado"}
               </Badge>
            );
         },
      },
      {
         accessorKey: "ubicacion_actual",
         header: "Ubicación",
         cell: ({ row }) => <span className="text-muted-foreground">{row.original.ubicacion_actual || "No asignada"}</span>,
      },
      {
         accessorKey: "marca",
         header: "Marca / Modelo",
         cell: ({ row }) => (
            <span className="text-sm">
               {row.original.marca || "-"} {row.original.modelo ? `/ ${row.original.modelo}` : ""}
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
               <DropdownMenuContent align="end" className="w-40 shadow-md">
                  <DropdownMenuItem onClick={() => router.push(`/equipos/${row.original.id}`)} className="cursor-pointer">
                     <Eye className="mr-2 h-4 w-4 text-primary" /> Ver Detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(row.original)} className="cursor-pointer">
                     <Edit className="mr-2 h-4 w-4 text-primary" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                     onClick={() => openAlert(row.original.id)}
                  >
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
                  className="pl-9 pr-9 bg-card shadow-sm border-muted"
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

            <div className="flex items-center gap-2 w-full sm:w-auto">
               <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} title="Actualizar lista" className="shadow-sm">
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
               </Button>
               <Button onClick={handleCreate} className="w-full sm:w-auto shadow-sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Equipo
               </Button>
            </div>
         </div>

         {isEmpty ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-xl bg-card">
               <div className="p-4 bg-muted/30 rounded-full mb-4">
                  <Inbox className="h-10 w-10 text-muted-foreground/50" />
               </div>
               <h3 className="text-lg font-semibold text-foreground">No se encontraron equipos</h3>
               <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  {searchTerm ? "No hay resultados para esta búsqueda. Intente con otros términos." : "Aún no hay equipos registrados en la base de datos."}
               </p>
            </div>
         ) : (
            <div className="space-y-0">
               <DataTable
                  columns={columns}
                  data={initialData}
                  showFilter={false}
                  showPagination={false}
                  tableContainerClassName="shadow-sm border rounded-lg bg-card"
               />

               {/* Paginación estandarizada visualmente con DataTable (SIN BORDES NI FONDOS) */}
               <div className="flex items-center justify-end space-x-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                     Página {initialParams.page} — Mostrando {initialData.length} fila(s).
                  </div>
                  <div className="space-x-2">
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({ page: initialParams.page - 1 })}
                        disabled={initialParams.page <= 1}
                     >
                        Anterior
                     </Button>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({ page: initialParams.page + 1 })}
                        disabled={!hasNextPage}
                     >
                        Siguiente
                     </Button>
                  </div>
               </div>
            </div>
         )}

         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="text-primary text-xl">
                     {selectedEquipo ? "Editar Equipo" : "Registrar Nuevo Equipo"}
                  </DialogTitle>
                  <DialogDescription>
                     {selectedEquipo
                        ? "Modifique los detalles del activo seleccionado en el inventario."
                        : "Complete los detalles del nuevo activo para agregarlo al sistema."}
                  </DialogDescription>
               </DialogHeader>

               <EquipoForm
                  estados={estados}
                  proveedores={proveedores}
                  initialData={selectedEquipo}
                  isEditing={!!selectedEquipo}
                  onSuccess={() => setIsModalOpen(false)}
                  onCancel={() => setIsModalOpen(false)}
               />
            </DialogContent>
         </Dialog>

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
