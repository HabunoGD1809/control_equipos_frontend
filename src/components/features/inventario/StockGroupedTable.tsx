"use client";

import { useState, useMemo, Fragment } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Package, Calendar, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { InventarioStock, TipoItemInventario } from "@/types/api";
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
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(tipoId)) newExpanded.delete(tipoId);
      else newExpanded.add(tipoId);
      return newExpanded;
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-card">
        <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-lg font-medium text-foreground">Inventario Vacío</h3>
        <p className="text-sm text-muted-foreground">No hay stock registrado actualmente en el sistema.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center"></TableHead>
              <TableHead>Ítem / Descripción</TableHead>
              <TableHead className="hidden md:table-cell">Marca / Modelo</TableHead>
              <TableHead className="text-center">Total Disponible</TableHead>
              <TableHead className="text-center w-32">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedData.map((group) => {
              const isExpanded = expandedRows.has(group.tipo_item.id);

              return (
                <Fragment key={group.tipo_item.id}>
                  {/* FILA PADRE (Resumen) */}
                  <TableRow
                    className={`cursor-pointer transition-colors ${isExpanded ? "bg-muted/30" : "hover:bg-muted/50"}`}
                    onClick={() => toggleRow(group.tipo_item.id)}
                  >
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full pointer-events-none">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{group.tipo_item.nombre}</span>
                        <span className="text-xs text-muted-foreground font-mono">SKU: {group.tipo_item.sku || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm font-medium">{group.tipo_item.marca || "-"}</span>
                      {group.tipo_item.modelo && <span className="text-xs text-muted-foreground block">{group.tipo_item.modelo}</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5 bg-background border px-3 py-1 rounded-md w-fit mx-auto shadow-sm">
                        <span className="text-base font-bold text-foreground">{group.total_cantidad}</span>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{group.tipo_item.unidad_medida}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {group.bajo_stock ? (
                        <Badge variant="destructive" className="gap-1 whitespace-nowrap shadow-sm">
                          <AlertTriangle className="h-3 w-3" /> Bajo Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 whitespace-nowrap">
                          Stock Óptimo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* FILA HIJA (Detalle de Lotes) */}
                  {isExpanded && (
                    <TableRow className="bg-muted/10 hover:bg-muted/10 border-b-2 border-b-muted">
                      <TableCell colSpan={5} className="p-0 border-none">
                        <div className="px-10 py-4 bg-background border-y border-border/50 shadow-inner">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4" /> Desglose por Lote y Ubicación
                          </h4>
                          <div className="rounded-lg border bg-card overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead className="text-xs h-9 font-semibold">Ubicación</TableHead>
                                  <TableHead className="text-xs h-9 font-semibold">Lote</TableHead>
                                  <TableHead className="text-xs h-9 font-semibold">Caducidad</TableHead>
                                  <TableHead className="text-xs h-9 font-semibold text-right">Cantidad</TableHead>
                                  <TableHead className="text-xs h-9 w-12"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.stocks.map((stock) => {
                                  const isExpired = stock.fecha_caducidad ? new Date(stock.fecha_caducidad) < new Date() : false;
                                  return (
                                    <TableRow key={stock.id} className="h-10 hover:bg-muted/20">
                                      <TableCell className="font-medium text-sm py-1.5">{stock.ubicacion}</TableCell>
                                      <TableCell className="font-mono text-xs py-1.5 text-muted-foreground">{stock.lote || "--"}</TableCell>
                                      <TableCell className="py-1.5">
                                        {stock.fecha_caducidad ? (
                                          <div className={`flex items-center gap-1.5 text-xs ${isExpired ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                                            <Calendar className="h-3.5 w-3.5" />
                                            {format(new Date(stock.fecha_caducidad), "PP", { locale: es })}
                                            {isExpired && <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm ml-1 text-[10px] uppercase">Vencido</span>}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-muted-foreground italic">No caduca</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right font-bold py-1.5 text-foreground">{stock.cantidad_actual}</TableCell>
                                      <TableCell className="py-1.5 text-right">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Editar lote/caducidad" onClick={() => setEditingStock(stock)}>
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
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

      <EditStockDetailsModal stock={editingStock} isOpen={!!editingStock} onClose={() => setEditingStock(null)} />
    </>
  );
}
