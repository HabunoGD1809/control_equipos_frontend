import { cookies } from 'next/headers';
import { HardDrive, Wrench, Bell, PackageX } from "lucide-react";
import { StatCard } from "@/components/features/dashboard/StatCard";
import { EquiposPorEstadoChart } from "@/components/features/dashboard/EquiposPorEstadoChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DashboardData, Mantenimiento, InventarioStock } from '@/types/api';
import { ProximosMantenimientosList } from '@/components/features/dashboard/ProximosMantenimientosList';
import { ItemsBajoStockList } from '@/components/features/dashboard/ItemsBajoStockList';

async function getDashboardPageData() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('access_token')?.value;

   if (!accessToken) {
      return null;
   }

   const headers = { 'Authorization': `Bearer ${accessToken}` };
   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

   try {
      const [
         dashboardRes,
         mantenimientosRes,
         bajoStockRes
      ] = await Promise.all([
         fetch(`${baseUrl}/dashboard/`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/mantenimientos/?estado=Programado&limit=5`, { headers, cache: 'no-store' }),
         fetch(`${baseUrl}/inventario/stock/?bajo_stock=true&limit=5`, { headers, cache: 'no-store' })
      ]);

      if (!dashboardRes.ok) {
         console.error(`API Error (Dashboard): ${dashboardRes.status} ${dashboardRes.statusText}`);
         return null;
      }

      return {
         summary: await dashboardRes.json() as DashboardData,
         proximosMantenimientos: mantenimientosRes.ok ? await mantenimientosRes.json() as Mantenimiento[] : [],
         itemsBajoStock: bajoStockRes.ok ? await bajoStockRes.json() as InventarioStock[] : [],
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
         <div className="flex h-full items-center justify-center">
            <p className="text-destructive">No se pudieron cargar los datos del dashboard.</p>
         </div>
      );
   }

   const { summary, proximosMantenimientos, itemsBajoStock } = data;

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
               Un resumen general del estado de tus activos y operaciones.
            </p>
         </div>

         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
               title="Total de Equipos"
               value={summary.total_equipos}
               icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
               description="Activos totales registrados"
            />
            <StatCard
               title="Mantenimientos Próximos"
               value={summary.mantenimientos_proximos_count}
               icon={<Wrench className="h-5 w-5 text-muted-foreground" />}
               description="En los próximos 30 días"
            />
            <StatCard
               title="Licencias por Expirar"
               value={summary.licencias_por_expirar_count}
               icon={<Bell className="h-5 w-5 text-muted-foreground" />}
               description="En los próximos 30 días"
            />
            <StatCard
               title="Items con Bajo Stock"
               value={summary.items_bajo_stock_count}
               icon={<PackageX className="h-5 w-5 text-muted-foreground" />}
               description="Por debajo del mínimo establecido"
            />
         </div>

         <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
               <EquiposPorEstadoChart data={summary.equipos_por_estado} />
            </div>
            <div className="lg:col-span-2 space-y-6">
               <Card>
                  <CardHeader>
                     <CardTitle>Próximos Mantenimientos</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ProximosMantenimientosList mantenimientos={proximosMantenimientos} />
                  </CardContent>
               </Card>
               <Card>
                  <CardHeader>
                     <CardTitle>Items con Bajo Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ItemsBajoStockList items={itemsBajoStock} />
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}
