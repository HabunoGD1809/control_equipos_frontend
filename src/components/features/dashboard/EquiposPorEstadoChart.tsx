"use client";

import { useMemo } from "react";
import { PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EquipoPorEstado } from "@/types/api";

interface EquiposPorEstadoChartProps {
   data: EquipoPorEstado[];
}

export function EquiposPorEstadoChart({ data }: EquiposPorEstadoChartProps) {
   const chartData = useMemo(() => {
      if (!Array.isArray(data)) return [];

      return data.map((item, index) => ({
         name: item.estado_nombre,
         value: item.cantidad_equipos,
         fill: item.estado_color || `hsl(${index * 45}, 70%, 50%)`
      }));
   }, [data]);

   const totalEquipos = useMemo(() =>
      chartData.reduce((acc, curr) => acc + curr.value, 0)
      , [chartData]);

   if (totalEquipos === 0) {
      return (
         <Card className="col-span-4 h-full">
            <CardHeader>
               <CardTitle>Estado del Inventario</CardTitle>
               <CardDescription>Distribución de equipos por estado operativo</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground border-t">
               No hay equipos registrados.
            </CardContent>
         </Card>
      );
   }

   return (
      <Card className="col-span-4 h-full shadow-sm">
         <CardContent className="pl-2 border-t pt-4">
            <ResponsiveContainer width="100%" height={300}>
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
                     stroke="transparent"
                     label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  />
                  <Tooltip
                     formatter={(value: number | undefined) => [`${value ?? 0} Equipos`, 'Cantidad']}
                     contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
               </PieChart>
            </ResponsiveContainer>
         </CardContent>
      </Card>
   );
}
