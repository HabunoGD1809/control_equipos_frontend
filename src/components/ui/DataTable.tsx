// src/components/ui/DataTable.tsx
"use client";

import * as React from "react";
import {
   ColumnDef,
   ColumnFiltersState,
   SortingState,
   VisibilityState,
   flexRender,
   getCoreRowModel,
   getFilteredRowModel,
   getPaginationRowModel,
   getSortedRowModel,
   useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
   DropdownMenu,
   DropdownMenuCheckboxItem,
   DropdownMenuContent,
   DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
   columns: ColumnDef<TData, TValue>[];
   data: TData[];
   filterColumn?: string;
   searchPlaceholder?: string;
   showFilter?: boolean;
   showPagination?: boolean;
   showColumnToggle?: boolean;
   // Props arquitectónicas para delegación de control visual
   className?: string;
   tableContainerClassName?: string;
   withBorder?: boolean;
}

export function DataTable<TData, TValue>({
   columns,
   data,
   filterColumn,
   searchPlaceholder,
   showFilter = true,
   showPagination = true,
   showColumnToggle = true,
   className,
   tableContainerClassName,
   withBorder = true,
}: DataTableProps<TData, TValue>) {
   const [sorting, setSorting] = React.useState<SortingState>([]);
   const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
   const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

   const table = useReactTable({
      data,
      columns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      onColumnVisibilityChange: setColumnVisibility,
      state: {
         sorting,
         columnFilters,
         columnVisibility,
      },
   });

   const filterColumnName =
      filterColumn || table.getAllColumns().find((c) => c.getCanFilter())?.id;

   return (
      <div className={cn("w-full space-y-4", className)}>
         {(showFilter || showColumnToggle) && (
            <div className="flex items-center justify-between">
               {showFilter && filterColumnName && (
                  <Input
                     placeholder={searchPlaceholder ?? `Filtrar por ${filterColumnName}...`}
                     value={(table.getColumn(filterColumnName)?.getFilterValue() as string) ?? ""}
                     onChange={(event) =>
                        table.getColumn(filterColumnName)?.setFilterValue(event.target.value)
                     }
                     className="max-w-sm"
                  />
               )}
               {showColumnToggle && (
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                           Columnas <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        {table
                           .getAllColumns()
                           .filter((column) => column.getCanHide())
                           .map((column) => (
                              <DropdownMenuCheckboxItem
                                 key={column.id}
                                 className="capitalize"
                                 checked={column.getIsVisible()}
                                 onCheckedChange={(value) => column.toggleVisibility(!!value)}
                              >
                                 {column.id}
                              </DropdownMenuCheckboxItem>
                           ))}
                     </DropdownMenuContent>
                  </DropdownMenu>
               )}
            </div>
         )}

         {/* Contenedor centralizado para bordes y fondos delegados */}
         <div className={cn(withBorder && "rounded-md border bg-card", tableContainerClassName)}>
            <Table>
               <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                     <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                           <TableHead key={header.id}>
                              {header.isPlaceholder
                                 ? null
                                 : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                 )}
                           </TableHead>
                        ))}
                     </TableRow>
                  ))}
               </TableHeader>
               <TableBody>
                  {table.getRowModel().rows?.length ? (
                     table.getRowModel().rows.map((row) => (
                        <TableRow
                           key={row.id}
                           data-state={row.getIsSelected() && "selected"}
                        >
                           {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                           ))}
                        </TableRow>
                     ))
                  ) : (
                     <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                           No se encontraron resultados.
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>
         </div>

         {showPagination && (
            <div className="flex items-center justify-end space-x-2 py-4">
               <div className="flex-1 text-sm text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} fila(s).
               </div>
               <div className="space-x-2">
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => table.previousPage()}
                     disabled={!table.getCanPreviousPage()}
                  >
                     Anterior
                  </Button>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => table.nextPage()}
                     disabled={!table.getCanNextPage()}
                  >
                     Siguiente
                  </Button>
               </div>
            </div>
         )}
      </div>
   );
}
