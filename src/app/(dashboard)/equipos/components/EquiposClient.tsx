"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Eye, Edit, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
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
   const pathname = usePathname();
   const searchParams = useSearchParams();

   const handleFiltersChange = (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
         if (value === undefined || value === "" || value === 0) {
            params.delete(key);
         } else {
            params.set(key, String(value));
         }
      });
      router.push(`${pathname}?${params.toString()}`);
   };

   const { openAlert } = useDeleteConfirmation("Equipo", () => router.refresh());

   const { searchTerm, setSearchTerm } = useDebouncedSearch(
      initialParams.q,
      (term) => handleFiltersChange({ q: term, page: 1 })
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
               <span>{row.original.numero_serie}</span>
               {row.original.codigo_interno && (
                  <span className="text-xs text-muted-foreground">{row.original.codigo_interno}</span>
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
                  style={{ backgroundColor: estado?.color_hex || "gray" }}
                  className="text-white"
               >
                  {estado?.nombre || "Desconocido"}
               </Badge>
            );
         },
      },
      {
         accessorKey: "ubicacion_actual",
         header: "Ubicación",
      },
      {
         accessorKey: "marca",
         header: "Marca/Modelo",
         cell: ({ row }) => `${row.original.marca || "-"} / ${row.original.modelo || "-"}`,
      },
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
                  <DropdownMenuItem onClick={() => router.push(`/equipos/${row.original.id}`)}>
                     <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/equipos/${row.original.id}/editar`)}>
                     <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="text-destructive"
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

   return (
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full max-w-sm relative">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  placeholder="Buscar por nombre, serie, marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
               />
            </div>
            <Button onClick={() => router.push("/equipos/nuevo")}>
               <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Equipo
            </Button>
         </div>

         <DataTable
            columns={columns}
            data={initialData}
            showFilter={false}
            showPagination={false}
            showColumnToggle={false}
         />

         <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
               Página {initialParams.page} {initialData.length > 0 ? `(${initialData.length} registros en esta página)` : '(Sin registros)'}
            </div>
            <div className="space-x-2">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange({ page: initialParams.page - 1 })}
                  disabled={initialParams.page <= 1}
               >
                  Anterior
               </Button>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange({ page: initialParams.page + 1 })}
                  disabled={!hasNextPage}
               >
                  Siguiente
               </Button>
            </div>
         </div>
      </div>
   );
}
