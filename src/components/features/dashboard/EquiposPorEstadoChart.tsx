"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { HardDrive } from "lucide-react";

interface EstadoData {
   estado_id: string;
   estado_nombre: string;
   cantidad_equipos: number;
   estado_color?: string | null;
}

interface EquiposPorEstadoChartProps {
   data: EstadoData[];
}

const FALLBACK_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

export function EquiposPorEstadoChart({ data = [] }: EquiposPorEstadoChartProps) {
   const totalEquipos = useMemo(() => {
      return data.reduce((acc, item) => acc + (item.cantidad_equipos || 0), 0);
   }, [data]);

   if (!data.length || totalEquipos === 0) {
      return (
         <div className="flex flex-col items-center justify-center w-full py-8 text-muted-foreground space-y-3 animate-in fade-in">
            <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
               <HardDrive className="h-5 w-5 opacity-50" />
            </div>
            <p className="text-sm font-medium">No hay datos de estado</p>
         </div>
      );
   }

   const chartData = data.map((item, index) => ({
      name: item.estado_nombre,
      value: item.cantidad_equipos,
      color: item.estado_color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
   }));

   return (
      <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-6 sm:gap-12 py-2">
         <div className="relative w-45 h-45 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={65}
                     outerRadius={85}
                     paddingAngle={4}
                     dataKey="value"
                     stroke="none"
                     animationBegin={0}
                     animationDuration={1000}
                     animationEasing="ease-out"
                  >
                     {chartData.map((entry, index) => (
                        <Cell
                           key={`cell-${index}`}
                           fill={entry.color}
                           className="hover:opacity-80 transition-opacity duration-200 cursor-pointer outline-none drop-shadow-sm"
                        />
                     ))}
                  </Pie>
               </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-bold tracking-tight text-foreground leading-none">{totalEquipos}</span>
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total</span>
            </div>
         </div>

         <div className="flex flex-col gap-2 w-full max-w-50">
            {chartData.map((item, index) => {
               const percentage = ((item.value / totalEquipos) * 100).toFixed(1);

               return (
                  <div key={index} className="flex items-center justify-between group py-0.5">
                     <div className="flex items-center gap-2 overflow-hidden">
                        <span
                           className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                           style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors truncate" title={item.name}>
                           {item.name}
                        </span>
                     </div>
                     <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm font-bold text-foreground">{item.value}</span>
                        <span className="text-xs font-medium text-muted-foreground w-9 text-right">
                           {percentage}%
                        </span>
                     </div>
                  </div>
               );
            })}
         </div>

      </div>
   );
}

const CustomTooltip = ({ active, payload }: any) => {
   if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
         <div className="bg-background/95 backdrop-blur-md border border-border/50 p-3 rounded-lg shadow-lg z-50 pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
               <span className="text-xs font-semibold text-foreground">{data.name}</span>
            </div>
            <div className="text-lg font-bold pl-4 text-foreground leading-none">
               {data.value} <span className="text-[10px] font-medium text-muted-foreground">equipos</span>
            </div>
         </div>
      );
   }
   return null;
};
