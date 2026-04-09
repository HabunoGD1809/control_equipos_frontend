import { cookies } from 'next/headers';
import { ShieldCheck, Calendar, Activity, Building2, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { ChangePasswordForm } from '@/components/features/usuarios/ChangePasswordForm';
import { UpdateProfileForm } from '@/components/features/usuarios/UpdateProfileForm';
import { Usuario } from '@/types/api';

async function getCurrentUser(): Promise<Usuario | null> {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return null;

   try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/me`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!response.ok) return null;
      return response.json();
   } catch (error) {
      console.error("[GET_CURRENT_USER_ERROR]", error);
      return null;
   }
}

export default async function PerfilPage() {
   const user = await getCurrentUser();

   if (!user) {
      return (
         <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
               <ShieldCheck className="h-8 w-8 text-muted-foreground opacity-60" />
            </div>
            <div className="text-center space-y-1">
               <h2 className="text-xl font-bold tracking-tight text-foreground">Sesión no encontrada</h2>
               <p className="text-sm text-muted-foreground max-w-xs">No pudimos verificar tu identidad. Inicia sesión nuevamente.</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-4 px-2 sm:px-4">

         <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
               Administra la configuración de tu cuenta y preferencias del sistema.
            </p>
         </div>

         <Separator />

         {/* 1. SECCIÓN: Información del Sistema */}
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 space-y-1">
               <h3 className="text-lg font-semibold text-foreground">Información del Sistema</h3>
               <p className="text-sm text-muted-foreground pr-4">
                  Detalles internos de tu cuenta. Si necesitas modificar tu nivel de acceso, contacta a un administrador.
               </p>
            </div>
            <div className="md:col-span-8">
               <Card className="shadow-sm border-border/50 bg-muted/10">
                  <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <span className="text-sm font-medium flex items-center text-muted-foreground">
                           <UserCircle className="h-4 w-4 mr-2" /> Rol de Acceso
                        </span>
                        <Badge variant="secondary" className="capitalize text-sm font-normal">
                           {user.rol?.nombre || 'Estándar'}
                        </Badge>
                     </div>

                     <div className="space-y-1">
                        <span className="text-sm font-medium flex items-center text-muted-foreground">
                           <Building2 className="h-4 w-4 mr-2" /> Departamento
                        </span>
                        <span className="text-foreground text-sm font-medium">
                           {user.departamento_rel?.nombre || 'No asignado'}
                        </span>
                     </div>

                     <div className="space-y-1">
                        <span className="text-sm font-medium flex items-center text-muted-foreground">
                           <Calendar className="h-4 w-4 mr-2" /> Miembro desde
                        </span>
                        <span className="text-foreground text-sm font-medium">
                           {format(new Date(user.created_at), "dd MMMM, yyyy", { locale: es })}
                        </span>
                     </div>

                     <div className="space-y-1">
                        <span className="text-sm font-medium flex items-center text-muted-foreground">
                           <Activity className="h-4 w-4 mr-2" /> Último acceso
                        </span>
                        <span className="text-foreground text-sm font-medium">
                           {user.ultimo_login ? format(new Date(user.ultimo_login), "dd/MM/yyyy HH:mm", { locale: es }) : 'Sesión actual'}
                        </span>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>

         <Separator />

         {/* 2. Sección: Perfil Público */}
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 space-y-1">
               <h3 className="text-lg font-semibold text-foreground">Perfil Público</h3>
               <p className="text-sm text-muted-foreground pr-4">
                  Esta información será visible para otros usuarios del sistema en los registros de auditoría y movimientos.
               </p>
            </div>
            <div className="md:col-span-8">
               <Card className="shadow-sm border-border/50">
                  <CardContent className="p-6">
                     <UpdateProfileForm currentUser={user} />
                  </CardContent>
               </Card>
            </div>
         </div>

         <Separator />

         {/* 3. Sección: Seguridad */}
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 space-y-1">
               <h3 className="text-lg font-semibold text-foreground">Seguridad</h3>
               <p className="text-sm text-muted-foreground pr-4">
                  Actualiza tu contraseña asociada a la cuenta. Usa una clave robusta que no uses en otros sitios.
               </p>
            </div>
            <div className="md:col-span-8">
               <Card className="shadow-sm border-destructive/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-destructive/50"></div>
                  <CardContent className="p-6 pl-8">
                     <ChangePasswordForm />
                  </CardContent>
               </Card>
            </div>
         </div>

      </div>
   );
}
