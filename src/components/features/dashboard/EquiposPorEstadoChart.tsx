"use client"

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { TooltipProps } from "recharts";

interface ChartData {
   estado_nombre: string;
   cantidad_equipos: number;
   estado_color?: string | null;
}

interface EquiposPorEstadoChartProps {
   data: ChartData[];
}

type CustomTooltipProps = TooltipProps<number, string>;

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
   if (active && payload && payload.length) {
      return (
         <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-md shadow-lg">
            <p className="font-bold">{`${payload[0].name}`}</p>
            <p className="text-sm">{`Equipos: ${payload[0].value}`}</p>
         </div>
      );
   }
   return null;
};

export function EquiposPorEstadoChart({ data }: EquiposPorEstadoChartProps) {
   const chartData = data.filter(item => item.cantidad_equipos > 0);

   return (
      <Card>
         <CardHeader>
            <CardTitle>Distribución de Equipos</CardTitle>
            <CardDescription>Estado actual de todos los activos registrados.</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="w-full h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="cantidad_equipos"
                        nameKey="estado_nombre"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                     >
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.estado_color || '#cccccc'} />
                        ))}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                     <Legend iconSize={10} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </CardContent>
      </Card>
   )
}
