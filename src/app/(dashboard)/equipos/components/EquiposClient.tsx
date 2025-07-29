"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/Button"
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { DataTable } from "@/components/ui/DataTable"
import { Badge } from "@/components/ui/Badge"
import { EquipoRead } from "@/types/api"

// Columnas para la tabla de equipos
export const columns: ColumnDef<EquipoRead>[] = [
   {
      accessorKey: "nombre",
      header: ({ column }) => {
         return (
            <Button
               variant="ghost"
               onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
               Nombre
               <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
         )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("nombre")}</div>,
   },
   {
      accessorKey: "numero_serie",
      header: "Número de Serie",
   },
   {
      accessorKey: "marca",
      header: "Marca",
   },
   {
      accessorKey: "modelo",
      header: "Modelo",
   },
   {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
         const estado = row.original.estado
         return (
            <Badge
               style={{
                  backgroundColor: estado?.color_hex || '#cccccc',
                  color: '#ffffff'
               }}
               className="text-white border-none"
            >
               {estado?.nombre || "N/A"}
            </Badge>
         )
      },
   },
   {
      accessorKey: "ubicacion_actual",
      header: "Ubicación",
   },
   {
      id: "actions",
      cell: ({ row }) => {
         const equipo = row.original
         return (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                     <span className="sr-only">Abrir menú</span>
                     <MoreHorizontal className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem
                     onClick={() => navigator.clipboard.writeText(equipo.numero_serie)}
                  >
                     Copiar S/N
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link href={`/equipos/${equipo.id}`} passHref>
                     <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                     Eliminar
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         )
      },
   },
]

interface EquiposClientProps {
   data: EquipoRead[];
}

export const EquiposClient: React.FC<EquiposClientProps> = ({ data }) => {
   return (
      <DataTable columns={columns} data={data} />
   )
}
