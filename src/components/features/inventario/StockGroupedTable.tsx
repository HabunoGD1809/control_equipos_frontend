"use client";

import { useState, useMemo, Fragment } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Package,
  Calendar,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InventarioStock, TipoItemInventario } from "@/types/api";
import { EditStockDetailsModal } from "./EditStockDetailsModal";

interface StockGroupedTableProps {
  data: InventarioStock[];
}

interface ItemGroup {
  tipo_item: TipoItemInventario;
  total_cantidad: number;
  stocks: InventarioStock[];
  bajo_stock: boolean;
}

export function StockGroupedTable({ data }: StockGroupedTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingStock, setEditingStock] = useState<InventarioStock | null>(null);

  const groupedData = useMemo(() => {
    const groups = new Map<string, ItemGroup>();

    data.forEach((item) => {
      const tipoId = item.tipo_item.id;

      if (!groups.has(tipoId)) {
        groups.set(tipoId, {
          tipo_item: {
            ...item.tipo_item,
            categoria: (item.tipo_item as TipoItemInventario).categoria ?? "Otro",
            stock_minimo: (item.tipo_item as TipoItemInventario).stock_minimo ?? 0,
            descripcion: null,
            codigo_barras: null,
            proveedor_preferido_id: null,
            proveedor_preferido: null,
          },
          total_cantidad: 0,
          stocks: [],
          bajo_stock: false,
        });
      }

      const group = groups.get(tipoId)!;
      group.stocks.push(item);
      group.total_cantidad += item.cantidad_actual;
    });

    groups.forEach((group) => {
      if (group.total_cantidad <= group.tipo_item.stock_minimo) {
        group.bajo_stock = true;
      }
    });

    return Array.from(groups.values());
  }, [data]);

  const toggleRow = (tipoId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(tipoId)) {
      newExpanded.delete(tipoId);
    } else {
      newExpanded.add(tipoId);
    }
    setExpandedRows(newExpanded);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border rounded-md bg-muted/10">
        No hay inventario registrado.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12.5"></TableHead>
              <TableHead>Ítem</TableHead>
              <TableHead className="hidden md:table-cell">Marca / Modelo</TableHead>
              <TableHead className="text-center">Total Disponible</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedData.map((group) => {
              const isExpanded = expandedRows.has(group.tipo_item.id);

              return (
                <Fragment key={group.tipo_item.id}>
                  {/* FILA PADRE (Resumen) */}
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleRow(group.tipo_item.id)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{group.tipo_item.nombre}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {group.tipo_item.sku}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground hidden md:block">
                        SKU: {group.tipo_item.sku || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">
                        {group.tipo_item.marca || "-"}
                      </span>
                      {group.tipo_item.modelo && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({group.tipo_item.modelo})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-lg font-bold">
                        {group.total_cantidad}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        {group.tipo_item.unidad_medida}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {group.bajo_stock ? (
                        <Badge variant="destructive" className="gap-1 whitespace-nowrap">
                          <AlertTriangle className="h-3 w-3" /> Bajo Stock
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap"
                        >
                          OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* FILA HIJA (Detalle de Lotes) */}
                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={5} className="p-0">
                        <div className="p-4 pt-2 border-t shadow-inner bg-muted/10">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-transparent border-b border-border/50">
                                <TableHead className="text-xs h-8">Ubicación</TableHead>
                                <TableHead className="text-xs h-8">Lote</TableHead>
                                <TableHead className="text-xs h-8">Caducidad</TableHead>
                                <TableHead className="text-xs h-8 text-right">Cant.</TableHead>
                                <TableHead className="text-xs h-8 w-12.5"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.stocks.map((stock) => {
                                const isExpired = stock.fecha_caducidad
                                  ? new Date(stock.fecha_caducidad) < new Date()
                                  : false;

                                return (
                                  <TableRow
                                    key={stock.id}
                                    className="border-b-0 h-9 hover:bg-transparent"
                                  >
                                    <TableCell className="flex items-center gap-2 py-1">
                                      <Package className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">{stock.ubicacion}</span>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs py-1">
                                      {stock.lote || "N/A"}
                                    </TableCell>
                                    <TableCell className="py-1">
                                      {stock.fecha_caducidad ? (
                                        <div
                                          className={`flex items-center gap-1 text-xs ${isExpired ? "text-destructive font-bold" : ""
                                            }`}
                                        >
                                          <Calendar className="h-3 w-3" />
                                          {format(
                                            new Date(stock.fecha_caducidad),
                                            "P",
                                            { locale: es }
                                          )}
                                          {isExpired && <span>(Vencido)</span>}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium py-1">
                                      {stock.cantidad_actual}
                                    </TableCell>
                                    <TableCell className="py-1 text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        title="Editar lote/caducidad"
                                        onClick={() => setEditingStock(stock)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditStockDetailsModal
        stock={editingStock}
        isOpen={!!editingStock}
        onClose={() => setEditingStock(null)}
      />
    </>
  );
}
