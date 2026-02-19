import { cookies } from 'next/headers';
import {
   HardDrive,
   Wrench,
   PackageX,
   DollarSign,
   Activity,
   CalendarClock,
   ShieldAlert
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
   InventarioStock,
   AuditLog,
   EquipoRead
} from '@/types/api';

// Función auxiliar para formatear moneda
const formatCurrency = (value: number) => {
   return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
   }).format(value);
};

async function getDashboardPageData() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('access_token')?.value;

   if (!accessToken) return null;

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      // Fetch Paralelo de Datos Críticos
      const [
         dashboardRes,
         mantenimientosRes,
         bajoStockRes,
         auditoriaRes,
         equiposValuationRes
      ] = await Promise.all([
         fetch(`${baseUrl}/dashboard/`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/mantenimientos/?estado=Programado&limit=5`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/inventario/stock/?bajo_stock=true&limit=5`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/auditoria/?limit=10`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/equipos/?limit=500`, { headers, cache: 'no-store' })
      ]);

      if (!dashboardRes.ok) return null;

      const equiposData = equiposValuationRes.ok ? await equiposValuationRes.json() as EquipoRead[] : [];

      // Cálculo de KPI Financiero: Valor Total de Activos
      const totalValorActivos = equiposData.reduce((acc, equipo) => {
         const valor = parseFloat(equipo.valor_adquisicion || "0");
         return acc + (isNaN(valor) ? 0 : valor);
      }, 0);

      return {
         summary: await dashboardRes.json() as DashboardData,
         proximosMantenimientos: mantenimientosRes.ok ? await mantenimientosRes.json() as Mantenimiento[] : [],
         itemsBajoStock: bajoStockRes.ok ? await bajoStockRes.json() as InventarioStock[] : [],
         recentActivity: auditoriaRes.ok ? await auditoriaRes.json() as AuditLog[] : [],
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
         <div className="flex h-full items-center justify-center p-8">
            <div className="text-center space-y-4">
               <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
               <h3 className="text-lg font-semibold">Error de Carga</h3>
               <p className="text-muted-foreground">No se pudieron obtener los datos del dashboard.</p>
            </div>
         </div>
      );
   }

   const { summary, proximosMantenimientos, itemsBajoStock, recentActivity, financials } = data;

   return (
      <div className="space-y-8 pb-10">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Centro de Control</h1>
               <p className="text-muted-foreground">
                  Visión general operativa y financiera del inventario.
               </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
               <CalendarClock className="h-4 w-4" />
               <span>{new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
         </div>

         {/* KPIs Principales */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
               title="Valor de Activos"
               value={formatCurrency(financials.totalValorActivos)}
               icon={<DollarSign className="h-5 w-5 text-green-600" />}
               description="Valoración total estimada"
               className="border-l-4 border-l-green-500"
            />
            <StatCard
               title="Total Equipos"
               value={summary.total_equipos}
               icon={<HardDrive className="h-5 w-5 text-blue-600" />}
               description="Activos registrados"
               className="border-l-4 border-l-blue-500"
            />
            <StatCard
               title="Mantenimientos"
               value={summary.mantenimientos_proximos_count}
               icon={<Wrench className="h-5 w-5 text-orange-600" />}
               description="Pendientes este mes"
               className="border-l-4 border-l-orange-500"
            />
            <StatCard
               title="Alertas Stock"
               value={summary.items_bajo_stock_count}
               icon={<PackageX className="h-5 w-5 text-red-600" />}
               description="Ítems críticos"
               className="border-l-4 border-l-red-500"
            />
         </div>

         {/* Acciones Rápidas */}
         <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Accesos Rápidos</h2>
            <QuickActions />
         </div>

         {/* Grillas de Contenido */}
         <div className="grid gap-6 lg:grid-cols-7">

            {/* Columna Izquierda (Gráficos y Listas) - Span 4 */}
            <div className="lg:col-span-4 space-y-6">
               <Card className="col-span-4">
                  <CardHeader>
                     <CardTitle>Estado de la Flota</CardTitle>
                     <CardDescription>Distribución de equipos por estado operativo</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                     <EquiposPorEstadoChart data={summary.equipos_por_estado} />
                  </CardContent>
               </Card>

               <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                     <CardHeader>
                        <CardTitle className="text-base">Mantenimiento Próximo</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <ProximosMantenimientosList mantenimientos={proximosMantenimientos} />
                     </CardContent>
                  </Card>
                  <Card>
                     <CardHeader>
                        <CardTitle className="text-base">Reposición Urgente</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <ItemsBajoStockList items={itemsBajoStock} />
                     </CardContent>
                  </Card>
               </div>
            </div>

            {/* Columna Derecha (Feed de Actividad) - Span 3 */}
            <div className="lg:col-span-3 space-y-6">
               <Card className="h-full">
                  <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                           <Activity className="h-5 w-5 text-primary" />
                           Actividad Reciente
                        </CardTitle>
                     </div>
                     <CardDescription>Últimos movimientos registrados en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <RecentActivityList logs={recentActivity} />
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}
