import { cookies } from 'next/headers';
import {
   HardDrive,
   Wrench,
   PackageX,
   DollarSign,
   Activity,
   CalendarClock,
   ShieldAlert,
   TrendingUp,
   AlertCircle,
   FileText,
   CalendarRange
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/features/dashboard/StatCard";
import { EquiposPorEstadoChart } from "@/components/features/dashboard/EquiposPorEstadoChart";
import { ProximosMantenimientosList } from '@/components/features/dashboard/ProximosMantenimientosList';
import { ItemsBajoStockList } from '@/components/features/dashboard/ItemsBajoStockList';
import { RecentActivityList } from '@/components/features/dashboard/RecentActivityList';
import { QuickActions } from '@/components/features/dashboard/QuickActions';

import {
   DashboardData,
   Mantenimiento,
   EquipoRead
} from '@/types/api';

interface TipoItemInventarioConStock {
   id: string;
   nombre: string;
   categoria: string;
   unidad_medida: string;
   stock_minimo: number;
   stock_total_actual: number;
}

const formatCurrency = (value: number) => {
   return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
   }).format(value);
};

function unwrapItems<T>(data: any): T[] {
   if (Array.isArray(data)) return data;
   if (data && Array.isArray(data.items)) return data.items;
   return [];
}

async function getDashboardPageData() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('access_token')?.value;

   if (!accessToken) return null;

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [
         dashboardRes,
         mantenimientosRes,
         bajoStockRes,
         equiposValuationRes
      ] = await Promise.all([
         fetch(`${baseUrl}/dashboard/`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/mantenimientos/?estado=Programado&limit=5`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/inventario/tipos/bajo-stock/?limit=5`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/equipos/?limit=500`, { headers, cache: 'no-store' })
      ]);

      if (!dashboardRes.ok) return null;

      const equiposRaw = equiposValuationRes.ok ? await equiposValuationRes.json() : [];
      const equiposData = unwrapItems<EquipoRead>(equiposRaw);

      const totalValorActivos = equiposData.reduce((acc, equipo) => {
         const valor = parseFloat(String(equipo.valor_adquisicion || "0"));
         return acc + (isNaN(valor) ? 0 : valor);
      }, 0);

      const bajoStockRaw = bajoStockRes.ok ? await bajoStockRes.json() : [];
      const itemsBajoStockData = unwrapItems<TipoItemInventarioConStock>(bajoStockRaw);

      const itemsBajoStockAdapter = itemsBajoStockData.map(item => ({
         id: item.id,
         tipo_item_id: item.id,
         ubicacion: "Global",
         cantidad_actual: item.stock_total_actual,
         ultima_actualizacion: new Date().toISOString(),
         tipo_item: {
            id: item.id,
            nombre: item.nombre,
            unidad_medida: item.unidad_medida as any
         }
      }));

      return {
         summary: await dashboardRes.json() as DashboardData,
         proximosMantenimientos: mantenimientosRes.ok ? unwrapItems<Mantenimiento>(await mantenimientosRes.json()) : [],
         itemsBajoStock: itemsBajoStockAdapter,
         financials: {
            totalValorActivos
         }
      };

   } catch (error) {
      console.error("[GET_DASHBOARD_PAGE_DATA_ERROR]", error);
      return null;
   }
}

export default async function DashboardPage() {
   const data = await getDashboardPageData();

   if (!data || !data.summary) {
      return (
         <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-md bg-card p-10 rounded-2xl border shadow-sm">
               <div className="bg-destructive/10 p-5 rounded-full inline-block mx-auto">
                  <ShieldAlert className="h-12 w-12 text-destructive" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight">Servicio No Disponible</h3>
                  <p className="text-muted-foreground text-sm">No se pudieron obtener los datos operativos. Verifica tu conexión a la red o la disponibilidad del servidor de backend.</p>
               </div>
            </div>
         </div>
      );
   }

   const { summary, proximosMantenimientos, itemsBajoStock, financials } = data;

   return (
      <div className="space-y-8 pb-10 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* Header / Greeting */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 md:p-8 rounded-2xl border shadow-xs relative overflow-hidden">
            {/* Efecto de fondo decorativo */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-2 relative z-10">
               <div className="flex items-center gap-2 text-primary font-semibold tracking-wide text-sm uppercase">
                  <TrendingUp className="h-4 w-4" />
                  <span>Resumen Operativo</span>
               </div>
               <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Centro de Control</h1>
               <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
                  Visión general del estado de activos, métricas de inventario e indicadores clave de rendimiento.
               </p>
            </div>
            <div className="flex items-center gap-2.5 text-sm font-medium text-foreground bg-muted/30 px-5 py-2.5 rounded-full border border-border/50 shadow-xs relative z-10 whitespace-nowrap">
               <CalendarClock className="h-4 w-4 text-primary" />
               <span className="capitalize">{new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
         </div>

         {/* KPIs */}
         <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
               title="Valor de Activos"
               value={formatCurrency(financials.totalValorActivos)}
               icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
               className="bg-linear-to-br from-emerald-500/10 via-background to-background border-emerald-500/20"
            />
            <StatCard
               title="Total Equipos"
               value={summary.total_equipos}
               icon={<HardDrive className="h-5 w-5 text-blue-600" />}
               className="bg-linear-to-br from-blue-500/10 via-background to-background border-blue-500/20"
            />
            <StatCard
               title="Mantenimientos"
               value={summary.mantenimientos_proximos_count}
               icon={<Wrench className="h-5 w-5 text-amber-600" />}
               className="bg-linear-to-br from-amber-500/10 via-background to-background border-amber-500/20"
            />
            <StatCard
               title="Reservas Pend."
               value={summary.reservas_pendientes_count}
               icon={<CalendarRange className="h-5 w-5 text-purple-600" />}
               className="bg-linear-to-br from-purple-500/10 via-background to-background border-purple-500/20"
            />
            <StatCard
               title="Docs. Pendientes"
               value={summary.documentos_pendientes_count}
               icon={<FileText className="h-5 w-5 text-indigo-600" />}
               className="bg-linear-to-br from-indigo-500/10 via-background to-background border-indigo-500/20"
            />
            <StatCard
               title="Alertas Stock"
               value={summary.items_bajo_stock_count}
               icon={<PackageX className="h-5 w-5 text-destructive" />}
               className="bg-linear-to-br from-destructive/10 via-background to-background border-destructive/20"
            />
         </div>

         {/* Acciones Rápidas */}
         <section className="space-y-4 pt-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground ml-1">
               Accesos Rápidos
            </h2>
            <QuickActions />
         </section>

         {/* Grillas de Contenido - Bento Grid Layout */}
         <div className="grid gap-6 lg:grid-cols-12 pt-2">

            {/* Columna Principal */}
            <div className="lg:col-span-8 space-y-6 flex flex-col">

               {/* Gráfico Principal */}
               <Card className="flex-1 shadow-sm border-muted/60 overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b pb-4">
                     <CardTitle className="text-lg font-bold text-foreground">Estado Operativo de la Flota</CardTitle>
                     <CardDescription>Distribución general de los equipos según su estado actual</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 min-h-75 flex items-center justify-center bg-card">
                     <EquiposPorEstadoChart data={summary.equipos_por_estado} />
                  </CardContent>
               </Card>

               {/* Alertas Críticas (Sub-Grid) */}
               <div className="grid gap-6 md:grid-cols-2">
                  <Card className="shadow-sm border-muted/60 flex flex-col overflow-hidden">
                     <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 pb-4">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-700 dark:text-amber-500">
                           <Wrench className="h-4 w-4" />
                           Mantenimiento Próximo
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-4 flex-1 bg-card">
                        <ProximosMantenimientosList mantenimientos={proximosMantenimientos} />
                     </CardContent>
                  </Card>

                  <Card className="shadow-sm border-muted/60 flex flex-col overflow-hidden">
                     <CardHeader className="bg-red-500/5 border-b border-red-500/10 pb-4">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-red-700 dark:text-red-500">
                           <AlertCircle className="h-4 w-4" />
                           Reposición Urgente
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-4 flex-1 bg-card">
                        <ItemsBajoStockList items={itemsBajoStock as any} />
                     </CardContent>
                  </Card>
               </div>
            </div>

            {/* Columna Lateral (Feed) */}
            <div className="lg:col-span-4">
               <Card className="h-full shadow-sm border-muted/60 flex flex-col overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                     <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                        <Activity className="h-4 w-4" />
                        Registro de Movimientos
                     </CardTitle>
                     <CardDescription className="text-xs">Flujo reciente de los activos en la organización</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 overflow-auto bg-card">
                     <RecentActivityList actividades={summary.movimientos_recientes} />
                  </CardContent>
               </Card>
            </div>

         </div>
      </div>
   );
}
