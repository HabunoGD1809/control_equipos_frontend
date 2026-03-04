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
   AlertCircle
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
   AuditLog,
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
         auditoriaRes,
         equiposValuationRes
      ] = await Promise.all([
         fetch(`${baseUrl}/dashboard/`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/mantenimientos/?estado=Programado&limit=5`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/inventario/tipos/bajo-stock/?limit=5`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/auditoria/?limit=10`, { headers, cache: 'no-store' }),
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
         recentActivity: auditoriaRes.ok ? unwrapItems<AuditLog>(await auditoriaRes.json()) : [],
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
         <div className="flex h-full items-center justify-center p-8 bg-background/50 rounded-xl border border-dashed">
            <div className="text-center space-y-4 max-w-sm">
               <div className="bg-destructive/10 p-4 rounded-full inline-block">
                  <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
               </div>
               <h3 className="text-xl font-bold tracking-tight">Error de Conexión</h3>
               <p className="text-muted-foreground">No se pudieron obtener los datos del dashboard. Verifica tu conexión o contacta a soporte.</p>
            </div>
         </div>
      );
   }

   const { summary, proximosMantenimientos, itemsBajoStock, recentActivity, financials } = data;

   return (
      <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* Header / Greeting */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-card p-6 rounded-2xl border shadow-sm">
            <div className="space-y-1.5">
               <div className="flex items-center gap-2 text-primary font-medium">
                  <TrendingUp className="h-5 w-5" />
                  <span>Resumen Operativo</span>
               </div>
               <h1 className="text-3xl font-bold tracking-tight text-foreground">Centro de Control</h1>
               <p className="text-muted-foreground max-w-xl">
                  Visión general del estado de activos, inventario e indicadores financieros en tiempo real.
               </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl border">
               <CalendarClock className="h-4 w-4" />
               <span className="capitalize">{new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
         </div>

         {/* KPIs Principales - Estilo moderno con gradientes sutiles */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
               title="Valor de Activos"
               value={formatCurrency(financials.totalValorActivos)}
               icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
               description="Valoración total estimada"
               className="bg-linear-to-br from-emerald-500/10 via-background to-background border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
            />
            <StatCard
               title="Total Equipos"
               value={summary.total_equipos}
               icon={<HardDrive className="h-5 w-5 text-blue-600" />}
               description="Activos registrados en sistema"
               className="bg-linear-to-br from-blue-500/10 via-background to-background border-blue-500/20 hover:border-blue-500/40 transition-colors"
            />
            <StatCard
               title="Mantenimientos"
               value={summary.mantenimientos_proximos_count}
               icon={<Wrench className="h-5 w-5 text-amber-600" />}
               description="Programados este mes"
               className="bg-linear-to-br from-amber-500/10 via-background to-background border-amber-500/20 hover:border-amber-500/40 transition-colors"
            />
            <StatCard
               title="Alertas Stock"
               value={summary.items_bajo_stock_count}
               icon={<PackageX className="h-5 w-5 text-destructive" />}
               description="Ítems por debajo del mínimo"
               className="bg-linear-to-br from-destructive/10 via-background to-background border-destructive/20 hover:border-destructive/40 transition-colors"
            />
         </div>

         {/* Acciones Rápidas */}
         <section className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
               Accesos Rápidos
            </h2>
            <QuickActions />
         </section>

         {/* Grillas de Contenido - Bento Grid Layout */}
         <div className="grid gap-6 lg:grid-cols-12">

            {/* Columna Principal (Gráficos y Alertas) - Ocupa 8 columnas */}
            <div className="lg:col-span-8 space-y-6 flex flex-col">

               {/* Gráfico Principal */}
               <Card className="flex-1 shadow-sm border-muted/60">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-lg">Estado de la Flota</CardTitle>
                     <CardDescription>Distribución porcentual de equipos por condición operativa</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-0 min-h-75 flex items-center justify-center">
                     <EquiposPorEstadoChart data={summary.equipos_por_estado} />
                  </CardContent>
               </Card>

               {/* Grid secundario de alertas */}
               <div className="grid gap-6 md:grid-cols-2">
                  <Card className="shadow-sm border-muted/60 flex flex-col">
                     <CardHeader className="pb-3 border-b bg-muted/20">
                        <CardTitle className="text-base flex items-center gap-2">
                           <Wrench className="h-4 w-4 text-amber-500" />
                           Mantenimiento Próximo
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-4 flex-1">
                        <ProximosMantenimientosList mantenimientos={proximosMantenimientos} />
                     </CardContent>
                  </Card>

                  <Card className="shadow-sm border-muted/60 flex flex-col">
                     <CardHeader className="pb-3 border-b bg-muted/20">
                        <CardTitle className="text-base flex items-center gap-2">
                           <AlertCircle className="h-4 w-4 text-destructive" />
                           Reposición Urgente
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-4 flex-1">
                        <ItemsBajoStockList items={itemsBajoStock as any} />
                     </CardContent>
                  </Card>
               </div>
            </div>

            {/* Columna Lateral (Feed de Actividad) - Ocupa 4 columnas */}
            <div className="lg:col-span-4">
               <Card className="h-full shadow-sm border-muted/60 flex flex-col">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                     <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Registro de Actividad
                     </CardTitle>
                     <CardDescription className="text-xs">Últimos movimientos del sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 overflow-auto">
                     <RecentActivityList logs={recentActivity} />
                  </CardContent>
               </Card>
            </div>

         </div>
      </div>
   );
}
