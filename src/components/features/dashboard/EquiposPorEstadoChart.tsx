"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EquipoPorEstado } from "@/types/api";

interface EquiposPorEstadoChartProps {
   data: EquipoPorEstado[];
}

export function EquiposPorEstadoChart({ data }: EquiposPorEstadoChartProps) {
   // Procesamos los datos para asegurar que siempre haya un color válido
   const chartData = useMemo(() => {
      return data.map((item, index) => ({
         name: item.estado_nombre,
         value: item.cantidad_equipos,
         // Usar el color de la BD o un fallback rotativo si es null
         color: item.estado_color || `hsl(${index * 45}, 70%, 50%)`
      }));
   }, [data]);

   const totalEquipos = useMemo(() =>
      data.reduce((acc, curr) => acc + curr.cantidad_equipos, 0)
      , [data]);

   if (totalEquipos === 0) {
      return (
         <Card className="col-span-4">
            <CardHeader>
               <CardTitle>Estado del Inventario</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
               No hay equipos registrados.
            </CardContent>
         </Card>
      );
   }

   return (
      <Card className="col-span-4">
         <CardHeader>
            <CardTitle>Estado del Inventario</CardTitle>
         </CardHeader>
         <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
               <PieChart>
                  <Pie
                     data={chartData}
                     dataKey="value"
                     nameKey="name"
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={100}
                     paddingAngle={2}
                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                     {chartData.map((entry, index) => (
                        <Cell
                           key={`cell-${index}`}
                           fill={entry.color}
                           stroke="transparent"
                        />
                     ))}
                  </Pie>
                  <Tooltip
                     formatter={(value: number) => [`${value} Equipos`, 'Cantidad']}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
               </PieChart>
            </ResponsiveContainer>
         </CardContent>
      </Card>
   );
}
