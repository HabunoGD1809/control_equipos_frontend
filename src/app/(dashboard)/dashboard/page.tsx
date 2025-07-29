import { cookies } from 'next/headers';
import { HardDrive, Wrench, Bell, PackageX } from "lucide-react";
import { StatCard } from "@/components/features/dashboard/StatCard";
import { EquiposPorEstadoChart } from "@/components/features/dashboard/EquiposPorEstadoChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

async function getDashboardData() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('access_token')?.value;

   if (!accessToken) {
      return null;
   }

   try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });

      if (!response.ok) {
         console.error(`API Error: ${response.status} ${response.statusText}`);
         return null;
      }

      return await response.json();
   } catch (error) {
      console.error("[GET_DASHBOARD_DATA_ERROR]", error);
      return null;
   }
}

export default async function DashboardPage() {
   const data = await getDashboardData();

   if (!data) {
      return (
         <div className="flex h-full items-center justify-center">
            <p className="text-destructive">No se pudieron cargar los datos del dashboard.</p>
         </div>
      );
   }

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
               value={data.total_equipos}
               icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
               description="Activos totales registrados"
            />
            <StatCard
               title="Mantenimientos Próximos"
               value={data.mantenimientos_proximos_count}
               icon={<Wrench className="h-5 w-5 text-muted-foreground" />}
               description="En los próximos 30 días"
            />
            <StatCard
               title="Licencias por Expirar"
               value={data.licencias_por_expirar_count}
               icon={<Bell className="h-5 w-5 text-muted-foreground" />}
               description="En los próximos 30 días"
            />
            <StatCard
               title="Items con Bajo Stock"
               value={data.items_bajo_stock_count}
               icon={<PackageX className="h-5 w-5 text-muted-foreground" />}
               description="Por debajo del mínimo establecido"
            />
         </div>

         <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
               <EquiposPorEstadoChart data={data.equipos_por_estado} />
            </div>
            <div className="lg:col-span-2 space-y-6">
               <Card>
                  <CardHeader>
                     <CardTitle>Próximos Mantenimientos</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground">Listado de mantenimientos futuros.</p>
                  </CardContent>
               </Card>
               <Card>
                  <CardHeader>
                     <CardTitle>Items con Bajo Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground">Listado de items que requieren reposición.</p>
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}
